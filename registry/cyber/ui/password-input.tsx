import * as React from "react"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { PasswordInput as SdkPasswordInput, PasswordInputControl, PasswordInputToggle } from "@ui-sdk/react/password-input"
import { Eye, EyeOff, KeyRound } from "lucide-react"
import "@/registry/cyber/ui/cyber/password-input.css"

// A secret in the kit's field box, with an eye key beside it that shows and
// hides what's typed. Shown, the text switches to the mono face, where 0 and
// O, and 1 and l, can be told apart. A CAPS tag lights over the box while
// Caps Lock is on.
//
// - `hint` describes the field; `error` marks it invalid with a message.
// - `toggleLabel` names the eye key. It says what the key does and stays the
//   same in both states; whether it's pressed carries the rest.
// - `placeholder` goes to the input. Everything else goes to the SDK root:
//   `value`, `onValueChange`, `visible`, `defaultVisible`, `name`,
//   `required`, `readOnly`, `autoComplete`, a `controller`.
function PasswordInput({
  label,
  hint,
  error,
  toggleLabel = `Show ${label.toLowerCase()}`,
  placeholder,
  disabled,
  required,
  ...props
}: Omit<React.ComponentProps<typeof SdkPasswordInput>, "children"> & {
  label: string
  hint?: React.ReactNode
  error?: string
  toggleLabel?: string
  placeholder?: string
}) {
  return (
    <Field data-kit="field" disabled={disabled} invalid={error ? true : undefined}>
      <SdkPasswordInput data-kit="password-input" required={required} {...props}>
        {(state) => (
          <>
            <div data-kit="password-input-head">
              <FieldLabel data-kit="label">{label}</FieldLabel>
              <span data-kit="password-input-tags" aria-hidden>
                {state.capsLock && <span data-kit="password-input-caps">CAPS</span>}
                {required && <span data-kit="password-input-tag">REQ</span>}
              </span>
            </div>
            <div data-kit="password-input-row">
              <div data-kit="control" data-frame="br" data-frame-focus="within">
                <span data-kit="password-input-tick" aria-hidden />
                <span data-kit="control-icon" aria-hidden>
                  <KeyRound />
                </span>
                <PasswordInputControl data-kit="password-input-control" placeholder={placeholder} />
              </div>
              {/* On while shown, so its sound is the one a latch makes: the
                  page's listener reads it before the press lands. */}
              <PasswordInputToggle
                data-kit="password-input-toggle"
                data-frame="br"
                data-press-flash=""
                data-sfx={state.visible ? "off" : "on"}
                aria-label={toggleLabel}
              >
                {state.visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </PasswordInputToggle>
            </div>
            {/* The CAPS tag, for a screen reader: said once as it turns on. */}
            <span data-sr-only role="status">
              {state.capsLock ? "Caps Lock is on." : ""}
            </span>
          </>
        )}
      </SdkPasswordInput>
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

export { PasswordInput }
