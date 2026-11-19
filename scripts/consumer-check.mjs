#!/usr/bin/env bun
// Fresh consumer installation + compilation, without modifying this project.
// bun run registry:build && bun scripts/consumer-check.mjs
// bun scripts/consumer-check.mjs --url https://www.cyberspec.dev
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const sourcePackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const urlArg = process.argv.indexOf("--url")
const publicUrl = urlArg >= 0 ? process.argv[urlArg + 1]?.replace(/\/$/, "") : null
if (urlArg >= 0) assert(publicUrl && /^https?:\/\//.test(publicUrl), "--url requires an http(s) registry origin")
const fixture = mkdtempSync(join(existsSync("/private/tmp") ? "/private/tmp" : tmpdir(), "cyberspec-consumer-"))
const write = (path, value) => {
  const target = join(fixture, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n")
}
const run = (name, args) => {
  const log = join(fixture, `${name}.log`)
  console.log(`${name}: bun ${args.join(" ")}`)
  const result = spawnSync("bun", args, { cwd: fixture, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } })
  const output = `${result.stdout || ""}\n${result.stderr || ""}`
  writeFileSync(log, output)
  if (result.error || result.status !== 0) throw new Error(`${name} failed; ${log}\n${result.error || output.split("\n").slice(-40).join("\n")}`)
}
console.log(`Consumer fixture: ${fixture}`)
write("package.json", {
  name: "cyberspec-consumer-check", private: true, type: "module",
  scripts: { typecheck: "tsc --noEmit", build: "vite build" },
  dependencies: { react: sourcePackage.dependencies.react, "react-dom": sourcePackage.dependencies["react-dom"] },
  devDependencies: Object.fromEntries(["typescript", "vite", "@types/node", "@types/react", "@types/react-dom"].map((name) => [name, sourcePackage.devDependencies[name]])),
})
const config = {
  $schema: "https://ui.shadcn.com/schema.json", style: "new-york", rsc: false, tsx: true,
  tailwind: { config: "", css: "src/index.css", baseColor: "neutral", cssVariables: true },
  aliases: { components: "@/components", ui: "@/components/ui", lib: "@/lib", utils: "@/lib/utils", hooks: "@/hooks" },
}
write("components.json", config)
write("tsconfig.json", {
  compilerOptions: { target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable"], module: "ESNext", moduleResolution: "Bundler", jsx: "react-jsx", strict: true, skipLibCheck: true, noEmit: true, baseUrl: ".", paths: { "@/*": ["./src/*"] } },
  include: ["src", "vite.config.ts"],
})
write("vite.config.ts", `import { defineConfig } from "vite"
import { fileURLToPath, URL } from "node:url"
export default defineConfig({ resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } } })
`)
write("index.html", '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n')
write("src/index.css", "/* Plain CSS consumer: no Tailwind installed. */\n")
run("install", ["install"])

const recipes = JSON.parse(readFileSync(join(root, "registry/cyber/recipes/manifest.json"), "utf8"))
const names = ["slider-demo", "menu-demo", "combobox-demo", "dialog-demo", "calendar-demo", "map-demo", "loadout", "daemon", ...recipes.map((recipe) => recipe.slug)]
let addresses
if (publicUrl) {
  run("registry", ["x", "--bun", "shadcn@latest", "registry", "add", `@cyberspec-ui=${publicUrl}/r/{name}.json`])
  addresses = names.map((name) => `@cyberspec-ui/${name}`)
} else {
  // Local JSON addresses keep the test on this exact generated registry,
  // including transitive items, without a second dev server or live publish.
  const registry = join(fixture, "registry")
  mkdirSync(registry)
  for (const filename of readdirSync(join(root, "public/r")).filter((name) => name.endsWith(".json") && name !== "registry.json")) {
    const item = JSON.parse(readFileSync(join(root, "public/r", filename), "utf8"))
    item.registryDependencies = item.registryDependencies?.map((address) => join(registry, new URL(address).pathname.split("/").at(-1)))
    writeFileSync(join(registry, filename), JSON.stringify(item))
  }
  addresses = names.map((name) => join(registry, `${name}.json`))
}
run("add-vite", ["x", "--bun", "shadcn@latest", "add", ...addresses, "--yes"])
const imports = `import { Cyber } from "@/components/ui/cyber"
import SliderDemo from "@/components/examples/slider-demo"
import MenuDemo from "@/components/examples/menu-demo"
import ComboboxDemo from "@/components/examples/combobox-demo"
import DialogDemo from "@/components/examples/dialog-demo"
import CalendarDemo from "@/components/examples/calendar-demo"
import MapDemo from "@/components/examples/map-demo"
import Loadout from "@/components/blocks/loadout/loadout"
import Daemon from "@/components/blocks/daemon/daemon"
${recipes.map(({ slug }, index) => `import Recipe${index} from "@/components/recipes/${slug}"`).join("\n")}
`
const children = `<Cyber><SliderDemo/><MenuDemo/><ComboboxDemo/><DialogDemo/><CalendarDemo/><MapDemo/><Loadout/><Daemon/>${recipes.map((_, index) => `<Recipe${index}/>`).join("")}</Cyber>`
write("src/main.tsx", `import { createRoot } from "react-dom/client"\n${imports}import "./index.css"\ncreateRoot(document.getElementById("root")!).render(${children})\n`)
const installed = JSON.parse(readFileSync(join(fixture, "package.json"), "utf8"))
for (const name of ["@ui-sdk/core", "@ui-sdk/react"]) assert.equal(installed.dependencies[name], sourcePackage.dependencies[name], `${name}: exact SDK version`)
assert(existsSync(join(fixture, "src/lib/sound-samples.ts")), "Embedded audio installs with the foundation")
assert(existsSync(join(fixture, "src/lib/cyberspec/LICENSE")), "MIT license installs with the foundation")
assert(existsSync(join(fixture, "src/lib/cyberspec/THIRD_PARTY_NOTICES.md")), "Recording and dependency notices install with the foundation")
assert(existsSync(join(fixture, "src/components/recipes/recipe-layout.css")), "Shared stylesheet installs beside the recipes")
run("typecheck-vite", ["run", "typecheck"])
run("build-vite", ["run", "build"])

// Reinstall as an RSC consumer: the public installer must retain client
// directives, and a server page must be able to import the resulting UI.
const installedConfig = JSON.parse(readFileSync(join(fixture, "components.json"), "utf8"))
installedConfig.rsc = true
write("components.json", installedConfig)
run("add-next", ["x", "--bun", "shadcn@latest", "add", ...addresses, "--yes", "--overwrite"])
for (const path of ["src/components/ui/cyber.tsx", "src/components/ui/slider.tsx", "src/components/examples/slider-demo.tsx", "src/components/blocks/loadout/loadout.tsx", ...recipes.map(({ slug }) => `src/components/recipes/${slug}.tsx`)]) {
  assert(/^\s*["']use client["']/.test(readFileSync(join(fixture, path), "utf8")), `${path}: client boundary survives installation`)
}
run("install-next", ["add", "next@16.4.6"])
write("src/app/layout.tsx", 'import "../index.css"\nexport default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}\n')
write("src/app/page.tsx", `${imports}export default function Page(){return ${children}}\n`)
run("build-next", ["x", "--bun", "next", "build"])
console.log(`Consumer checks passed: plain-CSS Vite typecheck/build and Next.js App Router production build.\nArtifacts: ${fixture}`)
