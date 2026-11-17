import { Activity, Cpu, HardDriveDownload, Power, Route, Shuffle } from "lucide-react"
import { Menubar, type MenubarMenu } from "@/registry/cyber/ui/menubar"

// The menus of a Vanta Mk.II deck.
const menus: MenubarMenu[] = [
  {
    label: "Deck",
    items: [
      { value: "mount", label: "Mount deck", icon: <HardDriveDownload aria-hidden />, shortcut: "mod+m" },
      { value: "diagnose", label: "Run diagnostics", icon: <Activity aria-hidden />, shortcut: "mod+d" },
      {
        type: "submenu",
        label: "Load daemon",
        icon: <Cpu aria-hidden />,
        items: [
          { value: "ghostwrite", label: "Ghostwrite" },
          { value: "static-bloom", label: "Static Bloom" },
          { value: "deadlock", label: "Deadlock", disabled: true },
        ],
      },
      { type: "separator" },
      {
        value: "power-down",
        label: "Power down",
        icon: <Power aria-hidden />,
        destructive: true,
        confirm: "Powers the deck down and drops every open link",
      },
    ],
  },
  {
    label: "Route",
    items: [
      { value: "new-route", label: "New route", icon: <Route aria-hidden />, shortcut: "mod+n" },
      { value: "reroute", label: "Reroute", icon: <Shuffle aria-hidden />, shortcut: "mod+r" },
      { type: "separator" },
      { type: "checkbox", value: "stealth", label: "Stealth routing", defaultChecked: true },
      { type: "checkbox", value: "checkpoints", label: "Avoid checkpoints" },
      { type: "separator" },
      {
        type: "radio-group",
        name: "priority",
        label: "Priority",
        defaultValue: "quiet",
        items: [
          { value: "fast", label: "Fastest" },
          { value: "quiet", label: "Quietest" },
          { value: "cheap", label: "Cheapest" },
        ],
      },
    ],
  },
  {
    label: "View",
    items: [
      { type: "checkbox", value: "threats", label: "Threat overlay", defaultChecked: true },
      { type: "checkbox", value: "patrols", label: "Patrol paths" },
      { type: "checkbox", value: "grid", label: "Grid lines", defaultChecked: true },
      { type: "separator" },
      {
        type: "radio-group",
        name: "density",
        label: "Density",
        defaultValue: "standard",
        items: [
          { value: "compact", label: "Compact" },
          { value: "standard", label: "Standard" },
        ],
      },
    ],
  },
  { label: "Uplink", disabled: true, items: [{ value: "connect", label: "Connect" }] },
]

export default function MenubarDemo() {
  return (
    <>
      <Menubar label="Deck" menus={menus} code="VANTA MK.II" />
    </>
  )
}
