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
visit() { xcrun simctl openurl "$udid" "http://127.0.0.1:5743/$1"; }
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

# Darwin's Unix socket path is short. Keep the listener in the foreground under this shell.
socket_dir=$(mktemp -d /private/tmp/cs-xb.XXXXXX)
socket="$socket_dir/ui.sock"
xcodebuildmcp --version >> "$evidence/xcode.txt"
xcodebuildmcp --socket "$socket" daemon start --foreground --daemon-log-path "$evidence/daemon.log" --daemon-log-level debug > "$evidence/daemon-console.log" 2>&1 &
daemon_pid=$!
daemon_ready=false
deadline=$((SECONDS + 45))
while (( SECONDS < deadline )); do
  if [[ -S "$socket" ]] && xcodebuildmcp --socket "$socket" daemon status > "$evidence/daemon-status.txt" 2>&1 && grep -Eiq 'status: *running' "$evidence/daemon-status.txt"; then
    daemon_ready=true
    break
  fi
  if ! kill -0 "$daemon_pid" 2>/dev/null; then break; fi
  sleep 1
done
if ! "$daemon_ready"; then log "XcodeBuildMCP daemon unavailable; see daemon-console.log, daemon.log, and daemon-status.txt."; fi
axe=$(command -v axe || true)
if [[ -z "$axe" ]]; then
  prefix=$(brew --prefix xcodebuildmcp)
  axe=$(find -H "$prefix" -type f -iname axe -print | head -1)
fi
if [[ ! -x "$axe" ]]; then
  if brew install cameroncooke/axe/axe > "$evidence/axe-install.log" 2>&1; then axe=$(command -v axe); else log "AXe fallback unavailable."; fi
fi
# Match the framework search path XcodeBuildMCP passes to its bundled AXe.
run_axe() {
  local frameworks
  frameworks="$(dirname "$axe")/Frameworks"
  if [[ -d "$frameworks" ]]; then
    DYLD_FRAMEWORK_PATH="$frameworks${DYLD_FRAMEWORK_PATH:+:$DYLD_FRAMEWORK_PATH}" "$axe" "$@"
  else
    "$axe" "$@"
  fi
}
ui() {
  local action=$1 destination=$2
  shift 2
  if ! "$daemon_ready"; then return 1; fi
  if xcodebuildmcp --socket "$socket" ui-automation "$action" "$@" --simulator-id "$udid" --output json > "$destination" 2>>"$evidence/ui-stderr.log" &&
     jq -e 'type == "object" and .didError != true and .error == null' "$destination" >/dev/null; then
    return 0
  fi
  log "XcodeBuildMCP $action failed; see $(basename "$destination") and ui-stderr.log."
  return 1
}
snapshot() {
  local label=$1
  if ui snapshot-ui "$evidence/$label-ax.json" --verbose; then return 0; fi
  if [[ -x "$axe" ]] && run_axe describe-ui --udid "$udid" > "$evidence/$label-raw-ax.json" 2>>"$evidence/ui-stderr.log"; then return 0; fi
  log "Accessibility snapshot unavailable at $label."
  return 1
}
shot() {
  local label=$1
  native_shot "$label"
  ui screenshot "$evidence/$label-image.json" --return-format path || true
  snapshot "$label" || true
}
gesture() {
  local preset=$1 label=$2
  if ! ui gesture "$evidence/$label-gesture.json" --preset "$preset" --duration 0.42; then
    if [[ -x "$axe" ]] && run_axe gesture "$preset" --duration 0.42 --udid "$udid" > "$evidence/$label-raw-gesture.txt" 2>>"$evidence/ui-stderr.log"; then
      log "Sent $preset using AXe at $label."
    else
      native_shot "$label-failed"
      log "Could not send $preset to Simulator."
      return 1
    fi
  fi
  sleep 2
  shot "$label"
}
for attempt in {1..5}; do
  stage="startup-$attempt"
  native_shot "$stage"
  if ! snapshot "$stage"; then break; fi
  tree="$evidence/$stage-ax.json"
  if [[ -s "$evidence/$stage-raw-ax.json" ]]; then tree="$evidence/$stage-raw-ax.json"; fi
  # A fresh browser can show the welcome sheet over a page already sending telemetry.
  match=$(jq -c '[.. | objects | select(((.role // .type // "") | ascii_downcase | endswith("button"))) |
      {label:(.label // .AXLabel // ""),ref:(.ref // "")} | select(.label | test("^(Continue|Start (Using Safari|Browsing)|Get Started|Not Now|No Thanks|Agree|Use Safari|Continue to Safari|Turn On Privacy Protection)$";"i"))][0] // empty' "$tree")
  if [[ -z "$match" ]]; then break; fi
  ref=$(jq -r '.ref' <<< "$match")
  label=$(jq -r '.label' <<< "$match")
  if [[ -n "$ref" ]] && ui tap "$evidence/$stage-tap.json" --element-ref "$ref"; then :
  elif [[ -x "$axe" ]] && run_axe tap --label "$label" --udid "$udid" > "$evidence/$stage-raw-tap.txt" 2>>"$evidence/ui-stderr.log"; then :
  else log "Could not dismiss Safari's $label button."; break
  fi
  sleep 2
done
visit ""
wait_for_page "" || log "No home-page telemetry after onboarding."
shot initial
visit "#try-controls"
wait_for_page "#try-controls" || { native_shot anchored-without-telemetry; log "Safari did not load the anchor."; exit 1; }
sleep 2
shot anchored
gesture scroll-down scroll-down-1
gesture scroll-down scroll-down-2
gesture scroll-up scroll-up-1
gesture scroll-up scroll-up-2
gesture scroll-down scroll-down-3
python3 - "$evidence" <<'PY'
import json, pathlib, sys
folder = pathlib.Path(sys.argv[1])
paths = [folder / (name+"-layout.json") for name in ("anchored", "scroll-down-1", "scroll-down-2", "scroll-up-1", "scroll-up-2", "scroll-down-3")]
rows = [json.loads(path.read_text()) for path in paths]
offsets = [r["scrollY"] + (r.get("innerScroll") or 0) for r in rows]
print("Scroll offsets at captured gestures:", offsets)
print("Visual viewport heights:", [r["viewport"][1] for r in rows])
if max(offsets)-min(offsets) < 50:
    sys.exit("Safari gestures did not measurably move the anchored page.")
PY
