import { ToastKeys } from "@/registry/cyber/ui/toast"
import { Toasts } from "@/registry/cyber/ui/toaster"

export default function ToastDemo() {
  return (
    <>
      <ToastKeys />
      {/* An app mounts this once, at its root. Only the first one mounted
          shows toasts, so this one stands down wherever the page already
          has its own. */}
      <Toasts />
    </>
  )
}
