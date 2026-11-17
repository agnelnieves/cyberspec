import { BellRing, Ellipsis, MapPin, MessageSquare, PhoneCall, Share2, Trash2 } from "lucide-react"
import { Menu, type MenuEntry } from "@/registry/cyber/ui/menu"

// What you can do with a contact.
const actions: MenuEntry[] = [
  { value: "call", label: "Call", icon: <PhoneCall aria-hidden />, shortcut: "mod+k" },
  { value: "message", label: "Message", icon: <MessageSquare aria-hidden />, shortcut: "mod+shift+m" },
  { value: "locate", label: "Locate", icon: <MapPin aria-hidden />, disabled: true },
  {
    type: "submenu",
    label: "Share with",
    icon: <Share2 aria-hidden />,
    items: [
      { value: "share-ilya", label: "Ilya Brandt" },
      { value: "share-juno", label: "Juno Okafor" },
      { value: "share-dex", label: "Dex Marlowe" },
    ],
  },
  { type: "separator" },
  { type: "checkbox", value: "pinned", label: "Pin to top", defaultChecked: true },
  { type: "checkbox", value: "muted", label: "Mute pings" },
  { type: "separator" },
  {
    type: "radio-group",
    name: "trust",
    label: "Trust",
    defaultValue: "crew",
    items: [
      { value: "crew", label: "Crew" },
      { value: "known", label: "Known" },
      { value: "burned", label: "Burned" },
    ],
  },
  { type: "separator" },
  {
    value: "forget",
    label: "Forget contact",
    icon: <Trash2 aria-hidden />,
    destructive: true,
    confirm: "Removes Mara Voss and her message history from this deck",
  },
]

const alerts: MenuEntry[] = [
  {
    type: "radio-group",
    name: "alerts",
    label: "Alert me",
    defaultValue: "direct",
    items: [
      { value: "all", label: "Every ping" },
      { value: "direct", label: "Direct only" },
      { value: "none", label: "Never" },
    ],
  },
]

export default function MenuDemo() {
  return (
    <>
      <Menu label="Mara Voss" items={actions} />
      <Menu label="Alerts for Mara Voss" items={alerts} icon={<BellRing aria-hidden />} compact />
      <Menu label="More" items={[{ value: "export", label: "Export" }]} icon={<Ellipsis aria-hidden />} compact disabled />
    </>
  )
}
