import { Radio } from "lucide-react"
import { TextField } from "@/registry/cyber/ui/text-field"

export default function TextFieldDemo() {
  return (
    <>
      <TextField label="Handle" prefix="@" defaultValue="sable.quinn" hint="Shown to every crew you run with." autoComplete="off" clearable />
      <TextField
        label="Callsign"
        icon={<Radio />}
        defaultValue="STATIC-07"
        error="Callsign already registered in Lowtide."
        autoComplete="off"
        required
      />
      <TextField label="Relay node" defaultValue="NODE 3F:A2" disabled />
    </>
  )
}
