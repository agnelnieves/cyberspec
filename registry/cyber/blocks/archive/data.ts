// What the archive holds: eighteen records in four sections. Every record
// has the same shape, so one dossier draws them all. `links` name other
// records by id, across sections.

type Section = "people" | "places" | "machines" | "programs"

type MachineShape = "deck" | "carbine" | "van" | "lifter"

type Entry = {
  id: string
  section: Section
  name: string
  /** The list's second column: a role, a sector, a class. */
  meta: string
  /** The record's serial. */
  code: string
  /** One line, for the sheet's description. */
  summary: string
  facts: [term: string, value: string][]
  /** The first two show in the dossier; the sheet shows them all. */
  text: string[]
  notes: [at: string, line: string][]
  links: string[]
  /** Which outline a machine's plate draws. */
  shape?: MachineShape
}

// `one` is the section's noun for a single record, and `seek` what its
// filter suggests typing.
const sections: { value: Section; label: string; one: string; seek: string }[] = [
  { value: "people", label: "People", one: "person", seek: "Name, role, district" },
  { value: "places", label: "Places", one: "place", seek: "Name, sector, crew" },
  { value: "machines", label: "Machines", one: "machine", seek: "Name, maker, class" },
  { value: "programs", label: "Programs", one: "program", seek: "Name, class, author" },
]

const entries: Entry[] = [
  {
    id: "mara-voss",
    section: "people",
    name: "Mara Voss",
    meta: "Fixer",
    code: "P-0114",
    summary: "Fixer. Works the Lowtide seawall and vouches for most of this archive.",
    facts: [
      ["Role", "Fixer"],
      ["Base", "Lowtide"],
      ["Crew", "Independent"],
      ["Standing", "Trusted"],
    ],
    text: [
      "Mara Voss takes her calls at a noodle counter on the Lowtide seawall and has not missed a payment in eleven years. Most crews in the Sprawl got their first job from her. Several got their last.",
      "She carries no deck and no augments anyone has found. What she knows is in her head or in a paper ledger, which Vanta Systems has offered to buy twice.",
      "She vouches for most of the people in this archive. Ask her about the rest before you call them.",
    ],
    notes: [
      ["11.02", "Paid the Glasswater job in full, a day early."],
      ["11.09", "Declined to say who asked about the ledger."],
      ["11.14", "Counter closed for one evening. No reason given."],
    ],
    links: ["lowtide", "sable-quinn", "dex-marlowe"],
  },
  {
    id: "ilya-brandt",
    section: "people",
    name: "Ilya Brandt",
    meta: "Tech",
    code: "P-0127",
    summary: "Tech. Repairs decks behind an unmarked shutter on level 27 of the Stacks.",
    facts: [
      ["Role", "Tech"],
      ["Base", "The Stacks"],
      ["Crew", "Static Saints"],
      ["Standing", "Reliable"],
    ],
    text: [
      "Ilya Brandt repairs decks at a bench on level 27 of the Stacks, behind a shutter with no sign. If the shutter is down, the bench is busy. Knocking does not help.",
      "He left Vanta Systems with a severance and a copy of the Mk.II firmware. Only the severance was authorized.",
      "Rates are fixed and posted on the wall. The wall also lists three people he no longer works for.",
    ],
    notes: [
      ["10.28", "Reflashed two decks overnight. Both held."],
      ["11.06", "Asked for payment in parts, not credits."],
      ["11.15", "Shutter down for nine hours."],
    ],
    links: ["vanta-mk2", "the-stacks", "ghostwrite"],
  },
  {
    id: "juno-okafor",
    section: "people",
    name: "Juno Okafor",
    meta: "Medic",
    code: "P-0131",
    summary: "Medic. Flew for Solace Mutual, now runs a clinic in Glasswater with no forms.",
    facts: [
      ["Role", "Medic"],
      ["Base", "Glasswater"],
      ["Crew", "Independent"],
      ["Standing", "Trusted"],
    ],
    text: [
      "Juno Okafor flew four years of medevac for Solace Mutual and resigned the week the company began checking policies before landing.",
      "Her clinic is two rooms over a laundry in Glasswater. It has no forms and no waiting list, and it closes when the supplies run out.",
      "She will patch anyone once. The second visit comes with questions.",
    ],
    notes: [
      ["10.19", "Treated two of the Lowtide Union after the dock strike."],
      ["11.03", "Out of coagulant. Restocked through Mara Voss."],
      ["11.12", "Turned away a Meridian Biotech recruiter."],
    ],
    links: ["solace-lifter", "glasswater", "mara-voss"],
  },
  {
    id: "dex-marlowe",
    section: "people",
    name: "Dex Marlowe",
    meta: "Driver",
    code: "P-0140",
    summary: "Driver. Knows every unlit road between Cinder Row and the seawall.",
    facts: [
      ["Role", "Driver"],
      ["Base", "Cinder Row"],
      ["Crew", "Lowtide Union"],
      ["Standing", "Reliable"],
    ],
    text: [
      "Dex Marlowe drives a van called Patience and has never been stopped at a checkpoint he chose to approach. He chooses carefully.",
      "He grew up over a foundry in Cinder Row and can name every road in the district that lost its lights. Those are the roads he uses.",
      "He does not wait longer than agreed. This has been tested.",
    ],
    notes: [
      ["10.30", "Glasswater to the Stacks in eleven minutes. Disputed."],
      ["11.08", "Replaced the van's plates. Third set this year."],
      ["11.13", "Waited four minutes as agreed, then left."],
    ],
    links: ["patience", "cinder-row", "mara-voss"],
  },
  {
    id: "sable-quinn",
    section: "people",
    name: "Sable Quinn",
    meta: "Runner",
    code: "P-0152",
    summary: "Runner. Quick on a deck, quicker to leave. No fixed address on file.",
    facts: [
      ["Role", "Runner"],
      ["Base", "Unlisted"],
      ["Crew", "Static Saints"],
      ["Standing", "Unverified"],
    ],
    text: [
      "Sable Quinn runs intrusion for the Static Saints and has been inside more Vanta relays than most Vanta technicians.",
      "No fixed address is on file. Messages reach her through Ilya Brandt's bench, usually within a day.",
      "She writes her own daemons and names them after weather. Two are in this archive. The others are not for sale.",
    ],
    notes: [
      ["10.22", "Cleared a Meridian Heights relay in under a minute."],
      ["11.01", "Lost a deck in Cinder Row. Did not go back for it."],
      ["11.16", "Asked what this archive says about her."],
    ],
    links: ["vanta-mk2", "mirrorfall", "ilya-brandt"],
  },
  {
    id: "lowtide",
    section: "places",
    name: "Lowtide",
    meta: "LT-04",
    code: "D-LT04",
    summary: "The old harbor district. It floods on a schedule and the schedule is posted.",
    facts: [
      ["Sector", "LT-04"],
      ["Held by", "Lowtide Union"],
      ["Residents", "410 000"],
      ["Risk", "Moderate"],
    ],
    text: [
      "Lowtide is the old harbor, built before the seawall and rebuilt behind it. The lower streets flood twice a day. The schedule is posted at every stair.",
      "The Lowtide Union runs the docks, the pumps and the night market. Patrols from Meridian Heights stop at the seawall and turn around.",
      "Most work in the Sprawl starts here, at a counter or on a pier, and most of it is paid here too.",
    ],
    notes: [
      ["10.25", "Pump station 3 offline for two tides."],
      ["11.05", "Night market moved one pier east."],
      ["11.14", "Seawall cameras dark for forty minutes."],
    ],
    links: ["mara-voss", "glasswater", "patience"],
  },
  {
    id: "glasswater",
    section: "places",
    name: "Glasswater",
    meta: "GW-11",
    code: "D-GW11",
    summary: "Canal district of clinics and showrooms. Clean streets, long memory.",
    facts: [
      ["Sector", "GW-11"],
      ["Held by", "Meridian Biotech"],
      ["Residents", "186 000"],
      ["Risk", "Low"],
    ],
    text: [
      "Glasswater is canals, clinics and showrooms. Meridian Biotech owns most of the frontage and all of the cameras.",
      "The streets are clean and the district remembers faces. A route through Glasswater is easy to walk and hard to walk twice.",
      "Behind the showrooms are the laundries, kitchens and bench clinics that keep the frontage running. Nobody films those.",
    ],
    notes: [
      ["10.27", "New camera mast at the east lock."],
      ["11.04", "Checkpoint hours extended to midnight."],
      ["11.11", "Route through the laundry row confirmed clear."],
    ],
    links: ["juno-okafor", "lowtide", "static-bloom"],
  },
  {
    id: "cinder-row",
    section: "places",
    name: "Cinder Row",
    meta: "CR-02",
    code: "D-CR02",
    summary: "Foundry district. Half the lights are out and both crews like it that way.",
    facts: [
      ["Sector", "CR-02"],
      ["Held by", "Contested"],
      ["Residents", "97 000"],
      ["Risk", "High"],
    ],
    text: [
      "Cinder Row is foundries, scrapyards and the housing built to serve them. Half the street lighting failed years ago and nobody has asked for it back.",
      "The Neon Jackals hold the yards and the Static Saints hold the roofs. The line between them moves about a block a month.",
      "Kestrel Arms tests here under a permit that lists the district as unoccupied.",
    ],
    notes: [
      ["10.21", "Yard 6 changed hands. Quietly."],
      ["11.07", "Patrol sweep at dusk. No arrests."],
      ["11.15", "Foundry 2 running a night shift again."],
    ],
    links: ["dex-marlowe", "kestrel-kr9", "the-stacks"],
  },
  {
    id: "the-stacks",
    section: "places",
    name: "The Stacks",
    meta: "ST-27",
    code: "D-ST27",
    summary: "Forty levels of container housing. The lifts stop at twelve.",
    facts: [
      ["Sector", "ST-27"],
      ["Held by", "Static Saints"],
      ["Residents", "530 000"],
      ["Risk", "Moderate"],
    ],
    text: [
      "The Stacks are forty levels of container housing bolted to a frame that was meant to be temporary. The lifts stop at level twelve. Everything above that is stairs.",
      "The Static Saints keep the power on and the stairwells clear, and take their fee through the meter.",
      "Signal is poor above level thirty. People who live there consider that a feature.",
    ],
    notes: [
      ["10.24", "Level 19 walkway closed for welding."],
      ["11.02", "Meter rates up four percent."],
      ["11.13", "No signal above level 30 for six hours."],
    ],
    links: ["ilya-brandt", "cinder-row", "null-ping"],
  },
  {
    id: "vanta-mk2",
    section: "machines",
    name: "Vanta Mk.II deck",
    meta: "Deck",
    code: "M-VT02",
    summary: "Intrusion deck by Vanta Systems. Sixteen units of memory, two revisions behind.",
    facts: [
      ["Maker", "Vanta Systems"],
      ["Class", "Intrusion deck"],
      ["Memory", "16 units"],
      ["Firmware", "Rev 0.1"],
    ],
    text: [
      "The Mk.II is the deck Vanta Systems issues to its own relay technicians: sixteen units of memory, four ports and a case that opens without tools.",
      "Most of the ones in the Sprawl left Vanta without paperwork. Their firmware is two revisions behind, which is why they still run daemons the new ones refuse.",
      "It runs hot under load. Ilya Brandt fits a second heat spreader and charges for it.",
    ],
    notes: [
      ["10.28", "Reflashed at the Stacks bench."],
      ["11.06", "Port 3 intermittent. Reseated."],
      ["11.12", "Held three daemons for forty minutes without a fault."],
    ],
    links: ["ilya-brandt", "ghostwrite", "deadlock"],
    shape: "deck",
  },
  {
    id: "kestrel-kr9",
    section: "machines",
    name: "Kestrel KR-9 carbine",
    meta: "Carbine",
    code: "M-KR09",
    summary: "Short carbine by Kestrel Arms. Licensed to corporate security, common elsewhere.",
    facts: [
      ["Maker", "Kestrel Arms"],
      ["Class", "Carbine"],
      ["Feed", "30 rounds"],
      ["License", "Restricted"],
    ],
    text: [
      "The KR-9 is a short carbine sold to corporate security under a restricted license. Kestrel Arms reports that none have been lost.",
      "It takes Onyx Lumen optics on a top rail and logs every round to a chip in the stock. The chip is the first thing a tech removes.",
      "Reliable in salt air, which is why Lowtide prefers it.",
    ],
    notes: [
      ["10.20", "Crate of twelve listed as destroyed in transit."],
      ["11.03", "Seen at the night market, pier 4."],
      ["11.10", "Log chip pulled and wiped at the Stacks bench."],
    ],
    links: ["cinder-row", "ilya-brandt", "lowtide"],
    shape: "carbine",
  },
  {
    id: "patience",
    section: "machines",
    name: "Patience, cargo van",
    meta: "Van",
    code: "M-PT01",
    summary: "Dex Marlowe's van. Unbadged, grey, and faster than it has any reason to be.",
    facts: [
      ["Maker", "Unbadged"],
      ["Class", "Cargo van"],
      ["Range", "640 km"],
      ["Keeper", "Dex Marlowe"],
    ],
    text: [
      "Patience is a grey cargo van with no badge and a registration that changes about three times a year. It is kept charged under the Stacks.",
      "The cargo floor lifts. What is under it has not been recorded here at the keeper's request.",
      "It seats two in front and as many as needed in the back, briefly.",
    ],
    notes: [
      ["10.30", "New plates fitted."],
      ["11.08", "Rear door seal replaced after a Lowtide tide."],
      ["11.13", "Parked under the Stacks, bay 14."],
    ],
    links: ["dex-marlowe", "the-stacks", "lowtide"],
    shape: "van",
  },
  {
    id: "solace-lifter",
    section: "machines",
    name: "Solace medevac lifter",
    meta: "Aircraft",
    code: "M-SL06",
    summary: "Tilt-rotor ambulance flown by Solace Mutual. It checks the policy on approach.",
    facts: [
      ["Maker", "Solace Mutual"],
      ["Class", "Tilt-rotor"],
      ["Crew", "3"],
      ["Response", "6 to 40 min"],
    ],
    text: [
      "The lifter is a four-rotor ambulance with a crew of three and room for two patients. Solace Mutual keeps eleven in the air over the Sprawl.",
      "Response is six minutes in Meridian Heights and about forty in Lowtide. The policy is checked on approach. A lapsed one turns the lifter around.",
      "Juno Okafor flew one for four years and can describe the sound it makes leaving.",
    ],
    notes: [
      ["10.23", "Two lifters grounded for rotor inspection."],
      ["11.05", "Turned back over Cinder Row. Policy lapsed."],
      ["11.14", "Landed in Glasswater in five minutes."],
    ],
    links: ["juno-okafor", "glasswater", "cinder-row"],
    shape: "lifter",
  },
  {
    id: "ghostwrite",
    section: "programs",
    name: "Ghostwrite",
    meta: "4 RAM",
    code: "X-GW04",
    summary: "Masking daemon. Rewrites a tracer's log so the route reads as someone else's.",
    facts: [
      ["Class", "Masking"],
      ["Cost", "4 RAM"],
      ["Author", "Unknown"],
      ["Status", "Stable"],
    ],
    text: [
      "Ghostwrite rewrites a tracer's log while the tracer is still writing it. The route stays open and reads as someone else's.",
      "It is small, old and passed around freely. Nobody claims to have written it, which is the point.",
      "It does not hide traffic. It misattributes it. Choose the someone else with care.",
    ],
    notes: [
      ["10.26", "Held against a Vanta tracer for nine minutes."],
      ["11.04", "Fails on relays patched after Rev 0.3."],
      ["11.12", "Copy verified against the Stacks bench original."],
    ],
    links: ["vanta-mk2", "ilya-brandt", "null-ping"],
  },
  {
    id: "static-bloom",
    section: "programs",
    name: "Static Bloom",
    meta: "6 RAM",
    code: "X-SB06",
    summary: "Jamming daemon. Floods nearby cameras with noise for about ninety seconds.",
    facts: [
      ["Class", "Jamming"],
      ["Cost", "6 RAM"],
      ["Author", "Sable Quinn"],
      ["Status", "Stable"],
    ],
    text: [
      "Static Bloom floods every camera on a relay with noise for about ninety seconds. The footage survives. It shows weather.",
      "It is loud. Anyone watching the relay knows something happened, and roughly where.",
      "Written for Glasswater, where being recorded costs more than being noticed.",
    ],
    notes: [
      ["10.29", "Ninety-four seconds on the east lock mast."],
      ["11.07", "Second use on one relay cut the window in half."],
      ["11.11", "Cleared the laundry row route."],
    ],
    links: ["glasswater", "sable-quinn", "deadlock"],
  },
  {
    id: "deadlock",
    section: "programs",
    name: "Deadlock",
    meta: "8 RAM",
    code: "X-DL08",
    summary: "Lockout daemon. Seals a door system in whatever state it finds it.",
    facts: [
      ["Class", "Lockout"],
      ["Cost", "8 RAM"],
      ["Author", "Static Saints"],
      ["Status", "Stable"],
    ],
    text: [
      "Deadlock freezes a door system in its current state and holds it there until the deck lets go. Open stays open. Shut stays shut.",
      "It holds for as long as it has memory, and it takes half a Mk.II to run. Plan the rest of the route around that.",
      "It cannot tell which side of the door you are on.",
    ],
    notes: [
      ["10.22", "Held a Meridian Heights service door for six minutes."],
      ["11.01", "Released early when the deck overheated."],
      ["11.09", "Sealed the wrong stairwell. Noted."],
    ],
    links: ["vanta-mk2", "the-stacks", "static-bloom"],
  },
  {
    id: "mirrorfall",
    section: "programs",
    name: "Mirrorfall",
    meta: "11 RAM",
    code: "X-MF11",
    summary: "Decoy daemon. Copies a runner's signature to a second relay across the district.",
    facts: [
      ["Class", "Decoy"],
      ["Cost", "11 RAM"],
      ["Author", "Sable Quinn"],
      ["Status", "Restricted"],
    ],
    text: [
      "Mirrorfall copies a runner's signature to a second relay and lets the trace follow the copy. The original keeps working.",
      "It needs eleven units and a relay nobody will miss. The copy lasts until someone arrives to look at it.",
      "Restricted. Sable Quinn decides who gets a copy and has so far decided on no one.",
    ],
    notes: [
      ["10.22", "First field use. Trace followed the copy to Cinder Row."],
      ["11.06", "Request for a copy declined."],
      ["11.16", "Request for a copy declined again."],
    ],
    links: ["sable-quinn", "cinder-row", "ghostwrite"],
  },
  {
    id: "null-ping",
    section: "programs",
    name: "Null Ping",
    meta: "2 RAM",
    code: "X-NP02",
    summary: "Probe daemon. Asks a relay whether anyone is listening and reports the silence.",
    facts: [
      ["Class", "Probe"],
      ["Cost", "2 RAM"],
      ["Author", "Unknown"],
      ["Status", "Stable"],
    ],
    text: [
      "Null Ping sends a relay a request with nothing in it and times the answer. A fast answer means the relay is idle. A slow one means it is being watched.",
      "It costs almost nothing and leaves no entry in the log. Run it first.",
      "No answer at all means no signal. Above level thirty of the Stacks, that is normal.",
    ],
    notes: [
      ["10.24", "Idle relay answered in 12 ms."],
      ["11.02", "Watched relay answered in 340 ms."],
      ["11.13", "No answer from the Stacks, level 31."],
    ],
    links: ["the-stacks", "ghostwrite", "vanta-mk2"],
  },
]

const entryOf = (id: string) => entries.find((entry) => entry.id === id)!
const entriesIn = (section: Section) => entries.filter((entry) => entry.section === section)
const sectionOf = (value: Section) => sections.find((section) => section.value === value)!

export { entries, entriesIn, entryOf, sectionOf, sections }
export type { Entry, MachineShape, Section }
