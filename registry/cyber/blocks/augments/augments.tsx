import * as React from "react"
import { Activity, ArrowDown, ArrowUp, Brain, Cpu, RotateCcw, Shield, Zap } from "lucide-react"
import { sfx } from "@/registry/cyber/lib/sound"
import { AlertDialog } from "@/registry/cyber/ui/alert-dialog"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Checkbox } from "@/registry/cyber/ui/checkbox"
import { Feed, type FeedItem } from "@/registry/cyber/ui/feed"
import { HexStat, HexStatGroup } from "@/registry/cyber/ui/hex-stat"
import { Meter } from "@/registry/cyber/ui/meter"
import { Barcode, Corners, DataStream, Micro, Ruler } from "@/registry/cyber/ui/micro"
import { Panel } from "@/registry/cyber/ui/panel"
import { Readout } from "@/registry/cyber/ui/readout"
import { Screen } from "@/registry/cyber/ui/screen"
import { Stepper } from "@/registry/cyber/ui/stepper"
import { notify } from "@/registry/cyber/ui/toaster"
import "@/registry/cyber/blocks/augments/augments.css"

// A runner's five attributes on a lattice, at a Meridian clinic. Attribute
// points raise a level, from the "+" on a node or from the stepper in the
// sheet beside it, which are the same number. Upgrade points buy upgrades
// for the selected attribute once its level is high enough. Points spent
// in this session can be taken back until the runner leaves the chair;
// resetting upgrades is billed, so it asks first.

type AttributeId = "frame" | "reflex" | "circuit" | "cortex" | "nerve"
type StatId = "carry" | "hull" | "evasion" | "memory" | "breach" | "composure"

type Upgrade = {
  id: string
  name: string
  // Upgrade points it costs, and the attribute level it needs.
  cost: number
  needs: number
  stat: StatId
  amount: number
  effect: string
}

type Attribute = {
  id: AttributeId
  name: string
  // Three letters, for the margin of a gauge.
  short: string
  code: string
  icon: React.ReactNode
  // The level the runner walked in with. Nothing goes below it.
  base: number
  about: string
  perLevel: string[]
  upgrades: Upgrade[]
}

const cap = 20
const resetFee = 1200

const attributes: Attribute[] = [
  {
    id: "frame",
    name: "Frame",
    short: "FRM",
    code: "MB-FR // CHASSIS",
    icon: <Shield />,
    base: 9,
    about: "Frame is the chassis under everything else: bone lacing, load paths, how much of a bad night you can carry home.",
    perLevel: ["Raise carry limit by 8 kg", "Raise hull integrity by 15", "Cut stagger from heavy impacts by 2%"],
    upgrades: [
      { id: "kinetic-lattice", name: "Kinetic lattice", cost: 1, needs: 6, stat: "carry", amount: 24, effect: "Adds 24 kg to carry limit." },
      { id: "subdermal-plating", name: "Subdermal plating", cost: 2, needs: 10, stat: "hull", amount: 60, effect: "Adds 60 to hull integrity." },
      { id: "titan-actuators", name: "Titan actuators", cost: 3, needs: 16, stat: "carry", amount: 40, effect: "Adds 40 kg to carry limit." },
    ],
  },
  {
    id: "reflex",
    name: "Reflex",
    short: "RFX",
    code: "MB-RX // TIMING",
    icon: <Zap />,
    base: 7,
    about: "Reflex is the gap between seeing a thing and having already moved. Meridian sells it by the millisecond.",
    perLevel: ["Raise evasion by 2%", "Cut draw time by 3%", "Add a twentieth of a second of slowed time on a dodge"],
    upgrades: [
      { id: "split-second-buffer", name: "Split-second buffer", cost: 1, needs: 6, stat: "evasion", amount: 4, effect: "Adds 4% evasion." },
      { id: "twitch-relay", name: "Twitch relay", cost: 2, needs: 9, stat: "evasion", amount: 6, effect: "Adds 6% evasion." },
      { id: "overclocked-synapse", name: "Overclocked synapse", cost: 3, needs: 15, stat: "evasion", amount: 10, effect: "Adds 10% evasion." },
    ],
  },
  {
    id: "circuit",
    name: "Circuit",
    short: "CIR",
    code: "MB-CI // HARDWARE",
    icon: <Cpu />,
    base: 12,
    about: "Circuit is how much hardware you can run without cooking it: deck memory, bus speed, what fits in the slots.",
    perLevel: ["Add a deck memory slot every second level", "Cut daemon upload time by 2%", "Lower deck heat by 1%"],
    upgrades: [
      { id: "spare-memory-rail", name: "Spare memory rail", cost: 1, needs: 8, stat: "memory", amount: 2, effect: "Adds 2 deck memory slots." },
      { id: "cold-loop-cooling", name: "Cold-loop cooling", cost: 2, needs: 13, stat: "memory", amount: 2, effect: "Adds 2 deck memory slots." },
      { id: "ghostwrite-coprocessor", name: "Ghostwrite coprocessor", cost: 3, needs: 16, stat: "memory", amount: 4, effect: "Adds 4 deck memory slots." },
    ],
  },
  {
    id: "cortex",
    name: "Cortex",
    short: "CTX",
    code: "MB-CX // PATTERN",
    icon: <Brain />,
    base: 11,
    about: "Cortex is pattern work: reading a lock, a ledger or a room faster than whoever built it expected.",
    perLevel: ["Raise breach speed by 3%", "Reveal one more node on a scan", "Cut trace buildup by 1%"],
    upgrades: [
      { id: "pattern-cache", name: "Pattern cache", cost: 1, needs: 8, stat: "breach", amount: 5, effect: "Adds 5% breach speed." },
      { id: "mirrorfall-heuristics", name: "Mirrorfall heuristics", cost: 2, needs: 12, stat: "breach", amount: 8, effect: "Adds 8% breach speed." },
      { id: "deadlock-predictor", name: "Deadlock predictor", cost: 3, needs: 17, stat: "breach", amount: 12, effect: "Adds 12% breach speed." },
    ],
  },
  {
    id: "nerve",
    name: "Nerve",
    short: "NRV",
    code: "MB-NV // COMPOSURE",
    icon: <Activity />,
    base: 14,
    about: "Nerve is what's left when the plan isn't. It keeps your hands steady and your pulse off other people's sensors.",
    perLevel: ["Raise composure by 3%", "Cut aim sway under fire by 2%", "Slow how fast a patrol reads you by 1%"],
    upgrades: [
      { id: "steady-hand", name: "Steady hand", cost: 1, needs: 8, stat: "composure", amount: 5, effect: "Adds 5% composure." },
      { id: "flatline-calm", name: "Flatline calm", cost: 2, needs: 15, stat: "composure", amount: 8, effect: "Adds 8% composure." },
      { id: "null-ping-reflex", name: "Null Ping reflex", cost: 3, needs: 17, stat: "composure", amount: 10, effect: "Adds 10% composure." },
    ],
  },
]

const byId = Object.fromEntries(attributes.map((attribute) => [attribute.id, attribute])) as Record<AttributeId, Attribute>
const allUpgrades = attributes.flatMap((attribute) => attribute.upgrades)
const upgradeById = new Map(allUpgrades.map((upgrade) => [upgrade.id, upgrade]))

type Levels = Record<AttributeId, number>

// What the body can do, worked out from the attributes. Each stat reads
// from one attribute, so raising it moves a gauge.
type Stat = {
  id: StatId
  label: string
  from: AttributeId
  max: number
  of: (levels: Levels) => number
  format?: Intl.NumberFormatOptions
}

const stats: Stat[] = [
  { id: "carry", label: "Carry limit", from: "frame", max: 300, of: (l) => 60 + l.frame * 8, format: { style: "unit", unit: "kilogram" } },
  { id: "hull", label: "Hull integrity", from: "frame", max: 500, of: (l) => 100 + l.frame * 15 },
  { id: "evasion", label: "Evasion", from: "reflex", max: 60, of: (l) => l.reflex * 2, format: { style: "unit", unit: "percent" } },
  { id: "memory", label: "Deck memory", from: "circuit", max: 24, of: (l) => 4 + Math.floor(l.circuit / 2) },
  { id: "breach", label: "Breach speed", from: "cortex", max: 90, of: (l) => l.cortex * 3, format: { style: "unit", unit: "percent" } },
  { id: "composure", label: "Composure", from: "nerve", max: 100, of: (l) => 15 + l.nerve * 3, format: { style: "unit", unit: "percent" } },
]

const points = (count: number) => `${count} ${count === 1 ? "point" : "points"}`
const credits = (amount: number) => `¤ ${amount.toLocaleString("en-US").replace(/,/g, " ")}`
const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })

// A faint schematic behind the lattice: nested hexagons, an axis through
// each corner, and a ring of ticks, like the drawing a clinic works from.
function Schematic() {
  const hex = (radius: number) =>
    Array.from({ length: 6 }, (_, corner) => {
      const angle = (Math.PI / 3) * corner
      return `${(200 + radius * Math.cos(angle)).toFixed(1)},${(200 + radius * Math.sin(angle)).toFixed(1)}`
    }).join(" ")
  return (
    <svg data-augments-schematic="" viewBox="0 0 400 400" aria-hidden focusable="false">
      {[196, 150, 104, 58].map((radius) => (
        <polygon key={radius} points={hex(radius)} />
      ))}
      {Array.from({ length: 6 }, (_, corner) => {
        const angle = (Math.PI / 3) * corner
        return (
          <line
            key={corner}
            x1={200 + 58 * Math.cos(angle)}
            y1={200 + 58 * Math.sin(angle)}
            x2={200 + 196 * Math.cos(angle)}
            y2={200 + 196 * Math.sin(angle)}
          />
        )
      })}
      {Array.from({ length: 48 }, (_, tick) => {
        const angle = (Math.PI / 24) * tick
        const inner = tick % 4 === 0 ? 170 : 176
        return (
          <line
            key={`t${tick}`}
            data-tick=""
            x1={200 + inner * Math.cos(angle)}
            y1={200 + inner * Math.sin(angle)}
            x2={200 + 182 * Math.cos(angle)}
            y2={200 + 182 * Math.sin(angle)}
          />
        )
      })}
    </svg>
  )
}

export default function Augments() {
  const [selected, setSelected] = React.useState<AttributeId>("nerve")
  const [levels, setLevels] = React.useState<Levels>(() => Object.fromEntries(attributes.map((attribute) => [attribute.id, attribute.base])) as Levels)
  const [attributePoints, setAttributePoints] = React.useState(5)
  const [upgradePoints, setUpgradePoints] = React.useState(4)
  const [bought, setBought] = React.useState<string[]>(["steady-hand"])
  const [balance, setBalance] = React.useState(15240)
  const [resetOpen, setResetOpen] = React.useState(false)
  const [log, setLog] = React.useState<FeedItem[]>([
    { id: "sync", time: "21:04", actor: "Meridian clinic", text: "Lattice synced. Five attribute points on the account." },
  ])
  const entry = React.useRef(0)
  const root = React.useRef<HTMLDivElement>(null)
  const sheet = React.useRef<HTMLElement>(null)
  // The attribute whose node should take focus if a change removes what
  // was focused (a "+" key that has nothing left to spend, a sheet that
  // was swapped from the keyboard).
  const refocus = React.useRef<AttributeId | null>(null)

  const attribute = byId[selected]
  const level = levels[selected]
  const spent = bought.reduce((sum, id) => sum + (upgradeById.get(id)?.cost ?? 0), 0)
  const total = attributes.reduce((sum, each) => sum + levels[each.id], 0)

  const record = (actor: string, text: string, tone?: FeedItem["tone"]) => {
    const id = `e${++entry.current}`
    setLog((entries) => [...entries, { id, time: clock(), actor, text, tone }].slice(-6))
  }

  // Sets an attribute's level, from the stepper, a node or a key. It
  // can't go under where the runner started, over the cap, or further up
  // than there are points for. Coming down hands the points back, and
  // takes out any upgrade the new level can no longer hold.
  const setLevel = (id: AttributeId, wanted: number) => {
    const target = byId[id]
    const current = levels[id]
    const reach = Math.min(cap, current + attributePoints)
    const next = Math.max(target.base, Math.min(Math.round(wanted), reach))
    if (next === current) {
      if (wanted > current && current < cap) {
        notify("No attribute points left", {
          tone: "warning",
          description: `${target.name} stays at level ${current}.`,
          id: "augments-points",
        })
      }
      return false
    }
    setLevels({ ...levels, [id]: next })
    setAttributePoints(attributePoints - (next - current))
    if (next < current) {
      const dropped = target.upgrades.filter((upgrade) => bought.includes(upgrade.id) && upgrade.needs > next)
      if (dropped.length) {
        const back = dropped.reduce((sum, upgrade) => sum + upgrade.cost, 0)
        setBought(bought.filter((owned) => !dropped.some((upgrade) => upgrade.id === owned)))
        setUpgradePoints(upgradePoints + back)
        notify(`${dropped.map((upgrade) => upgrade.name).join(", ")} removed`, {
          tone: "warning",
          description: `${target.name} level ${next} can't hold it. ${points(back)} refunded.`,
        })
      }
      record(target.name, `Lowered to level ${next}. ${points(current - next)} returned.`)
    } else {
      record(target.name, `Raised to level ${next}.`)
    }
    return true
  }

  const raise = (id: AttributeId) => setLevel(id, levels[id] + 1)

  const toggleUpgrade = (upgrade: Upgrade, owned: boolean) => {
    if (owned) {
      if (bought.includes(upgrade.id)) return
      setBought([...bought, upgrade.id])
      setUpgradePoints(upgradePoints - upgrade.cost)
      record(upgrade.name, `Installed for ${points(upgrade.cost)}.`)
    } else {
      setBought(bought.filter((other) => other !== upgrade.id))
      setUpgradePoints(upgradePoints + upgrade.cost)
      record(upgrade.name, `Removed. ${points(upgrade.cost)} returned.`)
    }
  }

  const resetUpgrades = () => {
    setBought([])
    setUpgradePoints(upgradePoints + spent)
    setBalance(balance - resetFee)
    record("Meridian clinic", `Upgrades stripped. ${points(spent)} refunded, ${credits(resetFee)} billed.`, "flag")
    notify("Upgrades reset", {
      tone: "success",
      description: `${points(spent)} refunded. ${credits(resetFee)} billed to the account.`,
    })
  }

  const step = (by: number) => {
    const at = attributes.findIndex((each) => each.id === selected)
    const next = attributes[(at + by + attributes.length) % attributes.length].id
    setSelected(next)
    root.current?.querySelector<HTMLElement>(`[data-augments-node="${next}"]`)?.focus()
  }

  // The screen's keys. They're only the screen's while focus is in it or
  // nowhere, never while typing, and never under the reset question.
  const keys = React.useRef({ step, raise, selected, resetOpen })
  React.useEffect(() => {
    keys.current = { step, raise, selected, resetOpen }
  })
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      const target = event.target as Element | null
      if (!target || keys.current.resetOpen) return
      if (target !== document.body && !root.current?.contains(target)) return
      if (target.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return
      const key = event.key.toLowerCase()
      if (key === "q") keys.current.step(-1)
      else if (key === "e") keys.current.step(1)
      else if (key === "r" && keys.current.raise(keys.current.selected)) sfx("increment")
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // Focus is never left on something that's gone.
  React.useLayoutEffect(() => {
    const id = refocus.current
    refocus.current = null
    if (!id) return
    const active = document.activeElement
    if (active && active !== document.body && active.isConnected) return
    root.current?.querySelector<HTMLElement>(`[data-augments-node="${id}"]`)?.focus()
  })

  const bonus = (stat: StatId) =>
    bought.reduce((sum, id) => {
      const upgrade = upgradeById.get(id)
      return upgrade && upgrade.stat === stat ? sum + upgrade.amount : sum
    }, 0)
  const feeds = stats.filter((stat) => stat.from === selected).map((stat) => stat.label.toLowerCase())

  const resetBlocked =
    bought.length === 0
      ? "Nothing installed to reset."
      : balance < resetFee
        ? `A reset costs ${credits(resetFee)}. The account holds ${credits(balance)}.`
        : null
  const resetHint = React.useId()

  return (
    <Screen
      data-augments-screen=""
      label="Augments"
      code="CS-A0 // AUGMENT LATTICE // MERIDIAN CLINIC 04"
      status={
        <>
          <Readout label="Runner level" value={27} size="sm" tone="accent" />
          <Readout label="Street standing" value={41} size="sm" tone="ok" />
        </>
      }
      aside={<Readout label="Credits" prefix="¤" value={balance} size="sm" tone="flag" />}
      hints={[
        { keys: "Q", label: "Previous attribute", onPress: () => step(-1) },
        { keys: "E", label: "Next attribute", onPress: () => step(1) },
        { keys: "R", label: "Spend point", action: "increment", disabled: attributePoints === 0 || level >= cap, onPress: () => raise(selected) },
      ]}
    >
      <div ref={root} data-kit="augments">
        {/* Yellow while there's something to spend. */}
        <div data-augments-points="" role="group" aria-label="Points to spend">
          <Readout label="Attribute points" value={attributePoints} unit="left" tone={attributePoints ? "flag" : "accent"} />
          <Readout label="Upgrade points" value={upgradePoints} unit="left" tone={upgradePoints ? "flag" : "accent"} />
        </div>

        <div data-augments-stage="">
          <Corners size={10} />
          <Schematic />
          <header data-augments-stage-head="">
            <h2 data-augments-heading="">Attribute lattice</h2>
            <span data-kit="value">Level cap {cap}</span>
          </header>
          <Micro data-augments-print="side" vertical>
            PROTOCOL 7741-C // NODE 3F:A2
          </Micro>
          <DataStream data-augments-stream="" rows={5} seed="CS-A0" />
          <HexStatGroup label="Attributes" gap={24} minSize={82}>
            {attributes.map((each) => (
              <HexStat
                key={each.id}
                data-augments-node={each.id}
                name={each.name}
                icon={each.icon}
                value={levels[each.id]}
                max={cap}
                selected={selected === each.id}
                onClick={() => setSelected(each.id)}
                onRaise={
                  attributePoints > 0
                    ? () => {
                        refocus.current = each.id
                        setSelected(each.id)
                        return raise(each.id)
                      }
                    : undefined
                }
              />
            ))}
          </HexStatGroup>
          <div data-augments-stage-foot="">
            <Readout label="Attribute total" value={total} unit="/ 100" size="sm" />
            <Barcode value={`CS-A0-${total}`} size={20} />
            <Button data-augments-jump="" onClick={() => {
              sheet.current?.focus({ preventScroll: true })
              sheet.current?.scrollIntoView({ block: "start" })
            }}>
              {attribute.name} details <ArrowDown aria-hidden />
            </Button>
          </div>
          <Ruler data-augments-ruler="" />
        </div>

        <Panel
          ref={sheet}
          tabIndex={-1}
          data-augments-sheet-panel=""
          title={attribute.name}
          level={2}
          code={`${attribute.code} // NODE ${attributes.indexOf(attribute) + 1} OF 5`}
          actions={`Level ${level} / ${cap}`}
          footer={<>
            <span>Feeds {feeds.join(" and ")}.</span>
            <Button data-augments-jump="" tone="ghost" onClick={() => root.current?.querySelector<HTMLElement>(`[data-augments-node="${selected}"]`)?.focus()}>
              <ArrowUp aria-hidden /> Lattice
            </Button>
          </>}
        >
          {/* Keyed by attribute, so the sheet tears in when the selection changes. */}
          <div data-augments-sheet-clip="">
            <div key={attribute.id} data-augments-sheet="">
              <p>{attribute.about}</p>
              <Stepper
                label={`${attribute.name} level`}
                value={level}
                min={attribute.base}
                max={Math.min(cap, level + attributePoints)}
                onValueChange={(value, details) => {
                  if (value == null || !setLevel(attribute.id, value)) details.cancel()
                }}
                hint={
                  level >= cap
                    ? "At the cap."
                    : attributePoints
                      ? `A level costs one attribute point. ${points(attributePoints)} left.`
                      : "No attribute points left."
                }
              />
              <h3 data-kit="label">Per level</h3>
              <ul>
                {attribute.perLevel.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <h3 data-kit="label">Upgrades</h3>
              <div data-augments-upgrades="" role="group" aria-label={`${attribute.name} upgrades`}>
                {attribute.upgrades.map((upgrade) => {
                  const owned = bought.includes(upgrade.id)
                  const locked = level < upgrade.needs
                  const short = !owned && upgrade.cost > upgradePoints
                  const reason = locked
                    ? `Needs ${attribute.name} level ${upgrade.needs}.`
                    : short
                      ? `Costs ${points(upgrade.cost)}; ${upgradePoints ? `only ${upgradePoints} left` : "none left"}.`
                      : owned
                        ? "Installed."
                        : `Costs ${points(upgrade.cost)}.`
                  // Unlocked by a level bought in this session: the new thing.
                  const fresh = !owned && !locked && upgrade.needs > attribute.base
                  return (
                    <div key={upgrade.id} data-augments-upgrade="" data-locked={locked ? "" : undefined}>
                      <Checkbox
                        label={upgrade.name}
                        hint={`${upgrade.effect} ${reason}`}
                        checked={owned}
                        disabled={!owned && (locked || short)}
                        onCheckedChange={(checked) => toggleUpgrade(upgrade, checked === true)}
                      />
                      <span data-augments-upgrade-tags="">
                        {fresh && <Badge tone="flag">Unlocked</Badge>}
                        <span data-kit="value" aria-hidden>
                          {upgrade.cost} PT
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Panel>

        <div data-augments-reset="">
          <Readout label="Upgrade points spent" value={spent} size="sm" tone="accent" />
          <div data-augments-reset-key="">
            <Button disabled={resetBlocked != null} focusableWhenDisabled aria-describedby={resetHint} onClick={() => setResetOpen(true)}>
              <RotateCcw aria-hidden />
              Reset upgrades
              <span data-augments-fee="" aria-hidden>
                {credits(resetFee)}
              </span>
            </Button>
            <p data-kit="hint" id={resetHint}>
              {resetBlocked ?? `Costs ${credits(resetFee)}. Returns ${points(spent)}.`}
            </p>
          </div>
          <AlertDialog
            open={resetOpen}
            onOpenChange={(open) => setResetOpen(open)}
            title="Reset upgrades?"
            description={`Every installed upgrade is stripped and ${points(spent)} ${spent === 1 ? "comes" : "come"} back to spend again. The clinic bills ${credits(resetFee)} for the chair time. Attribute levels stay as they are.`}
            confirm="Strip and refund"
            cancel="Keep upgrades"
            agentConfirm={`Removes every installed upgrade, refunds the upgrade points and charges ${credits(resetFee)} to the runner's account.`}
            code="MERIDIAN CLINIC 04 // RESET 0x1C // BILLED"
            onConfirm={resetUpgrades}
          />
        </div>

        <div data-augments-side="">
          <Panel
            title="Derived stats"
            tone="signal"
            level={2}
            code="READ FROM LATTICE // LIVE"
            actions={
              <Badge tone="signal" status live>
                Live
              </Badge>
            }
          >
            <div data-augments-stats="">
              {stats.map((stat) => (
                <div key={stat.id} data-augments-stat="" data-fed={stat.from === selected ? "" : undefined}>
                  <span data-augments-source="" aria-hidden>
                    {byId[stat.from].short}
                  </span>
                  <Meter label={stat.label} value={Math.min(stat.max, stat.of(levels) + bonus(stat.id))} max={stat.max} format={stat.format} segments={24} />
                </div>
              ))}
            </div>
          </Panel>
          <div data-augments-log="">
            <h2 data-augments-heading="">Session log</h2>
            <Feed label="Session log entries" items={log} live />
          </div>
        </div>
      </div>
    </Screen>
  )
}
