import { panels } from "./catalog/panels"
import { cancelPageMomentum, scrollToPageAnchor } from "./usePageScroll"

const navigated = "cyberspec:navigate"
const sidebarRoute = "components/sidebar"
function isSidebarRoute(route: string) {
  return route === sidebarRoute || route.startsWith(`${sidebarRoute}/`)
}
function isCatalogSidebarOpen(route: string) {
  const state = new URLSearchParams(location.search).get("sidebar")
  return isSidebarRoute(route) ? state !== "closed" : route === "components" && state === "open"
}
function componentDocUrl(name: string, sidebarOpen = true) {
  return `/${sidebarRoute}/${name}${sidebarOpen ? "" : "?sidebar=closed"}`
}
const catalogAnchors = new Set(["components", ...panels.flatMap((panel) => [panel.name, `group-${panel.group}`])])

function fragmentId(hash: string) {
  const id = hash.slice(1)
  try { return decodeURIComponent(id) } catch { return id }
}

// Earlier catalog URLs used root fragments. The two former landing routes
// used #components for their interactive sample instead.
function canonicalUrl(href: string) {
  const url = new URL(href, location.href)
  const path = url.pathname.replace(/\/+$/, "")
  if (path === "/landing" || path === "/landing-v2") {
    url.pathname = "/"
    if (fragmentId(url.hash) === "components") url.hash = "try-controls"
  }
  if (url.pathname === "/" && catalogAnchors.has(fragmentId(url.hash))) {
    url.pathname = "/components"
  }
  return url
}

function canonicalizeLocation() {
  const url = canonicalUrl(location.href)
  if (url.href !== location.href) history.replaceState(history.state, "", url)
}

function navigate(href: string, { scroll = true } = {}) {
  const url = canonicalUrl(href)
  const samePage = url.pathname === location.pathname
  cancelPageMomentum()
  if (url.href !== location.href) {
    history.pushState(null, "", url)
    dispatchEvent(new Event(navigated))
  }
  if (!scroll) return
  if (!url.hash) window.scrollTo(0, 0)
  else if (samePage) {
    const target = document.getElementById(fragmentId(url.hash))
    if (target) scrollToPageAnchor(target, true)
  }
}

export { canonicalizeLocation, componentDocUrl, fragmentId, isCatalogSidebarOpen, isSidebarRoute, navigate, navigated, sidebarRoute }
