import { useEffect, useLayoutEffect, useState } from "react"

type Stage = "boot" | "leaving" | "revealing" | "open"
const sessionKey = "cyberspec:entered"

function initialStage(home: boolean): Stage {
  if (!home) return "open"
  try {
    if (sessionStorage.getItem(sessionKey) === "yes") return "open"
  } catch {}
  return "boot"
}

export function useEntrance(home: boolean, reduced: boolean) {
  const [stage, setStage] = useState(() => initialStage(home))

  useLayoutEffect(() => {
    if (!home && stage !== "open") setStage("open")
    else if (stage === "revealing") document.getElementById("main")?.focus({ preventScroll: true })
  }, [home, stage])

  useEffect(() => {
    if (stage === "leaving") {
      const timer = window.setTimeout(() => setStage("revealing"), reduced ? 0 : 320)
      return () => window.clearTimeout(timer)
    }
    if (stage === "revealing") {
      const timer = window.setTimeout(() => setStage("open"), reduced ? 0 : 930)
      return () => window.clearTimeout(timer)
    }
  }, [reduced, stage])

  function enter() {
    try { sessionStorage.setItem(sessionKey, "yes") } catch {}
    setStage("leaving")
  }

  return {
    showBoot: home && (stage === "boot" || stage === "leaving"),
    entering: home && (stage === "leaving" || stage === "revealing"),
    enter,
  }
}
