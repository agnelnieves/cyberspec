import * as React from "react"
import { Button } from "@/registry/cyber/ui/button"
import { Loader } from "@/registry/cyber/ui/loader"

// How much each step adds. Uneven, the way real work is; it sums to 100.
const steps = [3, 7, 2, 9, 5, 4, 8, 6, 3, 7, 2, 9, 5, 4, 8, 6, 3, 9]

const boot = ["Linking…", "Verifying keys…", "Mapping routes…", "Syncing cache…"]

export default function LoaderDemo() {
  // null is the handshake, before there's anything to count.
  const [value, setValue] = React.useState<number | null>(0)
  const [running, setRunning] = React.useState(false)
  const timers = React.useRef<number[]>([])

  const stop = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }
  React.useEffect(() => stop, [])

  function run() {
    stop()
    setRunning(true)
    setValue(null)
    let total = 0
    steps.forEach((step, index) => {
      total += step
      const next = total
      timers.current.push(
        window.setTimeout(
          () => {
            setValue(next)
            if (next >= 100) setRunning(false)
          },
          1400 + (index + 1) * 190,
        ),
      )
    })
    timers.current.push(window.setTimeout(() => setValue(0), 1400))
  }

  const idle = !running && value === 0
  return (
    <>
      <Loader label="Vanta Mk.II deck" value={value} phrases={idle ? ["Standing by."] : boot} code="CS-07 // PROTOCOL 7741-C // REV 0.1" />
      <Button tone="primary" onClick={run}>
        {value === 100 ? "Reboot deck" : "Boot deck"}
      </Button>
    </>
  )
}
