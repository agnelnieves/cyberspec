import * as React from "react"
import { Briefcase, House, LocateFixed, MessageSquare, Minus, Navigation, Plus, Store } from "lucide-react"
import { sfx } from "@/registry/cyber/lib/sound"
import {
  H,
  SECTOR_H,
  SECTOR_W,
  W,
  canalY,
  city,
  districtAt,
  landmarks,
  pathOf,
  sectorAt,
  stations,
  type Kind,
  type Marker,
} from "@/registry/cyber/blocks/grid/city"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { ButtonGroup } from "@/registry/cyber/ui/button-group"
import { Collapsible } from "@/registry/cyber/ui/collapsible"
import { Corners, Micro } from "@/registry/cyber/ui/micro"
import { Panel } from "@/registry/cyber/ui/panel"
import { Readout } from "@/registry/cyber/ui/readout"
import { Reticle } from "@/registry/cyber/ui/reticle"
import { Screen } from "@/registry/cyber/ui/screen"
import { notify } from "@/registry/cyber/ui/toaster"
import { ToggleGroup } from "@/registry/cyber/ui/toggle-group"
import { Tooltip } from "@/registry/cyber/ui/tooltip"
import "@/registry/cyber/blocks/grid/grid.css"

// The district map. The sheet is drawn once, from the generator in city.ts;
// over it stand the markers (each a key), the runner's own position, and the
// route to the waypoint in yellow. The sheet moves by transform alone: drag
// it, or focus it and use the arrows, and zoom with the keys in its corner
// or with plus and minus. Choosing a marker fills the dossier beside the
// map; "Set waypoint" redraws the route to it.
//
// At full width the panels float over the edges of the sheet, the way a deck
// overlays its map, and the sheet is told how much of itself they cover
// (--grid-l and --grid-r) so that centering and "bring into view" aim for
// the clear middle. On a narrow screen the map takes the width and the
// panels follow it.

const kinds: { value: Kind; label: string; plural: string; icon: React.ReactNode }[] = [
  { value: "job", label: "Job", plural: "Jobs", icon: <Briefcase aria-hidden /> },
  { value: "vendor", label: "Vendor", plural: "Vendors", icon: <Store aria-hidden /> },
  { value: "safehouse", label: "Safehouse", plural: "Safehouses", icon: <House aria-hidden /> },
  { value: "contact", label: "Contact", plural: "Contacts", icon: <MessageSquare aria-hidden /> },
]
const kindOf = (kind: Kind) => kinds.find((entry) => entry.value === kind)!

// Nearest first: that's the order the markers are reached by Tab.
const markers = [...city.markers].sort((a, b) => a.metres - b.metres)
const tracked = city.markers[0]

// The view opens on the middle of the first route, so both of its ends show.
const opening = {
  x: (Math.min(...tracked.route.map(([x]) => x)) + Math.max(...tracked.route.map(([x]) => x))) / 2,
  y: (Math.min(...tracked.route.map(([, y]) => y)) + Math.max(...tracked.route.map(([, y]) => y))) / 2,
}

// Zoom steps, and how much closer than "covering" a snug window opens.
const zooms = [1, 1.4, 2, 3]
const START_ZOOM = 0
const BASE = 1.14

type View = { zoom: number; x: number; y: number }
type Size = { w: number; h: number; l: number; r: number }

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

// Where the sheet sits for a view: its scale, its offset, and the view's
// center after clamping, so the sheet always covers the whole viewport.
function place(view: View, size: Size | null) {
  if (!size) return { k: 1, tx: 0, ty: 0, x: view.x, y: view.y, tall: false }
  // The scale at which the sheet just covers the window. Where that leaves
  // almost nothing to pan to (a window shaped like the sheet), it opens a
  // little closer; a tall window already has the sheet's width to cross.
  const cover = Math.max(size.w / W, size.h / H)
  const snug = W * cover - size.w < size.w * 0.12 && H * cover - size.h < size.h * 0.12
  const k = cover * (snug ? BASE : 1) * zooms[view.zoom]
  const midX = (size.l + size.w - size.r) / 2
  const midY = size.h / 2
  const tx = clamp(midX - view.x * k, size.w - W * k, 0)
  const ty = clamp(midY - view.y * k, size.h - H * k, 0)
  return { k, tx, ty, x: (midX - tx) / k, y: (midY - ty) / k, tall: H * k - size.h > 1 }
}

// The sheet itself. It never changes, so it's drawn once and left alone
// while the view moves over it.
const Terrain = React.memo(function Terrain() {
  const { paths } = city
  const columns = Array.from({ length: 8 }, (_, i) => i)
  const rows = Array.from({ length: 5 }, (_, i) => i)
  return (
    <svg data-grid-terrain="" viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false">
      <g data-grid-survey="">
        {columns.slice(1).map((i) => (
          <path key={`c${i}`} d={`M${i * SECTOR_W} 0V${H}`} />
        ))}
        {rows.slice(1).map((i) => (
          <path key={`r${i}`} d={`M0 ${i * SECTOR_H}H${W}`} />
        ))}
      </g>
      <path data-grid-water="bank" d={paths.canal} />
      <path data-grid-water="" d={paths.canal} />
      <path data-grid-water="flow" d={paths.canal} />
      <path data-grid-road="minor" d={paths.minor} />
      <path data-grid-road="major" d={paths.major} />
      <path data-grid-road="bridge-bed" d={paths.bridges} />
      <path data-grid-road="bridge" d={paths.bridges} />
      <path data-grid-lot="" d={paths.lots} />
      {paths.blocks.map((d, tone) => (
        <path key={tone} data-grid-block={tone} d={d} />
      ))}
      <path data-grid-rail="bed" d={paths.rail} />
      <path data-grid-rail="ties" d={paths.rail} />
      <path data-grid-rail="" d={paths.rail} />
      {stations.map(([x, y]) => (
        <path key={`${x}`} data-grid-rail="station" d={`M${x - 7} ${y - 7}h14v14h-14Z`} />
      ))}
      {landmarks.map((mark) =>
        mark.id === "exchange" ? (
          <g key={mark.id} data-grid-landmark="">
            {[1, 0.72, 0.44].map((scale) => (
              <path key={scale} d={hexagon(mark.x, mark.y, mark.r * scale)} />
            ))}
            <path data-grid-landmark-core="" d={hexagon(mark.x, mark.y, mark.r * 0.2)} />
            <path
              d={[0, 1, 2, 3, 4, 5]
                .map((i) => {
                  const a = (Math.PI / 3) * i
                  return `M${mark.x + Math.cos(a) * mark.r * 0.44} ${mark.y + Math.sin(a) * mark.r * 0.44}L${mark.x + Math.cos(a) * mark.r} ${mark.y + Math.sin(a) * mark.r}`
                })
                .join("")}
            />
          </g>
        ) : (
          <g key={mark.id} data-grid-landmark="">
            {[1, 0.66, 0.34].map((scale) => (
              <path key={scale} d={diamond(mark.x, mark.y, mark.r * scale)} />
            ))}
            <path data-grid-landmark-core="" d={diamond(mark.x, mark.y, mark.r * 0.16)} />
            <path d={`M${mark.x - mark.r} ${mark.y}h${mark.r * 0.66}M${mark.x + mark.r} ${mark.y}h${-mark.r * 0.66}M${mark.x} ${mark.y - mark.r}v${mark.r * 0.66}M${mark.x} ${mark.y + mark.r}v${-mark.r * 0.66}`} />
          </g>
        ),
      )}
      <g data-grid-print="">
        {columns.map((i) =>
          rows.map((j) => (
            <text key={`${i}${j}`} x={i * SECTOR_W + 5} y={j * SECTOR_H + 11}>
              {sectorAt(i * SECTOR_W + 1, j * SECTOR_H + 1)}
            </text>
          )),
        )}
        {landmarks.map((mark) => (
          <text key={mark.id} x={mark.x} y={mark.y + mark.r + 13} textAnchor="middle">
            {mark.name}
          </text>
        ))}
      </g>
      <text data-grid-name="" x="742" y="104" transform="rotate(-9 742 104)" textAnchor="middle">
        Glasswater
      </text>
      <text data-grid-name="" x="668" y="672" transform="rotate(6 668 672)" textAnchor="middle">
        Lowtide
      </text>
      <text data-grid-name="water" x="700" y={canalY(700) + 3} transform={`rotate(4 700 ${canalY(700)})`} textAnchor="middle">
        Sluice Canal
      </text>
    </svg>
  )
})

function hexagon(x: number, y: number, r: number) {
  const points = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6
    return `${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`
  })
  return `M${points.join("L")}Z`
}

const diamond = (x: number, y: number, r: number) => `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`

// One line of the legend: a swatch drawn with the map's own strokes, and
// what it stands for.
function LegendRow({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div role="listitem" data-grid-legend-row="">
      <span data-grid-swatch="" aria-hidden>
        {children}
      </span>
      <span>{label}</span>
      {value && <span data-kit="value">{value}</span>}
    </div>
  )
}

const stroke = (kind: React.ReactNode) => (
  <svg viewBox="0 0 28 12" focusable="false">
    {kind}
  </svg>
)

function useClock() {
  const [now, setNow] = React.useState(() => new Date())
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(timer)
  }, [])
  return now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export default function Grid() {
  const stage = React.useRef<HTMLDivElement>(null)
  const viewport = React.useRef<HTMLDivElement>(null)
  const measured = React.useRef<Size | null>(null)
  const [size, setSize] = React.useState<Size | null>(null)
  const [view, setView] = React.useState<View>({ zoom: START_ZOOM, ...opening })
  const [dragging, setDragging] = React.useState(false)
  const [shown, setShown] = React.useState<Kind[]>(kinds.map((kind) => kind.value))
  const [chosen, setChosen] = React.useState(tracked.id)
  const [waypointId, setWaypointId] = React.useState(tracked.id)
  const help = React.useId()
  const time = useClock()

  React.useLayoutEffect(() => {
    const el = viewport.current
    const host = stage.current
    if (!el || !host) return
    const measure = () => {
      const style = getComputedStyle(host)
      const next = {
        w: el.clientWidth,
        h: el.clientHeight,
        l: parseFloat(style.getPropertyValue("--grid-l")) || 0,
        r: parseFloat(style.getPropertyValue("--grid-r")) || 0,
      }
      measured.current = next
      setSize(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const at = place(view, size)
  const latest = React.useRef(at)
  React.useEffect(() => {
    latest.current = at
  })

  // Every move starts from where the sheet really is (the clamped center),
  // so pushing against an edge doesn't bank distance to be undone later.
  const move = (change: (now: View) => View) =>
    setView((now) => {
      const from = place(now, measured.current)
      const next = change({ zoom: now.zoom, x: from.x, y: from.y })
      const to = place(next, measured.current)
      return { zoom: next.zoom, x: to.x, y: to.y }
    })
  const pan = (dx: number, dy: number) => move((now) => ({ ...now, x: now.x + dx / latest.current.k, y: now.y + dy / latest.current.k }))
  const zoomBy = (step: number) => {
    const zoom = clamp(view.zoom + step, 0, zooms.length - 1)
    if (zoom === view.zoom) return false
    move((now) => ({ ...now, zoom }))
    return true
  }
  const centerOn = (point: { x: number; y: number }) => move((now) => ({ ...now, x: point.x, y: point.y }))

  const waypoint = markers.find((marker) => marker.id === waypointId) ?? tracked
  // The waypoint stays on the map whatever the filters say: the route ends there.
  const visible = markers.filter((marker) => shown.includes(marker.kind) || marker.id === waypoint.id)
  const selected = visible.find((marker) => marker.id === chosen) ?? waypoint
  const onRoute = selected.id === waypoint.id
  const kind = kindOf(selected.kind)

  const setWaypoint = (marker: Marker) => {
    if (marker.id === waypointId) return
    setChosen(marker.id)
    setWaypointId(marker.id)
    notify("Waypoint set", { tone: "success", description: `${marker.name}, ${marker.metres} m by street.` })
  }

  // A marker reached by Tab may be off the sheet's visible part, or under a
  // panel: bring it to the middle.
  const reveal = (marker: Marker) => {
    const s = measured.current
    if (!s) return
    const now = latest.current
    const x = now.tx + marker.x * now.k
    const y = now.ty + marker.y * now.k
    if (x < s.l + 24 || x > s.w - s.r - 24 || y < 24 || y > s.h - 24) centerOn(marker)
  }

  const drag = React.useRef<{ id: number; x: number; y: number; from: View; k: number } | null>(null)
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("button")) return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, from: { zoom: view.zoom, x: at.x, y: at.y }, k: at.k }
    // Capture keeps the drag alive past the window's edge; without it the
    // drag still works inside.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {}
    setDragging(true)
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start || start.id !== event.pointerId) return
    const x = start.from.x - (event.clientX - start.x) / start.k
    const y = start.from.y - (event.clientY - start.y) / start.k
    move(() => ({ zoom: start.from.zoom, x, y }))
  }
  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return
    drag.current = null
    setDragging(false)
  }

  // The map's own keys, live only while focus is on the sheet or a marker.
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const step = 96
    const keys: Record<string, () => void> = {
      ArrowLeft: () => pan(-step, 0),
      ArrowRight: () => pan(step, 0),
      ArrowUp: () => pan(0, -step),
      ArrowDown: () => pan(0, step),
      "+": () => { if (zoomBy(1)) sfx("increment") },
      "=": () => { if (zoomBy(1)) sfx("increment") },
      "-": () => { if (zoomBy(-1)) sfx("decrement") },
      _: () => { if (zoomBy(-1)) sfx("decrement") },
      "0": () => move((now) => ({ ...now, zoom: START_ZOOM })),
      Home: () => centerOn(city.you),
      w: () => {
        const id = (event.target as Element).closest("[data-grid-pin]")?.getAttribute("data-marker")
        setWaypoint(markers.find((marker) => marker.id === id) ?? selected)
      },
    }
    const act = keys[event.key.length === 1 ? event.key.toLowerCase() : event.key]
    if (!act) return
    event.preventDefault()
    act()
  }

  const percent = Math.round(zooms[view.zoom] * 100)
  const route = pathOf(waypoint.route)

  return (
    <Screen
      label="District map"
      status={
        <>
          <Readout label="Markers shown" value={visible.length} size="sm" tone="accent" />
          <Readout label="Route" value={waypoint.metres} unit="m" size="sm" tone="flag" />
          <Readout label="Zoom" value={percent} unit="%" size="sm" />
        </>
      }
      aside={
        <dl data-grid-now="">
          <div>
            <dt data-kit="label">Waypoint</dt>
            <dd>
              <Badge tone="flag">{waypoint.name}</Badge>
            </dd>
          </div>
          <div>
            <dt data-kit="label">In view</dt>
            <dd data-kit="value">
              {districtAt(at.x, at.y)} {sectorAt(at.x, at.y)}
            </dd>
          </div>
        </dl>
      }
      hints={[
        { keys: ["←", "↑", "↓", "→"], label: "Pan" },
        { keys: ["+", "-"], label: "Zoom" },
        { keys: "↵", label: "Select marker" },
        { keys: "W", label: "Waypoint" },
        { keys: "Home", label: "Find me" },
      ]}
      code="CS-G4 // SURVEY 7741-C // SHEET 04 // LINK STABLE"
    >
      <div data-kit="grid-map">
        <div ref={stage} data-grid-stage="">
          <h2 data-sr-only>Map</h2>
          <div
            ref={viewport}
            data-grid-view=""
            data-dragging={dragging ? "" : undefined}
            data-pan={at.tall ? "both" : "across"}
            role="group"
            aria-label="District map of Lowtide and Glasswater"
            aria-describedby={help}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onKeyDown={onKeyDown}
          >
            <p id={help} data-sr-only>
              Arrow keys pan the map. Plus and minus zoom. Home centers on your position. W sets the waypoint to the focused or selected marker.
              You are at Tidewall Row, {districtAt(city.you.x, city.you.y)}.
            </p>
            <div data-grid-world="" style={{ "--k": at.k, "--tx": `${at.tx}px`, "--ty": `${at.ty}px` } as React.CSSProperties}>
              <Terrain />
              {/* Remounted for each waypoint, so the new route tears in. */}
              <svg key={waypoint.id} data-grid-route="" viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false">
                <path data-grid-route-bed="" d={route} vectorEffect="non-scaling-stroke" />
                <path d={route} vectorEffect="non-scaling-stroke" />
              </svg>
              <span data-grid-pin="" data-grid-you="" style={{ "--x": city.you.x, "--y": city.you.y } as React.CSSProperties} aria-hidden>
                <svg viewBox="0 0 36 36" focusable="false">
                  <path data-grid-you-ring="" d="M18 2 32 10v16L18 34 4 26V10Z" />
                  <path d="M18 9l7 16-7-4-7 4Z" />
                </svg>
              </span>
              {visible.map((marker) => {
                const isChosen = marker.id === selected.id
                const isWaypoint = marker.id === waypoint.id
                const entry = kindOf(marker.kind)
                return (
                  <span
                    key={marker.id}
                    data-grid-pin=""
                    data-marker={marker.id}
                    data-chosen={isChosen ? "" : undefined}
                    style={{ "--x": marker.x, "--y": marker.y } as React.CSSProperties}
                  >
                    <Reticle active={isChosen} tag={isChosen ? (isWaypoint ? "Waypoint" : "Lock") : undefined}>
                      <Tooltip content={`${marker.name} · ${marker.metres} m${isWaypoint ? " · waypoint" : ""}`} side="bottom">
                        <Button
                          icon
                          tone={isWaypoint ? "flag" : "signal"}
                          aria-label={`${entry.label}: ${marker.name}`}
                          aria-pressed={isChosen}
                          onClick={() => setChosen(marker.id)}
                          onFocus={() => reveal(marker)}
                        >
                          {entry.icon}
                        </Button>
                      </Tooltip>
                    </Reticle>
                    {isWaypoint && !isChosen && (
                      <span data-grid-pennant="" aria-hidden>
                        WP
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
            <Corners size={10} inset={8} />
            <Micro data-grid-micro="top">Survey 7741-C // 1:8000 // North up</Micro>
            <Micro data-grid-micro="bottom">Node 3F:A2 // Sheet 04 of 11 // Rev 0.1</Micro>
          </div>
          {/* The frame's edge, laid over the sheet so its cut corners show. */}
          <span data-grid-edge="" data-frame="tl br" aria-hidden />

          <ButtonGroup
            label="Map zoom"
            data-grid-zoom=""
            keys={[
              { label: "Zoom out", icon: <Minus aria-hidden />, action: "decrement", disabled: view.zoom === 0, onPress: () => zoomBy(-1) },
              {
                label: `Reset zoom, ${percent}%`,
                content: <span data-kit="value">{percent}%</span>,
                onPress: () => move((now) => ({ ...now, zoom: START_ZOOM })),
              },
              { label: "Zoom in", icon: <Plus aria-hidden />, action: "increment", disabled: view.zoom === zooms.length - 1, onPress: () => zoomBy(1) },
              { label: "Center on my position", icon: <LocateFixed aria-hidden />, onPress: () => centerOn(city.you) },
            ]}
          />

          <div data-grid-rail="detail">
            <Panel
              title="Selected marker"
              code={`${selected.id.toUpperCase()} // SECTOR ${selected.sector} // ${onRoute ? "ON ROUTE" : "OFF ROUTE"}`}
              tone={onRoute ? "flag" : "default"}
              level={2}
              actions={<Badge tone={onRoute ? "flag" : "signal"}>{kind.label}</Badge>}
              footer={
                <p role="status">
                  {onRoute ? "Waypoint. The route ends here." : `The route runs to ${waypoint.name}.`}
                </p>
              }
            >
              {/* Keyed by the marker, so a new selection tears in; the keys
                  below stay mounted, and focus on them is never dropped. */}
              <div key={selected.id} data-grid-dossier="">
                <h3 data-grid-title="">{selected.name}</h3>
                <p data-kit="hint">
                  {selected.district}, sector {selected.sector}
                </p>
                <p>{selected.text}</p>
              </div>
              <div data-grid-figures="">
                <Readout label="Distance" value={selected.metres} unit="m" tone={onRoute ? "flag" : "signal"} />
                <Readout label="On foot" value={Math.max(1, Math.round(selected.metres / 80))} unit="min" size="sm" />
                <dl data-grid-fact="">
                  <dt data-kit="label">{selected.fact[0]}</dt>
                  <dd data-kit="value">{selected.fact[1]}</dd>
                </dl>
              </div>
              <div data-kit="actions">
                <Button size="sm" onClick={() => centerOn(selected)}>
                  <LocateFixed aria-hidden />
                  Show on map
                </Button>
                {/* A flag key that's off keeps its solid yellow under the hatching,
                    which leaves its label unreadable; off, it's a plain key. */}
                <Button size="sm" tone={onRoute ? "secondary" : "flag"} disabled={onRoute} focusableWhenDisabled onClick={() => setWaypoint(selected)}>
                  <Navigation aria-hidden />
                  Set waypoint
                </Button>
              </div>
            </Panel>

            <Panel title="Current location" code="FIX 3 OF 3 // DRIFT 0.4 M" tone="signal" level={2}>
              <p data-grid-here="">
                Tidewall Row
                <span data-kit="hint">
                  {districtAt(city.you.x, city.you.y)}, sector {sectorAt(city.you.x, city.you.y)}
                </span>
              </p>
              <dl data-grid-fact="">
                <dt data-kit="label">Local time</dt>
                <dd data-kit="value" data-grid-time="">
                  {time}
                </dd>
              </dl>
            </Panel>
          </div>

          <div data-grid-rail="filters">
            <Panel title="Filters" code="OVERLAY // 4 LAYERS" level={2}>
              <ToggleGroup<Kind>
                label="Marker kinds"
                multiple
                orientation="vertical"
                value={shown}
                onValueChange={(next) => setShown(next)}
                options={kinds.map((entry) => ({ value: entry.value, label: entry.plural, icon: entry.icon }))}
              />
              <Collapsible label="Legend" summary="10 symbols" defaultOpen>
                <div role="list" aria-label="Map legend" data-grid-legend="">
                  {kinds.map((entry) => (
                    <LegendRow
                      key={entry.value}
                      label={entry.label}
                      value={String(markers.filter((marker) => marker.kind === entry.value).length).padStart(2, "0")}
                    >
                      {entry.icon}
                    </LegendRow>
                  ))}
                  <LegendRow label="Waypoint">
                    <span data-grid-pennant="">WP</span>
                  </LegendRow>
                  <LegendRow label="Route">{stroke(<path data-grid-route-sample="" d="M1 9H12V3H27" />)}</LegendRow>
                  <LegendRow label="Your position">
                    <svg data-grid-you-sample="" viewBox="0 0 36 36" focusable="false">
                      <path data-grid-you-ring="" d="M18 2 32 10v16L18 34 4 26V10Z" />
                      <path d="M18 9l7 16-7-4-7 4Z" />
                    </svg>
                  </LegendRow>
                  <LegendRow label="Street, avenue">
                    {stroke(
                      <>
                        <path data-grid-road="minor" d="M1 3H27" />
                        <path data-grid-road="major" d="M1 9H27" />
                      </>,
                    )}
                  </LegendRow>
                  <LegendRow label="Canal">{stroke(<path data-grid-water="sample" d="M0 6H28" />)}</LegendRow>
                  <LegendRow label="Rail">
                    {stroke(
                      <>
                        <path data-grid-rail="ties" d="M1 6H27" />
                        <path data-grid-rail="" d="M1 6H27" />
                      </>,
                    )}
                  </LegendRow>
                </div>
              </Collapsible>
            </Panel>
          </div>
        </div>
      </div>
    </Screen>
  )
}
