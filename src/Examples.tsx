import { Card } from "@/registry/cyber/ui/card"
import { Badge } from "@/registry/cyber/ui/badge"

// The example screens: the kit composed into whole layouts, the way SPEC-01's
// devices show its hardware. Each card opens its screen. The thumbnails are
// written by scripts/thumbs.mjs.
type Example = {
  route: string
  title: string
  line: string
  // What to look at in it, a few words.
  shows: string[]
  tag?: string
}

const examples: Example[] = [
  {
    route: "daemon",
    title: "Daemon",
    line: "An agent on the page: what it sees, what it does, and how to stop it.",
    shows: ["Agent bridge", "Permission prompt", "Undo"],
    tag: "Agents",
  },
  {
    route: "loadout",
    title: "Loadout",
    line: "Gear slots, a weapon's sheet and what's in the pack.",
    shows: ["Item slots", "Readouts", "Dialogs"],
  },
  {
    route: "augments",
    title: "Augments",
    line: "Five attributes on a lattice, and points to spend on them.",
    shows: ["Hex stats", "Steppers", "Meters"],
  },
  {
    route: "jobs",
    title: "Jobs",
    line: "The job board: what's open, what's tracked, and the brief.",
    shows: ["Lists", "Checklists", "Linked records"],
  },
  {
    route: "comms",
    title: "Comms",
    line: "Contacts, a message thread, and how you answer.",
    shows: ["Contacts", "Thread", "Reply choices"],
  },
  {
    route: "archive",
    title: "Archive",
    line: "The database: people, places and machines, one dossier each.",
    shows: ["Side tabs", "Filter", "Dossier"],
  },
  {
    route: "grid",
    title: "Grid",
    line: "Set a district waypoint or trace the Atlantic relays on an atlas and a globe.",
    shows: ["District map", "Atlas", "Globe"],
  },
]

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
export type { Example }
