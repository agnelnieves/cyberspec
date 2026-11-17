import { Fieldset } from "@/registry/cyber/ui/fieldset"
import { Switch } from "@/registry/cyber/ui/switch"
import { TextField } from "@/registry/cyber/ui/text-field"

export default function FieldsetDemo() {
  return (
    <>
      <Fieldset legend="Uplink" description="Where this deck phones home between jobs." code="NODE 3F:A2 // VANTA RELAY">
        <TextField label="Relay host" defaultValue="glasswater-03.relay" autoComplete="off" />
        <TextField label="Channel" prefix="CH" defaultValue="7741" inputMode="numeric" autoComplete="off" />
        <Switch label="Stealth route" defaultChecked />
      </Fieldset>
    </>
  )
}
