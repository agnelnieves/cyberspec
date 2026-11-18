import * as React from "react"
import { ArrowUp } from "lucide-react"
import { Figure } from "@/registry/cyber/blocks/loadout/figure"
import {
  credits,
  groupOf,
  itemById,
  items,
  kilos,
  slotById,
  slots,
  startFitted,
  type Item,
  type PackGroup,
  type Slot,
} from "@/registry/cyber/blocks/loadout/gear"
import { AlertDialog } from "@/registry/cyber/ui/alert-dialog"
import { Badge, type BadgeTone } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Dialog } from "@/registry/cyber/ui/dialog"
import { ItemSlot, type ItemRarity } from "@/registry/cyber/ui/item-slot"
import { Meter } from "@/registry/cyber/ui/meter"
import { Barcode, Corners, Micro } from "@/registry/cyber/ui/micro"
import { Panel } from "@/registry/cyber/ui/panel"
import { Readout } from "@/registry/cyber/ui/readout"
import { Screen } from "@/registry/cyber/ui/screen"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import { Tabs } from "@/registry/cyber/ui/tabs"
import { notify } from "@/registry/cyber/ui/toaster"
import "@/registry/cyber/blocks/loadout/loadout.css"

// What a runner is carrying. The Fitted view is the body: weapons down one
// side, a wireframe of the runner, and gear slots by region. The Pack view
// is everything stowed, with a filter. Whatever is selected in either fills
// the sheet beside them, and the sheet's keys fit it, stow it, open it in a
// viewer or sell it.
//
// Only fitted gear counts against carry weight, so fitting and stowing move
// the readout in the status strip; a sale moves the credits.

const carryLimit = 16
const heavyAt = 14.5

type View = "fitted" | "pack"
type Filter = "all" | PackGroup
// An item, wherever it is, or a slot with nothing in it.
type Selection = { item: string } | { slot: string } | null

const rarityBadge: Record<ItemRarity, { tone: BadgeTone; word: string }> = {
  common: { tone: "mute", word: "Common" },
  rare: { tone: "rare", word: "Rare" },
  epic: { tone: "epic", word: "Epic" },
  legend: { tone: "flag", word: "Legendary" },
}

const regions: { title: string; slots: string[] }[] = [
  { title: "Head", slots: ["headgear", "face"] },
  { title: "Chest", slots: ["inner", "outer"] },
  { title: "Legs", slots: ["legwear", "footwear"] },
  { title: "Outfit", slots: ["outfit"] },
  { title: "Deck", slots: ["deck"] },
  { title: "Quick access", slots: ["quick-1", "quick-2"] },
]

const weaponSlots = slots.filter((slot) => slot.kind === "weapon")

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "weapon", label: "Weapons" },
  { value: "wear", label: "Wear" },
  { value: "tech", label: "Tech" },
]

const figureOf = (item: Item) => `${item.output.value.toFixed(item.output.precision ?? 0)}${item.output.unit ? ` ${item.output.unit}` : ""}`

function Art({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 48 48" focusable="false">
      <path fillRule="evenodd" d={d} />
    </svg>
  )
}

// The item on its plate: the same silhouette as the slot's, large, on
// registration marks, with its serial as a code strip down the side.
function Viewer({ item }: { item: Item }) {
  const marks = React.useId()
  return (
    <div data-loadout-viewer="" data-rarity={item.rarity} aria-hidden>
      <div data-loadout-viewer-plate="">
        {/* A field of small crosses, one every 40px. */}
        <svg data-loadout-viewer-marks="" focusable="false">
          <defs>
            <pattern id={marks} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M16.5 20h7M20 16.5v7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${marks})`} />
        </svg>
        <Corners variant="cross" size={9} inset={12} />
        <Micro data-loadout-viewer-head="">
          {item.maker} // {item.type}
        </Micro>
        <svg data-loadout-viewer-art="" viewBox="0 0 48 48" focusable="false">
          <path fillRule="evenodd" d={item.art} vectorEffect="non-scaling-stroke" />
        </svg>
        <Micro data-loadout-viewer-foot="">Registered to S. Quinn // fit or disable by holder only</Micro>
      </div>
      <div data-loadout-viewer-strip="">
        <Micro vertical>{item.serial}</Micro>
        <Barcode value={item.serial} vertical size={16} />
      </div>
    </div>
  )
}

export default function Loadout() {
  const [fitted, setFitted] = React.useState(startFitted)
  const [owned, setOwned] = React.useState(() => items.map((item) => item.id))
  const [balance, setBalance] = React.useState(15240)
  const [selection, setSelection] = React.useState<Selection>({ item: "kr9" })
  // The empty slot last chosen: the next thing fitted lands there if it can.
  const [target, setTarget] = React.useState<string | null>(null)
  const [view, setView] = React.useState<View>("fitted")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [seen, setSeen] = React.useState<readonly string[]>([])
  // The sale being confirmed. It outlives the sale itself, so the question
  // doesn't change under the dialog while it closes.
  const [selling, setSelling] = React.useState<Item | null>(null)
  const [confirming, setConfirming] = React.useState(false)

  const root = React.useRef<HTMLDivElement>(null)
  const sheetRef = React.useRef<HTMLElement>(null)
  const back = React.useRef<HTMLButtonElement>(null)
  const lastSlot = React.useRef<HTMLElement | null>(null)
  const rackId = React.useId()
  const primary = React.useRef<HTMLButtonElement>(null)
  const rescue = React.useRef(false)

  const slotOf = (id: string) => slots.find((slot) => fitted[slot.id] === id) ?? null
  const pack = owned.filter((id) => !slotOf(id)).map((id) => itemById[id])
  const worn = slots.flatMap((slot) => (fitted[slot.id] ? [itemById[fitted[slot.id]!]] : []))
  const load = Math.round(worn.reduce((sum, item) => sum + item.weight, 0) * 10) / 10
  const armor = worn.reduce((sum, item) => sum + (item.armor ?? 0), 0)

  const item = selection && "item" in selection ? itemById[selection.item] : null
  const emptySlot = selection && "slot" in selection ? slotById[selection.slot] : null
  const home = item ? slotOf(item.id) : null
  const region = item?.kind ?? emptySlot?.kind ?? null
  const isNew = (candidate: Item) => Boolean(candidate.isNew) && !seen.includes(candidate.id)

  // A tile that's about to leave the page (a pack item being fitted) may be
  // the focused one. Note that focus was here, and hand it to the sheet's
  // first key if it ends up nowhere.
  const holdFocus = () => {
    rescue.current = Boolean(root.current?.contains(document.activeElement))
  }
  React.useEffect(() => {
    if (!rescue.current) return
    rescue.current = false
    if (!document.activeElement || document.activeElement === document.body) primary.current?.focus()
  })

  const focusInventory = (button: HTMLElement | null) => {
    const destination = button?.getClientRects().length ? button : root.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
    destination?.focus({ preventScroll: true })
    destination?.scrollIntoView({ block: "center" })
  }

  const select = (next: Selection, button: HTMLElement) => {
    lastSlot.current = button
    setSelection(next)
    if (next && "slot" in next) setTarget(next.slot)
    if (next && "item" in next && itemById[next.item].isNew) setSeen((ids) => (ids.includes(next.item) ? ids : [...ids, next.item]))
    // When the sheet sits below the inventory, bring its new heading into
    // view. A wide rack keeps focus on the tile for continued browsing.
    if (back.current?.getClientRects().length) {
      requestAnimationFrame(() => {
        sheetRef.current?.focus({ preventScroll: true })
        back.current?.scrollIntoView({ block: "start" })
      })
    }
  }

  // Where an item would go: the empty slot that was asked for, else the
  // first free slot of its kind, else the first slot of its kind, whose
  // item is sent back to the pack.
  const landing = (candidate: Item): Slot => {
    const fits = slots.filter((slot) => slot.kind === candidate.kind)
    const asked = target ? slotById[target] : null
    if (asked && asked.kind === candidate.kind && !fitted[asked.id]) return asked
    return fits.find((slot) => !fitted[slot.id]) ?? fits[0]
  }

  const equip = (candidate: Item) => {
    const slot = landing(candidate)
    const displaced = fitted[slot.id] ? itemById[fitted[slot.id]!] : null
    const next = Math.round((load + candidate.weight - (displaced?.weight ?? 0)) * 10) / 10
    if (next > carryLimit) {
      notify("Over the carry limit", {
        tone: "warning",
        description: `${candidate.name} would bring the load to ${kilos(next)} of ${carryLimit}. Stow something first.`,
      })
      return
    }
    holdFocus()
    setFitted({ ...fitted, [slot.id]: candidate.id })
    setTarget(null)
    notify(`${candidate.name} fitted`, {
      tone: "success",
      description: displaced ? `${slot.name}. ${displaced.name} went back to the pack.` : `${slot.name}. Load ${kilos(next)}.`,
    })
  }

  const unequip = (candidate: Item, from: Slot) => {
    holdFocus()
    setFitted({ ...fitted, [from.id]: null })
    notify(`${candidate.name} stowed`, { description: `${from.name} is open. Load ${kilos(Math.round((load - candidate.weight) * 10) / 10)}.` })
  }

  const toggle = () => {
    if (!item) return
    if (home) unequip(item, home)
    else equip(item)
  }

  const choosePack = (group: Filter) => {
    const available = pack.filter((candidate) => group === "all" || groupOf[candidate.kind] === group)
    const next = available.find((candidate) => candidate.id === item?.id)
      ?? available.find((candidate) => candidate.kind === emptySlot?.kind)
      ?? available[0]
    setFilter(group)
    setSelection(next ? { item: next.id } : null)
  }

  const changeView = (next: View) => {
    setView(next)
    if (next === "pack") choosePack(filter)
    else if (!home && !emptySlot) setSelection(worn.length ? { item: worn[0].id } : { slot: slots[0].id })
  }

  const browse = (group: Filter) => {
    setView("pack")
    choosePack(group)
    requestAnimationFrame(() => focusInventory(null))
  }

  const sell = (sold: Item) => {
    const rest = pack.filter((other) => other.id !== sold.id)
    setOwned(owned.filter((id) => id !== sold.id))
    setBalance(balance + sold.price)
    // The next thing in the pack takes the sheet, so its keys stay where
    // focus returns to.
    const next = rest.find((other) => filter === "all" || groupOf[other.kind] === filter)
    setSelection(next ? { item: next.id } : null)
    notify(`${sold.name} sold`, { tone: "success", description: `Ren Aoki paid ${credits(sold.price)}. Balance ${credits(balance + sold.price)}.` })
    if (!next)
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) primary.current?.focus()
      }, 320)
  }

  // E fits or stows the selection, as the foot of the screen says. Not while
  // typing, not as part of a shortcut, and not from inside a dialog.
  const toggleRef = React.useRef(toggle)
  React.useEffect(() => {
    toggleRef.current = toggle
  })
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key.toLowerCase() !== "e" || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      const from = event.target as Element | null
      if (from !== document.body && !root.current?.contains(from)) return
      if (from?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"], dialog, [role="dialog"], [role="alertdialog"]'))
        return
      toggleRef.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // One slot on the body: the item fitted there, or the open slot.
  const slotTile = (slot: Slot, size: "md" | "lg" = "md") => {
    const held = fitted[slot.id] ? itemById[fitted[slot.id]!] : null
    return (
      <ItemSlot
        id={`${rackId}-${slot.id}`}
        label={held ? held.name : slot.name}
        rarity={held?.rarity}
        mods={held?.mods.length ? held.mods.map((mod) => mod !== null) : undefined}
        count={held?.count}
        equipped={Boolean(held)}
        selected={held ? item?.id === held.id : emptySlot?.id === slot.id}
        size={size}
        onClick={(event) => select(held ? { item: held.id } : { slot: slot.id }, event.currentTarget)}
      >
        {held && <Art d={held.art} />}
      </ItemSlot>
    )
  }

  const deck = fitted.deck ? itemById[fitted.deck] : null

  const fittedView = (
    <div data-loadout-fitted="">
      <section data-loadout-weapons="" aria-labelledby="loadout-weapons">
        <h2 id="loadout-weapons" data-loadout-heading="">
          Weapons
        </h2>
        <ul>
          {weaponSlots.map((slot) => {
            const held = fitted[slot.id] ? itemById[fitted[slot.id]!] : null
            return (
              <li key={slot.id}>
                {slotTile(slot, "lg")}
                <label data-loadout-caption="" htmlFor={`${rackId}-${slot.id}`}>
                  <span data-kit="label">{held ? held.name : slot.name}</span>
                  <span data-kit="hint">{held ? `${slot.name} // ${held.type}` : "Open slot"}</span>
                  {held && (
                    <span data-kit="value" data-loadout-figure-of="">
                      {figureOf(held)}
                    </span>
                  )}
                </label>
              </li>
            )
          })}
        </ul>
        <Micro>CS-L0 // Rack 03 // Link stable</Micro>
      </section>

      <Figure region={region} />

      <div data-loadout-vitals="">
        <Readout label="Armor" value={armor} size="sm" />
        <Meter label="Load" value={load} max={carryLimit} high={heavyAt} highLabel="Heavy" segments={16} />
      </div>

      <div data-loadout-gear="">
        {regions.map((group) => {
          const id = `loadout-${group.slots[0]}`
          return (
            <section key={group.title} aria-labelledby={id}>
              <h2 id={id} data-loadout-heading="">
                {group.title}
              </h2>
              <div data-loadout-slots="">
                {group.slots.map((slotId) => (
                  <div key={slotId}>
                    {slotTile(slotById[slotId])}
                    {group.slots.length > 1 && <label htmlFor={`${rackId}-${slotId}`}>{slotById[slotId].name}</label>}
                  </div>
                ))}
              </div>
              {group.title === "Deck" && (
                <span data-kit="hint">
                  {deck ? `${deck.mods.filter(Boolean).length} of ${deck.mods.length} daemons loaded` : "No deck jacked in"}
                </span>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )

  const shown = pack.filter((candidate) => filter === "all" || groupOf[candidate.kind] === filter)
  const packWeight = pack.reduce((sum, candidate) => sum + candidate.weight, 0)

  const packView = (
    <div data-loadout-pack="">
      <div data-loadout-pack-head="">
        <SegmentedControl<Filter> label="Pack filter" value={filter} onValueChange={(next) => next && choosePack(next)} options={filters} />
        <p data-kit="value" role="status">
          {shown.length} of {pack.length} shown // {kilos(packWeight)} stowed
        </p>
      </div>
      <p data-kit="hint">Stowed gear rides in the drop pack. Only what's fitted counts against carry weight.</p>
      {shown.length ? (
        <ul data-loadout-pack-grid="">
          {shown.map((candidate) => (
            <li key={candidate.id}>
              <ItemSlot
                id={`${rackId}-pack-${candidate.id}`}
                label={candidate.name}
                rarity={candidate.rarity}
                mods={candidate.mods.length ? candidate.mods.map((mod) => mod !== null) : undefined}
                count={candidate.count}
                isNew={isNew(candidate)}
                selected={item?.id === candidate.id}
                onClick={(event) => select({ item: candidate.id }, event.currentTarget)}
              >
                <Art d={candidate.art} />
              </ItemSlot>
              <label data-loadout-caption="" htmlFor={`${rackId}-pack-${candidate.id}`}>
                <span data-kit="label">{candidate.name}</span>
                <span data-kit="hint">
                  {candidate.type} // {kilos(candidate.weight)}
                </span>
                <span data-kit="value">{credits(candidate.price)}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p data-loadout-none="">{pack.length ? "Nothing stowed in this category." : "The pack is empty."}</p>
      )}
    </div>
  )

  // What the selected item is measured against: the item of its kind that's
  // fitted now, when both report the same figure.
  const rival = item && !home ? worn.find((other) => other.kind === item.kind && other.output.label === item.output.label) : null
  const candidates = emptySlot ? pack.filter((candidate) => candidate.kind === emptySlot.kind) : []
  const sheetKey = item ? item.id : emptySlot ? `slot:${emptySlot.id}` : "none"

  const sheet = (
    <Panel
      ref={sheetRef}
      tabIndex={-1}
      data-loadout-sheet=""
      level={2}
      title={item ? item.name : emptySlot ? emptySlot.name : "No selection"}
      code={item ? item.serial : "CS-L0 // SLOT OPEN // NO SIGNAL"}
      actions={item ? <Badge tone={rarityBadge[item.rarity].tone}>{rarityBadge[item.rarity].word}</Badge> : emptySlot ? <Badge tone="mute">Open</Badge> : undefined}
      footer={
        <>
          <Button
            ref={primary}
            tone="primary"
            onClick={() => (item ? toggle() : browse(emptySlot ? groupOf[emptySlot.kind] : "all"))}
          >
            {item ? (home ? "Unequip" : "Equip") : "Browse pack"}
          </Button>
          {item && (
            <Dialog trigger="Inspect" title={item.name} description={`${item.type}, ${item.maker}. ${item.note}`} confirm="Close viewer" cancel={null} code={item.serial}>
              <Viewer item={item} />
            </Dialog>
          )}
          {item && (
            <Button
              disabled={Boolean(home)}
              onClick={() => {
                setSelling(item)
                setConfirming(true)
              }}
            >
              Sell
            </Button>
          )}
        </>
      }
    >
      {/* Keyed by what's selected, so the sheet tears in each time it changes.
          The keys below stay put, and keep focus. */}
      <div key={sheetKey} data-loadout-sheet-body="">
        {item ? (
          <>
            <p data-loadout-line="">
              <span data-kit="hint">
                {item.type} // {item.maker}
              </span>
              {home ? (
                <Badge tone="signal" status>
                  Fitted: {home.name}
                </Badge>
              ) : (
                <Badge tone="mute" status>
                  Stowed
                </Badge>
              )}
              {isNew(item) && <Badge tone="flag">New</Badge>}
            </p>
            <div data-loadout-output="">
              <Readout
                size="lg"
                label={item.output.label}
                value={item.output.value}
                unit={item.output.unit}
                precision={item.output.precision}
                delta={rival ? item.output.value - rival.output.value : undefined}
              />
              <span data-loadout-swatch="" data-rarity={item.rarity} aria-hidden>
                <Art d={item.art} />
              </span>
            </div>
            {rival && <p data-kit="hint">Against the {rival.name}, fitted now.</p>}
            <div data-loadout-meters="">
              {item.stats.map((stat) => (
                <Meter key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
            <div data-loadout-mods="">
              <h3 data-kit="label">
                Mods{" "}
                {item.mods.length > 0 && (
                  <span data-kit="value">
                    {item.mods.filter(Boolean).length}/{item.mods.length}
                  </span>
                )}
              </h3>
              {item.mods.length ? (
                // Sockets are numbered, so the list is ordered.
                <ol>
                  {item.mods.map((mod, index) => (
                    <li key={index} data-fitted={mod ? "" : undefined}>
                      <span data-loadout-socket="" aria-hidden />
                      {mod ?? "Empty socket"}
                    </li>
                  ))}
                </ol>
              ) : (
                <p data-kit="hint">No sockets on this one.</p>
              )}
            </div>
            <p data-loadout-note="">{item.note}</p>
            <dl data-loadout-facts="">
              <div>
                <dt>Weight</dt>
                <dd>{kilos(item.weight)}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{credits(item.price)}</dd>
              </div>
              {item.count != null && (
                <div>
                  <dt>Stack</dt>
                  <dd>{item.count}</dd>
                </div>
              )}
            </dl>
          </>
        ) : emptySlot ? (
          <>
            <p data-loadout-note="">Nothing is fitted here.</p>
            {candidates.length ? (
              <>
                <p data-kit="hint">
                  {candidates.length} stowed {candidates.length === 1 ? "item fits" : "items fit"} this slot:
                </p>
                <ul data-loadout-fits="">
                  {candidates.map((candidate) => (
                    <li key={candidate.id}>
                      {candidate.name} <span data-kit="value">{figureOf(candidate)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p data-kit="hint">Nothing in the pack fits this slot.</p>
            )}
          </>
        ) : (
          <p data-loadout-note="">Choose a slot or a stowed item to read its sheet.</p>
        )}
      </div>
    </Panel>
  )

  return (
    <Screen
      data-loadout-screen=""
      label="Loadout"
      code="CS-L0 // LOADOUT // SABLE QUINN // PROTOCOL 7741-C"
      status={
        <>
          <Readout label="Level" value={34} size="sm" />
          <Readout label="Rep" value={27} size="sm" tone="ok" />
        </>
      }
      aside={
        <>
          <Readout label="Carry weight" value={load} precision={1} unit={`/ ${carryLimit} kg`} size="sm" tone={load >= heavyAt ? "flag" : "signal"} />
          <Readout label="Credits" prefix="¤" value={balance} size="sm" tone="flag" />
        </>
      }
      hints={[
        { keys: "⇥", label: "Next slot" },
        { keys: "↵", label: "Select" },
        { keys: "E", label: "Fit or stow", onPress: toggle, disabled: !item },
      ]}
    >
      <div data-kit="loadout" ref={root}>
        <Tabs
          label="Loadout views"
          value={view}
          onValueChange={(next) => next && changeView(next as View)}
          tabs={[
            { value: "fitted", label: "Fitted", content: fittedView },
            { value: "pack", label: "Pack", flag: pack.some(isNew) ? "New" : undefined, content: packView },
          ]}
        />
        <div data-loadout-detail="">
          <Button ref={back} data-loadout-back="" tone="ghost" onClick={() => focusInventory(lastSlot.current)}>
            <ArrowUp aria-hidden /> Back to {view === "fitted" ? "fitted gear" : "pack"}
          </Button>
          {sheet}
        </div>
      </div>
      <AlertDialog
        open={confirming}
        onOpenChange={(open) => setConfirming(open)}
        title={selling ? `Sell the ${selling.name}?` : "Sell this item?"}
        description={selling ? `Ren Aoki pays ${credits(selling.price)} for it. A sold item doesn't come back.` : undefined}
        confirm={selling ? `Sell for ${credits(selling.price)}` : "Sell"}
        cancel="Keep it"
        agentConfirm={
          selling ? `Sells the ${selling.name} to the broker for ${credits(selling.price)} and removes it from the pack. This can't be undone.` : undefined
        }
        code="BROKER LINK // R.AOKI // ANSWER REQUIRED"
        onConfirm={() => {
          if (selling) sell(selling)
        }}
      />
    </Screen>
  )
}
