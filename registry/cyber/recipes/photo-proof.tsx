import "./recipe-layout.css"
import { useState } from "react"
import { Corners } from "@/registry/cyber/ui/micro"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import { Switch } from "@/registry/cyber/ui/switch"

const stocks = {
  Dusk: ["#ffcca0", "#ea7d89", "#575077", "#24233d"],
  Chrome: ["#ccfffd", "#87c8cc", "#596d9c", "#1a3248"],
  Mono: ["#f2eee4", "#b6b2a8", "#666766", "#282c2c"],
}
type Stock = keyof typeof stocks

export default function PhotoProof() {
  const [stock, setStock] = useState<Stock>("Dusk")
  const [grid, setGrid] = useState(false)
  const [sun, sky, ridge, shadow] = stocks[stock]

  return (
    <div className="sink-stack">
      <div role="img" aria-label={`Two mountain ridges at sunset, printed on ${stock} stock${grid ? " with a thirds grid" : ""}`} style={{ position: "relative", overflow: "hidden", height: 140, background: `radial-gradient(circle at 68% 36%, ${sun} 0 14px, transparent 15px), linear-gradient(180deg, ${ridge}, ${sky} 78%, ${sun})` }}>
        <div style={{ position: "absolute", inset: 0, background: ridge, clipPath: "polygon(0 81%, 15% 60%, 24% 67%, 41% 33%, 55% 57%, 67% 46%, 81% 65%, 100% 41%, 100% 100%, 0 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: shadow, clipPath: "polygon(0 69%, 11% 77%, 19% 73%, 33% 91%, 53% 66%, 61% 73%, 78% 48%, 94% 69%, 100% 64%, 100% 100%, 0 100%)" }} />
        {grid && <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(to right, #fff9 1px, transparent 1px), linear-gradient(to bottom, #fff9 1px, transparent 1px)", backgroundSize: "33.333% 33.333%" }} />}
        <Corners size={9} inset={6} style={{ color: "white" }} />
      </div>
      <SegmentedControl<Stock> label="Film stock" options={["Dusk", "Chrome", "Mono"]} value={stock} onValueChange={(next) => next && setStock(next)} fill />
      <Switch label="Composition grid" checked={grid} onCheckedChange={setGrid} />
    </div>
  )
}
