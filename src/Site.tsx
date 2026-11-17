import * as React from "react"
import { Check, Copy, Volume2, VolumeX } from "lucide-react"
import { CatalogGrid, Preview } from "./catalog/Catalog"
import { panels } from "./catalog/panels"
import { fxLevel, fxLevels, onFxChange, setFxLevel, type FxLevel } from "@/registry/cyber/lib/fx"
import { onSoundChange, setSoundEnabled, sfx, soundEnabled } from "@/registry/cyber/lib/sound"
import { copyText } from "@/registry/cyber/lib/clipboard"
import { installationPrompt, installCommands, repositoryUrl } from "./install"
import { Brand } from "./Brand"
import { Breadcrumb } from "@/registry/cyber/ui/breadcrumb"
import { Examples, examples } from "./Examples"
import { AgentPrompt } from "@/registry/cyber/blocks/daemon/agent-prompt"
import { Button } from "@/registry/cyber/ui/button"
import { CodeBlock } from "@/registry/cyber/ui/code-block"
import { Ruler } from "@/registry/cyber/ui/micro"
import { Panel } from "@/registry/cyber/ui/panel"
import { Textarea } from "@/registry/cyber/ui/textarea"
import { Readout } from "@/registry/cyber/ui/readout"
import { Toasts, notify } from "@/registry/cyber/ui/toaster"

// A screen is registry/cyber/blocks/<name>/<name>.tsx, found by name and
// loaded when its page opens.
const blocks = import.meta.glob<{ default: React.ComponentType }>("/registry/cyber/blocks/*/*.tsx")
const blockOf = (name: string) => blocks[`/registry/cyber/blocks/${name}/${name}.tsx`]

// The bar's sections. The example screens live under Examples rather than
// each taking a place in the bar.
const sections = [
  { route: "", title: "Components", line: "Every part of the kit, one panel each." },
  { route: "examples", title: "Examples", line: "The kit composed into whole screens. Each one works: open it and use it." },
]

// The accent, as OKLCH lightness, chroma and hue.
const accents = [
  { id: "crimson", name: "Crimson", l: 0.656, c: 0.23, h: 24 },
  { id: "voltage", name: "Voltage", l: 0.86, c: 0.17, h: 95 },
  { id: "toxin", name: "Toxin", l: 0.84, c: 0.21, h: 150 },
  { id: "ice", name: "Ice", l: 0.82, c: 0.13, h: 215 },
  { id: "ultraviolet", name: "Ultraviolet", l: 0.68, c: 0.22, h: 305 },
] as const

function Screen({ name }: { name: string }) {
  const load = blockOf(name)
  const Block = React.useMemo(() => (load ? React.lazy(load) : null), [load])
  if (!Block)
    return (
      <p data-kit="hint" data-site-empty>
        NO SIGNAL // this screen isn't installed yet.
      </p>
    )
  return (
    <React.Suspense fallback={<p data-kit="hint" data-site-empty>LINKING…</p>}>
      <Block />
    </React.Suspense>
  )
}

function InstallPrompt() {
  const [state, setState] = React.useState<"idle" | "copied" | "manual">("idle")
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const manual = React.useRef<HTMLTextAreaElement>(null)
  const mounted = React.useRef(true)
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])
  React.useEffect(() => {
    if (state === "manual") {
      manual.current?.focus()
      manual.current?.select()
    }
  }, [state])
  const copy = async () => {
    clearTimeout(timer.current)
    try {
      await copyText(installationPrompt)
      if (!mounted.current) return
      setState("copied")
      notify("Prompt copied", { tone: "success", description: "Paste it into your coding agent." })
      timer.current = setTimeout(() => setState("idle"), 2000)
    } catch {
      if (!mounted.current) return
      setState("manual")
      // A retry can fail while the fallback is already mounted.
      manual.current?.focus()
      manual.current?.select()
    }
  }
  return (
    <>
      <div data-kit="actions">
        <a href={repositoryUrl} target="_blank" rel="noreferrer" data-kit="link">GitHub</a>
        <Button tone="primary" onClick={copy} data-copy-prompt="" data-sfx="none">
          {state === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
          {state === "copied" ? "Prompt copied" : "Copy Prompt"}
        </Button>
      </div>
      {state === "manual" && (
        <div data-install-fallback="">
          <p role="alert">Clipboard access is blocked. The prompt is selected below; copy it and paste it into your coding agent.</p>
          <Textarea ref={manual} label="Installation prompt" value={installationPrompt} readOnly autoResize={false} rows={7} data-install-prompt="" />
        </div>
      )}
    </>
  )
}

function Masthead() {
  return (
    <header data-kit="masthead">
      <div data-masthead-lead="">
        <span data-micro aria-hidden>
          CS-00 // INTERFACE KIT // BUILT ON UI-SDK
        </span>
        <h1>
          <span data-sr-only>CYBERSPEC</span>
          <Brand />
        </h1>
        <Ruler aria-hidden />
        <p>
          A cyberpunk theme for{" "}
          <a href="https://ui-sdk.dev" target="_blank" rel="noreferrer" data-kit="link">
            ui-sdk
          </a>
          : cut-corner frames, glitches that know when to stop, interface sounds, and an agent bridge you can watch work.
          Every control here is a ui-sdk component underneath.
        </p>
        <div data-masthead-stats="">
          <Readout value={panels.length} label="Components" size="lg" />
          <Readout value={examples.length} label="Screens" size="lg" />
          <Readout value={3} label="FX levels" size="lg" tone="flag" />
        </div>
      </div>
      <Panel title="Install" code="REGISTRY // SHADCN" variant="titled" level={2} data-masthead-install="">
        <CodeBlock
          language="bash"
          filename="terminal"
          label="Install commands"
          numbers={false}
          code={installCommands}
        />
        <InstallPrompt />
      </Panel>
    </header>
  )
}

function Page({ route }: { route: string }) {
  if (route.startsWith("preview/")) return <Preview name={route.slice("preview/".length)} />
  if (route === "examples") return <Examples />
  if (route) return <Screen name={route} />
  return (
    <>
      <Masthead />
      <CatalogGrid />
    </>
  )
}

function FxSwitch() {
  const level = React.useSyncExternalStore(onFxChange, fxLevel)
  return (
    <div role="radiogroup" aria-label="Effects" data-site-fx>
      {fxLevels.map((option: FxLevel) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={level === option}
          data-site-chip
          onClick={() => setFxLevel(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function SoundToggle() {
  const [on, setOn] = React.useState(soundEnabled)
  React.useEffect(() => onSoundChange(setOn), [])
  return (
    <button
      type="button"
      data-site-chip
      data-sfx="none"
      aria-pressed={on}
      aria-label="Interface sounds"
      title={on ? "Sounds on" : "Sounds off"}
      onClick={() => {
        setSoundEnabled(!on)
        if (!on) sfx("on")
      }}
    >
      {on ? <Volume2 aria-hidden size={14} /> : <VolumeX aria-hidden size={14} />}
    </button>
  )
}

function AccentPicker({ root }: { root: React.RefObject<HTMLDivElement | null> }) {
  const [chosen, setChosen] = React.useState<string>(accents[0].id)
  return (
    <div role="radiogroup" aria-label="Accent color" data-site-accents>
      {accents.map((accent) => (
        <button
          key={accent.id}
          type="button"
          role="radio"
          aria-checked={chosen === accent.id}
          aria-label={accent.name}
          title={accent.name}
          data-site-swatch
          style={{ "--swatch": `oklch(${accent.l} ${accent.c} ${accent.h})` } as React.CSSProperties}
          onClick={() => {
            setChosen(accent.id)
            // Written straight onto the root rather than through state, so a
            // color change doesn't re-render every panel.
            const el = root.current
            if (!el) return
            el.style.setProperty("--theme-l", String(accent.l))
            el.style.setProperty("--theme-c", String(accent.c))
            el.style.setProperty("--theme-h", String(accent.h))
          }}
        />
      ))}
    </div>
  )
}

// Previous and next screen, at the foot of each example.
function ExamplePager({ index }: { index: number }) {
  const previous = examples[index - 1]
  const next = examples[index + 1]
  return (
    <nav aria-label="More examples" data-site-pager>
      {previous ? (
        <a href={`/${previous.route}`} rel="prev">
          <span aria-hidden>←</span> {previous.title}
        </a>
      ) : (
        <span />
      )}
      <a href="/examples">All examples</a>
      {next ? (
        <a href={`/${next.route}`} rel="next">
          {next.title} <span aria-hidden>→</span>
        </a>
      ) : (
        <span />
      )}
    </nav>
  )
}

function Site({ route }: { route: string }) {
  const preview = route.startsWith("preview/")
  const exampleIndex = examples.findIndex((example) => example.route === route)
  const example = examples[exampleIndex]
  // An example screen belongs to the Examples section.
  const section = example ? sections[1] : (sections.find((entry) => entry.route === route) ?? sections[0])
  const root = React.useRef<HTMLDivElement>(null)
  const level = React.useSyncExternalStore(onFxChange, fxLevel)
  return (
    <div ref={root} data-skin="cyber" data-fx={level} data-crt="" data-site>
      <a href="#main" data-site-skip>
        Skip to content
      </a>
      <header data-site-bar>
        <a href="/" data-site-brand aria-label="Cyberspec, home">
          <span data-site-brand-full><Brand /></span>
          <span data-site-brand-compact><Brand markOnly /></span>
        </a>
        <nav aria-label="Sections" data-site-nav>
          {sections.map((entry) => (
            <a
              key={entry.route}
              href={`/${entry.route}`}
              // The section is current on its own page; on a screen inside it,
              // the link is marked but the page is the screen.
              aria-current={entry === section && !preview ? (example ? "true" : "page") : undefined}
            >
              {entry.title}
              {entry.route === "examples" && (
                <>
                  <span data-site-count aria-hidden>
                    {examples.length}
                  </span>
                  <span data-sr-only>, {examples.length} screens</span>
                </>
              )}
            </a>
          ))}
        </nav>
        <div data-site-tools>
          <AccentPicker root={root} />
          <FxSwitch />
          <SoundToggle />
        </div>
      </header>
      <main id="main" tabIndex={-1} data-site-page={preview ? "preview" : example ? example.route : section.route || "components"}>
        {!preview && (example || section.route) && (
          <header data-kit="page-head">
            {example && (
              <Breadcrumb
                label="You are here"
                items={[{ label: "Examples", href: "/examples" }, { label: example.title }]}
              />
            )}
            <h1>{example ? example.title : section.title}</h1>
            <p>{example ? example.line : section.line}</p>
          </header>
        )}
        <Page route={preview ? route : example ? example.route : section.route} />
        {example && <ExamplePager index={exampleIndex} />}
      </main>
      <footer data-site-footer>
        <span data-micro aria-hidden>
          END OF TRANSMISSION // CS-FF
        </span>
        <p>
          Built on{" "}
          <a href="https://ui-sdk.dev" target="_blank" rel="noreferrer" data-kit="link">
            ui-sdk
          </a>
          , after{" "}
          <a href="https://github.com/shuding/spec-01" target="_blank" rel="noreferrer" data-kit="link">
            SPEC-01
          </a>
          .
        </p>
      </footer>
      <AgentPrompt />
      <Toasts />
    </div>
  )
}

export { Site, sections }
