#!/bin/bash
set -euo pipefail

tools_dir=$(cd "$(dirname "$0")" && pwd)
evidence="${RUNNER_TEMP:-/tmp}/safari-evidence"
mkdir -p "$evidence"
git rev-parse HEAD > "$evidence/commit.txt"
xcodebuild -version > "$evidence/xcode.txt"
xcrun simctl list devices available -j > "$evidence/devices.json"
udid=$(python3 - "$evidence/devices.json" "${IOS_FAMILY:-26}" <<'PY'
import json, re, sys
family = sys.argv[2]
minor = {"26": "5", "27": "0"}[family]
phones = []
for runtime, devices in json.load(open(sys.argv[1]))["devices"].items():
    version = re.search(rf"\.iOS-{family}-{minor}(?:-(\d+))?$", runtime)
    if version:
        for device in devices:
            name = device["name"]
            if device.get("isAvailable") and name in ("iPhone 17", "iPhone 17 Pro"):
                patch = int(version[1] or 0)
                phones.append(((family == "27" and patch == 1, name == "iPhone 17", patch), device["udid"]))
if not phones:
    sys.exit(f"No iPhone 17 or 17 Pro with iOS {family}.{minor}.x installed")
print(max(phones)[1])
PY
)
echo "$udid" | tee "$evidence/udid.txt"
xcrun simctl bootstatus "$udid" -b
xcrun simctl status_bar "$udid" override --time "10:12"
python3 "$tools_dir/serve.py" "$evidence" > "$evidence/server.log" 2>&1 &
server_pid=$!
daemon_pid=""
cleanup() {
  if [[ -n "$daemon_pid" ]]; then kill "$daemon_pid" 2>/dev/null || true; fi
  kill "$server_pid" 2>/dev/null || true
  if [[ -s "$evidence/diagnostics.log" ]]; then cat "$evidence/diagnostics.log"; fi
}
trap cleanup EXIT
log() { echo "$*" | tee -a "$evidence/diagnostics.log" >&2; }
visit() {
  for attempt in {1..5}; do
    if xcrun simctl openurl "$udid" "http://127.0.0.1:5743/$1"; then return 0; fi
    log "Safari launch timed out on attempt $attempt; retrying."
    xcrun simctl launch "$udid" com.apple.mobilesafari || true
    sleep 3
  done
  return 1
}
wait_for_page() {
  local anchor=$1
  for attempt in {1..12}; do
    if [[ -s "$evidence/metrics.jsonl" ]] && tail -1 "$evidence/metrics.jsonl" | jq -e --arg anchor "$anchor" '.hash == $anchor' >/dev/null; then return 0; fi
    sleep 1
  done
  return 1
}
native_shot() {
  xcrun simctl io "$udid" screenshot "$evidence/$1.png"
  if [[ -s "$evidence/metrics.jsonl" ]]; then tail -1 "$evidence/metrics.jsonl" > "$evidence/$1-layout.json"; fi
}
for attempt in {1..30}; do
  if curl -fsS -o /dev/null http://127.0.0.1:5743/; then break; fi
  sleep 1
done
visit ""
wait_for_page "" || log "Initial page telemetry has not arrived."
native_shot initial-before-ui
visit "#try-controls"
wait_for_page "#try-controls" || log "Anchor telemetry has not arrived."
sleep 2
native_shot anchored-before-ui


# The plugin invokes these tools through the MCP server's stdio transport.
python3 "$tools_dir/mcp-stdio.py" "$udid" "$evidence/mcp" --timeout 80
sleep 1
native_shot after-mcp
python3 - "$evidence" <<'CHECK'
import json,pathlib,sys
d=pathlib.Path(sys.argv[1])
before=json.loads((d/'anchored-before-ui-layout.json').read_text())
after=json.loads((d/'after-mcp-layout.json').read_text())
print('Native document swipe:',before['scrollY'],after['scrollY'])
assert abs(after['scrollY'] - before['scrollY']) > 25
CHECK
