import * as React from "react"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { Radio, RadioGroup as SdkRadioGroup, RadioIndicator } from "@ui-sdk/react/radio"
import "@/registry/cyber/ui/cyber/radio-group.css"

type RadioOption<T extends string = string> = {
  value: T
  label: string
  hint?: string
  disabled?: boolean
}

// One of several, as a column of rows: a diamond, a label, and a line of
// explanation where an option needs one. The chosen diamond lights and holds
// a pip; hovering another row previews its pip before it's picked.
//
// - `options` are the rows. A bare string is both the value and the label.
// - `hint` describes the whole group; `error` is shown, in yellow, while the
//   group is invalid (a `required` group submitted with nothing chosen).
function RadioGroup<T extends string = string>({
  label,
  hint,
  error,
  options,
  ...props
}: Omit<React.ComponentProps<typeof SdkRadioGroup<T>>, "children"> & {
  label: string
  hint?: string
  error?: string
  options: (T | RadioOption<T>)[]
}) {
  return (
    <Field data-kit="field">
      <div data-kit="radio-legend">
        <FieldLabel data-kit="label">{label}</FieldLabel>
      </div>
      {hint && <FieldDescription data-kit="hint">{hint}</FieldDescription>}
      <SdkRadioGroup<T> data-kit="radio-group" {...props}>
        {options.map((entry) => {
          const option: RadioOption<T> = typeof entry === "string" ? { value: entry, label: entry } : entry
          return (
            // Each row is a field of its own, which is how the SDK ties a
            // radio to its label and its description.
            <Field key={option.value} data-kit="radio-row" disabled={option.disabled}>
              <Radio data-kit="radio" data-press-flash="" value={option.value} disabled={option.disabled}>
                <RadioIndicator data-kit="radio-indicator" keepMounted aria-hidden />
              </Radio>
              <FieldLabel data-kit="radio-label">{option.label}</FieldLabel>
              {option.hint && <FieldDescription data-kit="hint">{option.hint}</FieldDescription>}
            </Field>
          )
        })}
      </SdkRadioGroup>
      {error && <FieldError data-kit="field-error">{error}</FieldError>}
    </Field>
  )
}

export { RadioGroup }
export type { RadioOption }
