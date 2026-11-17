import { Dialog } from "@/registry/cyber/ui/dialog"

export default function DialogDemo() {
  return (
    <>
      <Dialog
        trigger="Wipe deck"
        title="Wipe this deck and return it to factory firmware?"
        description="Installed daemons, saved routes and seven unassigned upgrade points are erased. This can't be undone from the field."
        confirm="Wipe"
        cancel="Back"
      />
    </>
  )
}
