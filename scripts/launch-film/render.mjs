// bun scripts/launch-film/render.mjs
// Pass --proof sheet.png to render a contact sheet, or --out film.mp4.
// Dependencies: Bun, FFmpeg, and @napi-rs/canvas (or the bundled Codex copy).
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { spawn, spawnSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import { once } from 'node:events'
import { Brand } from '../../src/Brand.tsx'
import { makeFilm } from './film.js'

const {values} = parseArgs({args:process.argv.slice(2),options:{
  proof:{type:'string'},out:{type:'string'},
}})
const require=createRequire(import.meta.url)
const modules=join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')
const canvasLib=process.env.CANVAS_MODULE ?? (() => {
  try {return require.resolve('@napi-rs/canvas')}
  catch {return join(modules,'@napi-rs/canvas')}
})()
const {createCanvas,GlobalFonts,Path2D}=require(canvasLib)
globalThis.Path2D=Path2D
const root=resolve(import.meta.dir,'../..')
for (const weight of [400,500,600,700]) {
  GlobalFonts.register(readFileSync(join(root,'node_modules/@fontsource/rajdhani/files/rajdhani-latin-'+weight+'-normal.woff2')),'Rajdhani')
}
GlobalFonts.register(readFileSync(join(root,'node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2')),'JetBrains Mono')
const [mark,word]=Brand({}).props.children
const render=makeFilm(createCanvas,{mark:mark.props.d,letters:word.props.children.map(path=>path.props.d)})
const width=1080,height=1350,fps=30,frames=450
const canvas=createCanvas(width,height), ctx=canvas.getContext('2d')
if(values.proof) {
  const times=[0,.55,1.875,3.1,4.1,5.28,6,7.21,7.94,9.1,9.85,10.94,11.6,12.08,12.67,14.9]
  const sheet=createCanvas(4*270,4*338), g=sheet.getContext('2d')
  for(const [i,t] of times.entries()) {
    render(ctx,t)
    g.drawImage(canvas,(i%4)*270,Math.floor(i/4)*338,270,338)
  }
  writeFileSync(values.proof,sheet.toBuffer('image/png'))
} else {
  const target=resolve(values.out ?? join(root,'output/social/cyberspec-launch.mp4'))
  mkdirSync(dirname(target),{recursive:true})
  const work=mkdtempSync(join(tmpdir(),'cyberspec-launch-'))
  const sound=join(work,'score.wav')
  const partial=target+'.'+process.pid+'.rendering.mp4'
  try {
    const score=spawnSync(process.execPath,[join(import.meta.dir,'score.mjs'),sound],{stdio:'inherit'})
    if(score.status!==0) throw new Error('Score render failed')
    const encoder=spawn('ffmpeg',[
      '-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba',
      '-video_size',width+'x'+height,'-framerate',String(fps),'-i','pipe:0','-i',sound,
      '-map','0:v:0','-map','1:a:0',
      '-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-c:v','libx264','-preset','medium','-crf','17','-maxrate','8M','-bufsize','12M',
      '-profile:v','high','-level:v','4.1','-g','60','-color_primaries','bt709','-colorspace','bt709','-color_trc','bt709',
      '-c:a','aac','-profile:a','aac_low','-ar','48000','-b:a','192k','-movflags','+faststart',
      '-metadata','title=CYBERSPEC — A signal from a darker future',partial,
    ],{stdio:['pipe','inherit','inherit']})
    const completed=once(encoder,'exit')
    // Integrate a 165-degree virtual shutter across the fast camera moves.
    const sample=createCanvas(width,height), exposure=sample.getContext('2d')
    const edits=[1.67,3.75,5.625,7.5,9.375,11.25,12.1875]
    for(let frame=0;frame<frames;frame++) {
      const time=frame/fps
      const moving=time<2.03 || (time>=11.25 && time<=12.43) || edits.some(cut=>time>=cut && time<cut+.25)
      const samples=moving?3:1
      for(let i=0;i<samples;i++) {
        const timeOffset=samples===1?0:(1-i/(samples-1))*.46/fps
        render(exposure,Math.max(0,time-timeOffset))
        ctx.globalAlpha=1/(i+1)
        ctx.drawImage(sample,0,0)
      }
      ctx.globalAlpha=1
      if(!encoder.stdin.write(canvas.data())) await once(encoder.stdin,'drain')
      if(frame%90===0) console.log('Rendering frame '+frame+' / '+frames)
    }
    encoder.stdin.end()
    if((await completed)[0]!==0) throw new Error('FFmpeg encode failed')
    renameSync(partial,target)
    console.log(target)
  } finally {
    rmSync(work,{recursive:true,force:true})
    if(existsSync(partial)) rmSync(partial)
  }
}
