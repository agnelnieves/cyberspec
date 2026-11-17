import { Meter } from "@/registry/cyber/ui/meter"

export default function MeterDemo() {
  return (
    <>
      <Meter label="Deck memory" value={10} max={50} />
      <Meter label="Heat" value={93} high={85} />
      <Meter label="Reserve cell" value={12} low={20} high={90} format={{ style: "percent" }} />
    </>
  )
}
