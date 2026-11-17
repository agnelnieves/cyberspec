import { Corners, Micro, Ruler } from "@/registry/cyber/ui/micro"
import type { SlotKind } from "@/registry/cyber/blocks/loadout/gear"

// The runner, as a wireframe on a measuring stage. It's decoration: the
// part of the body the selected slot belongs to lights in the signal color,
// which only repeats what the pressed slot and the sheet already say.
//
// Each shape names the regions it belongs to in `data-part`; the stylesheet
// lights the ones matching the stage's `data-region`.
function Figure({ region }: { region: SlotKind | null }) {
  return (
    <div data-loadout-figure="" data-region={region ?? undefined} aria-hidden>
      <Corners size={9} />
      <Ruler vertical data-loadout-figure-rule="" />
      <Micro data-loadout-figure-code="">Subj S.Quinn // Scan 04</Micro>
      <svg viewBox="0 0 200 448" focusable="false">
        {/* Stage: a ground plane and a center line. */}
        <path data-part="stage" d="M100 6v436M36 430 100 416 164 430 100 444Z M60 430 100 421 140 430 100 439Z" />

        <g data-part="head outfit">
          <path d="M100 20 119 31V57L100 68 81 57V31Z" />
          <path d="M81 40H119M88 40 100 52 112 40M92 68 90 80H110L108 68" />
        </g>
        {/* The deck's port, behind the ear, and its lead down the neck. */}
        <g data-part="deck">
          <path d="M125 44 131 38 137 44 131 50ZM131 50V72L118 84" />
        </g>

        <g data-part="chest outfit">
          <path d="M62 84H138L146 100 132 190H68L54 100Z" />
          <path d="M62 84 100 120 138 84M100 120V190M72 150H128M70 168H130" />
          <path d="M54 100 62 114 50 172 38 170ZM146 100 138 114 150 172 162 170Z" />
        </g>
        <g data-part="chest weapon outfit">
          <path d="M38 176 50 178 44 238 32 236ZM162 176 150 178 156 238 168 236Z" />
        </g>
        <g data-part="weapon">
          <path d="M32 242 44 244 40 262 30 258ZM168 242 156 244 160 262 170 258Z" />
        </g>

        <g data-part="legs outfit">
          <path d="M68 196H132L138 226 100 240 62 226Z" />
          <path d="M62 232 96 244 90 320H68ZM138 232 104 244 110 320H132Z" />
          <path d="M68 326H90L86 400H72ZM132 326H110L114 400H128Z" />
          <path d="M70 406H88L92 424H62ZM130 406H112L108 424H138Z" />
          <path d="M72 280H91M128 280H109M73 360H88M127 360H112" />
        </g>
        {/* Quick-access pouches on the belt. */}
        <g data-part="quick">
          <path d="M52 200H62V216H52ZM138 200H148V216H138Z" />
        </g>
      </svg>
      <Micro data-loadout-figure-foot="">Frame 09 // Reflex 07 // Nerve 13</Micro>
    </div>
  )
}

export { Figure }
