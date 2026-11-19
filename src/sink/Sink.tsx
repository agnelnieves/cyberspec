import { Activity, lazy, memo, Suspense, useEffect, useRef, useState, type ComponentType } from "react"
import { AudioLines, Braces, ChevronDown, Code2, Gamepad2, Layers3, LayoutGrid, ListChecks, MessageSquare, RadioTower, Search, SlidersHorizontal, TrainFront, Waypoints, X } from "lucide-react"
import { CodeBlock } from "@/registry/cyber/ui/code-block"
import { DemoBoundary } from "../catalog/Catalog"
import { panels } from "../catalog/panels"
import { installCommand, installedExampleSource } from "../install"
import { navigate, navigated } from "../navigation"
import { sinkGroups, sinkRecipes } from "./data"
import type { SinkRecipe } from "./types"
import layoutSource from "@/registry/cyber/recipes/recipe-layout.css?raw"
import "./sink.css"

const modules = import.meta.glob<{ default: ComponentType }>("/registry/cyber/recipes/*.tsx")
const demos = new Map(Object.entries(modules).map(([path, load]) => [path.split("/").pop()!.replace(/\.tsx$/, ""), lazy(load)]))
const sources = import.meta.glob<string>("/registry/cyber/recipes/*.tsx", { query: "?raw", import: "default" })
const componentNames = new Map(panels.map(panel => [panel.name, panel.title]))
const componentOptions = [...new Set(sinkRecipes.flatMap(recipe => recipe.components))]
  .sort((a, b) => componentNames.get(a)!.localeCompare(componentNames.get(b)!))
const icons = { Instruments: RadioTower, Studio: AudioLines, Communication: MessageSquare, Workspace: Layers3, Arcade: Gamepad2, Forms: ListChecks, Planning: Waypoints, Transit: TrainFront }
const groupIcon = (group: string) => icons[group as keyof typeof icons] ?? LayoutGrid

function RecipeDemo({ recipe }: { recipe: SinkRecipe }) {
  const Demo = demos.get(recipe.slug)!
  return <DemoBoundary key={recipe.slug}><Suspense fallback={<span role="status" className="sink-note">Loading example…</span>}><Demo /></Suspense></DemoBoundary>
}

// A long gallery only boots a demo when it approaches the viewport. Once tried,
// filter changes preserve its inputs and pause effects while it is hidden.
const LiveTile = memo(function LiveTile({ recipe, visible }: { recipe: SinkRecipe; visible: boolean }) {
  const stage = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (started || !visible || !stage.current) return
    if (!("IntersectionObserver" in window)) { setStarted(true); return }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) setStarted(true)
    }, { rootMargin: "360px" })
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [started, visible])
  return <div className="sink-stage" ref={stage}>
    {started && <Activity mode={visible ? "visible" : "hidden"}><RecipeDemo recipe={recipe} /></Activity>}
  </div>
})

function readFilters() {
  const params = new URLSearchParams(location.search)
  return {
    group: sinkGroups.find(name => name.toLowerCase() === params.get("group")) ?? "",
    query: params.get("q") ?? "",
    tags: [...new Set(params.getAll("component").filter(name => componentOptions.includes(name)))],
    matchAll: params.get("match") === "all",
  }
}
type Filters = ReturnType<typeof readFilters>

function filterUrl(filters: Filters) {
  const url = new URL(location.href)
  for (const key of ["group", "q", "component", "match"]) url.searchParams.delete(key)
  if (filters.group) url.searchParams.set("group", filters.group.toLowerCase())
  if (filters.query) url.searchParams.set("q", filters.query)
  for (const tag of filters.tags) url.searchParams.append("component", tag)
  if (filters.tags.length > 1 && filters.matchAll) url.searchParams.set("match", "all")
  url.hash = ""
  return url
}

function matches(recipe: SinkRecipe, { group, query, tags, matchAll }: Filters) {
  const text = [recipe.title, recipe.slug.replaceAll("-", " "), recipe.group, recipe.description, ...recipe.components.map(name => componentNames.get(name))].join(" ").toLowerCase()
  return (!group || recipe.group === group)
    && query.toLowerCase().trim().split(/\s+/).every(word => text.includes(word))
    && (!tags.length || (matchAll ? tags.every(tag => recipe.components.includes(tag)) : tags.some(tag => recipe.components.includes(tag))))
}

function CollectionFilter({ group, choose }: { group: string; choose: (group: string) => void }) {
  return <div role="group" aria-label="Filter by collection" className="sink-collections">
    {["", ...sinkGroups].map(name => {
      const Icon = groupIcon(name)
      const count = name ? sinkRecipes.filter(recipe => recipe.group === name).length : sinkRecipes.length
      return <button key={name} type="button" aria-pressed={group === name} onClick={() => choose(name)}>
        <Icon aria-hidden /><span>{name || "All examples"}</span><small>{count}</small>
      </button>
    })}
  </div>
}

function RecipeCard({ recipe, visible, featured, tags, toggle }: {
  recipe: SinkRecipe; visible: boolean; featured: boolean; tags: string[]; toggle: (tag: string) => void
}) {
  const Icon = groupIcon(recipe.group)
  const link = `/sink/${recipe.slug}`
  return <article className="sink-card" hidden={!visible} data-featured={featured || undefined} aria-labelledby={`title-${recipe.slug}`}>
    <div className="sink-card-head">
      <span className="sink-category"><Icon aria-hidden />{recipe.group}</span>
      <h2 id={`title-${recipe.slug}`}><a href={link}>{recipe.title}</a></h2>
      <p>{recipe.description}</p>
    </div>
    <LiveTile recipe={recipe} visible={visible} />
    <footer className="sink-card-foot">
      <div className="sink-tags" aria-label="Component filters">
        {recipe.components.map(tag => <button key={tag} type="button" aria-pressed={tags.includes(tag)}
          aria-label={`Filter by ${componentNames.get(tag)}`} onClick={() => toggle(tag)}>{componentNames.get(tag)}</button>)}
      </div>
      <a className="sink-source-link" href={link + "#source-code"} aria-label={`Source and installation for ${recipe.title}`}><Code2 aria-hidden />Source</a>
    </footer>
  </article>
}

export function SinkGallery() {
  const filters = readFilters()
  const filtered = Boolean(filters.group || filters.query || filters.tags.length)
  const results = new Set(sinkRecipes.filter(recipe => matches(recipe, filters)))
  const searchInput = useRef<HTMLInputElement>(null)
  const componentSelect = useRef<HTMLSelectElement>(null)
  function update(patch: Partial<Filters>, replace = false) {
    const url = filterUrl({ ...filters, ...patch })
    if (url.href === location.href) return
    if (!replace) { navigate(url.href, {scroll: false}); return }
    history.replaceState(history.state, "", url.href)
    dispatchEvent(new Event(navigated))
  }
  function toggle(tag: string) {
    update({tags: filters.tags.includes(tag) ? filters.tags.filter(current => current !== tag) : [...filters.tags, tag]})
  }
  function clear() {
    update({group: "", query: "", tags: [], matchAll: false})
    searchInput.current?.focus({preventScroll: true})
  }
  return <div className="sink-page">
    <header className="sink-mast">
      <div>
        <p className="sink-eyebrow"><span aria-hidden />Interactive examples</p>
        <h1>Kitchen <em>sink.</em></h1>
        <p className="sink-lede">Tune a radio, trim a recording, or play a round. Every example comes with the React source.</p>
      </div>
      <CollectionFilter group={filters.group} choose={group => update({group})} />
    </header>
    <div className="sink-tools">
      <label className="sink-search"><Search aria-hidden />
        <input ref={searchInput} type="search" aria-label="Search kitchen sink examples" placeholder="Search examples…" value={filters.query}
          onChange={event => update({query: event.target.value}, true)} />
      </label>
      <label className="sink-mobile-group"><LayoutGrid aria-hidden />
        <select value={filters.group} aria-label="Filter by collection" onChange={event => update({group: event.target.value})}>
          <option value="">All collections</option>
          {sinkGroups.map(name => <option key={name}>{name}</option>)}
        </select><ChevronDown aria-hidden />
      </label>
      <label className="sink-select"><SlidersHorizontal aria-hidden />
        <select ref={componentSelect} aria-label="Add a component filter" value="" onChange={event => { if (event.target.value) toggle(event.target.value) }}>
          <option value="">Components</option>
          {componentOptions.map(name => <option key={name} value={name} disabled={filters.tags.includes(name)}>{componentNames.get(name)}</option>)}
        </select>
        <ChevronDown aria-hidden />
      </label>
      <span role="status" className="sink-count">{results.size} {results.size === 1 ? "example" : "examples"}</span>
      {filtered && <button type="button" className="sink-clear" onClick={clear}>Clear filters</button>}
    </div>
    {filters.tags.length > 0 && <div className="sink-active">
      {filters.tags.map(tag => <button type="button" key={tag} onClick={() => { toggle(tag); componentSelect.current?.focus({preventScroll: true}) }} aria-label={`Remove ${componentNames.get(tag)} filter`}>{componentNames.get(tag)}<X aria-hidden /></button>)}
      {filters.tags.length > 1 && <label><input type="checkbox" checked={filters.matchAll} onChange={e => update({matchAll: e.target.checked})} /> Match all components</label>}
    </div>}
    {!results.size && <div className="sink-empty"><Search aria-hidden /><h2>No matching examples</h2><p>Try a shorter search or clear your filters.</p><button type="button" data-kit="button" data-frame="br" onClick={clear}>Show all examples</button></div>}
    <div className="sink-grid">
      {sinkRecipes.map((recipe, index) => <RecipeCard key={recipe.slug} recipe={recipe} visible={results.has(recipe)} featured={!filtered && index < 2} tags={filters.tags} toggle={toggle} />)}
    </div>
    <nav aria-label="Explore more of CyberSpec" className="sink-more">
      <a href="/examples"><Layers3 aria-hidden />Full example screens</a>
      <a href="/components"><Braces aria-hidden />Component catalog</a>
    </nav>
  </div>
}

const loaders = Object.fromEntries(sinkRecipes.map(recipe => [recipe.slug, lazy(async () => {
  const raw = await sources[`/registry/cyber/recipes/${recipe.slug}.tsx`]()
  return { default: () => <CodeBlock label={`${recipe.title} source`} language="tsx" filename={`${recipe.slug}.tsx`} code={installedExampleSource(raw)} maxLines={20} /> }
})]))

export function SinkDetail({ recipe }: { recipe: SinkRecipe }) {
  const [showStyles, setShowStyles] = useState(false)
  const Source = loaders[recipe.slug]
  return <article className="sink-page sink-detail">
    <nav className="sink-crumbs" aria-label="Breadcrumb"><a href="/sink">Kitchen sink</a><span aria-hidden>/</span><a href={`/sink?group=${recipe.group.toLowerCase()}`}>{recipe.group}</a></nav>
    <header><h1>{recipe.title}</h1><p className="sink-lede">{recipe.description}</p></header>
    <div className="sink-detail-grid">
      <div className="sink-stage sink-detail-demo"><RecipeDemo recipe={recipe} /></div>
      <section className="sink-install">
        <h2>Use this example</h2>
        <p>Add the example to a React project with shadcn configured, then render it inside <code>&lt;Cyber&gt;</code>.</p>
        <CodeBlock language="bash" filename="Terminal" label={`Install ${recipe.title}`} code={installCommand(recipe.slug)} numbers={false} />
        <CodeBlock language="tsx" filename="Usage" label={`Render ${recipe.title}`} numbers={false}
          code={`import { Cyber } from "@/components/ui/cyber"
import Example from "@/components/recipes/${recipe.slug}"

export function App() {
  return <Cyber><Example /></Cyber>
}`} />
        <h3>Components</h3>
        <div className="sink-tags">{recipe.components.map(name => <a key={name} href={`/components/sidebar/${name}`}>{componentNames.get(name)}</a>)}</div>
      </section>
    </div>
    <section className="sink-source" id="source-code" tabIndex={-1}>
      <h2>Source code</h2>
      <details open>
        <summary><Code2 aria-hidden />{recipe.slug}.tsx <ChevronDown aria-hidden /></summary>
        <DemoBoundary><Suspense fallback={<p role="status">Loading source…</p>}><Source /></Suspense></DemoBoundary>
      </details>
      <details onToggle={event => { if (event.currentTarget.open) setShowStyles(true) }}>
        <summary><Braces aria-hidden />recipe-layout.css <ChevronDown aria-hidden /></summary>
        {showStyles && <CodeBlock label="Shared example styles" language="css" filename="recipe-layout.css" code={layoutSource} maxLines={16} />}
      </details>
    </section>
  </article>
}
