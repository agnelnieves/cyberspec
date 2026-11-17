import { HoverCard } from "@/registry/cyber/ui/hover-card"

export default function HoverCardDemo() {
  return (
    <>
      <p data-kit="hint">
        Contract posted by{" "}
        <HoverCard
          name="Mara Voss"
          role="Fixer"
          href="#mara-voss"
          facts={[
            { label: "District", value: "Lowtide" },
            { label: "Jobs cleared", value: "214" },
          ]}
        />
        , with{" "}
        <HoverCard
          name="Ilya Brandt"
          role="Tech"
          href="#ilya-brandt"
          side="top"
          facts={[
            { label: "Crew", value: "Static Saints" },
            { label: "Rate", value: "¤ 900 / hr" },
          ]}
          code="DOSSIER // NODE 3F:A2"
        />{" "}
        on overwatch.
      </p>
    </>
  )
}
