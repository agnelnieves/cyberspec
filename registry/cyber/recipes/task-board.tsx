import { useRef, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { Checkbox, CheckboxGroup } from "@/registry/cyber/ui/checkbox"
import { Progress } from "@/registry/cyber/ui/progress"
import { TextField } from "@/registry/cyber/ui/text-field"
import "./recipe-layout.css"

const initialTasks = [
  { id: "weather", title: "Check the coastal forecast" },
  { id: "battery", title: "Charge the spare beacon" },
  { id: "handoff", title: "Brief the morning shift" },
]

export default function TaskBoard() {
  const [tasks, setTasks] = useState(initialTasks)
  const [complete, setComplete] = useState<string[]>(["weather"])
  const [draft, setDraft] = useState("")
  const sequence = useRef(0)

  return (
    <div className="sink-stack">
      <Progress label="Shift readiness" value={complete.length} max={tasks.length} />
      <CheckboxGroup label="Handoff checklist" value={complete} onValueChange={setComplete}>
        {tasks.map(task => <Checkbox key={task.id} label={task.title} value={task.id} />)}
      </CheckboxGroup>
      <form className="sink-stack" onSubmit={event => {
        event.preventDefault()
        const title = draft.trim()
        if (!title) return
        const task = { id: `added-${++sequence.current}`, title }
        setTasks(previous => [...previous, task])
        setDraft("")
      }}>
        <TextField label="New checklist item" placeholder="Log a handoff task" maxLength={72} value={draft} onValueChange={setDraft} />
        <div className="sink-row"><Button size="sm" type="submit" disabled={!draft.trim()}><Plus aria-hidden /> Add task</Button></div>
      </form>
    </div>
  )
}
