import * as React from "react"
import { ArrowLeft, ArrowRight, ArrowUpRight, LayoutGrid, Menu, Music2, Palette, PanelLeftClose, PanelLeftOpen, Pause, SlidersHorizontal, Sparkles, Volume2, VolumeX } from "lucide-react"
import { CatalogGrid, Preview } from "./catalog/Catalog"
import { ComponentIndex, MobileComponentIndex } from "./catalog/ComponentIndex"
import { panels } from "./catalog/panels"
import { fxLevel, fxLevels, onFxChange, setFxLevel } from "@/registry/cyber/lib/fx"
import { accents, HeaderPreferences, setInterfaceSounds, type Accent } from "./HeaderPreferences"
import { installCommands, repositoryUrl } from "./install"
import { Brand } from "./Brand"
import { BootScreen } from "./BootScreen"
import { useEntrance } from "./useEntrance"
import { usePageScroll } from "./usePageScroll"
import { isCatalogSidebarOpen, isSidebarRoute, navigate, sidebarRoute } from "./navigation"
import soundtrack from "./audio/cyberspec-theme.mp3"
import { CopyPrompt } from "./CopyPrompt"
import Landing from "./Landing"
import { SiteFrame } from "./SiteFrame"
import { LandingCTA } from "./LandingCTA"
import { DialogTrigger } from "@ui-sdk/react/dialog"
import { MobileMenuDialog } from "./MobileMenuDialog"
import { Popover } from "@/registry/cyber/ui/popover"
import { Button } from "@/registry/cyber/ui/button"
import { Examples, examples } from "./Examples"
import { SiteSearch, type SearchSetting } from "./SiteSearch"
import { AgentPrompt } from "@/registry/cyber/blocks/daemon/agent-prompt"
import { CodeBlock } from "@/registry/cyber/ui/code-block"
import { Ruler } from "@/registry/cyber/ui/micro"
import { Panel } from "@/registry/cyber/ui/panel"
import { Readout } from "@/registry/cyber/ui/readout"
import { notify, Toasts } from "@/registry/cyber/ui/toaster"
import "./site-menu.css"
import "./landing-entry.css"

// A screen is registry/cyber/blocks/<name>/<name>.tsx, found by name and
// loaded when its page opens.
const blocks = import.meta.glob<{ default: React.ComponentType }>("/registry/cyber/blocks/*/*.tsx")
const blockOf = (name: string) => blocks[`/registry/cyber/blocks/${name}/${name}.tsx`]
const SidebarCatalog = React.lazy(() => import("./catalog/SidebarCatalog"))

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
        <h1>Components</h1>
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

// Toggling the index changes the layout around the demos. Keep their React
// trees in place while CSS adjusts the available width.
const CatalogContent = React.memo(function CatalogContent() {
  return (
    <>
      <Masthead />
      <CatalogGrid />
      <LandingCTA />
    </>
  )
})

function mediaStore(query: string) {
  const media = matchMedia(query)
  return {
    matches: () => media.matches,
    subscribe(notify: () => void) {
      media.addEventListener("change", notify)
      return () => media.removeEventListener("change", notify)
    },
  }
}
const compactIndex = mediaStore("(max-width: 820px)")
const compactHeader = mediaStore("(max-width: 975px)")

function CatalogPage({ route }: { route: string }) {
  const detail = isSidebarRoute(route)
  const name = route.slice(sidebarRoute.length + 1)
  const spec = detail ? (name ? panels.find(panel => panel.name === name) : panels[0]) : undefined
  const sidebarOpen = isCatalogSidebarOpen(route)
  const mobile = React.useSyncExternalStore(compactIndex.subscribe, compactIndex.matches)
  const wasOpen = React.useRef(sidebarOpen)
  React.useLayoutEffect(() => {
    if (!mobile && wasOpen.current && !sidebarOpen && !location.hash)
      document.getElementById("catalog-toggle")?.focus({ preventScroll: true })
    wasOpen.current = sidebarOpen
  }, [sidebarOpen, mobile])

  function toggleSidebar() {
    const url = new URL(location.href)
    const nextOpen = !sidebarOpen
    // Store only the override: docs open by default and the grid starts closed.
    if (nextOpen === detail) url.searchParams.delete("sidebar")
    else url.searchParams.set("sidebar", nextOpen ? "open" : "closed")
    navigate(url.href, { scroll: false })
  }
  return (
    <div className="catalog-overview" data-sidebar-open={(!mobile && sidebarOpen) || undefined}>
      <div className="catalog-index-controls">
        {mobile ? <MobileComponentIndex spec={spec} /> : (<>
          <Button id="catalog-toggle" size="sm" className="catalog-index-toggle" aria-expanded={sidebarOpen}
            aria-controls="catalog-sidebar-panel" onClick={toggleSidebar}>
            {sidebarOpen ? <PanelLeftClose aria-hidden /> : <PanelLeftOpen aria-hidden />}
            {sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          </Button>
          <div className="catalog-sidebar-panel" id="catalog-sidebar-panel" inert={!sidebarOpen}>
            <ComponentIndex spec={spec} />
          </div>
        </>)}
      </div>
      <div className="catalog-grid-content">
        {detail ? (
          <React.Suspense fallback={<p role="status">Loading component…</p>}>
            <SidebarCatalog spec={spec} sidebarOpen={sidebarOpen} />
          </React.Suspense>
        ) : <CatalogContent />}
      </div>
    </div>
  )
}

function Page({ route }: { route: string }) {
  if (route === "components" || isSidebarRoute(route)) return <CatalogPage route={route} />
  if (route.startsWith("preview/")) return <Preview name={route.slice("preview/".length)} />
  if (!route) return <Landing />
  if (route === "examples") return <Examples />
  return <Screen name={route} />
}

type MusicControls = { playing: boolean; toggle: () => void }

function useSitePreferences(root: React.RefObject<HTMLDivElement | null>, music: MusicControls) {
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
    {
      value: "background-music", label: music.playing ? "Pause background music" : "Play background music",
      keywords: ["song", "soundtrack", "CyberSpec Theme"], icon: <Music2 aria-hidden />, apply: music.toggle,
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
        <a href={`/${previous.route}`} rel="prev" aria-label={`Previous example, ${previous.title}`}>
          <ArrowLeft aria-hidden /> {previous.title}
        </a>
      ) : (
        <span />
      )}
      <a href="/examples">All examples</a>
      {next ? (
        <a href={`/${next.route}`} rel="next" aria-label={`Next example, ${next.title}`}>
          {next.title} <ArrowRight aria-hidden />
        </a>
      ) : (
        <span />
      )}
    </nav>
  )
}

type SectionNavProps = { currentSection?: string; isSubpage: boolean }

function SectionNav({ currentSection, isSubpage, onNavigate }: SectionNavProps & { onNavigate?: () => void }) {
  const inMenu = Boolean(onNavigate)
  return (
    <nav aria-label="Sections" data-site-nav={inMenu ? "menu" : "bar"}>
      {inMenu && <a href="/" onClick={onNavigate} aria-current={location.pathname === "/" ? "page" : undefined}>
        Home <ArrowUpRight aria-hidden />
      </a>}
      {sections.map((entry) => (
        <a key={entry.route} href={`/${entry.route}`} onClick={onNavigate}
          aria-current={entry.route === currentSection ? (isSubpage ? "true" : "page") : undefined}>
          {entry.title}
          {entry.route === "examples" && (
            <>
              <span data-site-count aria-hidden>{examples.length}</span>
              <span data-sr-only>, {examples.length} screens</span>
            </>
          )}
          {inMenu && <ArrowUpRight aria-hidden />}
        </a>
      ))}
      <RepositoryLink iconOnly={!inMenu} />
    </nav>
  )
}

function MobileMenu({ children, ...nav }: SectionNavProps & { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="site-mobile-menu">
      <MobileMenuDialog title="Menu" open={open} onOpenChange={setOpen}
        trigger={<DialogTrigger data-kit="button" data-frame="br" data-tone="ghost" data-press-flash="">
          <Menu aria-hidden /> Menu
        </DialogTrigger>}>
        <div className="site-menu-body">
          <SectionNav {...nav} onNavigate={() => setOpen(false)} />
          {children}
        </div>
      </MobileMenuDialog>
    </div>
  )
}

function SiteHeader({ root, music, booting, ...nav }: SectionNavProps & {
  root: React.RefObject<HTMLDivElement | null>
  music: MusicControls
  booting: boolean
}) {
  const compact = React.useSyncExternalStore(compactHeader.subscribe, compactHeader.matches)
  const { chosen, choose, settings } = useSitePreferences(root, music)
  const musicButton = (
    <Button tone="ghost" size="sm" data-site-music="" data-sfx="none"
      aria-label={compact ? `${music.playing ? "Pause" : "Play"} background music` : "Background music"}
      aria-pressed={music.playing} title={`${music.playing ? "Pause" : "Play"} CyberSpec Theme`} onClick={music.toggle}>
      {music.playing ? <Pause aria-hidden /> : <Music2 aria-hidden />}
      {compact ? (music.playing ? "Pause" : "Play") : "Music"}
    </Button>
  )
  return (
    <header data-site-bar>
      {compact && (
        <MobileMenu {...nav}>
          <HeaderPreferences chosen={chosen} choose={choose}>
            <div><span data-kit="label">Music</span>{musicButton}</div>
          </HeaderPreferences>
        </MobileMenu>
      )}
      <a href="/" data-site-brand aria-label="Cyberspec, home">
        <span data-site-brand-full><Brand /></span>
        <span data-site-brand-compact><Brand markOnly /></span>
      </a>
      {!compact && <SectionNav {...nav} />}
      <div data-site-tools>
        <SiteSearch settings={settings} shortcut={booting ? null : "mod+k"} />
        {!compact && (
          <div className="site-header-utilities">
            <div className="site-settings-trigger">
              <Popover title="Interface settings" trigger={<><SlidersHorizontal aria-hidden /> Settings</>}
                triggerTone="ghost" align="end" code="">
                <HeaderPreferences chosen={chosen} choose={choose} />
              </Popover>
            </div>
            {musicButton}
          </div>
        )}
      </div>
    </header>
  )
}

function Site({ route }: { route: string }) {
  const preview = route.startsWith("preview/")
  const sidebar = isSidebarRoute(route)
  const exampleIndex = examples.findIndex((example) => example.route === route)
  const example = examples[exampleIndex]
  const section = sections.find((entry) => entry.route === (sidebar ? "components" : route))
  const pageRoute = preview || section || example ? route : ""
  const root = React.useRef<HTMLDivElement>(null)
  const previousPage = React.useRef(pageRoute)
  React.useLayoutEffect(() => {
    // A pager link can survive the route change at the bottom of the page.
    if (previousPage.current !== pageRoute && !location.hash && (example || pageRoute === "examples"))
      root.current?.querySelector<HTMLElement>("main")?.focus({ preventScroll: true })
    previousPage.current = pageRoute
  }, [example, pageRoute])
  const level = React.useSyncExternalStore(onFxChange, fxLevel)
  const prefersReducedMotion = React.useSyncExternalStore(onFxChange, () => matchMedia("(prefers-reduced-motion: reduce)").matches)
  const reduced = level !== "full" || prefersReducedMotion
  const { showBoot, entering, enter } = useEntrance(!route && !location.hash, reduced)
  usePageScroll(!reduced && !showBoot)
  const player = React.useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = React.useState(false)
  function playMusic() {
    const audio = player.current
    if (!audio) return
    if (audio.error) audio.load()
    void audio.play().catch((error: DOMException) => {
      if (error.name !== "AbortError" && !audio.error) notify("Music couldn’t start. Try the music control.")
    })
  }
  function toggleMusic() {
    if (player.current?.paused) playMusic()
    else player.current?.pause()
  }
  const header = <SiteHeader root={root} music={{ playing, toggle: toggleMusic }} booting={showBoot}
    currentSection={example ? "examples" : section?.route} isSubpage={Boolean(example) || sidebar} />
  return (
    <div ref={root} data-skin="cyber" data-fx={level} data-crt="" data-site
      data-entrance={entering ? "revealing" : showBoot ? "boot" : undefined}>
      <audio ref={player} src={soundtrack} loop preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onError={() => { setPlaying(false); notify("The background track couldn’t load. Try the music control.") }} />
      {showBoot && <BootScreen reduced={reduced} exiting={entering} onEnter={withMusic => {
        if (withMusic) playMusic()
        enter()
      }} />}
      <a href="#main" data-site-skip>Skip to content</a>
      <SiteFrame header={header}>
        <main id="main" tabIndex={-1} data-site-example={example ? "" : undefined} data-site-page={sidebar ? "component-sidebar" : preview ? "preview" : pageRoute || "landing"}>
          {(example || section?.route === "examples") && (
            <header data-kit="page-head">
              <h1>{example?.title ?? section?.title}</h1>
              {example && <a href="/examples" data-example-index-link=""><LayoutGrid aria-hidden /> Examples</a>}
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
