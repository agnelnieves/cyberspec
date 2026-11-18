import { useLayoutEffect, useRef, type ComponentProps, type KeyboardEvent, type ReactNode } from "react"
import { Dialog, DialogBackdrop, DialogClose, DialogContent, DialogTitle } from "@ui-sdk/react/dialog"
import { X } from "lucide-react"
import { navigated } from "./navigation"
import { useOverlayViewport } from "./useOverlayViewport"
import "@/registry/cyber/ui/cyber/dialog.css"
import "@/registry/cyber/ui/cyber/drawer.css"
import "./mobile-menu-dialog.css"

type Props = Pick<ComponentProps<typeof DialogContent>, "keepMounted" | "finalFocus"> & {
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  children: ReactNode
}

function tabThroughMenu(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey) return
  // WebKit can skip links and tab into the page behind a top-layer dialog.
  // Native radio groups have one tab stop. Arrow keys still select a color.
  const stops = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
    'a[href],button,input:not([type="radio"]),input[type="radio"]:checked,[tabindex]',
  )).filter(node => node.tabIndex >= 0 && !node.matches(":disabled") &&
    !node.closest("[inert],[hidden]") && node.getClientRects().length > 0)
  if (!stops.length) return
  const current = stops.indexOf(document.activeElement as HTMLElement)
  const next = event.shiftKey ? (current > 0 ? current - 1 : stops.length - 1) : (current + 1) % stops.length
  event.preventDefault()
  stops[next].focus()
}

export function MobileMenuDialog({ title, open, onOpenChange, trigger, children, ...contentProps }: Props) {
  const dialog = useRef<HTMLDivElement>(null)
  useOverlayViewport(open, dialog)
  useLayoutEffect(() => {
    if (!open) return
    const close = () => onOpenChange(false)
    window.addEventListener("popstate", close)
    window.addEventListener(navigated, close)
    return () => {
      window.removeEventListener("popstate", close)
      window.removeEventListener(navigated, close)
    }
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogBackdrop data-kit="backdrop" />
      <DialogContent ref={dialog} className="mobile-menu-dialog" data-kit="dialog" initialFocus="content"
        onKeyDownCapture={tabThroughMenu} {...contentProps}>
        <div data-kit="drawer-bar">
          <DialogTitle data-kit="drawer-title">{title}</DialogTitle>
          <DialogClose data-kit="drawer-close" data-frame="" aria-label="Close"><X aria-hidden /></DialogClose>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  )
}
