import type { ItemRarity } from "@/registry/cyber/ui/item-slot"

// What Sable Quinn owns, and where on a runner each piece can go. Every
// item, maker and number here is written for this kit.

type SlotKind = "weapon" | "head" | "chest" | "legs" | "outfit" | "deck" | "quick"
type PackGroup = "weapon" | "wear" | "tech"

type Slot = { id: string; name: string; kind: SlotKind }

type Item = {
  id: string
  name: string
  maker: string
  type: string
  kind: SlotKind
  rarity: ItemRarity
  /** The one large figure on its sheet. */
  output: { label: string; value: number; unit?: string; precision?: number }
  /** Two or three gauges, each out of 100. */
  stats: { label: string; value: number }[]
  /** Sockets: the name of what's fitted, or null for a free one. */
  mods: (string | null)[]
  /** Counts toward the Armor readout while fitted. */
  armor?: number
  /** Kilograms, for the whole stack. */
  weight: number
  price: number
  count?: number
  isNew?: boolean
  serial: string
  note: string
  /** A silhouette on a 48 unit square, filled with the even-odd rule. */
  art: string
}

const slots: Slot[] = [
  { id: "primary", name: "Primary weapon", kind: "weapon" },
  { id: "secondary", name: "Secondary weapon", kind: "weapon" },
  { id: "sidearm", name: "Sidearm", kind: "weapon" },
  { id: "headgear", name: "Headgear", kind: "head" },
  { id: "face", name: "Face", kind: "head" },
  { id: "inner", name: "Inner layer", kind: "chest" },
  { id: "outer", name: "Outer layer", kind: "chest" },
  { id: "legwear", name: "Legwear", kind: "legs" },
  { id: "footwear", name: "Footwear", kind: "legs" },
  { id: "outfit", name: "Outfit", kind: "outfit" },
  { id: "deck", name: "Deck", kind: "deck" },
  { id: "quick-1", name: "Quick slot 1", kind: "quick" },
  { id: "quick-2", name: "Quick slot 2", kind: "quick" },
]

const groupOf: Record<SlotKind, PackGroup> = {
  weapon: "weapon",
  head: "wear",
  chest: "wear",
  legs: "wear",
  outfit: "wear",
  deck: "tech",
  quick: "tech",
}

const items: Item[] = [
  {
    id: "kr9",
    name: "Kestrel KR-9 carbine",
    maker: "Kestrel Arms",
    type: "Carbine",
    kind: "weapon",
    rarity: "rare",
    output: { label: "Output", value: 412.8, unit: "dps", precision: 1 },
    stats: [
      { label: "Handling", value: 72 },
      { label: "Range", value: 64 },
      { label: "Quiet", value: 58 },
    ],
    mods: ["Lumen smart-link", "Baffle suppressor", null],
    weight: 3.6,
    price: 4200,
    serial: "KA-KR9 // LOT 22 // NODE 3F:A2",
    note: "A short carbine that forgives a bad stance. Smart-linked, it leads a moving target by itself.",
    art: "M2 20h8v9H5l-3-3zM10 19h20v8H10zM14 16h12v2H14zM30 21h14v3H30zM44 20h2v5h-2zM20 27h6l-1 10h-6zM12 27h5l-2 8h-4zM13 21.5h8v2h-8z",
  },
  {
    id: "hush",
    name: "Onyx Hush arc blade",
    maker: "Onyx Dynamics",
    type: "Arc blade",
    kind: "weapon",
    rarity: "epic",
    output: { label: "Output", value: 506, unit: "dps", precision: 1 },
    stats: [
      { label: "Handling", value: 88 },
      { label: "Range", value: 9 },
      { label: "Quiet", value: 96 },
    ],
    mods: ["Capacitor edge", null],
    weight: 1.8,
    price: 9800,
    serial: "OD-HSH // REV 4 // PROTOCOL 7741-C",
    note: "The edge only carries a charge on the swing. Nothing hums while it's sheathed, which is the point.",
    art: "M44 4l-1 6-23 22-4-4zM12 26l10 10-2 2-10-10zM13 33l2 2-8 8-2-2zM3 41l4 4-2 2-4-4z",
  },
  {
    id: "sparrow",
    name: "Kestrel Sparrow sidearm",
    maker: "Kestrel Arms",
    type: "Sidearm",
    kind: "weapon",
    rarity: "common",
    output: { label: "Output", value: 188.4, unit: "dps", precision: 1 },
    stats: [
      { label: "Handling", value: 81 },
      { label: "Range", value: 31 },
      { label: "Quiet", value: 40 },
    ],
    mods: [null],
    weight: 1.1,
    price: 950,
    serial: "KA-SPW // LOT 07",
    note: "Issued by the crate to dock security. Plain, light, and it has never once jammed.",
    art: "M6 16h34v8H6zM40 18h4v4h-4zM8 13h3v3H8zM36 13h3v3h-3zM9 24h11l-2 16H8zM21 24h8v6h-8v-1.5h6.5v-3H21zM10 18.5h20v1.5H10z",
  },
  {
    id: "lumen",
    name: "Onyx Lumen optics",
    maker: "Onyx Dynamics",
    type: "Optics",
    kind: "head",
    rarity: "legend",
    output: { label: "Threat range", value: 140, unit: "m" },
    stats: [
      { label: "Low light", value: 94 },
      { label: "Thermal", value: 86 },
      { label: "Battery", value: 61 },
    ],
    mods: ["Threat overlay", "Smart-link bridge"],
    armor: 12,
    weight: 0.3,
    price: 15000,
    serial: "OD-LMN // REV 3 // CS-07",
    note: "Thermal and low light on one lens, with an overlay that marks anything holding a weapon.",
    art: "M4 18h40v8l-5 7H28l-3-4h-2l-3 4H9l-5-7zM9 21v4l2 4h6l3-4v-4zM28 21v4l3 4h6l2-4v-4zM40 12h2v6h-2z",
  },
  {
    id: "halo",
    name: "Vanta Halo rebreather",
    maker: "Vanta Systems",
    type: "Mask",
    kind: "head",
    rarity: "rare",
    output: { label: "Filtration", value: 96, unit: "%" },
    stats: [
      { label: "Seal", value: 90 },
      { label: "Voice mask", value: 55 },
    ],
    mods: [null],
    armor: 18,
    weight: 0.7,
    price: 2600,
    isNew: true,
    serial: "VS-HLO // LOT 31 // NEW STOCK",
    note: "For the Stacks' lower levels, where the air has a color. It flattens a voice, too.",
    art: "M14 10h20l4 8v10l-6 10H16l-6-10V18zM15 16v5h18v-5zM20 27v1.5h8V27zM20 31v1.5h8V31zM4 26h5v10H4zM39 26h5v10h-5z",
  },
  {
    id: "wraith",
    name: "Wraith mesh jacket",
    maker: "Static Saints cut",
    type: "Jacket",
    kind: "chest",
    rarity: "epic",
    output: { label: "Armor", value: 148 },
    stats: [
      { label: "Mobility", value: 77 },
      { label: "Insulation", value: 52 },
      { label: "Low profile", value: 83 },
    ],
    mods: ["Ceramic weave", null],
    armor: 148,
    weight: 2.2,
    price: 7400,
    serial: "WR-MSH // REV 2 // NODE 1C:09",
    note: "The mesh stiffens where it's struck and nowhere else. Scanners read it as an ordinary coat.",
    art: "M16 6l8 6 8-6 10 5 4 16-6 2-3-8v21H11V21l-3 8-6-2 4-16zM23.3 13v29h1.4V13zM15 31v2h5v-2zM28 31v2h5v-2z",
  },
  {
    id: "union-vest",
    name: "Lowtide Union work vest",
    maker: "Lowtide Union",
    type: "Vest",
    kind: "chest",
    rarity: "common",
    output: { label: "Armor", value: 60 },
    stats: [
      { label: "Mobility", value: 90 },
      { label: "Insulation", value: 34 },
      { label: "Low profile", value: 95 },
    ],
    mods: [],
    armor: 60,
    weight: 1.4,
    price: 300,
    serial: "LU-VST // DOCK ISSUE",
    note: "Every loader on the Lowtide docks wears one, so nobody looks twice at it.",
    art: "M14 6h6l4 6 4-6h6v10l4 4v22H10V20l4-4zM14 26v6h8v-6zM26 26v6h8v-6zM23.3 14v8h1.4v-8z",
  },
  {
    id: "greaves",
    name: "Cinder Row runner greaves",
    maker: "Cinder Row forge",
    type: "Greaves",
    kind: "legs",
    rarity: "rare",
    output: { label: "Armor", value: 84 },
    stats: [
      { label: "Mobility", value: 69 },
      { label: "Grip", value: 88 },
    ],
    mods: ["Shock soles"],
    armor: 84,
    weight: 1.9,
    price: 3100,
    serial: "CR-GRV // LOT 14",
    note: "Plated to the knee and soled for wet rooftops. They take the drop so the ankles don't.",
    art: "M6 6h10v22l8 4v8H6zM26 6h10v22l8 4v8H26zM8 12v1.5h6V12zM28 12v1.5h6V12zM8 18v1.5h6V18zM28 18v1.5h6V18z",
  },
  {
    id: "harness",
    name: "Solace trauma harness",
    maker: "Solace Mutual",
    type: "Outfit",
    kind: "outfit",
    rarity: "rare",
    output: { label: "Armor", value: 40 },
    stats: [
      { label: "Mobility", value: 62 },
      { label: "Vitals uplink", value: 97 },
    ],
    mods: ["Medevac beacon", null],
    armor: 40,
    weight: 2.8,
    price: 5200,
    serial: "SM-TRH // POLICY 7741-C",
    note: "Reads the wearer's vitals and calls a medevac before they can ask for one. The premium is steep.",
    art: "M20 4h8v5l8 3 5 16-4 2-4-9v9l1 14h-7l-2-12h-2l-2 12h-7l1-14v-9l-4 9-4-2 5-16 8-3zM22.5 13v3h-3v3h3v3h3v-3h3v-3h-3v-3z",
  },
  {
    id: "mk2",
    name: "Vanta Mk.II deck",
    maker: "Vanta Systems",
    type: "Deck",
    kind: "deck",
    rarity: "epic",
    output: { label: "Memory", value: 12, unit: "RAM" },
    stats: [
      { label: "Buffer", value: 70 },
      { label: "Cooling", value: 48 },
      { label: "Trace cover", value: 81 },
    ],
    mods: ["Ghostwrite", "Null Ping", null],
    weight: 0.9,
    price: 11200,
    serial: "VS-MK2 // REV 0.1 // LINK STABLE",
    note: "Three daemon sockets and a buffer deep enough to hold a door open while the next one loads.",
    art: "M5 14h38v20l-4 4H5zM9 18v10h18V18zM30 18v3h4v-3zM36 18v3h4v-3zM30 23v3h4v-3zM36 23v3h4v-3zM9 31v2h10v-2zM38 8h2v6h-2z",
  },
  {
    id: "booster",
    name: "Meridian reflex booster",
    maker: "Meridian Biotech",
    type: "Injector",
    kind: "quick",
    rarity: "common",
    output: { label: "Duration", value: 12, unit: "s" },
    stats: [
      { label: "Potency", value: 66 },
      { label: "Onset", value: 92 },
    ],
    mods: [],
    weight: 0.6,
    price: 1800,
    count: 20,
    serial: "MB-RX // BATCH 0412",
    note: "Twelve seconds in which everyone else is slow. The headache afterwards is not covered.",
    art: "M8 20h24v8H8zM32 23h12v2H32zM2 22h6v4H2zM0 19h2v10H0zM12 22v4h12v-4zM30 17h2v14h-2z",
  },
  {
    id: "patch-kit",
    name: "Solace patch kit",
    maker: "Solace Mutual",
    type: "Field kit",
    kind: "quick",
    rarity: "common",
    output: { label: "Restores", value: 40, unit: "%" },
    stats: [
      { label: "Potency", value: 48 },
      { label: "Onset", value: 60 },
    ],
    mods: [],
    weight: 0.4,
    price: 720,
    count: 6,
    serial: "SM-PK // BATCH 0098",
    note: "Sealant, clotting foam and a stimulant, in the order they're needed.",
    art: "M8 14h32v24H8zM18 8h12v6h-2.5v-3.5h-7V14H18zM22 20v4h-4v4h4v4h4v-4h4v-4h-4v-4z",
  },
]

const itemById = Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, Item>
const slotById = Object.fromEntries(slots.map((slot) => [slot.id, slot])) as Record<string, Slot>

// What's on the runner as the screen opens. Everything else is in the pack.
const startFitted: Record<string, string | null> = {
  primary: "kr9",
  secondary: "hush",
  sidearm: null,
  headgear: "lumen",
  face: null,
  inner: null,
  outer: "wraith",
  legwear: "greaves",
  footwear: null,
  outfit: null,
  deck: "mk2",
  "quick-1": "booster",
  "quick-2": null,
}

// Money the way the Sprawl writes it: "¤ 15 240".
function credits(amount: number) {
  return `¤ ${Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`
}

const kilos = (weight: number) => `${weight.toFixed(1)} kg`

export { credits, groupOf, itemById, items, kilos, slotById, slots, startFitted }
export type { Item, PackGroup, Slot, SlotKind }
