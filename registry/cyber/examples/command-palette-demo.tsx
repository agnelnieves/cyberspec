import * as React from "react"
import { Eraser, Radar, Route, Satellite, ShieldOff, Unplug } from "lucide-react"
import { CommandPalette } from "@/registry/cyber/ui/command-palette"

const labels: Record<string, string> = {
  scan: "Scan network",
  route: "Open route",
  uplink: "Raise uplink",
  ghostwrite: "Load Ghostwrite",
  deadlock: "Load Deadlock",
  purge: "Purge cache",
  "jack-out": "Jack out",
}

export default function CommandPaletteDemo() {
  const [last, setLast] = React.useState<string | null>(null)
  return (
    <>
      <CommandPalette
        trigger="Deck shell"
        title="Deck commands"
        placeholder="Run a deck command"
        empty="No such command on this deck."
        code="VANTA MK.II // SHELL 7741-C"
        onAction={setLast}
        commands={[
          {
            label: "Network",
            commands: [
              { value: "scan", label: labels.scan, icon: <Radar aria-hidden />, shortcut: "mod+shift+s", keywords: ["sweep", "ping"] },
              { value: "route", label: labels.route, icon: <Route aria-hidden />, shortcut: "mod+shift+o", keywords: ["path", "map"] },
              { value: "uplink", label: labels.uplink, icon: <Satellite aria-hidden />, disabled: true },
            ],
          },
          {
            label: "Daemons",
            commands: [
              { value: "ghostwrite", label: labels.ghostwrite, icon: <ShieldOff aria-hidden />, keywords: ["stealth"] },
              { value: "deadlock", label: labels.deadlock, icon: <ShieldOff aria-hidden />, keywords: ["freeze"] },
            ],
          },
          {
            label: "Deck",
            commands: [
              {
                value: "purge",
                label: labels.purge,
                icon: <Eraser aria-hidden />,
                shortcut: "mod+shift+x",
                keywords: ["clear", "wipe"],
                confirm: "Erases every cached route and scan on this deck",
              },
              { value: "jack-out", label: labels["jack-out"], icon: <Unplug aria-hidden />, keywords: ["disconnect", "exit"] },
            ],
          },
        ]}
      />
      <p data-kit="hint" role="status">
        {last ? `Ran: ${labels[last]}.` : "Nothing run yet."}
      </p>
    </>
  )
}
