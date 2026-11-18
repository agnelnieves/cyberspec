#!/usr/bin/env bun
// Verify the actual clipboard, fallback paths and public install prompt.
// Run with the dev server: bun scripts/install-check.mjs
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import puppeteer from "puppeteer-core"

const base = (process.env.CYBERSPEC_URL || "http://127.0.0.1:5720").replace(/\/$/, "")
const chrome = process.env.CHROME_PATH || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find(existsSync)
assert(chrome, "Chrome not found; set CHROME_PATH")
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--mute-audio"] })
const page = await browser.newPage()
const errors = []
page.on("pageerror", (error) => errors.push(error.message))
await page.setViewport({ width: 1280, height: 900 })
await browser.defaultBrowserContext().overridePermissions(new URL(base).origin, ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"])
await page.evaluateOnNewDocument(() => {
  localStorage.setItem("cyberspec:fx", "off")
  localStorage.setItem("cyberspec:sound", "off")
})
let expected
try {
  for (const mode of ["native", "missing", "denied", "blocked"]) {
    await page.goto(base, { waitUntil: "networkidle0" })
    await page.evaluate((mode) => {
      window.realClipboard = navigator.clipboard
      if (mode !== "native") Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: mode === "missing" ? undefined : { writeText: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) },
      })
      if (mode === "blocked") document.execCommand = () => false
    }, mode)
    const button = '[data-copy-prompt]'
    await page.focus(button)
    await page.keyboard.press("Enter")
    if (mode === "blocked") {
      await page.waitForSelector('[data-install-prompt]')
      const manual = await page.$eval('[data-install-prompt]', (field) => ({
        text: field.value,
        focused: field === document.activeElement,
        selected: field.selectionEnd - field.selectionStart,
      }))
      assert.equal(manual.text, expected)
      assert(manual.focused && manual.selected === expected.length, "Blocked clipboard exposes and selects the complete prompt")
      assert.equal(await page.$eval(button, (node) => node.textContent.trim()), "Copy Prompt", "Failure never claims a successful copy")
      await page.click(button)
      await page.waitForFunction(() => {
        const field = document.querySelector('[data-install-prompt]')
        return field === document.activeElement && field.selectionEnd === field.value.length && field.selectionStart === 0
      })
      console.log("ok - blocked clipboard offers a focused, selected manual prompt")
      continue
    }
    await page.waitForFunction(() => document.querySelector('[data-copy-prompt]')?.textContent.includes("Prompt copied"))
    const text = await page.evaluate(() => window.realClipboard.readText())
    if (!expected) expected = text
    assert.equal(text, expected, `${mode}: actual clipboard contains the complete prompt`)
    assert(text.includes("https://www.cyberspec.dev/r/{name}.json"))
    assert(text.includes("https://www.cyberspec.dev/llms.txt"))
    assert(text.includes("https://github.com/agnelnieves/cyberspec"))
    assert(!/localhost|127\.0\.0\.1|vercel\.app/.test(text), "Copied instructions use public production URLs")
    assert(text.includes("React and React DOM 19"))
    assert(text.includes("'@cyberspec-ui=https://www.cyberspec.dev/r/{name}.json'"), "Registry command quotes the template for shells")
    console.log(`ok - ${mode} clipboard copies canonical install instructions via keyboard`)
  }

  await page.goto(base, { waitUntil: "networkidle0" })
  const copyCode = '[data-masthead-install] [data-kit="code-block-copy"] button'
  await page.click(copyCode)
  await page.waitForFunction(() => document.querySelector('[data-masthead-install] [data-kit="code-block"]')?.getAttribute("data-state") === "copied")
  const commands = await page.evaluate(() => navigator.clipboard.readText())
  assert(commands.startsWith("bunx --bun shadcn@latest registry add '@cyberspec-ui=https://www.cyberspec.dev/r/{name}.json'"))
  assert(commands.includes("bunx --bun shadcn@latest add @cyberspec-ui/cyber @cyberspec-ui/button"))
  console.log("ok - install commands copy to the actual clipboard")

  await page.goto(base, { waitUntil: "networkidle0" })
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: () => new Promise((resolve) => { window.finishCopy = resolve }),
    } })
  })
  await page.click('[data-copy-prompt]')
  await page.waitForFunction(() => typeof window.finishCopy === "function")
  await page.click('[data-site-nav] a[href="/examples"]')
  await page.waitForFunction(() => !document.querySelector('[data-copy-prompt]'))
  await page.evaluate(() => window.finishCopy())
  await new Promise((resolve) => setTimeout(resolve, 100))
  assert(!await page.evaluate(() => document.body.textContent.includes("Prompt copied")), "Late clipboard completion does not announce success after leaving the page")
  console.log("ok - clipboard completion after unmount stays quiet")

  await page.goto(base, { waitUntil: "networkidle0" })
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
  await page.screenshot({ path: "/private/tmp/cyberspec-install-mobile.png" })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "Mobile installation panel has no horizontal overflow")
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 })
  await page.screenshot({ path: "/private/tmp/cyberspec-install-desktop.png" })
  assert.deepEqual(errors, [])
  console.log("Installation UI checks passed")
} finally {
  await browser.close()
}
