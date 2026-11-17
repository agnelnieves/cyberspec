import { Switch } from "@/registry/cyber/ui/switch"

export default function SwitchDemo() {
  return (
    <>
      <Switch label="Optic overlay" defaultChecked />
      <Switch label="Stealth routing" />
      <Switch label="Uplink" disabled />
    </>
  )
}
