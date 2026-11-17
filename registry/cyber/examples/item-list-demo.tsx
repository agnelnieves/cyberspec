import { ItemList } from "@/registry/cyber/ui/item-list"

export default function ItemListDemo() {
  return (
    <>
      <ItemList
        label="Contacts"
        defaultValue="juno"
        countLabel="unread"
        items={[
          { value: "mara", label: "Mara Voss", meta: "Fixer", flag: "Job offer waiting", count: 3 },
          { value: "ilya", label: "Ilya Brandt", meta: "Tech" },
          { value: "juno", label: "Juno Okafor", meta: "Medic" },
          { value: "dex", label: "Dex Marlowe", meta: "Driver", flag: "Missed call", count: 1 },
          { value: "sable", label: "Sable Quinn", meta: "Runner" },
          { value: "ren", label: "Ren Aoki", meta: "Broker", disabled: true },
        ]}
      />
      <ItemList
        label="Daemons"
        compact
        activation="manual"
        defaultValue="ghostwrite"
        items={[
          { value: "ghostwrite", label: "Ghostwrite", meta: "4 RAM" },
          { value: "static-bloom", label: "Static Bloom", meta: "6 RAM" },
          { value: "deadlock", label: "Deadlock", meta: "8 RAM" },
          { value: "mirrorfall", label: "Mirrorfall", meta: "11 RAM", disabled: true },
          { value: "null-ping", label: "Null Ping", meta: "2 RAM" },
        ]}
      />
    </>
  )
}
