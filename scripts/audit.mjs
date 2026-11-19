#!/usr/bin/env node
// Audits every page of the running dev server in headless Chrome:
//
// - accessibility, with axe-core (WCAG 2.1 A and AA, plus best practices)
// - motion: with effects off, nothing may still be animating
// - agents: every ui-sdk component the agent bridge can see needs a name,
//   and names shouldn't repeat within a page
// - layout: phone overflow, native swipes and clipping inside the site frame
//
//   node scripts/audit.mjs            # all pages
//   node scripts/audit.mjs /jobs /    # some
import { existsSync, readFileSync } from "node:fs"
import puppeteer from "puppeteer-core"

const root = new URL("..", import.meta.url).pathname
const axe = readFileSync(`${root}node_modules/axe-core/axe.min.js`, "utf8")
const asked = process.argv.slice(2).filter((arg) => arg.startsWith("/"))
const routes = asked.length ? asked : ["/", "/components", "/examples", "/loadout", "/augments", "/jobs", "/comms", "/archive", "/grid", "/daemon"]

async function findServer() {
  if (process.env.CYBERSPEC_URL) return process.env.CYBERSPEC_URL.replace(/\/$/, "")
  for (const port of [5721, 5720, 5722, 5723, 5173])
    for (const host of ["127.0.0.1", "localhost"]) {
      try {
        const response = await fetch(`http://${host}:${port}/`, { signal: AbortSignal.timeout(1500) })
        if (response.ok && (await response.text()).includes("CYBERSPEC")) return `http://${host}:${port}`
      } catch {}
    }
  throw new Error("no cyberspec dev server found; set CYBERSPEC_URL")
}

async function auditCatalogFrame(page, telegram = false) {
  const client = await page.createCDPSession()
  let failures = 0
  for (const [width, height, hasTouch, insets] of [
    [382, 580, true, { top: 32, right: 0, bottom: 18, left: 0 }],
    [951, 585, true, { top: 10, right: 38, bottom: 22, left: 4 }],
    [951, 620, true, { top: 0, right: 38, bottom: 8, left: 4 }],
    [1024, 768, false, { top: 24, right: 0, bottom: 20, left: 0 }],
  ]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: true, hasTouch, isLandscape: width > height })
    await client.send("Emulation.setSafeAreaInsetsOverride", { insets })
    await page.waitForSelector(".site-outline")
    const errors = await page.evaluate(async (safe, embedded) => {
      const content = document.querySelector("[data-site-scroll]")
      const root = embedded ? document.querySelector("[data-site-scrollport]") : document.scrollingElement
      if (!root) return ["missing Telegram scrollport"]
      const errors = []
      for (const fraction of [0, 0.5, 0.98]) {
        const target = Math.round((root.scrollHeight - root.clientHeight) * fraction)
        root.scrollTo({ top: target, behavior: "instant" })
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const frame = document.querySelector(".site-housing").getBoundingClientRect()
        const outline = document.querySelector(".site-outline").getBoundingClientRect()
        const x = Math.round(outline.left + outline.width * 0.3)
        // Inspect the content beneath the fixed bezel. An overlay can hide a
        // leak in a screenshot of the viewport while Safari displays it outside.
        const hitsContent = y => document.elementsFromPoint(x, y).some(el => content.contains(el))
        if ([frame.top - safe.top, innerHeight - frame.bottom - safe.bottom,
          frame.left - safe.left, innerWidth - frame.right - safe.right].some(delta => Math.abs(delta) > 1)) {
          errors.push("frame does not follow safe-area insets")
        }
        if (root.scrollHeight <= root.clientHeight || Math.abs(root.scrollTop - target) > 2 || content.scrollTop !== 0)
          errors.push(`page did not scroll to ${target}px`)
        if (embedded && (window.scrollY !== 0 || document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight + 1))
          errors.push("document can scroll behind Telegram's toolbar")
        if (hitsContent(outline.top - 3) || hitsContent(outline.bottom + 3))
          errors.push(`content escapes the outline at ${root.scrollTop}px`)
        if (!hitsContent(outline.top + 3) || !hitsContent(outline.bottom - 3))
          errors.push(`gap inside the outline at ${root.scrollTop}px`)
      }
      return [...new Set(errors)]
    }, insets, telegram)
    console.log(`  frame  ${telegram ? "Telegram" : "browser"} ${width}×${height} ${hasTouch ? "touch" : "pointer"}: ${errors.join(", ") || "content stays inside the outline"}`)
    failures += errors.length
  }
  await client.detach()
  return failures
}

function installTelegramBridge() {
  window.TelegramWebviewProxy = { postEvent() {} }
  window.webkit = { messageHandlers: { performAction: { postMessage() {} } } }
}

const chrome =
  process.env.CHROME_PATH ||
  ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((path) => existsSync(path))
if (!chrome) throw new Error("Chrome not found; set CHROME_PATH")

const base = await findServer()
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars", "--mute-audio"] })
let failures = 0
try {
  for (const route of routes) {
    console.log(`\n══ ${route}`)
    const open = async (fx, width) => {
      const page = await browser.newPage()
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1, isMobile: width === 360, hasTouch: width === 360 })
      await page.evaluateOnNewDocument((level) => {
        try {
          localStorage.setItem("cyberspec:fx", level)
        } catch {}
      }, fx)
      await page.goto(`${base}${route}`, { waitUntil: "networkidle0", timeout: 60000 })
      if (route === "/") {
        // Inspect the landing page after entering quietly, including its native swipe behavior.
        await page.waitForSelector(".boot-screen[open] .boot-enter")
        await page.keyboard.press("Escape")
        await page.waitForSelector(".boot-screen", { hidden: true })
      }
      await page.evaluate(() => document.fonts.ready)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return page
    }

    // Accessibility, with effects off so nothing is mid-animation.
    let page = await open("off", 1280)
    await page.evaluate(axe)
    const results = await page.evaluate(() =>
      window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, resultTypes: ["violations"] }),
    )
    for (const violation of results.violations) {
      failures += violation.nodes.length
      console.log(`  a11y  ${violation.id} (${violation.impact}): ${violation.help}  ×${violation.nodes.length}`)
      for (const node of violation.nodes.slice(0, 4)) {
        const detail = node.any?.[0]?.message ?? node.failureSummary?.split("\n")[1] ?? ""
        console.log(`          ${node.target.join(" ").slice(0, 110)}\n            ${detail.trim().slice(0, 170)}`)
      }
    }
    if (!results.violations.length) console.log("  a11y  clean")

    // Motion: with effects off, nothing should be running.
    const moving = await page.evaluate(() =>
      document
        .getAnimations()
        // A scroll-driven animation moves only when the person scrolls.
        .filter((animation) => animation.timeline === document.timeline)
        .filter((animation) => animation.playState === "running" && !animation.effect?.target?.closest?.('[data-motion="essential"]'))
        .map((animation) => `${animation.animationName ?? animation.transitionProperty ?? "script"} on ${animation.effect?.target?.getAttribute?.("data-kit") ?? animation.effect?.target?.tagName}`),
    )
    console.log(moving.length ? `  motion  still running with effects off: ${[...new Set(moving)].slice(0, 8).join("; ")}` : "  motion  still")
    failures += moving.length

    // Agents: what the bridge sees.
    const seen = await page.evaluate(async () => {
      const { agent } = await import("/registry/cyber/blocks/daemon/bridge.ts")
      const components = agent.snapshot().filter((component) => "component" in component && component.component)
      // Something an agent can act on needs a name to be found by.
      const unnamed = components.filter((component) => !component.label && component.actions?.length).map((component) => component.component)
      const counts = {}
      for (const component of components) if (component.label) counts[`${component.component} "${component.label}"`] = (counts[`${component.component} "${component.label}"`] ?? 0) + 1
      return { total: components.length, unnamed, repeated: Object.entries(counts).filter(([, n]) => n > 1).map(([name, n]) => `${name} ×${n}`) }
    })
    console.log(`  agent  ${seen.total} components visible; unnamed: ${seen.unnamed.length ? [...new Set(seen.unnamed)].join(", ") + ` (${seen.unnamed.length})` : "none"}`)
    if (seen.repeated.length) console.log(`         repeated names: ${seen.repeated.slice(0, 10).join("; ")}`)
    failures += seen.unnamed.length

    if (route === "/components") {
      await page.click("#catalog-toggle")
      const filter = await page.waitForSelector("#component-index input", { visible: true })
      await filter.type("button")
      await page.click('#component-index a[href="/components/sidebar/button"]')
      await page.waitForSelector("#component-title")
      const keptIndex = await filter.evaluate(input =>
        input.isConnected && input.value === "button" &&
        document.getElementById("catalog-toggle")?.getAttribute("aria-expanded") === "true"
      )
      if (!keptIndex) failures++
      console.log(keptIndex ? "  catalog  sidebar and filter retained on component selection" : "  catalog  sidebar was replaced or collapsed on component selection")
    }
    await page.close()

    // Layout at phone width.
    page = await open("off", 360)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    console.log(overflow > 1 ? `  layout  page scrolls sideways by ${overflow}px at 360px` : "  layout  fits 360px")
    if (overflow > 1) failures++
    if (route === "/components") {
      for (const trigger of ["#catalog-toggle", ".site-mobile-menu button", "[data-site-search] button"]) {
        await page.click(trigger)
        const dialog = await page.waitForSelector('[role="dialog"][data-open]', { visible: true })
        const fraction = await dialog.evaluate(el => el.getBoundingClientRect().height / window.visualViewport.height)
        const expected = trigger.includes("search") ? 0.75 : 1
        if (Math.abs(fraction - expected) > 0.02) failures++
        console.log(`  mobile  ${trigger} opened at ${Math.round(fraction * 100)}% of the viewport (expected ${expected * 100}%)`)
        await page.keyboard.press("Escape")
        await page.waitForSelector('[role="dialog"][data-open]', { hidden: true })
      }
      failures += await auditCatalogFrame(page)
      await page.evaluateOnNewDocument(installTelegramBridge)
      await page.reload()
      failures += await auditCatalogFrame(page, true)
    }
    if (route === "/") {
      const finger = await page.touchscreen.touchStart(180, 580)
      await finger.move(180, 500)
      await finger.move(180, 360)
      await finger.end()
      await page.waitForFunction(() => window.scrollY > 50, { timeout: 3000 })
      console.log("  touch  swipe scrolled the document")

      // Recreate the reported transition between the timeline and Agents in
      // Telegram. A swipe here must leave the host's document stationary.
      await page.evaluateOnNewDocument(installTelegramBridge)
      await page.goto("about:blank")
      await page.goto(`${base}/#agents`)
      const frame = await page.waitForSelector("[data-site-scrollport]")
      await page.waitForFunction(() => document.activeElement?.id === "agents")
      const before = await frame.evaluate(el => el.scrollTop)
      const back = await page.touchscreen.touchStart(100, 300)
      await back.move(100, 400)
      await back.move(100, 520)
      await back.end()
      await page.waitForFunction(y => window.scrollY === 0 && document.querySelector("[data-site-scrollport]").scrollTop < y - 50,
        { timeout: 3000 }, before)
      console.log("  touch  Telegram swipe scrolled the frame back toward the timeline")
    }
    await page.close()

    // The landing frame previously passed the phone overflow check while
    // leaking a footer rule and a background seam on ultrawide screens.
    if (route === "/") {
      page = await open("off", 2560)
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      const screenshot = await page.screenshot({ encoding: "base64" })
      const framed = await page.evaluate(async (pixels) => {
        const footer = document.querySelector("[data-site-footer]").getBoundingClientRect()
        const frame = document.querySelector(".site-housing").getBoundingClientRect()
        const bitmap = new Image()
        bitmap.src = "data:image/png;base64," + pixels
        await bitmap.decode()
        const canvas = document.createElement("canvas")
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        const ctx = canvas.getContext("2d")
        ctx.drawImage(bitmap, 0, 0)
        const seam = (edge, y) => {
          const pair = ctx.getImageData(Math.round(edge) - 1, y, 2, 1).data
          return [0, 1, 2].some((channel) => Math.abs(pair[channel] - pair[channel + 4]) > 4)
        }
        return frame.width < innerWidth && frame.top === 0 && frame.bottom === innerHeight
          && footer.left > frame.left && footer.right < frame.right
          && [4, Math.floor(innerHeight / 2), innerHeight - 4].every((y) => !seam(frame.left, y) && !seam(frame.right, y))
      }, screenshot)
      console.log(framed ? "  frame  footer and gutters contained at 2560px" : "  frame  gutter seam or exposed footer at 2560px")
      if (!framed) failures++
      await page.close()
    }
  }
} finally {
  await browser.close()
}
console.log(`\n${failures ? `${failures} finding(s)` : "no findings"}`)
