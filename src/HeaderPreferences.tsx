import { useId, useSyncExternalStore, type CSSProperties, type ReactNode } from "react"
import { fxLevel, fxLevels, onFxChange, setFxLevel } from "@/registry/cyber/lib/fx"
import { onSoundChange, setSoundEnabled, sfx, soundEnabled } from "@/registry/cyber/lib/sound"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import { Switch } from "@/registry/cyber/ui/switch"
import "./header-preferences.css"

const accents = [
  { id: "crimson", name: "Crimson", colors: ["red", "scarlet"], l: 0.656, c: 0.23, h: 24 },
  { id: "voltage", name: "Voltage", colors: ["yellow", "gold"], l: 0.86, c: 0.17, h: 95 },
  { id: "toxin", name: "Toxin", colors: ["green", "lime"], l: 0.84, c: 0.21, h: 150 },
  { id: "ice", name: "Ice", colors: ["blue", "cyan"], l: 0.82, c: 0.13, h: 215 },
  { id: "ultraviolet", name: "Ultraviolet", colors: ["purple", "violet"], l: 0.68, c: 0.22, h: 305 },
  { id: "monochrome", name: "Monochrome", colors: ["grayscale", "grey", "gray", "black and white"] },
] as const
type Accent = (typeof accents)[number]

function setInterfaceSounds(on: boolean) {
  if (soundEnabled() === on) return
  setSoundEnabled(on)
  if (on) sfx("on")
}

function HeaderPreferences({ chosen, choose, children }: {
  chosen: Accent
  choose: (accent: Accent) => void
  children?: ReactNode
}) {
  const group = useId()
  const effects = useSyncExternalStore(onFxChange, fxLevel)
  const sounds = useSyncExternalStore(onSoundChange, soundEnabled)
  return (
    <div className="header-preferences">
      <fieldset className="header-accent" role="radiogroup" aria-labelledby={group}>
        <legend>
          <span data-kit="label" id={group}>Theme</span>
          <span aria-hidden>{chosen.name}</span>
        </legend>
        <div className="header-swatches">
          {accents.map(accent => (
            <input key={accent.id} type="radio" name={group} value={accent.id}
              aria-label={accent.name} title={accent.name} checked={chosen.id === accent.id}
              onChange={() => choose(accent)} data-site-swatch=""
              style={{ "--swatch": accent.id === "monochrome" ? "var(--cy-monochrome-accent)" : `oklch(${accent.l} ${accent.c} ${accent.h})` } as CSSProperties} />
          ))}
        </div>
      </fieldset>
      <SegmentedControl label="Effects" options={fxLevels} fill value={effects} onValueChange={setFxLevel} />
      <Switch label="Interface sounds" checked={sounds} onCheckedChange={setInterfaceSounds} data-sfx="none" />
      {children}
    </div>
  )
}

export { accents, HeaderPreferences, setInterfaceSounds }
export type { Accent }
