import { Breadcrumb } from "@/registry/cyber/ui/breadcrumb"

export default function BreadcrumbDemo() {
  return (
    <>
      <Breadcrumb
        label="Dossier location"
        items={[{ label: "Archive", href: "#archive" }, { label: "People", href: "#people" }, { label: "Mara Voss" }]}
      />
      <Breadcrumb
        label="Contract location"
        items={[
          { label: "Sprawl", href: "#sprawl" },
          { label: "Glasswater", href: "#glasswater" },
          { label: "Relay yard", href: "#relay-yard" },
          { label: "Contracts", href: "#contracts" },
          { label: "Relay sweep" },
        ]}
      />
    </>
  )
}
