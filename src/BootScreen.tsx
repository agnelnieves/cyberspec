import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/registry/cyber/ui/button"
import { Checkbox } from "@/registry/cyber/ui/checkbox"
import { Loader } from "@/registry/cyber/ui/loader"
import "@/registry/cyber/ui/cyber/dialog.css"
import "./boot-screen.css"

const bootDuration = 1900
const startupPhrases = ["Starting interface…"]

export function BootScreen({ reduced, exiting, onEnter }: {
  reduced: boolean
  exiting: boolean
  onEnter: (withMusic: boolean) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const enter = useRef<HTMLButtonElement>(null)
  const entered = useRef(false)
  const [progress, setProgress] = useState(reduced ? 100 : 0)
  const [withMusic, setWithMusic] = useState(true)
  const percent = reduced ? 100 : progress
  const ready = percent === 100

  useLayoutEffect(() => {
    const modal = dialog.current!
    modal.showModal()
    modal.focus({ preventScroll: true })
    return () => modal.close()
  }, [])

  useEffect(() => {
    if (reduced) {
      setProgress(100)
      return
    }
    if (ready || exiting) return
    const start = performance.now()
    const timer = window.setInterval(() => {
      const elapsed = Math.min((performance.now() - start) / bootDuration, 1)
      setProgress(Math.floor(100 * (1 - (1 - elapsed) ** 1.35)))
      if (elapsed === 1) window.clearInterval(timer)
    }, 50)
    return () => window.clearInterval(timer)
  }, [reduced, ready, exiting])

  useEffect(() => {
    if (ready && document.activeElement === dialog.current)
      enter.current?.focus({ preventScroll: true })
  }, [ready])

  function enterSite(music: boolean) {
    if (exiting || entered.current) return
    entered.current = true
    onEnter(music)
  }

  return (
    <dialog ref={dialog} className="boot-screen" data-kit="backdrop" aria-label="Enter CyberSpec"
      data-reduced={reduced} data-exiting={exiting} data-sfx="none" data-sfx-hover="none"
      onCancel={event => { event.preventDefault(); enterSite(false) }}
      onKeyDown={event => {
        event.stopPropagation()
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") event.preventDefault()
        if (ready && event.key === "Enter" && !event.repeat && event.target === dialog.current) {
          event.preventDefault()
          enterSite(withMusic)
        }
      }}
    >
      <div className="boot-registers" aria-hidden="true">
        <i /><i /><i /><i />
      </div>
      <Loader label="CyberSpec" value={percent} phrases={startupPhrases} doneLabel="Interface ready." />
      <div className="boot-actions">
        {ready && <>
          <Checkbox label="Play music" checked={withMusic} onCheckedChange={checked => setWithMusic(checked === true)} />
          <Button ref={enter} className="boot-enter" tone="primary" onClick={() => enterSite(withMusic)}>
            Enter <ArrowRight aria-hidden />
          </Button>
        </>}
      </div>
    </dialog>
  )
}
