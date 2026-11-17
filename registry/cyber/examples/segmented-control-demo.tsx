import { Eye, Radar, SatelliteDish, Thermometer } from "lucide-react"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"

export default function SegmentedControlDemo() {
  return (
    <>
      <SegmentedControl label="View" defaultValue="grid" options={["List", "Grid", "Map"].map((label) => ({ value: label.toLowerCase(), label }))} fill />
      <SegmentedControl
        label="Optic mode"
        defaultValue="thermal"
        iconOnly
        options={[
          { value: "visible", label: "Visible", icon: <Eye /> },
          { value: "thermal", label: "Thermal", icon: <Thermometer /> },
          { value: "sonar", label: "Sonar", icon: <Radar /> },
          { value: "uplink", label: "Uplink", icon: <SatelliteDish />, disabled: true },
        ]}
      />
    </>
  )
}
