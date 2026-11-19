import { useState } from "react"
import { Asterisk, Diamond, Hexagon, Triangle, Waypoints } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { Badge } from "@/registry/cyber/ui/badge"
import "./recipe-layout.css"

const shapes = [Diamond, Hexagon, Triangle, Waypoints]
const names = ["Diamond", "Hexagon", "Triangle", "Constellation"]
function shuffle() {
  const deck = [0, 1, 2, 3, 0, 1, 2, 3]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export default function GlyphMatch() {
  const [cards, setCards] = useState(shuffle)
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [turns, setTurns] = useState(0)
  function reveal(index: number) {
    const previous = flipped.length === 1 ? flipped[0] : undefined
    if (previous === undefined) { setFlipped([index]); return }
    setTurns(turns + 1)
    if (cards[previous] === cards[index]) {
      setMatched([...matched, previous, index])
      setFlipped([])
    } else setFlipped([previous, index])
  }
  return (
    <div className="sink-stack">
      <div className="sink-between"><span className="sink-label">Memory deck</span><Badge tone="signal">{matched.length / 2} / 4 pairs</Badge></div>
      <div style={{display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 5}}>
        {cards.map((shape, index) => {
          const known = matched.includes(index)
          const visible = known || flipped.includes(index)
          const Icon = visible ? shapes[shape] : Asterisk
          return <Button key={index} tone={known ? "signal" : visible ? "flag" : "secondary"}
            disabled={known || (flipped.length === 1 && flipped[0] === index)} style={{height: 56}}
            aria-label={`Card ${index + 1}, ${visible ? names[shape] : "face down"}${known ? ", matched" : ""}`}
            onClick={() => reveal(index)}><Icon aria-hidden /></Button>
        })}
      </div>
      <div className="sink-between">
        <span className="sink-note" role="status">{matched.length === 8 ? `All pairs in ${turns} turns` : flipped.length === 2 ? "No match. Pick another card." : flipped.length ? "Find its partner." : "Turn over two cards."}</span>
        <Button size="sm" onClick={() => { setCards(shuffle()); setMatched([]); setFlipped([]); setTurns(0) }}>Shuffle</Button>
      </div>
    </div>
  )
}
