import { useMemo } from "react"
import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"
import { ArrowRight, ArrowUpRight, Volume2, VolumeX } from "lucide-react"
import { Brand } from "../../src/Brand"
import { Cyber } from "@/registry/cyber/ui/cyber"
import { Panel } from "@/registry/cyber/ui/panel"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Switch } from "@/registry/cyber/ui/switch"
import { Tabs } from "@/registry/cyber/ui/tabs"
import { CodeBlock } from "@/registry/cyber/ui/code-block"
import { SignalGraph } from "@/registry/cyber/ui/signal-graph"
import { Terminal, type TerminalLine } from "@/registry/cyber/ui/terminal"
import { Barcode, Ruler } from "@/registry/cyber/ui/micro"
import { soundSamples } from "@/registry/cyber/lib/sound-samples"
import { Scene, sceneCues as cues, gainAt, type SceneShot } from "./Scene"
import "../../src/base.css"
import "./film.css"

const cuts = { deck: 2.1, relay: 6, stats: 9.15, registry: 12.15 }
const soundOn = .60, startDemo = 1.9, copyTime = 13.60
const snap = (s: number) => Math.ceil(s * 30 - .000001) / 30
const ease = (p: number) => {
  const x = Math.max(0, Math.min(1, p))
  return x*x*(3-2*x)
}
function windowed(t: number, start: number, hold: number, release: number, end: number) {
  return ease((t-start)/(hold-start))*(1-ease((t-release)/(end-release)))
}

type Cue = {time:number; voice:string; duration?:number}
type Point = [number, number]
declare global {
  interface Window {
    filmSounds: Cue[]
    filmPointer: Point | null
    setFilmTime: (time:number) => Promise<void>
  }
}
const firstMove = Array.from({length: 120},(_,i) => i / 30).find(t => gainAt(t)>22)!
const event = (time:number,voice:string): Cue => ({time:snap(time),voice})
window.filmSounds = [
  event(soundOn,"on"), event(startDemo,"confirm"),
  event(cuts.deck+cues.toggle,"on"),
  {time:snap(cuts.deck+firstMove),voice:"adjust",duration:snap(cuts.deck+cues.gainEnd)-snap(cuts.deck+firstMove)},
  event(cuts.deck+cues.commit,"confirm"), event(cuts.relay,"select"),
  event(cuts.relay+cues.scan,"press"), event(cuts.stats,"select"),
  event(cuts.stats+cues.select,"press"), event(cuts.stats+cues.raise,"increment"),
  event(cuts.registry,"select"),
]
let clock = 0
let previousHover: Element | null = null
// The renderer moves the browser pointer to the drawn cursor. Record entries
// into native controls, including incidental crossings, on this frame clock.
document.addEventListener("pointerover", e => {
  if (clock < soundOn || e.pointerType !== "mouse" || !(e.target instanceof Element)) return
  const hit = e.target.closest('button,a[href],[role=switch],[role=slider],[role=tab],[role=button],input:not([type=hidden])')
  if (hit===previousHover) return
  previousHover=hit
  if (hit && !hit.closest(':disabled,[data-disabled],[aria-disabled=true]')) {
    window.filmSounds.push({time:clock,voice:"hover"})
  }
},true)

// Plot the amplitude of the same PCM recording used by the switch.
function sampleEnvelope() {
  const bytes=atob(soundSamples.on.pcm)
  const count=Math.floor(bytes.length/2)
  const binSize=Math.round(soundSamples.on.sampleRate/90)
  const bins:number[]=[]
  for(let offset=0; offset<count; offset+=binSize) {
    let sum=0
    const end=Math.min(count,offset+binSize)
    for(let i=offset;i<end;i++) {
      let v=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8)
      if(v>=32768) v-=65536
      sum+=v*v
    }
    bins.push(Math.sqrt(sum/(end-offset)))
  }
  const peak=Math.max(...bins)
  return bins.map(n=>Math.round(100*n/peak))
}
const waveform=sampleEnvelope()
const source = '<Slider\n  label="Signal gain"\n  defaultValue={82}\n/>'

function Header({time}:{time:number}) {
  const enabled=time>=soundOn
  return <header className="film-header">
    <div className="film-id"><Brand markOnly/><span>CYBERSPEC<span className="film-divider"> / </span>UI SDK</span></div>
    <span className="film-audio">{enabled ? <Volume2 size={15}/> : <VolumeX size={15}/>} AUDIO {enabled?'ON':'OFF'}</span>
  </header>
}

function Identity({time, closing=false}:{time:number;closing?:boolean}) {
  const age=closing ? time-cuts.registry : time
  return <section className={'film-identity '+(closing?'film-closing':'film-opening')}>
    <div className="film-eyebrow"><i/>{closing?'OPEN-SOURCE REGISTRY':'INTRODUCING'}</div>
    <div className="film-lockup" aria-label="CyberSpec">
      <Brand/>
      {[0,1,2].map((n)=>{
        const phase=age-.012*n
        const pulse=phase<.07?0:phase<.12?1:phase<.18?-.55:phase<.23?.22:0
        const nudge=pulse*(n%2?-7:10)
        return <div className="film-lockup-line" key={n} style={{clipPath:'inset('+n*33+'% 0 '+(66-n*33)+'% 0)',transform:'translateX('+nudge+'px)',opacity:Math.min(1,Math.abs(nudge)/4)}}><Brand/></div>
      })}
    </div>
    <h1>{closing?<>Build your own<br/><em>interface.</em></>:<>Cyberpunk components<br/><em>for React.</em></>}</h1>
  </section>
}

function Intro({time}:{time:number}) {
  const isOn=time>=soundOn
  const index=Math.floor((time-soundOn)*90)
  const data=useMemo(()=>Array.from({length:46},(_,i)=>waveform[index-45+i] ?? 0),[index])
  return <>
    <Identity time={time}/>
    <section className="film-intro-panel">
      <Panel title="Interface audio" tone="signal" code="SYSTEM PREFERENCES"
        actions={<Badge status tone={isOn?'signal':'mute'}>{isOn?'Enabled':'Muted'}</Badge>}
        footer={<><span className="film-panel-note">COMPONENT PREVIEW</span><Button tone="primary" data-film-target="start">Start demo <ArrowRight/></Button></>}>
        <Switch label="Interface sounds" checked={isOn} data-film-target="sound"/>
        <SignalGraph label="Audio output" variant="bars" unit="%" tone="signal" min={0} max={100} data={data}/>
      </Panel>
    </section>
  </>
}

const tabs=["Controls","Telemetry","Attributes","Registry"].map((label,i)=>({label,value:String(i),content:null}))
const titles=["Set the gain.","Poll the relay.","Raise a stat."]
const kinds=["Switch / Slider","SignalGraph / Readout","HexStat / Meter"]
function trace(shot:SceneShot,t:number):TerminalLine[] {
  function row(id:string,kind:TerminalLine['kind'],text:string) {return {id,kind,text}}
  if(shot===0) {
    const log=[row('ready','sys','Deck ready.')]
    if(t>=cues.toggle) log.push(row('route','user','Stealth routing enabled.'))
    if(t>=cues.gainEnd) log.push(row('gain','user','Signal gain set to 82%.'))
    if(t>=cues.linked) log.push(row('connected','ok','Link established.'))
    return log.slice(-2)
  }
  if(shot===1) {
    const log=[row('connected','ok','Link established.')]
    if(t>=cues.scan) log.push(row('poll','user','Polling relay 07.'))
    if(t>=cues.scanned+.42) log.push(row('reply','ok','Reply received in 12 ms.'))
    return log.slice(-2)
  }
  const log=[row('points','sys','3 attribute points available.')]
  if(t>=cues.select) log.push(row('select','user','Circuit selected.'))
  if(t>=cues.raise) log.push(row('raise','ok','Circuit raised to 15.'))
  return log.slice(-2)
}

function Demo({time,shot}:{time:number;shot:SceneShot}) {
  const start=[cuts.deck,cuts.relay,cuts.stats][shot], t=time-start
  // These small, flat editorial crops follow the active part of the live panel.
  const push=shot===0?windowed(t,.62,1.2,1.97,2.45):shot===1?windowed(t,.70,1.15,1.82,2.55):windowed(t,.18,.7,1.60,2.24)
  const origin=shot===0?'50% 65%':shot===1?'52% 40%':'46% 54%'
  const view = <div className="film-view" data-film-epoch={start}>
    <div style={{transform:'scale('+(.97+push*.05)+')',transformOrigin:origin}}>
      <Scene shot={shot} time={t}/>
    </div>
  </div>
  const panes=tabs.map((item,i)=>({...item,content:i===shot ? view : null}))
  return <>
    <div className="film-demo-head">
      <div className="film-eyebrow"><i/>COMPONENT DEMO <span>0{shot+1} / 03</span></div>
      <div className="film-demo-title"><h1>{titles[shot]}</h1><span>{kinds[shot]}</span></div>
    </div>
    <div className="film-tabs"><Tabs label="Component demo" value={String(shot)} tabs={panes}/></div>
    <div className="film-log"><Terminal label="Event log" lines={trace(shot,t)} height="var(--film-log-height, 80px)"/></div>
  </>
}

function Closing({time}:{time:number}) {
  return <>
    <Identity time={time} closing/>
    <div className="film-code">
      <CodeBlock code={source} filename="deck.tsx" language="tsx" numbers={false}
        onCopy={()=>window.filmSounds.push({time:clock,voice:"success"})}/>
    </div>
    <div className="film-url"><span>cyberspec.dev</span><ArrowUpRight aria-hidden/></div>
  </>
}

function Film({time}:{time:number}) {
  const intro=time<cuts.deck,closing=time>=cuts.registry
  const shot:SceneShot=time<cuts.relay?0:time<cuts.stats?1:2
  return <Cyber className="film-sheet" fx="full">
    <div className="film-grid" aria-hidden/>
    <Header time={time}/>
    {intro?<Intro time={time}/>:closing?<Closing time={time}/>:<Demo time={time} shot={shot}/>}
    <footer className="film-base">
      <Barcode value="CYBERSPEC" unit={1} size={10}/>
      <Ruler/>
      <span>{closing?'REACT COMPONENT KIT':'CYBERSPEC.DEV'}</span>
    </footer>
    <div className="film-pointer" aria-hidden><svg viewBox="0 0 25 31"><path d="M2 2L21.5 16.5L12.6 17.2L16.9 26.8L12.6 28.8L8.5 19L2.1 25Z" /></svg></div>
  </Cyber>
}

// Each target is measured in its current, camera-transformed position.
type Anchor=string|Point
type Stop=[number,Anchor]
const control=(key:string)=>'[data-film-target="'+key+'"]'
const tab=(i:number)=>'[data-kit="tabs-tab"]:nth-of-type('+i+')'
const thumb='[data-kit="slider-thumb"]', raise='[aria-label="Raise Circuit"]'
const copy='[data-kit="code-block-copy"] button'
function point(anchor:Anchor):Point {
  if(typeof anchor!=='string') return [anchor[0]*2,anchor[1]*2]
  const element=document.querySelector(anchor)
  if(!element) throw Error('Missing cursor target '+anchor)
  const r=element.getBoundingClientRect()
  return [r.x+r.width*.5,r.y+r.height*.5]
}
function path(stops:Stop[],t:number):Point {
  const end=stops.findIndex(k=>k[0]>t)
  if(end===0) return point(stops[0][1])
  if(end<0) return point(stops[stops.length-1][1])
  const [a,p0]=stops[end-1], [b,p1]=stops[end]
  const u=ease((t-a)/(b-a))
  const p=point(p0),q=point(p1)
  const bend=Math.sin(Math.PI*u)*Math.min(15,Math.hypot(q[0]-p[0],q[1]-p[1])*.08)
  return [p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u-bend]
}
// Free pointer positions are on the same logical artboard as the UI. All
// interaction endpoints above remain attached to their measured controls.
type RestPositions = Record<"intro"|"deck"|"relay"|"stats"|"registry"|"enterCode"|"leaveCode", Point>
const rest: RestPositions = matchMedia('(orientation: landscape)').matches
  ? { intro:[765,347], deck:[850,385], relay:[842,332], stats:[764,405], registry:[745,87], enterCode:[790,211], leaveCode:[850,353] }
  : { intro:[338,524], deck:[437,535], relay:[456,465], stats:[335,488], registry:[419,171], enterCode:[360,327], leaveCode:[455,514] }
function pointerAt(t:number):Point {
  if(t<cuts.deck) return path([[0,rest.intro],[.49,control('sound')],[.94,control('sound')],[1.66,control('start')],[2.1,control('start')]],t)
  if(t<cuts.relay) return path([[0,rest.deck],[.45,control('switch')],[.69,control('switch')],[1.08,thumb],[2.06,thumb],[2.46,control('commit')],[2.99,control('commit')],[3.68,tab(2)],[3.90,tab(2)]],t-cuts.deck)
  if(t<cuts.stats) return path([[0,tab(2)],[.50,control('scan')],[.85,control('scan')],[1.40,rest.relay],[2.38,rest.relay],[2.98,tab(3)],[3.15,tab(3)]],t-cuts.relay)
  if(t<cuts.registry) return path([[0,tab(3)],[.45,control('circuit')],[.75,control('circuit')],[1.21,raise],[1.63,raise],[2.0,rest.stats],[2.37,rest.stats],[2.85,tab(4)],[3.0,tab(4)]],t-cuts.stats)
  return path([[0,rest.registry],[.52,rest.enterCode],[1.29,copy],[1.88,copy],[2.44,rest.leaveCode]],t-cuts.registry)
}
const pressCues=[soundOn,startDemo,cuts.deck+cues.toggle,cuts.deck+cues.commit,cuts.relay,cuts.relay+cues.scan,cuts.stats,cuts.stats+cues.select,cuts.stats+cues.raise,cuts.registry,copyTime]
const root=createRoot(document.getElementById('root')!)
let copied=false
// The captured page has a private clipboard so the real CodeBlock can complete
// its copy operation and display its own success feedback on film.
let clipboardContents=''
Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
  writeText:async(text:string)=>{clipboardContents=text},readText:async()=>clipboardContents,
}})
window.setFilmTime=async(t:number)=>{
  clock=t
  flushSync(()=>root.render(<Film time={t}/>))
  const [x,y]=pointerAt(t)
  const drag=t>=cuts.deck+cues.gainStart && t<cuts.deck+cues.gainEnd
  const pressed=drag || pressCues.some(at=>t>=at-.045&&t<at+.09)
  const pointer=document.querySelector<HTMLElement>('.film-pointer')!
  pointer.style.transform='translate('+x/2+'px,'+y/2+'px) scale('+(pressed?.82:1)+')'
  window.filmPointer=[x,y]
  if(t<cuts.registry) copied=false
  if(t>=copyTime && !copied) {
    copied=true
    document.querySelector<HTMLButtonElement>(copy)!.click()
    await Promise.resolve()
  }
}
void window.setFilmTime(0)
