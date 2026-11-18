// Build the edit's stereo audio on a 48 kHz sample clock.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const rate = 48_000
const samples = seconds => Math.round(seconds * rate)
const firstCueStart = samples(.004)
const firstCueEnd = samples(1.120)

export function prepareAudio({
  sourceVideo, sourceSfx, outWav, introSeconds, bodySeconds, outroSeconds,
  bodyStart = 0, ranges = [{start: bodyStart, duration: bodySeconds}],
}) {
  assert(ranges.length && ranges.every(({start, duration}) =>
    Number.isFinite(start) && start >= 0 && Number.isFinite(duration) && duration > 0),
    'Expected a positive duration for each source range')
  assert([introSeconds, outroSeconds].every(value => Number.isFinite(value) && value >= 0))
  const intro = samples(introSeconds)
  const lengths = ranges.map(({duration}) => samples(duration))
  const body = lengths.reduce((sum, count) => sum + count, 0)
  if (bodySeconds !== undefined) {
    assert(Math.abs(body - samples(bodySeconds)) <= ranges.length, 'Body duration disagrees with ranges')
  }
  const total = intro + body + samples(outroSeconds)
  const chain = []
  // Keep the original channel placement, pitch, level and duration. De-click
  // each source boundary with a 3 ms ramp. Padding covers at most an absent
  // terminal frame when the chosen video cut rounds past the AAC stream.
  ranges.forEach(({start}, i) => {
    const count = lengths[i]
    const ramp = Math.min(samples(.003), Math.floor(count/2))
    const begin = samples(start)
    assert(ramp > 0)
    chain.push('[0:a:0]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,' +
      'atrim=start_sample=' + begin + ':end_sample=' + (begin + count) + ',asetpts=PTS-STARTPTS,' +
      'apad=whole_len=' + count + ',atrim=end_sample=' + count + ',' +
      'afade=t=in:ss=0:ns=' + ramp + ',afade=t=out:ss=' + (count - ramp) + ':ns=' + ramp + '[r' + i + ']')
  })
  const segments = ranges.map((_, i) => '[r' + i + ']').join('')
  chain.push(segments + 'concat=n=' + ranges.length + ':v=0:a=1,adelay=' + intro + 'S:all=1[body]')
  // The first variation's recorded decay ends before the next attack at
  // 1.381 s. Use the project's measured 4–1120 ms extraction in stereo.
  const cueLength = firstCueEnd - firstCueStart
  chain.push('[1:a:0]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,' +
    'atrim=start_sample=' + firstCueStart + ':end_sample=' + firstCueEnd + ',asetpts=PTS-STARTPTS,' +
    'afade=t=in:ss=0:ns=24,afade=t=out:ss=' + (cueLength - 96) + ':ns=96,asplit=3[cue1][hit][cue2]')
  chain.push('[cue1]adelay=' + samples(.15) + 'S:all=1[open]')
  const hitLength = samples(.11), release = samples(.006)
  chain.push('[hit]atrim=end_sample=' + hitLength + ',volume=0.5,afade=t=out:ss=' +
    (hitLength - release) + ':ns=' + release + ',adelay=' + Math.max(0, intro - samples(.24)) + 'S:all=1[tear]')
  chain.push('[cue2]adelay=' + (intro + body) + 'S:all=1[close]')
  chain.push('[body][open][tear][close]amix=inputs=4:normalize=0:duration=longest,' +
    'apad=whole_len=' + total + ',atrim=end_sample=' + total + '[audio]')
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-i', sourceVideo, '-i', sourceSfx, '-filter_complex', chain.join(';'), '-map', '[audio]',
    '-ar', String(rate), '-ac', '2', '-c:a', 'pcm_s24le', outWav,
  ], {encoding: 'utf8'})
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr || 'FFmpeg audio mix failed')
}
