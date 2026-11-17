import * as React from "react"
import {
  Calendar as SdkCalendar,
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  type CalendarMode,
  type CalendarValue,
} from "@ui-sdk/react/calendar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "@/registry/cyber/ui/cyber/button.css"
import "@/registry/cyber/ui/cyber/calendar.css"

// What the foot prints for a value: the date as the machine holds it, both
// ends of a range, or how many dates a multiple selection has.
function readout(value: CalendarValue, mode: CalendarMode) {
  const dotted = (date: string) => date.split("-").join(".")
  if (!value || value.length === 0) return "----.--.--"
  if (typeof value === "string") return dotted(value)
  if (mode === "range" && value.length === 2) return `${dotted(value[0].slice(5))} > ${dotted(value[1].slice(5))}`
  return value.length === 1 ? dotted(value[0]) : `${value.length} dates`
}

// The month a calendar shows: its heading between the two keys that turn
// it, and the grid of days. It's the inside of `Calendar`, and of a date
// picker's popup, where the SDK's calendar parts work the same way.
function CalendarView() {
  return (
    <>
      <div data-kit="calendar-head">
        <CalendarPrevious data-kit="button" data-frame="br" data-press-flash="" data-tone="secondary" data-size="sm" data-icon="">
          <ChevronLeft aria-hidden />
        </CalendarPrevious>
        <CalendarHeading data-kit="calendar-heading">
          {/* The year, like every numeral in the kit, reads in the signal
              color; the words around it stay a label. */}
          {(state) =>
            state.label.split(/(\d{4})/).map((part, index) =>
              /^\d{4}$/.test(part) ? (
                <span key={index} data-kit="calendar-year">
                  {part}
                </span>
              ) : (
                part
              ),
            )
          }
        </CalendarHeading>
        <CalendarNext data-kit="button" data-frame="br" data-press-flash="" data-tone="secondary" data-size="sm" data-icon="">
          <ChevronRight aria-hidden />
        </CalendarNext>
      </div>
      <CalendarGrid data-kit="calendar-grid">
        <CalendarWeekdays data-kit="calendar-weekdays">
          {(index) => <CalendarWeekday index={index} data-kit="calendar-weekday" />}
        </CalendarWeekdays>
        <CalendarWeeks data-kit="calendar-weeks">
          {(cell) => (
            // A day takes real focus. Its face draws the ring, inside
            // itself, so the cell asks for none around it, where it would
            // run into its neighbours.
            <CalendarDay value={cell.date} data-kit="calendar-day" data-press-flash="" data-focus-quiet="">
              {(state) => <span data-kit="calendar-day-face">{state.label}</span>}
            </CalendarDay>
          )}
        </CalendarWeeks>
      </CalendarGrid>
    </>
  )
}

// A month on a panel. Today carries a corner flag and an edge, the chosen
// day is a solid signal block, days outside the month are muted, and days
// that can't be picked are hatched and struck. The foot prints the value.
//
// Everything goes to the SDK's Calendar: `value`, `defaultValue`,
// `onValueChange`, `mode` ("single", "multiple" or "range"), `min`, `max`,
// `unavailable`, `today`, `disabled`, `readOnly`, `controller`.
function Calendar({ code = "CS-28 // DATE", ...props }: Omit<React.ComponentProps<typeof SdkCalendar>, "children"> & { code?: string }) {
  return (
    <SdkCalendar data-kit="calendar" data-frame="tr bl" {...props}>
      {(state) => (
        <>
          <CalendarView />
          <div data-kit="calendar-foot" aria-hidden>
            <span data-kit="calendar-readout">
              SEL <span data-kit="value">{readout(state.value, state.mode)}</span>
            </span>
            <span data-micro>{code}</span>
          </div>
        </>
      )}
    </SdkCalendar>
  )
}

export { Calendar, CalendarView }
