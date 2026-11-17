import { Drawer } from "@/registry/cyber/ui/drawer"

const log = [
  ["22:41:07", "Handshake accepted by NODE 3F:A2."],
  ["22:41:09", "Ghostwrite loaded. Tracer masked."],
  ["22:43:30", "Vanta relay dropped two packets. Resent."],
  ["22:47:12", "Patrol sweep over Cinder Row. Link held."],
  ["22:52:48", "Route to Glasswater cleared."],
  ["22:53:01", "Link stable."],
]

export default function DrawerDemo() {
  return (
    <>
      <Drawer trigger="Signal log" title="Signal log" description="The last six events on this link, oldest first.">
        <ol>
          {log.map(([at, line]) => (
            <li key={at}>
              <time>{at}</time>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </Drawer>
    </>
  )
}
