import { useState } from "react"
import { Truck } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { ItemList } from "@/registry/cyber/ui/item-list"
import { Progress } from "@/registry/cyber/ui/progress"
import "./recipe-layout.css"

const stops = [
  { value: "dock", label: "West Dock", meta: "09:10", cargo: "Field recorders" },
  { value: "depot", label: "Central Depot", meta: "10:30", cargo: "Spare batteries" },
  { value: "tower", label: "North Tower", meta: "11:45", cargo: "Patch cables" },
]

export default function DispatchQueue() {
  const [sent, setSent] = useState<string[]>([])
  const [selected, setSelected] = useState(stops[0].value)
  const pending = stops.filter(stop => !sent.includes(stop.value))
  const current = pending.find(stop => stop.value === selected) ?? pending[0]
  const last = stops.find(stop => stop.value === sent.at(-1))
  return (
    <div className="sink-stack">
      <Progress label="Vans dispatched" value={sent.length} max={stops.length} />
      {current && <ItemList label="Pickup queue" items={pending} compact value={current.value}
        onValueChange={next => next && setSelected(next)} />}
      <div className="sink-between">
        {current && <div><span className="sink-label">Cargo</span><p>{current.cargo}</p></div>}
        <Button size="sm" onClick={() => {
          if (current) setSent([...sent, current.value])
          else { setSent([]); setSelected(stops[0].value) }
        }}><Truck aria-hidden />{current ? "Dispatch van" : "Start a new run"}</Button>
      </div>
      <p role="status" className="sink-note">{last ? `Dispatched to ${last.label}.` : "All vans are at the loading bay."}</p>
    </div>
  )
}
