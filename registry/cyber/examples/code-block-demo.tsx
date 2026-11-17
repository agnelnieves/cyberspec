import { CodeBlock } from "@/registry/cyber/ui/code-block"

const snippet = `
import { Cyber } from "@/registry/cyber/ui/cyber"
import { Meter } from "@/registry/cyber/ui/meter"

// Heat at or past 85 trips the CRIT tag.
export function DeckStatus({ heat }: { heat: number }) {
  return (
    <Cyber accent={{ l: 0.66, c: 0.23, h: 24 }}>
      <Meter label="Deck memory" value={10} max={50} />
      <Meter label="Heat" value={heat} high={85} />
    </Cyber>
  )
}
`

export default function CodeBlockDemo() {
  return (
    <>
      <CodeBlock filename="deck-status.tsx" language="tsx" code={snippet} />
    </>
  )
}
