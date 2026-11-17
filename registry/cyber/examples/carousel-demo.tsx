import * as React from "react"
import { Carousel } from "@/registry/cyber/ui/carousel"

// Every still is drawn here, on a 320 × 180 field, from a few lines of
// arithmetic. No photographs, no files.
function Still({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {children}
    </svg>
  )
}

// City blocks from above: eight lots by five, some set back from the
// street, a few lit, and a route threaded between them to a marker.
function Blocks() {
  return (
    <Still>
      {Array.from({ length: 40 }, (_, i) => {
        const col = i % 8
        const row = Math.floor(i / 8)
        const inset = (i * 7) % 3
        return (
          <rect
            key={i}
            x={8 + col * 38 + inset}
            y={8 + row * 34 + inset}
            width={32 - inset * 2 - ((i * 5) % 4 === 0 ? 10 : 0)}
            height={28 - inset * 2}
            fill={(col * 3 + row * 5) % 7 === 0 ? "var(--cy-fill-active)" : "var(--cy-panel-2)"}
            stroke="var(--cy-line-ctl)"
            strokeWidth="1"
          />
        )
      })}
      <polyline points="0,73 119,73 119,39 233,39 233,107" fill="none" stroke="var(--cy-signal)" strokeWidth="1.5" strokeDasharray="6 4" />
      <path d="M227 101h12v12h-12z" fill="var(--cy-void)" stroke="var(--cy-flag)" strokeWidth="1.5" />
    </Still>
  )
}

// A carrier wave as mirrored bars: two sines multiplied, with one band
// marked and everything after it faded.
function Wave() {
  return (
    <Still>
      <path d="M0 90H320" stroke="var(--cy-line-deco)" strokeWidth="1" />
      {Array.from({ length: 64 }, (_, i) => {
        const half = 5 + Math.abs(Math.sin(i * 0.31) * Math.sin(i * 0.09 + 0.4)) * 52 + (i % 5) * 2
        const marked = i >= 38 && i <= 43
        return (
          <rect
            key={i}
            x={i * 5 + 1}
            y={90 - half}
            width="3"
            height={half * 2}
            fill={marked ? "var(--cy-flag)" : "var(--cy-signal)"}
            opacity={i > 43 ? 0.4 : 1}
          />
        )
      })}
      <path d="M189 14V166M221 14V166" stroke="var(--cy-flag)" strokeWidth="1" strokeDasharray="2 4" />
    </Still>
  )
}

// A wireframe floor running to a horizon, with a marker standing over the
// vanishing point.
function Grid() {
  return (
    <Still>
      {Array.from({ length: 21 }, (_, i) => (
        <path key={i} d={`M160 72L${160 + (i - 10) * 56} 180`} stroke="var(--cy-line-ctl)" strokeWidth="1" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M0 ${(76 + 104 * (i / 7) ** 2).toFixed(1)}H320`} stroke="var(--cy-line-ctl)" strokeWidth="1" />
      ))}
      <path d="M0 72H320" stroke="var(--cy-accent)" strokeWidth="1.5" />
      <path d="M160 16l24 24-24 24-24-24z" fill="none" stroke="var(--cy-signal)" strokeWidth="1.5" />
      <path d="M160 28l12 12-12 12-12-12z" fill="var(--cy-signal)" opacity="0.3" />
      <path d="M160 64v8" stroke="var(--cy-signal)" strokeWidth="1.5" />
    </Still>
  )
}

// An optic's sweep: hexagonal range rings, a lit wedge, two contacts.
const ring = (radius: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const angle = (i * Math.PI) / 3
    return `${(160 + radius * Math.cos(angle)).toFixed(1)},${(90 + radius * Math.sin(angle)).toFixed(1)}`
  }).join(" ")

function Sweep() {
  return (
    <Still>
      <path d="M60 90H260M160 6V174" stroke="var(--cy-line-deco)" strokeWidth="1" strokeDasharray="2 6" />
      {[20, 40, 60, 80].map((radius) => (
        <polygon key={radius} points={ring(radius)} fill="none" stroke="var(--cy-line-ctl)" strokeWidth="1" />
      ))}
      <path d="M160 90L200 20.7L240 90z" fill="var(--cy-signal)" opacity="0.16" />
      <path d="M160 90L200 20.7" stroke="var(--cy-signal)" strokeWidth="1.5" />
      <path d="M203 58h8v8h-8z" fill="var(--cy-flag)" />
      <path d="M117 108h8v8h-8z" fill="none" stroke="var(--cy-flag)" strokeWidth="1.5" />
    </Still>
  )
}

// A substation's draw by the hour, as bars against a limit.
function Load() {
  return (
    <Still>
      {Array.from({ length: 24 }, (_, i) => {
        const height = 22 + ((i * 37) % 53) + (i > 8 && i < 14 ? 58 : 0)
        return <rect key={i} x={11 + i * 12.5} y={160 - height} width="9" height={height} fill={height > 104 ? "var(--cy-flag)" : "var(--cy-line-ctl)"} />
      })}
      <path d="M0 160H320" stroke="var(--cy-accent)" strokeWidth="1.5" />
      <path d="M0 56H320" stroke="var(--cy-flag)" strokeWidth="1" strokeDasharray="6 4" />
    </Still>
  )
}

const slides = [
  { id: "blocks", title: "Cinder Row grid", media: <Blocks />, caption: "Plan view, block 14. The dashed line is the one route without a camera." },
  { id: "wave", title: "Carrier trace", media: <Wave />, caption: "Vanta relay at 21:04. The marked band is where Null Ping answered." },
  { id: "grid", title: "Causeway approach", media: <Grid />, caption: "Wireframe of the Meridian Heights causeway. No cover past the marker." },
  { id: "sweep", title: "Lumen sweep", media: <Sweep />, caption: "Onyx optics, wide pass. Two contacts holding at the gate." },
  { id: "load", title: "Stacks load", media: <Load />, caption: "Substation draw by the hour. It peaks at shift change." },
]

export default function CarouselDemo() {
  return (
    <div style={{ width: "100%", maxWidth: 440 }}>
      <Carousel label="Recon stills" code="VWR-05 // RECON STILLS // REV 0.1" slides={slides} />
    </div>
  )
}
