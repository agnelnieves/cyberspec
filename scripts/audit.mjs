#!/usr/bin/env node
// Audits every page of the running dev server in headless Chrome:
//
// - accessibility, with axe-core (WCAG 2.1 A and AA, plus best practices)
// - motion: with effects off, nothing may still be animating
// - agents: every ui-sdk component the agent bridge can see needs a name,
//   and names shouldn't repeat within a page
// - layout: no horizontal page scroll at 360px
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
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1 })
      await page.evaluateOnNewDocument((level) => {
        try {
          localStorage.setItem("cyberspec:fx", level)
        } catch {}
      }, fx)
      await page.goto(`${base}${route}`, { waitUntil: "networkidle0", timeout: 60000 })
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
    await page.close()

    // Layout at phone width.
    page = await open("off", 360)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    console.log(overflow > 1 ? `  layout  page scrolls sideways by ${overflow}px at 360px` : "  layout  fits 360px")
    if (overflow > 1) failures++
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
