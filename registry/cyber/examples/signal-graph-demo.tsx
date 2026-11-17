import * as React from "react"
import { fxMoves, onFxChange } from "@/registry/cyber/lib/fx"
import { SignalGraph } from "@/registry/cyber/ui/signal-graph"

// A relay's signal strength: a slow swell with a little jitter on it.
const strength = (tick: number) => Math.round(62 + 22 * Math.sin(tick / 4.5) + 9 * Math.sin(tick * 1.7) + 4 * Math.sin(tick * 5.3))
const load = [18, 34, 52, 71, 88, 64, 47, 59, 76, 93, 81, 55, 38, 44, 67, 72]

export default function SignalGraphDemo() {
  const [tick, setTick] = React.useState(28)
  const signal = React.useMemo(() => Array.from({ length: 28 }, (_, index) => strength(tick - 27 + index)), [tick])
  // With FX off nothing on the page moves, so the feed holds too.
  const moving = React.useSyncExternalStore(onFxChange, fxMoves, () => false)

  React.useEffect(() => {
    if (!moving) return
    const timer = setInterval(() => {
      if (!document.hidden) setTick((value) => value + 1)
    }, 900)
    return () => clearInterval(timer)
  }, [moving])

  return (
    <div style={{ display: "grid", gap: 16, width: "100%" }}>
      <SignalGraph label="Signal" data={signal} unit="dB" min={0} max={100} live />
      <SignalGraph label="Load" variant="bars" data={load} unit="%" min={0} max={100} tone="accent" />
    </div>
  )
}
