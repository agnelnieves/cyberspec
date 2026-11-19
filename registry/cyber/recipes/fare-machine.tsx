import { useState } from "react"
import { Ticket } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { Select } from "@/registry/cyber/ui/select"
import { Stepper } from "@/registry/cyber/ui/stepper"
import "./recipe-layout.css"

const zones = [
  { value: "city", label: "City centre", cents: 250 },
  { value: "outer", label: "Outer loop", cents: 375 },
  { value: "all", label: "All zones", cents: 500 },
]
const currency = (cents: number) => `$${(cents / 100).toFixed(2)}`

export default function FareMachine() {
  const [zoneId, setZoneId] = useState("outer")
  const [riders, setRiders] = useState<number | null>(2)
  const [issued, setIssued] = useState(false)
  const zone = zones.find(zone => zone.value === zoneId) ?? zones[0]
  return (
    <div className="sink-stack">
      <div style={{ display: "grid", gap: 8, padding: "12px 16px", color: "var(--cy-on-solid)", background: issued ? "var(--cy-signal)" : "var(--cy-flag)",
        clipPath: "polygon(0 0,100% 0,100% 38%,calc(100% - 5px) 50%,100% 62%,100% 100%,0 100%,0 62%,5px 50%,0 38%)" }}>
        <div className="sink-between" style={{ borderBottom: "1px dashed currentColor", paddingBottom: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Ticket size={17} aria-hidden /><strong>Metro single</strong></span>
          <span style={{ font: "600 12px var(--cy-mono)" }}>{issued ? "ISSUED" : "QUOTE"}</span>
        </div>
        <div className="sink-between">
          <div><strong>{zone.label}</strong><p>{riders ?? 0} {riders === 1 ? "rider" : "riders"} · {currency(zone.cents)} each</p></div>
          <strong style={{ font: "600 1.6rem var(--cy-mono)" }}>{currency((riders ?? 0) * zone.cents)}</strong>
        </div>
      </div>
      <Select label="Fare zone" value={zoneId} options={zones} disabled={issued} onValueChange={next => next && setZoneId(next)} />
      <Stepper label="Passengers" min={1} max={6} value={riders} step={1} disabled={issued} onValueChange={setRiders} />
      <Button size="sm" tone="signal" disabled={riders == null || riders < 1 || riders > 6 || !Number.isInteger(riders)} onClick={() => setIssued(!issued)}>
        {issued ? "New ticket" : "Issue ticket"}
      </Button>
      {issued && <span role="status" data-sr-only>Ticket issued for {riders} {riders === 1 ? "rider" : "riders"}.</span>}
    </div>
  )
}
