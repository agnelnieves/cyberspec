import { useState } from "react"
import { Badge } from "@/registry/cyber/ui/badge"
import { Checkbox, CheckboxGroup } from "@/registry/cyber/ui/checkbox"
import { Select } from "@/registry/cyber/ui/select"
import { Switch } from "@/registry/cyber/ui/switch"
import "./recipe-layout.css"

const events = [
  { value: "handoff", label: "Handoff reminder", priority: false },
  { value: "closure", label: "Station closure", priority: true },
]

export default function NotificationRules() {
  const [destinations, setDestinations] = useState<string[]>(["Desk"])
  const [quiet, setQuiet] = useState(true)
  const [eventId, setEventId] = useState("handoff")
  const event = events.find(item => item.value === eventId)!
  const held = quiet && !event.priority
  let outcome = `Delivered to ${destinations.join(" and ")}.`
  if (!destinations.length) outcome = "No destinations selected."
  else if (held) outcome = "Held until quiet hours end."

  return (
    <div className="sink-stack">
      <CheckboxGroup label="Alert destinations" value={destinations} onValueChange={setDestinations}>
        <Checkbox value="Desk" label="Desk" />
        <Checkbox value="Wrist relay" label="Wrist relay" />
      </CheckboxGroup>
      <Switch label="Quiet hours" checked={quiet} onCheckedChange={setQuiet} />
      <Select label="Test notification" value={eventId} options={events}
        onValueChange={value => { if (value) setEventId(value) }} />
      <div className="sink-row" role="status">
        <Badge tone={event.priority ? "flag" : "mute"}>{event.priority ? "Priority" : "Routine"}</Badge>
        <span>{outcome}</span>
      </div>
    </div>
  )
}
