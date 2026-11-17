import * as React from "react"
import { KeyHint, KeyHints } from "@/registry/cyber/ui/key-hint"

// The foot of an inventory screen. Equip and Drop are buttons too, for a
// pointer; a carbine in hand can't be dropped.
export default function KeyHintDemo() {
  const [equipped, setEquipped] = React.useState(true)
  return (
    <>
      <span data-kit="value" role="status">
        KR-9 // {equipped ? "EQUIPPED" : "STOWED"}
      </span>
      <KeyHints
        align="center"
        hints={[
          { keys: ["↑", "↓"], label: "Navigate" },
          { keys: "↵", label: "Open" },
          { keys: "E", label: "Equip", onPress: () => setEquipped((now) => !now) },
          { keys: "X", label: "Drop", onPress: () => {}, disabled: equipped },
        ]}
      />
      <KeyHint keys="Esc" label="Close" />
    </>
  )
}
