#!/usr/bin/env bun
// Add the kit's recorded feedback to render-social.mjs's virtual-clock export.
import assert from "node:assert/strict"
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, extname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { spawn } from "node:child_process"

const help = `Usage: bun scripts/mix-social-audio.mjs [options]
  --input PATH       Silent video (output/social/cyberspec-loop.mp4)
  --manifest PATH    Renderer JSON (same stem as --input)
  --out PATH         MP4 (input stem + -with-sound.mp4)
  --wav PATH         PCM24 WAV (same stem as --out)
  --adjust-ms N      Fallback duration without sound-adjust-end (950)
  --peak-db N        Mixed PCM peak in dBFS (-3; allowed -24 through -1.5)
  --inspect-samples  Decode and report the recorded assets without a video
  --help             Show this help

Requires Bun, ffmpeg, ffprobe, and a complete render-social.mjs manifest.
Relative gains come from sound.ts. One common gain lifts the export level;
the AAC is measured for true peak and reduced if it would exceed -1 dBTP.
The video stream is copied. At least 50 ms of silence guards both loop edges.
`
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
if (args.includes("--help")) { console.log(help); process.exit(0) }
const options = new Map()
const allowed = new Set(["input", "manifest", "out", "wav", "adjust-ms", "peak-db"])
let inspect = false
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--inspect-samples") { inspect = true; continue }
  const key = args[i].replace(/^--/, "")
  assert(args[i].startsWith("--") && allowed.has(key) && args[i + 1] && !args[i + 1].startsWith("--"), `Unknown option or missing value: ${args[i]}\n${help}`)
  assert(!options.has(key), `Duplicate option: ${args[i]}`)
  options.set(key, args[++i])
}
const input = resolve(root, options.get("input") || "output/social/cyberspec-loop.mp4")
assert.equal(extname(input).toLowerCase(), ".mp4", "--input must name an .mp4 file")
const inputStem = input.slice(0, -4)
const manifestPath = resolve(root, options.get("manifest") || `${inputStem}.json`)
const output = resolve(root, options.get("out") || `${inputStem}-with-sound.mp4`)
assert.equal(extname(output).toLowerCase(), ".mp4", "--out must name an .mp4 file")
const wav = resolve(root, options.get("wav") || `${output.slice(0, -4)}.wav`)
assert.equal(extname(wav).toLowerCase(), ".wav", "--wav must name a .wav file")
assert(new Set([input, manifestPath, output, wav]).size === 4, "Input, manifest, MP4 and WAV paths must be different")
const adjustmentSeconds = Number(options.get("adjust-ms") || 950) / 1000
const peakDb = Number(options.get("peak-db") || -3)
assert(Number.isFinite(adjustmentSeconds) && adjustmentSeconds > 0 && adjustmentSeconds <= 60, "--adjust-ms must be between 0 and 60000")
assert(Number.isFinite(peakDb) && peakDb >= -24 && peakDb <= -1.5, "--peak-db must be between -24 and -1.5")

// Import the data module with Bun, rather than parsing its base64 with a regex.
const { soundSamples } = await import(pathToFileURL(resolve(root, "registry/cyber/lib/sound-samples.ts")).href)
const soundCode = readFileSync(resolve(root, "registry/cyber/lib/sound.ts"), "utf8")
function level(pattern, name) {
  const value = Number(soundCode.match(pattern)?.[1])
  assert(Number.isFinite(value) && value > 0 && value <= 1, `Cannot read ${name} gain from sound.ts; review the sound engine before mixing`)
  return value
}
const master = level(/master\.gain\.value = ([\d.]+)/, "master")
const gains = {
  on: level(/on: \(at\) => sample\("on", at, ([\d.]+)\)/, "on"),
  increment: level(/increment: \(at\) => sample\("increment", at, ([\d.]+)\)/, "increment"),
  press: level(/press: \(at\) => sample\("press", at, ([\d.]+)\)/, "press"),
  adjust: level(/source\.buffer = sampleBuffer\("adjust"\)[\s\S]*?gain\.gain\.value = ([\d.]+)/, "adjust"),
}
const sampleRate = 48000
// Explicit dual mono keeps each channel at the mixed level. ffmpeg's default
// mono-to-stereo matrix would otherwise lower it by 3 dB.
const stereo = "pan=stereo|c0=c0|c1=c0"
const decoded = new Map()
function decode(name) {
  if (decoded.has(name)) return decoded.get(name)
  const sample = soundSamples[name]
  assert(sample && sample.sampleRate === sampleRate, `${name} must be mono PCM16LE at ${sampleRate} Hz`)
  const bytes = Buffer.from(sample.pcm, "base64")
  assert(bytes.length > 0 && bytes.length % 2 === 0, `Invalid PCM for ${name}`)
  const data = new Float64Array(bytes.length / 2)
  for (let i = 0; i < data.length; i++) data[i] = bytes.readInt16LE(i * 2) / 32768
  decoded.set(name, data)
  return data
}
const db = (value) => value > 0 ? 20 * Math.log10(value) : -Infinity
function peak(data) {
  let maximum = 0
  for (const value of data) maximum = Math.max(maximum, Math.abs(value))
  return maximum
}
if (inspect) {
  console.log(JSON.stringify(Object.entries(gains).map(([name, gain]) => {
    const data = decode(name)
    return { name, sampleRate, samples: data.length, seconds: data.length / sampleRate, gain, master, peakDbFS: db(peak(data)) }
  }), null, 2))
  process.exit(0)
}

const run = (command, argv) => new Promise((done, reject) => {
  const child = spawn(command, argv, { stdio: ["ignore", "pipe", "pipe"] })
  let stdout = "", stderr = ""
  child.stdout.on("data", (chunk) => { stdout += chunk })
  child.stderr.on("data", (chunk) => { stderr += chunk })
  child.once("error", reject)
  child.once("close", (code) => code === 0 ? done({ stdout, stderr }) : reject(new Error(`${command} exited ${code}: ${stderr}`)))
})
const probe = async (path) => JSON.parse((await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", path])).stdout)
assert(existsSync(input) && existsSync(manifestPath), `Render a complete loop first: missing ${!existsSync(input) ? input : manifestPath}`)
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
assert.equal(manifest.completeLoop, true, "A complete loop manifest is required; partial smoke captures cannot verify the sound seam")
const duration = manifest.duration
assert(Number.isFinite(duration) && duration > 0 && duration <= 600, "Invalid manifest duration")
assert(Number.isFinite(manifest.fps) && manifest.fps > 0 && Number.isSafeInteger(manifest.frames) && manifest.frames > 0, "Invalid manifest frames/fps")
assert(Math.abs(manifest.frames / manifest.fps - duration) < 0.000001, "Manifest duration does not match frames/fps")
assert(Array.isArray(manifest.marks), "Manifest marks must be an array")
const sourceProbe = await probe(input)
const sourceVideo = sourceProbe.streams.find((stream) => stream.codec_type === "video")
assert(sourceVideo && Number.isFinite(Number(sourceVideo.duration)), "Input needs a video stream with a known duration")
assert(Math.abs(Number(sourceVideo.duration) - duration) < 1 / manifest.fps + 0.001, "Video duration does not match its manifest")
const mapping = { "sound-on": "on", "sound-adjust": "adjust", "sound-increment": "increment", "sound-press": "press", "sound-reset": "press" }
const soundMarks = manifest.marks.filter((mark) => typeof mark.mark === "string" && mark.mark.startsWith("sound-"))
for (const mark of soundMarks) {
  assert(Object.hasOwn(mapping, mark.mark) || mark.mark === "sound-adjust-end", `Unmapped sound marker: ${mark.mark}`)
  assert(Number.isFinite(mark.seconds) && mark.seconds >= 0 && mark.seconds < duration, `Invalid time for ${mark.mark}`)
}
soundMarks.sort((a, b) => a.seconds - b.seconds)
const cues = []
let adjustment = null
for (const mark of soundMarks) {
  if (mark.mark === "sound-adjust-end") {
    assert(adjustment && mark.seconds > adjustment.start, "sound-adjust-end needs a preceding sound-adjust marker")
    adjustment.movementSeconds = mark.seconds - adjustment.start
    adjustment.seconds = adjustment.movementSeconds + 0.005
    adjustment = null
    continue
  }
  const name = mapping[mark.mark]
  const data = decode(name)
  // Reset is a button press. Its programmatic switch reset does not trigger
  // the engine's user-toggle listener, so it gets no additional off sample.
  const cue = { mark: mark.mark, name, start: mark.seconds, seconds: name === "adjust" ? adjustmentSeconds + 0.005 : data.length / sampleRate, gain: gains[name] * master }
  if (name === "adjust") {
    cue.movementSeconds = adjustmentSeconds
    adjustment = cue
  }
  cues.push(cue)
}
for (const marker of Object.keys(mapping)) assert(cues.some((cue) => cue.mark === marker), `Missing ${marker} in the complete loop`)
const seamSilence = 0.05
for (const cue of cues) {
  assert(cue.start >= seamSilence && cue.start + cue.seconds <= duration - seamSilence, `${cue.mark} crosses the ${seamSilence * 1000}ms silent loop margin; adjust scene timing instead of cutting off its sound`)
}
const mix = new Float64Array(Math.round(duration * sampleRate))
for (const cue of cues) {
  const data = decode(cue.name), offset = Math.round(cue.start * sampleRate)
  const length = Math.round(cue.seconds * sampleRate)
  const releaseAt = Math.round((cue.movementSeconds ?? 0) * sampleRate)
  for (let i = 0; i < length; i++) {
    // Match createAdjustmentSound: one continuous recording loop, followed
    // by a 4ms gain ramp and source stop at 5ms when movement is released.
    const envelope = cue.name === "adjust" && i >= releaseAt ? Math.max(0, 1 - (i - releaseAt) / (sampleRate * 0.004)) : 1
    mix[offset + i] += data[i % data.length] * cue.gain * envelope
  }
}
const originalPeak = peak(mix)
assert(originalPeak > 0, "The rendered soundtrack is silent")
let normalization = 10 ** (peakDb / 20) / originalPeak

// IEEE float WAV preserves precision until the final PCM24 and AAC encodes.
function writeFloatWav(path, gain) {
  const buffer = Buffer.alloc(44 + mix.length * 4)
  buffer.write("RIFF", 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write("WAVEfmt ", 8)
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(3, 20); buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 4, 28)
  buffer.writeUInt16LE(4, 32); buffer.writeUInt16LE(32, 34)
  buffer.write("data", 36); buffer.writeUInt32LE(mix.length * 4, 40)
  for (let i = 0; i < mix.length; i++) buffer.writeFloatLE(mix[i] * gain, 44 + i * 4)
  writeFileSync(path, buffer)
}
mkdirSync(dirname(output), { recursive: true })
mkdirSync(dirname(wav), { recursive: true })
const temp = mkdtempSync(resolve(dirname(output), ".mix-social-audio-"))
try {
  const floatWav = resolve(temp, "mix.wav"), candidate = resolve(temp, "output.mp4"), pcmWav = resolve(temp, "output.wav")
  let truePeak = Infinity
  for (let attempt = 0; attempt < 3; attempt++) {
    writeFloatWav(floatWav, normalization)
    await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-i", floatWav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", stereo, "-c:a", "aac", "-profile:a", "aac_low", "-b:a", "192k", "-ar", String(sampleRate), "-ac", "2", "-t", String(duration), "-movflags", "+faststart", candidate])
    const measured = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", candidate, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"])
    const match = measured.stderr.match(/True peak:\s*\n\s*Peak:\s*(-?[\d.]+) dBFS/)
    assert(match, "ffmpeg did not report the encoded AAC true peak")
    truePeak = Number(match[1])
    if (truePeak <= -1.5) break
    normalization *= 10 ** ((-1.6 - truePeak) / 20)
  }
  assert(truePeak <= -1.5, `AAC true peak ${truePeak} dBTP exceeds the safety ceiling`)
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", floatWav, "-af", stereo, "-c:a", "pcm_s24le", pcmWav])
  const encoded = await probe(candidate)
  const audio = encoded.streams.find((stream) => stream.codec_type === "audio")
  assert.equal(audio?.codec_name, "aac"); assert.equal(audio?.profile, "LC")
  assert.equal(Number(audio?.sample_rate), sampleRate); assert.equal(audio?.channels, 2)
  assert(Math.abs(Number(audio.duration) - duration) < 0.025, "AAC duration does not match the loop")
  const videoHash = async (path) => (await run("ffmpeg", ["-v", "error", "-i", path, "-map", "0:v:0", "-c:v", "copy", "-f", "hash", "-hash", "sha256", "-"])).stdout.trim()
  const hashes = await Promise.all([videoHash(input), videoHash(candidate)])
  assert.equal(hashes[0], hashes[1], "Video packets changed during audio muxing")
  copyFileSync(pcmWav, wav)
  copyFileSync(candidate, output)
  console.log(JSON.stringify({ output, wav, duration, sampleRate, channels: 2, encodedTruePeakDbTP: truePeak, pcmPeakDbFS: db(originalPeak * normalization), normalizationDb: db(normalization), silentEdgeMinimumMs: seamSilence * 1000, videoPacketsUnchanged: true, cues }, null, 2))
} finally {
  rmSync(temp, { recursive: true, force: true })
}
