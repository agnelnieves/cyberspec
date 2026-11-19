import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { Feed } from "@/registry/cyber/ui/feed"
import { Tabs } from "@/registry/cyber/ui/tabs"
import "./recipe-layout.css"

const channels = [
  { name: "Studio", messages: [
    { id: "reel", time: "21:10", actor: "Mara Voss", text: "The Glasswater reel is cut. Listen for the bells at the end." },
    { id: "cue", time: "21:12", actor: "Ilya Brandt", text: "Heard them. The reel can go in the late slot." },
  ] },
  { name: "Field", messages: [
    { id: "dock", time: "20:56", actor: "Dex Marlowe", text: "At the south pier. The walkway opens with the first ferry." },
    { id: "crew", time: "21:03", actor: "Sable Quinn", text: "Crew is here. We'll board together." },
  ] },
  { name: "Dispatch", messages: [
    { id: "parcel", time: "20:48", actor: "Juno Okafor", text: "A replacement recorder is waiting at the Lowtide desk." },
  ] },
]

export default function ChannelInbox() {
  const [acknowledged, setAcknowledged] = useState<string[]>([])
  return (
    <Tabs label="Desk channels" defaultValue={channels[0].name} tabs={channels.map(channel => {
      const received = acknowledged.includes(channel.name)
      return {
        value: channel.name, label: channel.name,
        content: <div className="sink-stack">
          <Feed label={`${channel.name} messages`} items={channel.messages} />
          <div className="sink-row">
            <Button size="sm" disabled={received} onClick={() => setAcknowledged(previous => [...previous, channel.name])}>
              <Check aria-hidden /> {received ? "Acknowledged" : "Acknowledge thread"}
            </Button>
          </div>
        </div>,
      }
    })} />
  )
}
