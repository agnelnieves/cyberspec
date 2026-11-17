#!/usr/bin/env node
// Builds the shadcn/ui registry: writes registry.json from the files under
// registry/cyber, then runs `shadcn build`, which writes public/r/*.json for
// the site to serve.
//
//   bun run registry:build                     # also runs as part of `bun run build`
//   REGISTRY_URL=https://example.com bun run registry:build   # another host
//
// Items:
// - cyber: sets a project up for the kit: the <Cyber> root, the foundation
//   stylesheets, the page-wide behaviors in lib/ and the fonts. Every other
//   item depends on it.
// - one item per component in registry/cyber/ui, with its own stylesheet
// - <component>-demo: one usage example per component, as the catalog shows it
// - one block per screen in registry/cyber/blocks
//
// Dependencies are read from each file's imports: npm packages (pinned to the
// versions this site uses) and other registry items (from @/registry imports).
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"

const root = new URL("..", import.meta.url).pathname
// Where the registry is served: REGISTRY_URL if set, otherwise the kit's
// site. www is the canonical host; cyberspec.dev redirects to it.
const base = (process.env.REGISTRY_URL || "https://www.cyberspec.dev").replace(/\/$/, "")
const reg = "registry/cyber"
const prefix = `@/${reg}/`
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const meta = JSON.parse(readFileSync(join(root, reg, "meta.json"), "utf8"))
const read = (path) => readFileSync(join(root, path), "utf8")
const list = (dir, test = () => true) => (existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter(test).sort() : [])
const itemUrl = (name) => `${base}/r/${name}.json`

// The stylesheets that make up the skin itself, rather than one component.
const foundation = ["skin.css", "tokens.css", "base.css", "fx.css", "field.css", "popup.css"]
const versions = { ...pkg.dependencies, ...pkg.devDependencies }
const installedVersions = new Map()
function dependencyVersion(name, file) {
  if (!versions[name]) throw new Error(`${file}: ${name} isn't a dependency in package.json`)
  if (!installedVersions.has(name)) {
    // Publish the version this build actually checked, not a range that
    // might install a different SDK or icon API for the next consumer.
    const installed = JSON.parse(readFileSync(join(root, "node_modules", name, "package.json"), "utf8"))
    installedVersions.set(name, installed.version)
  }
  return installedVersions.get(name)
}

// Which registry item a `@/registry/cyber/...` import belongs to.
function ownerOf(spec, file) {
  const rest = spec.slice(prefix.length)
  if (rest.startsWith("lib/")) return "cyber"
  if (rest.startsWith("ui/cyber/")) {
    const sheet = rest.slice("ui/cyber/".length)
    return foundation.includes(sheet) ? "cyber" : sheet.replace(/\.css$/, "")
  }
  if (rest === "ui/cyber") return "cyber"
  if (rest.startsWith("ui/")) return rest.slice(3)
  if (rest.startsWith("blocks/")) return rest.split("/")[1]
  if (rest.startsWith("examples/")) return rest.slice("examples/".length)
  throw new Error(`${file}: unexpected import ${spec}`)
}

// npm packages and registry items a set of files imports.
function dependenciesOf(files, self) {
  const npm = new Set()
  const items = new Set()
  for (const file of files) {
    if (!/\.tsx?$/.test(file)) continue
    const text = read(file)
    for (const [, spec] of text.matchAll(/^import\s[^"]*?"([^"]+)"/gm)) {
      if (spec.startsWith(prefix)) {
        const name = ownerOf(spec, file)
        if (name !== self) items.add(name)
      } else if (!spec.startsWith(".") && !spec.startsWith("@/")) {
        const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]
        if (name === "react" || name === "react-dom") continue
        npm.add(`${name}@${dependencyVersion(name, file)}`)
      }
    }
  }
  return { npm: [...npm].sort(), items: [...items].sort() }
}

// The kit's type, loaded before anything is drawn rather than swapped in.
const fontImport =
  '@import url("https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=block")'

function item(name, type, title, description, files, extra = {}) {
  const { npm, items } = dependenciesOf(files.map((f) => f.path), name)
  const deps = [...new Set([...(extra.after ?? []), ...items])].filter((n) => n !== name)
  return {
    name,
    type,
    title,
    description,
    ...(npm.length && { dependencies: npm }),
    ...(deps.length && { registryDependencies: deps.map(itemUrl) }),
    files,
    ...(extra.css && { css: extra.css }),
    ...(extra.docs && { docs: extra.docs }),
    ...(extra.categories && { categories: extra.categories }),
  }
}

const target = (path) => {
  const rest = relative(reg, path)
  if (rest.startsWith("ui/")) return `@ui/${rest.slice(3)}`
  if (rest.startsWith("lib/")) return `@lib/${rest.slice(4)}`
  return `@components/${rest}`
}
const file = (path, type) => ({ path, type, target: target(path) })
const titled = (name) => name.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())

const items = []
const warnings = []

// The root: the skin's foundation, its utilities and the <Cyber> component.
items.push(
  item(
    "cyber",
    "registry:item",
    "Cyber",
    "Sets a project up for the cyberspec kit: the <Cyber> root, the foundation stylesheets (tokens, the cut-corner frame system, effects, shared field and popup looks), the fonts, and the page-wide behaviors the components rely on (the FX level, sampled and synthesized interface sounds, haptics, keyboard-or-pointer focus tracking, and the signal shown when an agent changes something).",
    [
      file(`${reg}/ui/cyber.tsx`, "registry:ui"),
      ...foundation.map((f) => file(`${reg}/ui/cyber/${f}`, "registry:file")),
      // Includes sound-samples.ts: recordings travel with the code, with no
      // app-specific public path or request to the registry host at runtime.
      ...list(`${reg}/lib`, (f) => f.endsWith(".ts")).map((f) => file(`${reg}/lib/${f}`, "registry:lib")),
      { path: "LICENSE", type: "registry:file", target: "@lib/cyberspec/LICENSE" },
      { path: "THIRD_PARTY_NOTICES.md", type: "registry:file", target: "@lib/cyberspec/THIRD_PARTY_NOTICES.md" },
    ],
    {
      css: { [fontImport]: {} },
      docs: 'Wrap your app (or any part of it) in <Cyber> from @/components/ui/cyber; everything inside is styled by the skin. Set accent={{ l: 0.82, c: 0.13, h: 215 }} for another accent color (OKLCH), and fx="calm" or "off" to pin the effects level. Add data-crt="" once on the outer app root for a static screen raster and subtle corner vignette at full FX. Rajdhani and JetBrains Mono are imported at the top of your CSS file.',
      categories: ["theme"],
    },
  ),
)

// Components, each with its own stylesheet.
for (const f of list(`${reg}/ui`, (f) => f.endsWith(".tsx") && f !== "cyber.tsx")) {
  const name = f.replace(/\.tsx$/, "")
  const info = meta.components[name]
  if (!info) warnings.push(`no title and description in meta.json for ui/${f}`)
  const files = [file(`${reg}/ui/${f}`, "registry:ui")]
  if (existsSync(join(root, reg, "ui/cyber", `${name}.css`))) files.push(file(`${reg}/ui/cyber/${name}.css`, "registry:file"))
  items.push(item(name, "registry:ui", info?.[0] ?? titled(name), info?.[1] ?? `The ${titled(name).toLowerCase()} component.`, files, { after: ["cyber"] }))
}

// Examples, named after the component they show.
for (const f of list(`${reg}/examples`, (f) => f.endsWith(".tsx"))) {
  const name = f.replace(/\.tsx$/, "")
  const shown = name.replace(/-demo$/, "")
  const title = meta.components[shown]?.[0] ?? titled(shown)
  items.push(
    item(name, "registry:component", `${title} demo`, `How to use ${title.toLowerCase()}, as the catalog shows it.`, [file(`${reg}/examples/${f}`, "registry:component")], {
      after: ["cyber"],
      categories: ["example"],
    }),
  )
}

// Screens.
for (const dir of list(`${reg}/blocks`, (d) => !d.startsWith("."))) {
  const info = meta.blocks[dir]
  if (!info) warnings.push(`no title and description in meta.json for blocks/${dir}`)
  const files = list(`${reg}/blocks/${dir}`, (f) => /\.(tsx?|css)$/.test(f)).map((f) =>
    file(`${reg}/blocks/${dir}/${f}`, f.endsWith(".css") ? "registry:file" : "registry:component"),
  )
  items.push(item(dir, "registry:block", info?.[0] ?? titled(dir), info?.[1] ?? `The ${dir} screen.`, files, { after: ["cyber"], categories: ["screen"] }))
}

// Every dependency has to be an item.
const names = new Set(items.map((i) => i.name))
for (const it of items)
  for (const url of it.registryDependencies ?? []) {
    const name = url.slice(`${base}/r/`.length, -".json".length)
    if (!names.has(name)) throw new Error(`${it.name} depends on ${name}, which isn't an item`)
  }

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "cyberspec",
  homepage: base,
  items,
}
writeFileSync(join(root, "registry.json"), JSON.stringify(registry, null, 2) + "\n")
console.log(`registry.json: ${items.length} items (${base})`)
for (const warning of warnings) console.warn(`warning: ${warning}`)

execFileSync(join(root, "node_modules/.bin/shadcn"), ["build", "--output", "public/r"], { cwd: root, stdio: "inherit" })

// The catalog runs entirely on the client, but an installed component may
// be imported directly by a Next.js server page. Declare that boundary in
// shipped TSX; shadcn removes it for projects whose config has rsc: false.
// This follows the build because shadcn reads each source path itself.
for (const it of items) {
  const path = join(root, "public/r", `${it.name}.json`)
  const built = JSON.parse(readFileSync(path, "utf8"))
  for (const f of built.files ?? []) {
    if (f.path.endsWith(".tsx") && !/^\s*["']use client["']/.test(f.content)) f.content = `"use client"\n\n${f.content}`
  }
  writeFileSync(path, JSON.stringify(built, null, 2) + "\n")
}

// llms.txt: the kit, for a coding agent. What it is, how to install it, the
// rules that matter when building with it, and every item with its URL.
const byType = (type, category) => items.filter((i) => i.type === type && (!category || i.categories?.includes(category)))
const line = (i) => `- [${i.title}](${itemUrl(i.name)}): ${i.description}`
const llms = `# CYBERSPEC

> A cyberpunk theme for ui-sdk (https://ui-sdk.dev): ${byType("registry:ui").length} components and ${byType("registry:block").length} screens with cut-corner frames, glitch and scan effects that respect reduced motion, sampled and synthesized interface sounds, and a visible signal when an agent changes something. Plain CSS, React, installable from a shadcn registry.

Every control is a ui-sdk component underneath (\`@ui-sdk/react\`, \`@ui-sdk/core\`), so keyboard behavior, ARIA and the ui-sdk agent bridge come with it.

## Install

CyberSpec's original code is MIT-licensed. Bundled recorded audio is excluded from MIT and has separate licensing requirements. Read https://github.com/agnelnieves/cyberspec/blob/main/THIRD_PARTY_NOTICES.md before reusing recordings. The foundation installs both the MIT license and third-party notices in the configured library directory under \`cyberspec/\`.

Use a React 19 project with a configured shadcn \`components.json\` and a working \`@/\` import alias. React 18 is not supported by the underlying SDK. In TypeScript projects use \`@types/react >=19.2.10\`. The pinned \`@ui-sdk/core@${dependencyVersion("@ui-sdk/core", "llms.txt")}\` and \`@ui-sdk/react@${dependencyVersion("@ui-sdk/react", "llms.txt")}\` dependencies install from public npm; no token, private registry or GitHub access is needed.

\`\`\`sh
bunx --bun shadcn@latest registry add '@cyberspec=${base}/r/{name}.json'
bunx --bun shadcn@latest add @cyberspec/cyber @cyberspec/button @cyberspec/slider
\`\`\`

Any item also installs from its URL: \`bunx --bun shadcn@latest add ${itemUrl("panel")}\`. Every item depends on \`cyber\`, which adds the \`<Cyber>\` root, the foundation stylesheets, the fonts and the page-wide behaviors. Tailwind is not required; the \`tailwind.css\` entry in \`components.json\` can point at the application's plain CSS entry file. See the [installation setup](https://github.com/agnelnieves/cyberspec#install-from-the-registry) for a minimal configuration.

Installed TSX declares client boundaries for Next.js App Router. Keep state, event handlers and render callbacks inside a Client Component; only serializable props may cross from a server page. Import the app's CSS entry once in its root layout/entry. Samples and CSS install alongside the components, so they do not fetch code or audio from this registry at runtime.

\`\`\`tsx
import { Cyber } from "@/components/ui/cyber"
import { Button } from "@/components/ui/button"

export function App() {
  return (
    <Cyber>
      <Button tone="primary">Deploy</Button>
    </Cyber>
  )
}
\`\`\`

## Rules when building with it

- Wrap the app, or the part that should look like this, in \`<Cyber>\`. Styles are scoped to \`[data-skin="cyber"]\` and sit in cascade layers (\`cyber.*\`), so unlayered app CSS wins.
- \`<Cyber accent={{ l, c, h }}>\` sets the accent (OKLCH). \`fx="full" | "calm" | "off"\` pins the effects level; left out, it follows the person's choice and \`prefers-reduced-motion\`.
- Shape comes from \`data-frame\` (\`"tr bl"\`, \`"notch br"\`, \`"spine br"\`), configured with \`--frame-cut\`, \`--frame-line\`, \`--frame-fill\`. Don't set \`border-color\`, \`clip-path\` or \`background-image\` on a framed element, and don't round anything.
- Colors are tokens (\`--cy-accent\`, \`--cy-ink\`, \`--cy-signal\`, \`--cy-flag\`, \`--cy-line-ctl\`, \`--cy-fill-active\` ...). Red is the resting color, so errors are yellow (\`--cy-flag\`) with a glyph and words.
- Effects are tokens too: \`animation: var(--cy-fx-in) 200ms var(--cy-ease-snap) both\`. They resolve to nothing when effects are off.
- Sound is off until the person turns it on: \`setSoundEnabled(true)\` from \`lib/sound\`. Hover uses one recorded tick; plus/minus use \`sfx("increment")\` / \`sfx("decrement")\` after accepted changes. Sliders, resizers and scrubbing use \`createAdjustmentSound()\`: call \`move()\` on accepted movement and \`stop()\` when interaction ends. Samples are embedded in \`lib/sound-samples.ts\` and install with the kit.
- Give every control an accessible name. An agent finds controls by those names.

## Agents on the page

The components work with the ui-sdk agent bridge (\`createAgent\` from \`@ui-sdk/react/agent\`): an agent can \`snapshot()\` the page, \`query()\` choices and \`act()\` on components by label. The kit adds a visible signal: whatever an agent changes lights cyan for a moment (\`data-agent-touch\`) and is announced to screen readers. Mark anything irreversible with \`data-agent-confirm="<what it does>"\` so an agent has to ask a person; \`data-agent-hidden\` and \`data-agent-secret\` keep regions and values from it.

## The skin

${line(items[0])}

## Components

${byType("registry:ui").map(line).join("\n")}

## Screens

${byType("registry:block").map(line).join("\n")}

## Examples

One per component, named \`<component>-demo\`: ${itemUrl("button-demo")}

## More

- [Registry index](${base}/r/registry.json)
- [ui-sdk docs for agents](https://ui-sdk.dev/llms.txt)
`
writeFileSync(join(root, "public/llms.txt"), llms)
console.log("public/llms.txt written")
