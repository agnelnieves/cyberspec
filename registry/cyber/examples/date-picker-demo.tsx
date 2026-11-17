import { DatePicker } from "@/registry/cyber/ui/date-picker"

// An ISO date some days from today, so the example never opens on the past.
function fromToday(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export default function DatePickerDemo() {
  return (
    <>
      <DatePicker
        label="Extraction date"
        defaultValue={fromToday(4)}
        min={fromToday(2)}
        hint="Solace Mutual needs two days' notice."
      />
      <DatePicker
        label="Return date"
        defaultValue={fromToday(2)}
        invalid
        error="Return is set before extraction."
      />
    </>
  )
}
