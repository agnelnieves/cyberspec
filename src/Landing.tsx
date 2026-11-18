import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react"
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
            <a href="/examples" data-kit="button" data-frame="br">View examples <ArrowUpRight aria-hidden /></a>
          </div>
        </div>
        <div className="landing-hero-foot">
          <a href="#try-controls"><ArrowDown aria-hidden /> Try the controls</a>
          <a href="/preview/map" aria-label="Map preview. The globe shows a waypoint in Reykjavík.">
            Map preview <ArrowUpRight aria-hidden />
          </a>
        </div>
      </section>
      <LandingSections />
    </>
  )
}
