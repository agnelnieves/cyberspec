import { useMemo } from "react"
import { ArrowUpRight, Brain, Check, Cpu, Dumbbell, Radio, ScanLine, Snowflake, Zap } from "lucide-react"
import "@fontsource/rajdhani/500.css"
import "@fontsource/rajdhani/600.css"
import "@fontsource/rajdhani/700.css"
import "@fontsource-variable/jetbrains-mono"
import { Cyber } from "@/registry/cyber/ui/cyber"
import { Panel } from "@/registry/cyber/ui/panel"
import { Button } from "@/registry/cyber/ui/button"
import { Badge } from "@/registry/cyber/ui/badge"
import { Switch } from "@/registry/cyber/ui/switch"
import { Slider } from "@/registry/cyber/ui/slider"
import { Meter } from "@/registry/cyber/ui/meter"
import { Readout } from "@/registry/cyber/ui/readout"
import { SignalGraph } from "@/registry/cyber/ui/signal-graph"
import { HexStat, HexStatGroup } from "@/registry/cyber/ui/hex-stat"
import "./components.css"

export type SceneShot = 0 | 1 | 2

// Local seconds relative to the first frame of each view.
export const sceneCues = {
  toggle: .55, gainStart: 1.12, gainEnd: 2.02, commit: 2.55, linked: 2.87,
  scan: .60, scanned: 1.47,
  select: .56, raise: 1.35,
} as const

const clamp = (value: number) => Math.min(1, Math.max(0, value))

export function gainAt(time: number) {
  const p = clamp((time - sceneCues.gainStart) / (sceneCues.gainEnd - sceneCues.gainStart))
  return Math.round(22 + 60 * p * p * (3 - 2 * p))
}

function Deck({time}: {time: number}) {
  const on = time >= sceneCues.toggle
  const gain = gainAt(time)
  const output = Math.round((-36 + .34 * gain) * 10) / 10
  const committed = time >= sceneCues.commit
  const linked = time >= sceneCues.linked
  return <Panel title="Deck link" variant="titled" code="VANTA MK.II  /  TRANSCEIVER 07"
    actions={<Radio aria-hidden size={17} />}
    footer={<>
      <Badge status tone={linked ? "ok" : "signal"}>{linked ? "Connected" : committed ? "Linking" : "Standby"}</Badge>
      <Button data-film-target="commit" data-pressed={committed && !linked ? "" : undefined}
        tone={linked ? "signal" : "primary"}>
        {linked ? "Link active" : "Commit link"}{linked ? <Check/> : <ArrowUpRight/>}
      </Button>
    </>}>
    <div className="component-film-deck-reading">
      <Readout key={output} label="Output level" value={output} precision={1} unit="dB" size="lg"/>
      <Meter label="Headroom" value={Math.round(-output)} max={40} segments={20}
        format={(value: number) => `${value} dB`}/>
    </div>
    <Switch label="Stealth routing" checked={on} data-film-target="switch"/>
    <Slider label="Signal gain" value={gain} ticks={20} format={(value: number) => `${value}%`}/>
  </Panel>
}

const sampleCount = 37
// A relay pulse arrives at the right edge of the capture, followed by the
// carrier establishing its plateau. Both graphs share the acquisition clock.
function relaySample(index: number) {
  if (index < 0) {
    return Math.round(30 + 11 * Math.sin(index * .62) + 7 * Math.sin(index * 1.72) + 4 * Math.cos(index * .27))
  }
  return Math.round(79 - 58 * Math.exp(-index / 7) + 23 * Math.exp(-index / 12) * Math.sin(index * 1.33) + 4 * Math.sin(index * .7))
}

function Diagnostics({time}: {time: number}) {
  const scanned = time >= sceneCues.scanned
  const started = time >= sceneCues.scan
  const tick = started ? Math.floor((time - sceneCues.scan) * 12) : -1
  const samples = useMemo(() => Array.from({length: sampleCount}, (_, i) => relaySample(i - sampleCount + tick + 1)), [tick])
  const traffic = useMemo(() => Array.from({length: 28}, (_, i) => {
    const n = i - 27 + tick
    return Math.round(22 + 50 * Math.exp(-(((n - 9) / 8) ** 2)) + 8 * Math.sin(n * .8) + 5 * Math.cos(n * 1.77))
  }), [tick])
  const settle = clamp((time - sceneCues.scanned) / .42)
  const latency = Math.round(48 - 36 * (1 - (1 - settle) ** 3))
  return <Panel title="Relay diagnostics" code="TELEMETRY  /  CHANNEL 07" tone="signal"
    actions={<Badge status tone={scanned ? "ok" : "signal"}>{scanned ? "Locked" : started ? "Polling" : "Listening"}</Badge>}
    footer={<>
      <span className="component-film-footnote">VANTA / RELAY 07</span>
      <Button data-film-target="scan" data-pressed={started && time < sceneCues.scan + .13 ? "" : undefined} tone="signal">
        <ScanLine/>{scanned ? "Poll again" : "Poll relay"}
      </Button>
    </>}>
    <SignalGraph className="component-film-trace" label="Relay strength" data={samples} unit="dB" min={0} max={100} live/>
    <div className="component-film-telemetry-row">
      <Readout key={latency} label="Round trip" value={latency} unit="ms" size="lg"/>
      <SignalGraph className="component-film-load" label="Traffic" data={traffic} unit="%" variant="bars" tone="accent" min={0} max={100}/>
    </div>
  </Panel>
}

const attributes = [
  {name: "Frame", icon: Dumbbell, value: 9},
  {name: "Reflex", icon: Zap, value: 7},
  {name: "Circuit", icon: Cpu, value: 14},
  {name: "Cortex", icon: Brain, value: 11},
  {name: "Nerve", icon: Snowflake, value: 13},
]
const raiseAvailable = () => true

function Attributes({time}: {time: number}) {
  const selected = time < sceneCues.select ? "Nerve" : "Circuit"
  const raised = time >= sceneCues.raise
  const level = selected === "Nerve" ? 13 : raised ? 15 : 14
  return <Panel title="Attributes" variant="titled" code="MERIDIAN CLINIC  /  AUGMENTS"
    actions="LATTICE 05">
    <div className="component-film-attributes">
      <HexStatGroup label="Deck attributes" columns={3} minSize={75}>
        {attributes.map(({name,icon: Icon,value}) =>
          <HexStat key={name} name={name} value={name === "Circuit" && raised ? value + 1 : value}
            icon={<Icon/>} selected={selected === name} max={20} onRaise={raiseAvailable}
            data-film-target={name === "Circuit" ? "circuit" : undefined}/>)}
      </HexStatGroup>
      <div className="component-film-attribute-reading">
        <Readout key={Number(raised)} label="Points left" value={raised ? 2 : 3} size="lg" tone="flag"/>
        <Meter label={selected} value={level} max={20} segments={20}/>
      </div>
    </div>
  </Panel>
}

export function Scene({shot, time}: {shot: SceneShot; time: number}) {
  return <Cyber fx="full" className="component-film-specimen" data-film-shot={shot}>
    {shot === 0 ? <Deck time={time}/> : shot === 1 ? <Diagnostics time={time}/> : <Attributes time={time}/>}
  </Cyber>
}
