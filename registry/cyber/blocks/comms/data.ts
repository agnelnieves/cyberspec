// The people on the deck's contact list, what's been said so far, and what
// each of them says back. Nothing here is fetched or generated: a thread is
// a short script, one or two exchanges deep.

type Presence = "online" | "busy" | "away"

type Offer = {
  name: string
  received: string
  kind: string
  objective: string
  location: string
  pay: number
  crew: string[]
}

type Line = {
  from: "them" | "me"
  time: string
  text: string
  // The line that carries the job offer.
  offer?: boolean
}

type Reply = {
  value: string
  label: string
  // What comes back, after a pause.
  answer: string
  // The replies offered after that answer. None ends the thread.
  next?: string
  // Settles an open job offer.
  outcome?: "accept" | "decline"
}

type Contact = {
  id: string
  name: string
  role: string
  district: string
  presence: Presence
  // The channel the deck reaches them on. Decoration with a label.
  channel: string
  // Which head the portrait plate draws.
  look: number
  standing: number
  jobs: number
  unread: number
  history: Line[]
  offer?: Offer
  start: string
  script: Record<string, Reply[]>
  // A call either connects or it doesn't; either way there's a line for it.
  call: { connects: boolean; line: string }
}

const contacts: Contact[] = [
  {
    id: "mara",
    name: "Mara Voss",
    role: "Fixer",
    district: "Lowtide",
    presence: "online",
    channel: "VX-221",
    look: 0,
    standing: 72,
    jobs: 7,
    unread: 0,
    history: [
      { from: "them", time: "Sat 22:40", text: "Payment for the Cinder Row run cleared. ¤ 2 400, minus the Union's cut." },
      { from: "me", time: "Sat 22:41", text: "Received. The cut gets bigger every month." },
      { from: "them", time: "Sat 22:43", text: "So does the Union. Stay reachable, something bigger is coming." },
      { from: "them", time: "Sun 08:26", text: "Job offer: The Glass Ledger. The brief is attached.", offer: true },
    ],
    offer: {
      name: "The Glass Ledger",
      received: "Sun 08:26",
      kind: "Recovery, quiet",
      objective: "Lift the audit ledger from the Onyx annex before the morning shift badges in.",
      location: "Onyx Dynamics annex, Pier 9, Glasswater",
      pay: 4200,
      crew: ["Dex Marlowe", "Sable Quinn"],
    },
    start: "offer",
    script: {
      offer: [
        { value: "mara-in", label: "Send the route. I'm in.", answer: "Good. Dex has the wheel, Sable goes in with you. Route is on your deck.", next: "crew", outcome: "accept" },
        { value: "mara-terms", label: "What does it pay, and who else is on it?", answer: "¤ 4 200 on delivery. Dex drives, Sable takes the fourth floor with you. Nobody else knows.", next: "terms" },
        { value: "mara-later", label: "Mid-run. Ask me again after dark.", answer: "It walks at 04:00, with or without you. I'll hold it until then.", next: "terms" },
        { value: "mara-out", label: "Not this one, Mara.", answer: "Your call. It goes to the Static Saints.", outcome: "decline" },
      ],
      terms: [
        { value: "mara-terms-in", label: "Then I'm in. Send the route.", answer: "Route's on your deck. The morning shift badges in at 06:00.", outcome: "accept" },
        { value: "mara-terms-out", label: "Too thin for Onyx. I'm out.", answer: "Your call. It goes to the Static Saints.", outcome: "decline" },
      ],
      crew: [
        { value: "mara-crew-mark", label: "Tell Sable to wait for my mark.", answer: "She'll wait. Don't make her wait long." },
        { value: "mara-crew-solo", label: "I work better alone on the floor.", answer: "Not on this one. Sable goes in. That's the deal." },
      ],
    },
    call: { connects: true, line: "Line open. She gives you ninety seconds." },
  },
  {
    id: "ilya",
    name: "Ilya Brandt",
    role: "Tech",
    district: "The Stacks",
    presence: "busy",
    channel: "VX-304",
    look: 1,
    standing: 58,
    jobs: 3,
    unread: 0,
    history: [
      { from: "them", time: "Fri 19:12", text: "Your Vanta deck is on my bench. The relay board is cooked, not the core." },
      { from: "me", time: "Fri 19:15", text: "How long?" },
      { from: "them", time: "Fri 19:16", text: "Two days if the part ships from Glasswater. One if you stop asking." },
      { from: "them", time: "Sun 23:02", text: "Deck's done. I flashed Null Ping while it was open. You're welcome." },
    ],
    start: "pickup",
    script: {
      pickup: [
        { value: "ilya-owe", label: "On my way to the Stacks. What do I owe you?", answer: "¤ 380 and the old relay board. I want to see how it failed.", next: "pay" },
        { value: "ilya-build", label: "Did you touch my Ghostwrite build?", answer: "Didn't touch it. Looked at it. It's ugly, but it's yours.", next: "pay" },
        { value: "ilya-hold", label: "Hold it until tomorrow.", answer: "Shelf fee starts at midnight. Kidding. Mostly." },
      ],
      pay: [
        { value: "ilya-credits", label: "Credits are on the way.", answer: "Received. Level 27, the bench by the window." },
        { value: "ilya-tab", label: "Put it on Mara's tab.", answer: "Mara's tab is longer than my arm. Fine. Once." },
      ],
    },
    call: { connects: false, line: "The bench light is on. Ilya doesn't pick up mid-solder." },
  },
  {
    id: "juno",
    name: "Juno Okafor",
    role: "Medic",
    district: "Cinder Row",
    presence: "online",
    channel: "VX-118",
    look: 2,
    standing: 81,
    jobs: 5,
    unread: 0,
    history: [
      { from: "me", time: "Mon 02:14", text: "Coming in. Left arm, a graze from something Kestrel makes." },
      { from: "them", time: "Mon 02:15", text: "Back door. Mind the stairs, Solace only just paid for the cleaning." },
      { from: "them", time: "Mon 04:40", text: "Sealed. The reflex booster needs recalibrating. Come back in a week." },
      { from: "them", time: "Sun 11:30", text: "It's been a week. Booster check: today or tomorrow?" },
    ],
    start: "check",
    script: {
      check: [
        { value: "juno-today", label: "Today. After dark.", answer: "Back door, 21:00. Eat something first." },
        { value: "juno-tomorrow", label: "Tomorrow. I'm on a job tonight.", answer: "Then don't push the left arm. I mean it.", next: "arm" },
        { value: "juno-skip", label: "It feels fine. Skip it.", answer: "It feels fine until it fires on its own. Tomorrow, then. Not a question." },
      ],
      arm: [
        { value: "juno-right", label: "Understood. Right hand only.", answer: "Good. I'll keep the table free." },
        { value: "juno-promise", label: "No promises.", answer: "There never are. Solace has your policy number. I checked." },
      ],
    },
    call: { connects: true, line: "Line open. Juno has you on speaker, gloves on." },
  },
  {
    id: "dex",
    name: "Dex Marlowe",
    role: "Driver",
    district: "Lowtide",
    presence: "away",
    channel: "VX-077",
    look: 3,
    standing: 64,
    jobs: 9,
    unread: 1,
    history: [
      { from: "them", time: "Sat 17:50", text: "New plates on the van. The old ones are at the bottom of the canal." },
      { from: "me", time: "Sat 17:52", text: "Which canal?" },
      { from: "them", time: "Sat 17:52", text: "Exactly." },
      { from: "them", time: "Mon 06:10", text: "Job offer: Cold Chain. The brief is attached.", offer: true },
    ],
    offer: {
      name: "Cold Chain",
      received: "Mon 06:10",
      kind: "Courier, timed",
      objective: "Move one sealed Meridian cooler across the river before it warms.",
      location: "Dock 4, Lowtide, to the Heights clinic",
      pay: 1800,
      crew: ["Dex Marlowe"],
    },
    start: "offer",
    script: {
      offer: [
        { value: "dex-in", label: "I'll ride along. When?", answer: "Dock 4 at 23:00. Bring the Wraith jacket, the cooler leaks cold.", outcome: "accept" },
        { value: "dex-what", label: "What's in the cooler?", answer: "Didn't ask. Meridian label, Solace seal. That's all I want to know.", next: "cooler" },
        { value: "dex-out", label: "Find another pair of hands.", answer: "Fair. I'll ask the Union.", outcome: "decline" },
      ],
      cooler: [
        { value: "dex-cooler-in", label: "Good enough. I'm in.", answer: "Dock 4 at 23:00. Bring the Wraith jacket, the cooler leaks cold.", outcome: "accept" },
        { value: "dex-cooler-out", label: "Sealed boxes aren't my thing. Pass.", answer: "Fair. I'll ask the Union.", outcome: "decline" },
      ],
    },
    call: { connects: false, line: "Driving. He'll call back from the next red light." },
  },
  {
    id: "sable",
    name: "Sable Quinn",
    role: "Runner",
    district: "The Stacks",
    presence: "away",
    channel: "VX-412",
    look: 4,
    standing: 49,
    jobs: 4,
    unread: 0,
    history: [
      { from: "them", time: "Thu 21:41", text: "Inside. Fourth floor, east stair." },
      { from: "them", time: "Thu 21:58", text: "Out. Roof to roof. Tell Dex the van can go." },
      { from: "me", time: "Thu 22:03", text: "Clean?" },
      { from: "them", time: "Thu 22:04", text: "Clean enough. I owe the Neon Jackals a favor now. Long story." },
    ],
    start: "favor",
    script: {
      favor: [
        { value: "sable-what", label: "What kind of favor?", answer: "The kind you don't put in writing. Ask me in person.", next: "meet" },
        { value: "sable-out", label: "Keep me out of it.", answer: "Already did. You were never on that roof." },
      ],
      meet: [
        { value: "sable-noodles", label: "Noodle bar under the Stacks, midnight.", answer: "Midnight. You're buying." },
        { value: "sable-pass", label: "Then I don't want to know.", answer: "Smart. I wouldn't either." },
      ],
    },
    call: { connects: false, line: "Sable doesn't take calls on a roof." },
  },
  {
    id: "ren",
    name: "Ren Aoki",
    role: "Broker",
    district: "Meridian Heights",
    presence: "online",
    channel: "VX-560",
    look: 5,
    standing: 37,
    jobs: 2,
    unread: 2,
    history: [
      { from: "them", time: "Sun 16:20", text: "A buyer in the Heights wants Onyx Lumen optics, unopened. Do you still have the pair?" },
      { from: "them", time: "Sun 16:45", text: "The offer stands at ¤ 950. It will not stand long." },
    ],
    start: "optics",
    script: {
      optics: [
        { value: "ren-counter", label: "¤ 1 200 and they're yours.", answer: "¤ 1 050. Final. Brokers have rent too.", next: "price" },
        { value: "ren-sold", label: "Sold at ¤ 950.", answer: "A pleasure. A courier will find you by evening." },
        { value: "ren-keep", label: "I'm keeping them.", answer: "A shame. The offer becomes a memory at midnight." },
      ],
      price: [
        { value: "ren-done", label: "Done at ¤ 1 050.", answer: "Done. Credits on delivery, as always." },
        { value: "ren-no", label: "Then no deal.", answer: "Then we never spoke." },
      ],
    },
    call: { connects: true, line: "Line open. Ren is already talking to someone else as well." },
  },
]

// Calls from before this session, so the log starts with something in it.
const earlierCalls = [
  { id: "call-a", time: "Sat 17:40", actor: "Dex Marlowe", text: "Connected. 02:10 on the line." },
  { id: "call-b", time: "Sun 09:02", actor: "Ilya Brandt", text: "No answer." },
]

const creditsOf = (amount: number) => `¤ ${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`

export { contacts, creditsOf, earlierCalls }
export type { Contact, Line, Offer, Presence, Reply }
