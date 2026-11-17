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
import { createAdjustmentSound, sfx } from "@/registry/cyber/lib/sound"
import "@/registry/cyber/ui/cyber/stepper.css"

// Typing already has its own sound, and resets and controller updates are
// not the person's hand. Buttons and keys get a directional sample; wheel
// and scrub movement use the same ticking as sliders and resize handles.
const steps: ReadonlySet<NumberInputValueChangeReason> = new Set(["step-key", "increment-press", "decrement-press", "wheel", "scrub"])

// A number set one step at a time: a minus key, the value on a readout, a
// plus key. Each step sounds in its direction. With both bounds set, a rail
// along the foot of the readout shows how far through the range the value
// is, and a MIN or MAX tag prints beside the label when it gets there; the
// key that can't go further is hatched.
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
  onValueCommit,
  ...props
}: Omit<React.ComponentProps<typeof NumberInput>, "children"> & {
  label: string
  hint?: React.ReactNode
  error?: string
}) {
  const adjustment = React.useMemo(createAdjustmentSound, [])
  React.useEffect(() => adjustment.stop, [adjustment])
  React.useEffect(() => {
    if (disabled || props.readOnly) adjustment.stop()
  }, [adjustment, disabled, props.readOnly])

  return (
    <Field data-kit="field" disabled={disabled} invalid={error ? true : undefined}>
      <NumberInput
        data-kit="stepper"
        min={min}
        max={max}
        {...props}
        onValueChange={(value, details) => {
          onValueChange?.(value, details)
          if (details.canceled) return adjustment.stop()
          if (!steps.has(details.reason)) return adjustment.stop()
          if (details.reason === "wheel" || details.reason === "scrub") {
            adjustment.move()
          } else {
            adjustment.stop()
            // Use the action itself, including keys that jump to a bound.
            // An empty or partly typed input has no useful prior value.
            const key = details.event && "key" in details.event ? details.event.key : undefined
            const increment = details.reason === "increment-press" || (details.reason === "step-key" && (key === "ArrowUp" || key === "PageUp" || key === "End"))
            sfx(increment ? "increment" : "decrement")
          }
          haptic("selection")
        }}
        onValueCommit={(value, details) => {
          adjustment.stop()
          onValueCommit?.(value, details)
        }}
        onBlur={(event) => {
          adjustment.stop()
          props.onBlur?.(event)
        }}
        onPointerCancel={(event) => {
          adjustment.stop()
          props.onPointerCancel?.(event)
        }}
        onLostPointerCapture={(event) => {
          adjustment.stop()
          props.onLostPointerCapture?.(event)
        }}
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
                {/* Accepted changes play the directional sound themselves. */}
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
