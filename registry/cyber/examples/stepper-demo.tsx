import { Stepper } from "@/registry/cyber/ui/stepper"

export default function StepperDemo() {
  return (
    <>
      <Stepper label="Frame" defaultValue={9} min={3} max={20} wheel hint="Focus the value and use the wheel to adjust." />
      <Stepper label="Reflex" defaultValue={3} min={3} max={20} />
      <Stepper label="Edge" defaultValue={6} min={3} max={20} hint="Locked until the next tier." disabled />
    </>
  )
}
