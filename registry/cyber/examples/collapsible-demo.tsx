import { Collapsible } from "@/registry/cyber/ui/collapsible"

export default function CollapsibleDemo() {
  return (
    <>
      <Collapsible label="Black-box log" summary="3 entries" defaultOpen>
        <p>02:14 Link opened from Lowtide.</p>
        <p>02:19 Trace answered with Null Ping.</p>
        <p>02:31 Link closed. Nothing followed it home.</p>
      </Collapsible>
      <Collapsible label="Sealed evidence" summary="Locked" disabled>
        Held by Solace Mutual until the claim is settled.
      </Collapsible>
    </>
  )
}
