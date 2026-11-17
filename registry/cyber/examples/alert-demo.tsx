import { Alert } from "@/registry/cyber/ui/alert"
import { Button } from "@/registry/cyber/ui/button"

export default function AlertDemo() {
  return (
    <>
      <Alert tone="info" title="Handshake complete">
        Vanta relay 3F:A2 accepted the key. Traffic is routed through Glasswater.
      </Alert>
      <Alert tone="success" title="Route cleared">
        Dex is parked two blocks out with the engine running.
      </Alert>
      <Alert
        tone="warning"
        title="Trace in progress"
        action={
          <Button size="sm" tone="flag">
            Reroute
          </Button>
        }
      >
        Someone on Meridian's side is walking the link back. About ninety seconds.
      </Alert>
      <Alert
        tone="danger"
        title="Deck overheating"
        action={
          <Button size="sm" tone="primary">
            Vent
          </Button>
        }
      >
        Core is at 96% of its thermal limit. Daemons will be dropped to protect the hardware.
      </Alert>
    </>
  )
}
