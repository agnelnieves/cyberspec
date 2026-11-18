#!/usr/bin/env bun
// Render the real React scene with Stageshow's virtual clock, then encode H.264.
// bun scripts/render-social.mjs --frames 30   # bounded smoke capture
// bun scripts/render-social.mjs              # one complete marked loop
import assert from "node:assert/strict"
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs"
import { dirname, resolve, extname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { spawn } from "node:child_process"
import puppeteer from "puppeteer-core"

const help = `Usage: bun scripts/render-social.mjs [options]
  --url URL          Scene URL (http://127.0.0.1:5720/social.html)
  --out PATH         MP4 (output/social/cyberspec-loop.mp4)
  --frames N         Capture exactly N frames for a smoke test; skips seam check
  --fps 24|30        Output and virtual-clock frame rate (30)
  --height N         Canvas and viewport height, an even pixel count (1350)
  --poster-mark NAME Settled mark to use for the poster (payoff)
  --max-seconds N    Maximum time to wait for a complete loop (40)
  --help             Show this help

The page must expose a 1080×1350 [data-social-canvas] (or use --height). One hero Stage must
call a.mark('loop-start'), a.mark('payoff'), then a.mark('loop-end') each
iteration and return its state/cursor to the opening pose. The renderer warms
up through a complete story before capturing the next loop. The settled
payoff supplies the poster unless --poster-mark selects another mark.
The export is silent; Web Audio does not follow the virtual clock.
CHROME_PATH can select a different installed Chrome/Chromium binary.
`
const args = process.argv.slice(2)
if (args.includes("--help")) { console.log(help); process.exit(0) }
const options = new Map()
const allowed = new Set(["url", "out", "frames", "fps", "height", "poster-mark", "max-seconds"])
for (let i = 0; i < args.length; i += 2) {
  const name = args[i].replace(/^--/, "")
  assert(args[i].startsWith("--") && allowed.has(name) && args[i + 1] && !args[i + 1].startsWith("--"), `Unknown option or missing value: ${args[i]}\n${help}`)
  options.set(name, args[i + 1])
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const url = options.get("url") || "http://127.0.0.1:5720/social.html"
const output = resolve(root, options.get("out") || "output/social/cyberspec-loop.mp4")
assert.equal(extname(output).toLowerCase(), ".mp4", "--out must name an .mp4 file")
const stem = output.slice(0, -4)
const pendingOutput = `${stem}.rendering.mp4`
const fps = Number(options.get("fps") || 30)
const height = Number(options.get("height") || 1350)
const requestedFrames = options.has("frames") ? Number(options.get("frames")) : null
const maxSeconds = Number(options.get("max-seconds") || 40)
const posterMark = options.get("poster-mark") || "payoff"
assert([24, 30].includes(fps), "--fps must be 24 or 30")
assert(Number.isSafeInteger(height) && height > 0 && height % 2 === 0, "--height must be a positive even integer for H.264")
assert(requestedFrames === null || (Number.isSafeInteger(requestedFrames) && requestedFrames > 0), "--frames must be a positive integer")
assert(Number.isFinite(maxSeconds) && maxSeconds > 0, "--max-seconds must be positive")
const clockPath = resolve(root, "src/social/kit/clock.ts")
assert(existsSync(clockPath), `Missing ${clockPath}; copy the Stageshow kit before rendering`)
// Bun loads TypeScript here. The exported function is self-contained and safe
// to serialize into the page before React, CSS motion or timers start.
const { installVirtualClock } = await import(pathToFileURL(clockPath).href)
const chrome = process.env.CHROME_PATH || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome", "/usr/bin/chromium",
].find(existsSync)
assert(chrome, "Chrome not found; set CHROME_PATH")
mkdirSync(dirname(output), { recursive: true })
writeFileSync(`${stem}.json`, JSON.stringify({ status: "rendering", output, completeLoop: false }, null, 2) + "\n")
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars", "--mute-audio"] })
let encoder
const warnings = []
const errors = []
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
const run = (command, argv) => new Promise((done, reject) => {
  const child = spawn(command, argv, { stdio: ["ignore", "pipe", "pipe"] })
  let stdout = "", stderr = ""
  child.stdout.on("data", (chunk) => { stdout += chunk })
  child.stderr.on("data", (chunk) => { stderr += chunk })
  child.once("error", reject)
  child.once("close", (code) => code === 0 ? done(stdout) : reject(new Error(`${command} exited ${code}: ${stderr}`)))
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1080, height, deviceScaleFactor: 1 })
  await page.bringToFront()
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }])
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "warn" || message.type() === "warning") warnings.push(message.text())
    if (message.type() === "error" && !/favicon/.test(`${message.text()} ${message.location().url || ""}`)) errors.push(message.text())
  })
  await page.evaluateOnNewDocument(() => {
    // Resize/IntersectionObserver and actual paint still use the browser's
    // native frame lifecycle. Preserve a way to let those settle while the
    // scene's virtual clock is frozen.
    const nativeRaf = window.requestAnimationFrame.bind(window)
    window.__socialPaint = () => new Promise((done) => nativeRaf(() => nativeRaf(done)))
  })
  await page.evaluateOnNewDocument(installVirtualClock, { fps, epoch: 1794873600000 })
  await page.evaluateOnNewDocument(() => {
    window.__socialRender = true
    let seed = 0x43594252
    Math.random = () => {
      seed |= 0; seed = seed + 0x6d2b79f5 | 0
      let value = Math.imul(seed ^ seed >>> 15, 1 | seed)
      value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value
      return ((value ^ value >>> 14) >>> 0) / 4294967296
    }
    try { localStorage.setItem("cyberspec:sound", "off"); localStorage.setItem("cyberspec:fx", "full") } catch {}
    const marks = []
    const owners = new WeakMap()
    let nextOwner = 0
    window.__socialCapture = { marks }
    new MutationObserver((records) => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i], element = record.target
        if (!element.matches(".ss-stage") || !element.closest("[data-social-canvas]")) continue
        // Reconstruct intermediate marks if several writes landed in one
        // mutation batch, instead of reading the final attribute repeatedly.
        const next = records.slice(i + 1).find((entry) => entry.target === element)
        const mark = next ? next.oldValue : element.getAttribute("data-mark")
        if (!mark) continue
        if (!owners.has(element)) owners.set(element, ++nextOwner)
        marks.push({ owner: owners.get(element), mark, time: performance.now(), frame: window.__stageshow.clock.frame })
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-mark"], attributeOldValue: true })
  })
  await page.goto(url, { waitUntil: "networkidle0" })
  await page.bringToFront()
  await page.evaluate(() => document.fonts.ready)
  // Placement uses layout callbacks, which can be flushed without advancing
  // the story. Do not use a RAF-polled browser wait on a frozen clock.
  let ready = false
  for (let attempt = 0; attempt < 200; attempt++) {
    ready = await page.evaluate(async () => {
      await window.__stageshow.clock.flushLayout()
      await window.__socialPaint()
      const canvas = document.querySelector("[data-social-canvas]")
      return !!canvas && (canvas.matches(".ss-stage") || !!canvas.querySelector(".ss-stage")) && !canvas.matches("[data-placing]") && !canvas.querySelector("[data-placing]")
    })
    if (ready) break
    await sleep(10)
  }
  assert(ready, "The social canvas did not finish its initial layout")
  const clip = await page.$eval("[data-social-canvas]", (element) => {
    const box = element.getBoundingClientRect()
    return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height }
  })
  assert(Math.abs(clip.width - 1080) < 0.01 && Math.abs(clip.height - height) < 0.01, `Expected a 1080×${height} canvas; got ${clip.width}×${clip.height}`)
  assert(clip.x >= 0 && clip.y >= 0 && clip.x + clip.width <= 1080.01 && clip.y + clip.height <= height + 0.01, "Canvas must fit the recording viewport without scrolling or resizing")
  const screenshot = () => page.screenshot({ clip, captureBeyondViewport: false })
  // The first screenshot can trigger compositor/visibility work. Do that
  // before accepting any cycle, then flush the resulting measurements.
  await screenshot()
  await page.evaluate(async () => {
    await window.__socialPaint()
    await window.__stageshow.clock.flushLayout()
    await window.__socialPaint()
  })
  const marks = () => page.evaluate(() => window.__socialCapture.marks)
  const step = () => page.evaluate(() => window.__stageshow.clock.step())
  // Initial font/layout measurement can restart a Stage's script. A second
  // loop-start alone is therefore not evidence of a complete story. Warm up
  // until one owner has reached payoff, then loop-end, then its next start.
  const warmedStart = (timeline) => {
    const cycles = new Map()
    for (const [index, entry] of timeline.entries()) {
      const previous = cycles.get(entry.owner)
      if (entry.mark === "loop-start") {
        if (previous?.payoff && previous?.end) return { ...entry, index }
        cycles.set(entry.owner, { payoff: false, end: false })
      } else if (previous && entry.mark === "payoff") previous.payoff = true
      else if (previous?.payoff && entry.mark === "loop-end") previous.end = true
    }
    return null
  }
  let start
  for (let frame = 0; frame <= Math.ceil(fps * maxSeconds); frame++) {
    assert.equal(errors.length, 0, `Scene errors:\n${errors.join("\n")}`)
    start = warmedStart(await marks())
    if (start) break
    await step()
    // Warmup must exercise the same native paint path as captured frames.
    // Racing virtual time without painting can postpone observer callbacks
    // until the first encoded screenshot and restart an otherwise full story.
    await screenshot()
    if (frame > 0 && frame % (fps * 5) === 0) console.log(`warming up ${frame / fps}s`)
  }
  assert(start, `No complete loop-start → payoff → loop-end → loop-start sequence within ${maxSeconds}s`)
  const captureOrigin = await page.evaluate(() => ({ time: window.__stageshow.clock.now(), frame: window.__stageshow.clock.frame }))
  console.log(`warmup complete; capturing the next story at frame ${captureOrigin.frame}`)
  const capturedCycle = (timeline) => {
    const entries = timeline.slice(start.index).filter((entry) => entry.owner === start.owner)
    let payoff = false, end = false
    for (let index = 1; index < entries.length; index++) {
      const entry = entries[index]
      if (entry.mark === "payoff") payoff = true
      if (entry.mark === "loop-end" && payoff) end = true
      if (entry.mark === "loop-start") {
        assert(payoff && end, "Hero restarted during capture before payoff and loop-end; no complete loop was exported")
        return { entries: entries.slice(0, index + 1), payoff, end, complete: true }
      }
    }
    return { entries, payoff, end, complete: false }
  }
  const ffmpegArgs = ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-vcodec", "png", "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "slow", "-b:v", "8M", "-maxrate", "10M", "-bufsize", "16M", "-pix_fmt", "yuv420p", "-movflags", "+faststart", pendingOutput]
  encoder = spawn("ffmpeg", ffmpegArgs, { stdio: ["pipe", "ignore", "pipe"] })
  let encoderError = null, encoderStderr = ""
  encoder.stderr.on("data", (chunk) => { encoderStderr += chunk })
  encoder.stdin.on("error", (error) => { encoderError = error })
  const encoded = new Promise((done) => {
    encoder.once("error", (error) => { encoderError = error; done(-1) })
    encoder.once("close", done)
  })
  let frameCount = 0, firstImage, endpointImage, posterImage, posterFrame = 0
  const limit = requestedFrames ?? Math.ceil(fps * maxSeconds)
  let complete = false
  while (frameCount < limit) {
    const cycle = capturedCycle(await marks())
    if (requestedFrames === null && frameCount > 0 && cycle.complete) {
      endpointImage = await screenshot()
      complete = true
      break // The endpoint is frame zero of the next loop, not another frame.
    }
    assert.equal(errors.length, 0, `Scene errors:\n${errors.join("\n")}`)
    const png = await screenshot()
    if (!firstImage) firstImage = png
    if (!posterImage && cycle.entries.some((entry) => entry.mark === posterMark)) {
      posterImage = png; posterFrame = frameCount
    }
    await new Promise((done, reject) => encoder.stdin.write(png, (error) => error ? reject(error) : done()))
    frameCount++
    if (frameCount % fps === 0) console.log(`rendered ${frameCount / fps}s (${frameCount} frames)`)
    await step()
  }
  // A cycle exactly on the limit is valid; an unmarked cutoff is not.
  if (requestedFrames === null && !complete) {
    complete = capturedCycle(await marks()).complete
    if (complete) endpointImage = await screenshot()
  }
  encoder.stdin.end()
  const code = await encoded
  assert(!encoderError && code === 0, `ffmpeg failed: ${encoderError?.message || encoderStderr || code}`)
  assert(requestedFrames !== null || complete, `No complete loop within ${maxSeconds}s; increase --max-seconds or fix loop-start marks`)
  assert.equal(errors.length, 0, `Scene errors:\n${errors.join("\n")}`)
  const cycle = capturedCycle(await marks())
  assert(requestedFrames !== null || (cycle.payoff && cycle.end && posterImage), `Full render requires payoff, loop-end, and poster mark '${posterMark}'`)
  if (!posterImage) warnings.push(`Poster mark '${posterMark}' was not reached; the opening frame was used`)
  writeFileSync(`${stem}-poster.png`, posterImage || firstImage)
  if (complete) {
    writeFileSync(`${stem}-seam-start.png`, firstImage)
    writeFileSync(`${stem}-seam-end.png`, endpointImage)
  }
  const probe = JSON.parse(await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_read_frames,duration,pix_fmt", "-of", "json", pendingOutput])).streams[0]
  assert.equal(probe.codec_name, "h264")
  assert.equal(probe.pix_fmt, "yuv420p")
  assert.equal(Number(probe.nb_read_frames), frameCount)
  assert.equal(probe.r_frame_rate, `${fps}/1`)
  assert.equal(probe.width, 1080); assert.equal(probe.height, height)
  renameSync(pendingOutput, output)
  writeFileSync(`${stem}.json`, JSON.stringify({ status: complete ? "complete" : "partial", url, output, fps, frames: frameCount, duration: frameCount / fps, completeLoop: complete, posterFrame, warmupFrames: captureOrigin.frame, seed: "43594252", marks: cycle.entries.map((entry) => ({ mark: entry.mark, seconds: Math.max(0, (entry.time - captureOrigin.time) / 1000), frame: Math.max(0, Math.ceil((entry.time - captureOrigin.time) * fps / 1000 - 1e-6)) })), warnings: [...new Set(warnings)], probe, ffmpegArgs }, null, 2) + "\n")
  console.log(`wrote ${output}: 1080×${height}, ${frameCount / fps}s, ${fps}fps, H.264, target 8Mbps`)
  console.log(`wrote ${stem}-poster.png${complete ? " and seam comparison frames" : " (partial capture; loop seam not checked)"}`)
  for (const warning of new Set(warnings)) console.warn(warning)
} catch (error) {
  writeFileSync(`${stem}.json`, JSON.stringify({ status: "failed", output, completeLoop: false, error: error.message }, null, 2) + "\n")
  throw error
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill("SIGTERM")
  await browser.close()
}
// Bun can retain a closed CDP transport after a successful Chrome shutdown.
process.exit(0)
