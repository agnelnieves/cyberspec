import * as React from "react"
import { Toggle as SdkToggle, ToggleIcon } from "@ui-sdk/react/toggle"
import "@/registry/cyber/ui/cyber/toggle.css"

type Size = "sm" | "md"

// A latching key: press it and it stays lit until it's pressed again. It's
// cut like a Button, with a lamp in its far corner that's hollow while off
// and solid while on, so the state never rests on the fill alone.
//
// - `icon` goes before the label. With no label the key is square, and
//   needs an aria-label.
// - Keep the label the same in both states: "Silent mode", not "Unmute".
//   Assistive technology announces whether it's pressed.
//
// The rest goes to ui-sdk's Toggle: `pressed`, `defaultPressed`,
// `onPressedChange`, `disabled`, `controller`, and `value` inside a group.
function Toggle({
  size = "md",
  icon,
  mirror,
  children,
  ...props
}: Omit<React.ComponentProps<typeof SdkToggle>, "children" | "render"> & {
  size?: Size
  icon?: React.ReactNode
  /** Flips the icon in right-to-left text, for one that points a way. */
  mirror?: boolean
  children?: React.ReactNode
}) {
  return (
    <SdkToggle
      data-kit="toggle"
      data-frame="notch br"
      data-press-flash=""
      data-size={size}
      data-icon-only={icon != null && children == null ? "" : undefined}
      {...props}
      // The page plays a sound for every press from what was pressed. This
      // one is a latch, so it says which way it's about to go: the click is
      // heard before the state changes.
      render={(part, state) => <button {...part} data-sfx={state.pressed ? "off" : "on"} />}
    >
      {icon != null && (
        <ToggleIcon data-kit="toggle-icon" mirror={mirror}>
          {icon}
        </ToggleIcon>
      )}
      {children}
      <span data-kit="toggle-lamp" aria-hidden />
    </SdkToggle>
  )
}

export { Toggle }
export type { Size as ToggleSize }
