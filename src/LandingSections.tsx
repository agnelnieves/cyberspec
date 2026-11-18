import { LandingAgent } from "./LandingAgent"
import { LandingCTA } from "./LandingCTA"
import { LandingSchedule } from "./LandingSchedule"
import { LandingShowcase } from "./LandingShowcase"
import { LandingTimeline } from "./LandingTimeline"
import "./landing-sections.css"

function LandingSections() {
  return (
    <div className="landing-sections">
      <LandingShowcase />
      <LandingSchedule />
      <LandingTimeline />
      <LandingAgent />
      <LandingCTA />
    </div>
  )
}

export { LandingSections }
