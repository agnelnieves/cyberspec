import { Crosshair, Radar, Unplug } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { Tooltip } from "@/registry/cyber/ui/tooltip"

export default function TooltipDemo() {
  return (
    <>
      <Tooltip content="Lock on">
        <Button icon>
          <Crosshair aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip content="Sweep sector">
        <Button icon tone="signal">
          <Radar aria-hidden />
        </Button>
      </Tooltip>
      {/* A key that's off keeps its place in the tab order, so the tooltip
          can still say why. This one has a name, so the tooltip describes
          it instead of naming it. */}
      <Tooltip content="No deck linked" side="bottom">
        <Button icon disabled focusableWhenDisabled aria-label="Jack out">
          <Unplug aria-hidden />
        </Button>
      </Tooltip>
    </>
  )
}
