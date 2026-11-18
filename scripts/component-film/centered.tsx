import type { CSSProperties } from "react"
import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"
import "@fontsource/rajdhani/500.css"
import "@fontsource/rajdhani/600.css"
import "@fontsource/rajdhani/700.css"
import "@fontsource-variable/jetbrains-mono"
import { Cyber } from "@/registry/cyber/ui/cyber"
import { Brand } from "../../src/Brand"
import { SoloSpecimen, gainAtFrame, type SoloShot } from "./SoloSpecimen"
import "../../src/base.css"
import "./centered.css"

type Shot = "intro" | SoloShot | "outro"
type Cue = { time: number; voice: string; duration?: number }
type Point = [number, number]
declare global {
  interface Window {
    setFilmTime: (time: number) => Promise<void>
    filmSounds: Cue[]
    filmPointer: Point | null
  }
}

const fps = 30
const start = { intro: 0, switch: 48, slider: 116, graph: 205, stat: 295, outro: 379 }
const sequence: Shot[] = ["intro", "switch", "slider", "graph", "stat", "outro"]
const gainStart = Array.from({length: 55}, (_, frame) => frame).find(frame => gainAtFrame(frame) !== 22)!
const moves = {
  switch: {selector: "[data-solo=switch]", press: 22, release: 25, offset: [76, 53]},
  slider: {selector: "[data-kit=slider-thumb]", press: 15, release: 54, offset: [54, 47]},
  graph: {selector: "[data-solo=poll]", press: 18, release: 21, offset: [65, 34]},
  stat: {selector: '[aria-label="Raise Circuit"]', press: 30, release: 33, offset: [76, 52]},
} as const

window.filmSounds = [
  {time:(start.switch + moves.switch.press)/fps, voice:"on"},
  {time:(start.slider + gainStart)/fps, voice:"adjust", duration:(moves.slider.release - gainStart)/fps},
  {time:(start.graph + moves.graph.press)/fps, voice:"press"},
  {time:(start.stat + moves.stat.press)/fps, voice:"increment"},
]

let currentFrame = 0
let hovered: Element | null = null
document.addEventListener("pointerover", e => {
  if (currentFrame <= start.switch + moves.switch.press || !(e.target instanceof Element)) return
  const target = e.target.closest('button,[role=slider],input:not([type=hidden])')
  if (hovered === target) return
  hovered = target
  if (target) window.filmSounds.push({time: currentFrame/fps, voice:"hover"})
}, true)

function smooth(value: number) {
  const p = Math.max(0, Math.min(1, value))
  return p*p*(3-2*p)
}

function Film({shot, frame}: {shot: Shot; frame: number}) {
  const title = shot === "intro" || shot === "outro"
  const settling = smooth(frame/9)
  const scale = title ? 1 : .982 + .018 * settling
  return <Cyber fx="full" className="centered-film">
    <div className="centered-ground" data-interactive={title ? undefined : ""} aria-hidden/>
    {title
      ? <div className="centered-title" data-signoff={shot === "outro" ? "" : undefined}
          style={{"--letter-offset": 320 * (1 - smooth(frame/13))} as CSSProperties}>
          <h1 aria-label="CyberSpec"><Brand/></h1>
          {shot === "intro" ? <p>Cyberpunk components for React.</p> : <p className="centered-url">cyberspec.dev</p>}
        </div>
      : <div className="centered-stage" style={{transform:'scale('+scale+') translateY('+((1-settling)*4)+'px)'}}>
          <SoloSpecimen key={shot} shot={shot} frame={frame}/>
        </div>}
    <div className="centered-pointer" hidden aria-hidden>
      <svg viewBox="0 0 25 31"><path d="M2 2L21.5 16.5L12.6 17.2L16.9 26.8L12.6 28.8L8.5 19L2.1 25Z"/></svg>
    </div>
  </Cyber>
}

// Measure the live control after applying its frame's value. A drag tracks
// the native thumb even when its position is rounded to a discrete step.
function placeCursor(shot: Shot, frame: number) {
  const cursor = document.querySelector<HTMLElement>(".centered-pointer")!
  if (shot === "intro" || shot === "outro") {
    cursor.hidden = true
    window.filmPointer = null
    return
  }
  const move = moves[shot]
  const target = document.querySelector(move.selector)
  if (!target) throw new Error("Missing component target "+move.selector)
  const bounds = target.getBoundingClientRect()
  const approach = smooth((frame - 2) / (move.press - 7))
  const depart = smooth((frame - move.release - 7) / 15)
  const opacity = smooth(frame/5) * (1 - depart)
  const x = bounds.x + bounds.width/2 + move.offset[0]*2*(1 - approach + depart*.8)
  const y = bounds.y + bounds.height/2 + move.offset[1]*2*(1 - approach + depart*.65)
  const pressed = frame >= move.press-1 && frame <= move.release
  cursor.hidden = opacity < .01
  cursor.style.opacity = String(opacity)
  cursor.style.transform = 'translate('+x/2+'px,'+y/2+'px) scale('+(pressed ? .85 : 1)+')'
  window.filmPointer = cursor.hidden ? null : [x,y]
}

const root = createRoot(document.getElementById("root")!)
window.setFilmTime = async time => {
  currentFrame = Math.round(time*fps)
  const shot = sequence.findLast(name => start[name] <= currentFrame) || "intro"
  const frame = currentFrame - start[shot]
  flushSync(() => root.render(<Film shot={shot} frame={frame}/>))
  placeCursor(shot,frame)
}
void window.setFilmTime(0)
