import * as React from "react"
import { playCipherText } from "@/registry/cyber/lib/cipher"
import { ItemSlot, type ItemRarity } from "@/registry/cyber/ui/item-slot"

// Small silhouettes, drawn for this kit on a 48 unit square.
const art = {
  carbine: (
    <svg viewBox="0 0 48 48" focusable="false">
      <path d="M3 20l10-1v8l-5 2H3zM13 18h18v7H13zM29 19h10v5H29zM31 20.5h14v2H31zM19 25h6l-2 10h-6zM13 25h4l-2 7h-4zM16 15h10v2H16zM41 17h1.5v3.5H41z" />
    </svg>
  ),
  jacket: (
    <svg viewBox="0 0 48 48" focusable="false">
      <path fillRule="evenodd" d="M17 7l7 5 7-5 9 5 5 15-6 2-3-8v20H13V21l-3 8-6-2 5-15zM23.4 14v25h1.2V14zM16 30h5v1.6h-5zM27 30h5v1.6h-5z" />
    </svg>
  ),
  optics: (
    <svg viewBox="0 0 48 48" focusable="false">
      <path fillRule="evenodd" d="M5 17h38v9l-4 6H30l-3-4h-6l-3 4H9l-4-6zM9 21v4l2 3h5l3-4v-3zM29 21v3l3 4h5l2-3v-4zM1 19h3v5H1zM44 19h3v5h-3z" />
    </svg>
  ),
  chip: (
    <svg viewBox="0 0 48 48" focusable="false">
      <path
        fillRule="evenodd"
        d="M14 14h20v20H14zM18 18v12h12V18zM22 22h4v4h-4zM17 7h2v6h-2zM23 7h2v6h-2zM29 7h2v6h-2zM17 35h2v6h-2zM23 35h2v6h-2zM29 35h2v6h-2zM7 17h6v2H7zM7 23h6v2H7zM7 29h6v2H7zM35 17h6v2h-6zM35 23h6v2h-6zM35 29h6v2h-6z"
      />
    </svg>
  ),
}

const gear: { label: string; rarity: ItemRarity; art: React.ReactNode; mods?: boolean[]; count?: number; isNew?: boolean; equipped?: boolean }[] = [
  { label: "Kestrel KR-9 carbine", rarity: "rare", art: art.carbine, mods: [true, true, false], equipped: true },
  { label: "Wraith mesh jacket", rarity: "epic", art: art.jacket, mods: [true, false] },
  { label: "Onyx Lumen optics", rarity: "legend", art: art.optics, isNew: true },
  { label: "Meridian reflex booster", rarity: "common", art: art.chip, count: 20 },
]

export default function ItemSlotDemo() {
  const [selected, setSelected] = React.useState<string | null>(gear[0].label)
  const current = gear.find((item) => item.label === selected)
  const caption = React.useRef<HTMLSpanElement>(null)
  const lastSelection = React.useRef(selected)
  React.useLayoutEffect(() => {
    const changed = selected !== lastSelection.current
    lastSelection.current = selected
    if (selected && changed && caption.current) return playCipherText(caption.current)
  }, [selected])

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center", width: "100%" }}>
      <div role="group" aria-label="Loadout" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
        {gear.map(({ art: artwork, ...item }) => (
          <ItemSlot key={item.label} {...item} cipher selected={selected === item.label} onClick={() => setSelected(selected === item.label ? null : item.label)}>
            {artwork}
          </ItemSlot>
        ))}
        <ItemSlot label="Sidearm" />
      </div>
      <p aria-live="polite" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", gap: "2px 10px", minHeight: 20 }}>
        <span ref={caption} data-kit="label">{current ? current.label : "Nothing selected"}</span>
        {current && <span data-kit="value">{current.rarity.toUpperCase()}</span>}
      </p>
    </div>
  )
}
