import "@fontsource/rajdhani/400.css"
import "@fontsource/rajdhani/500.css"
import "@fontsource/rajdhani/600.css"
import "@fontsource/rajdhani/700.css"
import "@fontsource-variable/jetbrains-mono"
import "@fontsource-variable/kode-mono"
import "./base.css"
import "@/registry/cyber/ui/cyber/skin.css"
import "./site.css"
import { StrictMode, useLayoutEffect, useSyncExternalStore } from "react"
import { createRoot } from "react-dom/client"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import { installCyber } from "@/registry/cyber/lib/install"
import "@/registry/cyber/blocks/daemon/bridge"
import { Site } from "./Site"
import { canonicalizeLocation, fragmentId, navigate, navigated } from "./navigation"

const subscribe = (notify: () => void) => {
  const onHistory = () => {
    canonicalizeLocation()
    notify()
  }
  addEventListener("popstate", onHistory)
  addEventListener("hashchange", onHistory)
  addEventListener(navigated, notify)
  return () => {
    removeEventListener("popstate", onHistory)
    removeEventListener("hashchange", onHistory)
    removeEventListener(navigated, notify)
  }
}
const currentHref = () => location.href

// Same-site links navigate in place: the page changes without a reload.
// Links opening elsewhere (a new tab, a modifier key, a download, a file)
// are left to the browser.
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
  if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return
  if (link.origin !== location.origin || /\.[a-z0-9]+$/i.test(link.pathname)) return
  const samePage = link.pathname === location.pathname && link.search === location.search
  // An in-page link (#slider) is the browser's to scroll.
  if (samePage && link.hash) return
  event.preventDefault()
  navigate(link.href)
})

function App() {
  const href = useSyncExternalStore(subscribe, currentHref)
  const { pathname, hash } = new URL(href)
  useLayoutEffect(() => {
    if (!hash) return
    // A cross-route fragment only exists after React commits the destination.
    const target = document.getElementById(fragmentId(hash))
    target?.scrollIntoView()
    if (target?.hasAttribute("tabindex")) target.focus({ preventScroll: true })
  }, [pathname, hash])
  return (
    <>
      <Site route={pathname.replace(/^\/+|\/+$/g, "")} />
      <Analytics />
      <SpeedInsights />
    </>
  )
}

canonicalizeLocation()
installCyber()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
