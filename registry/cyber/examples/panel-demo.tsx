import { Button } from "@/registry/cyber/ui/button"
import { Panel } from "@/registry/cyber/ui/panel"
import { Switch } from "@/registry/cyber/ui/switch"

export default function PanelDemo() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 224px), 1fr))",
        alignItems: "start",
        gap: "16px 14px",
        width: "100%",
      }}
    >
      <Panel
        title="Reflex booster"
        code="MB-RX // REV 3 // NODE 3F:A2"
        actions="Level 2 / 5"
        footer={
          <>
            <span>Two of three slots used</span>
            <Button size="sm">Install</Button>
          </>
        }
      >
        <p>Meridian's booster shortens the gap between seeing a threat and moving. Each level will:</p>
        <ul>
          <li>Cut draw time by 4%</li>
          <li>Raise evasion by 2%</li>
          <li>Add a tenth of a second of slowed time on a dodge</li>
        </ul>
      </Panel>

      <Panel
        variant="titled"
        tone="flag"
        title="Mara Voss"
        code="PROTOCOL 7741-C // INBOUND"
        actions="New job"
        footer={
          <>
            <span>Pays ¤ 4 200 on delivery</span>
            <Button size="sm" tone="flag">
              Accept
            </Button>
          </>
        }
      >
        <p>A courier went quiet in Cinder Row with a Vanta deck that isn't theirs. Bring the deck back. The courier is optional.</p>
      </Panel>

      <Panel tone="signal" title="Deck link" code="VANTA MK.II // LINK STABLE" actions="2 routes" style={{ gridColumn: "1 / -1" }}>
        <Switch label="Stealth routing" defaultChecked />
        <Switch label="Mirror to Ilya's bench" />
      </Panel>
    </div>
  )
}
