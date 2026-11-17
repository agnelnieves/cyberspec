import { Combobox } from "@/registry/cyber/ui/combobox"

export default function ComboboxDemo() {
  return (
    <>
      <Combobox
        label="Contact"
        placeholder="Search contacts"
        defaultValue="juno"
        empty="No contact by that name."
        hint="Type a name or a trade."
        options={[
          { value: "mara", label: "Mara Voss", meta: "Fixer" },
          { value: "ilya", label: "Ilya Brandt", meta: "Tech" },
          { value: "juno", label: "Juno Okafor", meta: "Medic" },
          { value: "dex", label: "Dex Marlowe", meta: "Driver" },
          { value: "sable", label: "Sable Quinn", meta: "Runner" },
          { value: "ren", label: "Ren Aoki", meta: "Broker", disabled: true },
        ]}
      />
    </>
  )
}
