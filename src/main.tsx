import "@fontsource/rajdhani/400.css"
import "@fontsource/rajdhani/500.css"
import "@fontsource/rajdhani/600.css"
import "@fontsource/rajdhani/700.css"
import "@fontsource-variable/jetbrains-mono"
import "./base.css"
import "@/registry/cyber/ui/cyber/skin.css"
import "./site.css"
import { StrictMode, useSyncExternalStore } from "react"
import { createRoot } from "react-dom/client"
import { Analytics } from "@vercel/analytics/react"
import { installCyber } from "@/registry/cyber/lib/install"
import "@/registry/cyber/blocks/daemon/bridge"
import { Site } from "./Site"

const navigated = "cyberspec:navigate"
const subscribe = (notify: () => void) => {
  addEventListener("popstate", notify)
  addEventListener(navigated, notify)
  return () => {
    removeEventListener("popstate", notify)
    removeEventListener(navigated, notify)
  }
}
const useRoute = () => useSyncExternalStore(subscribe, () => location.pathname.replace(/^\/+|\/+$/g, ""))

// Same-site links navigate in place: the page changes without a reload.
// Links opening elsewhere (a new tab, a modifier key, a download, a file)
// are left to the browser.
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null
  if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return
  if (link.origin !== location.origin || /\.[a-z0-9]+$/i.test(link.pathname)) return
  const samePage = link.pathname === location.pathname
  // An in-page link (#slider) is the browser's to scroll.
  if (samePage && link.hash) return
  event.preventDefault()
  if (samePage) return
  history.pushState(null, "", link.pathname + link.hash)
  dispatchEvent(new Event(navigated))
  scrollTo(0, 0)
})

function App() {
  const route = useRoute()
  return (
    <>
      <Site route={route} />
      <Analytics />
    </>
  )
}

installCyber()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
