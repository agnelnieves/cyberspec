import { Radio, Satellite } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { Reticle } from "@/registry/cyber/ui/reticle"

export default function ReticleDemo() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "30px 28px", paddingBlock: 14 }}>
      <Reticle active tag="Lock">
        <Button tone="ghost">
          <Satellite aria-hidden />
          Relay 07
        </Button>
      </Reticle>
      <Reticle tag="Track" tagAt="bottom-end">
        <Button tone="ghost">
          <Radio aria-hidden />
          Relay 12
        </Button>
      </Reticle>
    </div>
  )
}
