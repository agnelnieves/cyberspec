import { Slider } from "@/registry/cyber/ui/slider"

export default function SliderDemo() {
  return (
    <>
      <Slider label="Gain" defaultValue={62} />
      <Slider label="Band" defaultValue={[240, 720]} min={0} max={1000} step={10} thumbLabels={["Band floor", "Band ceiling"]} format={(hz) => `${hz} Hz`} />
      <Slider label="Uplink power" defaultValue={35} hint="Held by the relay while the link is down." disabled />
    </>
  )
}
