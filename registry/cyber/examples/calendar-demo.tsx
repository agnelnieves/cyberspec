import { Calendar } from "@/registry/cyber/ui/calendar"

// An ISO date some days from today, so the example always opens on a month
// that shows today and a chosen day.
function fromToday(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export default function CalendarDemo() {
  return (
    <>
      <Calendar
        defaultValue={fromToday(3)}
        defaultMonth={fromToday(0).slice(0, 7)}
        unavailable={[{ weekday: [0] }, fromToday(5)]}
        code="LOWTIDE // WINDOW"
      />
    </>
  )
}
