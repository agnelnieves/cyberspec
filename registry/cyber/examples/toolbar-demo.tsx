import * as React from "react"
import { Eraser, Magnet, MapPinPlus, MousePointer2, Radar, Redo2, Spline, Trash2, Undo2 } from "lucide-react"
import { Toolbar } from "@/registry/cyber/ui/toolbar"

// The tools of a route editor: what the pointer does, what the route snaps
// to and steers around, and its history.
export default function ToolbarDemo() {
  const [tool, setTool] = React.useState("waypoint")
  return (
    <>
      <Toolbar
        label="Route tools"
        items={[
          {
            type: "choice",
            label: "Tool",
            value: tool,
            onValueChange: setTool,
            options: [
              { value: "select", label: "Select", icon: <MousePointer2 aria-hidden /> },
              { value: "waypoint", label: "Add waypoint", icon: <MapPinPlus aria-hidden /> },
              { value: "path", label: "Draw path", icon: <Spline aria-hidden /> },
              { value: "erase", label: "Erase", icon: <Eraser aria-hidden /> },
            ],
          },
          { type: "separator" },
          { type: "toggle", label: "Snap to grid", icon: <Magnet aria-hidden />, defaultPressed: true },
          { type: "toggle", label: "Avoid patrols", icon: <Radar aria-hidden /> },
          { type: "separator" },
          { label: "Undo", icon: <Undo2 aria-hidden /> },
          { label: "Redo", icon: <Redo2 aria-hidden />, disabled: true },
          { label: "Clear route", icon: <Trash2 aria-hidden />, confirm: "Removes every waypoint from this route" },
        ]}
      />
    </>
  )
}
