import { RadioGroup } from "@/registry/cyber/ui/radio-group"

export default function RadioGroupDemo() {
  return (
    <>
      <RadioGroup
        label="Approach"
        defaultValue="quiet"
        options={[
          { value: "quiet", label: "Quiet", hint: "Ghostwrite the door logs. Nobody knows we came." },
          { value: "loud", label: "Loud", hint: "Through the front. Dex keeps the engine running." },
          { value: "talk", label: "Talk", hint: "Needs a broker on the crew.", disabled: true },
        ]}
      />
    </>
  )
}
