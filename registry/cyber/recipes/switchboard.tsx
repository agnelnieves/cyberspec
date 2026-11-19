import { useState } from "react"
import { Lightbulb, LightbulbOff } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { Progress } from "@/registry/cyber/ui/progress"
import "./recipe-layout.css"

const cells = Array.from({ length: 9 }, (_, i) => i)

function flip(board: boolean[], pad: number) {
  return board.map((lit, i) => {
    const distance = Math.abs(i % 3 - pad % 3) + Math.abs(Math.floor(i / 3) - Math.floor(pad / 3))
    return distance <= 1 ? !lit : lit
  })
}

// Start from a solved board so each puzzle has a solution.
const patterns = [[0, 4], [1, 6, 8], [2, 3, 5, 7]]
function puzzle(round: number) {
  return patterns[round % patterns.length].reduce(flip, cells.map(() => true))
}

export default function Switchboard() {
  const [round, setRound] = useState(0)
  const [board, setBoard] = useState(() => puzzle(0))
  const [moves, setMoves] = useState(0)
  const lit = board.filter(Boolean).length
  function start(next: number) {
    setRound(next)
    setBoard(puzzle(next))
    setMoves(0)
  }
  return (
    <div className="sink-stack">
      <Progress label="Lights online" value={lit} max={9} segments={9} getValueLabel={() => `${lit} / 9`} />
      <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4}}>
        {board.map((on, i) => (
          <Button key={i} aria-label={`Pad ${i + 1}`} aria-pressed={on} tone={on ? "signal" : "secondary"}
            disabled={lit === 9} size="lg" onClick={() => { setBoard(flip(board, i)); setMoves(moves + 1) }}>
            {on ? <Lightbulb aria-hidden /> : <LightbulbOff aria-hidden />}
          </Button>
        ))}
      </div>
      <div className="sink-between">
        <span className="sink-note" role="status">{lit === 9 ? "Board restored" : `Puzzle ${round % patterns.length + 1}`} · {moves} moves</span>
        <Button size="sm" onClick={() => start(lit === 9 ? round + 1 : round)}>{lit === 9 ? "Next puzzle" : "Restart"}</Button>
      </div>
    </div>
  )
}
