import { Select } from "@/registry/cyber/ui/select"

export default function SelectDemo() {
  return (
    <>
      <Select
        label="District"
        defaultValue="glasswater"
        hint="Sets where the route starts."
        options={[
          {
            label: "Waterline",
            options: [
              { value: "lowtide", label: "Lowtide", code: "LT-04" },
              { value: "glasswater", label: "Glasswater", code: "GW-11" },
            ],
          },
          {
            label: "Inland",
            options: [
              { value: "cinder-row", label: "Cinder Row", code: "CR-02" },
              { value: "stacks", label: "The Stacks", code: "ST-27" },
              { value: "meridian", label: "Meridian Heights", code: "MH-01", disabled: true },
            ],
          },
        ]}
      />
      <Select
        label="Uplink"
        placeholder="No carrier"
        disabled
        options={[{ value: "vanta", label: "Vanta relay" }]}
      />
    </>
  )
}
