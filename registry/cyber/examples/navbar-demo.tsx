import * as React from "react"
import { Navbar, NavbarReadout } from "@/registry/cyber/ui/navbar"

const pages = [
  { href: "#loadout", label: "Loadout" },
  { href: "#augments", label: "Augments" },
  { href: "#jobs", label: "Jobs" },
  { href: "#archive", label: "Archive" },
]

export default function NavbarDemo() {
  // A router would own this. Here the bar keeps its own place, so choosing
  // a page shows the mark move without leaving the catalog.
  const [current, setCurrent] = React.useState("#loadout")
  return (
    <>
      <Navbar
        label="Deck sections"
        leading={
          <>
            <NavbarReadout label="Level" value="12" progress={0.62} />
            <NavbarReadout label="Cred" value="48" tone="ok" progress={0.3} />
          </>
        }
        items={pages.map((page) => ({ ...page, current: page.href === current }))}
        trailing={<NavbarReadout label="Credits" value="¤ 15 240" tone="flag" hideLabel />}
        onNavigate={(item, event) => {
          event.preventDefault()
          setCurrent(item.href)
        }}
      />
    </>
  )
}
