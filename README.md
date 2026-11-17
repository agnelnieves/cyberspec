# CYBERSPEC

A component kit in the style of a machine from a darker future: a blue-black
void lit in hot red, cyan for anything that's a value or a signal, yellow for
the one thing to look at, corners cut rather than rounded, micro-print in the
margins, and interference that tears things in and out. Every control is
built on [ui-sdk](https://ui-sdk.dev) behaviors, with synthesized interface
sounds, haptics, and a visible signal when an agent changes something.

It's a sibling of [SPEC-01](https://github.com/shuding/spec-01), which themes
the same SDK as molded hardware, and it's laid out the same way: a site that
shows every component and the screens built from them, which is also a
[shadcn/ui registry](https://ui.shadcn.com/docs/registry).

## Install from the registry

Add the registry to `components.json` and install what you need. The ui-sdk
packages the components are built on, `@ui-sdk/core` and `@ui-sdk/react`,
install from npm along with them:

```sh
npx shadcn@latest registry add @cyberspec=https://cyberspec-mocha.vercel.app/r/{name}.json
npx shadcn@latest add @cyberspec/slider @cyberspec/panel
```

(`https://cyberspec-mocha.vercel.app` is the kit's site and the registry's
default address. A Vercel build uses its project's production domain on its
own; for another host, build with `REGISTRY_URL=https://your.domain bun run
registry:build`.)

Every item depends on `cyber`, which sets the project up for the kit: the
foundation stylesheets, a `<Cyber>` root, the fonts, and the page-wide
behaviors the components rely on. Wrap your app, or any part of it, in the
root:

```tsx
import { Cyber } from "@/components/ui/cyber"
import { Slider } from "@/components/ui/slider"

export function App() {
  return (
    <Cyber accent={{ l: 0.656, c: 0.23, h: 24 }}>
      <Slider label="Gain" defaultValue={40} />
    </Cyber>
  )
}
```

- **Accent:** `accent` is an OKLCH lightness, chroma and hue. Every role in
  the kit (text, edges, the 10 / 40 / 70% fills) is worked out from it.
  Without it the kit is red.
- **Effects:** `fx="full" | "calm" | "off"` pins how much moves. Left out, it
  follows the person's choice (`setFxLevel` in `lib/fx`), and
  `prefers-reduced-motion` before they've made one.
- **Styling:** plain CSS in cascade layers, scoped to `[data-skin="cyber"]`.
  No Tailwind needed; each component's parts carry `data-kit` hooks, and each
  component ships its own stylesheet.
- **Type:** Rajdhani and JetBrains Mono. Installing `cyber` adds their Google
  Fonts `@import` to the top of your CSS file.
- **Sound:** synthesized with Web Audio, off until someone turns it on
  (`setSoundEnabled(true)` in `lib/sound`).

## What makes it this kit

- **Frames.** One shape, a box with cut corners, drawn by `data-frame`
  (`"tr bl"`, `"notch br"`, `"spine br"`) and configured with `--frame-*`
  variables. Clipped corners would clip a focus outline, so a frame draws
  its focus ring inside itself.
- **A state language.** Idle, hover, on and press are the same four steps
  everywhere: the edge goes from 70% to 100% of the accent, the fill from
  nothing to 10, 40 and a flash of 70%.
- **Effects that know when to stop.** Glitches, scans and flicker are
  tokens (`--cy-fx-in`, `--cy-fx-rgb`, ...) that resolve to a keyframe at
  "full", a fade at "calm" and nothing at "off". Nothing flashes more than
  three times a second, and nothing depends on motion to be understood.
- **Red isn't "wrong".** It's the resting color, so errors are yellow, with
  a glyph and words. No state is shown by color alone.
- **Agents you can watch.** The components work with ui-sdk's agent bridge.
  When an agent changes one, it lights cyan for a moment, chirps, and is
  announced to screen readers. Anything marked `data-agent-confirm` makes
  the agent ask a person first. The Daemon screen is a console for trying
  all of it, with no API key.

[DESIGN.md](./DESIGN.md) is the full contract: color roles and contrast,
frames, type, motion, sound, accessibility, agents, and how to write a
component.

## Develop

```sh
bun install
bun run dev              # http://localhost:5720
bun run build            # builds the registry, then the site
bun run registry:build   # just the registry, into public/r, and public/llms.txt
bun run typecheck
node scripts/shot.mjs slider   # screenshot one component in headless Chrome
node scripts/sheet.mjs         # a contact sheet of every catalog group
node scripts/audit.mjs         # axe-core, motion, agent names and phone layout, every page
node scripts/thumbs.mjs        # the Examples page's thumbnails, into public/examples
```

The three scripts need the dev server running and a local Chrome. They write
to `shots/`, which is ignored.

### Pages

| Path | Page |
| --- | --- |
| `/` | Every component, one panel each. |
| `/examples` | The example screens below, one card each. The bar links here instead of to each screen. |
| `/loadout` | Gear slots, a weapon's sheet and what's in the pack. |
| `/augments` | Five attributes on a lattice, and points to spend on them. |
| `/jobs` | The job board: what's open, what's tracked, and the brief. |
| `/comms` | Contacts, a message thread, and how you answer. |
| `/archive` | The database: people, places and machines, one dossier each. |
| `/grid` | The district from above, with filters and a route. |
| `/daemon` | An agent on the page: what it sees, what it does, and how to stop it. |
| `/preview/<name>` | One component's example alone, for screenshots. |

### Layout

- `registry/cyber/`: the kit, and the registry's source. The site imports
  from here too, so they're the same code.
  - `ui/`: one component per file, plus `cyber.tsx`, the root.
  - `ui/cyber/`: stylesheets. `skin.css` is the foundation (`tokens.css`,
    `base.css`, `fx.css`, and the shared `field.css` and `popup.css`); every
    other file belongs to the component of the same name.
  - `lib/`: the FX level, sounds, haptics, text effects, input modality and
    the agent signal.
  - `examples/`: the usage example for each catalog panel.
  - `blocks/`: the screens, each in the shared `Screen` frame.
  - `meta.json`: titles and descriptions for the registry.
  - `blocks/daemon/` also holds the agent bridge (`bridge.ts`), the
    console's engine (`engine.ts`) and the permission prompt
    (`agent-prompt.tsx`), which the site mounts once.
- `src/`: the site: navigation, the masthead, the catalog (`catalog/`) and
  the Examples page (`Examples.tsx`, which lists the screens).
- `public/examples/`: the screens' thumbnails, written by `scripts/thumbs.mjs`.
- `registry.json`, `public/r/`, `public/llms.txt`: generated by
  `scripts/registry.mjs`.

## Credits and license

Built on [ui-sdk](https://ui-sdk.dev). The structure (thin wrappers, a
scoped skin, a registry that is also the site) and the iOS haptics technique
follow [SPEC-01](https://github.com/shuding/spec-01) by Shu Ding, MIT.

The fonts are [Rajdhani](https://fonts.google.com/specimen/Rajdhani) and
[JetBrains Mono](https://www.jetbrains.com/lp/mono/), both under the SIL
Open Font License 1.1. Icons are [Lucide](https://lucide.dev), ISC.

All names, places and text in the examples and screens are original fiction.
