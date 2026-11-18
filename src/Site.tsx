import * as React from "react"
import { ArrowUpRight, Menu, Palette, Sparkles, Volume2, VolumeX } from "lucide-react"
import { CatalogGrid, Preview } from "./catalog/Catalog"
import { panels } from "./catalog/panels"
import { fxLevel, fxLevels, onFxChange, setFxLevel, type FxLevel } from "@/registry/cyber/lib/fx"
import { onSoundChange, setSoundEnabled, sfx, soundEnabled } from "@/registry/cyber/lib/sound"
import { installCommands, repositoryUrl } from "./install"
import { Brand } from "./Brand"
import { CopyPrompt } from "./CopyPrompt"
import Landing from "./Landing"
import { SiteFrame } from "./SiteFrame"
import { LandingCTA } from "./LandingCTA"
import { Drawer } from "@/registry/cyber/ui/drawer"
import { Breadcrumb } from "@/registry/cyber/ui/breadcrumb"
import { Examples, examples } from "./Examples"
import { SiteSearch, type SearchSetting } from "./SiteSearch"
import { AgentPrompt } from "@/registry/cyber/blocks/daemon/agent-prompt"
import { CodeBlock } from "@/registry/cyber/ui/code-block"
import { Ruler } from "@/registry/cyber/ui/micro"
import { Panel } from "@/registry/cyber/ui/panel"
import { Readout } from "@/registry/cyber/ui/readout"
import { Toasts } from "@/registry/cyber/ui/toaster"
import "./site-menu.css"

// A screen is registry/cyber/blocks/<name>/<name>.tsx, found by name and
// loaded when its page opens.
const blocks = import.meta.glob<{ default: React.ComponentType }>("/registry/cyber/blocks/*/*.tsx")
const blockOf = (name: string) => blocks[`/registry/cyber/blocks/${name}/${name}.tsx`]

// The bar's sections. The example screens live under Examples rather than
// each taking a place in the bar.
const sections = [
  { route: "components", title: "Components", line: "Every part of the kit, one panel each." },
  { route: "examples", title: "Examples", line: "The kit composed into whole screens. Each one works: open it and use it." },
]

function RepositoryLink({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <a href={repositoryUrl} target="_blank" rel="noreferrer" data-site-repo title="Star Cyberspec on GitHub">
      <span data-site-github-mark aria-hidden="true" />
      <span data-sr-only={iconOnly || undefined}>Star on GitHub</span>
    </a>
  )
}

// The accent, as OKLCH lightness, chroma and hue.
const accents = [
  { id: "crimson", name: "Crimson", colors: ["red", "scarlet"], l: 0.656, c: 0.23, h: 24 },
  { id: "voltage", name: "Voltage", colors: ["yellow", "gold"], l: 0.86, c: 0.17, h: 95 },
  { id: "toxin", name: "Toxin", colors: ["green", "lime"], l: 0.84, c: 0.21, h: 150 },
  { id: "ice", name: "Ice", colors: ["blue", "cyan"], l: 0.82, c: 0.13, h: 215 },
  { id: "ultraviolet", name: "Ultraviolet", colors: ["purple", "violet"], l: 0.68, c: 0.22, h: 305 },
] as const
type Accent = (typeof accents)[number]

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
        <div data-kit="actions">
          <a href={repositoryUrl} target="_blank" rel="noreferrer" data-kit="link">GitHub</a>
          <CopyPrompt />
        </div>
      </Panel>
    </header>
  )
}

function Page({ route }: { route: string }) {
  if (route.startsWith("preview/")) return <Preview name={route.slice("preview/".length)} />
  if (!route) return <Landing />
  if (route === "examples") return <Examples />
  if (route !== "components") return <Screen name={route} />
  return (
    <>
      <Masthead />
      <CatalogGrid />
      <LandingCTA />
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

function setInterfaceSounds(on: boolean) {
  if (soundEnabled() === on) return
  setSoundEnabled(on)
  if (on) sfx("on")
}

function SoundToggle({ showLabel = false }: { showLabel?: boolean }) {
  const on = React.useSyncExternalStore(onSoundChange, soundEnabled)
  return (
    <button
      type="button"
      data-site-chip
      data-sfx="none"
      aria-pressed={on}
      aria-label="Interface sounds"
      title={on ? "Sounds on" : "Sounds off"}
      onClick={() => setInterfaceSounds(!on)}
    >
      {on ? <Volume2 aria-hidden size={14} /> : <VolumeX aria-hidden size={14} />}
      {showLabel && (on ? "On" : "Off")}
    </button>
  )
}

function AccentPicker({ chosen, choose }: { chosen: Accent; choose: (accent: Accent) => void }) {
  return (
    <div role="radiogroup" aria-label="Accent color" data-site-accents>
      {accents.map((accent) => (
        <button
          key={accent.id}
          type="button"
          role="radio"
          aria-checked={chosen.id === accent.id}
          aria-label={accent.name}
          title={accent.name}
          data-site-swatch
          style={{ "--swatch": `oklch(${accent.l} ${accent.c} ${accent.h})` } as React.CSSProperties}
          onClick={() => choose(accent)}
        />
      ))}
    </div>
  )
}

function useSitePreferences(root: React.RefObject<HTMLDivElement | null>) {
  const [chosen, setChosen] = React.useState<Accent>(accents[0])
  function choose(accent: Accent) {
    setChosen(accent)
    const el = root.current
    if (!el) return
    el.style.setProperty("--theme-l", String(accent.l))
    el.style.setProperty("--theme-c", String(accent.c))
    el.style.setProperty("--theme-h", String(accent.h))
  }
  const settings: SearchSetting[] = [
    ...accents.map((accent) => ({
      value: `accent-${accent.id}`,
      label: `Set accent to ${accent.name}`,
      keywords: ["change color", "change theme", ...[accent.name, ...accent.colors].flatMap((color) => [
        color, `theme ${color}`, `accent ${color}`, `change color to ${color}`,
      ])],
      icon: <Palette aria-hidden />,
      apply: () => choose(accent),
    })),
    ...fxLevels.map((level) => ({
      value: `fx-${level}`,
      label: `Set effects to ${level}`,
      keywords: ["motion", "animation", `FX ${level}`],
      icon: <Sparkles aria-hidden />,
      apply: () => setFxLevel(level),
    })),
    {
      value: "sound-on", label: "Turn interface sounds on", keywords: ["enable audio", "unmute"],
      icon: <Volume2 aria-hidden />, apply: () => setInterfaceSounds(true),
    },
    {
      value: "sound-off", label: "Turn interface sounds off", keywords: ["disable audio", "mute"],
      icon: <VolumeX aria-hidden />, apply: () => setInterfaceSounds(false),
    },
  ]
  return { chosen, choose, settings }
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

type SectionNavProps = { currentSection?: string; isExample: boolean }

function SectionNav({ currentSection, isExample, onNavigate }: SectionNavProps & { onNavigate?: () => void }) {
  const inDrawer = Boolean(onNavigate)
  return (
    <nav aria-label="Sections" data-site-nav={inDrawer ? "drawer" : "bar"}>
      {sections.map((entry) => (
        <a key={entry.route} href={`/${entry.route}`} onClick={onNavigate}
          aria-current={entry.route === currentSection ? (isExample ? "true" : "page") : undefined}>
          {entry.title}
          {entry.route === "examples" && (
            <>
              <span data-site-count aria-hidden>{examples.length}</span>
              <span data-sr-only>, {examples.length} screens</span>
            </>
          )}
          {inDrawer && <ArrowUpRight aria-hidden />}
        </a>
      ))}
      <RepositoryLink iconOnly={!inDrawer} />
    </nav>
  )
}

function MobileMenu({ children, ...nav }: SectionNavProps & { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="site-mobile-menu">
      <Drawer title="Menu" side="bottom" open={open} onOpenChange={setOpen}
        trigger={<><Menu aria-hidden /> Menu</>}>
        <SectionNav {...nav} onNavigate={() => setOpen(false)} />
        <div className="site-menu-settings">{children}</div>
      </Drawer>
    </div>
  )
}

const compactHeader = matchMedia("(max-width: 975px)")
function subscribeCompactHeader(notify: () => void) {
  compactHeader.addEventListener("change", notify)
  return () => compactHeader.removeEventListener("change", notify)
}

function SiteHeader({ root, ...nav }: SectionNavProps & { root: React.RefObject<HTMLDivElement | null> }) {
  const compact = React.useSyncExternalStore(subscribeCompactHeader, () => compactHeader.matches)
  const { chosen, choose, settings } = useSitePreferences(root)
  const accent = <AccentPicker chosen={chosen} choose={choose} />
  return (
    <header data-site-bar>
      <a href="/" data-site-brand aria-label="Cyberspec, home">
        <span data-site-brand-full><Brand /></span>
        <span data-site-brand-compact><Brand markOnly /></span>
      </a>
      {!compact && <SectionNav {...nav} />}
      <div data-site-tools>
        <SiteSearch settings={settings} />
        {compact ? (
          <MobileMenu key={location.pathname} {...nav}>
            <div><span>Accent</span>{accent}</div>
            <div><span>Effects</span><FxSwitch /></div>
            <div><span>Sound</span><SoundToggle showLabel /></div>
          </MobileMenu>
        ) : (
          <>{accent}<FxSwitch /><SoundToggle /></>
        )}
      </div>
    </header>
  )
}

function Site({ route }: { route: string }) {
  const preview = route.startsWith("preview/")
  const exampleIndex = examples.findIndex((example) => example.route === route)
  const example = examples[exampleIndex]
  const section = sections.find((entry) => entry.route === route)
  const pageRoute = preview || section || example ? route : ""
  const root = React.useRef<HTMLDivElement>(null)
  const level = React.useSyncExternalStore(onFxChange, fxLevel)
  const header = <SiteHeader root={root} currentSection={example ? "examples" : section?.route} isExample={Boolean(example)} />
  return (
    <div ref={root} data-skin="cyber" data-fx={level} data-crt="" data-site>
      <a href="#main" data-site-skip>Skip to content</a>
      <SiteFrame header={header}>
        <main id="main" tabIndex={-1} data-site-page={preview ? "preview" : pageRoute || "landing"}>
          {(example || section?.route === "examples") && (
            <header data-kit="page-head">
              {example && (
                <Breadcrumb
                  label="You are here"
                  items={[{ label: "Examples", href: "/examples" }, { label: example.title }]}
                />
              )}
              <h1>{example?.title ?? section?.title}</h1>
              <p>{example?.line ?? section?.line}</p>
            </header>
          )}
          <Page route={pageRoute} />
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
          <RepositoryLink />
        </footer>
      </SiteFrame>
      <AgentPrompt />
      <Toasts />
    </div>
  )
}

export { Site, sections }
