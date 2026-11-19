import "./recipe-layout.css"
import { useState } from "react"
import { Button } from "@/registry/cyber/ui/button"
import { Rating } from "@/registry/cyber/ui/rating"
import { Textarea } from "@/registry/cyber/ui/textarea"

const levels = ["Difficult", "Uneven", "Fair", "Good", "Excellent"]

export default function FeedbackDesk() {
  const [score, setScore] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const [recorded, setRecorded] = useState(false)

  return (
    <form className="sink-stack" onSubmit={(event) => {
      event.preventDefault()
      if (score !== null) setRecorded(true)
    }}>
      <strong>How was the workshop?</strong>
      <Rating label="Workshop rating" value={score} levels={levels} onValueChange={(next) => {
        setScore(next)
        setRecorded(false)
      }} />
      <Textarea label="Notes (optional)" placeholder="What should we keep or change?" maxLength={180} rows={2} value={note} onValueChange={(next) => {
        setNote(next)
        setRecorded(false)
      }} />
      <div className="sink-row">
        <Button type="submit" size="sm" disabled={score === null || recorded}>Record feedback</Button>
        <span className="sink-note" role="status">{recorded ? `Recorded ${score}/5${note.trim() ? " with notes" : ""}.` : ""}</span>
      </div>
    </form>
  )
}
