import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { LandingGlobe } from "./LandingGlobe"
import { LandingSections } from "./LandingSections"

export default function Landing() {
  return (
    <>
      <section className="landing-hero" aria-labelledby="landing-heading">
        <div className="landing-plot">
          <div className="landing-orbit">
            <div className="landing-earth"><LandingGlobe /></div>
          </div>
        </div>
        <div className="landing-intro">
          <p className="landing-kicker">Open-source React library</p>
          <h1 id="landing-heading">Cyberpunk <span>interfaces.</span></h1>
          <p className="landing-summary">Cut-corner controls, charts, and maps for the web. Pick the components you need and make them your own.</p>
          <div className="landing-actions">
            <a href="/components" data-kit="button" data-frame="br" className="landing-browse">Browse components <ArrowRight aria-hidden /></a>
            <Button cipher data-frame="br" render={<a href="#try-controls" />}>Try the controls <ArrowDown aria-hidden /></Button>
          </div>
        </div>
        <div className="landing-hero-foot">
          <a href="/preview/map" aria-label="Map preview. The globe shows a waypoint in Reykjavík.">
            Map preview <ArrowUpRight aria-hidden />
          </a>
        </div>
      </section>
      <LandingSections />
    </>
  )
}
