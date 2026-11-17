import * as React from "react"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
  type NumberInputValueChangeReason,
} from "@ui-sdk/react/number-input"
import { Minus, Plus } from "lucide-react"
import { haptic } from "@/registry/cyber/lib/haptics"
import { sfx } from "@/registry/cyber/lib/sound"
import "@/registry/cyber/ui/cyber/stepper.css"

// The changes that are a step, and so tick. Typing a number has the sound of
// typing already, and a reset or a controller is not the person's hand.
const steps: ReadonlySet<NumberInputValueChangeReason> = new Set(["step-key", "increment-press", "decrement-press", "wheel", "scrub"])

// A number set one step at a time: a minus key, the value on a readout, a
// plus key. Each step ticks. With both bounds set, a rail along the foot of
// the readout shows how far through the range the value is, and a MIN or
// MAX tag prints beside the label when it gets there; the key that can't go
// further is hatched.
//
// The readout is a text input, so a number can be typed too; arrow keys,
// Page Up and Down, Home and End step it. The keys stay out of the Tab
// order, since the focused readout already has them on its arrows.
//
// - `hint` describes the field; `error` marks it invalid with a message.
// - Everything else goes to the SDK root: `value`, `defaultValue`,
//   `onValueChange`, `onValueCommit`, `min`, `max`, `step`, `format`,
//   `name`, a `controller`.
function Stepper({
  label,
  hint,
  error,
  disabled,
  min,
  max,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof NumberInput>, "children"> & {
  label: string
  hint?: React.ReactNode
  error?: string
}) {
  return (
    <Field data-kit="field" disabled={disabled} invalid={error ? true : undefined}>
      <NumberInput
        data-kit="stepper"
        min={min}
        max={max}
        onValueChange={(value, details) => {
          onValueChange?.(value, details)
          if (details.canceled || !steps.has(details.reason)) return
          sfx("tick")
          haptic("selection")
        }}
        {...props}
      >
        {(state) => {
          const atMin = min != null && state.value != null && state.value <= min
          const atMax = max != null && state.value != null && state.value >= max
          const ranged = min != null && max != null && max > min
          const through = ranged && state.value != null ? Math.min(1, Math.max(0, (state.value - min) / (max - min))) : 0
          return (
            <>
              <div data-kit="stepper-head">
                <FieldLabel data-kit="label">{label}</FieldLabel>
                {(atMin || atMax) && (
                  <span data-kit="stepper-tag" aria-hidden>
                    {atMin ? "MIN" : "MAX"}
                  </span>
                )}
              </div>
              <NumberInputGroup data-kit="stepper-row">
                {/* The keys play no press of their own: the step ticks. */}
                <NumberInputDecrement data-kit="stepper-key" data-frame="bl" data-press-flash="" data-sfx="none" aria-label={`Decrease ${label}`}>
                  <Minus aria-hidden />
                </NumberInputDecrement>
                <div data-kit="control" data-frame="" data-frame-focus="within">
                  <NumberInputControl data-kit="stepper-value" />
                  {ranged && <span data-kit="stepper-rail" aria-hidden style={{ "--through": through } as React.CSSProperties} />}
                </div>
                <NumberInputIncrement data-kit="stepper-key" data-frame="br" data-press-flash="" data-sfx="none" aria-label={`Increase ${label}`}>
                  <Plus aria-hidden />
                </NumberInputIncrement>
              </NumberInputGroup>
              {/* The readout is a plain text input, with no range for a
                  screen reader to hear, so reaching a bound is said. */}
              <span data-sr-only role="status">
                {atMin ? "Minimum." : atMax ? "Maximum." : ""}
              </span>
            </>
          )
        }}
      </NumberInput>
      {hint && <FieldDescription data-kit="hint">{hint}</FieldDescription>}
      {error ? (
        <FieldError data-kit="field-error" match>
          {error}
        </FieldError>
      ) : (
        <FieldError data-kit="field-error" />
      )}
    </Field>
  )
}

export { Stepper }
