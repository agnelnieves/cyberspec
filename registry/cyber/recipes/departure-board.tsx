import { useState } from "react"
import { Clock3 } from "lucide-react"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import "./recipe-layout.css"

const services = [
  { line: "A", every: 12, offset: 1, outbound: "East Pier", inbound: "Union Square" },
  { line: "B", every: 15, offset: 4, outbound: "Glassworks", inbound: "Northgate" },
  { line: "C", every: 20, offset: 9, outbound: "Salt Market", inbound: "City Hall" },
]
const startTime = 17 * 60 + 30
function clock(minutes: number) {
  return [Math.floor(minutes / 60) % 24, minutes % 60].map(part => String(part).padStart(2, "0")).join(":")
}

export default function DepartureBoard() {
  const [platform, setPlatform] = useState("Outbound")
  const [elapsed, setElapsed] = useState(0)
  const inbound = platform === "Inbound"
  const upcoming = services.flatMap(service => {
    const first = service.offset + (inbound ? 3 : 0)
    const departure = first + Math.max(0, Math.ceil((elapsed - first) / service.every)) * service.every
    return [departure, departure + service.every].map(minute => ({
      line: service.line, destination: inbound ? service.inbound : service.outbound, minute,
    }))
  }).sort((a, b) => a.minute - b.minute).slice(0, 4)
  return (
    <div className="sink-stack">
      <SegmentedControl label="Platform" options={["Outbound", "Inbound"]} value={platform}
        onValueChange={next => next && setPlatform(next)} />
      <div className="sink-between"><span className="sink-label">Grand Terminal</span><strong className="sink-metric">{clock(startTime + elapsed)}</strong></div>
      <ol className="sink-list" aria-label={`${platform} departures`}>
        {upcoming.map(({ line, destination, minute }) => (
          <li className="sink-item" key={`${line}-${minute}`}>
            <span className="sink-row"><Badge tone={line === "A" ? "signal" : line === "B" ? "flag" : "epic"}>{line}</Badge><strong>{destination}</strong></span>
            <span style={{ fontFamily: "var(--cy-mono)", color: "var(--cy-flag)" }}>{minute === elapsed ? "Due" : `${minute - elapsed} min`}</span>
          </li>
        ))}
      </ol>
      <Button size="sm" onClick={() => setElapsed(current => current + 5)}><Clock3 aria-hidden />Advance 5 minutes</Button>
    </div>
  )
}
