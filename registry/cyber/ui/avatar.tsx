import * as React from "react"
import { Avatar as SdkAvatar, AvatarFallback, AvatarImage } from "@ui-sdk/react/avatar"
import "@/registry/cyber/ui/cyber/avatar.css"

type Size = "sm" | "md" | "lg"
type Shape = "cut" | "hex"
type Status = "online" | "busy" | "away" | "offline"

const statusWords: Record<Status, string> = { online: "Online", busy: "Busy", away: "Away", offline: "Offline" }

// A stack sets the size and shape of the portraits inside it.
const Stack = React.createContext<{ size?: Size; shape?: Shape }>({})

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words
  return letters.map((word) => [...word][0]?.toUpperCase() ?? "").join("")
}

// The field behind the initials: sixteen scanlines in the outline of a head
// and shoulders, with each line's reach, offset and strength taken from the
// name. The same name always draws the same ghost, on any machine.
function scanlines(name: string) {
  let hash = 2166136261
  for (const char of name) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619)
  // mulberry32: a small generator, seeded by the name's hash.
  const next = () => {
    hash = (hash + 0x6d2b79f5) | 0
    let t = Math.imul(hash ^ (hash >>> 15), 1 | hash)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  // Half-widths of a bust, top to bottom, on a 32-unit square.
  const bust = [0, 0, 4, 6, 7, 7, 7, 6, 5, 3, 3, 9, 13, 15, 16, 16]
  const lines: { y: number; x: number; width: number; opacity: number }[] = []
  bust.forEach((half, row) => {
    const reach = half === 0 ? 0 : Math.max(2, half + Math.round(next() * 4 - 2))
    const slip = Math.round(next() * 4 - 2)
    const dropped = next() < 0.12
    if (reach && !dropped) lines.push({ y: row * 2, x: 16 - reach + slip, width: reach * 2, opacity: 0.35 + next() * 0.65 })
    // Now and then a line of noise runs the full width, behind the figure.
    if (next() < 0.3) lines.push({ y: row * 2, x: Math.round(next() * 12), width: 8 + Math.round(next() * 20), opacity: 0.18 })
  })
  return lines
}

// A portrait in a cut or a hexagonal frame. While there's no picture, it
// shows the person's initials over a field of scanlines generated from their
// name, so two people never share a face; a picture, once loaded, is drawn in
// the theme's two tones like every other image on the display.
//
// - `name` is read to assistive technology and gives the initials. Set
//   `decorative` when the name is printed beside the portrait already.
// - `src`: a picture. Leave it out for the generated fallback.
// - `shape`: "cut" (two corners off) or "hex".
// - `status` lights a lamp on the corner, and each state is a different mark
//   as well as a different color. `statusLabel` replaces the word a screen
//   reader hears for it.
function Avatar({
  name,
  src,
  size,
  shape,
  status,
  statusLabel,
  decorative,
  ...props
}: Omit<React.ComponentProps<typeof SdkAvatar>, "children"> & {
  name: string
  src?: string
  size?: Size
  shape?: Shape
  status?: Status
  statusLabel?: string
  decorative?: boolean
}) {
  const stack = React.useContext(Stack)
  const lines = React.useMemo(() => scanlines(name), [name])
  return (
    <SdkAvatar data-kit="avatar" data-size={size ?? stack.size ?? "md"} data-shape={shape ?? stack.shape ?? "cut"} {...props}>
      <span data-kit="avatar-frame">
        <span data-kit="avatar-face">
          {src && <AvatarImage data-kit="avatar-image" src={src} alt={decorative ? "" : name} />}
          <AvatarFallback data-kit="avatar-fallback">
            <svg data-kit="avatar-field" viewBox="0 0 32 32" preserveAspectRatio="none" aria-hidden focusable="false">
              {lines.map((line, index) => (
                <rect key={index} x={line.x} y={line.y} width={line.width} height={1} opacity={line.opacity} />
              ))}
            </svg>
            <span data-kit="avatar-initials" aria-hidden>
              {initialsOf(name)}
            </span>
            {!decorative && <span data-sr-only>{name}</span>}
          </AvatarFallback>
        </span>
      </span>
      {status && <span data-kit="avatar-status" data-status={status} role="img" aria-label={statusLabel ?? statusWords[status]} />}
    </SdkAvatar>
  )
}

// Several portraits overlapping in a row, with the rest counted on a tile at
// the end.
//
// - `label` names the group ("Crew on this job").
// - `max`: how many to show before counting the rest.
// - `size` and `shape` apply to every portrait in it.
function AvatarStack({
  label,
  max = 4,
  size = "md",
  shape = "cut",
  children,
  ...props
}: React.ComponentProps<"div"> & { label: string; max?: number; size?: Size; shape?: Shape }) {
  const people = React.Children.toArray(children)
  const rest = people.length - max
  const stack = React.useMemo(() => ({ size, shape }), [size, shape])
  return (
    <div data-kit="avatar-stack" role="group" aria-label={label} {...props}>
      <Stack.Provider value={stack}>{rest > 0 ? people.slice(0, max) : people}</Stack.Provider>
      {rest > 0 && (
        <span data-kit="avatar" data-size={size} data-shape={shape} data-more="">
          <span data-kit="avatar-frame">
            <span data-kit="avatar-face">
              <span data-kit="avatar-initials" aria-hidden>
                +{rest}
              </span>
              <span data-sr-only>{rest} more</span>
            </span>
          </span>
        </span>
      )}
    </div>
  )
}

export { Avatar, AvatarStack }
export type { Shape as AvatarShape, Size as AvatarSize, Status as AvatarStatus }
