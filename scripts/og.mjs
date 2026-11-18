#!/usr/bin/env bun
// Offline social exports. Pass --stills, --video, or --preview to run one stage.
import { spawnSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import puppeteer from "puppeteer-core"
import { Brand } from "../src/Brand.tsx"
import { socialArtwork } from "./social-art.mjs"

const root = fileURLToPath(new URL("..", import.meta.url))
const output = join(root, "output/social")
const modes = ["--stills", "--video", "--preview"].filter((mode) => process.argv.includes(mode))
if (modes.length > 1) throw new Error("Choose only one of --stills, --video, or --preview")
const mode = modes[0] || "all"
const chrome =
  process.env.CHROME_PATH ||
  [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find(existsSync)
if (!chrome) throw new Error("Chrome not found; set CHROME_PATH")

function fontFace(family, file, weight) {
  const data = readFileSync(join(root, "node_modules", file)).toString("base64")
  return `@font-face{font-family:${family};src:url(data:font/woff2;base64,${data}) format('woff2');font-weight:${weight}}`
}
function encode(args) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: "inherit",
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`ffmpeg exited ${result.status}`)
}

async function renderSquare(page) {
  const name = "og-square-v2"
  const css =
    fontFace(
      "Terminal",
      "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
      "100 900",
    ) + "*{box-sizing:border-box}html,body{margin:0;background:#080c0e;overflow:hidden}svg{display:block}"
  const artwork = socialArtwork(1080, 1080)
  const html = `<!doctype html><meta charset="utf-8"><title>CYBERSPEC social artwork</title><style>${css}</style>${artwork}`
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 })
  await page.setContent(html)
  await page.evaluate(() => document.fonts.load("400 12px Terminal"))
  await page.screenshot({ path: join(root, "public", name + ".png") })
  writeFileSync(
    join(output, name + ".svg"),
    artwork.replace(/(<svg[^>]*>)/, (tag) => tag + `<style>${css}</style>`),
  )
  writeFileSync(join(output, name + ".html"), html)
}

mkdirSync(output, { recursive: true })
const bundle = await Bun.build({
  entrypoints: [join(root, "scripts/og-artwork.mjs")],
  target: "browser",
  format: "iife",
})
if (!bundle.success) throw new AggregateError(bundle.logs, "Could not bundle the social artwork")
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  pipe: true,
  args: ["--hide-scrollbars", "--mute-audio"],
})
try {
  const page = await browser.newPage()
  const fonts =
    fontFace("Kode", "@fontsource-variable/kode-mono/files/kode-mono-latin-wght-normal.woff2", "400 700") +
    fontFace("Rajdhani", "@fontsource/rajdhani/files/rajdhani-latin-500-normal.woff2", "500")
  await page.setContent(`<style>${fonts}</style>${renderToStaticMarkup(createElement(Brand))}`)
  await page.evaluate(() =>
    Promise.all([
      document.fonts.load("550 96px Kode"),
      document.fonts.load("600 18px Kode"),
      document.fonts.load("500 28px Rajdhani"),
    ]),
  )
  await page.addScriptTag({ content: await bundle.outputs[0].text() })
  async function render(time, scale = 1.5) {
    const png = await page.evaluate((time, scale) => window.renderArtwork(time, scale), time, scale)
    return Buffer.from(png, "base64")
  }
  if (mode === "--preview") {
    const storyboard = join(output, "og-video-v4-frames")
    mkdirSync(storyboard, { recursive: true })
    for (const time of [0, 0.75, 1.6, 3.65, 5.6, 7.5]) {
      const name = `frame-${time.toFixed(2).replace(".", "-")}s.png`
      writeFileSync(join(storyboard, name), await render(time))
    }
    console.log("wrote storyboard to " + storyboard)
  }
  if (mode === "all" || mode === "--stills") {
    writeFileSync(join(root, "public/og-v4.png"), await render(0, 2))
    const squarePage = await browser.newPage()
    await renderSquare(squarePage)
    await squarePage.close()
    console.log("wrote public/og-v4.png and public/og-square-v2.png")
  }
  if (mode === "all" || mode === "--video") {
    const frames = mkdtempSync(join(output, ".frames-v4-"))
    const fps = 30,
      seconds = 8
    const video = join(root, "public/og-video-v4.mp4")
    const pendingVideo = join(root, "public", ".og-video-" + randomUUID() + ".mp4")
    try {
      for (let frame = 0; frame < fps * seconds; frame++) {
        writeFileSync(join(frames, `${String(frame).padStart(4, "0")}.png`), await render(frame / fps))
        if (frame % fps === 0) console.log(`rendered ${frame / fps}/${seconds}s`)
      }
      encode([
        "-framerate",
        String(fps),
        "-i",
        join(frames, "%04d.png"),
        "-vf",
        "scale=1200:630:flags=lanczos:out_color_matrix=bt709,format=yuv420p",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "17",
        "-profile:v",
        "high",
        "-level",
        "3.1",
        "-colorspace",
        "bt709",
        "-color_primaries",
        "bt709",
        "-color_trc",
        "bt709",
        "-movflags",
        "+faststart",
        pendingVideo,
      ])
      renameSync(pendingVideo, video)
    } finally {
      rmSync(pendingVideo, { force: true })
      rmSync(frames, { recursive: true, force: true })
    }
    encode([
      "-i",
      video,
      "-filter_complex",
      "fps=15,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
      "-loop",
      "0",
      join(output, "og-video-v4-preview.gif"),
    ])
    writeFileSync(
      join(output, "og-video-v4-review.html"),
      `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CyberSpec social video preview</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:40px 24px;background:#080c0e;color:#ff534b;font:14px ui-monospace,monospace}main{max-width:1200px;margin:auto}h1{font-size:18px;letter-spacing:2px;font-weight:500}video,img{display:block;width:100%;height:auto;border:1px solid #542623}img,.reduce-choice{display:none}p{color:#c39a94;line-height:1.6}button{font:inherit;color:#ff534b;border:1px solid currentColor;background:none;padding:12px 18px;cursor:pointer}.reduced img,.reduced .reduce-choice{display:block}.reduced video{display:none}a{color:inherit}
@media(prefers-reduced-motion:reduce){html:not(.opted-in) img,html:not(.opted-in) .reduce-choice{display:block}html:not(.opted-in) video{display:none}}
</style><main><h1>CyberSpec social video</h1><video controls muted loop playsinline preload="metadata" poster="../../public/og-v4.png" aria-label="Rotating globe with a pulse from Reykjavík and a brief glitch in the headline"><source src="../../public/og-video-v4.mp4" type="video/mp4"></video><img src="../../public/og-v4.png" alt="Cyberpunk interfaces. A red globe with a cyan Reykjavík waypoint."><div class="reduce-choice"><p>Showing the still image because reduced motion is enabled.</p><button type="button">Play animation</button></div><p>1200 × 630 · 8 seconds · 30 fps · <a href="../../public/og-video-v4.mp4">Download MP4</a></p></main>
<script>
const video=document.querySelector('video'), preference=matchMedia('(prefers-reduced-motion: reduce)');
function sync(){document.documentElement.classList.remove('opted-in');document.documentElement.classList.toggle('reduced',preference.matches);if(preference.matches)video.pause();else video.play().catch(()=>{});}
document.querySelector('button').addEventListener('click',()=>{document.documentElement.classList.remove('reduced');document.documentElement.classList.add('opted-in');video.play().catch(()=>{});});
preference.addEventListener('change',sync);sync();
</script></html>`,
    )
    console.log("wrote public/og-video-v4.mp4 and the GIF/HTML previews in output/social")
  }
} finally {
  await browser.close()
}
