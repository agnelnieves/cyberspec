import type { ReactNode } from "react"
import { components } from "@/registry/cyber/meta.json"
import { CodeBlock } from "@/registry/cyber/ui/code-block"
import { Tabs } from "@/registry/cyber/ui/tabs"
import { installCommand, installedExampleSource } from "../install"
import { DemoStage } from "./Catalog"
import type { PanelSpec } from "./panels"
import "./component-article.css"

const metadata: Record<string, string[]> = components
const sources = import.meta.glob<string>("/registry/cyber/examples/*-demo.tsx", {
  eager: true, query: "?raw", import: "default",
})

function ExampleSource({ name, title }: { name: string; title: string }) {
  const filename = `${name}-demo.tsx`
  const source = installedExampleSource(sources[`/registry/cyber/examples/${filename}`])
  return (
    <div className="component-example-source">
      <CodeBlock language="tsx" filename={filename} label={`${title} example source`}
        code={source} maxLines={18} />
      <CodeBlock language="bash" filename="Install this example" label={`Install the ${title} example`}
        code={installCommand(`${name}-demo`)} numbers={false} />
    </div>
  )
}

export function ComponentArticle({ spec, pager }: { spec: PanelSpec; pager: ReactNode }) {
  return (
    <article className="component-article" aria-labelledby="component-title">
      <header className="component-article-header">
        <p className="component-category">{spec.group}</p>
        <div className="component-title-row">
          <h1 id="component-title" tabIndex={-1}>{spec.title}</h1>
          {pager}
        </div>
        <p className="component-description">{metadata[spec.name]?.[1]}</p>
      </header>
      <section id="example" aria-labelledby="component-example-title">
        <h2 id="component-example-title" data-sr-only>Example</h2>
        <Tabs key={spec.name} label={`${spec.title} example`} defaultValue="preview" tabs={[
          { value: "preview", label: "Preview", content: <DemoStage name={spec.name} /> },
          { value: "code", label: "Code", content: <ExampleSource name={spec.name} title={spec.title} /> },
        ]} />
      </section>
      <section id="installation" className="component-install" aria-labelledby="component-install-title">
        <h2 id="component-install-title">Installation</h2>
        <p>Run this command in your React project, then render the component inside <code>&lt;Cyber&gt;</code>.</p>
        <CodeBlock language="bash" filename="Terminal" label={`Install ${spec.title}`}
          code={installCommand(spec.name)} numbers={false} />
      </section>
    </article>
  )
}
