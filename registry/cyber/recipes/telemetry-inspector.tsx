import { useState } from "react"
import { Readout } from "@/registry/cyber/ui/readout"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"
import { SignalGraph } from "@/registry/cyber/ui/signal-graph"
import "./recipe-layout.css"

const channels = {
  Thermal: { unit: "°C", samples: [16, 16, 15, 15, 16, 18, 22, 23, 26, 28, 27, 25, 23, 24, 23, 22, 21, 19, 18, 18, 17, 16, 16, 15] },
  Wind: { unit: "km/h", samples: [4, 7, 8, 6, 4, 5, 7, 11, 10, 6, 5, 7, 14, 18, 11, 13, 8, 6, 5, 8, 6, 5, 4, 3] },
}
type Channel = keyof typeof channels

export default function TelemetryInspector() {
  const [channel, setChannel] = useState<Channel>("Thermal")
  const [period, setPeriod] = useState("24 h")
  const { unit, samples } = channels[channel]
  const window = samples.slice(-parseInt(period, 10))
  const mean = window.reduce((sum, value) => sum + value, 0) / window.length
  return (
    <div className="sink-stack">
      <SegmentedControl<Channel> label="Rooftop sensor" options={["Thermal", "Wind"]} fill value={channel}
        onValueChange={next => next && setChannel(next)} />
      <SignalGraph label={channel === "Thermal" ? "Air temperature" : "Wind speed"} unit={unit} data={window}
        min={0} max={channel === "Thermal" ? 32 : 20} variant={channel === "Wind" ? "bars" : "line"} />
      <div className="sink-row" style={{ gap: "12px 30px" }}>
        <Readout label="Low" size="sm" unit={unit} value={Math.min(...window)} />
        <Readout label="Mean" size="sm" unit={unit} value={mean} precision={1} />
        <Readout label="High" size="sm" unit={unit} value={Math.max(...window)} tone="flag" />
      </div>
      <SegmentedControl label="History" options={["6 h", "12 h", "24 h"]} value={period}
        onValueChange={next => next && setPeriod(next)} />
    </div>
  )
}
