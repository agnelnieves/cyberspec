import "./recipe-layout.css"
import { useState } from "react"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { ChoiceList } from "@/registry/cyber/ui/choice-list"
import { Readout } from "@/registry/cyber/ui/readout"
import { Stepper } from "@/registry/cyber/ui/stepper"

const papers = [
  { value: "matte", label: "Matte stock · $12 / print" },
  { value: "foil", label: "Silver foil · $18 / print" },
]

export default function CheckoutDesk() {
  const [paper, setPaper] = useState("matte")
  const [quantity, setQuantity] = useState<number | null>(2)
  const [ordered, setOrdered] = useState(false)
  const total = (quantity ?? 0) * (paper === "foil" ? 18 : 12)
  const validQuantity = quantity !== null && Number.isInteger(quantity) && quantity >= 1 && quantity <= 9

  return (
    <div className="sink-stack">
      <div className="sink-between"><strong>Night Shift print</strong><Badge tone="mute">A3 edition</Badge></div>
      <ChoiceList label="Paper" options={papers} value={paper} onValueChange={(next) => {
        if (!next) return
        setPaper(next)
        setOrdered(false)
      }} />
      <Stepper label="Print quantity" min={1} max={9} value={quantity} onValueChange={(next) => {
        setQuantity(next)
        setOrdered(false)
      }} />
      <div className="sink-between">
        <Readout label="Order total" value={total} prefix="$" size="sm" />
        <Button size="sm" disabled={ordered || !validQuantity} onClick={() => setOrdered(true)}>Place demo order</Button>
      </div>
      {ordered && <p role="status" className="sink-note">Order recorded for {quantity} {paper === "foil" ? "silver foil" : "matte"} {quantity === 1 ? "print" : "prints"} at ${total}.</p>}
    </div>
  )
}
