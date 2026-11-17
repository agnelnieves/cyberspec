// The district, generated. Two quarters of streets, each on its own slightly
// turned grid, meet across a canal; a rail line cuts over both. Everything
// comes from one seeded generator, so the map is the same on every load, and
// the streets are a real graph: markers stand on its crossings, and a route
// is the shortest walk along it.

export const W = 1200
export const H = 700

export type Kind = "job" | "vendor" | "safehouse" | "contact"
export type Point = readonly [number, number]

export type Marker = {
  id: string
  kind: Kind
  name: string
  text: string
  /** One more fact, as a label and what it reads. */
  fact: readonly [string, string]
  x: number
  y: number
  district: string
  sector: string
  /** Walking distance from the player, along the streets. */
  metres: number
  /** The walk itself, from the player to the marker. */
  route: Point[]
}

type Node = { x: number; y: number; quarter: number; inside: boolean; links: number[] }

// mulberry32: small, fast, and the same everywhere.
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const n = (value: number) => (Math.round(value * 10) / 10).toString()

// The canal runs west to east, falling as it goes, so the northern quarter
// is wide in the east and the southern one in the west.
export const canalY = (x: number) => 236 + 0.2 * x + 58 * Math.sin(x / 178 + 0.7) + 22 * Math.sin(x / 71 + 2.2)
const BANK = 31

const quarters = [
  { name: "Glasswater", north: true, angle: -9, ox: 640, oy: 160, su: [62, 104], sv: [50, 84], au: 1, av: 2 },
  { name: "Lowtide", north: false, angle: 6, ox: 520, oy: 560, su: [50, 86], sv: [42, 70], au: 2, av: 0 },
] as const

// Two things too big to be a block: an exchange hall and a spire.
export const landmarks = [
  { id: "exchange", name: "Vanta Exchange", x: 432, y: 142, r: 56 },
  { id: "spire", name: "Meridian Spire", x: 812, y: 598, r: 42 },
] as const

export const rail: Point[] = [
  [-20, 662],
  [196, 606],
  [404, 486],
  [596, 300],
  [786, 196],
  [1004, 128],
  [1220, 98],
]
export const stations: Point[] = [rail[1], rail[4]]

function distanceToRail(x: number, y: number) {
  let best = Infinity
  for (let i = 0; i < rail.length - 1; i++) {
    const [ax, ay] = rail[i]
    const [bx, by] = rail[i + 1]
    const dx = bx - ax
    const dy = by - ay
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy))
  }
  return best
}

export const districtAt = (x: number, y: number) => {
  const side = y - canalY(x)
  return side < -18 ? quarters[0].name : side > 18 ? quarters[1].name : "Sluice Canal"
}

// The survey grid printed over the map: columns A to H, rows 1 to 5.
export const SECTOR_W = W / 8
export const SECTOR_H = H / 5
export const sectorAt = (x: number, y: number) =>
  `${"ABCDEFGH"[Math.max(0, Math.min(7, Math.floor(x / SECTOR_W)))]}${Math.max(0, Math.min(4, Math.floor(y / SECTOR_H))) + 1}`

const places: Omit<Marker, "x" | "y" | "district" | "sector" | "metres" | "route">[] = [
  {
    id: "cold-relay",
    kind: "job",
    name: "Cold Relay",
    text: "A Vanta relay on a rooftop stopped answering. Mara Voss wants it talking again before the Neon Jackals notice.",
    fact: ["Pays", "¤ 4 200"],
  },
  {
    id: "kestrel-counter",
    kind: "vendor",
    name: "Kestrel Counter",
    text: "Carbines, parts and rounds, sold from behind armoured glass. KR-9 magazines are in stock.",
    fact: ["Stock", "Firearms"],
  },
  {
    id: "mara-voss",
    kind: "contact",
    name: "Mara Voss",
    text: "Fixer. She keeps her usual table until the rain stops, and she has work if you have the time.",
    fact: ["Standing", "Trusted"],
  },
  {
    id: "quay-loft",
    kind: "safehouse",
    name: "Quay Loft",
    text: "Two rooms over a net-mender's shop. The stash is behind the boiler, and the door code changes weekly.",
    fact: ["Stash", "12 of 40 slots"],
  },
  {
    id: "glass-ledger",
    kind: "job",
    name: "Glass Ledger",
    text: "Ren Aoki needs a copy of a Solace Mutual claims ledger. Walk in as a client, walk out with the copy.",
    fact: ["Pays", "¤ 6 800"],
  },
  {
    id: "brandts-bench",
    kind: "vendor",
    name: "Brandt's Bench",
    text: "Ilya's workshop. Deck repairs while you wait, and a Vanta Mk.II on the shelf if you can pay for it.",
    fact: ["Stock", "Decks and parts"],
  },
  {
    id: "ren-aoki",
    kind: "contact",
    name: "Ren Aoki",
    text: "Broker. Buys information at a fair price and sells it at an unfair one.",
    fact: ["Standing", "Neutral"],
  },
  {
    id: "night-freight",
    kind: "job",
    name: "Night Freight",
    text: "Dex Marlowe is a driver short for one run across the canal. No questions about the crates.",
    fact: ["Pays", "¤ 2 150"],
  },
  {
    id: "lumen-stall",
    kind: "vendor",
    name: "Lumen Stall",
    text: "Second-hand Onyx optics, cleaned and recalibrated. Most of them even come with a serial.",
    fact: ["Stock", "Optics"],
  },
  {
    id: "signal-annex",
    kind: "safehouse",
    name: "Signal Annex",
    text: "A Static Saints crash pad with a clean line out. Sleep here and the heat on you drops.",
    fact: ["Stash", "Empty"],
  },
  {
    id: "bloom-test",
    kind: "job",
    name: "Bloom Test",
    text: "Ilya Brandt wants Static Bloom run against a live Onyx gate, and the logs brought home.",
    fact: ["Pays", "¤ 3 400"],
  },
  {
    id: "okafor-clinic",
    kind: "vendor",
    name: "Okafor Clinic",
    text: "Juno Okafor patches runners and fits Meridian augments. Solace Mutual cards are not accepted.",
    fact: ["Stock", "Medical, augments"],
  },
  {
    id: "sable-quinn",
    kind: "contact",
    name: "Sable Quinn",
    text: "Runner. Knows every roof between here and the Stacks, and which of them still hold weight.",
    fact: ["Standing", "Friendly"],
  },
  {
    id: "union-dues",
    kind: "job",
    name: "Union Dues",
    text: "Lowtide Union is owed by a dock boss who stopped picking up. Deliver the reminder politely.",
    fact: ["Pays", "¤ 1 900"],
  },
]

function build() {
  const random = seeded(0x5ec7a11)
  const between = (low: number, high: number) => low + (high - low) * random()
  const nodes: Node[] = []
  const roads = { minor: [] as string[], major: [] as string[] }
  const blocks: [string[], string[], string[]] = [[], [], []]
  const lots: string[] = []

  const onLand = (x: number, y: number, north: boolean) => {
    if (x < -70 || x > W + 70 || y < -70 || y > H + 70) return false
    const side = y - canalY(x)
    if (north ? side > -BANK : side < BANK) return false
    return landmarks.every((mark) => Math.hypot(x - mark.x, y - mark.y) > mark.r + 14)
  }

  const link = (a: number, b: number, major: boolean) => {
    nodes[a].links.push(b)
    nodes[b].links.push(a)
    roads[major ? "major" : "minor"].push(`M${n(nodes[a].x)} ${n(nodes[a].y)}L${n(nodes[b].x)} ${n(nodes[b].y)}`)
  }

  quarters.forEach((quarter, q) => {
    const turn = (quarter.angle * Math.PI) / 180
    const cos = Math.cos(turn)
    const sin = Math.sin(turn)
    const at = (u: number, v: number): Point => [quarter.ox + u * cos - v * sin, quarter.oy + u * sin + v * cos]
    const cuts = (from: number, to: number, [low, high]: readonly [number, number]) => {
      const out: number[] = []
      for (let value = from; value < to; value += between(low, high)) out.push(value)
      return out
    }
    const us = cuts(-1150, 1150, quarter.su)
    const vs = cuts(-820, 820, quarter.sv)

    const index = us.map((u) =>
      vs.map((v) => {
        const [x, y] = at(u, v)
        if (!onLand(x, y, quarter.north)) return -1
        nodes.push({ x, y, quarter: q, inside: x > 0 && x < W && y > 0 && y < H, links: [] })
        return nodes.length - 1
      }),
    )

    // Every fourth or fifth street is an avenue.
    const avenueU = (i: number) => i % 5 === quarter.au
    const avenueV = (j: number) => j % 4 === quarter.av
    for (let i = 0; i < us.length; i++) {
      for (let j = 0; j < vs.length; j++) {
        const here = index[i][j]
        if (here < 0) continue
        const east = index[i + 1]?.[j] ?? -1
        const south = index[i][j + 1] ?? -1
        if (east >= 0) link(here, east, avenueV(j))
        if (south >= 0) link(here, south, avenueU(i))
      }
    }

    // A block is a cell with streets on all four sides. It's cut into
    // buildings until they're small, with a few left out as yards.
    const building = (u0: number, v0: number, u1: number, v1: number) => {
      const [cx, cy] = at((u0 + u1) / 2, (v0 + v1) / 2)
      if (distanceToRail(cx, cy) < 11) return
      const corners = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)]
      const path = `M${corners.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}Z`
      const roll = random()
      blocks[roll < 0.56 ? 0 : roll < 0.86 ? 1 : 2].push(path)
    }
    const cut = (u0: number, v0: number, u1: number, v1: number, depth: number) => {
      const w = u1 - u0
      const h = v1 - v0
      if ((w < 30 && h < 30) || depth > 2 || (depth > 0 && random() < 0.16)) {
        if (random() > 0.09) building(u0, v0, u1, v1)
        return
      }
      const share = between(0.36, 0.64)
      const gap = 1.6
      if (w >= h) {
        cut(u0, v0, u0 + w * share - gap, v1, depth + 1)
        cut(u0 + w * share + gap, v0, u1, v1, depth + 1)
      } else {
        cut(u0, v0, u1, v0 + h * share - gap, depth + 1)
        cut(u0, v0 + h * share + gap, u1, v1, depth + 1)
      }
    }
    for (let i = 0; i < us.length - 1; i++) {
      for (let j = 0; j < vs.length - 1; j++) {
        if (index[i][j] < 0 || index[i + 1][j] < 0 || index[i][j + 1] < 0 || index[i + 1][j + 1] < 0) continue
        const pad = (avenue: boolean) => (avenue ? 6 : 4.5)
        const u0 = us[i] + pad(avenueU(i))
        const u1 = us[i + 1] - pad(avenueU(i + 1))
        const v0 = vs[j] + pad(avenueV(j))
        const v1 = vs[j + 1] - pad(avenueV(j + 1))
        // An open lot now and then: drawn as an outline, with nothing on it.
        if (random() < 0.06) {
          const corners = [at(u0 + 3, v0 + 3), at(u1 - 3, v0 + 3), at(u1 - 3, v1 - 3), at(u0 + 3, v1 - 3)]
          lots.push(`M${corners.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}Z`)
          continue
        }
        cut(u0, v0, u1, v1, 0)
      }
    }
  })

  // Three bridges: from the northern crossing nearest the water at each
  // place, to whichever southern crossing is closest to it.
  const bridges: string[] = []
  for (const x of [262, 618, 968]) {
    let from = -1
    nodes.forEach((node, i) => {
      if (node.quarter !== 0 || !node.inside || Math.abs(node.x - x) > 52) return
      if (from < 0 || node.y > nodes[from].y) from = i
    })
    if (from < 0) continue
    let to = -1
    nodes.forEach((node, i) => {
      if (node.quarter !== 1 || !node.inside) return
      const reach = (other: Node) => Math.hypot(other.x - nodes[from].x, other.y - nodes[from].y)
      if (to < 0 || reach(node) < reach(nodes[to])) to = i
    })
    if (to < 0) continue
    nodes[from].links.push(to)
    nodes[to].links.push(from)
    bridges.push(`M${n(nodes[from].x)} ${n(nodes[from].y)}L${n(nodes[to].x)} ${n(nodes[to].y)}`)
  }

  // The player stands on a southern crossing near the middle of the sheet.
  const crossing = (node: Node) => node.inside && node.links.length >= 3
  let home = -1
  nodes.forEach((node, i) => {
    if (node.quarter !== 1 || !crossing(node)) return
    const reach = (other: Node) => Math.hypot(other.x - 548, other.y - 512)
    if (home < 0 || reach(node) < reach(nodes[home])) home = i
  })

  // Shortest walks from there to everywhere (Dijkstra; the graph is small).
  const walk = nodes.map(() => Infinity)
  const back = nodes.map(() => -1)
  const done = nodes.map(() => false)
  if (home >= 0) walk[home] = 0
  for (;;) {
    let next = -1
    for (let i = 0; i < nodes.length; i++) if (!done[i] && walk[i] < Infinity && (next < 0 || walk[i] < walk[next])) next = i
    if (next < 0) break
    done[next] = true
    for (const other of nodes[next].links) {
      const length = walk[next] + Math.hypot(nodes[other].x - nodes[next].x, nodes[other].y - nodes[next].y)
      if (length < walk[other]) {
        walk[other] = length
        back[other] = next
      }
    }
  }

  // Marker sites: crossings well inside the sheet (clear of where the side
  // panels sit at the widest view), spaced apart, reachable on foot.
  const order = nodes.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const sites: number[] = []
  for (const i of order) {
    const node = nodes[i]
    if (!crossing(node) || walk[i] === Infinity || i === home) continue
    if (node.x < W * 0.24 || node.x > W * 0.73 || node.y < 84 || node.y > H - 84) continue
    if (distanceToRail(node.x, node.y) < 24) continue
    if (Math.hypot(node.x - nodes[home].x, node.y - nodes[home].y) < 96) continue
    if (sites.some((other) => Math.hypot(node.x - nodes[other].x, node.y - nodes[other].y) < 88)) continue
    sites.push(i)
    if (sites.length === places.length) break
  }
  // The first job is the tracked one: over the canal, a fair walk away.
  let far = -1
  sites.forEach((site, at) => {
    if (nodes[site].quarter !== 0) return
    if (far < 0 || Math.abs(walk[site] - 470) < Math.abs(walk[sites[far]] - 470)) far = at
  })
  if (far > 0) sites.unshift(...sites.splice(far, 1))

  const routeTo = (site: number) => {
    const points: Point[] = []
    for (let at = site; at >= 0; at = back[at]) points.unshift([nodes[at].x, nodes[at].y])
    return points
  }
  const markers: Marker[] = sites.map((site, at) => {
    const { x, y } = nodes[site]
    return {
      ...places[at],
      x,
      y,
      district: districtAt(x, y),
      sector: sectorAt(x, y),
      metres: Math.round((walk[site] * 1.5) / 10) * 10,
      route: routeTo(site),
    }
  })

  const canal: string[] = []
  for (let x = -40; x <= W + 40; x += 20) canal.push(`${x} ${n(canalY(x))}`)

  return {
    you: { x: nodes[home]?.x ?? W / 2, y: nodes[home]?.y ?? H / 2 },
    markers,
    paths: {
      canal: `M${canal.join("L")}`,
      minor: roads.minor.join(""),
      major: roads.major.join(""),
      bridges: bridges.join(""),
      blocks: blocks.map((tone) => tone.join("")),
      lots: lots.join(""),
      rail: `M${rail.map(([x, y]) => `${x} ${y}`).join("L")}`,
    },
  }
}

export const city = build()

export const pathOf = (points: Point[]) => (points.length ? `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}` : "")
