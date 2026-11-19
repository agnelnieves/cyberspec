import { components } from "../registry/cyber/meta.json"
import { panels, type PanelSpec } from "./catalog/panels"
import { examples, type Example } from "./example-data"
import { sinkRecipes } from "./sink/data"
import type { SinkRecipe } from "./sink/types"

type PageContent =
  | { kind: "home" | "components" | "examples" | "sink" }
  | { kind: "component" | "preview"; panel: PanelSpec }
  | { kind: "screen"; example: Example }
  | { kind: "recipe"; recipe: SinkRecipe }

export type SitePage = PageContent & {
  path: string
  canonicalPath: string
  markdownPath: string
  title: string
  heading: string
  description: string
}

const componentInfo: Record<string, string[]> = components

function page(path: string, heading: string, title: string, description: string, content: PageContent, canonicalPath = path): SitePage {
  return { ...content, path, canonicalPath, markdownPath: path === "/" ? "/index.md" : `${path}.md`, heading, title, description }
}

function home(path: string) {
  return page(path, "CyberSpec", "CyberSpec — Cyberpunk interfaces for React",
    "An open-source React library of cut-corner controls, charts, and maps. Pick the components you need and make them your own.", { kind: "home" }, "/")
}

function article(panel: PanelSpec, path = `/components/sidebar/${panel.name}`) {
  return page(path, panel.title, `${panel.title} · CyberSpec Components`, componentInfo[panel.name][1],
    { kind: "component", panel }, `/components/sidebar/${panel.name}`)
}

export const sitePages: SitePage[] = [
  home("/"),
  page("/components", "Components", "React component catalog · CyberSpec",
    `Explore ${panels.length} CyberSpec React component demos by category, with code examples and shadcn installation commands.`, { kind: "components" }),
  page("/examples", "Examples", "React example screens · CyberSpec",
    `Explore ${examples.length} interactive example screens built with CyberSpec's cyberpunk React components. Each screen installs from the shadcn registry.`, { kind: "examples" }),
  page("/sink", "Kitchen sink", "Kitchen sink · CyberSpec",
    `Try ${sinkRecipes.length} interactive recipes built with CyberSpec components. Explore the source and install any recipe in your own React project.`, { kind: "sink" }),
  ...sinkRecipes.map(recipe => page(`/sink/${recipe.slug}`, recipe.title, `${recipe.title} · CyberSpec Kitchen sink`,
    recipe.description, { kind: "recipe", recipe })),
  ...examples.map(example => page(`/${example.route}`, example.title, `${example.title} · CyberSpec example screens`,
    example.line, { kind: "screen", example })),
  ...panels.map(panel => article(panel)),
  ...panels.map(panel => page(`/preview/${panel.name}`, `${panel.title} preview`, `${panel.title} preview · CyberSpec`,
    `Interactive preview of the CyberSpec ${panel.title} component. ${componentInfo[panel.name][1]}`,
    { kind: "preview", panel }, `/components/sidebar/${panel.name}`)),
  article(panels[0], "/components/sidebar"),
  home("/landing"),
  home("/landing-v2"),
]

const pagesByPath = new Map(sitePages.map(page => [page.path, page]))

export function getSitePage(pathname: string) {
  return pagesByPath.get(pathname.replace(/\/+$/, "") || "/")
}
