import { Crosshair, Flag, Navigation, ScanLine } from "lucide-react"
import { ContextMenu } from "@/registry/cyber/ui/context-menu"

export default function ContextMenuDemo() {
  return (
    <>
      <ContextMenu
        label="Grid sector 3F"
        items={[
          { value: "route", label: "Route here", icon: <Navigation aria-hidden />, shortcut: "mod+r" },
          { value: "pin", label: "Drop a pin", icon: <Flag aria-hidden /> },
          { value: "scan", label: "Scan sector", icon: <ScanLine aria-hidden />, disabled: true },
          { type: "separator" },
          { type: "checkbox", value: "patrols", label: "Show patrols", defaultChecked: true },
          { type: "checkbox", value: "cameras", label: "Show cameras" },
          { type: "separator" },
          { value: "mark", label: "Mark hostile", icon: <Crosshair aria-hidden />, destructive: true },
        ]}
      />
    </>
  )
}
