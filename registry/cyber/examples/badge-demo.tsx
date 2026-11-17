import { Badge } from "@/registry/cyber/ui/badge"

export default function BadgeDemo() {
  return (
    <>
      <Badge tone="flag">New</Badge>
      <Badge>Tracked</Badge>
      <Badge tone="signal">Agent</Badge>
      <Badge tone="rare">Rare</Badge>
      <Badge tone="epic">Epic</Badge>
      <Badge tone="mute">Archived</Badge>
      <Badge tone="ok" status live>
        Online
      </Badge>
      <Badge tone="mute" status>
        No signal
      </Badge>
      <Badge tone="flag" count={3} label="unread messages" />
      <Badge tone="signal" count={42} label="daemons queued" />
      <Badge tone="flag" count={128} label="items in the stash" />
    </>
  )
}
