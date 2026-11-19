import * as React from "react"
import { Card } from "@/registry/cyber/ui/card"

// A skyline drawn from a list of towers: x, top and width, on a 320 × 180
// field. Windows are lit where a small sum lands on a multiple.
const towers = [
  [6, 104, 26],
  [36, 72, 20],
  [60, 118, 34],
  [98, 46, 24],
  [126, 92, 18],
  [148, 64, 30],
  [182, 110, 22],
  [208, 34, 26],
  [238, 86, 20],
  [262, 58, 28],
  [294, 100, 22],
]

function Skyline() {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {[150, 158, 168].map((y) => (
        <path key={y} d={`M0 ${y}H320`} stroke="var(--cy-line-deco)" strokeWidth="1" />
      ))}
      {towers.map(([x, top, width], tower) => (
        <g key={x}>
          <rect x={x} y={top} width={width} height={150 - top} fill="var(--cy-panel-2)" stroke="var(--cy-line-ctl)" strokeWidth="1" />
          {Array.from({ length: Math.floor((150 - top) / 10) }, (_, row) =>
            Array.from({ length: Math.floor(width / 7) }, (_, col) =>
              (row * 3 + col * 5 + tower * 7) % 4 === 0 ? (
                <rect
                  key={`${row}-${col}`}
                  x={x + 3 + col * 7}
                  y={top + 5 + row * 10}
                  width="3"
                  height="4"
                  fill={(row + tower) % 5 === 0 ? "var(--cy-flag)" : "var(--cy-signal)"}
                />
              ) : null,
            ),
          )}
        </g>
      ))}
      <path d="M221 34V14M217 14h8" stroke="var(--cy-accent)" strokeWidth="1" />
      <path d="M0 150H320" stroke="var(--cy-accent)" strokeWidth="1.5" />
    </svg>
  )
}

// A carrier wave: two sines summed, sampled every four units, with a
// centre line and a row of ticks under it.
const wave = Array.from({ length: 81 }, (_, i) => {
  const x = i * 4
  const y = 86 + Math.sin(i * 0.42) * 34 * Math.sin(i * 0.07 + 0.6) + Math.sin(i * 1.3) * 7
  return `${x},${y.toFixed(1)}`
}).join(" ")

function Waveform() {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <path d="M0 86H320" stroke="var(--cy-line-deco)" strokeWidth="1" strokeDasharray="2 6" />
      {Array.from({ length: 33 }, (_, i) => (
        <path key={i} d={`M${i * 10} ${i % 4 === 0 ? 150 : 154}V160`} stroke="var(--cy-line-ctl)" strokeWidth="1" />
      ))}
      <polyline points={wave} fill="none" stroke="var(--cy-signal)" strokeWidth="1.5" strokeLinejoin="miter" />
      <path d="M128 30V142" stroke="var(--cy-flag)" strokeWidth="1" />
      <path d="M124 30h8M124 142h8" stroke="var(--cy-flag)" strokeWidth="1" />
    </svg>
  )
}

export default function CardDemo() {
  const [pinned, setPinned] = React.useState(false)
  return (
    <>
      <Card
        cipher
        title="Glasswater relay"
        meta="Vanta Systems // 1.2 km"
        media={<Skyline />}
        onClick={() => setPinned((on) => !on)}
        pressed={pinned}
        footer={
          <>
            <span>{pinned ? "Route pinned" : "Press to pin route"}</span>
            <span>3F:A2</span>
          </>
        }
      >
        Rooftop mast over the canal, lightly watched. Good for one clean uplink before it's noticed.
      </Card>
      <Card
        title="Null Ping"
        meta="Daemon // 0.4 MB"
        media={<Waveform />}
        footer={
          <>
            <span>Installed</span>
            <span>Rev 0.1</span>
          </>
        }
      >
        Answers a trace with silence. The other side sees a dead line.
      </Card>
    </>
  )
}
