import { Separator } from "@/registry/cyber/ui/separator"

const stats = [
  { value: "12", label: "Nodes" },
  { value: "03", label: "Traces" },
  { value: "0.4s", label: "Lag" },
]

export default function SeparatorDemo() {
  return (
    <div style={{ display: "grid", gap: 10, width: "100%", maxWidth: 280, textAlign: "start" }}>
      <div>
        <p data-kit="label">Vanta Mk.II deck</p>
        <p data-kit="hint">Ilya Brandt's bench, the Stacks</p>
      </div>
      <Separator />
      <p data-kit="hint">Reflashed last night. Two routes held open, one burned.</p>
      <Separator label="Uplinks" />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        {stats.map((stat, index) => (
          <div key={stat.label} style={{ display: "contents" }}>
            {index > 0 && <Separator orientation="vertical" />}
            <div style={{ display: "grid", gap: 2 }}>
              <span data-kit="value">{stat.value}</span>
              <span data-kit="hint">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
      <Separator label="End of log" align="center" decorative />
    </div>
  )
}
