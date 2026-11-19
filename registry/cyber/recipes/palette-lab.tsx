import "./recipe-layout.css"
import { useState } from "react"
import { CodeBlock } from "@/registry/cyber/ui/code-block"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"

const inks = { Flare: "#FF594A", Ion: "#5EF6FF", Iris: "#BB9CFF" }
const tints = [100, 80, 60, 40, 20]
type Ink = keyof typeof inks

export default function PaletteLab() {
  const [ink, setInk] = useState<Ink>("Flare")
  const color = inks[ink]

  return (
    <div className="sink-stack">
      <div role="img" aria-label={`${ink} ink mixed with the panel color, from full strength to twenty percent`} style={{ display: "flex", minHeight: 84 }}>
        {tints.map((tint) => (
          <span key={tint} style={{ flex: tint === 100 ? 2 : 1, backgroundColor: `color-mix(in srgb, ${color} ${tint}%, var(--cy-panel))` }} />
        ))}
      </div>
      <SegmentedControl<Ink> label="Spot ink" options={["Flare", "Ion", "Iris"]} value={ink} onValueChange={(next) => next && setInk(next)} fill />
      <CodeBlock filename="ink.css" language="css" numbers={false} code={`:root { --spot-ink: ${color}; }`} />
    </div>
  )
}
