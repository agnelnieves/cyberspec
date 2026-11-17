import { Rating } from "@/registry/cyber/ui/rating"

export default function RatingDemo() {
  return (
    <>
      <Rating label="Threat" defaultValue={3} levels={["Low", "Guarded", "Elevated", "High", "Severe"]} />
      <Rating label="Heat" defaultValue={1.5} step={0.5} max={4} />
      <Rating label="Clearance" value={2} levels={["Street", "Contract", "Vault"]} max={3} hint="Set by Vanta Systems." disabled />
    </>
  )
}
