import { useState } from "react"
import { Dice5 } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import { Readout } from "@/registry/cyber/ui/readout"
import "./recipe-layout.css"

const dice = ["D4", "D6", "D12", "D20"]
type Roll = { faces: string; values: number[] }

export default function DiceTray() {
  const [faces, setFaces] = useState("D6")
  const [rolls, setRolls] = useState<Roll[]>([])
  const latest = rolls[0]
  function roll() {
    const sides = Number(faces.slice(1))
    const values = Array.from({length: 3}, () => 1 + Math.floor(Math.random() * sides))
    setRolls([{faces, values}, ...rolls].slice(0, 4))
  }
  return (
    <div className="sink-stack">
      <div className="sink-between">
        <Readout label="Last total" value={latest?.values.reduce((a, b) => a + b, 0) ?? 0} size="lg" />
        <Dice5 size={52} color="var(--cy-ink)" aria-hidden />
      </div>
      <SegmentedControl label="Die type" fill value={faces} onValueChange={value => { if (value) setFaces(value) }} options={dice} />
      <Button tone="signal" onClick={roll}>Roll 3{faces.toLowerCase()}</Button>
      <div role="status" className="sink-note">{latest ? `3${latest.faces.toLowerCase()} rolled ${latest.values.join(" + ")}` : "Roll three dice to start a score sheet."}</div>
      {rolls.length > 1 && <p className="sink-note">Previous totals · {rolls.slice(1).map(r => r.values.reduce((a, b) => a + b, 0)).join(" / ")}</p>}
    </div>
  )
}
