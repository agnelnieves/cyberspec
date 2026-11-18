#!/usr/bin/env python3
"""Capture Mobile Safari on an already booted Simulator via XcodeBuildMCP 2.7.0 stdio."""
import argparse
import json
import os
import queue
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("udid")
parser.add_argument("output", type=Path)
parser.add_argument("--timeout", type=int, default=35, help="seconds per MCP request")
parser.add_argument("--preset", default="scroll-down", choices=("scroll-up", "scroll-down"))
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)

def save(label, value):
    (args.output / (label + ".json")).write_text(json.dumps(value, indent=2) + "\n")

def log(message):
    line = f"{time.strftime('%H:%M:%S')} {message}"
    print(line, flush=True)
    with (args.output / "steps.log").open("a") as stream:
        print(line, file=stream)

def shot(label):
    with (args.output / "simctl.log").open("a") as stream:
        try:
            subprocess.run(["xcrun", "simctl", "io", args.udid, "screenshot",
                            str(args.output / (label + ".png"))], stdout=stream, stderr=stream,
                           timeout=8, check=True)
        except (OSError, subprocess.SubprocessError) as exc:
            log(f"{label} native screenshot: {exc}")

def run(client):
    responses = queue.Queue()
    def reader():
        try:
            for line in client.stdout:
                responses.put(line)
        finally:
            responses.put(None)
    threading.Thread(target=reader, daemon=True).start()
    next_id = 0

    def send(message):
        client.stdin.write((json.dumps(dict(jsonrpc="2.0", **message)) + "\n").encode())
        client.stdin.flush()

    def request(label, method, params):
        nonlocal next_id
        next_id += 1
        log(f"{label}: {method} (deadline {args.timeout}s)")
        send(dict(method=method, params=params, id=next_id))
        deadline = time.monotonic() + args.timeout
        while time.monotonic() < deadline:
            try:
                raw = responses.get(timeout=max(0, deadline - time.monotonic()))
            except queue.Empty:
                break
            if raw is None:
                raise RuntimeError("MCP stdout closed; inspect server.stderr.log")
            try:
                message = json.loads(raw)
            except ValueError:
                with (args.output / "non-rpc.log").open("ab") as stream:
                    stream.write(raw)
                continue
            if "method" in message:
                if "id" in message and message["method"] == "ping":
                    send(dict(id=message["id"], result={}))
                continue
            if message.get("id") != next_id:
                continue
            save(label, message)
            if message.get("error"):
                raise RuntimeError(f"{label}: {message['error']}")
            result = message["result"]
            if result.get("isError") or result.get("structuredContent", {}).get("didError"):
                raise RuntimeError(f"{label}: XcodeBuildMCP returned an error; inspect {label}.json")
            for content in result.get("content", []):
                if content.get("type") != "text":
                    continue
                try:
                    decoded = json.loads(content["text"])
                except ValueError:
                    continue
                if isinstance(decoded, dict) and decoded.get("didError"):
                    raise RuntimeError(f"{label}: {decoded.get('error')}")
            return result
        raise TimeoutError(f"{label} exceeded {args.timeout}s")

    request("initialize", "initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                                         "clientInfo": {"name": "safari-simulator-verification", "version": "1"}})
    send(dict(method="notifications/initialized"))
    tools = {}
    cursor = None
    for page in range(1, 5):
        result = request(f"tools-{page}", "tools/list", {"cursor": cursor} if cursor else {})
        tools.update({item["name"]: item["inputSchema"] for item in result["tools"]})
        cursor = result.get("nextCursor")
        if not cursor:
            break
    def call(label, name, parameters):
        if name not in tools:
            raise RuntimeError(f"{name} unavailable; discovered {', '.join(sorted(tools))}")
        props = tools[name].get("properties", {})
        if "simulatorId" in props:
            parameters["simulatorId"] = args.udid
        return request(label, "tools/call", {"name": name,
                       "arguments": {k:v for k,v in parameters.items() if k in props}})

    if "session_set_defaults" in tools:
        call("session", "session_set_defaults", {"simulatorId": args.udid, "persist": False})
    shot("before")
    call("before-snapshot", "snapshot_ui", {"verbose": True})
    call("native-gesture", "gesture", {"preset": args.preset, "duration": 0.42})
    time.sleep(2.0)
    shot("after")
    call("after-snapshot", "snapshot_ui", {"verbose": True})
    log("Completed native Simulator gesture and both MCP captures.")

with (args.output / "server.stderr.log").open("wb") as stderr:
    child = subprocess.Popen(["xcodebuildmcp", "mcp"], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             stderr=stderr, start_new_session=True, env={
                                 **os.environ, "XCODEBUILDMCP_ENABLED_WORKFLOWS": "ui-automation,session-management",
                                 "XCODEBUILDMCP_SIMULATOR_ID": args.udid})
    try:
        run(child)
    except Exception as error:
        log(str(error))
        sys.exit(1)
    finally:
        if child.poll() is None:
            try:
                os.killpg(child.pid, signal.SIGTERM)
                child.wait(timeout=3)
            except subprocess.TimeoutExpired:
                os.killpg(child.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
