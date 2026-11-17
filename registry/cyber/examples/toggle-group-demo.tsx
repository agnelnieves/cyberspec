import { HeartPulse, Layers, Thermometer, Wifi } from "lucide-react"
import { ToggleGroup } from "@/registry/cyber/ui/toggle-group"

export default function ToggleGroupDemo() {
  return (
    <>
      <ToggleGroup
        label="Fire mode"
        defaultValue={["burst"]}
        deselectable={false}
        options={[
          { value: "semi", label: "Semi" },
          { value: "burst", label: "Burst" },
          { value: "auto", label: "Auto" },
        ]}
      />
      <ToggleGroup
        label="Scan layers"
        multiple
        orientation="vertical"
        defaultValue={["thermal", "network"]}
        options={[
          { value: "thermal", label: "Thermal", icon: <Thermometer aria-hidden /> },
          { value: "network", label: "Network", icon: <Wifi aria-hidden /> },
          { value: "structure", label: "Structure", icon: <Layers aria-hidden /> },
          { value: "biosign", label: "Biosign", icon: <HeartPulse aria-hidden />, disabled: true },
        ]}
      />
    </>
  )
}
