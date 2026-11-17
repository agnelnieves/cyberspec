import { GlitchText } from "@/registry/cyber/ui/glitch-text"

export default function GlitchTextDemo() {
  return (
    <div style={{ display: "grid", gap: 6, justifyItems: "start", width: "100%" }}>
      <GlitchText as="strong" decode="view" style={{ fontSize: 34, fontWeight: 700, letterSpacing: "0.04em", lineHeight: 1 }}>
        SIGNAL ACQUIRED
      </GlitchText>
      <GlitchText decode="hover" style={{ color: "var(--cy-signal)" }}>
        Hover to re-key the handshake
      </GlitchText>
    </div>
  )
}
