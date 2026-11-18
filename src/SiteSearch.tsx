import { Blocks, CalendarDays, ListMusic, Monitor, PanelLeft, Search } from "lucide-react"
import { CommandPalette, type PaletteCommand, type PaletteGroup } from "@/registry/cyber/ui/command-palette"
import { panels } from "./catalog/panels"
import { examples } from "./Examples"
import { isCatalogSidebarOpen, navigate, sidebarRoute } from "./navigation"

type SearchSetting = PaletteCommand & { apply: () => void }

const pages: PaletteGroup = {
  label: "Pages",
  commands: [
    { value: "/components", label: "All components", keywords: ["catalog", "library"], icon: <Blocks aria-hidden /> },
    { value: `/${sidebarRoute}`, label: "Component sidebar", keywords: ["catalog", "sidebar view", "browse components"], icon: <PanelLeft aria-hidden /> },
    { value: "/examples", label: "All examples", keywords: ["screens", "blocks"], icon: <Monitor aria-hidden /> },
    { value: "/", label: "Home", keywords: ["landing page", "overview", "homepage"], icon: <Monitor aria-hidden /> },
    { value: "/#relay-schedule", label: "Radio schedule", keywords: ["relay schedule", "calendar", "broadcasts", "daily lineup", "feed"], icon: <CalendarDays aria-hidden /> },
    { value: "/#transmission-timeline", label: "Playback timeline", keywords: ["transmission timeline", "radio", "tracks", "scrubber"], icon: <ListMusic aria-hidden /> },
  ],
}

const examplePages: PaletteGroup = {
  label: "Examples",
  commands: examples.map((example) => ({
    value: `/${example.route}`,
    label: example.title,
    keywords: ["example", "screen", example.route, example.line, ...example.shows, ...(example.tag ? [example.tag] : [])],
    icon: <Monitor aria-hidden />,
  })),
}

const componentPages: PaletteGroup = {
  label: "Components",
  commands: panels.map((panel) => ({
    value: `/preview/${panel.name}`,
    label: panel.title,
    keywords: ["component", panel.name, panel.group, ...panel.uses],
    icon: <Blocks aria-hidden />,
  })),
}

function SiteSearch({ settings, shortcut }: { settings: SearchSetting[]; shortcut: string | null }) {
  const commands: PaletteGroup = {
    label: "Commands",
    commands: settings.map((setting) => ({
      ...setting,
      keywords: ["command", "commands", "settings", ...(setting.keywords ?? [])],
    })),
  }
  return (
    <div data-site-search>
      <CommandPalette
        shortcut={shortcut}
        trigger={<span data-site-search-label>Search</span>}
        triggerIcon={<Search aria-hidden />}
        title="Search Cyberspec"
        placeholder="Search components, examples, or commands"
        empty="No matching components, examples, or commands."
        code="CYBERSPEC // SEARCH"
        rankResults
        commands={[pages, commands, examplePages, componentPages]}
        onAction={(value) => {
          if (value.startsWith("/preview/") && isCatalogSidebarOpen(location.pathname.replace(/^\/+|\/+$/g, "")))
            navigate(`/${sidebarRoute}/${value.slice("/preview/".length)}`)
          else if (value.startsWith("/")) navigate(value)
          else settings.find((setting) => setting.value === value)?.apply()
        }}
      />
    </div>
  )
}

export { SiteSearch }
export type { SearchSetting }
