import * as React from "react"
import { Terminal, type TerminalLine } from "@/registry/cyber/ui/terminal"

// Where the scripted part of the session ends, in seconds on its clock.
const scriptedUntil = 21

const session: TerminalLine[] = [
  { id: "boot", kind: "sys", time: "00:00", text: "Deck online. Vanta Mk.II, link stable." },
  { id: "run", kind: "user", time: "00:04", text: "run ghostwrite --target annex-4" },
  { id: "load", kind: "agent", time: "00:05", text: "Ghostwrite loaded. Rewriting the badge log for the service lift." },
  { id: "pass-1", kind: "agent", time: "00:09", text: "  pass 1 of 2: 214 entries" },
  { id: "pass-2", kind: "agent", time: "00:13", text: "  pass 2 of 2: checksums match" },
  { id: "done", kind: "ok", time: "00:14", text: "Badge log accepted. Lift unlocked." },
  { id: "trace", kind: "warn", time: "00:17", text: "Trace on node 3F:A2. Rerouting through Cinder Row." },
  { id: "refused", kind: "err", time: "00:20", text: "Null Ping refused: no route to relay 7." },
  { id: "hold", kind: "sys", time: "00:21", text: "Holding. Type help for commands." },
]

const help = ["Commands:", "  status   link and daemon state", "  ping     knock on relay 7", "  clear    wipe the log"].join("\n")

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

export default function TerminalDemo() {
  const [lines, setLines] = React.useState(session)
  const [busy, setBusy] = React.useState(false)
  const started = React.useRef(0)
  const count = React.useRef(0)
  const timer = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    started.current = Date.now()
    return () => window.clearTimeout(timer.current)
  }, [])

  // The session's clock carries on from where the script left it.
  const line = (kind: TerminalLine["kind"], text: string): TerminalLine => ({
    id: `line-${(count.current += 1)}`,
    kind,
    text,
    time: clock(scriptedUntil + Math.round((Date.now() - started.current) / 1000)),
  })
  const print = (...added: TerminalLine[]) => setLines((current) => [...current, ...added])

  const run = (text: string) => {
    const command = text.toLowerCase()
    if (command === "clear") {
      setLines([line("sys", "Log wiped.")])
      return
    }
    const echo = line("user", text)
    if (command === "help") print(echo, line("sys", help))
    else if (command === "status") print(echo, line("sys", "Link stable. 2 daemons idle, 1 held."))
    else if (command === "ping") {
      print(echo, line("sys", "Knocking on relay 7."))
      setBusy(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        setBusy(false)
        print(line("agent", "Relay 7 answered in 41 ms. Route cleared."))
      }, 1400)
    } else print(echo, line("sys", `No handler for "${text}". Type help.`))
  }

  return (
    <>
      <Terminal label="Deck console" lines={lines} busy={busy} onCommand={run} placeholder="Type help" height={304} />
    </>
  )
}
