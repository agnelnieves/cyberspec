// The picture on a contact's record, drawn rather than fetched: a stack of
// ID plates seen at an angle, the front one carrying a faceted bust. Nobody
// here has a face; they have a haircut, a band of optics and a serial strip.
// The same contact always draws the same plate.

// Six heads, as the outline of what's on top of the same bust: a bob, a crop
// under bench goggles, a knot, a peaked cap, a hood and a long side part.
const tops = [
  "M36 82 38 50 56 38 74 50 76 82 70 62 56 54 42 62Z",
  "M38 58 42 44 56 38 70 44 74 58 66 50 46 50Z",
  "M38 60 40 46 56 40 72 46 74 60 64 50 48 50Z M48 40 50 29 62 29 64 40Z",
  "M36 57 40 44 56 38 72 44 76 56 92 60 76 63H36Z",
  "M28 106 34 48 56 28 78 48 84 106 73 70 56 45 39 70Z",
  "M36 98 40 46 56 38 74 46 76 68 68 52 50 50 44 98Z",
]

// A small deterministic stream of numbers from a string.
function seeded(seed: string) {
  let state = [...seed].reduce((sum, letter) => (sum * 31 + letter.charCodeAt(0)) >>> 0, 11)
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

// One plate, 112 by 150, in its own coordinates.
function Plate({ depth }: { depth: number }) {
  return (
    <path
      d="M0 0H104l8 8V150H8l-8-8Z"
      fill={depth ? "var(--cy-panel)" : "var(--cy-panel-2)"}
      stroke={depth ? "var(--cy-line-deco)" : "var(--cy-line-ctl)"}
      strokeWidth="1"
    />
  )
}

function Portrait({ look, seed }: { look: number; seed: string }) {
  const next = seeded(seed)
  const strip = Array.from({ length: 16 }, () => ({ wide: next() > 0.55, tall: 5 + Math.round(next() * 7) }))
  const wear = Array.from({ length: 5 }, () => ({ y: 20 + Math.round(next() * 110), width: 10 + Math.round(next() * 40), x: Math.round(next() * 60) }))
  return (
    <svg data-comms-portrait="" viewBox="0 0 280 240" preserveAspectRatio="xMidYMid meet" aria-hidden focusable="false">
      {/* The bed the plates sit on: a field of registration dots, a height
          rule down one side. */}
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 11 }, (_, column) => (
          <rect key={`${row}-${column}`} x={19 + column * 24} y={19 + row * 24} width="2" height="2" fill="var(--cy-line-deco)" />
        )),
      )}
      {Array.from({ length: 17 }, (_, tick) => (
        <path key={tick} d={`M8 ${24 + tick * 12}h${tick % 4 === 0 ? 10 : 5}`} stroke="var(--cy-line-ctl)" strokeWidth="1" />
      ))}

      {/* Three older plates behind, each a step back and up. */}
      {[3, 2, 1].map((depth) => (
        <g key={depth} transform={`translate(${84 + depth * 24} ${78 - depth * 13}) skewY(-11)`} opacity={1 - depth * 0.22}>
          <Plate depth={depth} />
          <path d="M0 18H112" stroke="var(--cy-line-deco)" strokeWidth="1" />
        </g>
      ))}

      {/* The current plate. */}
      <g transform="translate(84 78) skewY(-11)">
        <Plate depth={0} />
        <path d="M0 0H104l8 8v10H0Z" fill="var(--cy-fill-active)" />
        <path d="M8 9h34M48 9h10" stroke="var(--cy-ink-hi)" strokeWidth="2" />
        {wear.map((line, index) => (
          <path key={index} d={`M${4 + line.x} ${line.y}h${line.width}`} stroke="var(--cy-line-deco)" strokeWidth="1" />
        ))}
        {/* Shoulders, neck, head, then whatever is on top of it. */}
        <path d="M10 132 16 114 44 103h24l28 11 6 18Z" fill="var(--cy-fill-hover)" stroke="var(--cy-line-ctl)" strokeWidth="1" />
        <path d="M48 88h16v14l-8 6-8-6Z" fill="var(--cy-fill-hover)" stroke="var(--cy-line-ctl)" strokeWidth="1" />
        <path d="M40 52 56 44 72 52 74 76 65 90H47L38 76Z" fill="var(--cy-panel)" stroke="var(--cy-ink)" strokeWidth="1" />
        <path d="M56 108 49 97M56 108l7-11M44 103l12 9 12-9" fill="none" stroke="var(--cy-line-ctl)" strokeWidth="1" />
        <path d={tops[look % tops.length]} fill="var(--cy-fill-active)" stroke="var(--cy-accent)" strokeWidth="1" />
        {/* The optics: one lit band across the eyes. The tech wears goggles. */}
        <path d={look === 1 ? "M39 58h34v10H39Z" : "M42 62h28v5H42Z"} fill="var(--cy-signal)" />
        {look === 1 && <path d="M55 58v10" stroke="var(--cy-on-solid)" strokeWidth="2" />}
        {/* The serial strip along the foot. */}
        {strip.map((bar, index) => (
          <rect key={index} x={10 + index * 6} y={146 - bar.tall} width={bar.wide ? 4 : 2} height={bar.tall} fill="var(--cy-line-ctl)" />
        ))}
      </g>

      {/* A lock bracket around the head. */}
      <path d="M114 96v-9l9-2M172 85l9-2v9M114 150v9l9-2M172 146l9-2v9" fill="none" stroke="var(--cy-signal)" strokeWidth="1" />
    </svg>
  )
}

export { Portrait }
