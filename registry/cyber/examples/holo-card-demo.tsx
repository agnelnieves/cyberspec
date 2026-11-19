import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Card } from "@/registry/cyber/ui/card"
import { HoloCard, HoloLayer } from "@/registry/cyber/ui/holo-card"

// The still on the dossier, in three sheets: a survey grid behind, a
// figure cut from flat shapes on the surface, and the lock brackets
// floating over it. Each sheet is drawn past the edges of the field, so
// sliding it never shows where it ends.
function Portrait() {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g data-depth="-1" stroke="var(--cy-line-deco)" strokeWidth="1">
        {Array.from({ length: 15 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 28 - 36} -20V200`} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`h${i}`} d={`M-40 ${i * 28 - 22}H360`} />
        ))}
        <path d="M160 6 230 46v80l-70 40-70-40V46Z" fill="none" stroke="var(--cy-line-ctl)" />
      </g>
      <g data-depth="1">
        <path d="M92 190 110 134l34-16h32l34 16 18 56Z" fill="var(--cy-panel-2)" stroke="var(--cy-ink)" strokeWidth="1.5" />
        <path d="M160 40l27 15.500v31L160 102l-27-15.500v-31Z" fill="var(--cy-panel-2)" stroke="var(--cy-ink)" strokeWidth="1.5" />
        <path d="M133 68h54" stroke="var(--cy-signal)" strokeWidth="4" />
        <path d="M124 150h72M132 162h56" stroke="var(--cy-line-ctl)" strokeWidth="1" />
      </g>
      <g data-depth="3" fill="none" strokeWidth="1.5">
        <path d="M116 44V30h14M190 30h14v14M204 98v14h-14M130 112h-14V98" stroke="var(--cy-signal)" />
        <path d="M214 62h26" stroke="var(--cy-flag)" />
        <path d="M244 58h8v8h-8Z" fill="var(--cy-flag)" stroke="none" />
      </g>
    </svg>
  )
}

export default function HoloCardDemo() {
  return (
    <HoloCard stack={2}>
      <Card
        title="Sable Quinn"
        meta="Runner // Static Saints"
        media={<Portrait />}
        footer={
          <>
            <HoloLayer depth={2}>
              <Badge tone="flag">Tracked</Badge>
            </HoloLayer>
            <Button size="sm" cipher>Open file</Button>
          </>
        }
      >
        Last pinged in Lowtide, carrying a Vanta deck. Pays on time and asks nothing.
      </Card>
    </HoloCard>
  )
}
