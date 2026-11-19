import { useState } from "react"
import { Button } from "@/registry/cyber/ui/button"
import { Readout } from "@/registry/cyber/ui/readout"
import { Stepper } from "@/registry/cyber/ui/stepper"
import "./recipe-layout.css"

const palletKg = 18
const crateKg = 24

export default function FreightScale() {
  const [crates, setCrates] = useState<number | null>(3)
  const [tare, setTare] = useState(0)
  const count = Math.max(0, Math.min(9, Math.trunc(crates ?? 0)))
  const gross = palletKg + count * crateKg
  return (
    <div className="sink-stack">
      <div className="sink-between" style={{ background: "var(--cy-void)", borderBottom: "2px solid var(--cy-line-ctl)", padding: 12 }}>
        <Readout label={tare ? "Net weight" : "Gross weight"} value={gross - tare} unit="kg" size="lg" />
        <svg viewBox="0 0 108 80" aria-hidden="true" style={{ width: 95, height: 70 }}>
          <g fill="var(--cy-signal-fill)" stroke="var(--cy-signal)" strokeWidth="1.3">
            {Array.from({ length: count }, (_, i) => (
              <g key={i} transform={`translate(${9 + (i % 3) * 29} ${44 - Math.floor(i / 3) * 19})`}>
                <rect width="26" height="17" /><path d="M2 15 24 2M2 2l22 13" opacity=".5" />
              </g>
            ))}
          </g>
          <path fill="var(--cy-ink-mute)" d="M4 63h94v5H4zm6 7h14v5H10zm33 0h15v5H43zm35 0h14v5H78z" />
        </svg>
      </div>
      <Stepper label="Crates on pallet" value={crates} min={0} max={9} step={1}
        onValueChange={setCrates} hint={`Pallet ${palletKg} kg · Each crate ${crateKg} kg`} />
      <div className="sink-between">
        <Button size="sm" onClick={() => setTare(tare ? 0 : gross)}>{tare ? "Clear tare" : "Tare scale"}</Button>
        <span className="sink-note" role="status">Tare weight · {tare} kg</span>
      </div>
    </div>
  )
}
