#!/bin/bash
set -euo pipefail

tools_dir=$(cd "$(dirname "$0")" && pwd)
evidence="${RUNNER_TEMP:-/tmp}/safari-evidence"
mkdir -p "$evidence"
git rev-parse HEAD > "$evidence/commit.txt"
xcodebuild -version > "$evidence/xcode.txt"
xcodebuildmcp --version >> "$evidence/xcode.txt"
xcrun simctl list devices available -j > "$evidence/devices.json"
udid=$(python3 - "$evidence/devices.json" <<'PY'
import json,re,sys
phones=[]
for runtime, devices in json.load(open(sys.argv[1]))["devices"].items():
    version=re.search(r"\.iOS-27-0(?:-(\d+))?$",runtime)
    if version:
        for device in devices:
            name=device["name"]
            if device.get("isAvailable") and name.startswith("iPhone"):
                rank=(version[1]=="1",name=="iPhone 17",name)
                phones.append((rank,device["udid"]))
if not phones:
    sys.exit("No iPhone with an iOS 27.0.x runtime installed")
print(max(phones)[1])
PY
)
echo "$udid" | tee "$evidence/udid.txt"
xcrun simctl bootstatus "$udid" -b
xcrun simctl status_bar "$udid" override --time "10:12"
python3 "$tools_dir/serve.py" "$evidence" > "$evidence/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" || true' EXIT
for attempt in {1..30}; do
  if curl -fsS -o /dev/null http://127.0.0.1:5743/; then break; fi
  sleep 1
done
ui() { xcodebuildmcp ui-automation "$@" --simulator-id "$udid" --output json; }
shot() {
  local label=$1
  ui screenshot --return-format path > "$evidence/$label-image.json"
  xcrun simctl io "$udid" screenshot "$evidence/$label.png"
  ui snapshot-ui --verbose > "$evidence/$label-ax.json"
  if [[ -s "$evidence/metrics.jsonl" ]]; then tail -1 "$evidence/metrics.jsonl" > "$evidence/$label-layout.json"; fi
}
visit() { xcrun simctl openurl "$udid" "http://127.0.0.1:5743/$1"; }
gesture() {
  local preset=$1 label=$2
  ui gesture --preset "$preset" --duration 0.42 > "$evidence/$label-gesture.json"
  sleep 2
  shot "$label"
}
visit ""
sleep 5
for attempt in {1..5}; do
  ui snapshot-ui --verbose > "$evidence/startup-$attempt.json"
  # Fresh runtimes sometimes present Apple's onboarding before exposing the URL.
  welcome=$(jq -r '[..|objects|select(.role? == "button" and (.label? | type) == "string") | select(.label|test("^(Continue|Start Using Safari|Get Started|Not Now|Agree|Done|Use Safari)$";"i")) | .ref // empty][0] // empty' "$evidence/startup-$attempt.json")
  if [[ -n "$welcome" ]]; then
    ui tap --element-ref "$welcome" > "$evidence/onboarding-$attempt.json"
    sleep 2
    visit ""
  elif [[ -s "$evidence/metrics.jsonl" ]]; then break
  else sleep 3
  fi
done
shot initial
if [[ ! -s "$evidence/metrics.jsonl" ]]; then echo "Safari never rendered the site"; exit 1; fi
visit "#try-controls"
sleep 3
shot anchored
gesture scroll-down scroll-down-1
gesture scroll-down scroll-down-2
gesture scroll-up scroll-up-1
gesture scroll-up scroll-up-2
gesture scroll-down scroll-down-3
python3 - "$evidence/metrics.jsonl" <<'PY'
import json,sys
rows=[json.loads(line) for line in open(sys.argv[1])]
offsets=[r["scrollY"]+(r.get("innerScroll") or 0) for r in rows if r.get("hash")=="#try-controls"]
if not offsets or max(offsets)-min(offsets)<50:
    sys.exit("Safari gestures did not measurably move the page after anchor navigation")
print("Observed scroll range", min(offsets), max(offsets))
print("Observed visual viewport heights", sorted({r["viewport"][1] for r in rows if r["viewport"]}))
PY
