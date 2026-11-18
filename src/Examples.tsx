import { Card } from "@/registry/cyber/ui/card"
import { Badge } from "@/registry/cyber/ui/badge"
import { examples } from "./example-data"

function Examples() {
  return (
    <ul data-kit="examples" aria-label="Example screens">
      {examples.map((example, index) => (
        <li key={example.route}>
          <Card
            href={`/${example.route}`}
            title={example.title}
            level={2}
            meta={`EX-${String(index + 1).padStart(2, "0")} // ${example.shows.join(" · ")}`}
            media={<img src={`/examples/${example.route}.webp`} alt="" width={1280} height={800} loading="lazy" decoding="async" draggable={false} />}
            footer={example.tag ? <Badge tone="signal">{example.tag}</Badge> : undefined}
          >
            {example.line}
          </Card>
        </li>
      ))}
    </ul>
  )
}

export { Examples, examples }
export type { Example } from "./example-data"
