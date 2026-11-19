import { useLayoutEffect } from "react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

let pageScroll: Lenis | undefined

export function getPageScroller(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-site-scrollport]") ?? document.documentElement
}

export function getPageScrollTarget(): HTMLElement | Window {
  const scroller = getPageScroller()
  return scroller === document.documentElement ? window : scroller
}

export function usePageScroll(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return
    const wrapper = getPageScrollTarget()
    const content = document.querySelector<HTMLElement>("[data-site-scroll]")!
    const scroll = new Lenis({
      wrapper,
      content: wrapper === window ? document.documentElement : content,
      autoRaf: true,
      lerp: 0.15,
      allowNestedScroll: true,
      // Components such as the number input can consume a wheel gesture themselves.
      virtualScroll: ({ event }) => !event.defaultPrevented && !(event instanceof WheelEvent && event.shiftKey),
    })
    pageScroll = scroll

    // Lenis moves the document in requestAnimationFrame, after CSS scroll
    // timelines are sampled. Move the frame clip in that same paint.
    if (wrapper === window) {
      scroll.on("scroll", () => {
        if (scroll.isScrolling === "smooth") content.style.setProperty("--frame-scroll-y", `${scroll.actualScroll}px`)
        else content.style.removeProperty("--frame-scroll-y")
      })
    }

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
      content.style.removeProperty("--frame-scroll-y")
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
    // Lenis measures from the wrapper's outer box; the native scrollport starts
    // inside its border. Match the positioning of a native fragment jump.
    pageScroll.scrollTo(target, { offset: -getPageScroller().clientTop })
  } else target.scrollIntoView()
  // Preserve the browser's tab order after following an in-page link.
  if (target.tabIndex < 0 && !target.hasAttribute("tabindex")) {
    target.tabIndex = -1
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true })
  }
  target.focus({ preventScroll: true })
}
