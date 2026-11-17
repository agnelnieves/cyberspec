import * as React from "react"
import { fxMoves, onFxChange } from "@/registry/cyber/lib/fx"
import "@/registry/cyber/ui/cyber/holo-card.css"

const clamp = (value: number) => Math.min(1, Math.max(-1, value))

// A projected surface: whatever it wraps turns to face the pointer, in 3D,
// and a sheen follows the pointer across it. It adds no frame of its own,
// so put a Card or a Panel inside.
//
// - `stack`: how many ghost layers (up to three) stand behind the card, a
//   step up and along from it, like the sheets of a projection.
// - `tilt`: the most the surface turns, in degrees.
// - Depth: anything inside with `data-depth="2"` (-1 to 3), or wrapped in
//   <HoloLayer depth>, slides toward the pointer in proportion, so it reads
//   as floating above the surface; a negative depth sinks behind it.
//
// It's decoration over real content. The surface is flat and still for
// touch, and whenever the FX level says nothing should move; nothing here
// clips, so focus rings inside show whole, and the sheen and the ghosts
// never take the pointer or a screen reader's attention.
function HoloCard({
  stack = 0,
  tilt = 8,
  style,
  children,
  onPointerMove,
  onPointerLeave,
  onPointerCancel,
  ...props
}: React.ComponentProps<"div"> & {
  stack?: 0 | 1 | 2 | 3
  tilt?: number
}) {
  const surface = React.useRef<HTMLDivElement>(null)
  const live = React.useRef<HTMLDivElement | null>(null)
  const pointer = React.useRef({ x: 0, y: 0 })
  const frame = React.useRef(0)

  // Back to flat. The stylesheet eases it there.
  const rest = React.useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
    const root = live.current
    if (!root) return
    live.current = null
    root.removeAttribute("data-live")
    root.style.removeProperty("--holo-x")
    root.style.removeProperty("--holo-y")
  }, [])

  // Effects switched off while the pointer is over it: lie flat now, not
  // when the pointer next moves.
  React.useEffect(() => {
    const unsubscribe = onFxChange((level) => {
      if (level === "off") rest()
    })
    return () => {
      unsubscribe()
      cancelAnimationFrame(frame.current)
    }
  }, [rest])

  function track(event: React.PointerEvent<HTMLDivElement>) {
    onPointerMove?.(event)
    if (event.pointerType === "touch" || !fxMoves()) return rest()
    live.current = event.currentTarget
    pointer.current = { x: event.clientX, y: event.clientY }
    // One write a frame, however often the pointer reports.
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const root = live.current
      const card = surface.current
      if (!root || !card || !card.offsetWidth || !card.offsetHeight) return
      // Measured from layout, not from the turned surface, so the tilt
      // can't feed back into the reading.
      const box = root.getBoundingClientRect()
      const x = clamp(((pointer.current.x - box.left - card.offsetLeft) / card.offsetWidth) * 2 - 1)
      const y = clamp(((pointer.current.y - box.top - card.offsetTop) / card.offsetHeight) * 2 - 1)
      // Where the pointer is on the surface: -1 at the left or the top, 1
      // at the right or the bottom. The stylesheet does the rest.
      root.style.setProperty("--holo-x", x.toFixed(3))
      root.style.setProperty("--holo-y", y.toFixed(3))
      root.setAttribute("data-live", "")
    })
  }

  const layers = Math.min(3, Math.max(0, Math.round(stack)))
  return (
    <div
      data-kit="holo-card"
      data-stack={layers || undefined}
      style={{ "--holo-tilt": `${tilt}deg`, "--holo-stack": layers, ...style } as React.CSSProperties}
      onPointerMove={track}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        rest()
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        rest()
      }}
      {...props}
    >
      <div ref={surface} data-kit="holo-card-tilt">
        {layers > 0 && (
          <span data-kit="holo-card-ghosts" aria-hidden>
            {/* Farthest first, so nearer ones paint over it. */}
            {Array.from({ length: layers }, (_, index) => (
              <span key={index} data-kit="holo-card-ghost" data-frame="br" style={{ "--holo-n": layers - index } as React.CSSProperties} />
            ))}
          </span>
        )}
        <div data-kit="holo-card-content">{children}</div>
        <span data-kit="holo-card-sheen" aria-hidden />
      </div>
    </div>
  )
}

// A part of the card that floats above its surface (or, with a negative
// depth, sits behind it). It's a block: a transform has nothing to move on
// an inline box, so give an inline element of your own `display:
// inline-block` if you tag it with data-depth instead.
function HoloLayer({ depth = 1, style, ...props }: React.ComponentProps<"div"> & { depth?: number }) {
  return <div data-kit="holo-layer" style={{ "--holo-depth": depth, ...style } as React.CSSProperties} {...props} />
}

export { HoloCard, HoloLayer }
