import * as React from "react"
import { Resizable as SdkResizable, ResizableHandle, ResizablePanel, type ResizableSize } from "@ui-sdk/react/resizable"
import { crosses, haptic } from "@/registry/cyber/lib/haptics"
import { createAdjustmentSound, sfx } from "@/registry/cyber/lib/sound"
import "@/registry/cyber/ui/cyber/resizable.css"

type ResizablePane = {
  /** What the pane holds, in a word or two. Printed over it, and it names the handle after it ("Resize routes"). */
  label: string
  content: React.ReactNode
  /** Sizes are percentages as numbers, or strings with a unit, like "160px". */
  defaultSize?: ResizableSize
  minSize?: ResizableSize
  maxSize?: ResizableSize
  /** Lets the pane fold away: drag past its minimum, or press Enter on its handle. */
  collapsible?: boolean
  /** Identifies the pane in a saved layout and to a controller. */
  id?: string
}

// Panes split by handles, in one cut frame. A handle is a rule with grip
// ticks on it; it lights on hover, on focus and while it's dragged, and
// prints the size of the pane before it for as long as it's lit. Arrow keys
// step it, Shift with an arrow steps further, Home and End send it to its
// limits.
//
// - `panes`: two or three, in order. Each has a `label`, printed over it.
// - `orientation`: "horizontal" sets panes side by side, "vertical" stacks
//   them. Give a vertical group a height.
// - Everything else goes to the SDK's Resizable: `layout`, `defaultLayout`,
//   `onLayoutChange`, `onLayoutCommit`, `step`, `largeStep`, `autoSaveId`,
//   `disabled`, `controller`.
//
// Ticking follows active movement. A phone also taps each time a handle
// crosses a twentieth of the group.
function Resizable({
  panes,
  onLayoutChange,
  onLayoutCommit,
  ...props
}: Omit<React.ComponentProps<typeof SdkResizable>, "children"> & {
  panes: ResizablePane[]
}) {
  const last = React.useRef<number[]>(props.layout ?? props.defaultLayout ?? [])
  const adjustment = React.useMemo(createAdjustmentSound, [])
  React.useEffect(() => adjustment.stop, [adjustment])
  React.useEffect(() => {
    if (props.disabled) adjustment.stop()
  }, [adjustment, props.disabled])
  React.useEffect(() => {
    if (props.layout) last.current = props.layout
  }, [props.layout])

  return (
    <SdkResizable
      data-kit="resizable"
      data-frame="br"
      {...props}
      onLayoutChange={(layout, details) => {
        onLayoutChange?.(layout, details)
        if (details.canceled) return adjustment.stop()
        // The SDK only reports actual layout changes. Resizing the window
        // and controller updates are not movement of a person's handle.
        const byHand = details.reason === "drag" || details.reason === "step-key" || details.reason === "collapse"
        if (details.reason === "drag") adjustment.move()
        else {
          adjustment.stop()
          // A key or collapse can commit immediately. Let one recorded
          // tick finish instead of starting a loop that release would cut.
          if (byHand) sfx("hover")
        }
        if (byHand && layout.some((size, index) => last.current[index] != null && crosses(last.current[index], size, 5))) {
          haptic("selection")
        }
        last.current = layout
      }}
      onLayoutCommit={(layout, details) => {
        adjustment.stop()
        onLayoutCommit?.(layout, details)
      }}
      onBlur={(event) => {
        adjustment.stop()
        props.onBlur?.(event)
      }}
      onPointerCancel={(event) => {
        adjustment.stop()
        props.onPointerCancel?.(event)
      }}
      onLostPointerCapture={(event) => {
        adjustment.stop()
        props.onLostPointerCapture?.(event)
      }}
    >
      {panes.map((pane, index) => (
        <React.Fragment key={pane.id ?? pane.label}>
          {index > 0 && (
            <ResizableHandle data-kit="resizable-handle" aria-label={`Resize ${panes[index - 1].label.toLowerCase()}`}>
              <span data-kit="resizable-grip" aria-hidden />
            </ResizableHandle>
          )}
          <ResizablePanel
            data-kit="resizable-pane"
            id={pane.id}
            defaultSize={pane.defaultSize}
            minSize={pane.minSize}
            maxSize={pane.maxSize}
            collapsible={pane.collapsible}
          >
            <span data-kit="resizable-label">
              <span aria-hidden>{String(index + 1).padStart(2, "0")}</span>
              {pane.label}
            </span>
            <div data-kit="resizable-content">{pane.content}</div>
          </ResizablePanel>
        </React.Fragment>
      ))}
    </SdkResizable>
  )
}

export { Resizable }
export type { ResizablePane }
