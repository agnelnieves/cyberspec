import "./recipe-layout.css"
import { useState } from "react"
import { Readout } from "@/registry/cyber/ui/readout"
import { Slider } from "@/registry/cyber/ui/slider"

const duration = 60
const samples = Array.from({ length: duration }, (_, i) => 12 + 88 * Math.abs(Math.sin(i * 0.43) * Math.cos(i * 0.19)))

export default function ClipTimeline() {
  const [range, setRange] = useState([8, 42])
  const [start, end] = range

  return (
    <div className="sink-stack">
      <div className="sink-between"><strong>Night train.wav</strong><span className="sink-label">1:00</span></div>
      <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 1, height: 64, paddingBlock: 6, backgroundColor: "var(--cy-panel)", borderBlock: "1px solid var(--cy-line-deco)" }}>
        {samples.map((height, i) => <span key={i} style={{ flex: "1 1 0", height: `${height}%`, backgroundColor: i >= start && i < end ? "var(--cy-signal)" : "var(--cy-line-ctl)" }} />)}
      </div>
      <Slider label="Trim points" thumbLabels={["Clip start", "Clip end"]} value={range} onValueChange={setRange} min={0} max={duration} ticks={12} format={(value) => `${value}s`} />
      <Readout label="Selected duration" value={end - start} unit="s" size="sm" />
    </div>
  )
}
