import * as React from "react"
import { panels, type PanelSpec } from "./panels"

// Each example is registry/cyber/examples/<name>-demo.tsx, found by name, so
// adding a component is adding its file and a line in panels.ts.
const demos = import.meta.glob<{ default: React.ComponentType }>("/registry/cyber/examples/*-demo.tsx", { eager: true })
const demoOf = (name: string) => demos[`/registry/cyber/examples/${name}-demo.tsx`]?.default

// An example that throws takes down its own panel, not the page.
class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error)
      return (
        <p data-kit="hint" role="alert">
          FAULT: {this.state.error.message}
        </p>
      )
    return this.props.children
  }
}

function DemoStage({ name }: { name: string }) {
  const Demo = demoOf(name)
  return (
    <div data-kit="stage" data-frame="tr bl">
      <div data-kit="surface">
        <Boundary key={name}>{Demo ? <Demo /> : <p data-kit="hint">No signal.</p>}</Boundary>
      </div>
    </div>
  )
}

function Panel({ spec, index, heading: Heading = "h3" }: { spec: PanelSpec; index: number; heading?: "h1" | "h3" }) {
  const n = String(index + 1).padStart(2, "0")
  return (
    <section data-kit="module" data-wide={spec.wide || undefined} data-missing={demoOf(spec.name) ? undefined : ""} aria-label={spec.title} id={spec.name}>
      <header data-kit="module-head">
        <span data-kit="module-n" aria-hidden>
          {n}
        </span>
        <Heading data-kit="module-title">{spec.title}</Heading>
        <span data-kit="module-uses">{spec.uses.length ? spec.uses.join(" · ") : "presentational"}</span>
      </header>
      <DemoStage name={spec.name} />
      <span data-micro aria-hidden>
        CS-{n} // {spec.name.toUpperCase()} // REV 0.1
      </span>
    </section>
  )
}

function CatalogGrid() {
  const groups = [...new Set(panels.map((panel) => panel.group))]
  return (
    <div id="components" data-kit="catalog" tabIndex={-1}>
      {groups.map((group) => (
        <section key={group} data-kit="catalog-group" aria-labelledby={`group-${group}`}>
          <h2 data-kit="catalog-heading" id={`group-${group}`}>
            <span aria-hidden>//</span> {group}
          </h2>
          <div data-kit="grid">
            {panels.map((spec, index) => (spec.group === group ? <Panel key={spec.name} spec={spec} index={index} /> : null))}
          </div>
        </section>
      ))}
    </div>
  )
}

// One example on its own, at /preview/<name>: what scripts/shot.mjs captures.
// ?w=256 sets the stage's width, to see a panel as narrow as the grid makes it.
function Preview({ name }: { name: string }) {
  const index = panels.findIndex((panel) => panel.name === name)
  const spec: PanelSpec = panels[index] ?? { name, title: name, uses: [], group: "HUD" }
  const asked = Number(new URLSearchParams(location.search).get("w"))
  const width = asked || (spec.wide ? 660 : 320)
  return (
    <div data-kit="preview" style={{ "--preview-w": `${width}px` } as React.CSSProperties}>
      <Panel spec={spec} index={Math.max(0, index)} heading="h1" />
    </div>
  )
}

export { Boundary as DemoBoundary, CatalogGrid, DemoStage, Preview }
