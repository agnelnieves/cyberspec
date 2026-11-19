import "./recipe-layout.css"
import { useState } from "react"
import { Ruler } from "@/registry/cyber/ui/micro"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import { Slider } from "@/registry/cyber/ui/slider"
import { TextField } from "@/registry/cyber/ui/text-field"

export default function TypeSpecimen() {
  const [text, setText] = useState("Night Shift")
  const [face, setFace] = useState("Display")
  const [size, setSize] = useState(44)

  return (
    <div className="sink-stack">
      <div style={{ minHeight: 76, display: "grid", alignContent: "center", minWidth: 0 }}>
        <span style={{ color: "var(--cy-ink-hi)", fontFamily: face === "Display" ? "var(--cy-font)" : "var(--cy-mono)", fontWeight: 600, fontSize: size, lineHeight: 1.1, overflowWrap: "anywhere" }}>{text || "Aa"}</span>
        <Ruler />
      </div>
      <TextField label="Sample text" maxLength={32} value={text} onValueChange={setText} />
      <SegmentedControl label="Typeface" options={["Display", "Mono"]} value={face} onValueChange={(next) => next && setFace(next)} fill />
      <Slider label="Type size" value={size} min={20} max={64} step={2} ticks={11} format={(value) => `${value}px`} onValueChange={setSize} />
    </div>
  )
}
