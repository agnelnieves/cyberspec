import { useLayoutEffect, useRef, useState } from "react"
import { ChevronDown, Grid2X2, Search } from "lucide-react"
import { TextField } from "@/registry/cyber/ui/text-field"
import { ScrollArea } from "@/registry/cyber/ui/scroll-area"
import { navigate, sidebarRoute } from "../navigation"
import { panels, type PanelSpec } from "./panels"
import "./component-index.css"

const groups = [...new Set(panels.map(panel => panel.group))].map(name => ({
  name,
  items: panels.filter(panel => panel.group === name),
}))

const componentUrl = (name: string) => `/${sidebarRoute}/${name}`

export function ComponentIndex({ spec }: { spec?: PanelSpec }) {
  const [filter, setFilter] = useState("")
  const list = useRef<HTMLDivElement>(null)
  const query = filter.trim().toLowerCase()
  const visible = groups.map(group => ({
    ...group,
    items: group.items.filter(panel =>
      `${panel.title} ${panel.name} ${group.name}`.toLowerCase().includes(query)
    ),
  })).filter(group => group.items.length > 0)

  useLayoutEffect(() => {
    const rail = list.current?.querySelector<HTMLElement>('[data-kit="scroll-area-viewport"]')
    if (!rail) return
    if (query) {
      rail.scrollTop = 0
      return
    }
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
    <nav id="component-index" tabIndex={-1} className="component-index" aria-label="Component index" data-filtering={query ? "" : undefined}>
      <a className="component-index-skip" href={spec ? "#example" : "#components"}>{spec ? "Skip to example" : "Skip to grid"}</a>
      <TextField label="Filter components" type="search" icon={<Search />} placeholder="Name or category"
        clearable autoComplete="off" value={filter} onValueChange={setFilter} />
      <a className="component-index-overview" href="/components" aria-current={spec ? undefined : "page"}>
        <Grid2X2 aria-hidden /> Catalog grid
      </a>
      <label className="component-index-picker">
        <span data-sr-only>Go to component</span>
        <select value={spec?.name ?? ""} onChange={event => navigate(componentUrl(event.currentTarget.value))}>
          {!spec && <option value="" disabled>Choose component</option>}
          {groups.map(group => (
            <optgroup key={group.name} label={group.name}>
              {group.items.map(panel => <option key={panel.name} value={panel.name}>{panel.title}</option>)}
            </optgroup>
          ))}
        </select>
        <ChevronDown aria-hidden />
      </label>
      <ScrollArea ref={list} label="Component links" className="component-index-list">
        {visible.map(group => (
          <div key={group.name}>
            <h2>{group.name}</h2>
            <ul>
              {group.items.map(panel => (
                <li key={panel.name}>
                  <a href={componentUrl(panel.name)} aria-current={panel.name === spec?.name ? "page" : undefined}>
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
