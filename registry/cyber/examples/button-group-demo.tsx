import * as React from "react"
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
import { ButtonGroup } from "@/registry/cyber/ui/button-group"

const floors = ["B2", "B1", "G", "01", "02", "03"]

export default function ButtonGroupDemo() {
  const [zoom, setZoom] = React.useState(100)
  const [floor, setFloor] = React.useState(2)
  // Hold minus or plus and the readout between them runs; it's also the key
  // that puts the zoom back.
  const nudge = (by: number) => {
    const next = Math.min(400, Math.max(25, zoom + by))
    if (next === zoom) return false
    setZoom(next)
  }

  return (
    <>
      <ButtonGroup
        label="Zoom"
        keys={[
          { label: "Zoom out", icon: <Minus aria-hidden />, action: "decrement", repeat: true, disabled: zoom <= 25, onPress: () => nudge(-5) },
          { label: `Reset zoom, ${zoom}%`, content: <span data-kit="value">{zoom}%</span>, onPress: () => setZoom(100) },
          { label: "Zoom in", icon: <Plus aria-hidden />, action: "increment", repeat: true, disabled: zoom >= 400, onPress: () => nudge(5) },
        ]}
      />
      <ButtonGroup
        label="Floor"
        orientation="vertical"
        keys={[
          { label: "Floor up", icon: <ChevronUp aria-hidden />, action: "increment", disabled: floor === floors.length - 1, onPress: () => setFloor(floor + 1) },
          { label: `Ground floor, now ${floors[floor]}`, content: <span data-kit="value">{floors[floor]}</span>, onPress: () => setFloor(2) },
          { label: "Floor down", icon: <ChevronDown aria-hidden />, action: "decrement", disabled: floor === 0, onPress: () => setFloor(floor - 1) },
        ]}
      />
      <ButtonGroup
        label="Route history"
        keys={[
          { label: "Undo" },
          { label: "Redo", disabled: true },
        ]}
      />
    </>
  )
}
