import type { VehicleShape } from "@/registry/cyber/blocks/jobs/data"

// The stills on a job's linked records, drawn rather than fetched: a
// silhouette for the contact, a block of the district for the place, a side
// elevation for the vehicle. All three sit on a 320 × 150 field and take
// their colors from the theme.

// A small deterministic stream of numbers from a string, so the same record
// always draws the same picture.
function seeded(seed: string) {
  let state = [...seed].reduce((sum, letter) => (sum * 31 + letter.charCodeAt(0)) >>> 0, 7)
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const frameProps = { viewBox: "0 0 320 150", preserveAspectRatio: "xMidYMid slice", "aria-hidden": true, focusable: false } as const

// Three heads: a crop, a long fringe and a hood. Each is the outline of the
// hair over the same faceted bust.
const hair = [
  "M132 62 138 34 160 24 184 32 190 62 182 48 160 42 140 48Z",
  "M128 86 134 34 160 22 188 32 192 70 180 44 150 46 140 84Z",
  "M124 96 130 38 160 18 190 38 196 96 184 60 160 34 136 60Z",
]

function Portrait({ look, seed }: { look: 0 | 1 | 2; seed: string }) {
  const next = seeded(seed)
  return (
    <svg {...frameProps}>
      {/* An ID plate behind the head: scan rows, a height rule. */}
      {Array.from({ length: 9 }, (_, row) => (
        <path key={row} d={`M0 ${14 + row * 16}H320`} stroke="var(--cy-line-deco)" strokeWidth="1" strokeDasharray={row % 3 === 0 ? undefined : "2 7"} />
      ))}
      {Array.from({ length: 12 }, (_, tick) => (
        <path key={tick} d={`M22 ${16 + tick * 11}h${tick % 4 === 0 ? 12 : 6}`} stroke="var(--cy-line-ctl)" strokeWidth="1" />
      ))}
      <path d="M90 150 100 118 138 104h44l38 14 10 32Z" fill="var(--cy-panel-2)" stroke="var(--cy-line-ctl)" strokeWidth="1" />
      <path d="M148 88h24v20l-12 8-12-8Z" fill="var(--cy-panel-2)" stroke="var(--cy-line-ctl)" strokeWidth="1" />
      <path d="M138 44 160 34l22 10 2 30-12 18h-24l-12-18Z" fill="var(--cy-panel)" stroke="var(--cy-ink)" strokeWidth="1" />
      <path d={hair[look]} fill="var(--cy-fill-active)" stroke="var(--cy-accent)" strokeWidth="1" />
      {/* The optics: one lit band across the eyes. */}
      <path d="M141 60h38v7h-38Z" fill="var(--cy-signal)" />
      <path d="M160 92 152 82M160 92l8-10M138 104l22 12 22-12" fill="none" stroke="var(--cy-line-ctl)" strokeWidth="1" />
      {/* Recognition marks, different for each face. */}
      <path d="M118 26h-8v8M202 26h8v8M118 110h-8v-8M202 110h8v-8" fill="none" stroke="var(--cy-flag)" strokeWidth="1" />
      {Array.from({ length: 14 }, (_, bar) => (
        <rect key={bar} x={236 + bar * 5} y={104} width={next() > 0.5 ? 3 : 1} height={12 + Math.round(next() * 18)} fill="var(--cy-line-ctl)" />
      ))}
    </svg>
  )
}

function Place({ seed }: { seed: string }) {
  const next = seeded(seed)
  // Towers left to right, one of them the address: it gets the marker.
  const towers: { x: number; top: number; width: number }[] = []
  for (let x = 4; x < 312; ) {
    const width = 16 + Math.round(next() * 22)
    towers.push({ x, top: 26 + Math.round(next() * 74), width })
    x += width + 3 + Math.round(next() * 5)
  }
  const target = towers[1 + Math.floor(next() * (towers.length - 2))]
  const mid = target.x + target.width / 2
  return (
    <svg {...frameProps}>
      {[128, 136, 145].map((y) => (
        <path key={y} d={`M0 ${y}H320`} stroke="var(--cy-line-deco)" strokeWidth="1" />
      ))}
      {towers.map((tower, index) => (
        <g key={tower.x}>
          <rect
            x={tower.x}
            y={tower.top}
            width={tower.width}
            height={128 - tower.top}
            fill={tower === target ? "var(--cy-fill-hover)" : "var(--cy-panel-2)"}
            stroke={tower === target ? "var(--cy-accent)" : "var(--cy-line-ctl)"}
            strokeWidth="1"
          />
          {Array.from({ length: Math.floor((128 - tower.top) / 10) }, (_, row) =>
            Array.from({ length: Math.floor(tower.width / 7) }, (_, col) =>
              (row * 3 + col * 5 + index * 7) % 4 === 0 ? (
                <rect key={`${row}-${col}`} x={tower.x + 3 + col * 7} y={tower.top + 5 + row * 10} width="3" height="4" fill="var(--cy-signal)" />
              ) : null,
            ),
          )}
        </g>
      ))}
      <path d="M0 128H320" stroke="var(--cy-accent)" strokeWidth="1.5" />
      {/* The marker: a drop line and a diamond over the address. */}
      <path d={`M${mid} ${target.top - 4}V${target.top - 14}`} stroke="var(--cy-flag)" strokeWidth="1" />
      <path d={`M${mid} ${target.top - 26} ${mid + 6} ${target.top - 20} ${mid} ${target.top - 14} ${mid - 6} ${target.top - 20}Z`} fill="var(--cy-flag)" />
    </svg>
  )
}

// A wheel is an octagon here: nothing in the kit is round.
function Wheel({ x, y, r = 15 }: { x: number; y: number; r?: number }) {
  const ring = (radius: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const angle = (Math.PI / 4) * i + Math.PI / 8
      return `${(x + Math.cos(angle) * radius).toFixed(1)},${(y + Math.sin(angle) * radius).toFixed(1)}`
    }).join(" ")
  return (
    <>
      <polygon points={ring(r)} fill="var(--cy-panel)" stroke="var(--cy-ink)" strokeWidth="1" />
      <polygon points={ring(r * 0.45)} fill="none" stroke="var(--cy-line-ctl)" strokeWidth="1" />
    </>
  )
}

const bodies: Record<VehicleShape, { body: string; glass: string; detail: string; wheels: [number, number, number?][] }> = {
  coupe: {
    body: "M40 106 44 86 96 78 132 54h64l48 24 34 8 6 20Z",
    glass: "M138 60h28v18h-48ZM172 60h22l34 18h-56Z",
    detail: "M44 92h40M240 92h40M100 98h118",
    wheels: [
      [92, 106],
      [236, 106],
    ],
  },
  hauler: {
    body: "M30 108V44h150v64ZM184 108V58h50l40 22v28Z",
    glass: "M192 64h38l28 16h-66Z",
    detail: "M40 56h130M40 70h130M40 84h130M105 44v64M266 92h8",
    wheels: [
      [72, 110, 16],
      [146, 110, 16],
      [238, 110, 16],
    ],
  },
  bike: {
    body: "M92 104 128 66h52l22-14 24 4-14 14 34 34h-22l-24-22-30 8-28 18Z",
    glass: "M202 52 222 34l8 4-6 20Z",
    detail: "M128 66 112 56h-22M150 96h40M224 70l22 34",
    wheels: [
      [96, 104, 20],
      [246, 104, 20],
    ],
  },
}

function Vehicle({ shape }: { shape: VehicleShape }) {
  const { body, glass, detail, wheels } = bodies[shape]
  return (
    <svg {...frameProps}>
      {/* A dimensioned drawing: ground line, wheelbase rule, grid ticks. */}
      {Array.from({ length: 16 }, (_, tick) => (
        <path key={tick} d={`M${10 + tick * 20} 14v${tick % 4 === 0 ? 8 : 4}`} stroke="var(--cy-line-deco)" strokeWidth="1" />
      ))}
      <path d="M0 126H320" stroke="var(--cy-accent)" strokeWidth="1.5" />
      <path d={body} fill="var(--cy-panel-2)" stroke="var(--cy-ink)" strokeWidth="1" strokeLinejoin="miter" />
      <path d={glass} fill="var(--cy-signal-fill)" stroke="var(--cy-signal)" strokeWidth="1" />
      <path d={detail} fill="none" stroke="var(--cy-line-ctl)" strokeWidth="1" />
      {wheels.map(([x, y, r]) => (
        <Wheel key={x} x={x} y={y} r={r} />
      ))}
      <path
        d={`M${wheels[0][0]} 138H${wheels[wheels.length - 1][0]}M${wheels[0][0]} 134v8M${wheels[wheels.length - 1][0]} 134v8`}
        stroke="var(--cy-flag)"
        strokeWidth="1"
      />
    </svg>
  )
}

export { Place, Portrait, Vehicle }
