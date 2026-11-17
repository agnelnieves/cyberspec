import { createAgent, registerTools, type AgentAction } from "@ui-sdk/react/agent"

// The app's agent bridge: one for the whole app, made before anything
// renders (import this module from the app's entry). It's what the Daemon console drives, and what a browser's own
// agent reaches through WebMCP.
//
// Nothing an agent asks for runs unseen. A step on a control marked
// `data-agent-confirm`, and every step from the browser's agent that presses
// something, waits for a person to answer in the site's own dialog. The
// dialog registers itself here with `setAsk`; until it has, those steps are
// refused.
type Ask = (step: AgentAction, signal: AbortSignal) => Promise<boolean>

let ask: Ask | null = null
const setAsk = (next: Ask | null) => {
  ask = next
}

const agent = createAgent({
  allow: (step, { signal }) => {
    if (!step.confirm) return true
    return ask ? ask(step, signal) : false
  },
})

// For a browser that provides WebMCP (document.modelContext); elsewhere this
// does nothing. The browser's agent isn't ours, so anything it wants to
// press is asked about first.
registerTools(agent, {
  allow: (step, { signal }) => {
    if (step.action !== "press" && !step.confirm) return true
    return ask ? ask(step, signal) : false
  },
})

export { agent, setAsk }
export type { Ask }
