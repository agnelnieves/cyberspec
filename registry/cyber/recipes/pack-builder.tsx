import { useState } from "react"
import { BatteryCharging, Binoculars, Flashlight, Tent } from "lucide-react"
import { ItemSlot, type ItemRarity } from "@/registry/cyber/ui/item-slot"
import { Meter } from "@/registry/cyber/ui/meter"
import "./recipe-layout.css"

const capacity = 10
const supplies = [
  { name: "Shelter", kg: 5, icon: Tent, rarity: "epic" },
  { name: "Power cell", kg: 3, icon: BatteryCharging, rarity: "rare" },
  { name: "Field glass", kg: 3, icon: Binoculars, rarity: "rare" },
  { name: "Torch", kg: 2, icon: Flashlight, rarity: "common" },
] satisfies { name: string; kg: number; icon: typeof Tent; rarity: ItemRarity }[]

export default function PackBuilder() {
  const [packed, setPacked] = useState(["Power cell", "Torch"])
  const mass = supplies.reduce((sum, item) => sum + (packed.includes(item.name) ? item.kg : 0), 0)
  return (
    <div className="sink-stack">
      <Meter label="Pack weight" value={mass} max={capacity} high={capacity} highLabel="Full"
        format={value => `${value} / ${capacity} kg`} />
      <div role="group" aria-label="Expedition supplies" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: "12px 6px" }}>
        {supplies.map(({ name, kg, icon: Icon, rarity }) => {
          const included = packed.includes(name)
          return (
            <div key={name} style={{ display: "grid", justifyItems: "center", textAlign: "center", gap: 4 }}>
              <ItemSlot label={`${name}, ${kg} kg`} selected={included} equipped={included} rarity={rarity}
                disabled={!included && mass + kg > capacity}
                onClick={() => setPacked(included ? packed.filter(item => item !== name) : [...packed, name])}>
                <Icon strokeWidth={1.5} style={{ fill: "none" }} />
              </ItemSlot>
              <div><strong>{name}</strong><p className="sink-note">{kg} kg</p></div>
            </div>
          )
        })}
      </div>
      <p className="sink-note" role="status">{packed.length ? `In pack: ${packed.join(", ")}.` : "Your pack is empty."}</p>
    </div>
  )
}
