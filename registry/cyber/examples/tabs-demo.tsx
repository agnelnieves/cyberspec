import { Crosshair, Cpu, Eye, Shirt } from "lucide-react"
import { Tabs } from "@/registry/cyber/ui/tabs"

export default function TabsDemo() {
  return (
    <>
      <Tabs
        label="Loadout"
        defaultValue="inventory"
        tabs={[
          {
            value: "inventory",
            label: "Inventory",
            content: "Eleven items carried, two equipped. The Kestrel KR-9 is in the primary slot with 84 rounds.",
          },
          {
            value: "crafting",
            label: "Crafting",
            flag: "New",
            content: "One schematic unlocked since your last visit: a suppressor for the KR-9. Needs four common parts.",
          },
          {
            value: "backpack",
            label: "Backpack",
            content: "18 of 40 kilos used. Nothing in here is flagged as stolen.",
          },
        ]}
      />
      <Tabs
        label="Gear type"
        variant="key"
        cipher
        defaultValue="arms"
        tabs={[
          {
            value: "arms",
            label: "Arms",
            icon: <Crosshair aria-hidden />,
            content: "Kestrel KR-9 carbine, holstered. Smart-linked to the Lumen optics.",
          },
          {
            value: "optics",
            label: "Optics",
            icon: <Eye aria-hidden />,
            content: "Onyx Lumen, rev 3. Thermal and low-light, with a threat overlay.",
          },
          {
            value: "mesh",
            label: "Mesh",
            icon: <Shirt aria-hidden />,
            content: "Wraith mesh jacket. Rated against small arms; no good in the rain.",
          },
          {
            value: "daemons",
            label: "Daemons",
            icon: <Cpu aria-hidden />,
            disabled: true,
            content: "No deck slotted.",
          },
        ]}
      />
    </>
  )
}
