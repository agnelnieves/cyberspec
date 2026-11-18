import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react"
import { Cpu, Radio, Zap, ArrowUpRight, RotateCcw } from "lucide-react"
import { Brand } from "../Brand"
import { Stage, type Act } from "./kit"
import { Panel } from "@/registry/cyber/ui/panel"
import { Switch } from "@/registry/cyber/ui/switch"
import { Checkbox } from "@/registry/cyber/ui/checkbox"
import { Slider } from "@/registry/cyber/ui/slider"
import { Stepper } from "@/registry/cyber/ui/stepper"
import { Button } from "@/registry/cyber/ui/button"
import { Badge } from "@/registry/cyber/ui/badge"
import { Readout } from "@/registry/cyber/ui/readout"
import { HexStat, HexStatGroup } from "@/registry/cyber/ui/hex-stat"
import { Terminal, type TerminalLine } from "@/registry/cyber/ui/terminal"
import { SignalGraph } from "@/registry/cyber/ui/signal-graph"

type Scene = { enabled: boolean; gain: number; relays: number; linked: boolean; busy: boolean; lines: number }
const initial: Scene = { enabled: false, gain: 42, relays: 2, linked: false, busy: false, lines: 2 }
const payoff: Scene = { enabled: true, gain: 82, relays: 3, linked: true, busy: false, lines: 5 }
let shared = initial
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
const useScene = () => useSyncExternalStore(subscribe, () => shared, () => initial)

const story = async (a: Act<Scene>) => {
  a.mark("loop-start")
  await a.wait(900)
  await a.move("stealth", { duration: 460 })
  await a.click()
  a.mark("sound-on")
  await a.set({ enabled: true })
  await a.wait(300)
  await a.move("gain-thumb", { duration: 440 })
  const rail = a.rect("gain-rail")
  const destination = { x: rail.x + rail.width * .82, y: a.center("gain-thumb").y }
  let adjusting = false
  await a.drag(destination, (at) => {
    // Act eases the pointer path. Drive the real slider from that measured
    // position too, so its thumb stays directly under the pointer.
    const gain = Math.max(0, Math.min(100, Math.round((at.x - rail.x) / rail.width * 100)))
    if (!adjusting && gain !== 42) { adjusting = true; a.mark("sound-adjust") }
    a.put({ gain })
  }, { duration: 950, path: (t, from, to) => ({ x: from.x + (to.x - from.x) * t, y: from.y }) })
  a.mark("sound-adjust-end")
  await a.wait(220)
  await a.move("relay-plus", { duration: 360 })
  await a.click()
  a.mark("sound-increment")
  await a.set({ relays: 3 })
  await a.wait(250)
  await a.move("commit", { duration: 420 })
  await a.click()
  a.mark("sound-press")
  await a.set({ busy: true, lines: 3 })
  await a.move({ x: a.layout === "compact" ? 315 : 459, y: a.layout === "compact" ? 385 : 375 }, { duration: 320 })
  await a.wait(520)
  await a.set({ lines: 4 })
  await a.wait(650)
  await a.set({ busy: false, linked: true, lines: 5 })
  await a.wait(700)
  a.mark("payoff")
  await a.wait(2400)
  await a.move("reset", { duration: 520 })
  await a.click()
  a.mark("sound-reset")
  await a.set(initial)
  await a.move({ x: a.layout === "compact" ? 315 : 459, y: a.layout === "compact" ? 385 : 375 }, { duration: 460 })
  await a.wait(1100)
  a.mark("loop-end")
}

function Deck({ s }: { s: Scene }) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    shared = s
    listeners.forEach(fn => fn())
    const targets: Record<string, string> = { 'gain-thumb': 'slider-thumb', 'gain-rail': 'slider-track', 'relay-plus': 'stepper-key'  }
    for (const [target, kit] of Object.entries(targets)) root.current?.querySelector(target === 'relay-plus' ? '[aria-label="Increase Relay count"]' : `[data-kit="${kit}"]`)?.setAttribute('data-target', target)
  }, [s])
  return <div ref={root} className="reel-deck">
    <Panel title="Deck link" code="VANTA MK.II // CONFIGURATION" tone="signal" actions={<Badge tone={s.linked ? "flag" : "signal"} status>{s.linked ? "Linked" : s.busy ? "Syncing" : "Standby"}</Badge>}
      footer={<><span className="reel-footnote">{s.linked ? "ROUTE ESTABLISHED" : "NODE 3F:A2"}</span><Button data-target="commit" size="sm" tone={s.linked ? "flag" : "secondary"}>{s.linked ? "Link active" : s.busy ? "Linking…" : "Commit link"}<ArrowUpRight /></Button></>}>
      <div className="reel-toggles"><Switch label="Stealth routing" checked={s.enabled} data-target="stealth" /><Checkbox label="Encrypt traffic" checked /></div>
      <Slider label="Signal gain" value={s.gain} format={(value: number) => `${value}%`} />
      <div className="reel-relays"><Stepper label="Relay count" value={s.relays} min={1} max={5}/><Button size="sm" tone="ghost" data-target="reset"><RotateCcw/>Reset</Button></div>
    </Panel>
  </div>
}

const logs: TerminalLine[] = [
  { id: "boot", kind: "sys", text: "Vanta Mk.II online." },
  { id: "wait", kind: "agent", text: "Awaiting route." },
  { id: "commit", kind: "user", text: "link --stealth" },
  { id: "sync", kind: "agent", text: "Relays synchronized." },
  { id: "ready", kind: "ok", text: "Secure link. 12 ms." },
]
const idleSignal = [32, 40, 33, 48, 35, 42, 27, 44, 32, 38, 30, 42]
const linkedSignal = [32, 40, 33, 48, 42, 60, 72, 78, 80, 81, 82, 82]

function Telemetry() {
  const s = useScene()
  return <div className="reel-telemetry"><Radio className="reel-radio" strokeWidth={1}/><Readout value={s.linked ? 12 : 48} unit="ms" label="Link latency" size="lg"/><p>VANTA / RELAY 07</p><Badge status tone={s.linked ? "flag" : "signal"}>{s.linked ? "Secure channel" : "Awaiting link"}</Badge><div className="reel-telemetry-foot"><span>ENCRYPTION</span><strong>AES-256</strong></div></div>
}
function Attributes() {
  const s = useScene()
  return <div className="reel-attributes"><HexStatGroup label="Deck attributes" columns={2} minSize={72} gap={12}><HexStat name="Reflex" value={9} icon={<Zap/>}/><HexStat name="Tech" value={s.linked ? 12 : 8} selected icon={<Cpu/>}/></HexStatGroup></div>
}
function Console() {
  const s = useScene()
  return <div className="reel-console"><Terminal label="Deck console" lines={logs.slice(0, s.lines)} busy={s.busy} height={183}/></div>
}
function Signal() {
  const s = useScene()
  return <div className="reel-signal"><SignalGraph label="Uplink" data={s.linked ? linkedSignal : idleSignal} min={0} max={100} unit="dB"/><div className="reel-signal-meta"><span>STRENGTH</span><Badge tone="signal">{s.linked ? "Stable" : "Idle"}</Badge></div></div>
}
function Tile({ name, index, kind, children }: {name: string; index: string; kind: string; children: ReactNode}) {
  return <section className={`reel-tile reel-tile--${kind}`}><div className="reel-tile-label"><span>{index}</span><span>{name}</span><span className="reel-cross">+</span></div>{children}</section>
}
const stage = { theme: "dark" as const, fidelity: "realistic" as const, fill: true, accent: "#ff535b", className: "reel-stage" }

export function Reel() {
  return <main className="reel" data-social-canvas data-skin="cyber" data-fx="calm">
    <header className="reel-header"><div className="reel-kicker"><span>INTERFACE SYSTEM / 001</span><span>BUILT ON UI SDK</span></div><h1 aria-label="CyberSpec"><Brand/></h1><div className="reel-tagline">A different kind of interface.<span>READY TO BUILD.</span></div></header>
    <div className="reel-grid">
      <Tile name="INTERACTION" index="01" kind="hero"><Stage {...stage} width={480} height={400} compact={{below:400,width:340,height:410}} initial={initial} poster={payoff} script={story} cursor={{at:{wide:{x:459,y:375},compact:{x:315,y:385}},style:"arrow",idle:false}}>{s => <Deck s={s}/>}</Stage></Tile>
      <Tile name="TELEMETRY" index="02" kind="stat"><Stage {...stage} width={252} height={400}>{() => <Telemetry/>}</Stage></Tile>
      <Tile name="ATTRIBUTES" index="03" kind="nodes"><Stage {...stage} width={214} height={206}>{() => <Attributes/>}</Stage></Tile>
      <Tile name="FEEDBACK" index="04" kind="console"><Stage {...stage} width={252} height={206}>{() => <Console/>}</Stage></Tile>
      <Tile name="SIGNAL" index="05" kind="graph"><Stage {...stage} width={252} height={206}>{() => <Signal/>}</Stage></Tile>
    </div>
    <footer className="reel-footer"><span>REAL COMPONENTS.<br/>MOTION. SOUND. CHARACTER.</span><a href="https://www.cyberspec.dev">cyberspec.dev<ArrowUpRight/></a></footer>
  </main>
}
