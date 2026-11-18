import { LandingAgent } from "./LandingAgent"
import { LandingCTA } from "./LandingCTA"
import { LandingShowcase } from "./LandingShowcase"
import "./landing-sections.css"

function LandingSections() {
  return (
    <div className="landing-sections">
      <LandingShowcase />
      <LandingAgent />
      <LandingCTA />
    </div>
  )
}

export { LandingSections }
