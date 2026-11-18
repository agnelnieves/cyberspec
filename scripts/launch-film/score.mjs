// Original eight-bar score. Render with: bun scripts/launch-film/score.mjs destination.wav
import { writeFileSync } from "node:fs"

const rate = 48000
const beat = 60 / 128
const frames = 32 * beat * rate
const tau = Math.PI * 2
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12)
const dry = [new Float64Array(frames), new Float64Array(frames)]
const room = new Float64Array(frames)
const duck = new Float32Array(frames)

let seed = 0x86ac58e
function noise() {
  seed ^= seed << 13
  seed ^= seed >>> 17
  seed ^= seed << 5
  return (seed >>> 0) / 0x80000000 - 1
}

// Pan is equal-power. Room and ducking sends are per instrument.
function voice(at, length, gain, sample, { pan = 0, send = 0, ducking = 0 } = {}) {
  const start = Math.round(at * beat * rate)
  const count = Math.min(Math.round(length * rate), frames - start)
  const angle = (1 + pan) * Math.PI / 4
  const left = gain * Math.cos(angle)
  const right = gain * Math.sin(angle)
  for (let i = 0; i < count; i++) {
    const t = i / rate
    const edge = Math.min(1, i / 28, (count - 1 - i) / 150)
    const level = sample(t) * edge * (1 - ducking * duck[start + i])
    dry[0][start + i] += left * level
    dry[1][start + i] += right * level
    room[start + i] += gain * send * level
  }
}

function kick(at, gain = 1) {
  const start = Math.round(at * beat * rate)
  for (let i = 0; i < 0.35 * rate && start + i < frames; i++) {
    duck[start + i] = Math.max(duck[start + i], Math.exp(-i / (rate * 0.085)))
  }
  voice(at, 0.41, 0.85 * gain, (t) => {
    const phase = tau * (51 * t + 4.1 * (1 - Math.exp(-t * 35)))
    const body = Math.sin(phase) + 0.16 * Math.sin(2 * phase) * Math.exp(-t * 13)
    const beater = (0.15 * noise() + 0.19 * Math.sin(tau * 1080 * t)) * Math.exp(-t * 290)
    return Math.tanh(1.55 * body) * Math.exp(-t * 12.5) + beater
  })
}

function snare(at, gain = 1, pan = 0.08) {
  let lo = 0
  let hi = 0
  voice(at, 0.24, gain * 0.61, (t) => {
    const n = noise()
    lo += 0.18 * (n - lo)
    hi += 0.76 * (n - hi)
    const rattle = (hi - lo) * (Math.exp(-t * 29) + (t > 0.014 ? 0.54 * Math.exp(-(t - 0.014) * 46) : 0))
    const shell = Math.sin(tau * (196 * t + 0.34 * (1 - Math.exp(-65 * t))))
    return 1.15 * rattle + 0.66 * shell * Math.exp(-t * 32)
  }, { pan, send: 0.27 })
}

function tick(at, gain, freq, pan, decay = 95) {
  let slow = 0
  let prev = 0
  voice(at, 6 / decay, gain, (t) => {
    const n = noise()
    slow += 0.48 * (n - slow)
    const fizz = slow - prev
    prev = slow
    const pin = Math.sin(tau * freq * t + 1.8 * Math.exp(-t * 350) * Math.sin(tau * freq * 1.46 * t))
    return (1.6 * fizz + 0.43 * pin) * Math.exp(-t * decay)
  }, { pan, send: 0.23 })
}

function bass(at, pitch, hold, gain = 1) {
  const f = hz(pitch)
  let filtered = 0
  voice(at, hold + 0.20, 0.56 * gain, (t) => {
    const phase = tau * f * t
    const string = Math.sin(phase + 1.6 * Math.exp(-t * 14) * Math.sin(phase)) +
      0.34 * Math.sin(phase * 2) + 0.20 * Math.sin(phase * 3) + 0.08 * Math.sin(phase * 5)
    const cutoff = 260 + 1000 * Math.exp(-t * 15)
    filtered += (1 - Math.exp(-tau * cutoff / rate)) * (string - filtered)
    return Math.tanh(1.1 * filtered) * (1 - Math.exp(-t * 160)) * Math.exp(-t * 1.8 - Math.max(0, t - hold) * 38)
  }, { ducking: 0.70 })
}

// FM resonator with a fast metallic attack and a softer, nearly sinusoidal tail.
function key(at, pitch, gain = 1, decay = 4.7, pan = 0) {
  const f = hz(pitch)
  voice(at, Math.min(2.8, 7 / decay), 0.40 * gain, (t) => {
    const phase = tau * f * t
    const index = 1.85 * Math.exp(-t * 13) + 0.16
    return (Math.sin(phase + index * Math.sin(phase * 2.003)) +
      0.19 * Math.sin(phase * 1.005 + 1.1 * Math.exp(-t * 8) * Math.sin(phase * 3))) *
      (1 - Math.exp(-t * 260)) * Math.exp(-t * decay)
  }, { pan, send: 0.37, ducking: 0.20 })
}

function halo(at, notes, duration, gain, decay) {
  notes.forEach((note, i) => {
    const f = hz(note)
    voice(at, duration, gain / Math.sqrt(notes.length), (t) => {
      const phase = tau * f * t
      const air = 0.31 * Math.sin(phase * 1.003 + 0.4 * Math.sin(phase * 2))
      return (Math.sin(phase) + air + 0.14 * Math.sin(phase * 2)) *
        (1 - Math.exp(-t * 7)) * Math.exp(-t * decay) * Math.min(1, (duration - t) / 0.45)
    }, { pan: (i / (notes.length - 1) - 0.5) * 0.95, send: 0.52, ducking: 0.48 })
  })
}

// A band-passed rush rises into the cut and ends just ahead of its transient.
function inhale(endBeat, length, gain, pan) {
  let low = 0
  let band = 0
  const duration = length * beat
  voice(endBeat - length, duration - 0.010, gain, (t) => {
    const p = t / duration
    const f = 2 * Math.sin(Math.PI * (190 + 2500 * p ** 2.8) / rate)
    low += f * band
    band += f * (noise() - low - 0.63 * band)
    return 2.1 * band * p ** 2
  }, { pan, send: 0.20 })
}

// A fingertip moving across fine mechanical detents. The detents accelerate
// in the middle of the drag; each one resonates a little higher than the last.
function slider(at, duration) {
  let phase = 0
  let carrier = 0
  voice(at, duration, 0.18, (t) => {
    const p = t / duration
    const speed = Math.sin(Math.PI * p)
    phase += (8 + 38 * speed ** 2) / rate
    carrier += tau * (540 + 775 * p) / rate
    const impact = Math.exp(-21 * (phase % 1))
    return speed * (Math.sin(carrier + 0.90 * Math.sin(carrier * 2.7)) + 0.31 * noise()) * impact
  }, { pan: -0.18, send: 0.26 })
}

function scan(at, duration) {
  let phase = 0
  voice(at, duration, 0.11, (t) => {
    const p = t / duration
    phase += tau * (330 * 2 ** (1.72 * p)) / rate
    return Math.sin(Math.PI * p) ** 1.1 *
      (Math.sin(phase + 0.6 * Math.sin(phase * 2)) + 0.15 * Math.sin(phase * 4))
  }, { pan: 0.18, send: 0.30 })
}

// Drum programming develops in four-bar phrases before the short breakdown.
const kicks = [
  [0, 1], [2.75, 0.64], [4, 0.95], [5.5, 0.72], [7.25, 0.7],
  [8, 1], [9.5, 0.74], [11.25, 0.82], [12, 1], [14.5, 0.8], [15.25, 0.68],
  [16, 1], [17.5, 0.76], [19.25, 0.74], [20, 1], [21.75, 0.75], [23.25, 0.8],
  [24, 0.94], [26, 1.05],
]
kicks.forEach(([at, gain]) => kick(at, gain))
for (const [at, gain] of [[2, 0.66], [6, 0.85], [10, 1], [13, 0.52], [14, 1], [18, 1], [21, 0.43], [22, 1], [24.75, 0.51]]) {
  snare(at, gain)
}

for (let bar = 1; bar <= 5; bar++) {
  const accents = bar % 2 ? [0.50, 1.25, 2.50, 3.50, 3.75] : [0.75, 1.50, 2.50, 3.25]
  accents.forEach((slot, i) => {
    tick(bar * 4 + slot, [0.19, 0.10, 0.18, 0.12, 0.09][i], 1840 + 810 * (i % 3),
      (i % 2 ? -0.39 : 0.31), i === 2 ? 51 : 109)
  })
}
for (const [at, gain, freq, pan] of [
  [0.50, 0.13, 2800, -0.4], [0.75, 0.12, 3500, 0.4], [1.50, 0.14, 2420, 0.3],
  [7.75, 0.16, 1580, -0.4], [15.75, 0.16, 1780, -0.3], [23.75, 0.17, 1680, 0.3],
  [25, 0.18, 2300, -0.35], [25.25, 0.12, 1700, 0.25], [26, 0.35, 2420, 0],
]) tick(at, gain, freq, pan)

const roots = [38, 38, 34, 36, 38, 34]
for (let bar = 0; bar < roots.length; bar++) {
  const root = roots[bar]
  const pattern = bar === 0 ? [[0, 0, 0.64, 0.88], [2.75, 0, 0.24, 0.76]] :
    [[0, 0, 0.40, 1], [0.75, 12, 0.12, 0.62], [1.50, 0, 0.19, 0.83],
      [2.75, 7, 0.15, 0.82], [3.25, 0, 0.21, 0.97]]
  pattern.forEach(([slot, interval, length, gain]) => bass(bar * 4 + slot, root + interval, length, gain))
}
bass(24, 33, 0.28, 1)
bass(26, 38, 1.12, 1)

// The same three-note figure is reharmonized when the product sequence opens up.
const notes = [
  [0, 74, 0.88, 3.9], [0.75, 69, 0.66, 6], [1.5, 76, 0.72, 4.4],
  [4, 62, 0.69, 4.8], [4.75, 69, 0.55, 6.2], [5.5, 65, 0.71, 3.7],
  [8, 74, 0.92, 4], [8.75, 69, 0.68, 6], [9.5, 76, 0.75, 4.3], [11.5, 72, 0.55, 6.7],
  [12, 67, 0.72, 4.6], [12.75, 69, 0.66, 6.2], [13.5, 76, 0.79, 4.3],
  [16, 74, 0.94, 3.9], [16.75, 69, 0.73, 6], [17.5, 76, 0.78, 4.4], [19, 77, 0.64, 5.2],
  [20, 74, 0.84, 4.2], [20.75, 69, 0.66, 6], [21.5, 65, 0.72, 3.7], [23.5, 69, 0.55, 5.4],
  [24, 73, 0.75, 4.8], [24.75, 76, 0.62, 7.4], [25.25, 81, 0.44, 8.3],
  [26, 74, 1.05, 2.7], [26.75, 69, 0.66, 3.8], [27.5, 77, 0.75, 2.6],
]
notes.forEach(([at, pitch, gain, decay], i) => key(at, pitch, gain, decay, [-0.12, 0.22, -0.04][i % 3]))
halo(0, [50, 57, 64], 1.72, 0.10, 0.60)
halo(8, [53, 57, 62], 1.72, 0.12, 0.53)
halo(16, [53, 57, 64], 1.72, 0.14, 0.50)
halo(20, [53, 57, 62], 1.72, 0.12, 0.55)
halo(26, [50, 57, 65, 76], 2.70, 0.24, 1.08)

for (const [end, length, gain, pan] of [
  [4, 0.70, 0.29, 0.26], [8, 1.3, 0.41, -0.26], [12, 0.5, 0.27, 0.30],
  [16, 1, 0.40, -0.19], [20, 0.65, 0.30, 0.25], [24, 0.75, 0.29, -0.28], [26, 0.65, 0.50, 0],
]) inhale(end, length, gain, pan)

slider(12 + 0.17 / beat, 0.95)
tick(12 + 1.12 / beat, 0.26, 1190, -0.18, 85)
scan(16, 0.67)
tick(20 + 0.36 / beat, 0.23, 1630, -0.17, 109)
tick(20 + 0.99 / beat, 0.37, 2140, 0.12, 73)
key(20 + 1.015 / beat, 81, 0.38, 12, 0.12)

// Asymmetric early reflections followed by a dark, diffuse stereo decay.
const reflections = [
  [[0.027, 0.17], [0.061, -0.12], [0.113, 0.13], [0.184, 0.12], [0.335, -0.09], [0.53, 0.08], [0.77, 0.04]],
  [[0.039, 0.16], [0.076, 0.14], [0.138, -0.11], [0.207, 0.12], [0.354, 0.09], [0.48, -0.07], [0.80, 0.04]],
]
for (let ch = 0; ch < 2; ch++) {
  const taps = reflections[ch].map(([time, gain]) => [Math.round(time * rate), gain])
  let smooth = 0
  let dc = 0
  for (let i = 0; i < frames; i++) {
    let wet = 0
    for (const [delay, gain] of taps) if (i >= delay) wet += room[i - delay] * gain
    smooth += 0.31 * (wet - smooth)
    const mix = dry[ch][i] + smooth
    dc += (1 - Math.exp(-tau * 21 / rate)) * (mix - dc)
    dry[ch][i] = Math.tanh((mix - dc) * 1.7) * Math.min(1, (frames - i - 1) / (0.12 * rate))
  }
}

let peak = 0
for (const channel of dry) for (const value of channel) peak = Math.max(peak, Math.abs(value))
const master = 10 ** (-4.0 / 20) / peak
const wav = Buffer.alloc(44 + frames * 4)
wav.write("RIFF", 0)
wav.writeUInt32LE(wav.length - 8, 4)
wav.write("WAVEfmt ", 8)
wav.writeUInt32LE(16, 16)
wav.writeUInt16LE(1, 20)
wav.writeUInt16LE(2, 22)
wav.writeUInt32LE(rate, 24)
wav.writeUInt32LE(rate * 4, 28)
wav.writeUInt16LE(4, 32)
wav.writeUInt16LE(16, 34)
wav.write("data", 36)
wav.writeUInt32LE(frames * 4, 40)
for (let i = 0; i < frames; i++) {
  for (let ch = 0; ch < 2; ch++) wav.writeInt16LE(Math.round(dry[ch][i] * master * 32767), 44 + 4 * i + 2 * ch)
}
writeFileSync(process.argv[2] ?? "/private/tmp/cyberspec-film-score.wav", wav)
