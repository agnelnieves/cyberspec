import { useState } from "react"
import { Globe, Map as MapIcon } from "lucide-react"
import { Map, type MapMarker, type MapProjection } from "@/registry/cyber/ui/map"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import "./recipe-layout.css"

const observatories: MapMarker[] = [
  { id: "mauna-kea", code: "MK", label: "Mauna Kea", coordinate: [-155.47, 19.82] },
  { id: "paranal", code: "PN", label: "Cerro Paranal", coordinate: [-70.40, -24.63] },
  { id: "la-palma", code: "LP", label: "La Palma", coordinate: [-17.89, 28.76] },
]
const relays = [
  { id: "pacific", from: "mauna-kea", to: "paranal" },
  { id: "atlantic", from: "paranal", to: "la-palma" },
]

export default function SectorAtlas() {
  const [projection, setProjection] = useState<MapProjection>("globe")
  const [selected, setSelected] = useState<string | null>("paranal")
  return (
    <div className="sink-stack">
      <Map label="Observatory network" markers={observatories} routes={relays} projection={projection}
        value={selected} onValueChange={setSelected} />
      <SegmentedControl<MapProjection> label="Projection" value={projection}
        options={[{ label: "Globe", value: "globe", icon: <Globe /> }, { label: "Flat map", value: "mercator", icon: <MapIcon /> }]}
        onValueChange={next => next && setProjection(next)} />
    </div>
  )
}
