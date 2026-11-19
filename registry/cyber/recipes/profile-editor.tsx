import "./recipe-layout.css"
import { useState } from "react"
import { Avatar } from "@/registry/cyber/ui/avatar"
import { Button } from "@/registry/cyber/ui/button"
import { Switch } from "@/registry/cyber/ui/switch"
import { TextField } from "@/registry/cyber/ui/text-field"

export default function ProfileEditor() {
  const [saved, setSaved] = useState({ name: "Mara Voss", available: true })
  const [name, setName] = useState(saved.name)
  const [available, setAvailable] = useState(saved.available)
  const [message, setMessage] = useState("")
  const dirty = name.trim() !== saved.name || available !== saved.available

  return (
    <form className="sink-stack" onSubmit={(event) => {
      event.preventDefault()
      if (!dirty || !name.trim()) return
      setSaved({ name: name.trim(), available })
      setName(name.trim())
      setMessage("Profile updated.")
    }}>
      <div className="sink-row">
        <Avatar name={saved.name} size="lg" decorative shape="hex" />
        <div style={{ minWidth: 0 }}>
          <strong style={{ overflowWrap: "anywhere" }}>{saved.name}</strong>
          <div className="sink-note">{saved.available ? "Available for a shift" : "Off duty"}</div>
        </div>
      </div>
      <TextField label="Display name" value={name} maxLength={32} required onValueChange={(next) => {
        setName(next)
        setMessage("")
      }} />
      <Switch label="Available for a shift" checked={available} onCheckedChange={(next) => {
        setAvailable(next)
        setMessage("")
      }} />
      <div className="sink-row">
        <Button type="submit" size="sm" disabled={!dirty || !name.trim()}>Save profile</Button>
        <span className="sink-note" role="status">{dirty ? "Unsaved changes" : message}</span>
      </div>
    </form>
  )
}
