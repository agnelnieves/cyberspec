import { useState } from "react"
import { Badge } from "@/registry/cyber/ui/badge"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import { Switch } from "@/registry/cyber/ui/switch"
import "./recipe-layout.css"

const routes = [
  { station: "Museum", local: 13, express: 8 },
  { station: "Harbor", local: 22, express: 14 },
  { station: "Gardens", local: 31, express: 19 },
]
const localStops = ["Central", "Old Mill", "Museum", "Market", "Harbor", "Birch", "Gardens"]
const xAt = (index: number) => 12 + index * 44
const localColor = "var(--cy-signal)"
const expressColor = "var(--cy-flag)"

export default function RoutePlanner() {
  const [destination, setDestination] = useState("Harbor")
  const [express, setExpress] = useState(false)
  const route = routes.find(route => route.station === destination) ?? routes[0]
  const index = localStops.indexOf(destination)
  const stops = localStops.slice(0, index + 1).filter((_, i) => !express || i % 2 === 0)
  const color = express ? expressColor : localColor
  return (
    <div className="sink-stack">
      <SegmentedControl label="From Central to" options={routes.map(route => route.station)} value={destination} fill
        onValueChange={next => next && setDestination(next)} />
      <div style={{ border: "1px solid var(--cy-line-deco)", background: "var(--cy-void)", padding: "10px 12px" }}>
        <svg viewBox="0 0 288 72" aria-hidden="true" style={{ display: "block", width: "100%", height: 76 }}>
          <g fill="none" stroke="var(--cy-line-ctl)" opacity="0.6" strokeWidth="2">
            <path d="M12 48H276" />
            <path d="m12 48 22-28h220l22 28M78 20l22 28m66-28 22 28" />
          </g>
          <path d={express ? `M12 48l22-28H${xAt(index) - 22}l22 28` : `M12 48H${xAt(index)}`}
            fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" />
          {localStops.map((station, i) => (
            <rect key={station} x={xAt(i) - 3.5} y={express && i > 0 && i < index && i % 2 === 0 ? 16.5 : 44.5} width="7" height="7"
              fill={station === destination || !i ? color : "var(--cy-void)"} stroke={stops.includes(station) ? color : "var(--cy-line-ctl)"} strokeWidth="2" />
          ))}
        </svg>
        <div className="sink-between"><strong>Central to {destination}</strong><Badge tone={express ? "flag" : "signal"}>{express ? route.express : route.local} min</Badge></div>
      </div>
      <Switch label="Use express line" checked={express} onCheckedChange={setExpress} />
      <p className="sink-note" role="status">{stops.length - 1} {stops.length === 2 ? "stop" : "stops"} · {stops.join(" → ")}</p>
    </div>
  )
}
