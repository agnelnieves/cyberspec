import * as React from "react"
import { Check, Copy } from "lucide-react"
import { copyText } from "@/registry/cyber/lib/clipboard"
import { Button, type ButtonSize, type ButtonTone } from "@/registry/cyber/ui/button"
import { Textarea } from "@/registry/cyber/ui/textarea"
import { notify } from "@/registry/cyber/ui/toaster"
import { installationPrompt } from "./install"

function CopyPrompt({ tone = "primary", size = "md", label }: { tone?: ButtonTone; size?: ButtonSize; label?: string }) {
  const [state, setState] = React.useState<"idle" | "copied" | "manual">("idle")
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const manual = React.useRef<HTMLTextAreaElement>(null)
  const mounted = React.useRef(true)
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])
  React.useEffect(() => {
    if (state === "manual") {
      manual.current?.focus()
      manual.current?.select()
    }
  }, [state])
  const copy = async () => {
    clearTimeout(timer.current)
    try {
      await copyText(installationPrompt)
      if (!mounted.current) return
      setState("copied")
      notify("Prompt copied", { tone: "success", description: "Paste it into your coding agent." })
      timer.current = setTimeout(() => setState("idle"), 2000)
    } catch {
      if (!mounted.current) return
      setState("manual")
      // A retry can fail while the fallback is already mounted.
      manual.current?.focus()
      manual.current?.select()
    }
  }
  return (
    <>
      <Button cipher tone={tone} size={size} aria-label={state === "copied" ? undefined : label} onClick={copy} data-copy-prompt="" data-sfx="none">
        {state === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
        {state === "copied" ? "Prompt copied" : "Copy Prompt"}
      </Button>
      {state === "manual" && (
        <div data-install-fallback="">
          <p role="alert">Clipboard access is blocked. The prompt is selected below; copy it and paste it into your coding agent.</p>
          <Textarea ref={manual} label="Installation prompt" value={installationPrompt} readOnly autoResize={false} rows={7} data-install-prompt="" />
        </div>
      )}
    </>
  )
}

export { CopyPrompt }
