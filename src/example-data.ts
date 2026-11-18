// The example screens: the kit composed into whole layouts, the way SPEC-01's
// devices show its hardware. Each card opens its screen. The thumbnails are
// written by scripts/thumbs.mjs.
export type Example = {
  route: string
  title: string
  line: string
  // What to look at in it, a few words.
  shows: string[]
  tag?: string
}

export const examples: Example[] = [
  {
    route: "daemon",
    title: "Daemon",
    line: "Run a program, watch it change the deck, and undo its work.",
    shows: ["Agent bridge", "Permission prompt", "Undo"],
    tag: "Agents",
  },
  {
    route: "loadout",
    title: "Loadout",
    line: "Inspect your gear and move items between fitted slots and your pack.",
    shows: ["Item slots", "Readouts", "Dialogs"],
  },
  {
    route: "augments",
    title: "Augments",
    line: "Spend points on five attributes and see how your stats change.",
    shows: ["Hex stats", "Steppers", "Meters"],
  },
  {
    route: "jobs",
    title: "Jobs",
    line: "Pick up a contract, track its objectives, and follow the leads.",
    shows: ["Lists", "Checklists", "Linked records"],
  },
  {
    route: "comms",
    title: "Comms",
    line: "Open a contact’s thread and choose how to reply.",
    shows: ["Contacts", "Thread", "Reply choices"],
  },
  {
    route: "archive",
    title: "Archive",
    line: "Search the Sprawl’s dossiers on people, places, and machines.",
    shows: ["Side tabs", "Filter", "Dossier"],
  },
  {
    route: "grid",
    title: "Grid",
    line: "Set a district waypoint or trace the Atlantic relays on an atlas and a globe.",
    shows: ["District map", "Atlas", "Globe"],
  },
]
