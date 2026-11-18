import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { componentDocUrl, fragmentId, sidebarRoute } from "../navigation"
import { scrollToPageAnchor } from "../usePageScroll"
import { ComponentArticle } from "./ComponentArticle"
import { panels, type PanelSpec } from "./panels"
import "./sidebar-catalog.css"

function ArticleLinks() {
  const [active, setActive] = useState("example")
  useEffect(() => {
    const installation = document.getElementById("installation")
    if (!installation) return
    let installationY = 0
    const sync = () => {
      setActive(window.scrollY > 0 && window.scrollY >= installationY - 2 ? "installation" : "example")
    }
    const measure = () => {
      const inset = parseFloat(getComputedStyle(installation).scrollMarginTop) || 0
      const end = document.documentElement.scrollHeight - window.innerHeight
      // Short articles can reach the end before the heading reaches the header.
      installationY = Math.min(end, window.scrollY + installation.getBoundingClientRect().top - inset)
      sync()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    observer.observe(installation.parentElement!)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", sync, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", sync)
    }
  }, [])

  return (
    <nav className="article-links" aria-label="On this page">
      <p>On this page</p>
      <a href="#example" aria-current={active === "example" ? "location" : undefined}>Example</a>
      <a href="#installation" aria-current={active === "installation" ? "location" : undefined}>Installation</a>
    </nav>
  )
}

function ComponentPager({ index, sidebarOpen, compact = false }: { index: number; sidebarOpen: boolean; compact?: boolean }) {
  const steps = [
    { rel: "prev", label: "Previous", destination: panels[index - 1], Icon: ArrowLeft },
    { rel: "next", label: "Next", destination: panels[index + 1], Icon: ArrowRight },
  ]
  const iconButton = compact ? { "data-kit": "button", "data-icon": "", "data-frame": "br", "data-press-flash": "" } : {}
  return (
    <nav className={compact ? "component-heading-pager" : "component-pager"}
      aria-label={compact ? "Component navigation" : "Browse adjacent components"}>
      {steps.map(({ rel, label, destination, Icon }) => {
        if (!destination) return compact && (
          <button key={rel} type="button" disabled aria-label={`No ${label.toLowerCase()} component`} {...iconButton}>
            <Icon aria-hidden />
          </button>
        )
        const name = `${label} component, ${destination.title}`
        return (
          <a key={rel} href={componentDocUrl(destination.name, sidebarOpen)} rel={rel}
            aria-label={compact ? name : undefined} title={compact ? name : undefined} {...iconButton}>
            {rel === "prev" && <Icon aria-hidden />}
            {!compact && <span><small>{label}</small>{destination.title}</span>}
            {rel === "next" && <Icon aria-hidden />}
          </a>
        )
      })}
    </nav>
  )
}

export default function SidebarCatalog({ spec, sidebarOpen }: { spec?: PanelSpec; sidebarOpen: boolean }) {
  const previous = useRef(spec)
  useLayoutEffect(() => {
    // A direct link can arrive before this route's code has loaded.
    if (location.hash) {
      const target = document.getElementById(fragmentId(location.hash))
      if (target) scrollToPageAnchor(target, false)
    } else if (previous.current !== spec && !document.getElementById("component-index")?.contains(document.activeElement)) {
      document.getElementById("component-title")?.focus({ preventScroll: true })
    }
    previous.current = spec
  }, [spec])

  if (!spec) return <header data-kit="page-head">
    <h1>Component not found</h1>
    <a href={`/${sidebarRoute}`} data-kit="link">Browse components</a>
  </header>

  const index = panels.indexOf(spec)
  return (
    <div className="sidebar-catalog">
      <div className="sidebar-reading">
        <ComponentArticle key={spec.name} spec={spec}
          pager={<ComponentPager index={index} sidebarOpen={sidebarOpen} compact />} />
        <ComponentPager index={index} sidebarOpen={sidebarOpen} />
      </div>
      <ArticleLinks key={spec.name} />
    </div>
  )
}
