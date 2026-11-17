import { Car, Cpu, MapPin, Users } from "lucide-react"
import { SideTabs } from "@/registry/cyber/ui/side-tabs"

export default function SideTabsDemo() {
  return (
    <>
      <SideTabs
        label="Archive sections"
        defaultValue="people"
        tabs={[
          {
            value: "people",
            label: "People",
            icon: <Users aria-hidden />,
            content: (
              <>
                <p>Fourteen dossiers. Six are crew, three are brokers, and one hasn't answered a ping since Cinder Row.</p>
                <p>Mara Voss vouches for most of them. Ask her about the rest before you call.</p>
              </>
            ),
          },
          {
            value: "vehicles",
            label: "Vehicles",
            icon: <Car aria-hidden />,
            content: (
              <>
                <p>Two registered, one borrowed. Dex Marlowe keeps the van charged and parked under the Stacks.</p>
                <p>The bike is still in Glasswater. Nobody has gone back for it.</p>
              </>
            ),
          },
          {
            value: "places",
            label: "Places",
            icon: <MapPin aria-hidden />,
            content: (
              <>
                <p>Nine safe addresses across Lowtide and Meridian Heights, sorted by how recently they were swept.</p>
                <p>Anything older than a week reads as unverified.</p>
              </>
            ),
          },
          {
            value: "tech",
            label: "Tech",
            icon: <Cpu aria-hidden />,
            content: (
              <>
                <p>Decks, optics and augments you've handled, with their firmware and who last opened the case.</p>
                <p>The Vanta Mk.II is two revisions behind.</p>
              </>
            ),
          },
        ]}
      />
    </>
  )
}
