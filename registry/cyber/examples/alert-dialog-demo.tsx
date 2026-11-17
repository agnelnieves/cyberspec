import { AlertDialog } from "@/registry/cyber/ui/alert-dialog"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function AlertDialogDemo() {
  return (
    <>
      <AlertDialog
        trigger="Burn identity"
        title="Burn this identity?"
        description="The Glasswater alias, its credit line and every door it opens are revoked across the Sprawl. A burned identity can't be reissued."
        confirm="Burn"
        cancel="Keep"
        agentConfirm="Permanently burns the Glasswater identity, its credit line and its access."
        pendingAnnouncement="Burning identity"
        onConfirm={() => wait(1200)}
      />
    </>
  )
}
