import { Feed, type FeedItem } from "@/registry/cyber/ui/feed"

const events: FeedItem[] = [
  { id: "brief", time: "21:04", actor: "Mara Voss", text: "Posted the job: a ledger out of the Onyx annex in Glasswater." },
  { id: "route", time: "21:19", actor: "Dex Marlowe", text: "Route cleared through Cinder Row. Eleven minutes door to door." },
  { id: "ghostwrite", time: "21:32", actor: "Ghostwrite", text: "Rewrote the badge log for the service lift.", tone: "signal" },
  { id: "trace", time: "21:36", actor: "Vanta relay", text: "Trace detected on node 3F:A2. Link rerouted.", tone: "flag" },
  { id: "inside", time: "21:41", actor: "Sable Quinn", text: "Inside. Fourth floor, east stair." },
]

export default function FeedDemo() {
  return (
    <>
      <Feed label="Job activity" items={events} live />
    </>
  )
}
