// The board's fiction: who posts work in the Halcyon Sprawl, and the jobs
// that are open when the screen loads. Nothing here is fetched.

type Difficulty = "Low" | "Moderate" | "Dangerous"
type Kind = "Intrusion" | "Courier" | "Recovery" | "Extraction" | "Escort" | "Bench work" | "Survey"
type Group = "nearby" | "side"
type VehicleShape = "coupe" | "hauler" | "bike"

type Contact = {
  name: string
  role: string
  district: string
  /** A second fact for the dossier: a label and what it reads. */
  fact: [string, string]
  /** Which of the three drawn silhouettes this person gets. */
  look: 0 | 1 | 2
}

type Job = {
  id: string
  name: string
  code: string
  kind: Kind
  group: Group
  priority: boolean
  difficulty: Difficulty
  /** Metres from here. */
  distance: number
  district: string
  pay: number
  contact: keyof typeof contacts
  objectives: { id: string; label: string }[]
  /** The objectives already ticked when the job is first opened. */
  done: string[]
  brief: string[]
  place: { name: string; meta: string; note: string }
  vehicle: { name: string; meta: string; note: string; shape: VehicleShape }
}

const contacts = {
  mara: { name: "Mara Voss", role: "Fixer", district: "Lowtide", fact: ["Jobs cleared", "214"], look: 0 },
  juno: { name: "Juno Okafor", role: "Medic", district: "Lowtide", fact: ["Clinic hours", "20:00 to 06:00"], look: 1 },
  ren: { name: "Ren Aoki", role: "Broker", district: "Glasswater", fact: ["Cut", "12%"], look: 2 },
  dex: { name: "Dex Marlowe", role: "Driver", district: "The Stacks", fact: ["Holds a dock for", "6 min"], look: 1 },
  ilya: { name: "Ilya Brandt", role: "Tech", district: "Cinder Row", fact: ["Rate", "¤ 900 / hr"], look: 2 },
  sable: { name: "Sable Quinn", role: "Runner", district: "Meridian Heights", fact: ["Crew", "Static Saints"], look: 0 },
} satisfies Record<string, Contact>

const board: Job[] = [
  {
    id: "dead-air",
    name: "Dead Air",
    code: "JB-0341",
    kind: "Intrusion",
    group: "nearby",
    priority: true,
    difficulty: "Moderate",
    distance: 340,
    district: "Glasswater",
    pay: 3800,
    contact: "mara",
    objectives: [
      { id: "mast", label: "Reach the Glasswater relay mast" },
      { id: "splice", label: "Splice the Vanta trunk line" },
      { id: "load", label: "Load Null Ping onto the relay" },
      { id: "leave", label: "Walk out before the trace lands" },
    ],
    done: ["mast"],
    brief: [
      "Vanta Systems has been sitting on Lowtide Union's dispatch channel for a month. Mara wants the tap turned around so that it listens to nothing.",
      "The mast is on a canal-side roof, lightly watched after dark. It will give you one clean uplink before someone notices the load.",
      "Null Ping does the rest. Leave it running, and leave.",
    ],
    place: { name: "Glasswater relay", meta: "Vanta Systems // Roof mast", note: "Fire stair on the canal side. No camera on the third landing." },
    vehicle: { name: "Sparrow K2", meta: "Courier bike // Yours", note: "Parked under the lock bridge.", shape: "bike" },
  },
  {
    id: "cold-chain",
    name: "Cold Chain",
    code: "JB-0352",
    kind: "Courier",
    group: "nearby",
    priority: false,
    difficulty: "Low",
    distance: 1200,
    district: "Lowtide",
    pay: 900,
    contact: "juno",
    objectives: [
      { id: "collect", label: "Collect the coolant case from the clinic" },
      { id: "cold", label: "Keep the case under four degrees" },
      { id: "desk", label: "Hand it to the Stacks night desk" },
    ],
    done: [],
    brief: [
      "A Meridian coolant case needs to be across the district before it warms. Juno won't say what's in it, only that it isn't hers.",
      "The case logs its own temperature. Take the shaded route under the tideway: the direct one runs past two vents.",
      "It pays on the reading, not on the clock.",
    ],
    place: { name: "Okafor clinic", meta: "Lowtide // Back door", note: "Knock twice. The front is for patients." },
    vehicle: { name: "Mule 440", meta: "Hauler // On loan", note: "Cold box fitted behind the cab.", shape: "hauler" },
  },
  {
    id: "paper-lantern",
    name: "Paper Lantern",
    code: "JB-0347",
    kind: "Recovery",
    group: "nearby",
    priority: true,
    difficulty: "Moderate",
    distance: 2100,
    district: "Cinder Row",
    pay: 2600,
    contact: "ren",
    objectives: [
      { id: "stall", label: "Find the pawn stall on Cinder Row" },
      { id: "shard", label: "Buy back or lift the ledger shard" },
      { id: "verify", label: "Verify the shard on a clean deck" },
      { id: "return", label: "Return the shard to the broker" },
    ],
    done: [],
    brief: [
      "A ledger shard went across a pawn counter by mistake. It lists who owes Ren, and how much, which makes it worth more to the people on it than to him.",
      "The stall keeper doesn't know what she has. Keep it that way, and pay the tag price if you can.",
      "Check it before you carry it. A copied shard is a different job.",
    ],
    place: { name: "Ash Market, stall 14", meta: "Cinder Row // Open late", note: "Third row in, under the paper lanterns." },
    vehicle: { name: "Halberd GT-4", meta: "Coupe // Rented", note: "Plates are clean until Friday.", shape: "coupe" },
  },
  {
    id: "glass-jaw",
    name: "Glass Jaw",
    code: "JB-0329",
    kind: "Extraction",
    group: "nearby",
    priority: true,
    difficulty: "Dangerous",
    distance: 3600,
    district: "Meridian Heights",
    pay: 6400,
    contact: "mara",
    objectives: [
      { id: "pass", label: "Get a pass for the Meridian Heights lifts" },
      { id: "level", label: "Reach lab level 31" },
      { id: "find", label: "Find the auditor" },
      { id: "core", label: "Bring her out through the service core" },
      { id: "dock", label: "Meet the driver at the freight dock" },
    ],
    done: ["pass", "level"],
    brief: [
      "A Meridian Biotech auditor found something in the reflex booster trials and stopped answering her messages. Her sister is paying to have her walked out.",
      "The lab levels are badge-locked and the lifts log every ride. The service core doesn't, but it's forty floors of ladder.",
      "Dex holds the dock for six minutes. After that you're walking home.",
    ],
    place: { name: "Meridian tower, level 31", meta: "Meridian Biotech // Labs", note: "Service core hatch is behind the cold store." },
    vehicle: { name: "Mule 440 \"Patience\"", meta: "Hauler // Dex Marlowe", note: "Freight dock C, engine running.", shape: "hauler" },
  },
  {
    id: "night-shift",
    name: "Night Shift",
    code: "JB-0350",
    kind: "Escort",
    group: "nearby",
    priority: false,
    difficulty: "Dangerous",
    distance: 780,
    district: "The Stacks",
    pay: 4100,
    contact: "dex",
    objectives: [
      { id: "meet", label: "Meet the convoy at Stack 9" },
      { id: "ride", label: "Ride with the lead hauler to the tideway" },
      { id: "second", label: "Keep the Neon Jackals off the second truck" },
    ],
    done: [],
    brief: [
      "Lowtide Union moves its payroll by road once a month, and the Neon Jackals have learned the date.",
      "Dex drives lead. You're in the cab with him as far as the tideway gate, then on the roof of the second truck.",
      "Nobody needs to get hurt. They need to decide it isn't worth it.",
    ],
    place: { name: "Stack 9 loading yard", meta: "The Stacks // Gate B", note: "Convoy rolls at 02:10. Be early." },
    vehicle: { name: "Union hauler 02", meta: "Hauler // Lowtide Union", note: "Roof rail fitted on the cab side.", shape: "hauler" },
  },
  {
    id: "loose-wires",
    name: "Loose Wires",
    code: "JB-0318",
    kind: "Bench work",
    group: "side",
    priority: false,
    difficulty: "Low",
    distance: 4400,
    district: "Cinder Row",
    pay: 650,
    contact: "ilya",
    objectives: [
      { id: "pull", label: "Pull three capacitors from the scrap line" },
      { id: "bring", label: "Bring them to the bench" },
      { id: "probe", label: "Hold the probe while the deck is tested" },
    ],
    done: ["pull"],
    brief: [
      "Ilya is rebuilding a Vanta Mk.II from two dead ones and is three capacitors short.",
      "The scrap line behind the foundry has the right boards. Ask the foreman first: he likes being asked.",
      "She'll tune your deck for free while you're there.",
    ],
    place: { name: "Brandt's bench", meta: "Cinder Row // Unit 6", note: "Shutter is down. Use the side door." },
    vehicle: { name: "Sparrow K2 \"Wren\"", meta: "Courier bike // Ilya Brandt", note: "Borrow it. Bring it back charged.", shape: "bike" },
  },
  {
    id: "second-opinion",
    name: "Second Opinion",
    code: "JB-0333",
    kind: "Survey",
    group: "side",
    priority: false,
    difficulty: "Moderate",
    distance: 5200,
    district: "Meridian Heights",
    pay: 1800,
    contact: "sable",
    objectives: [
      { id: "heron", label: "Scout the medevac pad on Heron Street" },
      { id: "locks", label: "Scout the pad over the Glasswater locks" },
      { id: "cycle", label: "Time one full launch cycle" },
      { id: "send", label: "Send the timings to the runner" },
    ],
    done: [],
    brief: [
      "Sable wants to know how long a Solace Mutual medevac takes to lift, and from where. She hasn't said why, and it's better not to ask.",
      "Two pads, both overlooked. Sit, watch, and write it down.",
      "Don't be seen writing it down.",
    ],
    place: { name: "Heron Street pad", meta: "Solace Mutual // Roof", note: "The car park opposite has a clear line." },
    vehicle: { name: "Halberd GT-4 \"Grey\"", meta: "Coupe // Sable Quinn", note: "Tinted. Nobody looks twice.", shape: "coupe" },
  },
]

// The job that arrives while the board is open. Taking it adds it to the list.
const offer: Job = {
  id: "quiet-money",
  name: "Quiet Money",
  code: "JB-0356",
  kind: "Courier",
  group: "side",
  priority: false,
  difficulty: "Moderate",
  distance: 1900,
  district: "Glasswater",
  pay: 2200,
  contact: "ren",
  objectives: [
    { id: "locker", label: "Collect the credit chit from locker 40" },
    { id: "cross", label: "Cross Glasswater without a scan" },
    { id: "cashier", label: "Leave the chit with the union cashier" },
  ],
  done: [],
  brief: [
    "A credit chit has to cross Glasswater without touching a scanner, and Ren can't be seen anywhere near it.",
    "There are three checkpoints between the lockers and the union hall. The canal path skips two.",
    "The third one is your problem.",
  ],
  place: { name: "Canal lockers", meta: "Glasswater // Row 4", note: "Locker 40 opens to the code on the chit sleeve." },
  vehicle: { name: "Sparrow K2 \"Minnow\"", meta: "Courier bike // Yours", note: "Narrow enough for the canal path.", shape: "bike" },
}

const distanceOf = (metres: number) => (metres < 1000 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`)

// Credits the way the Sprawl writes them: "¤ 15 240".
const creditsOf = (amount: number) => `¤ ${String(amount).replace(/\B(?=(\d{3})+$)/g, " ")}`

export { board, contacts, creditsOf, distanceOf, offer }
export type { Contact, Difficulty, Group, Job, Kind, VehicleShape }
