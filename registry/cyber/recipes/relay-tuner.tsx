import { useId, useState } from "react"
import { RadioTower, ScanLine } from "lucide-react"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Readout } from "@/registry/cyber/ui/readout"
import { Slider } from "@/registry/cyber/ui/slider"
import "./recipe-layout.css"

const stations = [
  { frequency: 91.3, name: "Lowtide FM", gain: 0.72 },
  { frequency: 98.7, name: "Night Relay", gain: 1 },
  { frequency: 105.1, name: "Glass Radio", gain: 0.85 },
]
const band = { low: 88, high: 108 }
const xAt = (frequency: number) => (frequency - band.low) * 20

// Draw a fixed spectrum so tuning the receiver moves its cursor across the carriers.
const spectrum = Array.from({ length: 200 }, (_, bin) => {
  const frequency = band.low + bin / 10
  const peaks = stations.map(station => station.gain * Math.exp(-((frequency - station.frequency) ** 2) / 0.58))
  const noise = Math.abs(Math.sin(bin * 4.25) * Math.cos(bin * 0.61))
  return 4 + noise * 11 + Math.max(...peaks) * (43 + noise * 35)
})

export default function RelayTuner() {
  const [frequency, setFrequency] = useState(98.7)
  const gridId = useId()
  const station = stations.find(station => Math.abs(frequency - station.frequency) < 0.16)
  const cursor = xAt(frequency)
  function seek() {
    const next = stations.find(station => station.frequency > frequency + 0.05) ?? stations[0]
    setFrequency(next.frequency)
  }

  return (
    <div className="sink-stack">
      <div className="sink-between">
        <Readout label="FM receiver" value={frequency} precision={1} unit="MHz" size="lg" />
        <Badge status tone={station ? "signal" : "mute"}>{station ? "Locked" : "Scanning"}</Badge>
      </div>
      <div style={{ background: "var(--cy-void)", border: "1px solid var(--cy-line-deco)", padding: "10px 12px 6px" }}>
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", width: "100%", height: 94 }}>
          <defs><pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 20V0H20" fill="none" stroke="var(--cy-line-deco)" strokeWidth="0.7" />
          </pattern></defs>
          <rect width="400" height="100" fill={`url(#${gridId})`} />
          {spectrum.map((height, index) => {
            const tuned = Math.abs(index * 2 - cursor) < 14
            return <rect key={index} x={index * 2} y={99 - height} width="1.7" height={height}
              fill={tuned ? "var(--cy-signal)" : "var(--cy-accent)"} opacity={tuned ? 1 : 0.75} />
          })}
          <path d={`M${cursor} 3V99m-4-96 4 5 4-5`} fill="none" stroke="var(--cy-ink-hi)" strokeWidth="1.4" />
        </svg>
        <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", font: "12px var(--cy-mono)", color: "var(--cy-ink-mute)" }}>
          {[88, 93, 98, 103, 108].map(mark => <span key={mark}>{mark}</span>)}
        </div>
      </div>
      <Slider label="Tuning" value={frequency} min={band.low} max={band.high} step={0.1} ticks={20}
        format={value => `${value.toFixed(1)} MHz`} onValueChange={setFrequency} />
      <div className="sink-between">
        <span className="sink-row" role="status"><RadioTower size={16} aria-hidden />{station?.name ?? "Interstation noise"}</span>
        <Button size="sm" onClick={seek}><ScanLine aria-hidden />Seek next</Button>
      </div>
    </div>
  )
}
