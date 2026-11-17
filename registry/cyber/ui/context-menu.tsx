import * as React from "react"
import { Menu as SdkMenu, MenuContextTrigger } from "@ui-sdk/react/menu"
import { MenuPopup, type MenuEntry } from "@/registry/cyber/ui/menu"
import "@/registry/cyber/ui/cyber/context-menu.css"

// An area with a menu of its own: right-click it, press and hold on a touch
// screen, or focus it and press Shift+F10 (or the menu key).
//
// - `label` names the area, since it's a tab stop.
// - `items` is the menu, as data (see MenuEntry in menu.tsx).
// - `children` replace the printed instructions with your own content. Keep
//   the three ways in somewhere on the screen if you do.
//
// A reticle marks the point the menu was opened from, for as long as it's
// open. Opened from the keyboard there's no such point, and no reticle.
function ContextMenu({
  label,
  items,
  children,
  ...props
}: Omit<React.ComponentProps<typeof SdkMenu>, "children" | "items"> & {
  label: string
  items: MenuEntry[]
  children?: React.ReactNode
}) {
  // Where the pointer last went down, measured from the area's corner. A
  // press (rather than the contextmenu event) covers a long press on iOS,
  // which sends no contextmenu. It's written straight to the element: it's
  // decoration, and not worth a render on every press.
  const mark = (event: React.PointerEvent<HTMLDivElement>) => {
    const area = event.currentTarget
    const box = area.getBoundingClientRect()
    area.style.setProperty("--at-x", `${event.clientX - box.left}px`)
    area.style.setProperty("--at-y", `${event.clientY - box.top}px`)
    area.toggleAttribute("data-pointed", true)
  }
  const unmark = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.currentTarget.toggleAttribute("data-pointed", false)
  }
  return (
    <SdkMenu {...props}>
      <MenuContextTrigger
        data-kit="context-menu"
        data-frame="tl br"
        tabIndex={0}
        role="group"
        aria-label={label}
        onPointerDown={mark}
        onKeyDown={unmark}
      >
        {children ?? (
          <>
            <span data-kit="context-menu-prompt" data-pointer="fine">
              Right-click, or press and hold
            </span>
            <span data-kit="context-menu-prompt" data-pointer="coarse">
              Press and hold
            </span>
            <span data-kit="context-menu-keys">
              or focus and press
              {/* The two keys stay on one line: they're pressed together. */}
              <span data-kit="context-menu-combo">
                <kbd data-kit="context-menu-key" data-frame="br">
                  Shift
                </kbd>
                <kbd data-kit="context-menu-key" data-frame="br">
                  F10
                </kbd>
              </span>
            </span>
          </>
        )}
        <span data-kit="context-menu-reticle" aria-hidden />
        <span data-micro aria-hidden>
          CTX // SECONDARY INPUT
        </span>
      </MenuContextTrigger>
      <MenuPopup items={items} />
    </SdkMenu>
  )
}

export { ContextMenu }
