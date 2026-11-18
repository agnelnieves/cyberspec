// bun scripts/component-film/render.mjs [--landscape] [--out file.mp4]
// bun scripts/component-film/render.mjs --proof sheet.png [--times 0,1.5,7,14]
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import puppeteer from 'puppeteer-core'
import { build } from 'vite'

const { values } = parseArgs({ options: { landscape: { type: 'boolean', default: false }, out: { type: 'string' }, proof: { type: 'string' }, times: { type: 'string' } } })
const root = resolve(import.meta.dir, '../..')
const work = mkdtempSync(join(tmpdir(), 'cyberspec-components-'))
const proof = Boolean(values.proof)
const basename = values.landscape ? 'cyberspec-components-centered.mp4' : 'cyberspec-components.mp4'
const target = resolve(values.proof || values.out || join(root, 'output/social', basename))
const extension = proof ? '.png' : '.mp4'
assert.equal(extname(target), extension, 'Expected a ' + extension + ' output')
assert(!values.times || proof, '--times is for proof capture')
const fps = 30
const width = values.landscape ? 1920 : 1080
const height = values.landscape ? 1080 : 1350
const duration = 15
const frames = duration * fps
const proofTimes = (values.times || '0,.8,1.7,2.7,3.7,4.7,5.7,6.7,7.7,8.7,9.7,10.7,11.7,12.7,14.5').split(',').map(Number)
assert(proofTimes.every(t => Number.isFinite(t) && t >= 0 && t < duration), 'Proof times must fall inside the film')
const selected = new Set(proofTimes.map(t => Math.min(frames - 1, Math.round(t * fps))))
const frameCount = proof ? Math.max(...selected) + 1 : frames
const outputStage = target.slice(0, -extension.length) + '.' + process.pid + '.rendering' + extension
const chrome = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync)
assert(chrome, 'Set CHROME_PATH to a local desktop Chromium executable')

// Bundle the production script beside the temporary document and embed its
// CSS and fonts. Capture requires no network server or user browser session.
async function bundleDocument() {
  const result = await build({
    configFile: false, root, publicDir: false, logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    resolve: { alias: { '@': root } },
    build: {
      write: false, assetsInlineLimit: () => true, minify: 'oxc', target: 'chrome130',
      lib: { entry: join(import.meta.dir, values.landscape ? 'centered.tsx' : 'main.tsx'), name: 'ComponentFilm', formats: ['iife'], fileName: 'film' },
    },
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(r => r.output)
  const script = outputs.find(output => output.type === 'chunk' && output.isEntry)
  assert(script, 'Vite did not emit a film entry')
  const style = outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css')).map(output => output.source).join('\n')
  const input = readFileSync(join(import.meta.dir, 'index.html'), 'utf8')
  const entry = /<script\b[^>]*\bsrc=["'][^"']*main\.tsx["'][^>]*>\s*<\/script>/
  assert(entry.test(input), 'Expected a main.tsx script in the recording document')
  const doc = input.replace(entry, () => '<script charset="utf-8" defer src="film.js"></script>').replace(/<head\b[^>]*>/i, tag => tag + '<meta charset="utf-8">').replace('</head>', () => '<style>' + style + '</style>\n</head>')
  // The IIFE uses a classic same-directory script so file:// remains
  // same-origin for all film operations, including embedded WOFF2 data.
  writeFileSync(join(work, 'film.js'), script.code)
  const html = join(work, 'index.html')
  writeFileSync(html, doc)
  return pathToFileURL(html).href
}

function encoderArgs() {
  const input = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', 'pipe:0']
  if (proof) {
    const columns = Math.min(values.landscape ? 3 : 5, selected.size)
    const tileWidth = values.landscape ? 480 : 270
    const filter = selected.size === 1 ? 'null' : 'scale=' + tileWidth + ':-1:flags=lanczos,tile=' + columns + 'x' + Math.ceil(selected.size / columns)
    return [...input, '-vf', filter, '-frames:v', '1', outputStage]
  }
  return [...input, '-an', '-t', String(duration),
    '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-maxrate', '8M', '-bufsize', '12M',
    '-profile:v', 'high', '-level:v', '4.1', '-g', '60', '-color_primaries', 'bt709', '-colorspace', 'bt709', '-color_trc', 'bt709',
    join(work, 'picture.mp4')]
}

let browser, encoder
try {
  const location = await bundleDocument()
  mkdirSync(dirname(target), { recursive: true })
  browser = await puppeteer.launch({
    executablePath: chrome, headless: true, pipe: true, userDataDir: join(work, 'profile'),
    args: ['--disable-background-networking', '--disable-extensions', '--disable-crash-reporter', '--disable-sync', '--no-first-run', '--force-color-profile=srgb', '--hide-scrollbars', '--mute-audio'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.setRequestInterception(true)
  const asset = pathToFileURL(join(work, 'film.js')).href
  page.on('request', request => {
    const url = request.url()
    if (url === location || url === asset || url.startsWith('data:') || url.startsWith('blob:')) {
      void request.continue()
    } else {
      void request.abort()
    }
  })
  await page.goto(location, { waitUntil: 'load' })
  assert.deepEqual(errors, [], 'Error mounting film: ' + errors.join('\n'))
  await page.waitForFunction(() => typeof window.setFilmTime === 'function', { timeout: 12000 })
  await page.evaluate(async () => {
    window.setFilmTime(0)
    await document.fonts.ready
    window.filmAnimationOrigins = new WeakMap()
  })
  const cdp = await page.createCDPSession()
  encoder = spawn('ffmpeg', encoderArgs(), { stdio: ['pipe', 'inherit', 'inherit'] })
  const completed = once(encoder, 'close')
  let pipeError
  encoder.stdin.on('error', e => { pipeError = e })
  let previousPointer = [0, 0]
  for (let frame = 0; frame < frameCount; frame++) {
    const t = frame / fps
    const pointer = await page.evaluate(async time => {
      await window.setFilmTime(time)
      await document.fonts.ready
      return window.filmPointer
    }, t)
    // Let Chrome resolve the kit's real :hover selectors at the position
    // of the drawn pointer. The shot script supplies controlled click states.
    const position = Array.isArray(pointer) ? pointer : [-1, -1]
    if (position[0] !== previousPointer[0] || position[1] !== previousPointer[1]) {
      await page.mouse.move(position[0], position[1])
      previousPointer = position
    }
    await page.evaluate(time => {
      // Resolve state and pointer-driven CSS transitions together. Pause
      // every compositor timeline so encoder speed cannot advance it.
      document.documentElement.getBoundingClientRect()
      for (const anim of document.getAnimations()) {
        const origins = window.filmAnimationOrigins
        if (!origins.has(anim)) {
          const epoch = anim instanceof CSSAnimation
            ? anim.effect?.target?.closest?.('[data-film-epoch]')?.getAttribute('data-film-epoch')
            : null
          origins.set(anim, epoch == null ? time : Number(epoch))
        }
        anim.pause()
        anim.currentTime = Math.max(0, time - origins.get(anim)) * 1000
      }
    }, t)
    assert.deepEqual(errors, [], 'Frame ' + frame + ': ' + errors.join('\n'))
    // Contact sheets advance every native state but encode only requested frames.
    if (proof && !selected.has(frame)) continue
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false, fromSurface: true })
    if (pipeError) throw pipeError
    await new Promise((done, reject) => encoder.stdin.write(Buffer.from(data, 'base64'), error => error ? reject(error) : done()))
    if (!proof && (frame + 1) % 90 === 0) console.log('Captured ' + (frame + 1) + ' of ' + frames + ' frames')
  }
  encoder.stdin.end()
  assert.equal((await completed)[0], 0, 'FFmpeg could not finish the output')
  if (!proof) {
    // Hover ticks are collected by the mounted kit during frame capture.
    // Render and mux the soundtrack only after all interactions have played.
    const events = await page.evaluate(() => window.filmSounds)
    assert(Array.isArray(events) && events.length, 'Expected a sound cue timeline from the film')
    const manifest = join(work, 'events.json')
    const wav = join(work, 'audio.wav')
    writeFileSync(manifest, JSON.stringify(events))
    const audio = spawnSync(process.execPath, [join(import.meta.dir, 'audio.mjs'), manifest, wav], { stdio: 'inherit' })
    assert.equal(audio.status, 0, 'The component sound render failed')
    const mux = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', join(work, 'picture.mp4'), '-i', wav,
      '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-profile:a', 'aac_low',
      '-b:a', '192k', '-ar', '48000', '-t', String(duration), '-movflags', '+faststart',
      '-metadata', 'title=CyberSpec — Component kit for React', outputStage,
    ], { stdio: 'inherit' })
    assert.equal(mux.status, 0, 'The final mux failed')
  }
  renameSync(outputStage, target)
  console.log(target)
} finally {
  if (encoder && encoder.exitCode == null) encoder.kill()
  if (browser) await browser.close()
  rmSync(work, { recursive: true, force: true })
  if (existsSync(outputStage)) rmSync(outputStage)
}
