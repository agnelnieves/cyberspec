import { useEffect, useRef, useState } from "react"
import { Timer } from "lucide-react"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Readout } from "@/registry/cyber/ui/readout"
import "./recipe-layout.css"

type Phase = "idle" | "waiting" | "ready" | "early" | "scored"

export default function ReactionClock() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [last, setLast] = useState(0)
  const [best, setBest] = useState<number>()
  const start = useRef(0)
  useEffect(() => {
    if (phase !== "waiting") return
    const timeout = window.setTimeout(() => {
      start.current = performance.now()
      setPhase("ready")
    }, 1500 + Math.random() * 2000)
    return () => clearTimeout(timeout)
  }, [phase])
  function press() {
    if (phase === "waiting") return setPhase("early")
    if (phase !== "ready") return setPhase("waiting")
    const time = Math.round(performance.now() - start.current)
    setLast(time)
    setBest(best === undefined ? time : Math.min(best, time))
    setPhase("scored")
  }
  const cues = { idle: "Ready to start", waiting: "Wait for the cue", ready: "Tap now!", early: "Too soon. Try again.", scored: `Reaction time · ${last} ms` }
  return (
    <div className="sink-stack">
      <div className="sink-between"><span className="sink-label">Reflex test</span><Badge tone="mute">Best · {best === undefined ? "—" : `${best} ms`}</Badge></div>
      <Readout label="Last time" value={last} unit="ms" size="lg" />
      <p role="status" className="sink-note">{cues[phase]}</p>
      <Button size="lg" tone={phase === "ready" ? "flag" : "secondary"} onClick={press}><Timer aria-hidden />{phase === "ready" ? "Tap now" : phase === "waiting" ? "Wait…" : phase === "idle" ? "Start round" : "Play again"}</Button>
    </div>
  )
}
