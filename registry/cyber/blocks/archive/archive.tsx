import * as React from "react"
import { ArrowUpRight, Cpu, MapPin, Search, SquareTerminal, Users } from "lucide-react"
import { Plate } from "@/registry/cyber/blocks/archive/art"
import { entries, entriesIn, entryOf, sectionOf, sections, type Entry, type Section } from "@/registry/cyber/blocks/archive/data"
import { Badge } from "@/registry/cyber/ui/badge"
import { Breadcrumb } from "@/registry/cyber/ui/breadcrumb"
import { Button } from "@/registry/cyber/ui/button"
import { Drawer } from "@/registry/cyber/ui/drawer"
import { GlitchText } from "@/registry/cyber/ui/glitch-text"
import { ItemList } from "@/registry/cyber/ui/item-list"
import { Barcode, Corners, DataStream, Micro, Ruler } from "@/registry/cyber/ui/micro"
import { Readout } from "@/registry/cyber/ui/readout"
import { Screen } from "@/registry/cyber/ui/screen"
import { SideTabs } from "@/registry/cyber/ui/side-tabs"
import { TextField } from "@/registry/cyber/ui/text-field"
import { notify } from "@/registry/cyber/ui/toaster"
import { Toggle } from "@/registry/cyber/ui/toggle"
import "@/registry/cyber/blocks/archive/archive.css"

// The archive: what the deck knows about the Sprawl, in four sections. The
// keys down the side pick a section, the list picks a record, and the
// dossier beside it shows that record: a plate, the facts, the first of the
// text. "Open record" puts the whole entry on a sheet.
//
// Each section remembers its own record and its own filter, so coming back
// to a section finds it as it was left. A filter never changes what was
// chosen: while the chosen record is filtered out the dossier shows the
// first match, and clearing the filter brings the choice back.
//
// One record can be tracked. It's the only thing here in yellow.

const icons: Record<Section, React.ReactNode> = {
  people: <Users aria-hidden />,
  places: <MapPin aria-hidden />,
  machines: <Cpu aria-hidden />,
  programs: <SquareTerminal aria-hidden />,
}

const two = (n: number) => String(n).padStart(2, "0")

// A filter looks through everything the dossier prints about a record
// except its paragraphs: "lowtide" finds the district and the people based
// there.
const haystack = (entry: Entry) => [entry.name, entry.meta, entry.code, ...entry.facts.map(([, value]) => value)].join(" ").toLowerCase()

function match(section: Section, filter: string) {
  const all = entriesIn(section)
  const query = filter.trim().toLowerCase()
  return query ? all.filter((entry) => haystack(entry).includes(query)) : all
}

function Facts({ entry, full }: { entry: Entry; full?: boolean }) {
  const facts = full ? [...entry.facts, ["Record", entry.code] as const, ["Section", sectionOf(entry.section).label] as const] : entry.facts
  return (
    <dl data-archive-facts="">
      {facts.map(([term, value]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Records({
  section,
  shown,
  entry,
  filter,
  tracked,
  onChoose,
  onFilter,
  onTrack,
  onJump,
  onShown,
}: {
  section: Section
  /** The records the filter lets through. */
  shown: Entry[]
  /** The record in the dossier. */
  entry: Entry
  filter: string
  tracked: string | null
  onChoose: (id: string) => void
  onFilter: (text: string) => void
  onTrack: (id: string | null) => void
  onJump: (id: string) => void
  /** Runs once a record is on screen, with the dossier's heading. */
  onShown: (id: string, heading: HTMLElement | null) => void
}) {
  const { label, one, seek } = sectionOf(section)
  const all = entriesIn(section)
  const [open, setOpen] = React.useState(false)
  const dossier = React.useRef<HTMLElement>(null)
  const heading = React.useId()

  // The record open on arrival is simply there (the section's own panel has
  // already torn in). Any record after it tears in by itself.
  const [first] = React.useState(entry.id)
  const [moved, setMoved] = React.useState(false)
  if (!moved && entry.id !== first) setMoved(true)

  React.useEffect(() => {
    onShown(entry.id, dossier.current?.querySelector("h2") ?? null)
  }, [entry.id, onShown])

  const isTracked = tracked === entry.id
  const place = all.indexOf(entry)

  return (
    <div data-archive-section="">
      <div
        data-archive-index=""
        // Enter on a row opens the record it has already chosen.
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.target as Element).closest('[role="option"]')) setOpen(true)
        }}
      >
        <TextField
          label={`Filter ${label.toLowerCase()}`}
          icon={<Search />}
          value={filter}
          onValueChange={onFilter}
          placeholder={seek}
          hint={`${shown.length} of ${all.length} shown`}
          autoComplete="off"
          clearable
          data-archive-filter=""
        />
        {shown.length ? (
          <ItemList
            label={`${label} on file`}
            items={shown.map((item) => ({
              value: item.id,
              label: item.name,
              meta: item.meta,
              flag: item.id === tracked ? "Tracked" : undefined,
            }))}
            value={entry.id}
            onValueChange={(id) => {
              if (id) onChoose(id)
            }}
          />
        ) : (
          <p data-kit="hint" data-archive-empty="" role="status">
            No {one} on file matches “{filter.trim()}”. The dossier is holding the last record.
          </p>
        )}
        <div data-archive-index-foot="" aria-hidden>
          <Ruler />
          <Micro>
            IDX {section.slice(0, 3)} // {two(shown.length)} of {two(all.length)} // NODE 3F:A2
          </Micro>
        </div>
      </div>

      <article data-archive-dossier="" aria-labelledby={heading} ref={dossier}>
        <div data-archive-plate="" data-frame="tl br">
          <div data-archive-plate-head="">
            <Micro>
              {entry.code} // PLATE {two(place + 1)}/{two(all.length)}
            </Micro>
            <Micro>REV 0.1</Micro>
          </div>
          <div key={entry.id} data-archive-still="" data-scanlines="" data-swap={moved ? "" : undefined}>
            <Plate entry={entry} variant={place} />
            <Corners inset={6} size={10} />
          </div>
          <div data-archive-plate-foot="">
            <DataStream rows={4} bytes={3} seed={entry.id} />
            <Barcode value={entry.code} size={22} />
          </div>
        </div>

        <div data-archive-sheet="">
          <Breadcrumb label="Record location" items={[{ label: "Archive" }, { label }, { label: entry.name }]} />
          <div key={entry.id} data-archive-entry="" data-swap={moved ? "" : undefined}>
            <header data-archive-name="">
              <GlitchText as="h2" id={heading} tabIndex={-1} decode={moved ? "mount" : "none"}>
                {entry.name}
              </GlitchText>
              <p data-archive-tags="">
                <Badge tone="mute">{entry.code}</Badge>
                {/* A district's list column is its sector, which its serial already says. */}
                <Badge tone="signal">{section === "places" ? "District" : entry.meta}</Badge>
                {isTracked && <Badge tone="flag">Tracked</Badge>}
              </p>
            </header>
            <Facts entry={entry} />
            <div data-archive-text="">
              {entry.text.slice(0, 2).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div data-archive-actions="">
            <Drawer
              trigger="Open record"
              triggerTone="primary"
              title={entry.name}
              description={entry.summary}
              code={`${entry.code} // FULL RECORD`}
              open={open}
              onOpenChange={setOpen}
            >
              <Facts entry={entry} full />
              <div data-archive-text="">
                {entry.text.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <h3 data-kit="label">Field notes</h3>
              <ol>
                {entry.notes.map(([at, note]) => (
                  <li key={at}>
                    <time>{at}</time>
                    <span>{note}</span>
                  </li>
                ))}
              </ol>
              <div data-archive-record-foot="" aria-hidden>
                <Barcode value={`${entry.code} ${entry.id}`} size={20} />
                <Micro>PROTOCOL 7741-C // READ ONLY</Micro>
              </div>
            </Drawer>
            <Toggle
              pressed={isTracked}
              onPressedChange={(pressed) => {
                onTrack(pressed ? entry.id : null)
                if (pressed) notify(`Tracking ${entry.name}`, { description: "Its row is flagged, and the status strip follows it." })
                else notify(`${entry.name} released`, { description: "Nothing is tracked." })
              }}
            >
              Track record
            </Toggle>
          </div>

          <section data-archive-links="" aria-labelledby={`${heading}-links`}>
            <h3 id={`${heading}-links`} data-kit="label">
              Linked records
            </h3>
            <ul>
              {entry.links.map((id) => {
                const link = entryOf(id)
                return (
                  <li key={id}>
                    <Button size="sm" onClick={() => onJump(id)}>
                      {icons[link.section]}
                      <span data-sr-only>Go to </span>
                      {link.name}
                      <ArrowUpRight aria-hidden />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </section>

          <div data-archive-sheet-foot="" aria-hidden>
            <Ruler />
            <div>
              <Barcode value={entry.id} size={14} />
              <Micro>CS-A7 // {entry.code} // LINK STABLE</Micro>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}

const typing = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

export default function Archive() {
  const [section, setSection] = React.useState<Section>("people")
  const [chosen, setChosen] = React.useState<Record<Section, string>>({
    people: "mara-voss",
    places: "lowtide",
    machines: "vanta-mk2",
    programs: "ghostwrite",
  })
  const [filters, setFilters] = React.useState<Record<Section, string>>({ people: "", places: "", machines: "", programs: "" })
  const [tracked, setTracked] = React.useState<string | null>("sable-quinn")
  const [read, setRead] = React.useState<readonly string[]>([])
  const root = React.useRef<HTMLDivElement>(null)
  // Set by a jump: the record it leaves has taken the pressed key with it,
  // so focus goes to the heading of the record it lands on.
  const landing = React.useRef(false)

  const shown = match(section, filters[section])
  const entry = shown.find((item) => item.id === chosen[section]) ?? shown[0] ?? entryOf(chosen[section])

  const jump = (id: string) => {
    const target = entryOf(id)
    landing.current = target.id !== entry.id
    setSection(target.section)
    setChosen((now) => ({ ...now, [target.section]: id }))
    // A filter that would hide the record gives way to it.
    if (!match(target.section, filters[target.section]).includes(target)) setFilters((now) => ({ ...now, [target.section]: "" }))
  }

  const onShown = React.useCallback((id: string, heading: HTMLElement | null) => {
    setRead((now) => (now.includes(id) ? now : [...now, id]))
    if (!landing.current) return
    landing.current = false
    heading?.focus()
  }, [])

  // "/" goes to the filter from anywhere on the screen.
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return
      if ((event.target as Element | null)?.closest?.(`${typing}, [role="dialog"]`)) return
      const field = root.current?.querySelector<HTMLInputElement>("[data-archive-filter]")
      if (!field) return
      event.preventDefault()
      field.focus()
      field.select()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const following = tracked ? entryOf(tracked) : null

  return (
    <div data-kit="archive" ref={root}>
      <Screen
        label="Archive"
        status={
          <>
            <Readout label="Records on file" value={entries.length} size="sm" tone="accent" />
            <Readout label="Records read" value={read.length} size="sm" />
            <Readout label="In this section" value={shown.length} size="sm" />
          </>
        }
        aside={
          <>
            <dl data-archive-now="">
              <div>
                <dt data-kit="label">Tracking</dt>
                <dd data-tracked={following ? "" : undefined}>{following ? following.name : "Nothing"}</dd>
              </div>
            </dl>
            <Button size="sm" disabled={!following || following.id === entry.id} onClick={() => following && jump(following.id)}>
              Go to tracked record
            </Button>
          </>
        }
        hints={[
          { keys: ["↑", "↓"], label: "Browse" },
          { keys: "↵", label: "Open" },
          { keys: "/", label: "Filter" },
          { keys: "Esc", label: "Close" },
        ]}
        code="CS-A7 // ARCHIVE // READ ONLY // PROTOCOL 7741-C"
      >
        <SideTabs
          label="Archive sections"
          code="HALCYON SPRAWL"
          value={section}
          onValueChange={(value) => {
            if (value) setSection(value as Section)
          }}
          tabs={sections.map(({ value, label }) => ({
            value,
            label,
            icon: icons[value],
            content:
              value === section ? (
                <Records
                  section={value}
                  shown={shown}
                  entry={entry}
                  filter={filters[value]}
                  tracked={tracked}
                  onChoose={(id) => setChosen((now) => ({ ...now, [value]: id }))}
                  onFilter={(text) => setFilters((now) => ({ ...now, [value]: text }))}
                  onTrack={setTracked}
                  onJump={jump}
                  onShown={onShown}
                />
              ) : null,
          }))}
        />
      </Screen>
    </div>
  )
}
