import { BellOff, Flashlight, Radar } from "lucide-react"
import { Toggle } from "@/registry/cyber/ui/toggle"

export default function ToggleDemo() {
  return (
    <>
      <Toggle icon={<BellOff aria-hidden />} defaultPressed>
        Silent mode
      </Toggle>
      <Toggle icon={<Flashlight aria-hidden />} aria-label="Torch" />
      <Toggle icon={<Radar aria-hidden />} aria-label="Proximity ping" defaultPressed />
      <Toggle size="sm">Autopilot</Toggle>
      <Toggle disabled defaultPressed>
        Uplink
      </Toggle>
    </>
  )
}
