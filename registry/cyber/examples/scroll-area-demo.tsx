import { ScrollArea } from "@/registry/cyber/ui/scroll-area"

const lines = [
  ["21:04", "Relay handshake."],
  ["21:05", "Link stable."],
  ["21:07", "Ghostwrite loaded."],
  ["21:09", "Route cleared."],
  ["21:12", "Trace from 3F:A2."],
  ["21:13", "Null Ping answered."],
  ["21:14", "Trace dropped."],
  ["21:20", "Mirror to bench: on."],
  ["21:26", "Packet loss 2%."],
  ["21:31", "Deadlock queued."],
  ["21:38", "No signal, Stacks."],
  ["21:40", "Standing by."],
]

export default function ScrollAreaDemo() {
  return (
    <div style={{ display: "grid", gap: 6, width: "100%", maxWidth: 280 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span data-kit="label">Deck uplink</span>
        <span data-kit="value">{lines.length} lines</span>
      </div>
      <div data-frame="br" style={{ padding: 8 }}>
        <ScrollArea label="Signal log" height={160}>
          {lines.map(([time, text]) => (
            <p key={time} style={{ display: "flex", alignItems: "baseline", gap: 10, paddingBlock: 3, color: "var(--cy-ink-hi)" }}>
              <span data-kit="value">{time}</span>
              <span>{text}</span>
            </p>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}
