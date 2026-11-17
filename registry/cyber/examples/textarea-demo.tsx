import { Textarea } from "@/registry/cyber/ui/textarea"

export default function TextareaDemo() {
  return (
    <>
      <Textarea
        label="Job brief"
        maxLength={240}
        defaultValue="Pickup at Cinder Row, dock 4. One sealed Vanta Mk.II deck. Hand it to Mara Voss in Glasswater before 04:00. Don't power it on."
        hint="The runner sees this before accepting."
      />
      <Textarea label="Sign-off" maxLength={32} rows={1} defaultValue="Route cleared. Paid on delivery" />
    </>
  )
}
