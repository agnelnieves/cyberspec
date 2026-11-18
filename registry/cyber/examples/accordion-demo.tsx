import { Accordion } from "@/registry/cyber/ui/accordion"

export default function AccordionDemo() {
  return (
    <>
      <Accordion
        role="group"
        aria-label="Deck details"
        defaultValue={["core"]}
        items={[
          {
            value: "core",
            label: "Core",
            meta: "12 threads",
            content:
              "Vanta Mk.II, second revision. Twelve threads and 64 units of buffer, enough to hold three daemons in memory and still answer a trace.",
          },
          {
            value: "daemons",
            label: "Daemons",
            meta: "3 loaded",
            content:
              "Ghostwrite, Static Bloom and Null Ping are loaded. Deadlock is on the shelf: it needs a slot this deck doesn't have.",
          },
          {
            value: "firmware",
            label: "Firmware",
            meta: "Sealed",
            disabled: true,
            content: "Sealed by Vanta Systems.",
          },
        ]}
      />
    </>
  )
}
