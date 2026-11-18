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
import { getSitePage } from "./site-pages"
import { syncPageHead } from "./site-metadata"
import { canonicalizeLocation, fragmentId, isSidebarRoute, navigate, navigated } from "./navigation"
import { cancelPageMomentum, scrollToPageAnchor } from "./usePageScroll"

const subscribe = (notify: () => void) => {
  const onHistory = () => {
    cancelPageMomentum()
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
  if (link.origin !== location.origin || !getSitePage(link.pathname)) return
  // Leave text fragments and other browser-managed destinations to the browser.
  if (link.pathname === location.pathname && link.search === location.search && link.hash &&
      !document.getElementById(fragmentId(link.hash))) return
  event.preventDefault()
  navigate(link.href)
})

function App() {
  const href = useSyncExternalStore(subscribe, currentHref)
  const { pathname } = new URL(href)
  const route = pathname.replace(/^\/+|\/+$/g, "")
  const page = getSitePage(pathname)
  useLayoutEffect(() => {
    if (page) syncPageHead(page)
  }, [page])
  useLayoutEffect(() => {
    // The router handles in-page links. Initial and cross-page deep links
    // need their destination content to have mounted before positioning.
    if (!location.hash || isSidebarRoute(route)) return
    const target = document.getElementById(fragmentId(location.hash))
    if (target) scrollToPageAnchor(target, false)
  }, [route])
  return (
    <>
      <Site route={route} />
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
