import { useState } from "react"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Readout } from "@/registry/cyber/ui/readout"
import { Slider } from "@/registry/cyber/ui/slider"
import "./recipe-layout.css"

const circuits = ["Lighting", "Cooling", "Relay"]
const defaults = [24, 18, 12]
const budget = 72

export default function PowerMixer() {
  const [levels, setLevels] = useState(defaults)
  const total = levels.reduce((sum, value) => sum + value, 0)
  const reserve = budget - total
  return (
    <div className="sink-stack">
      <div className="sink-between">
        <Readout label="Power draw" value={total} unit="kW" tone={reserve < 0 ? "flag" : "signal"} />
        <Badge tone={reserve < 0 ? "flag" : "ok"}>{reserve < 0 ? `${-reserve} kW over` : `${reserve} kW free`}</Badge>
      </div>
      <div aria-hidden="true" style={{ display: "flex", gap: 2, height: 14, background: "var(--cy-panel-2)" }}>
        {levels.map((level, index) => <span key={circuits[index]} style={{
          width: `${100 * level / Math.max(total, budget)}%`,
          background: ["var(--cy-signal)", "var(--cy-accent)", "var(--cy-flag)"][index],
        }} />)}
      </div>
      {circuits.map((label, index) => (
        <Slider key={label} label={label} min={0} max={36} step={1} ticks={6} value={levels[index]}
          format={value => `${value} kW`}
          onValueChange={value => setLevels(current => current.map((level, i) => i === index ? value : level))} />
      ))}
      <div className="sink-between">
        <span className="sink-note">Generator capacity · {budget} kW</span>
        <Button size="sm" onClick={() => setLevels(defaults)} disabled={levels.every((level, i) => level === defaults[i])}>Reset mix</Button>
      </div>
    </div>
  )
}
