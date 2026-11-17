#!/usr/bin/env bun
// Run against the dev server: bun scripts/sound-check.mjs
// Only modal duration/lifecycle checks: bun scripts/sound-check.mjs --timing-only
// Observe actual Web Audio nodes while driving controls in headless Chrome.
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import puppeteer from "puppeteer-core"

const base = (process.env.CYBERSPEC_URL || "http://localhost:5720").replace(/\/$/, "")
const chrome = process.env.CHROME_PATH || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find(existsSync)
assert(chrome, "Chrome not found; set CHROME_PATH")
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--mute-audio", "--autoplay-policy=no-user-gesture-required"] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const errors = []
const timingOnly = process.argv.includes("--timing-only")
page.on("pageerror", (error) => errors.push(error.message))
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let checks = 0
const pass = (name) => { checks++; console.log(`ok ${checks} - ${name}`) }

await page.evaluateOnNewDocument(() => {
  localStorage.setItem("cyberspec:sound", "on")
  localStorage.setItem("cyberspec:fx", "off")
  const log = { events: [], loops: new Set(), buffers: new Map(), next: 0 }
  window.audioCheck = log
  const ids = new WeakMap()
  const plays = new Map()
  const signatures = new WeakMap()
  const signature = (buffer) => {
    if (!buffer) return "none"
    if (!signatures.has(buffer)) {
      const data = buffer.getChannelData(0)
      let hash = 2166136261
      for (let i = 0; i < data.length; i += 31) hash = Math.imul(hash ^ Math.round(data[i] * 32768), 16777619)
      const key = `${buffer.length}:${buffer.sampleRate}:${hash >>> 0}`
      signatures.set(buffer, key)
      log.buffers.set(key, buffer)
    }
    return signatures.get(buffer)
  }
  const start = AudioBufferSourceNode.prototype.start
  AudioBufferSourceNode.prototype.start = function (...args) {
    const id = ++log.next
    ids.set(this, id)
    const at = performance.now()
    const play = { kind: "buffer", id, loop: this.loop, signature: signature(this.buffer), at,
      duration: this.buffer?.duration, rate: this.playbackRate.value,
      startsAt: at + (Math.max(this.context.currentTime, args[0] || 0) - this.context.currentTime) * 1000 }
    plays.set(id, play)
    log.events.push(play)
    if (this.loop) log.loops.add(id)
    this.addEventListener("ended", () => { log.loops.delete(id); play.endedAt = performance.now() }, { once: true })
    return start.apply(this, args)
  }
  const stop = AudioBufferSourceNode.prototype.stop
  AudioBufferSourceNode.prototype.stop = function (...args) {
    const id = ids.get(this)
    const play = plays.get(id)
    if (play) play.stopsAt = performance.now() + (Math.max(this.context.currentTime, args[0] || 0) - this.context.currentTime) * 1000
    log.events.push({ kind: "stop", id, at: performance.now() })
    log.loops.delete(id)
    return stop.apply(this, args)
  }
  const oscillate = OscillatorNode.prototype.start
  OscillatorNode.prototype.start = function (...args) {
    log.events.push({ kind: "oscillator", at: performance.now() })
    return oscillate.apply(this, args)
  }
})

const clear = () => page.evaluate(() => { window.audioCheck.events = [] })
const events = () => page.evaluate(() => window.audioCheck.events)
const active = () => page.evaluate(() => window.audioCheck.loops.size)
const open = async (route) => {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle0" })
  await page.evaluate(async () => {
    // Vite may add an HMR timestamp to imports even after a full reload.
    // Reuse the exact loaded module so the test controls the UI's audio bus.
    const loaded = performance.getEntriesByType("resource").filter((entry) => new URL(entry.name).pathname === "/registry/cyber/lib/sound.ts").at(-1)
    window.sound = await import(loaded?.name || "/registry/cyber/lib/sound.ts")
    window.sound.setSoundEnabled(true)
    await document.fonts.ready
  })
  await pause(50)
}
const hover = async (selector) => {
  await page.mouse.move(2, 2)
  await pause(30)
  await clear()
  await page.hover(selector)
  await pause(30)
}
const click = async (selector) => {
  await hover(selector)
  await clear()
  await page.click(selector)
  await pause(40)
}
const onlySample = async (signature, label) => {
  const heard = (await events()).filter((event) => event.kind !== "stop")
  assert.equal(heard.length, 1, `${label}: exactly one sound, got ${JSON.stringify(heard)}`)
  assert.equal(heard[0].signature, signature, `${label}: expected sample`)
  assert.equal(heard[0].loop, false, `${label}: one-shot`)
}
const center = async (selector) => {
  const handle = await page.$(selector)
  assert(handle, `Missing ${selector}`)
  const box = await handle.boundingBox()
  assert(box, `Hidden ${selector}`)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}
const drag = async (selector, dx = 35) => {
  const point = await center(selector)
  await page.mouse.move(point.x, point.y)
  await clear()
  await page.mouse.down()
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(point.x + dx * i / 5, point.y)
    await pause(12)
  }
  return point
}

try {
  await open("/preview/button-group")
  const signatures = {}
  for (const voice of ["hover", "increment", "decrement", "on", "off", "press", "modal-open", "modal-close"]) {
    await clear()
    await page.evaluate((voice) => window.sound.sfx(voice), voice)
    await pause(40)
    const heard = (await events()).filter((event) => event.kind !== "stop")
    assert.equal(heard.length, 1, `${voice} is one sampled sound`)
    assert.equal(heard[0].kind, "buffer")
    signatures[voice] = heard[0].signature
  }
  assert.equal(new Set(Object.values(signatures)).size, 8, "Each sampled voice has its own recording or reversed waveform")
  pass("eight distinct one-shot voices decode and play")
  const modalSamples = await page.evaluate(async (closing) => {
    const loaded = performance.getEntriesByType("resource").filter((entry) => new URL(entry.name).pathname === "/registry/cyber/lib/sound-samples.ts").at(-1)
    const { soundSamples } = await import(loaded?.name || "/registry/cyber/lib/sound-samples.ts")
    const decode = (sample) => {
      const raw = atob(sample.pcm)
      return Float32Array.from({ length: raw.length / 2 }, (_, index) => {
        const value = raw.charCodeAt(index * 2) | raw.charCodeAt(index * 2 + 1) << 8
        return (value >= 0x8000 ? value - 0x10000 : value) / 0x8000
      })
    }
    const signature = (data, rate) => {
      let hash = 2166136261
      for (let i = 0; i < data.length; i += 31) hash = Math.imul(hash ^ Math.round(data[i] * 32768), 16777619)
      return `${data.length}:${rate}:${hash >>> 0}`
    }
    const keys = ["modalOpen", "modalCloseBase", "drawerOpen", "drawerCloseBase", "drawerCloseShortBase"]
    const result = Object.fromEntries(keys.map((key) => [key, { signature: signature(decode(soundSamples[key]), soundSamples[key].sampleRate), duration: decode(soundSamples[key]).length / soundSamples[key].sampleRate }]))
    for (const [key, base] of [["modalClose", "modalCloseBase"], ["drawerClose", "drawerCloseBase"], ["drawerCloseShort", "drawerCloseShortBase"]]) {
      result[key] = { signature: signature(decode(soundSamples[base]).reverse(), soundSamples[base].sampleRate), duration: result[base].duration }
    }
    const base = decode(soundSamples.modalCloseBase)
    const actual = window.audioCheck.buffers.get(closing).getChannelData(0)
    result.exactReverse = base.length === actual.length && base.every((value, index) => value === actual[actual.length - 1 - index])
    return result
  }, signatures["modal-close"])
  assert(modalSamples.exactReverse, "Dialog close exactly reverses its pitch-preserved 150ms base")
  const openingSignatures = new Set([modalSamples.modalOpen.signature, modalSamples.drawerOpen.signature, modalSamples.modalCloseBase.signature])
  const closingSignatures = new Set([modalSamples.modalClose.signature, modalSamples.drawerClose.signature, modalSamples.drawerCloseShort.signature])
  const modalSounds = async () => (await events()).filter((event) => openingSignatures.has(event.signature) || closingSignatures.has(event.signature))
  const oneModal = async (voice, label) => {
    const heard = await modalSounds()
    assert.equal(heard.length, 1, `${label}: one content transition, got ${JSON.stringify(heard)}`)
    assert((voice === "modal-open" ? openingSignatures : closingSignatures).has(heard[0].signature), `${label}: correct direction`)
  }
  pass("modal close exactly reverses the compressed closing recording")

  // Full-motion timing is deliberately measured separately from the rest
  // of the suite. The default fixture uses FX off for deterministic input.
  const startProbe = async (route) => page.evaluate((route) => {
    const probe = { at: performance.now(), frames: [], animations: [] }
    window.modalTiming = probe
    const seen = new WeakSet()
    let running = true
    window.endModalTiming = () => { running = false; return probe }
    const frame = () => {
      if (!running) return
      const node = document.querySelector(`[data-slot="${route}-content"]`)
      const at = performance.now()
      if (node) {
        const rect = node.getBoundingClientRect()
        const side = node.getAttribute("data-side")
        const position = side === "right" ? 1 - (rect.left - (innerWidth - rect.width)) / rect.width
          : side === "bottom" ? 1 - (rect.top - (innerHeight - rect.height)) / rect.height : null
        probe.frames.push({ at, position, open: node.hasAttribute("data-open") })
        for (const animation of node.getAnimations()) {
          if (seen.has(animation)) continue
          seen.add(animation)
          const timing = animation.effect?.getComputedTiming()
          if (!timing || timing.iterations === Infinity) continue
          const info = { duration: timing.duration, name: animation.animationName || "WAAPI", keyframes: animation.effect?.getKeyframes() }
          probe.animations.push(info)
          animation.finished.then(() => { info.finishedAt = performance.now() }, () => {})
        }
      } else probe.frames.push({ at, absent: true })
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, route)
  for (const mobile of [false, true]) {
    await page.setViewport(mobile ? { width: 390, height: 844, isMobile: true, hasTouch: true } : { width: 1280, height: 900 })
    for (const route of ["dialog", "alert-dialog", "drawer"]) {
      await open(`/preview/${route}`)
      await page.evaluate(() => { document.querySelector('[data-skin="cyber"]').dataset.fx = "full" })
      for (const phase of ["open", "close"]) {
        const selector = `[data-slot="${route}-${phase === "open" ? "trigger" : "close"}"]`
        await hover(selector)
        await clear()
        await startProbe(route)
        await page.click(selector)
        await pause(680)
        const probe = await page.evaluate(() => window.endModalTiming())
        const heard = await modalSounds()
        assert.equal(heard.length, 1, `${route} ${phase}: one timed modal sample`)
        const play = heard[0]
        const key = route === "drawer" ? (phase === "open" ? "drawerOpen" : mobile ? "drawerCloseShort" : "drawerClose") : (phase === "open" ? "modalOpen" : "modalClose")
        assert.equal(play.signature, modalSamples[key].signature, `${route} ${phase}: expected duration variant`)
        const expected = route === "drawer" ? (phase === "open" ? 350 : mobile ? 180 : 240) : phase === "open" ? 280 : 150
        assert(Math.abs(play.duration * 1000 / play.rate - expected) <= 1, `${route} ${phase}: ${expected}ms at original pitch`)
        assert.equal(play.rate, 1, `${route} ${phase}: no playback pitch shift`)
        if (phase === "close") {
          const base = route === "drawer" ? (mobile ? "drawerCloseShortBase" : "drawerCloseBase") : "modalCloseBase"
          const exact = await page.evaluate(async ({ base, signature }) => {
            const loaded = performance.getEntriesByType("resource").filter((entry) => new URL(entry.name).pathname === "/registry/cyber/lib/sound-samples.ts").at(-1)
            const { soundSamples } = await import(loaded?.name || "/registry/cyber/lib/sound-samples.ts")
            const bytes = atob(soundSamples[base].pcm)
            const actual = window.audioCheck.buffers.get(signature).getChannelData(0)
            return actual.length === bytes.length / 2 && actual.every((value, index) => {
              const at = (actual.length - 1 - index) * 2
              const signed = bytes.charCodeAt(at) | bytes.charCodeAt(at + 1) << 8
              return value === (signed >= 0x8000 ? signed - 0x10000 : signed) / 0x8000
            })
          }, { base, signature: play.signature })
          assert(exact, `${route} close reverses every sample of its compressed base`)
        }
        assert(play.endedAt && play.endedAt <= play.startsAt + expected + 100, `${route} ${phase}: playback ends promptly`)
        assert(!(await events()).some((event) => event.signature === signatures.press), `${route} ${phase}: no longer button-press tail`)
        if (route !== "drawer") {
          assert(probe.animations.some((animation) => animation.duration === expected), `${route} ${phase}: existing CSS duration unchanged`)
        } else {
          assert(probe.animations.some((animation) => animation.name === "WAAPI" && animation.duration >= 450 && animation.duration <= 550), "Drawer retains its existing spring")
          if (phase === "close") {
            const invisible = probe.frames.find((frame) => frame.position != null && frame.position <= 0)
            assert(invisible, "Drawer travels fully out of view")
            assert(play.startsAt + expected <= invisible.at + 80, "Drawer closing sound does not follow the invisible spring tail")
          }
        }
      }
      pass(`${mobile ? "mobile" : "desktop"} ${route}: sound timing follows existing visuals without a press tail`)
    }
  }
  await page.setViewport({ width: 1280, height: 900 })
  for (const quiet of ["off", "reduced"]) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: quiet === "reduced" ? "reduce" : "no-preference" }])
    for (const route of ["dialog", "drawer"]) {
      await open(`/preview/${route}`)
      await page.evaluate((quiet) => { document.querySelector('[data-skin="cyber"]').dataset.fx = quiet === "off" ? "off" : "full" }, quiet)
      for (const phase of ["open", "close"]) {
        await click(`[data-slot="${route}-${phase === "open" ? "trigger" : "close"}"]`)
        await pause(200)
        const heard = await modalSounds()
        assert.equal(heard.length, 1, `${route} ${quiet} ${phase}: one short feedback sound`)
        assert.equal(heard[0].signature, modalSamples[phase === "open" ? "modalCloseBase" : "modalClose"].signature)
        assert(Math.abs(heard[0].duration * 1000 - 150) <= 1, "Quiet motion uses 150ms feedback")
        await pause(400)
      }
    }
    pass(`${quiet}: dialogs and drawers use short feedback without stretching motion`)
  }
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }])

  await open("/preview/dialog")
  await page.evaluate(() => { document.querySelector('[data-skin="cyber"]').dataset.fx = "full" })
  await click('[data-slot="dialog-trigger"]')
  await pause(35)
  await page.evaluate(() => document.querySelector('[data-slot="dialog-close"]').click())
  await pause(60)
  await page.evaluate(() => document.querySelector('[data-slot="dialog-trigger"]').click())
  await pause(350)
  const reversal = await modalSounds()
  assert.equal(reversal.length, 3, "Rapid opening, closing and reopening each produce one cue")
  assert(reversal[0].stopsAt <= reversal[1].startsAt + 12, "Close fades the unfinished opening cue")
  assert(reversal[1].stopsAt <= reversal[2].startsAt + 12, "Reopen fades the unfinished closing cue")
  pass("rapid reversals replace the previous modal cue promptly")
  await page.keyboard.press("Escape")
  await pause(250)
  await click('[data-slot="dialog-trigger"]')
  await page.evaluate(() => window.sound.setSoundEnabled(false))
  const muted = await modalSounds()
  assert(muted[0].stopsAt < muted[0].startsAt + 100, "Muting stops the active modal cue")
  pass("muting stops the active modal cue immediately")

  await open("/preview/drawer")
  await page.evaluate(() => { document.querySelector('[data-skin="cyber"]').dataset.fx = "full" })
  await click('[data-slot="drawer-trigger"]')
  await pause(45)
  const grab = await page.$eval('[data-slot="drawer-content"]', (node) => {
    const rect = node.getBoundingClientRect()
    return { x: Math.min(innerWidth - 25, rect.left + 25), y: rect.top + 170 }
  })
  await page.mouse.move(grab.x, grab.y)
  await page.mouse.down()
  await page.mouse.move(grab.x + 15, grab.y, { steps: 3 })
  await pause(25)
  const dragged = await modalSounds()
  assert(dragged[0]?.stopsAt < dragged[0]?.startsAt + 350, "Grabbing a drawer cancels its unfinished opening cue")
  await page.mouse.up()
  pass("drawer dragging cancels the old transition cue")

  if (!timingOnly) {
    await open("/preview/button-group")
    await clear()
    await page.evaluate(() => { window.sound.sfx("hover"); window.sound.sfx("hover") })
    await onlySample(signatures.hover, "duplicate suppression")
    pass("duplicate playback from one event remains suppressed")

    await hover('[aria-label="Zoom out"]')
    await onlySample(signatures.hover, "RepeatKey hover")
    pass("repeating controls retain the shared hover despite click suppression")
    for (const [label, voice] of [["Zoom out", "decrement"], ["Zoom in", "increment"], ["Floor up", "increment"], ["Floor down", "decrement"]]) {
      await click(`[aria-label="${label}"]`)
      await onlySample(signatures[voice], label)
    }
    pass("Zoom and Floor directions produce one correct sample per click")

    await page.focus('[aria-label="Zoom in"]')
    await clear()
    await page.keyboard.press("Enter")
    await pause(50)
    await onlySample(signatures.increment, "keyboard repeat key")
    await page.focus('[aria-label="Floor down"]')
    await clear()
    await page.keyboard.press("Space")
    await pause(50)
    await onlySample(signatures.decrement, "keyboard ordinary key")
    pass("keyboard activation preserves direction without duplicate click audio")

    await click('[aria-label="Floor down"]')
    await clear()
    await page.click('[aria-label="Floor down"]')
    assert(!(await events()).some((event) => event.kind === "buffer" && event.signature === signatures.decrement), "Floor bound produces no successful decrement")
    const zoomOut = await center('[aria-label="Zoom out"]')
    await page.mouse.move(zoomOut.x, zoomOut.y)
    await clear()
    await page.mouse.down()
    await pause(1850)
    const repeated = (await events()).filter((event) => event.signature === signatures.decrement)
    assert(repeated.length > 4, "hold repeats directional sample")
    await clear()
    await pause(250)
    assert(!(await events()).some((event) => event.signature === signatures.decrement), "hold stops at zoom bound")
    await page.mouse.up()
    pass("held repeats stop at bounds; disabled directions do not report success")

    await open("/preview/button")
    await click('[data-kit="button"][data-tone="secondary"]')
    await onlySample(signatures.press, "ordinary button press")
    await page.focus('[data-kit="button"][data-tone="secondary"]')
    await clear()
    await page.keyboard.press("Enter")
    await pause(40)
    await onlySample(signatures.press, "ordinary keyboard press")
    await click('[data-kit="button"][data-tone="primary"]')
    assert(!(await events()).some((event) => event.signature === signatures.press), "Primary confirm retains its separate voice")
    assert((await events()).some((event) => event.kind === "oscillator"), "Primary confirm remains synthesized")
    pass("ordinary buttons use sampled press; primary confirm remains separate")

    for (const route of ["dialog", "alert-dialog", "drawer"]) {
      await open(`/preview/${route}`)
      // Exercise real exit attributes as well as node removal, with motion on.
      await page.evaluate(() => { document.querySelector('[data-skin="cyber"]').dataset.fx = "full" })
      const trigger = `[data-slot="${route}-trigger"]`
      const content = `[data-slot="${route}-content"]`
      const close = `[data-slot="${route}-close"]`
      assert.equal(await page.$(content), null, `${route}: first opening mounts new content`)
      await click(trigger)
      await page.waitForSelector(`${content}[data-open]`, { visible: true })
      await oneModal("modal-open", `${route} first mount`)
      assert(!(await events()).some((event) => event.kind === "oscillator"), `${route}: backdrop does not add the generic synthesized open`)
      await pause(350)
      await clear()
      await page.$eval(content, (node) => node.setAttribute("data-open", ""))
      await pause(40)
      assert.equal((await modalSounds()).length, 0, `${route}: unchanged open state is silent`)
      await click(close)
      await oneModal("modal-close", `${route} close button`)
      await pause(650)
      await oneModal("modal-close", `${route} exit and removal`)
      pass(`${route}: first mount, close, backdrop and exit removal produce one transition each`)

      await click(trigger)
      await page.waitForSelector(`${content}[data-open]`, { visible: true })
      await oneModal("modal-open", `${route} reopen`)
      await pause(350)
      await clear()
      await page.keyboard.press("Escape")
      await pause(50)
      await oneModal("modal-close", `${route} Escape`)
      await pause(650)
      await oneModal("modal-close", `${route} Escape exit`)
      pass(`${route}: reopening and Escape use the forward and reversed recordings`)

      await click(trigger)
      await page.waitForSelector(`${content}[data-open]`, { visible: true })
      await pause(350)
      await clear()
      await page.mouse.click(20, 200)
      await pause(50)
      if (route === "alert-dialog") {
        assert.equal((await modalSounds()).length, 0, "Alert dialog ignores backdrop without a close sound")
        assert(await page.$(`${content}[data-open]`), "Alert dialog stays open on backdrop")
        await click(`${content} [data-sfx="confirm"]`)
        await pause(200)
        assert.equal((await modalSounds()).length, 0, "Pending confirmation has no premature close sound")
        await pause(1300)
        await oneModal("modal-close", "Alert dialog accepted async confirmation")
        pass("alert-dialog: ignored backdrop and pending confirmation stay silent until close")
      } else {
        await oneModal("modal-close", `${route} backdrop dismissal`)
        await pause(650)
        await oneModal("modal-close", `${route} backdrop exit`)
        pass(`${route}: backdrop dismissal plays the reversed recording once`)
      }
    }

    await open("/preview/popover")
    await click('[data-slot="popover-trigger"]')
    assert.equal((await modalSounds()).length, 0, "Small popovers do not use the modal recording")
    assert((await events()).some((event) => event.kind === "oscillator"), "Small popovers retain the generic synthesized open")
    await clear()
    await page.keyboard.press("Escape")
    await pause(50)
    assert.equal((await modalSounds()).length, 0, "Small popover closing stays separate")
    assert((await events()).some((event) => event.kind === "oscillator"), "Small popovers retain the generic synthesized close")
    pass("small popovers keep their existing synthesized open/close voices")

    for (const { route, selector, first, state, disabled } of [
      { route: "checkbox", selector: '[data-kit="checkbox"]', first: "off", state: "aria-checked", disabled: '[data-kit="checkbox"][data-disabled]' },
      { route: "switch", selector: '[data-kit="switch"]', first: "off", state: "aria-checked", disabled: '[data-kit="switch"][data-disabled]' },
      { route: "toggle", selector: '[aria-label="Torch"]', first: "on", state: "aria-pressed", disabled: '[data-kit="toggle"][data-disabled]' },
      { route: "password-input", selector: '[aria-label="Show passphrase"]', first: "on", state: "aria-pressed", disabled: '[data-kit="password-input-toggle"][data-disabled]' },
    ]) {
      await open(`/preview/${route}`)
      for (const voice of [first, first === "on" ? "off" : "on"]) {
        await click(selector)
        await onlySample(signatures[voice], `${route} ${voice}`)
        assert.equal(await page.$eval(selector, (node, state) => node.getAttribute(state), state), voice === "on" ? "true" : "false", `${route}: sound matches resulting state`)
      }
      await page.focus(selector)
      for (const voice of [first, first === "on" ? "off" : "on"]) {
        await clear()
        await page.keyboard.press("Space")
        await pause(40)
        await onlySample(signatures[voice], `${route} keyboard ${voice}`)
      }
      assert(await page.$(disabled), `${route}: disabled test target exists`)
      await click(disabled)
      assert(!(await events()).some((event) => event.signature === signatures.on || event.signature === signatures.off), `${route}: disabled control does not toggle sound`)
      pass(`${route}: sampled on/off follows pointer and keyboard state; disabled stays quiet`)
    }

    for (const [route, label] of [["checkbox", '[data-kit="checkbox-label"]'], ["switch", '[data-kit="switch-row"] > [data-kit="label"]']]) {
      await open(`/preview/${route}`)
      await click(label)
      await onlySample(signatures.off, `${route} label off`)
      await click(label)
      await onlySample(signatures.on, `${route} label on`)
    }
    pass("checkbox and switch label clicks also play one correct on/off recording")

    await open("/preview/toggle-group")
    const layer = '[data-kit="toggle-group"]:nth-child(2) [data-kit="toggle"]'
    await click(layer)
    await onlySample(signatures.off, "multiple ToggleGroup off")
    await click(layer)
    await onlySample(signatures.on, "multiple ToggleGroup on")
    pass("multiple ToggleGroup layers share the on/off recordings")

    await open("/preview/menu")
    await click('[data-slot="menu-trigger"]')
    await page.waitForSelector('[role="menuitemcheckbox"]', { visible: true })
    const menuCheck = '[role="menuitemcheckbox"]'
    await click(menuCheck)
    await onlySample(signatures.off, "menu checkbox off")
    await click(menuCheck)
    await onlySample(signatures.on, "menu checkbox on")
    await page.focus(menuCheck)
    await clear()
    await page.keyboard.press("Space")
    await pause(40)
    assert.equal(await page.$eval(menuCheck, (node) => node.getAttribute("aria-checked")), "false", "menu Space changes the checked state")
    await onlySample(signatures.off, "menu checkbox keyboard off")
    await clear()
    await page.keyboard.press("Enter")
    await pause(40)
    assert.equal(await page.$eval(menuCheck, (node) => node.getAttribute("aria-checked")), "true", "menu Enter changes the checked state")
    await onlySample(signatures.on, "menu checkbox keyboard on")
    pass("checkable menu rows share on/off for pointer and keyboard activation")

    await open("/preview/stepper")
    await hover('[aria-label="Increase Frame"]')
    await onlySample(signatures.hover, "Stepper hover")
    await click('[aria-label="Increase Frame"]')
    await onlySample(signatures.increment, "Stepper plus")
    await click('[aria-label="Decrease Frame"]')
    await onlySample(signatures.decrement, "Stepper minus")
    await page.focus('[data-kit="stepper-value"]')
    for (const [key, voice] of [["ArrowUp", "increment"], ["ArrowDown", "decrement"]]) {
      await clear()
      await page.keyboard.press(key)
      await pause(40)
      await onlySample(signatures[voice], `Stepper ${key}`)
    }
    await clear()
    await page.click('[aria-label="Decrease Reflex"]')
    assert(!(await events()).some((event) => event.signature === signatures.decrement), "Stepper at minimum has no decrement")
    pass("Stepper hover, pointer, arrows and minimum boundary")

    await page.focus('[data-kit="stepper-value"]')
    const wheelPoint = await center('[data-kit="stepper-value"]')
    await page.mouse.move(wheelPoint.x, wheelPoint.y)
    await clear()
    await page.mouse.wheel({ deltaY: -40 })
    await pause(20)
    assert.equal(await active(), 1, "Stepper wheel starts ticking")
    assert(!(await events()).some((event) => Object.values(signatures).includes(event.signature)), "Wheel uses the ticking loop, not directional samples")
    await pause(180)
    assert.equal(await active(), 0, "Wheel stops when scrolling ends")
    pass("Stepper wheel uses continuous ticking and stops on inactivity")

    for (const [route, selector] of [["resizable", '[data-kit="resizable-handle"]'], ["slider", '[data-kit="slider-thumb"]']]) {
      await open(`/preview/${route}`)
      await page.focus(route === "slider" ? `${selector} input` : selector)
      await clear()
      await page.keyboard.press("ArrowRight")
      await pause(40)
      await onlySample(signatures.hover, `${route} keyboard tick`)
      assert.equal(await active(), 0, `${route}: discrete keys do not start a loop`)
      pass(`${route}: keyboard adjustments play a complete recorded tick`)
      let point = await drag(selector)
      assert.equal(await active(), 1, `${route}: one loop during movement`)
      assert(!(await events()).some((event) => Object.values(signatures).includes(event.signature)), `${route}: no directional or hover sample while dragging`)
      await pause(180)
      assert.equal(await active(), 0, `${route}: stationary hold stops loop`)
      await page.mouse.move(point.x + 42, point.y)
      assert.equal(await active(), 1, `${route}: moving again restarts loop`)
      await page.mouse.up()
      await pause(20)
      assert.equal(await active(), 0, `${route}: release stops promptly`)
      pass(`${route}: ticking only during movement, restart and prompt release`)

      point = await drag(selector, -25)
      await page.evaluate(() => window.sound.setSoundEnabled(false))
      assert.equal(await active(), 0, `${route}: mute stops immediately`)
      await clear()
      await page.mouse.move(point.x - 32, point.y)
      assert(!(await events()).some((event) => event.kind === "buffer"), `${route}: movement stays silent while muted`)
      await page.mouse.up()
      await page.evaluate(() => window.sound.setSoundEnabled(true))
      await drag(selector, 20)
      await page.evaluate(() => window.dispatchEvent(new Event("blur")))
      assert.equal(await active(), 0, `${route}: blur stops immediately`)
      await page.mouse.up()
      pass(`${route}: mute and window blur stop playback`)

      await drag(selector, -20)
      await page.evaluate((selector) => document.querySelector(selector).dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 1, pointerType: "mouse" })), selector)
      assert.equal(await active(), 0, `${route}: cancel stops immediately`)
      await page.mouse.up()
      await drag(selector, 20)
      await page.evaluate(() => {
        history.pushState(null, "", "/preview/button")
        dispatchEvent(new Event("cyberspec:navigate"))
      })
      await pause(20)
      assert.equal(await active(), 0, `${route}: unmount stops promptly`)
      await page.mouse.up()
      pass(`${route}: pointer cancellation and component unmount stop playback`)
    }

    // Mount real wrappers with consumer cancellation and callbacks. This catches
    // audio playing before the consumer accepts a change, which demos cannot.
    await open("/preview/button")
    await page.evaluate(async () => {
      const loaded = (pathname) => performance.getEntriesByType("resource").filter((entry) => new URL(entry.name).pathname === pathname).at(-1)?.name || pathname
      const reactModule = await import(loaded("/node_modules/.vite/deps/react.js"))
      const React = reactModule.default || reactModule
      const domModule = await import(loaded("/node_modules/.vite/deps/react-dom_client.js"))
      const { createRoot } = domModule.default || domModule
      const { Cyber } = await import(loaded("/registry/cyber/ui/cyber.tsx"))
      const { Stepper } = await import(loaded("/registry/cyber/ui/stepper.tsx"))
      const { Slider } = await import(loaded("/registry/cyber/ui/slider.tsx"))
      const { Resizable } = await import(loaded("/registry/cyber/ui/resizable.tsx"))
      const { Dialog } = await import(loaded("/registry/cyber/ui/dialog.tsx"))
      document.getElementById("root").style.display = "none"
      const fixture = document.createElement("div")
      document.body.append(fixture)
      window.fixtureStats = { canceled: 0, commits: 0, blurs: 0, refuse: true }
      window.popupGuard = { blockOpen: true, blockClose: true }
      const change = (_value, details) => {
        if (window.fixtureStats.refuse) { details.cancel(); window.fixtureStats.canceled++ }
      }
      const commit = () => { window.fixtureStats.commits++ }
      const blur = () => { window.fixtureStats.blurs++ }
      window.fixtureRoot = createRoot(fixture)
      const h = React.createElement
      window.fixtureRoot.render(h(Cyber, { style: { width: 600, padding: 40, display: "grid", gap: 30 } },
        h(Stepper, { label: "Cancel step", defaultValue: 5, min: 0, max: 10, onValueChange: change, onValueCommit: commit, onBlur: blur }),
        h(Slider, { label: "Cancel slider", defaultValue: 50, onValueChange: change, onValueCommit: commit, onBlur: blur }),
        h(Resizable, { panes: [{ label: "First", content: "One", defaultSize: 50 }, { label: "Second", content: "Two" }], onLayoutChange: change, onLayoutCommit: commit, onBlur: blur }),
        h("div", { "data-sound-test": "guarded" }, h(Dialog, {
          trigger: "Guarded modal", title: "Guarded dialog", description: "Exercises canceled opening and closing.",
          onOpenChange: (open, details) => {
            if (open ? window.popupGuard.blockOpen : window.popupGuard.blockClose) details.cancel()
          },
        })),
      ))
    })
    await page.waitForSelector('[aria-label="Increase Cancel step"]')
    await click('[aria-label="Increase Cancel step"]')
    assert(!(await events()).some((event) => event.kind === "buffer"), "Canceled Stepper action is silent")
    for (const selector of ['[data-kit="slider-thumb"]', '[data-kit="resizable-handle"]']) {
      await drag(selector)
      assert(!(await events()).some((event) => event.kind === "buffer"), `Canceled ${selector} is silent`)
      await page.mouse.up()
    }
    assert((await page.evaluate(() => window.fixtureStats.canceled)) > 2, "Consumer cancellation callbacks were exercised")
    pass("consumer-canceled Stepper, slider and resize changes stay silent")
    await page.evaluate(() => { window.fixtureStats.refuse = false })
    for (const selector of ['[data-kit="stepper-value"]', '[data-kit="slider-thumb"] input', '[data-kit="resizable-handle"]']) {
      await page.focus(selector)
      await page.keyboard.press(selector.includes("stepper") ? "ArrowUp" : "ArrowRight")
      await page.evaluate((selector) => document.querySelector(selector).blur(), selector)
    }
    const callbacks = await page.evaluate(() => window.fixtureStats)
    assert(callbacks.commits >= 3, "All wrappers preserve consumer commit handlers")
    assert(callbacks.blurs >= 3, "All wrappers preserve consumer blur handlers")
    pass("consumer commit and blur handlers survive sound cleanup")

    const guardedTrigger = '[data-sound-test="guarded"] [data-slot="dialog-trigger"]'
    await click(guardedTrigger)
    assert.equal((await modalSounds()).length, 0, "Canceled opening produces no modal sound")
    await page.evaluate(() => { window.popupGuard.blockOpen = false })
    await click(guardedTrigger)
    await oneModal("modal-open", "Accepted opening after cancellation")
    await click('[data-sound-test="guarded"] [data-slot="dialog-close"]')
    assert.equal((await modalSounds()).length, 0, "Canceled close produces no modal sound")
    assert(await page.$('[data-sound-test="guarded"] [data-slot="dialog-content"][data-open]'), "Canceled close stays open")
    await page.evaluate(() => { window.popupGuard.blockClose = false })
    await click('[data-sound-test="guarded"] [data-slot="dialog-close"]')
    await oneModal("modal-close", "Accepted close after cancellation")
    pass("canceled dialog changes stay silent; later accepted changes sound once")
  }

  assert.deepEqual(errors, [], "No uncaught browser errors")
  console.log(`${checks} sound checks passed`)
} finally {
  await browser.close()
}
// Bun can retain Puppeteer's closed transport after Chrome has exited.
process.exit(0)
