import { useState } from "react"
import { CalendarCheck } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { DatePicker } from "@/registry/cyber/ui/date-picker"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import { TextField } from "@/registry/cyber/ui/text-field"
import "./recipe-layout.css"

type Booking = { title: string; date: string; time: string }

function localDate() {
  const date = new Date()
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")
}

export default function EventPlanner() {
  const [today] = useState(localDate)
  const [title, setTitle] = useState("Listening session")
  const [date, setDate] = useState(today)
  const [time, setTime] = useState("14:00")
  const [booking, setBooking] = useState<Booking | null>(null)

  return (
    <form className="sink-stack" onSubmit={event => {
      event.preventDefault()
      if (booking) setBooking(null)
      else if (title.trim() && date) setBooking({ title: title.trim(), date, time })
    }}>
      {booking ? (
        <>
          <div className="sink-row"><CalendarCheck size={28} color="var(--cy-signal)" aria-hidden /><strong>Studio reserved</strong></div>
          <div role="status"><strong>{booking.title}</strong><p className="sink-note">
            {new Date(booking.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            {" · "}{booking.time} · Studio B
          </p></div>
        </>
      ) : (
        <>
          <TextField label="Session name" value={title} onValueChange={setTitle} required maxLength={80} />
          <DatePicker label="Studio date" required min={today} value={date}
            onValueChange={value => setDate(typeof value === "string" ? value : "")} />
          <SegmentedControl label="Start time" value={time} onValueChange={next => next && setTime(next)}
            options={["10:00", "14:00", "18:00"]} fill />
        </>
      )}
      <Button size="sm" tone="signal" type="submit" disabled={!title.trim() || !date}>{booking ? "Edit reservation" : "Reserve Studio B"}</Button>
    </form>
  )
}
