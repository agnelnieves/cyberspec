import { Skeleton, SkeletonGroup, SkeletonRow } from "@/registry/cyber/ui/skeleton"

export default function SkeletonDemo() {
  return (
    <>
      <SkeletonGroup label="Decrypting dossier" framed>
        <SkeletonRow>
          <Skeleton shape="tile" width={40} />
          <Skeleton lines={2} />
        </SkeletonRow>
        <Skeleton shape="block" height={76} />
        <Skeleton lines={3} />
      </SkeletonGroup>
    </>
  )
}
