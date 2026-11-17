import * as React from "react"
import { Brain, Cpu, Dumbbell, Snowflake, Zap } from "lucide-react"
import { HexStat, HexStatGroup } from "@/registry/cyber/ui/hex-stat"
import { Readout } from "@/registry/cyber/ui/readout"

const attributes = [
  { name: "Frame", icon: <Dumbbell />, start: 9 },
  { name: "Reflex", icon: <Zap />, start: 7 },
  { name: "Circuit", icon: <Cpu />, start: 14 },
  { name: "Cortex", icon: <Brain />, start: 11 },
  { name: "Nerve", icon: <Snowflake />, start: 13 },
]

export default function HexStatDemo() {
  const [selected, setSelected] = React.useState("Nerve")
  const [levels, setLevels] = React.useState(() => attributes.map((attribute) => attribute.start))
  const [points, setPoints] = React.useState(3)

  return (
    <div style={{ display: "grid", gap: 10, width: "100%", justifyItems: "center" }}>
      <HexStatGroup label="Attributes">
        {attributes.map((attribute, index) => (
          <HexStat
            key={attribute.name}
            name={attribute.name}
            icon={attribute.icon}
            value={levels[index]}
            max={20}
            selected={selected === attribute.name}
            onClick={() => setSelected(attribute.name)}
            onRaise={
              points > 0
                ? () => {
                    setLevels(levels.map((level, at) => (at === index ? level + 1 : level)))
                    setPoints(points - 1)
                  }
                : undefined
            }
          />
        ))}
      </HexStatGroup>
      <Readout label="Attribute points" value={points} unit="left" size="sm" tone={points ? "flag" : "accent"} />
    </div>
  )
}
