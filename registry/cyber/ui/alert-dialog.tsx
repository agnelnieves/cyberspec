import * as React from "react"
import { TriangleAlert } from "lucide-react"
import {
  AlertDialog as SdkAlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ui-sdk/react/alert-dialog"
import type { ButtonTone } from "@/registry/cyber/ui/button"
import "@/registry/cyber/ui/cyber/button.css"
import "@/registry/cyber/ui/cyber/dialog.css"
import "@/registry/cyber/ui/cyber/alert-dialog.css"

// A question that has to be answered before anything else happens: the
// dialog's sibling, flagged in yellow, with a hazard spine and a warning
// glyph. Pressing outside does nothing, and it opens with focus on the key
// that backs out.
//
// - `trigger` is the label of the key that opens it; leave it out and
//   control it with `open` and `onOpenChange`, or a `controller`.
// - `confirm` and `cancel` label the keys. `onConfirm` runs on confirm;
//   return a Promise from it and the dialog stays open, its key busy, until
//   the Promise settles (a rejection keeps it open to try again).
// - `agentConfirm` is the sentence an agent has to put to a person before it
//   may press confirm. Without it the description, or the title, is used.
// - `children` go between the description and the keys.
// - `code` is the line of micro-print over the frame.
function AlertDialog({
  trigger,
  triggerTone = "secondary",
  title,
  description,
  confirm = "Confirm",
  cancel = "Cancel",
  onConfirm,
  agentConfirm,
  code = "ALERT 0x3F // ANSWER REQUIRED",
  children,
  ...props
}: Omit<React.ComponentProps<typeof SdkAlertDialog>, "children"> & {
  trigger?: React.ReactNode
  triggerTone?: ButtonTone
  title: string
  description?: string
  confirm?: string
  cancel?: string
  onConfirm?: () => unknown
  agentConfirm?: string
  code?: string
  children?: React.ReactNode
}) {
  return (
    <SdkAlertDialog {...props}>
      {trigger != null && (
        <AlertDialogTrigger data-kit="button" data-frame="notch br" data-press-flash="" data-tone={triggerTone}>
          {trigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogBackdrop data-kit="backdrop" />
      <AlertDialogContent data-kit="alert-dialog">
        <span data-micro aria-hidden>
          {code}
        </span>
        <div data-kit="alert-dialog-surface" data-frame="spine br">
          <span data-kit="alert-dialog-glyph" aria-hidden>
            <TriangleAlert />
          </span>
          <div data-kit="alert-dialog-text">
            <AlertDialogTitle data-kit="alert-dialog-title">{title}</AlertDialogTitle>
            {description && <AlertDialogDescription data-kit="dialog-description">{description}</AlertDialogDescription>}
            {children && <div data-kit="dialog-body">{children}</div>}
          </div>
        </div>
        <div data-kit="actions">
          {/* The way out comes first: it's where focus lands. */}
          <AlertDialogClose data-kit="button" data-frame="notch br" data-press-flash="" data-tone="secondary">
            {cancel}
          </AlertDialogClose>
          <AlertDialogClose
            data-kit="button"
            data-frame="notch br"
            data-press-flash=""
            data-tone="flag"
            data-sfx="confirm"
            data-agent-confirm={agentConfirm ?? description ?? title}
            value="confirm"
            action={onConfirm && (() => onConfirm())}
          >
            {confirm}
          </AlertDialogClose>
        </div>
      </AlertDialogContent>
    </SdkAlertDialog>
  )
}

export { AlertDialog }
