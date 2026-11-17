import { installAgentSignal } from "@/registry/cyber/lib/agent-signal"
import { installFx } from "@/registry/cyber/lib/fx"
import { installHaptics } from "@/registry/cyber/lib/haptics"
import { installInputModality } from "@/registry/cyber/lib/input-modality"
import { installSound } from "@/registry/cyber/lib/sound"

// The page-wide behaviors the skin relies on: the FX level, interface sounds,
// haptics, keyboard-or-pointer focus tracking, and the signal shown when an
// agent changes something. Each listens at the document, so they're
// installed once, however many <Cyber> roots there are.
let installed = false

function installCyber() {
  if (installed || typeof document === "undefined") return
  installed = true
  installFx()
  installSound()
  installHaptics()
  installInputModality()
  installAgentSignal()
}

export { installCyber }
