import { useLayoutEffect, type RefObject } from "react"

// Mobile keyboards can resize and pan the visible viewport without changing dvh.
export function useOverlayViewport(open: boolean, ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const viewport = window.visualViewport
    const element = ref.current
    if (!open || !viewport || !element) return

    const clear = () => {
      element.style.removeProperty("--overlay-viewport-height")
      element.style.removeProperty("--overlay-viewport-top")
    }
    const measure = () => {
      if (viewport.scale !== 1) return clear()
      element.style.setProperty("--overlay-viewport-height", `${viewport.height}px`)
      element.style.setProperty("--overlay-viewport-top", `${viewport.offsetTop}px`)
    }
    measure()
    viewport.addEventListener("resize", measure)
    viewport.addEventListener("scroll", measure)
    return () => {
      viewport.removeEventListener("resize", measure)
      viewport.removeEventListener("scroll", measure)
      clear()
    }
  }, [open, ref])
}
