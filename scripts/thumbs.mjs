#!/usr/bin/env node
// Writes the thumbnail each example screen shows on the Examples page:
// public/examples/<name>.webp, the top of the screen at 1280 × 800, with
// effects off so nothing is caught mid-glitch. Rerun it when a screen changes.
//
//   node scripts/thumbs.mjs              # every screen
//   node scripts/thumbs.mjs jobs comms   # some
//
// Needs the dev server running and a local Chrome, like scripts/shot.mjs.
import { existsSync, mkdirSync, readdirSync } from "node:fs"
import { join } from "node:path"
import puppeteer from "puppeteer-core"

const root = new URL("..", import.meta.url).pathname
const all = readdirSync(join(root, "registry/cyber/blocks"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(root, "registry/cyber/blocks", entry.name, `${entry.name}.tsx`)))
  .map((entry) => entry.name)
const asked = process.argv.slice(2)
const names = asked.length ? asked : all

async function findServer() {
  if (process.env.CYBERSPEC_URL) return process.env.CYBERSPEC_URL.replace(/\/$/, "")
  for (const port of [5720, 5721, 5722, 5723, 5173])
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
const out = join(root, "public/examples")
mkdirSync(out, { recursive: true })
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars", "--mute-audio"] })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("cyberspec:fx", "off")
    } catch {}
  })
  for (const name of names) {
    await page.goto(`${base}/${name}`, { waitUntil: "networkidle0", timeout: 60000 })
    await page.evaluate(() => document.fonts.ready)
    await new Promise((resolve) => setTimeout(resolve, 800))
    // The screen alone: the site's bar, page heading and footer come off,
    // and the shot starts where the screen does.
    await page.addStyleTag({
      content: '[data-site-bar], [data-site-skip], [data-kit="page-head"], [data-site-pager], [data-site-footer] { display: none !important }',
    })
    await new Promise((resolve) => setTimeout(resolve, 300))
    const top = await page.evaluate(() => {
      scrollTo(0, 0)
      const main = document.querySelector("main")
      return main ? Math.round(main.getBoundingClientRect().top + Number.parseFloat(getComputedStyle(main).paddingTop) - 20) : 0
    })
    const file = join(out, `${name}.webp`)
    await page.screenshot({ path: file, type: "webp", quality: 82, clip: { x: 0, y: Math.max(0, top), width: 1280, height: 800 }, captureBeyondViewport: true })
    console.log(`wrote ${file}`)
  }
} finally {
  await browser.close()
}
