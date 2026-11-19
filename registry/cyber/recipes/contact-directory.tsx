import { useState } from "react"
import { Search, Star } from "lucide-react"
import { Avatar } from "@/registry/cyber/ui/avatar"
import { Popover } from "@/registry/cyber/ui/popover"
import { TextField } from "@/registry/cyber/ui/text-field"
import { Toggle } from "@/registry/cyber/ui/toggle"
import "./recipe-layout.css"

const contacts = [
  { name: "Dex Marlowe", role: "Driver", district: "Cinder Row", channel: "Transport 04" },
  { name: "Ilya Brandt", role: "Technician", district: "Glasswater", channel: "Workshop 12" },
  { name: "Juno Okafor", role: "Medic", district: "Lowtide", channel: "Dispatch 06" },
]

export default function ContactDirectory() {
  const [search, setSearch] = useState("")
  const [favorites, setFavorites] = useState<string[]>(["Juno Okafor"])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const term = search.trim().toLowerCase()
  const shown = contacts.filter(person =>
    (!favoritesOnly || favorites.includes(person.name)) &&
    [person.name, person.role, person.district].some(value => value.toLowerCase().includes(term)),
  )

  return (
    <div className="sink-stack">
      <TextField label="Find a contact" placeholder="Name, role or district" icon={<Search aria-hidden />}
        clearable value={search} onValueChange={setSearch} />
      <div className="sink-row"><Toggle size="sm" pressed={favoritesOnly} onPressedChange={setFavoritesOnly}
        icon={<Star aria-hidden />}>Favorites only</Toggle></div>
      <ul className="sink-list" aria-label="Matching contacts">
        {shown.map(person => <li key={person.name} className="sink-item">
            <div className="sink-row"><Avatar name={person.name} size="sm" decorative />
              <div><strong>{person.name}</strong><p className="sink-note">{person.role}</p></div>
            </div>
            <Popover trigger={<>Details<span data-sr-only> for {person.name}</span></>} title={person.name} code="">
              <div className="sink-stack">
                <dl>
                  <div><dt>District</dt><dd>{person.district}</dd></div>
                  <div><dt>Radio channel</dt><dd>{person.channel}</dd></div>
                </dl>
                <Toggle size="sm" pressed={favorites.includes(person.name)} onPressedChange={pressed =>
                  setFavorites(previous => pressed ? [...previous, person.name] : previous.filter(name => name !== person.name))
                } icon={<Star aria-hidden />}>Favorite contact</Toggle>
              </div>
            </Popover>
        </li>)}
      </ul>
      {shown.length === 0 && <p className="sink-note" role="status">No contacts match this filter.</p>}
    </div>
  )
}
