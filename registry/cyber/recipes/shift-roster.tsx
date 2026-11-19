import { useState } from "react"
import { Avatar } from "@/registry/cyber/ui/avatar"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Tabs } from "@/registry/cyber/ui/tabs"
import "./recipe-layout.css"

const shifts = [
  { label: "Morning", time: "06:00–14:00", lead: "Imani Bell", role: "Studio engineer" },
  { label: "Evening", time: "14:00–22:00", lead: "Sam Chen", role: "Field producer" },
  { label: "Night", time: "22:00–06:00", lead: "Adri Sol", role: "Sound engineer" },
]

export default function ShiftRoster() {
  const [covering, setCovering] = useState<string | null>(null)
  return (
    <Tabs label="Studio shifts" defaultValue="Morning" tabs={shifts.map(shift => ({
      value: shift.label, label: shift.label,
      content: (
        <div className="sink-stack">
          <div className="sink-between">
            <strong className="sink-metric" style={{ fontSize: "1.2rem" }}>{shift.time}</strong>
            <Badge tone={covering === shift.label ? "ok" : "flag"}>{covering === shift.label ? "Covered" : "1 opening"}</Badge>
          </div>
          <div className="sink-item" style={{ justifyContent: "flex-start" }}>
            <Avatar name={shift.lead} decorative shape="hex" />
            <div><strong>{shift.lead}</strong><p className="sink-note">{shift.role}</p></div>
          </div>
          <div className="sink-between">
            <div aria-live="polite"><strong>{covering === shift.label ? "You" : "Open seat"}</strong><p className="sink-note">Studio assistant</p></div>
            <Button size="sm" disabled={covering !== null && covering !== shift.label}
              onClick={() => setCovering(covering === shift.label ? null : shift.label)}>
              {covering === shift.label ? "Leave shift" : "Take shift"}
            </Button>
          </div>
          {covering && covering !== shift.label && <p className="sink-note">Leave your {covering.toLowerCase()} shift to take this seat.</p>}
        </div>
      ),
    }))} />
  )
}
