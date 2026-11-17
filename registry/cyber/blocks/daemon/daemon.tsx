import * as React from "react"
import { Play, RotateCcw, Square } from "lucide-react"
import { daemon } from "@/registry/cyber/blocks/daemon/engine"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Checkbox } from "@/registry/cyber/ui/checkbox"
import { Panel } from "@/registry/cyber/ui/panel"
import { RadioGroup } from "@/registry/cyber/ui/radio-group"
import { Readout } from "@/registry/cyber/ui/readout"
import { Select } from "@/registry/cyber/ui/select"
import { Slider } from "@/registry/cyber/ui/slider"
import { Stepper } from "@/registry/cyber/ui/stepper"
import { Switch } from "@/registry/cyber/ui/switch"
import { Terminal } from "@/registry/cyber/ui/terminal"
import { TextField } from "@/registry/cyber/ui/text-field"
import { notify } from "@/registry/cyber/ui/toaster"
import "@/registry/cyber/blocks/daemon/daemon.css"

// An agent on the page, where you can watch it. On the left is an ordinary
// form built from the kit. On the right is a console onto the ui-sdk agent
// bridge: it lists what an agent can see, runs what an agent would run, and
// keeps a history that can put the agent's changes back without touching
// yours. Nothing here calls a model; the programs are scripted tool calls,
// so the bridge itself is what's on show.
//
// The form's labels are the agent's only handles on it, so they're plain
// names a person would say, each used once.
const districts = [
  { value: "lowtide", label: "Lowtide", code: "LT-04" },
  { value: "glasswater", label: "Glasswater", code: "GW-11" },
  { value: "cinder-row", label: "Cinder Row", code: "CR-02" },
  { value: "the-stacks", label: "The Stacks", code: "ST-27" },
  { value: "meridian-heights", label: "Meridian Heights", code: "MH-01" },
]

function Deck() {
  const [committed, setCommitted] = React.useState<string | null>(null)
  const [burned, setBurned] = React.useState(false)
  return (
    <Panel
      title="Deck configuration"
      code="VANTA MK.II // WHAT THE AGENT OPERATES"
      level={2}
      data-daemon-deck=""
      footer={
        <p data-kit="hint" role="status">
          {burned ? "Identity burned. This one doesn't come back." : (committed ?? "Nothing committed yet.")}
        </p>
      }
    >
      <div data-daemon-form="">
        <TextField label="Handle" defaultValue="nyx" hint="Shown to every crew you run with." />
        <Select label="District" options={districts} defaultValue="lowtide" hint="Where the route starts." />
        <Slider label="Gain" defaultValue={40} />
        <Stepper label="Relays" defaultValue={2} min={1} max={8} />
        <RadioGroup
          label="Approach"
          defaultValue="loud"
          options={[
            { value: "quiet", label: "Quiet" },
            { value: "loud", label: "Loud" },
            { value: "talk", label: "Talk" },
          ]}
        />
        <div data-daemon-latches="">
          <Switch label="Stealth routing" />
          <Switch label="Optic overlay" defaultChecked />
          <Checkbox label="Log traffic" defaultChecked />
        </div>
      </div>
      <div data-kit="actions" data-daemon-actions="">
        {/* Irreversible, so an agent can ask for it but a person has to say yes. */}
        <Button
          data-agent-confirm="Burns the current identity: its alias, its credit line and every door it opens. This can't be undone."
          onClick={() => {
            setBurned(true)
            notify("Identity burned", { tone: "error", description: "The Glasswater alias is gone." })
          }}
        >
          Burn identity
        </Button>
        <Button
          tone="primary"
          onClick={() => {
            const at = new Date().toLocaleTimeString("en-GB", { hour12: false })
            setCommitted(`Route committed at ${at}.`)
            notify("Route committed", { tone: "success", description: "The deck is holding the new configuration." })
          }}
        >
          Commit route
        </Button>
      </div>
    </Panel>
  )
}

function Console() {
  const state = React.useSyncExternalStore(daemon.subscribe, daemon.getState)
  return (
    <Panel
      title="Daemon console"
      code="BRIDGE UP // SNAPSHOT · QUERY · ACT"
      tone="signal"
      level={2}
      data-daemon-console=""
      actions={
        state.busy ? (
          <Badge tone="signal" status live>
            Running
          </Badge>
        ) : (
          <Badge tone="mute" status>
            Idle
          </Badge>
        )
      }
    >
      {/* The console's own controls are kept from the agent: it operates the
          deck, not itself. */}
      <div data-agent-hidden="" data-daemon-console-body="">
        <div data-daemon-programs="" role="group" aria-label="Programs">
          {daemon.programs.map((program) => (
            <div key={program.name} data-daemon-program="">
              <Button tone="signal" size="sm" disabled={state.busy} onClick={() => void daemon.play(program.name)}>
                <Play aria-hidden />
                {program.name}
              </Button>
              <span data-kit="hint">{program.task}</span>
            </div>
          ))}
        </div>
        <Terminal
          label="Daemon log"
          lines={state.lines}
          busy={state.busy}
          onCommand={(text) => void daemon.run(text)}
          placeholder='help · scan · set "Handle" wraith · run ghostwrite'
          height={340}
        />
        <div data-daemon-status="">
          <Readout value={state.agentChanges} label="Agent changes applied" size="sm" />
          <div data-kit="actions">
            <Button size="sm" disabled={!state.busy} onClick={() => daemon.stop()}>
              <Square aria-hidden />
              Stop
            </Button>
            <Button size="sm" tone="signal" disabled={state.busy || state.agentChanges === 0} onClick={() => void daemon.undoAgent()}>
              <RotateCcw aria-hidden />
              Undo agent
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  )
}

const notes = [
  ["It reads by name", "snapshot() lists every ui-sdk component with its label, state and the actions it accepts. No screenshots, no selectors."],
  ["It acts through the component", "act() calls the same API a press or a key would, so change callbacks, validation and disabled states all still apply."],
  ["You can see it", "Whatever an agent changes lights cyan for a moment and is announced to screen readers. Your own changes don't."],
  ["It can be told no", "Burn identity is marked data-agent-confirm. The agent can ask; the page holds the step until a person answers."],
  ["It can be undone", "A history records who changed what. Undo agent puts back only the agent's changes and leaves yours."],
]

export default function Daemon() {
  return (
    <div data-kit="daemon">
      <div data-daemon-columns="">
        <Deck />
        <Console />
      </div>
      <dl data-daemon-notes="">
        {notes.map(([term, text]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <span data-micro aria-hidden>
        CS-D0 // AGENT BRIDGE // WEBMCP TOOLS REGISTERED WHERE THE BROWSER PROVIDES THEM
      </span>
    </div>
  )
}
