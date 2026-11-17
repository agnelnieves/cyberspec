import type * as React from "react"
import type { Entry, MachineShape } from "@/registry/cyber/blocks/archive/data"

// The plates in the archive, drawn rather than fetched: a faceted bust for a
// person, a skyline for a district, an outline for a machine and a sigil for
// a program. Each sits on a 320 × 400 field and takes its colors from the
// theme. They are decoration: the record beside a plate says everything the
// plate shows.

// A small deterministic stream of numbers from a string, so a record always
// draws the same picture.
function seeded(seed: string) {
  let state = [...seed].reduce((sum, letter) => (sum * 31 + letter.charCodeAt(0)) >>> 0, 7)
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const deco = "var(--cy-line-deco)"
const line = "var(--cy-line-ctl)"
const ink = "var(--cy-ink)"
const hot = "var(--cy-accent)"
const signal = "var(--cy-signal)"

// A six-sided "circle": nothing in this world is round.
function hex(cx: number, cy: number, r: number, turn = 0) {
  return (
    Array.from({ length: 6 }, (_, i) => {
      const a = ((i * 60 + turn - 90) * Math.PI) / 180
      return `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`
    }).join("") + "Z"
  )
}

const diamond = (cx: number, cy: number, r: number) => `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`

// What every plate stands on: scan rows, and a height rule down one side.
function Field() {
  return (
    <g fill="none" strokeWidth="1">
      {Array.from({ length: 9 }, (_, row) => (
        <path key={row} d={`M0 ${40 + row * 40}H320`} stroke={deco} strokeDasharray={row % 3 === 2 ? undefined : "2 8"} />
      ))}
      {Array.from({ length: 31 }, (_, tick) => (
        <path key={tick} d={`M10 ${40 + tick * 11}h${tick % 5 === 0 ? 12 : 6}`} stroke={line} />
      ))}
    </g>
  )
}

// Three heads over the same bust: a crop, a long fringe and a hood.
const hair = [
  "M114 128 118 82 160 58 202 82 206 128 196 98 160 86 124 98Z",
  "M108 192 116 80 160 54 204 80 210 150 198 98 152 94 130 132 122 176Z",
  "M94 240 104 98 160 44 216 98 226 240 206 128 196 84 160 70 124 84 114 128Z",
]

// And three sets of optics: a band, two slits, a single lens.
const optics = ["M120 132H200L196 147H124Z", "M122 134H152L150 144H124ZM168 134H198L196 144H170Z", hex(182, 139, 12) + "M120 139H150"]

function Bust({ seed, variant }: { seed: string; variant: number }) {
  const next = seeded(seed)
  return (
    <>
      <g fill="var(--cy-panel-2)" stroke={line} strokeWidth="1">
        <path d="M140 244 76 272 44 316 36 400H284L276 316 244 272 180 244Z" />
        <path d="M144 206 140 244 160 268 180 244 176 206Z" />
      </g>
      <path
        d="M76 272 160 268 244 272M44 316 160 268 276 316M160 268V400M100 400 160 268 220 400M76 272 100 400M244 272 220 400"
        fill="none"
        stroke={deco}
        strokeWidth="1"
      />
      <path d="M124 84 160 70 196 84 206 128 198 176 176 206H144L122 176 114 128Z" fill="var(--cy-panel)" stroke={ink} strokeWidth="1.5" />
      <path
        d="M124 84 160 120 196 84M160 70V120M114 128 160 120 206 128M160 120V164M122 176 160 164 198 176M144 206 160 164 176 206M114 128 122 176M206 128 198 176"
        fill="none"
        stroke={line}
        strokeWidth="1"
      />
      <path d={hair[variant % 3]} fill="var(--cy-fill-active)" stroke={hot} strokeWidth="1" />
      <path d={optics[(variant + (variant > 2 ? 1 : 0)) % 3]} fill="var(--cy-signal-fill)" stroke={signal} strokeWidth="1.5" />
      {/* Recognition marks: brackets round the face, and a few points the
          scan locked on, different for each one. */}
      <path d="M96 60H84V72M224 60H236V72M96 224H84V212M224 224H236V212" fill="none" stroke={signal} strokeWidth="1" />
      {Array.from({ length: 5 }, (_, point) => {
        const x = Math.round(122 + next() * 76)
        const y = Math.round(92 + next() * 104)
        return <path key={point} d={`M${x - 3} ${y}h6M${x} ${y - 3}v6`} stroke={signal} strokeWidth="1" />
      })}
      {Array.from({ length: 16 }, (_, bar) => (
        <rect key={bar} x={206 + bar * 5} y={346} width={next() > 0.5 ? 3 : 1} height={14 + Math.round(next() * 22)} fill={line} />
      ))}
    </>
  )
}

function Skyline({ seed }: { seed: string }) {
  const next = seeded(seed)
  const ground = 300
  const far: { x: number; top: number; width: number }[] = []
  for (let x = 0; x < 320; ) {
    const width = 14 + Math.round(next() * 26)
    far.push({ x, top: 110 + Math.round(next() * 110), width })
    x += width + 2
  }
  const near: { x: number; top: number; width: number; step: boolean; mast: boolean }[] = []
  for (let x = 30; x < 290; ) {
    const width = 22 + Math.round(next() * 26)
    near.push({ x, top: 96 + Math.round(next() * 150), width, step: next() > 0.5, mast: next() > 0.6 })
    x += width + 4 + Math.round(next() * 8)
  }
  // One tower is the address on file. It gets the marker.
  const target = near[1 + Math.floor(next() * (near.length - 2))]
  const mid = target.x + target.width / 2
  return (
    <>
      <g fill="none" stroke={deco} strokeWidth="1">
        {far.map((tower) => (
          <path key={tower.x} d={`M${tower.x} ${ground}V${tower.top}h${tower.width}V${ground}`} />
        ))}
      </g>
      {near.map((tower) => {
        const { x, top, width, step, mast } = tower
        const chosen = tower === target
        const inset = Math.round(width / 3)
        return (
          <g key={x} fill="var(--cy-panel)" stroke={chosen ? signal : line} strokeWidth={chosen ? 1.5 : 1}>
            <path
              d={
                step
                  ? `M${x} ${ground}V${top + 18}h${inset}V${top}h${width - inset}V${ground}Z`
                  : `M${x} ${ground}V${top}h${width}V${ground}Z`
              }
            />
            {mast && <path d={`M${x + width - 5} ${top}v-22m-4 8h8`} fill="none" />}
            {/* Windows: a dashed line per floor. */}
            {Array.from({ length: Math.floor((ground - top - 30) / 12) }, (_, floor) => (
              <path
                key={floor}
                d={`M${x + 4} ${top + 30 + floor * 12}h${width - 8}`}
                fill="none"
                stroke={chosen ? signal : next() > 0.3 ? line : hot}
                strokeWidth="1"
                strokeDasharray={`${2 + Math.round(next() * 4)} ${2 + Math.round(next() * 3)}`}
              />
            ))}
          </g>
        )
      })}
      <path d={`${diamond(mid, target.top - 44, 7)}M${mid} ${target.top - 37}V${target.top - 4}`} fill="none" stroke={signal} strokeWidth="1.5" />
      {/* The waterline, and the towers standing in it. */}
      <path d={`M0 ${ground}H320`} stroke={ink} strokeWidth="1.5" />
      {Array.from({ length: 7 }, (_, row) => (
        <path
          key={row}
          d={`M${row * 9} ${ground + 12 + row * 12}H${320 - row * 9}`}
          stroke={row % 2 ? deco : line}
          strokeWidth="1"
          strokeDasharray={`${14 - row} ${4 + row * 2}`}
        />
      ))}
    </>
  )
}

// A point on the deck's top face, from how far along and how far across.
const iso = (s: number, t: number) => `${(60 + s * 130 + t * 80).toFixed(1)} ${(176 - s * 60 + t * 46).toFixed(1)}`
const face = (s0: number, t0: number, s1: number, t1: number) => `M${iso(s0, t0)}L${iso(s1, t0)}L${iso(s1, t1)}L${iso(s0, t1)}Z`

const machines: Record<MachineShape, React.ReactNode> = {
  deck: (
    <>
      <path d="M60 176v16l80 46 130-60v-16" fill="var(--cy-panel-2)" stroke={line} strokeWidth="1" />
      <path d={`${face(0, 0, 1, 1)}M140 222v16`} fill="var(--cy-panel)" stroke={ink} strokeWidth="1.5" />
      <path d={face(0.06, 0.08, 0.94, 0.4)} fill="var(--cy-signal-fill)" stroke={signal} strokeWidth="1" />
      <g fill="none" stroke={line} strokeWidth="1">
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 9 }, (_, key) => (
            <path key={`${row}-${key}`} d={face(0.06 + key * 0.1, 0.5 + row * 0.15, 0.13 + key * 0.1, 0.6 + row * 0.15)} />
          )),
        )}
      </g>
      {/* Four ports on the near edge, one of them carrying the link. */}
      <path d="M160 221l8-3.7v6l-8 3.7ZM178 212.7l8-3.7v6l-8 3.7ZM196 204.4l8-3.7v6l-8 3.7Z" fill="none" stroke={line} strokeWidth="1" />
      <path d="M214 196l8-3.7v6l-8 3.7Z" fill={signal} />
      <path d="M218 200 250 240H300" fill="none" stroke={signal} strokeWidth="1" strokeDasharray="4 3" />
    </>
  ),
  carbine: (
    <>
      <path d="M30 188 86 182V214L58 224 30 220Z" fill="var(--cy-panel-2)" stroke={line} strokeWidth="1" />
      <path d="M150 210H176L168 258 140 254ZM112 214H132L124 250 104 246Z" fill="var(--cy-panel-2)" stroke={line} strokeWidth="1" />
      <path d="M86 176H206V180H262V186H292V194H262V200H206V210H86Z" fill="var(--cy-panel)" stroke={ink} strokeWidth="1.5" />
      <path d="M214 184H254M214 190H254M214 196H254M96 176V210M196 176V210M136 210 142 222H150" fill="none" stroke={line} strokeWidth="1" />
      <path d="M122 176V162H178V176M130 162V154H170V162" fill="var(--cy-signal-fill)" stroke={signal} strokeWidth="1" />
      <path d="M96 170H206" stroke={line} strokeWidth="3" strokeDasharray="2 4" />
    </>
  ),
  van: (
    <>
      <path d="M34 244V172L50 146H212L254 178 286 190V244Z" fill="var(--cy-panel)" stroke={ink} strokeWidth="1.5" />
      <path d="M216 152 246 178H216Z" fill="var(--cy-signal-fill)" stroke={signal} strokeWidth="1" />
      <path d="M204 146V244M120 146V244M34 196H204M46 160H110M130 160H194M262 200H286M34 226H286" fill="none" stroke={line} strokeWidth="1" />
      <g fill="var(--cy-panel-2)" stroke={ink} strokeWidth="1.5">
        <path d={hex(86, 246, 22, 30)} />
        <path d={hex(238, 246, 22, 30)} />
      </g>
      <path d={hex(86, 246, 9, 30) + hex(238, 246, 9, 30)} fill="none" stroke={line} strokeWidth="1" />
      <path d="M0 268H320" stroke={line} strokeWidth="1" />
      <path d="M12 276H308" stroke={deco} strokeWidth="1" strokeDasharray="18 8" />
    </>
  ),
  lifter: (
    <>
      <path d="M160 196 86 144M160 196 234 144M160 216 86 262M160 216 234 262" fill="none" stroke={line} strokeWidth="5" />
      {[
        [86, 144],
        [234, 144],
        [86, 262],
        [234, 262],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} fill="none" strokeWidth="1">
          <path d={hex(x, y, 40)} stroke={line} strokeDasharray="3 4" />
          <path d={hex(x, y, 9)} fill="var(--cy-panel-2)" stroke={ink} />
          <path d={`M${x - 34} ${y - 12}L${x + 34} ${y + 12}M${x - 12} ${y + 34}L${x + 12} ${y - 34}`} stroke={hot} />
        </g>
      ))}
      <path d="M160 116 182 150V250L172 292H148L138 250V150Z" fill="var(--cy-panel)" stroke={ink} strokeWidth="1.5" />
      <path d="M146 150 160 128 174 150Z" fill="var(--cy-signal-fill)" stroke={signal} strokeWidth="1" />
      <path d="M138 190H182M138 232H182M160 232V292" fill="none" stroke={line} strokeWidth="1" />
      <path d={diamond(160, 211, 10)} fill="none" stroke={signal} strokeWidth="1.5" />
    </>
  ),
}

// What a machine's plate adds round the outline: a dimension line under it
// and a leader to a detail, the way a service sheet is drawn.
function Machine({ shape }: { shape: MachineShape }) {
  return (
    <>
      {machines[shape]}
      <g fill="none" stroke={line} strokeWidth="1">
        <path d="M34 322H286M34 314V330M286 314V330M160 318V326" />
        <path d="M34 322l8-4v8ZM286 322l-8-4v8Z" fill={line} />
        <path d={`${hex(262, 92, 20)}M250 108 232 132`} />
      </g>
      <path d={diamond(262, 92, 6)} fill={signal} />
    </>
  )
}

// A program has no outline, so its plate is a sigil: rings, spokes and nodes
// read off its name. The same name always draws the same mark.
function Sigil({ seed }: { seed: string }) {
  const next = seeded(seed)
  const cx = 160
  const cy = 200
  const point = (r: number, step: number, of: number) => {
    const a = ((step * 360) / of - 90) * (Math.PI / 180)
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`
  }
  const rings = [44, 76, 108, 136]
  const core = Math.floor(next() * 3)
  return (
    <>
      <g fill="none" strokeWidth="1">
        {rings.map((r, ring) =>
          Array.from({ length: 12 }, (_, side) => {
            const roll = next()
            if (roll < 0.28) return null
            return (
              <path
                key={`${ring}-${side}`}
                d={`M${point(r, side, 12)}L${point(r, side + 1, 12)}`}
                stroke={roll > 0.8 ? hot : ring % 2 ? line : ink}
                strokeWidth={roll > 0.8 ? 2 : 1}
              />
            )
          }),
        )}
        {Array.from({ length: 12 }, (_, spoke) => {
          const from = rings[Math.floor(next() * 3)]
          const to = rings[3 - Math.floor(next() * 2)]
          if (next() < 0.35 || from >= to) return null
          return <path key={spoke} d={`M${point(from, spoke, 12)}L${point(to, spoke, 12)}`} stroke={line} />
        })}
      </g>
      {Array.from({ length: 6 }, (_, node) => {
        const [x, y] = point(rings[1 + Math.floor(next() * 3)], Math.floor(next() * 12), 12).split(" ").map(Number)
        return <path key={node} d={diamond(x, y, 4)} fill={node < 2 ? signal : "var(--cy-panel)"} stroke={signal} strokeWidth="1" />
      })}
      <path
        d={[hex(cx, cy, 24), diamond(cx, cy, 26), `M${cx - 20} ${cy - 20}h40v40h-40Z`][core]}
        fill="var(--cy-signal-fill)"
        stroke={signal}
        strokeWidth="1.5"
      />
      <path d={diamond(cx, cy, 6)} fill={signal} />
    </>
  )
}

// The plate for a record. `variant` is the record's place in its section,
// which is what tells one bust from the next.
function Plate({ entry, variant }: { entry: Entry; variant: number }) {
  return (
    <svg data-archive-art="" viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      <Field />
      {entry.section === "people" && <Bust seed={entry.id} variant={variant} />}
      {entry.section === "places" && <Skyline seed={entry.id} />}
      {entry.section === "machines" && <Machine shape={entry.shape ?? "deck"} />}
      {entry.section === "programs" && <Sigil seed={entry.id} />}
    </svg>
  )
}

export { Plate }
