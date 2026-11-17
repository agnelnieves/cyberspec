#!/usr/bin/env node
// Writes public/og.png, the 1200 × 630 image link previews show: the home
// page's masthead, rendered from the running dev server with effects off and
// the site's bar hidden. Rerun it when the masthead changes.
//
//   node scripts/og.mjs
//
// Needs the dev server running and a local Chrome, like scripts/shot.mjs.
import { existsSync } from "node:fs"
import { join } from "node:path"
import puppeteer from "puppeteer-core"

const root = new URL("..", import.meta.url).pathname

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
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars", "--mute-audio"] })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("cyberspec:fx", "off")
    } catch {}
  })
  await page.goto(`${base}/`, { waitUntil: "networkidle0", timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  // The masthead alone, centred in the frame: no bar, no catalog below it.
  await page.addStyleTag({
    content: `
      [data-site-bar], [data-site-skip], [data-kit="catalog"], [data-site-footer], [data-masthead-install] { display: none !important }
      [data-site] { min-height: 630px !important; height: 630px; overflow: hidden }
      [data-site] > main { display: grid; align-content: center; height: 630px; padding: 0 80px !important; max-width: none !important }
      [data-kit="masthead"] { display: block !important; margin: 0 !important }
      [data-kit="masthead"] h1 { font-size: 168px !important }
      [data-masthead-lead] > p { font-size: 22px !important; max-width: 46ch !important }
    `,
  })
  await new Promise((resolve) => setTimeout(resolve, 600))
  const file = join(root, "public/og.png")
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1200, height: 630 } })
  console.log(`wrote ${file}`)
} finally {
  await browser.close()
}
