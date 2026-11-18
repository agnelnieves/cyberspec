import { useEffect, useLayoutEffect, useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { fragmentId, sidebarRoute } from "../navigation"
import { scrollToPageAnchor } from "../usePageScroll"
import { ComponentArticle } from "./ComponentArticle"
import { ComponentIndex } from "./ComponentIndex"
import { panels } from "./panels"
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

function ComponentPager({ index }: { index: number }) {
  const previous = panels[index - 1]
  const next = panels[index + 1]
  return (
    <nav className="component-pager" aria-label="Browse adjacent components">
      {previous && <a href={`/${sidebarRoute}/${previous.name}`} rel="prev">
        <ArrowLeft aria-hidden /><span><small>Previous</small>{previous.title}</span>
      </a>}
      {next && <a href={`/${sidebarRoute}/${next.name}`} rel="next">
        <span><small>Next</small>{next.title}</span><ArrowRight aria-hidden />
      </a>}
    </nav>
  )
}

export default function SidebarCatalog({ name }: { name: string }) {
  const index = name ? panels.findIndex(panel => panel.name === name) : 0
  const spec = panels[index]

  useLayoutEffect(() => {
    const originalTitle = document.title
    document.title = `${spec?.title ?? "Component not found"} · CyberSpec Components`
    // A direct link can arrive before this route's code has loaded.
    if (location.hash) {
      const target = document.getElementById(fragmentId(location.hash))
      if (target) scrollToPageAnchor(target, false)
    }
    return () => { document.title = originalTitle }
  }, [spec])

  if (!spec) return <header data-kit="page-head">
    <h1>Component not found</h1>
    <a href={`/${sidebarRoute}`} data-kit="link">Browse components</a>
  </header>

  return (
    <div className="sidebar-catalog">
      <ComponentIndex spec={spec} />
      <div className="sidebar-reading">
        <ComponentArticle key={spec.name} spec={spec} />
        <ComponentPager index={index} />
      </div>
      <ArticleLinks key={spec.name} />
    </div>
  )
}
