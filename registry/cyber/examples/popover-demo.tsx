import { Popover } from "@/registry/cyber/ui/popover"
import { Switch } from "@/registry/cyber/ui/switch"

export default function PopoverDemo() {
  return (
    <>
      <Popover trigger="Route" title="Route details" description="Lowtide to Glasswater, by the Stacks underpass." code="ROUTE 07 // NODE 3F:A2">
        <dl>
          <div>
            <dt>Distance</dt>
            <dd>4.2 km</dd>
          </div>
          <div>
            <dt>Patrols</dt>
            <dd>2 on route</dd>
          </div>
          <div>
            <dt>Toll</dt>
            <dd>¤ 40</dd>
          </div>
        </dl>
        <Switch label="Avoid patrols" defaultChecked />
      </Popover>
      <Popover
        trigger="Toll"
        triggerTone="signal"
        side="top"
        align="end"
        title="Glasswater toll"
        description="Charged once per crossing by Vanta Systems. A Lowtide Union pass waives it."
        code="TARIFF 12 // REV 0.1"
      />
    </>
  )
}
