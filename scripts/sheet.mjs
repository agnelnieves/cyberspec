#!/usr/bin/env node
// A contact sheet of the whole catalog: opens the catalog page once in
// headless Chrome and writes one image per group (shots/sheet-<group>.png),
// then lists every panel that faulted or has no example, and the page's
// console errors. For looking over the kit at a glance.
//
//   node scripts/sheet.mjs                 # all groups, 1320px wide
//   node scripts/sheet.mjs --width 390     # as a phone lays it out
//   node scripts/sheet.mjs --fx off
import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import puppeteer from "puppeteer-core"

const root = new URL("..", import.meta.url).pathname
const args = process.argv.slice(2)
const value = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback)
const width = Number(value("--width", 1320))
const fx = value("--fx", "full")

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
mkdirSync(join(root, "shots"), { recursive: true })
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars", "--mute-audio"] })
const problems = []
try {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 })
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`[console.error] ${message.text().slice(0, 300)}`)
  })
  page.on("pageerror", (error) => problems.push(`[uncaught] ${error.message.slice(0, 300)}`))
  await page.evaluateOnNewDocument((level) => {
    try {
      localStorage.setItem("cyberspec:fx", level)
    } catch {}
  }, fx)
  await page.goto(`${base}/`, { waitUntil: "networkidle0", timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const groups = await page.$$('[data-kit="catalog-group"]')
  for (const group of groups) {
    const name = await group.evaluate((el) => el.querySelector("h2")?.textContent?.replace(/[^a-z]/gi, "").toLowerCase() ?? "group")
    await group.evaluate((el) => el.scrollIntoView({ block: "start" }))
    await new Promise((resolve) => setTimeout(resolve, 500))
    const file = join(root, `shots/sheet-${name}${width < 700 ? "-narrow" : ""}.png`)
    await group.screenshot({ path: file })
    console.log(`wrote ${file}`)
  }

  const report = await page.evaluate(() => ({
    faults: [...document.querySelectorAll('[data-kit="module"] [role="alert"]')].map((el) => `${el.closest('[data-kit="module"]').id}: ${el.textContent}`),
    missing: [...document.querySelectorAll('[data-kit="module"][data-missing]')].map((el) => el.id),
    overflow: [...document.querySelectorAll('[data-kit="module"]')]
      .filter((el) => {
        const stage = el.querySelector('[data-kit="stage"]')
        return stage && stage.scrollWidth > stage.clientWidth + 2
      })
      .map((el) => el.id),
    pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
  }))
  console.log(`\nfaulted panels: ${report.faults.length ? "\n  " + report.faults.join("\n  ") : "none"}`)
  console.log(`no example: ${report.missing.join(", ") || "none"}`)
  console.log(`stage overflows horizontally: ${report.overflow.join(", ") || "none"}`)
  console.log(`page overflows horizontally: ${report.pageOverflow}`)
} finally {
  await browser.close()
}
const unique = [...new Set(problems)]
console.log(unique.length ? `\n${unique.length} console problem(s):\n  ${unique.slice(0, 40).join("\n  ")}` : "\nno console errors")
