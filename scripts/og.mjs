#!/usr/bin/env bun
// Offline, reproducible social exports. Existing public/og.png is preserved.
// bun scripts/og.mjs           PNGs + eight-second MP4 + GIF preview
// bun scripts/og.mjs --stills  PNGs only (does not require ffmpeg)
// bun scripts/og.mjs --video   Video + GIF only, preserving static exports
// bun scripts/og.mjs --preview Representative motion frames only
// Requires existing puppeteer-core dependency and local Chrome.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import puppeteer from "puppeteer-core"
import { socialArtwork } from "./social-art.mjs"

const root = fileURLToPath(new URL("..", import.meta.url))
const output = join(root, "output/social")
const frames = join(output, ".frames-v3")
const modes = ["--stills", "--video", "--preview"].filter((mode) => process.argv.includes(mode))
if (modes.length > 1) throw new Error("Choose only one of --stills, --video, or --preview")
const mode = modes[0] || "all"
const chrome = process.env.CHROME_PATH || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome", "/usr/bin/chromium",
].find(existsSync)
if (!chrome) throw new Error("Chrome not found; set CHROME_PATH")
const mono = readFileSync(join(root, "node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2")).toString("base64")
const fontCss = `@font-face{font-family:Terminal;src:url(data:font/woff2;base64,${mono}) format('woff2');font-weight:100 900}*{box-sizing:border-box}html,body{margin:0;background:#080c0e;overflow:hidden}svg{display:block}`
mkdirSync(output, { recursive: true })
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars", "--mute-audio"] })
try {
  const page = await browser.newPage()
  await page.setContent(`<style>${fontCss}</style><div id="art"></div>`)
  await page.evaluate(() => document.fonts.load("400 12px Terminal"))
  let currentViewport = ""
  async function draw(width, height, time = null) {
    if (currentViewport !== `${width}x${height}`) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 })
      currentViewport = `${width}x${height}`
    }
    await page.evaluate((art) => { document.querySelector("#art").innerHTML = art }, socialArtwork(width, height, time))
  }
  if (mode === "--preview") {
    const storyboard = join(output, "og-video-v3-frames")
    mkdirSync(storyboard, { recursive: true })
    for (const time of [0, 0.75, 1.8, 3.65, 5.0, 6.35]) {
      await draw(1200, 630, time)
      const name = `frame-${time.toFixed(2).replace(".", "-")}s.png`
      await page.screenshot({ path: join(storyboard, name) })
      console.log(`wrote output/social/og-video-v3-frames/${name}`)
    }
  }
  if (mode === "all" || mode === "--stills") for (const [name, width, height] of [["og-v2", 1200, 630], ["og-square-v2", 1080, 1080]]) {
    await draw(width, height)
    await page.screenshot({ path: join(root, "public", `${name}.png`) })
    writeFileSync(join(output, `${name}.svg`), socialArtwork(width, height).replace(/(<svg[^>]*>)/, (root) => `${root}<style>${fontCss}</style>`))
    writeFileSync(join(output, `${name}.html`), `<!doctype html><meta charset="utf-8"><title>CYBERSPEC social artwork</title><style>${fontCss}</style>${socialArtwork(width, height)}`)
    console.log(`wrote public/${name}.png (${width}x${height})`)
  }
  if (mode === "all" || mode === "--video") {
    mkdirSync(frames, { recursive: true })
    const fps = 30, seconds = 8
    for (let frame = 0; frame < fps * seconds; frame++) {
      await draw(1200, 630, frame / fps)
      await page.screenshot({ path: join(frames, `${String(frame).padStart(4, "0")}.png`) })
      if (frame % fps === 0) console.log(`rendered ${frame / fps}/${seconds}s`)
    }
    function encode(args) {
      const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" })
      if (result.error) throw result.error
      if (result.status !== 0) throw new Error(`ffmpeg exited ${result.status}`)
    }
    const video = join(root, "public/og-video-v3.mp4")
    encode(["-framerate", String(fps), "-i", join(frames, "%04d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", video])
    encode(["-i", video, "-filter_complex", "fps=15,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4", "-loop", "0", join(output, "og-video-v3-preview.gif")])
    rmSync(frames, { recursive: true })
    writeFileSync(join(output, "og-video-v3-review.html"), `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CYBERSPEC — CRT video review</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:40px 24px;background:#080c0e;color:#ff534b;font:14px ui-monospace,monospace}main{max-width:1200px;margin:auto}h1{font-size:18px;letter-spacing:2px;font-weight:500}video,img{display:block;width:100%;height:auto;border:1px solid #542623}img,.reduce-choice{display:none}p{color:#c39a94;line-height:1.6}button{font:inherit;color:#ff534b;border:1px solid currentColor;background:none;padding:12px 18px;cursor:pointer}.reduced img,.reduced .reduce-choice{display:block}.reduced video{display:none}a{color:inherit}
@media(prefers-reduced-motion:reduce){html:not(.opted-in) img,html:not(.opted-in) .reduce-choice{display:block}html:not(.opted-in) video{display:none}}
</style><main><h1>CYBERSPEC // CRT SIGNAL</h1><video controls muted loop playsinline preload="metadata" poster="../../public/og-v2.png" aria-label="Eight-second CYBERSPEC CRT and glitch animation"><source src="../../public/og-video-v3.mp4" type="video/mp4"></video><img src="../../public/og-v2.png" alt="Coral-red CYBERSPEC logo inside a dark wireframe chamber"><div class="reduce-choice"><p>Showing the still image because reduced motion is enabled.</p><button type="button">Play animation</button></div><p>1200 × 630 · 8 seconds · 30 fps · <a href="../../public/og-video-v3.mp4">Download MP4</a></p></main>
<script>
const video=document.querySelector('video'), preference=matchMedia('(prefers-reduced-motion: reduce)');
function sync(){document.documentElement.classList.remove('opted-in');document.documentElement.classList.toggle('reduced',preference.matches);if(preference.matches)video.pause();else video.play().catch(()=>{});}
document.querySelector('button').addEventListener('click',()=>{document.documentElement.classList.remove('reduced');document.documentElement.classList.add('opted-in');video.play().catch(()=>{});});
preference.addEventListener('change',sync);sync();
</script></html>`)
    console.log("wrote public/og-video-v3.mp4 (1200x630, 8s, 30fps, H.264)")
    console.log("wrote output/social/og-video-v3-preview.gif and og-video-v3-review.html")
  }
} finally { await browser.close() }
