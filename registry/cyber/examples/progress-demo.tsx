import { Progress } from "@/registry/cyber/ui/progress"

export default function ProgressDemo() {
  return (
    <>
      <Progress label="Decrypting shard" value={62} />
      <Progress label="Tracing uplink" busyLabel="Tracing" />
      <Progress label="Flashing firmware" value={75} variant="thin" />
    </>
  )
}
