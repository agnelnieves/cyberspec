import * as React from "react"
import { Menu as SdkMenu, MenuTrigger } from "@ui-sdk/react/menu"
import { Menubar as SdkMenubar } from "@ui-sdk/react/menubar"
import { MenuPopup, type MenuEntry } from "@/registry/cyber/ui/menu"
import "@/registry/cyber/ui/cyber/menubar.css"

type MenubarMenu = {
  /** The trigger's text and its name. Keep it one word: typing its first letter finds it. */
  label: string
  /** The menu, as data (see MenuEntry in menu.tsx). */
  items: MenuEntry[]
  /** Stays focusable, so it can be found, but doesn't open. */
  disabled?: boolean
}

type MenuCallbacks = Pick<React.ComponentProps<typeof SdkMenu>, "onAction" | "onCheckedChange" | "onValueChange">

// The menus of an application, on one bar. Tab lands on the bar once; Left
// and Right move between menus, Down opens one, and once one is open,
// pointing at another switches to it.
//
// - `label` names the bar.
// - `menus` is each menu's label and its items.
// - `onAction`, `onCheckedChange` and `onValueChange` report from every menu
//   on the bar, the way they do on a single Menu.
// - `code` is the micro-print at the far end. The lamp beside it lights, and
//   its last word changes, while a menu is open.
function Menubar({
  label,
  menus,
  code = "CS-07",
  onAction,
  onCheckedChange,
  onValueChange,
  ...props
}: Omit<React.ComponentProps<typeof SdkMenubar>, "children"> &
  MenuCallbacks & {
    label: string
    menus: MenubarMenu[]
    code?: string
  }) {
  return (
    <SdkMenubar data-kit="menubar" data-frame="spine br" aria-label={label} {...props}>
      {menus.map((menu) => (
        <SdkMenu key={menu.label} onAction={onAction} onCheckedChange={onCheckedChange} onValueChange={onValueChange}>
          <MenuTrigger data-kit="menubar-trigger" data-frame="br" data-press-flash="" disabled={menu.disabled}>
            {menu.label}
          </MenuTrigger>
          {/* The gap clears the bar's own edge, so the menu hangs under the bar rather than under the key. */}
          <MenuPopup items={menu.items} sideOffset={9} />
        </SdkMenu>
      ))}
      <span data-kit="menubar-status" data-micro aria-hidden>
        {code}
      </span>
    </SdkMenubar>
  )
}

export { Menubar }
export type { MenubarMenu }
