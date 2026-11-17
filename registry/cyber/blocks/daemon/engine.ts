import type { AgentAction, AgentComponent, AgentStep } from "@ui-sdk/react/agent"
import { createHistory, describeEntry } from "@ui-sdk/react/history"
import { sfx } from "@/registry/cyber/lib/sound"
import { agent, setAsk } from "@/registry/cyber/blocks/daemon/bridge"

// The Daemon: the site's stand-in for a model. It drives the page through
// the ui-sdk agent bridge the way a model's tool calls would (snapshot,
// query, act) from commands typed at a console and from scripted programs,
// so what an agent can see and do here is something you can watch, with no
// API key involved. Everything it does goes through the same permissions,
// change callbacks and history a real agent's would.

type LineKind = "sys" | "agent" | "user" | "ok" | "warn" | "err"
type Line = { id: string; kind: LineKind; text: string; time: string }

// A step waiting for a person's answer.
type Hold = { step: AgentAction; sentence: string }

type State = {
  lines: Line[]
  busy: boolean
  hold: Hold | null
  // How many of the recorded changes were the agent's, and still applied.
  agentChanges: number
}

let state: State = { lines: [], busy: false, hold: null, agentChanges: 0 }
const listeners = new Set<() => void>()
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

let serial = 0
const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false })
function print(kind: LineKind, text: string) {
  const line = { id: `l${++serial}`, kind, text, time: stamp() }
  // The log keeps its last 400 lines.
  set({ lines: [...state.lines.slice(-399), line] })
  return line
}

const show = (value: unknown) => (typeof value === "string" ? `"${value}"` : JSON.stringify(value))

// ── History ────────────────────────────────────────────────────────────────

const history = createHistory(agent)
const countAgent = () =>
  set({ agentChanges: history.entries().filter((entry) => entry.source === "agent" && !("reverted" in entry && entry.reverted)).length })
history.subscribe(countAgent)

// What a person changes is logged too: an agent is told what happened
// between its turns, and this is that feed. Changes to the same control in a
// row (typing, dragging) replace the line rather than adding one each.
let lastOwn: { ref: string; key: string; id: string } | null = null
agent.subscribe((change) => {
  if (change.source === "agent") return
  const text = `${change.label ?? change.component} ${change.key} → ${show(change.value)}`
  if (lastOwn && lastOwn.ref === change.ref && lastOwn.key === change.key && state.lines.at(-1)?.id === lastOwn.id) {
    set({ lines: state.lines.map((line) => (line.id === lastOwn!.id ? { ...line, text } : line)) })
    return
  }
  lastOwn = { ref: change.ref, key: change.key, id: print("user", text).id }
})

// ── Permission ─────────────────────────────────────────────────────────────

// A step on something marked data-agent-confirm stops here until a person
// answers. The screen shows `state.hold` as a prompt and calls `answer`.
let settle: ((yes: boolean) => void) | null = null
setAsk(
  (step, signal) =>
    new Promise<boolean>((resolve) => {
      const sentence = step.confirm ?? `${step.action} ${step.label ?? step.ref}`
      print("warn", `HOLD: needs a person. ${sentence}`)
      sfx("warning")
      settle = (yes) => {
        settle = null
        set({ hold: null })
        resolve(yes)
      }
      signal.addEventListener("abort", () => settle?.(false))
      set({ hold: { step, sentence } })
    }),
)

function answer(yes: boolean) {
  if (!settle) return
  print(yes ? "ok" : "err", yes ? "Approved by you." : "Refused by you.")
  settle(yes)
}

// ── Tools ──────────────────────────────────────────────────────────────────

const describe = (component: AgentComponent) => {
  const bits = [component.ref.padEnd(4), component.component.padEnd(12), component.label ? `"${component.label}"` : "(unnamed)"]
  for (const key of ["value", "checked", "open", "pressed"]) if (key in component) bits.push(`${key}=${show(component[key])}`)
  if (component.disabled) bits.push("disabled")
  if (component.confirm) bits.push("needs-a-person")
  if (component.actions.length) bits.push(`[${component.actions.join(" ")}]`)
  return bits.join(" ")
}

function scan(kind?: string) {
  const all = agent.snapshot()
  const found = kind ? all.filter((component) => component.component === kind) : all
  print("agent", `snapshot() → ${found.length} component${found.length === 1 ? "" : "s"}${kind ? ` of kind ${kind}` : ""}`)
  for (const component of found.slice(0, 24)) print("sys", describe(component))
  if (found.length > 24) print("sys", `… and ${found.length - 24} more. Narrow it: scan <kind>, or find <text>.`)
  return found
}

async function find(text: string, within?: string) {
  const found = await agent.query(within ? { within, text: text || undefined } : { text })
  print("agent", within ? `query({ within: "${within}"${text ? `, text: "${text}"` : ""} })` : `query({ text: "${text}" })`)
  if ("error" in found) return print("err", found.error)
  if (!found.length) return print("sys", "Nothing matches.")
  for (const component of found.slice(0, 12)) {
    print("sys", describe(component))
    for (const item of component.items?.slice(0, 12) ?? []) print("sys", `      · ${item.label}  (${item.value})`)
  }
}

// One act() call with one step, logged the way a tool call and its result
// would read.
async function act(step: AgentStep) {
  const args = step.args?.length ? ` ${step.args.map(show).join(" ")}` : ""
  print("agent", `act  ${step.action} "${step.ref}"${args}`)
  const result = await agent.act({ steps: [step] })
  if (!result.ok) {
    sfx("deny")
    print("err", result.error?.message ?? "The step failed.")
    return false
  }
  const changes = result.steps.flatMap((done) => done.changes ?? [])
  if (!changes.length) print("sys", step.action === "press" ? "ok, pressed." : "ok, nothing changed.")
  for (const change of changes) print("ok", `${change.label ?? change.component} ${change.key} = ${show(change.value)}`)
  return true
}

async function undoAgent() {
  const before = state.agentChanges
  if (!before) return print("sys", "The agent hasn't changed anything that's still applied.")
  print("user", "undo: put back everything the agent changed")
  const stuck = await history.undoSource("agent")
  countAgent()
  if (stuck.length) print("warn", `${stuck.length} change${stuck.length === 1 ? "" : "s"} couldn't be put back.`)
  else print("ok", `${before} change${before === 1 ? "" : "s"} reverted. What you changed yourself is untouched.`)
  sfx("success")
}

function showHistory() {
  const entries = history.entries()
  if (!entries.length) return print("sys", "No changes recorded yet.")
  for (const entry of entries.slice(-16)) print("sys", describeEntry(entry))
}

// ── Programs ───────────────────────────────────────────────────────────────

// A scripted run: what a model would do for a task, written out. Each entry
// is something said, a read, or one act() step.
type Beat = { say: string } | { scan: string | true } | { find: string; within?: string } | { step: AgentStep }
type Program = { name: string; task: string; beats: Beat[] }

const programs: Program[] = [
  {
    name: "ghostwrite",
    task: "Set the deck up for a quiet run through Glasswater and commit the route.",
    beats: [
      { say: "Reading the page." },
      { scan: true },
      { say: "Six controls to change. Starting with the handle." },
      { step: { ref: "Handle", action: "setValue", args: ["wraith"] } },
      { find: "", within: "District" },
      { step: { ref: "District", action: "setValue", args: ["Glasswater"] } },
      { step: { ref: "Stealth routing", action: "setChecked", args: [true] } },
      { step: { ref: "Gain", action: "setValue", args: [72] } },
      { step: { ref: "Approach", action: "setValue", args: ["Quiet"] } },
      { step: { ref: "Relays", action: "setValue", args: [5] } },
      { step: { ref: "Commit route", action: "press" } },
      { say: "Route committed. Every change is in the history: type undo to put them back." },
    ],
  },
  {
    name: "deadlock",
    task: "Burn the current identity. It's marked as needing a person, so the agent has to ask.",
    beats: [
      { say: "This control is marked data-agent-confirm. I can ask, but I can't decide." },
      { step: { ref: "Burn identity", action: "press" } },
      { say: "That's the whole point: the page, not the model, holds the line." },
    ],
  },
  {
    name: "null-ping",
    task: "Look, don't touch: read what's on the page and what the district list offers.",
    beats: [{ scan: "switch" }, { find: "route" }, { find: "", within: "District" }, { say: "Read-only pass complete. Nothing was changed." }],
  },
]

let stopped = false
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function play(name: string) {
  const program = programs.find((entry) => entry.name === name)
  if (!program) return print("err", `No program called ${name}. Try: ${programs.map((entry) => entry.name).join(", ")}.`)
  if (state.busy) return print("warn", "A program is already running. Type stop to end it.")
  stopped = false
  set({ busy: true })
  print("user", `run ${program.name}: ${program.task}`)
  try {
    for (const beat of program.beats) {
      if (stopped) {
        print("warn", "Stopped by you.")
        break
      }
      // Paced so each step can be watched land on the page.
      await pause(520)
      if ("say" in beat) print("agent", beat.say)
      else if ("scan" in beat) scan(beat.scan === true ? undefined : beat.scan)
      else if ("find" in beat) await find(beat.find, beat.within)
      else if (!(await act(beat.step))) break
    }
  } finally {
    set({ busy: false })
  }
}

function stop() {
  if (!state.busy) return
  stopped = true
  settle?.(false)
}

// ── Commands ───────────────────────────────────────────────────────────────

const help = [
  "scan [kind]              what the agent sees: snapshot()",
  "find <text>              components and choices matching text: query()",
  'list "<label>"           the choices inside a select, list or group',
  'set "<label>" <value>    change a value (JSON, or plain text)',
  'on | off "<label>"       a switch or a checkbox',
  'press "<label>"          a button',
  'do "<label>" <action> [args]   any action a component lists',
  "run <program>            ghostwrite · deadlock · null-ping",
  "undo                     put back everything the agent changed",
  "history · stop · clear",
]

// Splits a command into words, keeping "quoted phrases" together.
const words = (text: string) => [...text.matchAll(/"([^"]*)"|(\S+)/g)].map((match) => match[1] ?? match[2])
const parse = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

async function run(text: string) {
  const [verb, ...rest] = words(text.trim())
  if (!verb) return
  const direct = !["run", "undo", "stop", "clear", "help", "history"].includes(verb.toLowerCase())
  if (direct) print("user", text.trim())
  switch (verb.toLowerCase()) {
    case "help":
    case "?":
      return help.forEach((line) => print("sys", line))
    case "scan":
    case "snapshot":
      return void scan(rest[0])
    case "find":
    case "query":
      return void (await find(rest.join(" ")))
    case "list":
      return void (await find(rest.slice(1).join(" "), rest[0]))
    case "set":
      if (rest.length < 2) return print("err", 'Usage: set "<label>" <value>')
      return void (await act({ ref: rest[0], action: "setValue", args: [parse(rest.slice(1).join(" "))] }))
    case "on":
    case "off":
      if (!rest[0]) return print("err", `Usage: ${verb} "<label>"`)
      return void (await act({ ref: rest[0], action: "setChecked", args: [verb.toLowerCase() === "on"] }))
    case "press":
    case "toggle":
    case "open":
    case "close":
      if (!rest[0]) return print("err", `Usage: ${verb} "<label>"`)
      if (verb === "open" || verb === "close") return void (await act({ ref: rest[0], action: "setOpen", args: [verb === "open"] }))
      return void (await act({ ref: rest[0], action: verb.toLowerCase() }))
    case "do":
      if (rest.length < 2) return print("err", 'Usage: do "<label>" <action> [args]')
      return void (await act({ ref: rest[0], action: rest[1], args: rest.slice(2).map(parse) }))
    case "run":
      return void (await play(rest[0] ?? ""))
    case "undo":
      return void (await undoAgent())
    case "history":
      return showHistory()
    case "stop":
      return stop()
    case "clear":
      return set({ lines: [] })
    default:
      print("err", `Unknown command: ${verb}. Type help.`)
  }
}

print("sys", "DAEMON v0.1 // bridge up. An agent on this page can read and operate every ui-sdk component on it.")
print("sys", "Run a program below, or type help.")

const daemon = {
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getState: () => state,
  run,
  play,
  stop,
  answer,
  undoAgent,
  programs: programs.map(({ name, task }) => ({ name, task })),
}

export { daemon }
export type { Hold, Line, LineKind, State as DaemonState }
