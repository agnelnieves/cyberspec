import { readFileSync } from "node:fs"
import registry from "../registry.json"
import { blocks } from "../registry/cyber/meta.json"
import { panels } from "../src/catalog/panels"
import { examples } from "../src/example-data"
import { installCommand, installCommands, installedExampleSource, repositoryUrl, siteUrl } from "../src/install"
import { getSitePage, type SitePage } from "../src/site-pages"

type Link = {
  label: string
  href: string
  description?: string
  id?: string
  interactive?: boolean
}

type Section = {
  title: string
  id?: string
  text?: string
  code?: { language: string; source: string }
  links?: Link[]
}

const blockInfo: Record<string, string[]> = blocks
const setup = "Use a React 19 project with shadcn configured. Render the installed components inside the Cyber root, and import your global stylesheet in the app entry point."
const shell = (source: string) => ({ language: "sh", source })

function componentLink(name: string): Link {
  const page = getSitePage(`/components/sidebar/${name}`)!
  return { label: page.heading, href: page.path, description: page.description, id: name }
}

function sections(page: SitePage): Section[] {
  switch (page.kind) {
    case "home": return [
      { title: "What is CyberSpec?", text: "CyberSpec is a cyberpunk component kit for React built on UI SDK. The shadcn registry installs the source and plain CSS in your project. You can customize the accent and effects, enable interface sounds, and use the UI SDK agent bridge to interact with controls by name.", links: [
        { label: "Component catalog", href: "/components", description: `${panels.length} documented component demos, from buttons to interactive maps.` },
        { label: "Example screens", href: "/examples", description: `${examples.length} complete layouts built from the kit.` },
        { label: "CyberSpec on GitHub", href: repositoryUrl },
      ] },
      { title: "Installation", text: setup, code: shell(installCommands), links: [
        { label: "Installation guide", href: `${repositoryUrl}#install-from-the-registry` },
        { label: "Setup instructions for coding agents", href: "/llms.txt" },
      ] },
      { title: "Try the components", id: "try-controls", text: "Use Tabs to switch between latency and traffic, adjust the time window with Slider, and toggle the chart grid with Switch.", links: [
        componentLink("tabs"), componentLink("slider"), componentLink("switch"), componentLink("signal-graph"),
      ] },
      { title: "Radio schedule", id: "relay-schedule", text: "Pick a date on the calendar to see broadcasts from a sample station in Reykjavík. Its lineup runs on Mondays, Wednesdays, and Fridays.", links: [
        componentLink("calendar"), componentLink("feed"),
      ] },
      { title: "Playback timeline", id: "transmission-timeline", text: "Play a silent radio conversation or scrub to a point in the transmission." },
      { title: "Build with a coding agent", id: "agents", text: "The setup prompt on the landing page explains how to install the kit and compose a screen with its components. The example combines a drawer and a feed to display a connection log.", links: [
        componentLink("drawer"), { label: "Instructions for coding agents", href: "/llms.txt" },
      ] },
    ]
    case "components": return [
      { title: "Installation", text: setup, code: shell(installCommands) },
      ...[...new Set(panels.map(panel => panel.group))].map(group => ({
        title: group,
        id: `group-${group}`,
        links: panels.filter(panel => panel.group === group).map(panel => componentLink(panel.name)),
      })),
    ]
    case "examples": return [{
      title: "Example screens",
      links: examples.map(example => ({ label: example.title, href: `/${example.route}`, description: example.line })),
    }]
    case "screen": {
      const { route } = page.example
      const block = registry.items.find(item => item.name === route && item.type === "registry:block")!
      const related = (block.registryDependencies ?? []).flatMap(url => {
        const name = url.substring(url.lastIndexOf("/") + 1).replace(/\.json$/, "")
        return getSitePage(`/components/sidebar/${name}`) ? [componentLink(name)] : []
      })
      return [
        { title: "What this screen demonstrates", text: blockInfo[route][1] },
        { title: "Installation", text: setup, code: shell(installCommand(route)) },
        { title: "Usage", code: { language: "tsx", source: [
          'import { Cyber } from "@/components/ui/cyber"',
          `import ExampleScreen from "@/components/blocks/${route}/${route}"`, "",
          "export default function App() {", "  return (", "    <Cyber>", "      <ExampleScreen />", "    </Cyber>", "  )", "}",
        ].join("\n") } },
        { title: "Components in this screen", links: related },
        { title: "Resources", links: [
          { label: "All example screens", href: "/examples" },
          { label: `${page.heading} source files`, href: `${repositoryUrl}/tree/main/registry/cyber/blocks/${route}` },
          { label: "Shadcn registry item", href: `/r/${route}.json` },
        ] },
      ]
    }
    case "component":
    case "preview": {
      const { name, title, group, uses } = page.panel
      const filename = `${name}-demo.tsx`
      const source = readFileSync(new URL(`../registry/cyber/examples/${filename}`, import.meta.url), "utf8")
      const modules = uses.map(mod => mod.startsWith("core") ? `@ui-sdk/${mod}` : `@ui-sdk/react/${mod}`)
      const about = modules.length ? `It uses ${modules.join(", ")}.` : "It uses markup and CSS."
      const preview = page.kind === "preview"
      return [
        { title: preview ? "About this preview" : "Component", text: `${title} belongs to the ${group} group in the CyberSpec catalog. ${about}` },
        { title: "Installation", id: "installation", text: setup, code: shell(installCommand(name)) },
        { title: "Example", id: "example", code: { language: "tsx", source: installedExampleSource(source).trimEnd() } },
        { title: "Install this example", code: shell(installCommand(`${name}-demo`)) },
        { title: "Resources", links: [
          preview ? { label: `${title} documentation`, href: page.canonicalPath } :
            { label: `Interactive ${title} preview`, href: `/preview/${name}`, interactive: true },
          { label: "Component catalog", href: "/components" },
          { label: `${title} source code`, href: `${repositoryUrl}/blob/main/registry/cyber/ui/${name}.tsx` },
          { label: "Shadcn registry item", href: `/r/${name}.json` },
        ] },
      ]
    }
  }
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

function htmlLink(link: Link) {
  const id = link.id ? ` id="${escapeHtml(link.id)}"` : ""
  return `<li${id}><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>${link.description ? ` — ${escapeHtml(link.description)}` : ""}</li>`
}

export function renderPageBody(page: SitePage): string {
  const headingId = page.kind === "components" ? ' id="components"' : page.kind === "component" ? ' id="component-title"' : ""
  const body = sections(page).map(({ title, id, text, code, links }) => [
    id ? `<section id="${escapeHtml(id)}">` : "<section>",
    `<h2>${escapeHtml(title)}</h2>`,
    text && `<p>${escapeHtml(text)}</p>`,
    code && `<pre><code class="language-${code.language}">${escapeHtml(code.source)}</code></pre>`,
    links && `<ul>${links.map(htmlLink).join("\n")}</ul>`,
    "</section>",
  ].filter(Boolean).join("\n"))
  return [
    '<main class="static-page" id="main">',
    '<nav aria-label="Sections"><a href="/">CyberSpec</a> · <a href="/components">Components</a> · <a href="/examples">Examples</a></nav>',
    `<h1${headingId}>${escapeHtml(page.heading)}</h1>`,
    `<p>${escapeHtml(page.description)}</p>`,
    ...body,
    `<p><a href="${escapeHtml(page.markdownPath)}" type="text/markdown">View as Markdown</a></p>`,
    "</main>",
  ].join("\n")
}

function markdownLink(link: Link) {
  const destination = link.interactive ? link.href : getSitePage(link.href)?.markdownPath ?? link.href
  return `- [${link.label}](${new URL(destination, siteUrl).href})${link.description ? ` — ${link.description}` : ""}`
}

export function renderMarkdown(page: SitePage): string {
  const body = sections(page).map(({ title, text, code, links }) => [
    `## ${title}`,
    text,
    code && [`\`\`\`${code.language}`, code.source, "\`\`\`"].join("\n"),
    links?.map(markdownLink).join("\n"),
  ].filter(Boolean).join("\n\n"))
  return [
    `# ${page.heading}`, page.description,
    `[View ${page.heading} on CyberSpec](${siteUrl}${page.kind === "preview" ? page.path : page.canonicalPath})`,
    ...body,
  ].join("\n\n") + "\n"
}
