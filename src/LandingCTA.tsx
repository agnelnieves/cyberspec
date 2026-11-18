import { useId } from "react"
import { ArrowRight } from "lucide-react"
import { CopyPrompt } from "./CopyPrompt"
import "./LandingCTA.css"

export function LandingCTA() {
  const heading = useId()
  return (
    <section data-landing-cta data-frame="tl br" aria-labelledby={heading}>
      <div data-cta-poster>
        <h2 id={heading}>Build with <strong>CyberSpec</strong></h2>
        <span data-cta-arrow aria-hidden />
      </div>
      <div data-cta-actions>
        <a href="/components#components" aria-label="Browse components in the CyberSpec catalog" data-kit="button" data-tone="primary" data-size="lg" data-frame="br" data-press-flash="">
          Browse components <ArrowRight aria-hidden />
        </a>
        <CopyPrompt tone="secondary" size="lg" label="Copy prompt to build with CyberSpec" />
      </div>
    </section>
  )
}
