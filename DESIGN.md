# CYBERSPEC design contract

How the kit looks, moves, sounds and behaves, and the rules every component
follows. Read this before writing or changing anything under `registry/cyber`.

Cyberspec is a theme for [ui-sdk](https://ui-sdk.dev), in the way
[SPEC-01](https://github.com/shuding/spec-01) is: every control is a ui-sdk
component underneath, wrapped thinly, tagged with `data-kit` hooks, and
styled by plain CSS scoped to a root. SPEC-01 is molded hardware. Cyberspec
is the display of a machine from a darker future: a blue-black void lit in
hot red, cyan for anything that's a value or a signal, yellow for the one
thing to look at, corners cut rather than rounded, micro-print in the
margins, and interference that tears things in and out.

## 1. Layout of the repo

```
registry/cyber/
  ui/cyber.tsx              <Cyber> root: sets data-skin="cyber", installs behaviors
  ui/cyber/skin.css         foundation: tokens.css, base.css, fx.css, field.css, popup.css
  ui/cyber/<name>.css       one stylesheet per component, imported by the component
  ui/<name>.tsx             one component per file
  lib/                      fx.ts, sound.ts, haptics.ts, glitch.ts, agent-signal.ts, input-modality.ts, install.ts
  examples/<name>-demo.tsx  the usage example the catalog shows
  blocks/<name>/<name>.tsx  full screens built from components (+ <name>.css beside it)
src/                        the site: Site.tsx, site.css, catalog/, agent/
```

Finished references to copy the pattern from: `ui/button.tsx`,
`ui/switch.tsx`, `ui/dialog.tsx`, `ui/glitch-text.tsx`, with their
stylesheets and examples.

ui-sdk's docs for the installed version are in
`node_modules/@ui-sdk/react/docs/` (one page per component under
`components/`, with its parts, props, state and **Data Attributes**). Read
the page for every SDK component you wrap: slot names and state attributes
are not guessable. `node_modules/@ui-sdk/core/skills/ui-sdk/references/` has
`styles.md`, `patterns.md` and `agent-ready.md`.

## 2. Color

Everything is a token from `tokens.css`. Never write a color literal in a
component; mix tokens with `color-mix()` if you need a step in between.

| Token | Role |
| --- | --- |
| `--cy-void`, `--cy-panel`, `--cy-panel-2`, `--cy-panel-a` | Page, panel, raised panel, translucent panel |
| `--cy-accent` | The theme color (red by default; the site can switch it). Hot lines, lit fills |
| `--cy-ink` | Text in the accent, 6:1 on the panel |
| `--cy-ink-mute` | Secondary text, 5:1 |
| `--cy-ink-hi` | Near-white: long-form text, and text on a lit fill |
| `--cy-line-deco` | 30% accent: frames, rules, decoration. Not for control edges |
| `--cy-line-ctl` | 70% accent: a control's idle edge (3:1) |
| `--cy-line-hot` | 100% accent: hovered, open, chosen |
| `--cy-fill-hover` / `-active` / `-flash` | 10% / 40% / 70% accent over the panel |
| `--cy-signal`, `--cy-signal-dim`, `--cy-signal-fill` | Cyan: values, readouts, focus, selection marks, anything an agent touched |
| `--cy-flag`, `--cy-flag-fill` | Yellow: new, tracked, the chosen answer, warnings and **invalid** |
| `--cy-ok` | Green: success, online |
| `--cy-rare`, `--cy-epic` | Blue and violet: rarity tiers, categories |
| `--cy-on-solid` | Dark ink for text on a solid accent, signal or flag fill |

The state language, the same on every control:

| State | Edge | Fill | Text |
| --- | --- | --- | --- |
| Idle | `--cy-line-ctl` | none / panel | `--cy-ink` |
| Hover | `--cy-line-hot` | `--cy-fill-hover` | `--cy-ink` |
| On (checked, selected, current, open, pressed) | `--cy-line-hot` | `--cy-fill-active` | `--cy-ink-hi` |
| Press | | flashes `--cy-fill-flash` (`data-press-flash`) | |
| Highlighted row (keyboard or pointer in a list) | | `--cy-fill-active` + a 3px `--cy-signal` bar on the leading edge | `--cy-ink-hi` |
| Disabled | `--cy-line-deco` | diagonal hatching | `--cy-ink-mute` |
| Invalid | `--cy-flag` | | message in `--cy-flag` with a mark |

Rules that follow from the palette:

- **Red is the resting color, so it can't mean "wrong".** Errors and invalid
  fields are yellow, with a glyph and words. Never signal anything by color
  alone: on/off prints ON/OFF, selected rows get a mark, disabled is hatched.
- `--cy-ink` on a 40% fill is only 3:1. On a lit fill, text is `--cy-ink-hi`.
- Text on a solid fill (`--cy-flag`, `--cy-signal`, 100% accent) is
  `--cy-on-solid`.
- Values, numerals and readouts are `--cy-signal`. Labels are `--cy-ink`.

## 3. Shape: frames

The one shape is a box with cut corners. Put `data-frame` on an element and
`base.css` draws it: `data-frame="tr bl"` cuts those corners (`tl tr br bl`,
any combination; bare `data-frame` cuts bottom-right), `notch` raises a tab
on the top-left, `spine` thickens the leading edge.

Configure it only through variables on the same element:

```css
[data-skin="cyber"] [data-kit="thing"] {
  --frame-cut: var(--cy-cut-sm);     /* 6px; --cy-cut is 10px, --cy-cut-lg 18px */
  --frame-line: var(--cy-line-ctl);
  --frame-fill: var(--cy-panel);
  --frame-image: none;               /* your own background-image, under the edges */
  --frame-focus: var(--cy-signal);   /* set to --cy-on-solid on a solid fill */
}
```

A frame owns `border-color`, `clip-path` and `background-image`. **Don't set
those on a framed element**; change `--frame-*` instead (state changes are
just new values for them). Because the corners are clipped:

- An `outline` or outer `box-shadow` on a frame is clipped away. Focus is
  drawn inside automatically. For an outer glow, put `data-glow` on an
  unclipped parent.
- A frame whose focus belongs to a child (a box around an `<input>`) takes
  `data-frame-focus="within"`.
- Don't animate `clip-path` or `background-position` on a frame.
- Small things that aren't frames (a switch's thumb, a badge) may use their
  own `clip-path: polygon(...)` for a cut corner.
- Nothing is rounded. No `border-radius` anywhere, circles included: a
  "round" thing is a hexagon, a diamond or a square.

Shared looks, already written, to use rather than reinvent:

- **Fields** (`field.css`): `data-kit="field"`, `"label"`, `"control"`,
  `"control-icon"`, `"hint"`, `"field-error"`.
- **Floating lists** (`popup.css`): `data-kit="popup"`, `"popup-item"`,
  `"popup-indicator"`, `"popup-label"`, `"popup-separator"`,
  `"popup-shortcut"`, `"popup-empty"`.
- **Keys**: any element with `data-kit="button" data-frame="notch br"
  data-press-flash=""` and a `data-tone` looks like a `Button` (import
  `button.css`). Use it for SDK triggers and close parts.
- **Type roles** (`base.css`): `data-kit="label"`, `"value"`, `"hint"`,
  `"link"`, and `data-micro` for micro-print.

## 4. Type

- `--cy-font` (Rajdhani) for everything read; weights 500 body, 600 labels,
  700 display. `--cy-mono` (JetBrains Mono) for code, ticking numerals and
  micro-print.
- Labels, titles and keys are UPPERCASE with `letter-spacing: var(--cy-track)`.
  Sentences people read (descriptions, messages, body) are sentence case, in
  `--cy-ink-hi` or `--cy-ink-mute`. Don't uppercase paragraphs.
- Sizes are the `--cy-text-*` tokens. Nothing a person needs is smaller than
  `--cy-text-xs` (11px).
- **Micro-print** is the 8px serial numbers and protocol lines around frames
  (`<span data-micro aria-hidden>CS-07 // LINK STABLE</span>`). It's
  decoration: always `aria-hidden`, never the only place a fact lives. Use
  it on larger surfaces (panels, cards, dialogs, screens), one or two lines,
  not on every control.
- Numbers use tabular figures (already on the root).

## 5. Motion and effects

Things here switch rather than travel. Motion is short, with a hard stop,
and decorative interference is layered on top where it helps: something
arriving, something an agent changed, a heading decoding.

- Durations: `--cy-t-fast` 80ms (hover, color), `--cy-t` 160ms (a thumb, an
  indicator), `--cy-t-slow` 320ms (a panel). Easing: `--cy-ease-snap`, or
  `--cy-ease-step` for a stepped, digital move. No bounce, no overshoot.
- Animate only `transform` (`translate`, `scale`, `rotate`), `opacity`,
  `filter` and colors. Never layout properties; for height use the SDK's own
  measured variables (Collapsible and Accordion expose them) or a
  `grid-template-rows: 0fr → 1fr` transition.
- **Effects are tokens, not keyframe names.** Write
  `animation: var(--cy-fx-in) 240ms var(--cy-ease-snap) backwards;` and the FX
  level decides: a glitch at `full`, a fade at `calm`, nothing at `off`.

  | Token | At "full" | Use |
  | --- | --- | --- |
  | `--cy-fx-in` / `--cy-fx-out` | tears in / out | A popup, panel or toast arriving and leaving |
  | `--cy-fx-flash` | fill jumps to 70% and bleeds back | A press (prefer the `data-press-flash` attribute) |
  | `--cy-fx-rgb` | channels slip apart | Text or a control being changed, briefly |
  | `--cy-fx-flicker` | a slow, unsteady lamp | One small indicator, never a block of text |
  | `--cy-fx-scan` | a band passing down | A pseudo-element over an image or a screen |
  | `--cy-fx-sweep` | a highlight crossing | Loading; on a pseudo-element with a 300%-wide background, never on a frame |
  | `--cy-fx-blink` | a caret | Cursors |
  | `--cy-fx-pulse` | a slow breath | Live, busy, listening |
  | `--cy-fx` | `1` or `0` | Multiply an opacity or blur by it to switch a static flourish off |

- **Popups** (anything from the SDK that opens): enter with
  `&[data-open] { animation: var(--cy-fx-in) 200ms var(--cy-ease-snap) backwards; }`
  and leave with
  `&[data-ending-style] { animation: var(--cy-fx-out) 120ms var(--cy-ease-snap) both; }`.
  The SDK keeps the element mounted until the exit animation ends. An
  entrance fills `backwards`, never `both`: a transform that keeps filling
  after it ends still counts toward the page's scrollable width.
- Script-driven effects (`lib/glitch.ts`: `scramble`, `burst`) check the FX
  level themselves. Anything else you animate from script must check
  `fxFull()` / `fxMoves()` from `lib/fx.ts` first.
- Interruptible: transitions, not keyframes, for anything a person can
  reverse mid-way (a toggle, a slider, a drawer being dragged).
- **Flashing** (WCAG 2.3.1): nothing flashes more than three times a second;
  a glitch is a one-shot under 300ms; never flash a large bright fill; no
  infinite animation on anything bigger than an indicator except a loader's
  bar. Idle screens are still.
- `prefers-reduced-motion` and the site's FX switch are handled centrally
  (`data-fx` on the root, the `cyber.a11y` layer). Don't write your own
  media queries for them; do make sure the component is fully usable and
  informative with every animation removed. Mark an animation that carries
  meaning (a spinner) `data-motion="essential"` and keep it small and slow.

## 6. Sound and haptics

`lib/sound.ts` mixes recordings and synthesized sounds through Web Audio;
it's off until the person turns it on. The compact PCM recordings live in
`lib/sound-samples.ts`, which travels with the installable registry. Page-wide
listeners already cover hover, presses, options, tabs, switches, typing and
popups opening, from roles and `data-slot`s. A component only needs code for
what those can't know:

```ts
import { createAdjustmentSound, sfx } from "@/registry/cyber/lib/sound"
import { haptic, crosses } from "@/registry/cyber/lib/haptics"

sfx("increment")         // a successful plus/up step
sfx("decrement")         // a successful minus/down step
sfx("tick")              // the shared recorded tick
sfx("success")           // outcomes: "success" | "warning" | "error" | "deny"
sfx("glitch")            // explicit interference cue; currently the shared tick
haptic("selection")      // "selection" | "light" | "medium" | "heavy" | "success" | "warning" | "error"
```

Set `data-sfx="none"` on an element to silence its automatic click sound when
you play your own, or `data-sfx="confirm"` (any voice) to choose it. Click
suppression does not suppress the shared hover tick. Use explicit action
metadata for directional controls; never infer direction from an icon or label.
Use `data-sfx-hover="none"` to opt out of hover itself.
Lightweight interactions, including typing, selection and small popup
transitions, share the recorded tick. Primary actions share the button-press
recording; success, warning, error and deny retain their original voices.
Play directional sounds only after a change succeeds, including repeats and
keyboard changes. Disabled controls, canceled changes and bounds must not
produce a successful-step sound.

For continuous adjustments, retain one `createAdjustmentSound()` instance per
component. Call `move()` after each actual accepted movement and `stop()` on
release, cancellation, loss of focus and unmount. The engine also stops on
inactivity and mute. Sliders use this ticking recording, not directional
samples. Discrete slider and resize keyboard changes use one complete
recorded tick (`sfx("hover")`) because their commit can be synchronous.
See [the sound guide](./docs/SOUNDS.md) for mappings and untouched voices.

## 7. Accessibility

Not optional, and not a later pass. Every component:

- **Keyboard**: everything works without a pointer. The SDK provides roving
  focus, typeahead and Escape; don't break them by adding handlers that
  swallow keys, and don't put interactive things inside other interactive
  things.
- **Names**: every control has an accessible name. Icon-only buttons take
  `aria-label`. Components that need a label take a required `label` prop.
  Decorative icons, glyphs and micro-print are `aria-hidden`.
- **Focus** is visible on everything focusable (the kit draws it: a 2px
  cyan ring, inside the frame on framed elements). A composite whose
  highlighted child stands in for focus (a listbox) styles
  `[data-highlighted]` unmistakably and may set `data-focus-quiet` on the
  container.
- **Contrast**: text 4.5:1 (large text 3:1), control edges and state
  indicators 3:1. The tokens are built for this; section 2 has the traps.
- **Not by color alone**: pair every state with a shape, a glyph or a word.
- **Targets**: at least 24×24 CSS px, and 44px on touch (`--cy-h` grows on
  coarse pointers; use it for control heights).
- **Hover** styles go inside `@media (hover: hover)`.
- **Direction**: logical properties (`inline-start`, `padding-inline`), and
  flip any `translate` under `:dir(rtl)`.
- **Text that animates** keeps a stable copy for assistive technology (see
  `GlitchText`: a `data-sr-only` span beside an `aria-hidden` one).
- **Live changes**: a status that changes on its own uses `role="status"`
  or the SDK's own announcements; don't announce decoration.
- **Zoom and reflow**: components fit a 256px-wide column and reflow at 200%
  zoom; no fixed widths that overflow.
- **Forced colors** is handled for frames centrally; don't rely on
  backgrounds alone to show state (borders and text survive, fills don't).

## 8. Agents

ui-sdk components can be read and driven by an agent through the agent
bridge (`@ui-sdk/react/agent`; the docs are `docs/agents.md`). The kit makes
that visible and safe:

- **The agent signal** (`lib/agent-signal.ts`): when a change's source is
  `"agent"`, the control it touched lights cyan with `data-agent-touch`, a
  tick plays, and it's announced. This is automatic.
- An agent finds controls by their accessible names, so name things the way
  a person would say them ("Stealth routing", not "Switch 2"), and keep
  names unique within a screen.
- Anything destructive or irreversible carries
  `data-agent-confirm="<a sentence saying what it does>"`, so an agent has
  to ask a person first.
- `data-agent-hidden` keeps a region from agents; `data-agent-secret`
  redacts a value.
- Prefer SDK components over hand-rolled ones for anything stateful, so the
  bridge can see and operate it. A custom primitive (`definePrimitive`)
  joins the bridge too.

## 9. Writing a component

**`registry/cyber/ui/<name>.tsx`**

```tsx
import * as React from "react"
import { Thing as SdkThing, ThingPart } from "@ui-sdk/react/thing"
import "@/registry/cyber/ui/cyber/thing.css"

// One or two sentences: what it is in this world, and what's notable about
// how it behaves.
function Thing({ label, ...props }: React.ComponentProps<typeof SdkThing> & { label: string }) {
  return (
    <SdkThing data-kit="thing" data-frame="br" {...props}>
      <ThingPart data-kit="thing-part" />
    </SdkThing>
  )
}

export { Thing }
```

- Imports use the `@/registry/cyber/...` alias (the registry rewrites it).
  Import a stylesheet for every look you borrow (`button.css` for a
  `data-kit="button"` trigger). `field.css` and `popup.css` come with the
  skin, so they need no import.
- Small, typed, props-driven APIs, like SPEC-01's: `label`, `options`,
  `defaultValue`, `onValueChange`. Pass the rest through to the SDK root so
  controlled use, forms and `controller`s still work. Named exports, no
  default export, no `React.FC`.
- The root part carries `data-kit="<name>"`; other parts
  `data-kit="<name>-<part>"`. Style by `data-kit` and the SDK's **state
  attributes** (`data-checked`, `data-open`, `data-highlighted`,
  `data-disabled`, `data-invalid`, …), never by generated ids or classes.
- Icons: `lucide-react`, `aria-hidden`, 14 to 16px. The skin already squares
  their stroke ends.
- No Tailwind, no CSS-in-JS, no inline styles except CSS variables that
  carry data (`style={{ "--value": 0.4 }}`).
- TypeScript strict. No `any`. Comments say why, in plain sentences.

**`registry/cyber/ui/cyber/<name>.css`**

```css
@layer ui-sdk, cyber.tokens, cyber.base, cyber.ui, cyber.blocks, cyber.fx, cyber.a11y;

@layer cyber.ui {
  [data-skin="cyber"] [data-kit="thing"] {
    /* … */
  }
}
```

- That first line, verbatim, in every stylesheet. Everything else inside
  `@layer cyber.ui` (screens: `@layer cyber.blocks`).
- Every selector starts with `[data-skin="cyber"]`. Native CSS nesting is
  fine.
- Tokens only. No `!important`. No `z-index` wars: SDK popups are in the
  browser's top layer already.
- Only style your own `data-kit` names. If two components need the same
  look, it belongs in a shared stylesheet, not in a selector reaching into
  another component.

**`registry/cyber/examples/<name>-demo.tsx`**

```tsx
import { Thing } from "@/registry/cyber/ui/thing"

export default function ThingDemo() {
  return (
    <>
      <Thing label="Optic overlay" />
    </>
  )
}
```

- Default export named `<Name>Demo`. It renders into the catalog's stage: a
  centered, wrapping flex row, 12px gap, about 256px wide (about 620px for
  panels marked `wide` in `src/catalog/panels.ts`). It must look right at
  both, and at a 320px-wide phone.
- Show the component doing its real job with believable content, including
  one non-default state (disabled, invalid, a second tone) where it has one.

## 10. The world

Content in examples and screens is original fiction, written for this kit.
**Never use names, logos, quotes, characters, places, items or quest titles
from any existing game, film, book or franchise.** A shared vocabulary keeps
the screens feeling like one place:

- **Place**: the Halcyon Sprawl. Districts: Lowtide, Glasswater, Cinder
  Row, the Stacks, Meridian Heights.
- **Corporations**: Onyx Dynamics (weapons, optics), Meridian Biotech
  (augments), Vanta Systems (networks), Kestrel Arms (firearms), Solace
  Mutual (insurance, medevac).
- **People**: Mara Voss (fixer), Ilya Brandt (tech), Juno Okafor (medic),
  Dex Marlowe (driver), Sable Quinn (runner), Ren Aoki (broker).
- **Crews**: the Static Saints, the Neon Jackals, Lowtide Union.
- **Money**: credits, written `¤ 15 240`.
- **Programs** ("daemons"): Ghostwrite, Static Bloom, Deadlock, Mirrorfall,
  Null Ping.
- **Gear**: Kestrel KR-9 carbine, Onyx "Lumen" optics, Wraith mesh jacket,
  Meridian reflex booster, Vanta Mk.II deck.
- **Attributes** (a runner's five stats): Frame, Reflex, Circuit, Cortex,
  Nerve.
- **Voice**: terse, technical, a little dry. "Link stable." "No signal."
  "Route cleared." No profanity, no gore, no real brands.

Micro-print uses made-up codes: `CS-07 // LINK STABLE`, `PROTOCOL 7741-C`,
`NODE 3F:A2`, `REV 0.1`.

## 11. Checking your work

- **Look at it.** `node scripts/shot.mjs <name>` screenshots
  `/preview/<name>` (your example alone in a catalog panel) in headless
  Chrome from the dev server that's already running, writes
  `shots/<name>.png`, and prints the page's console errors. Read the image.
  Then look again the ways it will really be used:

  ```sh
  node scripts/shot.mjs slider                         # as the catalog shows it
  node scripts/shot.mjs slider --narrow                # 256px stage
  node scripts/shot.mjs slider --mobile                # 360px touch viewport
  node scripts/shot.mjs slider --fx off                # nothing moving
  node scripts/shot.mjs menu --do "click:text=Options" --do wait:300 --out shots/menu-open.png
  node scripts/shot.mjs tabs --do "focus:[role=tab]" --do key:ArrowRight --out shots/tabs-focus.png
  ```

  `--do` steps run in order: `click:`, `hover:`, `focus:` (a CSS selector or
  `text=<visible text>`), `key:<Key>`, `type:<text>`, `wait:<ms>`,
  `shot:<file>`. `--eval "<js>"` prints an expression from the page. Check
  the keyboard path (Tab to it, arrows, Enter, Escape), the focus ring, the
  open state of anything that opens, and the narrow width, and fix what you
  see. Screens: `node scripts/shot.mjs /loadout --width 1280 --height 800 --full`.
- `bun run typecheck` must pass for your files. Other people may be editing
  other files at the same time: if it reports errors in files that aren't
  yours, leave them.
- Read your stylesheet against section 2's state table and section 7's list
  before you finish.
- The dev server is already running; don't start, stop or restart one, and
  don't install or upgrade packages. Don't use git. In this shell a bare
  `ls` can hang: use `/bin/ls`, or the file search tools.
