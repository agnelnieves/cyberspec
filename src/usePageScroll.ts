import { useLayoutEffect } from "react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

let pageScroll: Lenis | undefined

export function usePageScroll(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return
    const scroll = new Lenis({
      autoRaf: true,
      lerp: 0.15,
      allowNestedScroll: true,
      // Components such as the number input can consume a wheel gesture themselves.
      virtualScroll: ({ event }) => !event.defaultPrevented && !(event instanceof WheelEvent && event.shiftKey),
    })
    pageScroll = scroll

    // UI SDK locks the document while a modal is open. Stop interpolation
    // at that same position and give its scrollable content native input.
    const root = document.documentElement
    const syncLock = () => {
      if (root.style.overflowY === "hidden") scroll.stop()
      else scroll.start()
    }
    const lock = new MutationObserver(syncLock)
    lock.observe(root, { attributes: true, attributeFilter: ["style"] })
    syncLock()
    return () => {
      lock.disconnect()
      scroll.destroy()
      pageScroll = undefined
    }
  }, [enabled])
}

export function cancelPageMomentum() {
  if (pageScroll?.isScrolling !== "smooth" || pageScroll.isStopped) return
  pageScroll.stop()
  pageScroll.start()
}

export function scrollToPageAnchor(target: HTMLElement, smooth: boolean) {
  if (smooth && pageScroll && !pageScroll.isStopped) {
    // A lazy route may have mounted before Lenis remeasures the document.
    pageScroll.resize()
    pageScroll.scrollTo(target)
  } else target.scrollIntoView()
  // Preserve the browser's tab order after following an in-page link.
  if (target.tabIndex < 0 && !target.hasAttribute("tabindex")) {
    target.tabIndex = -1
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true })
  }
  target.focus({ preventScroll: true })
}
