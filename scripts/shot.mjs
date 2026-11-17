#!/usr/bin/env node
// Screenshots a page of the running dev server in headless Chrome, after
// optional interactions, so a component can be looked at without a browser
// window. It also prints the page's console errors and uncaught exceptions.
//
//   node scripts/shot.mjs slider                      # /preview/slider → shots/slider.png
//   node scripts/shot.mjs slider --narrow             # in a 256px-wide stage
//   node scripts/shot.mjs dialog --do "click:text=Wipe deck" --do wait:400
//   node scripts/shot.mjs menu --do "focus:[data-kit=button]" --do key:Enter --do key:ArrowDown
//   node scripts/shot.mjs /loadout --width 1280 --height 800 --full
//
// Options:
//   --out <file>       where to write (default: shots/<name>.png, under the project)
//   --width, --height  viewport, in CSS px (default 760 x 560)
//   --narrow           preview stage 256px wide (how a non-wide catalog panel is)
//   --mobile           a 360 x 720 touch viewport
//   --fx <level>       full | calm | off (default: full)
//   --reduce           emulate prefers-reduced-motion: reduce
//   --full             capture the whole page, not just the viewport
//   --do <step>        repeatable, in order:
//                        click:<selector>   hover:<selector>   focus:<selector>
//                        key:<Key>          (Tab, Enter, ArrowDown, Escape, Shift+Tab…)
//                        type:<text>        wait:<ms>          shot:<file>  (an extra capture mid-way)
//                      A selector is CSS, or text=<visible text> for the first
//                      button, link, tab, option or label with that text.
//   --eval <js>        run an expression in the page at the end and print its JSON
import { existsSync, mkdirSync } from "node:fs"
import { dirname, isAbsolute, join } from "node:path"
import puppeteer from "puppeteer-core"

const root = new URL("..", import.meta.url).pathname
const args = process.argv.slice(2)
if (!args.length || args[0].startsWith("--")) {
  console.error("usage: node scripts/shot.mjs <component-name | /route> [options]   (see the top of scripts/shot.mjs)")
  process.exit(2)
}
const target = args.shift()
const opts = { width: 760, height: 560, fx: "full", steps: [] }
while (args.length) {
  const flag = args.shift()
  if (flag === "--out") opts.out = args.shift()
  else if (flag === "--width") opts.width = Number(args.shift())
  else if (flag === "--height") opts.height = Number(args.shift())
  else if (flag === "--fx") opts.fx = args.shift()
  else if (flag === "--do") opts.steps.push(args.shift())
  else if (flag === "--eval") opts.eval = args.shift()
  else if (flag === "--narrow") opts.narrow = true
  else if (flag === "--mobile") opts.mobile = true
  else if (flag === "--reduce") opts.reduce = true
  else if (flag === "--full") opts.full = true
  else {
    console.error(`unknown option ${flag}`)
    process.exit(2)
  }
}
if (opts.mobile) Object.assign(opts, { width: 360, height: 720 })

// The dev server: CYBERSPEC_URL, or whichever nearby port answers.
async function findServer() {
  if (process.env.CYBERSPEC_URL) return process.env.CYBERSPEC_URL.replace(/\/$/, "")
  for (const port of [5721, 5720, 5722, 5723, 5173]) {
    for (const host of ["127.0.0.1", "localhost"]) {
      try {
        const response = await fetch(`http://${host}:${port}/`, { signal: AbortSignal.timeout(1500) })
        if (response.ok && (await response.text()).includes("CYBERSPEC")) return `http://${host}:${port}`
      } catch {}
    }
  }
  throw new Error("no cyberspec dev server found on ports 5720-5723; set CYBERSPEC_URL")
}

const chrome =
  process.env.CHROME_PATH ||
  ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((path) => existsSync(path))
if (!chrome) {
  console.error("Chrome not found; set CHROME_PATH")
  process.exit(1)
}

const base = await findServer()
const route = target.startsWith("/") ? target : `/preview/${target}`
const name = target.replace(/^\//, "").replace(/\//g, "-") || "home"
const resolveOut = (file) => (isAbsolute(file) ? file : join(root, file))
const out = resolveOut(opts.out ?? `shots/${name}.png`)
mkdirSync(dirname(out), { recursive: true })

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars", "--mute-audio"] })
const problems = []
try {
  const page = await browser.newPage()
  await page.setViewport({ width: opts.width, height: opts.height, deviceScaleFactor: 2, hasTouch: Boolean(opts.mobile), isMobile: Boolean(opts.mobile) })
  if (opts.reduce) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }])
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(`[console.${message.type()}] ${message.text()}`)
  })
  page.on("pageerror", (error) => problems.push(`[uncaught] ${error.message}`))
  await page.evaluateOnNewDocument((fx) => {
    try {
      localStorage.setItem("cyberspec:fx", fx)
    } catch {}
  }, opts.fx)
  const url = `${base}${route}${opts.narrow ? "?w=256" : ""}`
  await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)
  await new Promise((resolve) => setTimeout(resolve, 700))

  const find = async (selector) => {
    if (!selector.startsWith("text=")) return page.$(selector)
    const text = selector.slice(5).trim().toLowerCase()
    const handle = await page.evaluateHandle((wanted) => {
      const nodes = document.querySelectorAll('button, a, [role="button"], [role="tab"], [role="option"], [role="menuitem"], [role="radio"], [role="checkbox"], [role="switch"], label, summary')
      const exact = [...nodes].find((node) => (node.textContent ?? "").trim().toLowerCase() === wanted || node.getAttribute("aria-label")?.toLowerCase() === wanted)
      return exact ?? [...nodes].find((node) => (node.textContent ?? "").trim().toLowerCase().includes(wanted)) ?? null
    }, text)
    return handle.asElement()
  }

  for (const step of opts.steps) {
    const at = step.indexOf(":")
    const verb = at < 0 ? step : step.slice(0, at)
    const rest = at < 0 ? "" : step.slice(at + 1)
    if (verb === "wait") await new Promise((resolve) => setTimeout(resolve, Number(rest) || 300))
    else if (verb === "key") {
      // "Shift+Tab" is a combination; a lone "+" is the plus key.
      const parts = rest === "+" ? ["+"] : rest.split("+")
      const key = parts.pop()
      for (const modifier of parts) await page.keyboard.down(modifier)
      await page.keyboard.press(key)
      for (const modifier of parts.reverse()) await page.keyboard.up(modifier)
    } else if (verb === "type") await page.keyboard.type(rest, { delay: 20 })
    else if (verb === "shot") {
      const file = resolveOut(rest)
      mkdirSync(dirname(file), { recursive: true })
      await page.screenshot({ path: file })
      console.log(`wrote ${file}`)
    } else if (verb === "click" || verb === "hover" || verb === "focus") {
      const el = await find(rest)
      if (!el) {
        problems.push(`[step] nothing matches ${rest}`)
        continue
      }
      if (verb === "click") await el.click()
      else if (verb === "hover") await el.hover()
      else await el.focus()
    } else problems.push(`[step] unknown step ${step}`)
    await new Promise((resolve) => setTimeout(resolve, 120))
  }

  await page.screenshot({ path: out, fullPage: Boolean(opts.full) })
  console.log(`wrote ${out}  (${url}, ${opts.width}x${opts.height}, fx ${opts.fx}${opts.reduce ? ", reduced motion" : ""})`)
  if (opts.eval) console.log("eval:", JSON.stringify(await page.evaluate(opts.eval), null, 2))
} finally {
  await browser.close()
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s) reported by the page:`)
  for (const problem of [...new Set(problems)].slice(0, 30)) console.log("  " + problem)
} else console.log("no console errors")
