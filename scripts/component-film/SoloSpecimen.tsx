import { useMemo } from "react"
import { Cpu } from "lucide-react"
import { Switch } from "@/registry/cyber/ui/switch"
import { Slider } from "@/registry/cyber/ui/slider"
import { SignalGraph } from "@/registry/cyber/ui/signal-graph"
import { Button } from "@/registry/cyber/ui/button"
import { HexStat } from "@/registry/cyber/ui/hex-stat"
import "./solo-specimens.css"

export type SoloShot = "switch" | "slider" | "graph" | "stat"

export function gainAtFrame(frame: number) {
  const phase = Math.max(0, Math.min(1, (frame - 15) / (54 - 15)))
  return Math.round(22 + 60 * phase * phase * (3 - 2 * phase))
}

function strength(sample: number) {
  // A weak carrier precedes the poll. Its reply arrives as a short burst
  // before settling at a higher signal floor.
  if (sample < 0) {
    return Math.round(30 + 11 * Math.sin(sample * .51) + 8 * Math.cos(sample * 1.07))
  }
  const rise = 1 - Math.exp(-sample / 4)
  const carrier = Math.sin(sample * .66) + .28 * Math.sin(sample * 1.8)
  return Math.round(34 + 42 * rise + (6 + 23 * Math.exp(-sample / 11)) * carrier)
}

function Relay({frame}: {frame: number}) {
  const tick = Math.max(-1, Math.floor((frame - 18) / 2))
  const samples = useMemo(
    () => Array.from({length: 31}, (_, i) => strength(tick - 30 + i)),
    [tick],
  )
  return <>
    <SignalGraph label="Relay strength" unit="dB" data={samples} min={0} max={100} live/>
    <Button tone="signal" size="sm" data-solo="poll" data-pressed={frame >= 18 && frame < 22 ? "" : undefined}>Poll relay</Button>
  </>
}

function specimen(shot: SoloShot, frame: number) {
  switch (shot) {
    case "switch":
      return <Switch label="Interface sounds" checked={frame >= 22} data-solo="switch"/>
    case "slider":
      return <Slider label="Signal gain" ticks={20} value={gainAtFrame(frame)} format={(value: number) => value + "%"}/>
    case "graph":
      return <Relay frame={frame}/>
    case "stat":
      return <HexStat name="Circuit" value={frame < 30 ? 14 : 15} icon={<Cpu/>} selected max={20} onRaise={() => true}/>
  }
}

export function SoloSpecimen({shot, frame}: {shot: SoloShot; frame: number}) {
  return <div className="solo-specimen" data-solo-shot={shot}>
    <div className="solo-object">{specimen(shot, frame)}</div>
  </div>
}
