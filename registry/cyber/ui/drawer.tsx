import * as React from "react"
import { X } from "lucide-react"
import { Drawer as SdkDrawer, DrawerBackdrop, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@ui-sdk/react/drawer"
import type { ButtonTone } from "@/registry/cyber/ui/button"
import "@/registry/cyber/ui/cyber/button.css"
import "@/registry/cyber/ui/cyber/drawer.css"

type Side = NonNullable<React.ComponentProps<typeof SdkDrawer>["side"]>

// Which corners a sheet cuts: the two on the edge that faces the page.
const cuts = { right: "tl bl", left: "tr br", bottom: "tl tr", top: "bl br" } as const

// Narrow screens get the sheet from the bottom, where a thumb can reach it.
const narrow = "(max-width: 640px)"
const watchNarrow = (notify: () => void) => {
  const query = matchMedia(narrow)
  query.addEventListener("change", notify)
  return () => query.removeEventListener("change", notify)
}

// A sheet that slides in over the page: from the trailing edge on a wide
// screen, from the bottom on a narrow one. It can be dragged back toward its
// edge to close, and caught mid-way; ui-sdk moves it with a spring, so the
// skin leaves its position alone and only dresses it.
//
// - `trigger` is the label of the key that opens it; leave it out and
//   control it with `open` and `onOpenChange`, or a `controller`.
// - `title` names it in its title bar, beside the close key; `description`
//   is the line under that.
// - `children` are the body, which scrolls when it's taller than the sheet.
// - `side` pins the edge it comes from, on every screen.
// - `code` is the micro-print along its foot, beside a readout of how far
//   open it is.
function Drawer({
  trigger,
  triggerTone = "secondary",
  title,
  description,
  side,
  code = "CS-36 // SHEET",
  children,
  ...props
}: Omit<React.ComponentProps<typeof SdkDrawer>, "children" | "side"> & {
  trigger?: React.ReactNode
  triggerTone?: ButtonTone
  title: string
  description?: string
  side?: Side
  code?: string
  children?: React.ReactNode
}) {
  const small = React.useSyncExternalStore(
    watchNarrow,
    () => matchMedia(narrow).matches,
    () => false,
  )
  return (
    // The pointer driver on every side and every screen, so there's one
    // sheet to dress: the scroll-snap driver ui-sdk would pick for a bottom
    // sheet on a touch screen lays it out differently.
    <SdkDrawer driver="pointer" side={side ?? (small ? "bottom" : "end")} {...props}>
      {trigger != null && (
        <DrawerTrigger data-kit="button" data-frame="notch br" data-press-flash="" data-tone={triggerTone}>
          {trigger}
        </DrawerTrigger>
      )}
      <DrawerBackdrop data-kit="drawer-backdrop" />
      <DrawerContent data-kit="drawer">
        {(state) => (
          <div data-kit="drawer-surface" data-frame={cuts[state.side]}>
            <span data-kit="drawer-grip" aria-hidden />
            <header data-kit="drawer-bar">
              <DrawerTitle data-kit="drawer-title">{title}</DrawerTitle>
              <DrawerClose data-kit="drawer-close" data-frame="" data-press-flash="" aria-label="Close">
                <X aria-hidden />
              </DrawerClose>
            </header>
            {description && <DrawerDescription data-kit="drawer-description">{description}</DrawerDescription>}
            <div data-kit="drawer-body">{children}</div>
            <footer data-kit="drawer-foot" aria-hidden>
              <span data-micro>{code}</span>
              <span data-micro data-kit="drawer-travel" />
            </footer>
          </div>
        )}
      </DrawerContent>
    </SdkDrawer>
  )
}

export { Drawer }
