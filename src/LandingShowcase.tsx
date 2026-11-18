import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { SignalGraph } from "@/registry/cyber/ui/signal-graph"
import { Slider } from "@/registry/cyber/ui/slider"
import { Switch } from "@/registry/cyber/ui/switch"
import { Tabs } from "@/registry/cyber/ui/tabs"
import "./landing-showcase.css"

// One sample every two minutes, covering the previous hour.
const metrics = [
  {
    name: "Latency", label: "Response time", unit: "ms", max: 80,
    samples: [22, 24, 23, 27, 25, 26, 28, 46, 32, 30, 23, 26, 24, 22, 24, 31, 29, 34, 56, 41, 32, 34, 30, 27, 29, 33, 46, 39, 36, 32, 34],
  },
  {
    name: "Traffic", label: "Throughput", unit: "Mbps", max: 100,
    samples: [53, 60, 71, 62, 55, 48, 58, 66, 80, 83, 78, 70, 63, 61, 57, 55, 65, 74, 85, 94, 86, 77, 73, 75, 67, 62, 58, 63, 76, 82, 78],
  },
]

function PreviewLink({ name }: { name: "Tabs" | "Slider" | "Switch" }) {
  return (
    <h3 className="showcase-component">
      <a href={`/preview/${name.toLowerCase()}`} aria-label={`Open ${name} preview`}>
        {name}<ArrowUpRight aria-hidden size={17} />
      </a>
    </h3>
  )
}

function LandingShowcase() {
  const [minutes, setMinutes] = useState(40)
  const [grid, setGrid] = useState(true)
  const tabs = metrics.map((metric) => ({
    value: metric.name,
    label: metric.name,
    content: (
      <div className="showcase-chart" data-grid={grid}>
        <SignalGraph
          label={metric.label}
          data={metric.samples.slice(-(minutes / 2 + 1))}
          variant={metric.name === "Latency" ? "line" : "bars"}
          min={0}
          max={metric.max}
          unit={metric.unit}
        />
        <div className="showcase-axis"><span>−{minutes} min</span><span>Now</span></div>
      </div>
    ),
  }))

  return (
    <section id="try-controls" className="landing-showcase" aria-labelledby="showcase-title">
      <h2 id="showcase-title">Try the components.</h2>
      <p className="showcase-intro">Use the controls to explore an hour of sample network activity.</p>
      <div className="showcase-bench">
        <div className="showcase-sample showcase-monitor">
          <PreviewLink name="Tabs" />
          <Tabs label="Sample network activity" defaultValue="Latency" tabs={tabs} />
        </div>
        <div className="showcase-sample">
          <PreviewLink name="Slider" />
          <Slider
            label="Time window"
            value={minutes}
            onValueChange={setMinutes}
            min={10}
            max={60}
            step={10}
            ticks={5}
            format={(value) => `${value} min`}
          />
        </div>
        <div className="showcase-sample">
          <PreviewLink name="Switch" />
          <Switch label="Show grid lines" checked={grid} onCheckedChange={setGrid} />
        </div>
      </div>
    </section>
  )
}

export { LandingShowcase }
