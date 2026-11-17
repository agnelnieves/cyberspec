import * as React from "react"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@ui-sdk/react/alert-dialog"
import "@/registry/cyber/ui/cyber/button.css"
import "@/registry/cyber/ui/cyber/dialog.css"
import "@/registry/cyber/blocks/daemon/daemon.css"
import { daemon, type Hold } from "@/registry/cyber/blocks/daemon/engine"

// The prompt a person sees when an agent asks to do something that needs
// them: a step on a control marked data-agent-confirm, or a press from the
// browser's own agent. Mount it once, at the app's root.
//
// It's marked data-agent-hidden, so the agent that's asking can neither see
// the prompt nor press Allow on it.
function AgentPrompt() {
  const { hold } = React.useSyncExternalStore(daemon.subscribe, daemon.getState)
  // The last request stays on screen while the dialog closes.
  const shown = React.useRef<Hold | null>(null)
  if (hold) shown.current = hold
  const request = hold ?? shown.current
  return (
    <AlertDialog
      open={hold !== null}
      onOpenChange={(open, details) => {
        if (!open) daemon.answer(details.returnValue === "confirm")
      }}
    >
      <AlertDialogBackdrop data-kit="backdrop" />
      <AlertDialogContent data-kit="dialog" data-agent-hidden>
        <span data-micro aria-hidden>
          BRIDGE // PERMISSION REQUEST // HELD
        </span>
        <div data-kit="dialog-surface" data-frame="spine br" data-tone="flag">
          <AlertDialogTitle data-kit="dialog-title">An agent is asking to act</AlertDialogTitle>
          <AlertDialogDescription data-kit="dialog-description">{request?.sentence}</AlertDialogDescription>
          <p data-kit="hint">
            It wants to {request?.step.action} “{request?.step.label ?? request?.step.ref}”. Nothing happens unless you allow it.
          </p>
        </div>
        <div data-kit="actions">
          <AlertDialogClose data-kit="button" data-frame="notch br" data-press-flash="" data-tone="secondary">
            Deny
          </AlertDialogClose>
          <AlertDialogClose value="confirm" data-kit="button" data-frame="notch br" data-press-flash="" data-tone="flag">
            Allow once
          </AlertDialogClose>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { AgentPrompt }
