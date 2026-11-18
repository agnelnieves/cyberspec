import { CodeBlock } from "@/registry/cyber/ui/code-block"
import { CopyPrompt } from "./CopyPrompt"
import "./landing-agent.css"

const connectionLog = `"use client"

import { Cyber } from "@/components/ui/cyber"
import { Drawer } from "@/components/ui/drawer"
import { Feed, type FeedItem } from "@/components/ui/feed"

type Props = { events: FeedItem[] }

export function ConnectionLog({ events }: Props) {
  return (
    <Cyber>
      <Drawer trigger="View log" title="Connection log">
        <Feed label="Recent events" items={events} />
      </Drawer>
    </Cyber>
  )
}`

function LandingAgent() {
  return (
    <section id="agents" className="landing-agent" aria-labelledby="landing-agent-title">
      <div className="landing-agent-copy">
        <h2 id="landing-agent-title">Describe your <span>next screen.</span></h2>
        <p>Copy the setup prompt into your coding agent, then describe the screen you want. The prompt shows it how to use CyberSpec’s components.</p>
        <CopyPrompt size="lg" label="Copy prompt to set up CyberSpec with your coding agent" />
      </div>
      <figure className="landing-agent-example">
        <figcaption>
          <span>Example request</span>
          <p>“Add a drawer where I can review recent connection events.”</p>
        </figcaption>
        <CodeBlock language="tsx" filename="ConnectionLog.tsx" label="Connection log component" code={connectionLog} />
      </figure>
    </section>
  )
}

export { LandingAgent }
