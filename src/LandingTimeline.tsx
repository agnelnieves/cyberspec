import { useEffect, useState, type CSSProperties } from "react"
import { Pause, Play, Radio, Mic } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import "./landing-timeline.css"

const duration = 12
const ticksPerSecond = 10
const lastTick = duration * ticksPerSecond
const marks = [0, 3, 6, 9, 12]
const tracks = [
  { name: "Voice", icon: Mic, cues: [{ name: "Call sign", start: 1, end: 5 }, { name: "Reply", start: 7, end: 11 }] },
  { name: "Signal", icon: Radio, cues: [{ name: "Transmit", start: 0, end: 5.5 }, { name: "Receive", start: 6, end: 12 }] },
]

const clock = (tick: number) => `00:${String(Math.floor(tick / ticksPerSecond)).padStart(2, "0")}.${tick % ticksPerSecond}`
const tickAt = (started: number) => Math.min(lastTick, Math.floor((performance.now() - started) / 100))

function LandingTimeline() {
  const [tick, setTick] = useState(0)
  const [started, setStarted] = useState<number | null>(null)
  const playing = started !== null
  useEffect(() => {
    if (started === null) return
    const timer = window.setInterval(() => {
      const next = tickAt(started)
      setTick(next)
      if (next === lastTick) setStarted(null)
    }, 100)
    return () => window.clearInterval(timer)
  }, [started])

  function togglePlayback() {
    if (started !== null) {
      setTick(tickAt(started))
      setStarted(null)
      return
    }
    const from = tick === lastTick ? 0 : tick
    setTick(from)
    setStarted(performance.now() - from * 100)
  }

  return (
    <section id="transmission-timeline" className="landing-timeline" aria-labelledby="transmission-title" data-sfx="none" data-sfx-hover="none">
      <header className="transmission-intro">
        <h2 id="transmission-title">Transmission timeline.</h2>
        <p>Play this silent radio check or drag the playhead to see when each cue starts.</p>
      </header>
      <div className="transmission-demo">
        <div className="transmission-console" data-frame="tr bl">
          <div className="transmission-transport">
            <Button onClick={togglePlayback} tone="secondary">
              {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
              {playing ? "Pause" : tick === lastTick ? "Replay" : "Play"}
            </Button>
            <div className="transmission-time" aria-hidden="true">
              <span>{clock(tick)}</span><span> / {clock(lastTick)}</span>
            </div>
          </div>
          <div className="transmission-editor" data-playing={playing || undefined} style={{ "--head": `${tick / lastTick * 100}%` } as CSSProperties}>
            <div className="transmission-scale" aria-hidden="true">
              {marks.map((second) => <span key={second} style={{ left: `${second / duration * 100}%` }}>{second}s</span>)}
            </div>
            {tracks.map(({ name, icon: Icon, cues }) => (
              <div className="transmission-track" key={name} data-channel={name}>
                <span className="transmission-track-name"><Icon size={14} aria-hidden />{name}</span>
                <ol className="transmission-lane" aria-label={name + " track"}>
                  {cues.map((cue) => (
                    <li key={cue.name} style={{ left: `${cue.start / duration * 100}%`, width: `${(cue.end - cue.start) / duration * 100}%` }}>
                      {cue.name}<span data-sr-only> from {cue.start} to {cue.end} seconds</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            <div className="transmission-position">
              <div className="transmission-head" aria-hidden="true" />
              <input
                type="range"
                aria-label="Transmission playhead"
                aria-valuetext={`${tick / ticksPerSecond} of ${duration} seconds`}
                min={0}
                max={lastTick}
                step={1}
                value={tick}
                onPointerDown={() => setStarted(null)}
                onChange={(event) => {
                  setStarted(null)
                  setTick(event.currentTarget.valueAsNumber)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { LandingTimeline }
