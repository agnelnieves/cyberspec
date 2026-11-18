// bun scripts/footage-edit/render.mjs --video /path/cyberspec.mp4 --sfx /path/beeps.mp3 --edit full|x
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import { once } from 'node:events'
import { Brand } from '../../src/Brand.tsx'
import { makeCards } from './cards.mjs'
import { makeSplice } from './splice.mjs'
import { prepareAudio } from './audio.mjs'

const {values}=parseArgs({options:{video:{type:'string'},sfx:{type:'string'},edit:{type:'string',default:'full'},out:{type:'string'}}})
assert(values.video && values.sfx, 'Supply the source recording with --video and the variations file with --sfx')
assert(['full','x'].includes(values.edit),'Choose full or x')
const root=resolve(import.meta.dir,'../..'), short=values.edit==='x'
const source=resolve(values.video), sfx=resolve(values.sfx)
const target=resolve(values.out ?? join(root,'output/social', short?'cyberspec-demo-x.mp4':'cyberspec-demo-full.mp4'))
const work=mkdtempSync(join(tmpdir(),'cyberspec-footage-'))
mkdirSync(dirname(target),{recursive:true})
const pending=target+'.'+process.pid+'.rendering.mp4'
const require=createRequire(import.meta.url)
const dependency=process.env.CANVAS_MODULE ?? (() => {
  try {return require.resolve('@napi-rs/canvas')}
  catch {return join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas')}
})()
const canvasLib=require(dependency)
const {createCanvas,loadImage,GlobalFonts}=canvasLib
GlobalFonts.register(readFileSync(join(root,'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2')),'JetBrains Mono')
const [symbol,word]=Brand({}).props.children
const drawCard=makeCards(canvasLib,{mark:symbol.props.d,letters:word.props.children.map(node=>node.props.d)})

const fps=60, width=1920, height=1080
const videoInfo=JSON.parse(check('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=nb_frames,r_frame_rate,avg_frame_rate','-of','json',source])).streams[0]
assert.equal(videoInfo.r_frame_rate,'60/1')
assert.equal(videoInfo.avg_frame_rate,'60/1')
const count=Number(videoInfo.nb_frames)
assert(Number.isSafeInteger(count) && count>0,'Expected a fixed-frame-rate recording with a frame count')
const sections=short?[
  {startFrame:1119,frames:210}, // Switch and rating.
  {startFrame:1755,frames:216}, // District picker.
  {startFrame:6126,frames:264}, // Programs to the Deadlock record.
]:[{startFrame:0,frames:count}]
for(const s of sections) assert(s.startFrame+s.frames<=count)
const introFrames=short?96:144, outroFrames=short?114:174
const bodyFrames=sections.reduce((sum,s)=>sum+s.frames,0)
const outputFrames=introFrames+bodyFrames+outroFrames
if(short) assert.equal(outputFrames,900)

const flags=['-hide_banner','-v','error','-y']
const videoCodec=[
  '-c:v','libx264','-preset','veryfast','-threads','6','-crf','16','-maxrate','14M','-bufsize','24M',
  '-profile:v','high','-level:v','4.2','-g','120','-pix_fmt','yuv420p',
  '-color_range','tv','-color_primaries','bt709','-colorspace','bt709','-color_trc','bt709','-video_track_timescale','60000',
]
// The original recording is full-range BT.709 and slightly taller than 16:9.
function fitFrame(rgb=false) {
  const range=rgb?'pc':'tv', format=rgb?'rgb24':'yuv420p'
  return 'scale=1920:1080:flags=lanczos:force_original_aspect_ratio=decrease:force_divisible_by=2:in_range=pc:out_range='+range+':in_color_matrix=bt709:out_color_matrix=bt709,format='+format+',setsar=1,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x080a0d'
}
function check(command,args) {
  const result=spawnSync(command,args,{encoding:'utf8',maxBuffer:4*1024*1024})
  if(result.error || result.status!==0) throw new Error(result.error?.message || result.stderr || command+' failed')
  return result.stdout
}
function ffmpeg(args) {
  const child=spawn('ffmpeg',[...flags,...args],{stdio:['ignore','ignore','inherit']})
  return once(child,'close').then(([code])=>assert.equal(code,0,'FFmpeg failed'))
}
function frameTime(frame) {
  // Seek a fraction of one frame early so decimal rounding cannot skip it.
  return (Math.max(0,frame-.10)/fps).toFixed(8)
}
async function still(frame,name) {
  const file=join(work,name+'.png')
  await ffmpeg(['-ss',frameTime(frame),'-i',source,'-map','0:v:0','-an','-vf',fitFrame(true),'-frames:v','1',file])
  return loadImage(file)
}
async function bookend(kind,frames,inputFrame) {
  const card=createCanvas(width,height), cardContext=card.getContext('2d')
  const frameCanvas=createCanvas(width,height), out=frameCanvas.getContext('2d')
  const closing=kind==='outro'
  const splice=makeSplice(createCanvas,closing)
  const sourceImage=await still(inputFrame,kind+'-boundary')
  const output=join(work,kind+'.mp4')
  const child=spawn('ffmpeg',[...flags,'-f','rawvideo','-pixel_format','rgba','-video_size','1920x1080','-framerate','60','-i','pipe:0','-an',
    '-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,setsar=1',...videoCodec,output],{stdio:['pipe','ignore','inherit']})
  const done=once(child,'close')
  let pipeError
  child.stdin.on('error',error=>{pipeError=error})
  const transitionFrames=closing?28:27
  try {
    for(let i=0;i<frames;i++) {
      drawCard(cardContext,kind,i/fps,frames/fps)
      const transition=closing?i:i-(frames-transitionFrames)
      const active=transition>=0 && transition<transitionFrames
      if(active) {
        splice(out,closing?sourceImage:card,closing?card:sourceImage,transition/(transitionFrames-1),transition)
      }
      if(pipeError) throw pipeError
      const pixels=(active?frameCanvas:card).data()
      await new Promise((accept,reject)=>child.stdin.write(pixels,e=>e?reject(e):accept()))
    }
    child.stdin.end()
    assert.equal((await done)[0],0,'Bookend encoder failed')
  } finally {
    if(child.exitCode==null) child.kill()
  }
}

try {
  const first=sections[0], last=sections.at(-1)
  await bookend('intro',introFrames,first.startFrame)
  await bookend('outro',outroFrames,last.startFrame+last.frames-1)
  console.log('Rendered both signal transitions for '+values.edit)
  const parts=['intro.mp4']
  for(const [i,s] of sections.entries()) {
    const name='body-'+i+'.mp4'
    await ffmpeg(['-ss',frameTime(s.startFrame),'-i',source,'-map','0:v:0','-an','-vf',fitFrame(),'-frames:v',String(s.frames),...videoCodec,join(work,name)])
    parts.push(name)
  }
  parts.push('outro.mp4')
  const list=join(work,'parts.ffconcat')
  // Supply exact decoded durations rather than the container's millisecond rounding.
  const lengths=[introFrames,...sections.map(s=>s.frames),outroFrames]
  writeFileSync(list,'ffconcat version 1.0\n'+parts.map((name,i)=>"file '"+name+"'\nduration "+(lengths[i]/fps).toFixed(9)).join('\n')+'\n')
  const wav=join(work,'sound.wav')
  await prepareAudio({sourceVideo:source,sourceSfx:sfx,outWav:wav,introSeconds:introFrames/fps,
    bodySeconds:bodyFrames/fps,outroSeconds:outroFrames/fps,ranges:sections.map(s=>({start:s.startFrame/fps,duration:s.frames/fps}))})
  await ffmpeg(['-f','concat','-safe','1','-i',list,'-i',wav,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','224k','-ar','48000',
    '-video_track_timescale','60000','-movflags','+faststart','-metadata','title=CyberSpec — '+(short?'Announcement':'Component walkthrough'),pending])
  const verify=JSON.parse(check('ffprobe',['-v','error','-show_entries','stream=codec_type,nb_frames,duration,width,height','-of','json',pending]))
  const video=verify.streams.find(s=>s.codec_type==='video'), audio=verify.streams.find(s=>s.codec_type==='audio')
  assert.equal(Number(video.nb_frames),outputFrames)
  assert.equal(video.width,width);assert.equal(video.height,height)
  assert(Math.abs(Number(video.duration)-outputFrames/fps)<.001)
  assert(Math.abs(Number(audio.duration)-outputFrames/fps)<.001)
  renameSync(pending,target)
  console.log(target+' ('+outputFrames+' frames)')
} finally {
  rmSync(work,{recursive:true,force:true})
  if(existsSync(pending)) rmSync(pending)
}
