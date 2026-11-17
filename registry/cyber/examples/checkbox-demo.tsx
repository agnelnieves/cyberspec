import { Checkbox, CheckboxGroup } from "@/registry/cyber/ui/checkbox"

export default function CheckboxDemo() {
  return (
    <>
      <CheckboxGroup label="Objectives" defaultValue={["relay"]}>
        <Checkbox value="relay" label="Reach the Glasswater relay" />
        <Checkbox value="splice" label="Splice the Vanta trunk line" />
        <Checkbox value="exfil" label="Exfil with Dex Marlowe" hint="Locked until the trunk is spliced." disabled />
      </CheckboxGroup>
    </>
  )
}
