// bun scripts/component-film/audio.mjs events.json soundtrack.wav
// An event is {time, voice} in seconds. "adjust" also takes the movement
// duration, up to the moment of pointer release. The reel runs for 15 seconds.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { soundSamples } from '../../registry/cyber/lib/sound-samples.ts'

const rate = 48000
const tickVoices = new Set(['hover', 'select', 'tick', 'open', 'close', 'type', 'glitch', 'agent'])

// Sound identities and bus gains follow registry/cyber/lib/sound.ts. These
// are the kit's embedded PCM recordings, including their in-file decay tails.
const recordings = {
  tick: ['hover', .42],
  increment: ['increment', .42],
  decrement: ['decrement', .42],
  press: ['press', .14],
  on: ['on', .12],
  off: ['off', .12],
  'modal-open': ['modalOpen', .1],
  'modal-close': ['modalCloseBase', .1, true],
  adjust: ['adjust', .195],
}
const samples = new Map()
function pcm(name) {
  if (samples.has(name)) return samples.get(name)
  const sample = soundSamples[name]
  assert.equal(sample.sampleRate, rate)
  const bytes = Buffer.from(sample.pcm, 'base64')
  const decoded = Float64Array.from({ length: bytes.length / 2 }, (_, i) => bytes.readInt16LE(i * 2) / 32768)
  samples.set(name, decoded)
  return decoded
}

function record(mix, start, voice, movement) {
  const [name, gain, reverse] = recordings[voice]
  const data = pcm(name)
  const adjusting = voice === 'adjust'
  if (adjusting) assert(Number.isFinite(movement) && movement > 0, 'adjust needs the positive duration of accepted movement')
  const release = adjusting ? Math.round(movement * rate) : data.length
  const length = adjusting ? release + Math.round(.005 * rate) : data.length
  const frames = Math.min(length, mix.length - start)
  for (let i = 0; i < frames; i++) {
    // The engine starts a looping source on movement, then ramps its gain to
    // zero over four milliseconds and stops the source after five.
    const envelope = i < release ? 1 : Math.max(0, 1 - (i - release) / (.004 * rate))
    const at = reverse ? data.length - 1 - i : i % data.length
    mix[start + i] += data[at] * envelope * gain
  }
}

function chimeNote(mix, start, frequency, seconds) {
  // The success toast's two sine oscillators, including the engine's 4 ms
  // exponential attack, decay back to .0001, and 20 ms oscillator tail.
  const attack = .004, floor = .0001, level = .07
  const frames = Math.min(Math.round((seconds + .02) * rate), mix.length - start)
  for (let i = 0; i < frames; i++) {
    const t = i / rate
    const envelope = t < attack
      ? floor * (level / floor) ** (t / attack)
      : level * (floor / level) ** Math.min(1, (t - attack) / (seconds - attack))
    mix[start + i] += envelope * Math.sin(t * frequency * Math.PI * 2)
  }
}

function writeWav(path, mix) {
  const channels = 2, bytesPerFrame = channels * 3
  let peak = 0
  for (const value of mix) peak = Math.max(peak, Math.abs(value))
  assert(peak > 0, 'Timeline produced no audible events')
  // One common trim for the whole film preserves the kit's balance. Both
  // stereo channels carry the same signal, as on the original mono bus.
  const gain = 10 ** (-3.5 / 20) / peak
  const buffer = Buffer.alloc(44 + mix.length * bytesPerFrame)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(buffer.length - 8, 4)
  buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels, 22)
  buffer.writeUInt32LE(rate, 24)
  buffer.writeUInt32LE(rate * bytesPerFrame, 28)
  buffer.writeUInt16LE(bytesPerFrame, 32)
  buffer.writeUInt16LE(24, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(buffer.length - 44, 40)
  for (let i = 0; i < mix.length; i++) {
    const value = Math.round(mix[i] * gain * 8388607)
    const offset = 44 + i * bytesPerFrame
    buffer.writeIntLE(value, offset, 3)
    buffer.writeIntLE(value, offset + 3, 3)
  }
  writeFileSync(path, buffer)
}

export function renderComponentAudio(events, outputPath) {
  const seconds = 15
  assert(Array.isArray(events), 'Expected an array of {time, voice} events')
  const mix = new Float64Array(seconds * rate)
  let lastFamily, lastTime = -Infinity
  for (const { time, voice, duration } of events.toSorted((a, b) => a.time - b.time)) {
    assert(Number.isFinite(time) && time >= 0 && time < seconds, 'An event time is outside the film')
    const family = tickVoices.has(voice) ? 'tick' : voice === 'confirm' ? 'press' : voice
    assert(Object.hasOwn(recordings, family) || family === 'success', 'Unmapped component voice: ' + voice)
    // Continuous motion has its own source. Discrete voices share the kit's
    // 25 ms coalescing rule when a single action also changes a popup state.
    if (family !== 'adjust') {
      if (family === lastFamily && time - lastTime < .025) continue
      lastFamily = family
      lastTime = time
    }
    const start = Math.round((time + .001) * rate)
    if (family === 'success') {
      chimeNote(mix, start, 988, .08)
      chimeNote(mix, start + Math.round(.075 * rate), 1480, .16)
    } else {
      record(mix, start, family, duration)
    }
  }
  writeWav(outputPath, mix)
}

if (import.meta.main) {
  const [eventPath, outputPath] = process.argv.slice(2)
  assert(eventPath && outputPath, 'Use bun scripts/component-film/audio.mjs events.json soundtrack.wav')
  renderComponentAudio(JSON.parse(readFileSync(eventPath, 'utf8')), outputPath)
}
