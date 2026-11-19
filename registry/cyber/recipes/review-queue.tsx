import { useState } from "react"
import { Check, RotateCcw } from "lucide-react"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Readout } from "@/registry/cyber/ui/readout"
import "./recipe-layout.css"

const submissions = [
  { title: "South pier route", author: "Dex Marlowe", detail: "Move the pickup point from berth 02 to berth 04 while the ramp is under repair." },
  { title: "Evening relay credits", author: "Mara Voss", detail: "Add the Lowtide Union field crew to the closing credits of the evening relay." },
  { title: "Tide gauge caption", author: "Ilya Brandt", detail: "Label the gauge in metres above the low-water mark." },
]
type Decision = "Approved" | "Returned"

export default function ReviewQueue() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const current = submissions[decisions.length]
  const previous = submissions[decisions.length - 1]

  return (
    <div className="sink-stack">
      <div className="sink-between">
        <Readout size="sm" label="Awaiting review" value={submissions.length - decisions.length} />
        <Badge tone="signal">Change requests</Badge>
      </div>
      <div className="sink-stack" aria-live="polite">
        {current ? <div className="sink-stack">
          <div><strong>{current.title}</strong><p className="sink-note">Submitted by {current.author}</p></div>
          <p>{current.detail}</p>
        </div> : <p>Queue cleared. {decisions.filter(status => status === "Approved").length} of {submissions.length} requests approved.</p>}
      </div>
      {current && <div className="sink-row">
        <Button tone="signal" size="sm" onClick={() => setDecisions([...decisions, "Approved"])}><Check aria-hidden /> Approve</Button>
        <Button size="sm" onClick={() => setDecisions([...decisions, "Returned"])}>Return for edits</Button>
      </div>}
      {previous && <div className="sink-between">
        <span className="sink-note">{decisions.at(-1)} · {previous.title}</span>
        <Button size="sm" tone="ghost" onClick={() => setDecisions(decisions.slice(0, -1))}><RotateCcw aria-hidden /> Undo review</Button>
      </div>}
    </div>
  )
}
