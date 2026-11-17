import { ChoiceList } from "@/registry/cyber/ui/choice-list"

export default function ChoiceListDemo() {
  return (
    <>
      <ChoiceList
        label="Reply to Mara Voss"
        defaultValue="accept"
        options={[
          { value: "accept", label: "Send the route. I'm in." },
          { value: "terms", label: "What does it pay, and who else is on it?" },
          { value: "later", label: "Mid-run. Ask me again after dark." },
          { value: "decline", label: "Not this one, Mara." },
        ]}
      />
    </>
  )
}
