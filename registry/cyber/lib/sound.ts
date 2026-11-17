// The kit's interface sounds: every one is synthesized with the Web Audio
// API as it plays, so there are no audio files. They're the sounds of a
// display rather than of a mechanism: short sine and square blips, a little
// filtered noise for a glitch, two-note chimes for outcomes.
//
// Sound is off until someone turns it on, and the choice is remembered.
// `sfx(voice)` plays one; components call it from their handlers, and
// `installSound()` also plays the common ones from page-wide listeners, so a
// plain button, option or tab sounds without any code of its own.
type Voice =
  | "hover" // the pointer arriving on something pressable
  | "press" // a button going down
  | "confirm" // a primary action
  | "select" // an option, a tab, a row chosen
  | "tick" // one step of a value: a slider, a stepper
  | "on" // a switch or a checkbox turning on
  | "off" // ...and off
  | "open" // a popup, a dialog, a drawer appearing
  | "close" // ...and leaving
  | "type" // a key in a text field
  | "glitch" // a burst of interference
  | "success"
  | "warning"
  | "error"
  | "deny" // refused: a disabled control, an agent's blocked step
  | "agent" // an agent acting on the page

const storageKey = "cyberspec:sound"
let enabled = false
try {
  enabled = typeof localStorage !== "undefined" && localStorage.getItem(storageKey) === "on"
} catch {}
const listeners = new Set<(on: boolean) => void>()

const soundEnabled = () => enabled

function setSoundEnabled(on: boolean) {
  enabled = on
  try {
    localStorage.setItem(storageKey, on ? "on" : "off")
  } catch {}
  if (on) unlock()
  listeners.forEach((listener) => listener(on))
}

function onSoundChange(listener: (on: boolean) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null

// Browsers only start audio inside a gesture, so the context is made (and
// resumed) on the first press or key.
function unlock() {
  if (!enabled || typeof AudioContext === "undefined") return
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0.5
    // A gentle ceiling, so overlapping blips never clip.
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -14
    limiter.ratio.value = 8
    master.connect(limiter).connect(ctx.destination)
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  if (ctx.state !== "running") ctx.resume().catch(() => {})
}

// One oscillator with a pitch glide and a fast decay.
function tone(
  at: number,
  { type = "sine", from, to = from, length, level }: { type?: OscillatorType; from: number; to?: number; length: number; level: number },
) {
  if (!ctx || !master) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, at)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + length)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(level, at + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain).connect(master)
  osc.start(at)
  osc.stop(at + length + 0.02)
}

// A slice of band-passed noise: static.
function hiss(at: number, { freq, q = 2, length, level }: { freq: number; q?: number; length: number; level: number }) {
  if (!ctx || !master || !noise) return
  const src = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  src.buffer = noise
  src.playbackRate.value = 0.8 + Math.random() * 0.5
  filter.type = "bandpass"
  filter.frequency.value = freq
  filter.Q.value = q
  gain.gain.setValueAtTime(level, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  src.connect(filter).connect(gain).connect(master)
  src.start(at, Math.random() * 0.1, length + 0.02)
}

// No two plays are identical: pitch drifts a few percent each time.
const drift = (hz: number, amount = 0.03) => hz * (1 + (Math.random() * 2 - 1) * amount)

const voices: Record<Voice, (at: number) => void> = {
  hover: (at) => tone(at, { from: drift(2400), length: 0.025, level: 0.035 }),
  press: (at) => {
    tone(at, { type: "square", from: drift(520), to: 260, length: 0.05, level: 0.06 })
    hiss(at, { freq: 3200, length: 0.02, level: 0.05 })
  },
  confirm: (at) => {
    tone(at, { type: "square", from: drift(440), to: 220, length: 0.07, level: 0.07 })
    tone(at + 0.045, { from: drift(1320), length: 0.09, level: 0.07 })
  },
  select: (at) => tone(at, { from: drift(1480), to: 1760, length: 0.045, level: 0.07 }),
  tick: (at) => tone(at, { type: "triangle", from: drift(1900, 0.05), length: 0.018, level: 0.05 }),
  on: (at) => {
    tone(at, { from: drift(880), length: 0.04, level: 0.07 })
    tone(at + 0.04, { from: drift(1320), length: 0.06, level: 0.07 })
  },
  off: (at) => {
    tone(at, { from: drift(1100), length: 0.04, level: 0.06 })
    tone(at + 0.04, { from: drift(660), length: 0.06, level: 0.06 })
  },
  open: (at) => {
    hiss(at, { freq: 1800, q: 0.8, length: 0.07, level: 0.05 })
    tone(at, { from: drift(300), to: 900, length: 0.09, level: 0.05 })
  },
  close: (at) => tone(at, { from: drift(820), to: 280, length: 0.07, level: 0.045 }),
  type: (at) => {
    hiss(at, { freq: drift(4200, 0.15), q: 3, length: 0.014, level: 0.05 })
    tone(at, { type: "square", from: drift(1700, 0.08), length: 0.012, level: 0.015 })
  },
  glitch: (at) => {
    for (let i = 0; i < 4; i++) hiss(at + i * 0.028, { freq: 600 + Math.random() * 5000, q: 6, length: 0.022, level: 0.07 })
    tone(at, { type: "sawtooth", from: drift(90), to: 60, length: 0.1, level: 0.04 })
  },
  success: (at) => {
    tone(at, { from: 988, length: 0.08, level: 0.07 })
    tone(at + 0.075, { from: 1480, length: 0.16, level: 0.07 })
  },
  warning: (at) => {
    tone(at, { type: "triangle", from: 740, length: 0.09, level: 0.08 })
    tone(at + 0.12, { type: "triangle", from: 740, length: 0.09, level: 0.08 })
  },
  error: (at) => {
    tone(at, { type: "square", from: 220, to: 160, length: 0.14, level: 0.07 })
    tone(at + 0.11, { type: "square", from: 174, to: 120, length: 0.2, level: 0.07 })
    hiss(at, { freq: 900, q: 1, length: 0.1, level: 0.04 })
  },
  deny: (at) => tone(at, { type: "square", from: 196, to: 150, length: 0.09, level: 0.06 }),
  agent: (at) => {
    tone(at, { from: 1976, length: 0.03, level: 0.05 })
    tone(at + 0.035, { from: 2637, length: 0.03, level: 0.05 })
    tone(at + 0.07, { from: 3136, length: 0.05, level: 0.045 })
  },
}

let lastAt = 0
let lastVoice: Voice | null = null

function sfx(voice: Voice) {
  if (!enabled) return
  unlock()
  if (!ctx || ctx.state !== "running") return
  // The same voice twice within 25ms is one sound: a listener and a handler
  // both answering one press.
  const now = performance.now()
  if (voice === lastVoice && now - lastAt < 25) return
  lastAt = now
  lastVoice = voice
  voices[voice](ctx.currentTime + 0.001)
}

const disabled = ':disabled, [aria-disabled="true"], [data-disabled]'
const typing =
  'textarea, [contenteditable="true"], input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], input[type="password"], input[type="number"]'
const pressable = 'button, [role="button"], a[href], [role="menuitem"], [role="option"], [role="tab"], [role="radio"], [role="checkbox"], [role="switch"]'

// What a click on something sounds like, from what it is. A component can
// say otherwise with `data-sfx="<voice>"`, or "none" to stay quiet and play
// its own.
function voiceFor(el: Element): Voice | null {
  const own = el.closest<HTMLElement>("[data-sfx]")?.dataset.sfx
  if (own) return own === "none" ? null : (own as Voice)
  const role = el.getAttribute("role")
  if (role === "switch" || role === "checkbox" || role === "menuitemcheckbox") {
    const on = el.getAttribute("aria-checked") === "true" || el.hasAttribute("data-checked")
    // Read before the click lands: on now means it's about to turn off.
    return on ? "off" : "on"
  }
  if (role === "option" || role === "tab" || role === "radio" || role === "menuitem" || role === "menuitemradio" || role === "gridcell" || role === "treeitem") return "select"
  if (el.matches('[data-tone="primary"]')) return "confirm"
  return "press"
}

function installSound() {
  for (const type of ["pointerdown", "keydown"]) document.addEventListener(type, unlock, { capture: true, passive: true })
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx && ctx.state !== "running") ctx.resume().catch(() => {})
  })

  document.addEventListener(
    "click",
    (event) => {
      if (!enabled) return
      const el = (event.target as Element | null)?.closest?.(`${pressable}, [data-sfx]`)
      if (!el || !el.closest('[data-skin="cyber"]')) return
      if (el.matches(disabled)) return sfx("deny")
      const voice = voiceFor(el)
      if (voice) sfx(voice)
    },
    true,
  )

  // Hover only chirps for a mouse, and only on things that react to it.
  let hovered: Element | null = null
  document.addEventListener(
    "pointerover",
    (event) => {
      if (!enabled || event.pointerType !== "mouse") return
      const el = (event.target as Element | null)?.closest?.(pressable) ?? null
      if (el === hovered) return
      hovered = el
      if (el && el.closest('[data-skin="cyber"]') && !el.matches(disabled) && el.closest<HTMLElement>("[data-sfx]")?.dataset.sfx !== "none") sfx("hover")
    },
    { capture: true, passive: true },
  )

  document.addEventListener(
    "keydown",
    (event) => {
      if (!enabled || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as Element | null
      if (!target?.closest?.(typing) || !target.closest('[data-skin="cyber"]')) return
      if (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter" || event.key === "Unidentified") sfx("type")
    },
    true,
  )

  // Popups: anything from the SDK gaining or losing data-open.
  new MutationObserver((records) => {
    if (!enabled) return
    for (const record of records) {
      const el = record.target as HTMLElement
      if (!el.matches?.("[data-slot]") || !el.closest('[data-skin="cyber"]')) continue
      // Only content parts: a trigger carries data-open too, and already
      // sounded when it was pressed.
      if (el.matches("button, [role='button'], [role='tab'], summary")) continue
      const open = el.hasAttribute("data-open")
      if (open === (record.oldValue !== null)) continue
      return sfx(open ? "open" : "close")
    }
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-open"], attributeOldValue: true })
}

export { installSound, onSoundChange, setSoundEnabled, sfx, soundEnabled }
export type { Voice }
