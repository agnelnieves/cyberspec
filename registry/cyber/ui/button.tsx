import * as React from "react"
import { Button as SdkButton } from "@ui-sdk/react/button"
import "@/registry/cyber/ui/cyber/button.css"

type Tone = "primary" | "secondary" | "ghost" | "signal" | "flag"
type Size = "sm" | "md" | "lg"

// A key on a display: a cut frame with a raised tab along its top edge.
//
// - `tone`: "secondary" is an outline; "primary" is lit; "ghost" has no edge
//   until hovered; "signal" is the cyan of values and agents; "flag" is the
//   solid yellow of the one choice that matters.
// - `icon`: a button holding only an icon is square. Give it an aria-label.
//
// Returning a Promise from onClick keeps it pending, with a bar running
// along its foot, until the Promise settles.
function Button({
  tone = "secondary",
  size = "md",
  icon,
  ...props
}: React.ComponentProps<typeof SdkButton> & { tone?: Tone; size?: Size; icon?: boolean }) {
  return (
    <SdkButton
      data-kit="button"
      data-frame={tone === "ghost" ? "br" : "notch br"}
      data-press-flash=""
      data-tone={tone}
      data-size={size}
      data-icon={icon ? "" : undefined}
      {...props}
    />
  )
}

export { Button }
export type { Size as ButtonSize, Tone as ButtonTone }
