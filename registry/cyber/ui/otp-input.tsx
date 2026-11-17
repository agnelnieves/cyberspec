import * as React from "react"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { OTPInput as SdkOTPInput, OTPInputGroup, OTPInputSeparator, OTPInputSlot } from "@ui-sdk/react/otp-input"
import { burst } from "@/registry/cyber/lib/glitch"
import "@/registry/cyber/ui/cyber/otp-input.css"

// A short code, one cut cell per character. It's a single input underneath,
// so a pasted or autofilled code fills every cell at once and a screen
// reader hears one field. The cell typing goes to carries a caret, filled
// cells read in the signal color, and a readout beside the label counts
// them in. The moment the last cell fills, the code slips its channels once.
//
// - `length` is how many characters; `groupSize` is how many sit together
//   before a separator (threes, or halves of an even code, by default).
// - `pattern`: "digits" (the default), "letters", "alphanumeric" or a
//   regular expression. Letters show in capitals; the value keeps the case
//   that was typed.
// - `hint` describes the field; `error` marks it invalid with a message.
//
// Everything else goes to the SDK root: `value`, `onValueChange`,
// `onValueCommit` (runs when the code is complete), `name`, a `controller`.
function OtpInput({
  label,
  length = 6,
  groupSize = length % 3 === 0 ? 3 : length % 2 === 0 && length > 4 ? length / 2 : length,
  hint,
  error,
  disabled,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  ref,
  ...props
}: Omit<React.ComponentProps<typeof SdkOTPInput>, "children" | "maxLength"> & {
  label: string
  length?: number
  groupSize?: number
  hint?: React.ReactNode
  error?: string
}) {
  // The readout sits in the label's row, outside the SDK root (which is
  // only the cells and the input laid over them), so the count is kept from
  // the change callback: typing, a paste, a reset and an agent all pass it.
  const [typed, setTyped] = React.useState(() => (defaultValue ?? "").length)
  const filled = Math.min(length, value != null ? value.length : typed)
  const digits = Math.max(2, String(length).length)
  const root = React.useRef<HTMLDivElement | null>(null)

  const groups: number[][] = []
  for (let index = 0; index < length; index += groupSize) {
    groups.push(Array.from({ length: Math.min(groupSize, length - index) }, (_, offset) => index + offset))
  }

  return (
    <Field data-kit="field" disabled={disabled} invalid={error ? true : undefined}>
      <div data-kit="otp-input-head">
        <FieldLabel data-kit="label">{label}</FieldLabel>
        <span data-kit="otp-input-count" aria-hidden>
          {String(filled).padStart(digits, "0")}/{String(length).padStart(digits, "0")}
        </span>
      </div>
      <SdkOTPInput
        ref={(node) => {
          root.current = node
          if (typeof ref === "function") return ref(node)
          if (ref) ref.current = node
        }}
        data-kit="otp-input"
        maxLength={length}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          onValueChange?.(next, details)
          if (!details.canceled) setTyped(next.length)
        }}
        onValueCommit={(code, details) => {
          onValueCommit?.(code, details)
          if (root.current) burst(root.current, 320)
        }}
        {...props}
      >
        {groups.map((group, at) => (
          <React.Fragment key={group[0]}>
            {at > 0 && <OTPInputSeparator data-kit="otp-input-separator" />}
            <OTPInputGroup data-kit="otp-input-group">
              {group.map((index) => (
                <OTPInputSlot key={index} index={index} data-kit="otp-input-slot" data-frame="br" />
              ))}
            </OTPInputGroup>
          </React.Fragment>
        ))}
      </SdkOTPInput>
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

export { OtpInput }
