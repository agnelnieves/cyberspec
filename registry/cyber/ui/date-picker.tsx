import * as React from "react"
import {
  DatePicker as SdkDatePicker,
  DatePickerContent,
  DatePickerHint,
  DatePickerInput,
  DatePickerTrigger,
} from "@ui-sdk/react/date-picker"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { CalendarDays } from "lucide-react"
import { CalendarView } from "@/registry/cyber/ui/calendar"
import "@/registry/cyber/ui/cyber/calendar.css"
import "@/registry/cyber/ui/cyber/date-picker.css"

// Tells the field, which sits outside the picker, whether the text in the
// picker is a date. Renders nothing.
function Report({ invalid, onChange }: { invalid: boolean; onChange: (invalid: boolean) => void }) {
  React.useEffect(() => onChange(invalid), [invalid, onChange])
  return null
}

// A date you can type or pick: the text sits in the shared control frame
// with a calendar key at its end, and the key opens the kit's calendar in a
// popup. The format the field reads is printed beside the label, in the
// page's language, and describes the input to a screen reader.
//
// - `hint` sits under the control. `error` is the message shown, in yellow,
//   while the field is invalid; pass `invalid` to show it from your own
//   code. Text that isn't a date flags the field by itself, as soon as it's
//   entered, with the SDK's own message.
// - Everything else goes to the SDK's DatePicker: `value`, `defaultValue`
//   and `onValueChange` (ISO dates, like "2026-11-21"), `min`, `max`,
//   `unavailable`, `name`, `required`, `disabled`, `controller`.
function DatePicker({
  label,
  hint,
  error,
  invalid,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof SdkDatePicker>, "children" | "mode"> & {
  label: string
  hint?: string
  error?: string
  invalid?: boolean
}) {
  // The popup hangs from the whole framed control, not the bare input in it.
  const [control, setControl] = React.useState<HTMLDivElement | null>(null)
  // Left alone, a field only reports what the browser finds wrong once its
  // form is submitted. Text that isn't a date turns the frame yellow at
  // once, so the words have to arrive with it.
  const [unread, setUnread] = React.useState(false)

  return (
    <Field data-kit="field" disabled={disabled} invalid={invalid ?? (unread ? true : undefined)}>
      <SdkDatePicker data-kit="date-picker" disabled={disabled} {...props}>
        {(state) => (
          <>
            <Report invalid={state.invalid} onChange={setUnread} />
            <div data-kit="date-picker-head">
              <FieldLabel data-kit="label">{label}</FieldLabel>
              <DatePickerHint data-kit="date-picker-format" />
            </div>
            <div ref={setControl} data-kit="control" data-frame="br" data-frame-focus="within">
              {/* The frame lights for whichever of these has focus, so
                  neither draws a ring of its own. */}
              <DatePickerInput data-focus-quiet="" />
              <DatePickerTrigger data-kit="date-picker-trigger" data-focus-quiet="">
                <CalendarDays aria-hidden />
              </DatePickerTrigger>
            </div>
            <DatePickerContent data-kit="date-picker-popup" data-frame="tr bl" anchor={control} align="start" sideOffset={4}>
              <CalendarView />
            </DatePickerContent>
          </>
        )}
      </SdkDatePicker>
      {hint && <FieldDescription data-kit="hint">{hint}</FieldDescription>}
      {invalid && error ? (
        <FieldError data-kit="field-error" match>
          {error}
        </FieldError>
      ) : (
        <FieldError data-kit="field-error">{unread ? undefined : error}</FieldError>
      )}
    </Field>
  )
}

export { DatePicker }
