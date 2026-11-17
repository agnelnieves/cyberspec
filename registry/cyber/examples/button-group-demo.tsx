import * as React from "react"
import { ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
import { ButtonGroup } from "@/registry/cyber/ui/button-group"

const floors = ["B2", "B1", "G", "01", "02", "03"]

export default function ButtonGroupDemo() {
  const [zoom, setZoom] = React.useState(100)
  const [floor, setFloor] = React.useState(2)
  // Hold minus or plus and the readout between them runs; it's also the key
  // that puts the zoom back.
  const nudge = (by: number) => setZoom((value) => Math.min(400, Math.max(25, value + by)))

  return (
    <>
      <ButtonGroup
        label="Zoom"
        keys={[
          { label: "Zoom out", icon: <Minus aria-hidden />, repeat: true, disabled: zoom <= 25, onPress: () => nudge(-5) },
          { label: `Reset zoom, ${zoom}%`, content: <span data-kit="value">{zoom}%</span>, onPress: () => setZoom(100) },
          { label: "Zoom in", icon: <Plus aria-hidden />, repeat: true, disabled: zoom >= 400, onPress: () => nudge(5) },
        ]}
      />
      <ButtonGroup
        label="Floor"
        orientation="vertical"
        keys={[
          { label: "Floor up", icon: <ChevronUp aria-hidden />, disabled: floor === floors.length - 1, onPress: () => setFloor(floor + 1) },
          { label: `Ground floor, now ${floors[floor]}`, content: <span data-kit="value">{floors[floor]}</span>, onPress: () => setFloor(2) },
          { label: "Floor down", icon: <ChevronDown aria-hidden />, disabled: floor === 0, onPress: () => setFloor(floor - 1) },
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
