import { useState } from "react"
import { Send } from "lucide-react"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Select } from "@/registry/cyber/ui/select"
import { Textarea } from "@/registry/cyber/ui/textarea"
import "./recipe-layout.css"

const channels = ["Ferry desk", "Night studio", "All districts"]

export default function BroadcastComposer() {
  const [channel, setChannel] = useState(channels[0])
  const [draft, setDraft] = useState("Last ferry boards at the south pier. Have your pass ready.")
  const [posted, setPosted] = useState<{ channel: string; body: string } | null>(null)

  return (
    <div className="sink-stack">
      <form className="sink-stack" onSubmit={event => {
        event.preventDefault()
        const body = draft.trim()
        if (!body) return
        setPosted({ channel, body })
        setDraft("")
      }}>
        <Select label="Broadcast channel" value={channel} onValueChange={value => { if (value) setChannel(value) }}
          options={channels.map(name => ({ label: name, value: name }))} />
        <Textarea label="Bulletin" value={draft} onValueChange={setDraft} maxLength={160} rows={2}
          placeholder="Write a short bulletin" />
        <div className="sink-row">
          <Button tone="signal" size="sm" type="submit" disabled={!draft.trim()}><Send aria-hidden /> Post bulletin</Button>
        </div>
      </form>
      <div role="status">
        {posted && <div className="sink-stack">
          <div className="sink-row"><Badge tone="ok">Posted</Badge><strong>{posted.channel}</strong></div>
          <p>{posted.body}</p>
        </div>}
      </div>
    </div>
  )
}
