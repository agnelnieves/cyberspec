import { Crosshair } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ButtonDemo() {
  return (
    <>
      <Button tone="primary">Deploy</Button>
      <Button>Abort</Button>
      <Button tone="signal" onClick={() => wait(1400)} pendingAnnouncement="Scanning">
        Scan
      </Button>
      <Button tone="flag">Accept</Button>
      <Button icon aria-label="Lock on">
        <Crosshair aria-hidden />
      </Button>
      <Button disabled>Offline</Button>
    </>
  )
}
