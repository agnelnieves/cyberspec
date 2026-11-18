import { useLayoutEffect, useRef, useState, type MouseEvent } from "react"
import { Grid2X2, List, Search } from "lucide-react"
import { DialogTrigger } from "@ui-sdk/react/dialog"
import { TextField } from "@/registry/cyber/ui/text-field"
import { ScrollArea } from "@/registry/cyber/ui/scroll-area"
import { componentDocUrl, navigate } from "../navigation"
import { MobileMenuDialog } from "../MobileMenuDialog"
import { panels, type PanelSpec } from "./panels"
import "./component-index.css"

const groups = [...new Set(panels.map(panel => panel.group))].map(name => ({
  name,
  items: panels.filter(panel => panel.group === name),
}))

export function ComponentIndex({ spec, onSelect }: { spec?: PanelSpec; onSelect?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const [filter, setFilter] = useState("")
  const list = useRef<HTMLDivElement>(null)
  const query = filter.trim().toLowerCase()
  const keepSidebarOpen = new URLSearchParams(location.search).get("sidebar") !== "closed"
  const visible = groups.map(group => ({
    ...group,
    items: group.items.filter(panel =>
      `${panel.title} ${panel.name} ${group.name}`.toLowerCase().includes(query)
    ),
  })).filter(group => group.items.length > 0)

  useLayoutEffect(() => {
    const rail = list.current?.querySelector<HTMLElement>('[data-kit="scroll-area-viewport"]')
    if (rail && query) rail.scrollTop = 0
  }, [query])

  useLayoutEffect(() => {
    const rail = list.current?.querySelector<HTMLElement>('[data-kit="scroll-area-viewport"]')
    if (!rail || !spec) return
    const showCurrent = () => {
      const link = rail.querySelector<HTMLAnchorElement>('[aria-current="page"]')
      if (!link || !rail.clientHeight) return
      const bounds = rail.getBoundingClientRect()
      const item = link.getBoundingClientRect()
      if (item.top < bounds.top || item.bottom > bounds.bottom) {
        // Move only the index. The document keeps its route or fragment position.
        rail.scrollTop += item.top - bounds.top - rail.clientHeight / 3
      }
    }
    showCurrent()
    const size = new ResizeObserver(showCurrent)
    size.observe(rail)
    return () => size.disconnect()
  }, [spec, query])

  return (
    <nav id="component-index" tabIndex={-1} className="component-index" aria-label="Component index">
      {!onSelect && <a className="component-index-skip" href={spec ? "#example" : "#components"}>{spec ? "Skip to example" : "Skip to grid"}</a>}
      <TextField label="Filter components" type="search" icon={<Search />} placeholder="Name or category"
        clearable autoComplete="off" value={filter} onValueChange={setFilter} />
      <a className="component-index-overview" href="/components" onClick={onSelect} aria-current={spec ? undefined : "page"}>
        <Grid2X2 aria-hidden /> Catalog grid
      </a>
      <ScrollArea ref={list} label="Component links" className="component-index-list">
        {visible.map(group => (
          <div key={group.name}>
            <h2>{group.name}</h2>
            <ul>
              {group.items.map(panel => (
                <li key={panel.name}>
                  <a href={componentDocUrl(panel.name, keepSidebarOpen)} onClick={onSelect} aria-current={panel.name === spec?.name ? "page" : undefined}>
                    {panel.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {visible.length === 0 && <p role="status">No matching components.</p>}
      </ScrollArea>
    </nav>
  )
}

export function MobileComponentIndex({ spec }: { spec?: PanelSpec }) {
  const [open, setOpen] = useState(false)
  const [scrollHidden, setScrollHidden] = useState(false)
  const selected = useRef(false)

  useLayoutEffect(() => {
    setScrollHidden(false)
    if (open) return

    const root = document.documentElement
    const pageY = () => Math.max(0, Math.min(window.scrollY, root.scrollHeight - root.clientHeight))
    let pivot = pageY()
    let hidden = false
    function onScroll() {
      const y = pageY()
      if (root.style.overflowY === "hidden") {
        pivot = y
        return
      }
      // Measure from the last high or low point so small movements accumulate.
      pivot = hidden ? Math.max(y, pivot) : Math.min(y, pivot)
      const nextHidden = hidden ? y > 8 && pivot - y < 12 : y - pivot >= 24
      if (nextHidden === hidden) return
      hidden = nextHidden
      pivot = y
      setScrollHidden(hidden)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [open, spec])

  function select(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
    event.preventDefault()
    setOpen(false)
    if (event.currentTarget.getAttribute("aria-current") !== "page") {
      selected.current = true
      navigate(event.currentTarget.href)
    }
  }
  return (
    <MobileMenuDialog title="Components" open={open} onOpenChange={value => {
      if (value) selected.current = false
      setOpen(value)
    }} keepMounted
      finalFocus={() => (selected.current && document.getElementById("component-title")) || document.getElementById("catalog-toggle")}
      trigger={<DialogTrigger id="catalog-toggle" className="catalog-index-toggle" data-scroll-hidden={scrollHidden || undefined} data-kit="button" data-size="sm"
        data-frame="notch br" data-tone="secondary" data-press-flash="">
        <List aria-hidden /> Browse components
      </DialogTrigger>}>
      <ComponentIndex spec={spec} onSelect={select} />
    </MobileMenuDialog>
  )
}
