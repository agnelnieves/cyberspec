import { useRef, useState } from "react"
import { BellRing, ClipboardList, RadioTower } from "lucide-react"
import { Badge } from "@/registry/cyber/ui/badge"
import { CommandPalette } from "@/registry/cyber/ui/command-palette"
import { Terminal, type TerminalLine } from "@/registry/cyber/ui/terminal"
import "./recipe-layout.css"

const channels = ["Glasswater", "Lowtide", "Cinder Row"]

export default function CommandLauncher() {
  const [channelIndex, setChannelIndex] = useState(0)
  const [muted, setMuted] = useState(false)
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: "boot", kind: "sys", text: "Night desk connected to Glasswater." },
  ])
  const sequence = useRef(0)
  const channel = channels[channelIndex]

  function run(command: string) {
    let text: string
    if (command === "tune") {
      const next = (channelIndex + 1) % channels.length
      setChannelIndex(next)
      text = `Tuned to ${channels[next]}.`
    } else if (command === "alerts") {
      setMuted(!muted)
      text = muted ? "Desk alerts enabled." : "Desk alerts muted."
    } else {
      text = `${channel} relay online. Desk alerts ${muted ? "muted" : "enabled"}.`
    }
    const line: TerminalLine = { id: String(++sequence.current), kind: "ok", text }
    setLines(previous => [...previous.slice(-11), line])
  }

  return (
    <div className="sink-stack">
      <div className="sink-row">
        <Badge tone="signal" status>{channel}</Badge>
        <Badge tone={muted ? "mute" : "ok"}>Alerts {muted ? "off" : "on"}</Badge>
      </div>
      <Terminal label="Night desk log" lines={lines} height={138} />
      <CommandPalette trigger="Open desk commands" title="Night desk commands" placeholder="Find a desk command"
        empty="No matching desk commands." shortcut={null} rankResults onAction={run} commands={[
          { value: "tune", label: "Tune to next relay", keywords: ["channel", "station"], icon: <RadioTower aria-hidden /> },
          { value: "alerts", label: muted ? "Enable desk alerts" : "Mute desk alerts", icon: <BellRing aria-hidden /> },
          { value: "status", label: "Print relay status", keywords: ["summary"], icon: <ClipboardList aria-hidden /> },
        ]} />
    </div>
  )
}
