import * as React from "react"
import { fxLevel, onFxChange, type FxLevel } from "@/registry/cyber/lib/fx"
import { installCyber } from "@/registry/cyber/lib/install"
import "@/registry/cyber/ui/cyber/skin.css"

// Installed as this module loads rather than in an effect: the observer
// behind the agent signal has to be listening before components are created.
installCyber()

type Accent = { l: number; c: number; h: number }

// The root of the cyber skin. Everything inside it is styled by the skin.
//
// - `accent` is the theme color as an OKLCH lightness, chroma and hue;
//   without it the kit is its default red.
// - `fx` pins the FX level for this root ("full", "calm" or "off"). Leave it
//   out to follow the person's choice, and the system's reduced-motion
//   setting before they've made one.
function Cyber({
  accent,
  fx,
  style,
  ...props
}: React.ComponentProps<"div"> & { accent?: Accent; fx?: FxLevel }) {
  const level = React.useSyncExternalStore(
    onFxChange,
    fxLevel,
    // On the server the level isn't known; the stylesheet falls back to the
    // system setting until the page hydrates.
    () => undefined,
  )
  const theme = accent && ({ "--theme-l": accent.l, "--theme-c": accent.c, "--theme-h": accent.h } as React.CSSProperties)
  return <div data-skin="cyber" data-fx={fx ?? level} data-fx-pinned={fx ? "" : undefined} style={{ ...theme, ...style }} {...props} />
}

export { Cyber }
export type { Accent }
