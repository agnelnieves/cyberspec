import * as React from "react"
import { Button } from "@/registry/cyber/ui/button"
import { Readout } from "@/registry/cyber/ui/readout"

// Each burst lands somewhere new around the carbine's rated output.
const bursts = [412.8, 447.1, 398.6, 431.9, 466.3, 405.2]

export default function ReadoutDemo() {
  const [shot, setShot] = React.useState(0)
  const output = bursts[shot % bursts.length]
  const before = shot ? bursts[(shot - 1) % bursts.length] : null

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px", width: "100%", maxWidth: 280, justifyItems: "start" }}>
      <Readout
        label="Output"
        value={output}
        unit="dps"
        precision={1}
        delta={before == null ? undefined : output - before}
        style={{ gridColumn: "1 / -1", justifySelf: "stretch" }}
      />
      <Readout label="Barrel heat" value={Math.min(98, 31 + shot * 9)} unit="%" size="sm" tone="flag" />
      <Readout label="Rounds" value={Math.max(0, 680 - shot * 24)} size="sm" tone="accent" />
      <Button size="sm" onClick={() => setShot(shot + 1)} style={{ gridColumn: "1 / -1" }}>
        Fire burst
      </Button>
    </div>
  )
}
