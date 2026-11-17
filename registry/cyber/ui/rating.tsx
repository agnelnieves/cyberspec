import * as React from "react"
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field"
import { Rating as SdkRating, RatingItem } from "@ui-sdk/react/rating"
import "@/registry/cyber/ui/cyber/rating.css"

// A level on a short scale: a threat, a tier, a clearance. A row of diamond
// pips on a hairline, lit up to the level, with the one it ends in holding a
// signal core; the level is printed at the end of the label's line as a
// number, and in a word when `levels` names them.
//
// - `levels` are the names of each whole level, lowest first ("Low",
//   "Guarded", …). The current one is printed, and all are read out by assistive
//   technology, so a pip is "Elevated, 3 of 5" rather than "3 stars".
// - `step={0.5}` (the SDK's) allows half levels; each pip widens so both of
//   its halves stay big enough to press.
// - `readOnly` shows a level that can't change, as one image named by its
//   label and level. It can be any number, like 3.4.
function Rating({
  label,
  hint,
  levels,
  max = 5,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  getValueLabel,
  ...props
}: Omit<React.ComponentProps<typeof SdkRating>, "children"> & {
  label: string
  hint?: string
  levels?: string[]
}) {
  // The readout sits outside the pips, so it follows the value from here:
  // the controlled one, or a copy kept of the uncontrolled one.
  const [inner, setInner] = React.useState<number | null>(defaultValue ?? null)
  const shown = value !== undefined ? value : inner
  const levelOf = (score: number) => levels?.[Math.max(1, Math.ceil(score)) - 1]
  const level = shown === null ? undefined : levelOf(shown)

  const nameOf =
    getValueLabel ??
    ((score: number, of: number) => {
      const name = levelOf(score)
      return name ? `${name}, ${score} of ${of}` : `${score} of ${of}`
    })

  return (
    <Field data-kit="field">
      <div data-kit="rating-head">
        {/* Read-only, the pips are one image that names itself, level
            included, so the label is only what's seen. */}
        {props.readOnly ? <span data-kit="label">{label}</span> : <FieldLabel data-kit="label">{label}</FieldLabel>}
        <span data-kit="rating-readout" data-empty={shown === null ? "" : undefined} data-disabled={props.disabled ? "" : undefined} aria-hidden>
          {level && <span data-kit="rating-level">{level}</span>}
          {shown ?? "-"}
          <span data-kit="rating-max">/{max}</span>
        </span>
      </div>
      <SdkRating
        data-kit="rating"
        data-halves={step < 1 ? "" : undefined}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next, details) => {
          onValueChange?.(next, details)
          if (!details.canceled) setInner(next)
        }}
        getValueLabel={props.readOnly ? (score, of) => `${label}: ${nameOf(score, of)}` : nameOf}
        {...props}
      >
        <RatingItem data-kit="rating-item">
          <span data-kit="rating-pip" aria-hidden />
        </RatingItem>
      </SdkRating>
      {hint && <FieldDescription data-kit="hint">{hint}</FieldDescription>}
    </Field>
  )
}

export { Rating }
