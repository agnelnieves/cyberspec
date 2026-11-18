// The picture edit is sampled from musical time: eight bars at 128 BPM.
import { drawSculpture } from './sculpture.js'
import { drawInstruments } from './instruments.js'

const W = 1080, H = 1350
const BAR = 1.875
const black = '#090c12', white = '#efeee5', red = '#ff493e', mint = '#91e4de'
const clamp = n => Math.max(0, Math.min(1, n))
const smooth = n => { const p = clamp(n); return p * p * (3 - 2 * p) }
const out = n => 1 - (1 - clamp(n)) ** 4
const mix = (a, b, p) => a + (b - a) * p
const tau = Math.PI * 2
const mono = '"JetBrains Mono"'
const display = 'Rajdhani'

function line(g, x, y, X, Y, color, width = 1) {
  g.strokeStyle = color
  g.lineWidth = width
  g.beginPath()
  g.moveTo(x, y)
  g.lineTo(X, Y)
  g.stroke()
}
function poly(g, coords, fill) {
  g.beginPath()
  g.moveTo(coords[0], coords[1])
  for (let i = 2; i < coords.length; i += 2) g.lineTo(coords[i], coords[i + 1])
  g.closePath()
  g.fillStyle = fill
  g.fill()
}
function type(g, text, x, y, size, color, {weight = 500, family = mono, tracking = 0, align = 'left'} = {}) {
  g.save()
  g.font = weight + ' ' + size + 'px ' + family
  g.textAlign = align
  g.letterSpacing = tracking + 'px'
  g.fillStyle = color
  g.fillText(text, x, y)
  g.restore()
}
function glow(g, x, y, w, h, center, edge) {
  g.save()
  g.translate(x,y)
  g.scale(w,h)
  const grad = g.createRadialGradient(0,0,0,0,0,1)
  grad.addColorStop(0,center)
  grad.addColorStop(1,edge)
  g.fillStyle=grad
  g.fillRect(-1,-1,2,2)
  g.restore()
}
function corners(g, x, y, w, h, size, color) {
  for (const [ax,ay] of [[0,0],[1,0],[0,1],[1,1]]) {
    const px=x+ax*w, py=y+ay*h
    line(g,px,py,px+(ax?-size:size),py,color,2)
    line(g,px,py,px,py+(ay?-size:size),color,2)
  }
}
function plus(g, x, y, r, color) {
  line(g,x-r,y,x+r,y,color,1.4)
  line(g,x,y-r,x,y+r,color,1.4)
}
function makeTexture(createCanvas) {
  const c=createCanvas(192,192), g=c.getContext('2d')
  const pixels=g.createImageData(c.width,c.height)
  let seed=1234567
  for (let i=0;i<pixels.data.length;i+=4) {
    seed=(Math.imul(1664525,seed)+1013904223)>>>0
    const value=seed>>>24
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value>127?255:0
    pixels.data[i+3]=3+Math.round(Math.abs(value-128)/17)
  }
  g.putImageData(pixels,0,0)
  return c
}

// A projected, folded sheet of finely spaced copperplate lines. The fold
// moves through the paper as a traveling wave, preserving its silhouette.
function field(g,t) {
  const land = '#241713'
  const ink = '#ffc2a3'
  g.save()
  g.translate(544,982)
  g.rotate(-.21)
  const cols=120, rows=76
  function point(u,v) {
    const a = Math.exp(-((u+.26-v*.35)**2)/.12) * Math.cos(u*2.7-v*2.3+t*.67)
    const b = Math.exp(-((u-.60+v*.36)**2)/.085) * Math.sin(u*3.2+v*.74+t*.5-.3)
    const z = (a*.8+b*.68) * (1-.23*v*v)
    return [u*667+v*187+z*38, v*146 - z*214 + u*46]
  }
  for (let j=0;j<rows;j++) {
    const v=-1+j*2/(rows-1), near=v+2.02/(rows-1)
    const points=[]
    for(let k=0;k<=cols;k++) points.push(point(-1+k*2/cols,v))
    g.beginPath()
    g.moveTo(...points[0])
    for (let k=1;k<points.length;k++) g.lineTo(...points[k])
    for (let k=cols;k>=0;k--) g.lineTo(...point(-1+k*2/cols,near))
    g.closePath();g.fillStyle=land;g.fill()
    g.beginPath();g.moveTo(...points[0])
    for(let k=1;k<points.length;k++) g.lineTo(...points[k])
    g.strokeStyle = j%8===0 ? '#ffe6ce' : ink
    g.lineWidth = j%8===0 ? 1.9 : 1.15
    g.stroke()
  }
  g.restore()
}
function background(g,t,mode) {
  g.fillStyle=black
  g.fillRect(0,0,W,H)
  if (mode==='paper') {
    g.fillStyle='#fc5040';g.fillRect(0,0,W,H)
    glow(g,810,280,920,740,'#ff7858','rgba(255,90,61,0)')
    return
  }
  const end=mode==='end', warm=mode==='hero'
  const grad=g.createLinearGradient(0,0,960,1350)
  grad.addColorStop(0,end?'#14181d':warm?'#15191e':'#161b21')
  grad.addColorStop(.52,end?'#0b1016':'#0b0e15')
  grad.addColorStop(1,'#080b10')
  g.fillStyle=grad;g.fillRect(0,0,W,H)
  if (end || warm) {
    glow(g,835,475,1050,720,end?'rgba(100,134,146,.19)':'rgba(101,117,121,.20)','rgba(80,100,115,0)')
    glow(g,180,830,620,440,'rgba(129,36,36,.16)','rgba(112,32,31,0)')
  } else {
    glow(g,590,614,780,550,'rgba(100,125,135,.13)','rgba(103,131,140,0)')
  }
}
function wordmark(g,art,x,y,w,color,phase=1) {
  const scale=w/501
  g.save();g.translate(x,y);g.scale(scale,scale)
  g.lineWidth=5.6;g.lineJoin='miter';g.lineCap='square';g.strokeStyle=color
  art.letters.forEach((shape,i) => {
    const v=out((phase*1.55-i*.057)/.97)
    if (v<=0) return
    g.save()
    g.globalAlpha *= v
    g.translate(i*57, (1-v)*40)
    g.scale(1,.7+.3*v)
    g.stroke(shape)
    g.restore()
  })
  g.restore()
}
function mark(g,art,x,y,w,c) {
  g.save();g.translate(x,y);g.scale(w/93,w/93);g.fillStyle=c;g.fill(art.mark);g.restore()
}
function mast(g,art,section,t,inverse=false) {
  const fg=inverse?'#211916':'#e3e4dc', muted=inverse?'#52251f':'#a5b0b0'
  mark(g,art,62,55,33,inverse?'#211916':red)
  wordmark(g,art,112,58,177,fg)
  const active = Math.floor(t*2.1333) % 4
  for(let k=0;k<4;k++) {
    g.fillStyle=k<=active?fg:(inverse?'#bd493b':'#475156')
    g.fillRect(765+k*7,74-k*4,4,5+k*4)
  }
  type(g,section,1018,79,18,muted,{align:'right',tracking:1.3})
  line(g,62,105,1018,105,inverse?'#a53d31':'#4c555a')
}
function footer(g,t,left,right,inverse=false) {
  const rule=inverse?'#a93e32':'#465057', fg=inverse?'#301b17':'#a7b0af'
  line(g,62,1247,1018,1247,rule)
  g.fillStyle=inverse?'#2c1917':red;g.fillRect(62,1271,8,17)
  type(g,left,84,1287,18,fg,{tracking:1})
  type(g,right,1018,1287,18,fg,{align:'right',tracking:1})
  const distance=132
  for(let i=0;i<23;i++) {
    const h=i%5===0?12:5
    const active=i/22<=t/15
    g.fillStyle=active?fg:rule
    g.fillRect(540-distance/2+i*6,1278-h/2,1.8,h)
  }
}
function indexTicks(g,minY,maxY,x,flip,color) {
  for(let i=0;i<=40;i++) {
    const y=mix(minY,maxY,i/40), s=i%5===0?13:4
    line(g,x,y,x+s*flip,y,color)
  }
}
function displayLine(g,txt,x,baseline,size,maxWidth,color,progress=1) {
  g.save()
  g.font='700 '+size+'px '+display
  const spacing = -size*.038
  g.letterSpacing=spacing+'px'
  const width=g.measureText(txt).width
  const scale=Math.min(1,maxWidth/width)
  g.translate(x,baseline)
  g.scale(scale,1)
  g.beginPath();g.rect(-8,-size,Math.max(maxWidth/scale,width)+16,size*1.16);g.clip()
  g.translate(0,(1-out(progress))*size*1.1)
  g.fillStyle=color;g.fillText(txt,0,0)
  g.restore()
}
function stampArrow(g,x,y,size,col) {
  g.save();g.translate(x,y);g.scale(size/32,size/32)
  g.strokeStyle=col;g.lineWidth=3;g.lineJoin='miter'
  g.beginPath();g.moveTo(1,30);g.lineTo(29,2);g.moveTo(9,2);g.lineTo(29,2);g.lineTo(29,22);g.stroke();g.restore()
}
function hero(g,art,t) {
  background(g,t,'hero')
  // Printing crosshairs share a plane behind the solid object.
  const q=out((t-.4)/1.35)
  g.save()
  g.globalAlpha=.3+.7*q
  indexTicks(g,249,927,62,1,'#4f5759')
  indexTicks(g,249,927,1018,-1,'#4f5759')
  for (const x of [117,540,963]) for(const y of [244,922]) plus(g,x,y,8,'#637071')
  corners(g,160,280,760,605,18,'#364048')
  g.restore()
  drawSculpture(g,t)
  // A graduated lower matte keeps the opening readable even in the macro.
  const matte=g.createLinearGradient(0,907,0,1283)
  matte.addColorStop(0,'rgba(9,12,16,0)')
  matte.addColorStop(.55,'rgba(9,12,16,.88)')
  matte.addColorStop(1,'#090c10')
  g.fillStyle=matte;g.fillRect(0,907,W,443)
  mast(g,art,'TRANSMISSION',t)
  // The edit first identifies the maker and then reveals the premise.
  const reveal=smooth((t-1.67)/.30)
  g.save()
  g.beginPath();g.rect(48,1007,984,213);g.clip()
  if (reveal<1) {
    g.save();g.translate(0,-218*reveal)
    type(g,'INTRODUCING',64,1053,29,white,{tracking:2.7})
    wordmark(g,art,68,1091,946,white,.69+Math.min(.31,t*2))
    g.restore()
  }
  if (reveal>0) {
    g.save();g.translate(0,218*(1-reveal))
    type(g,'A SIGNAL FROM A',64,1053,29,white,{tracking:2})
    displayLine(g,'DARKER FUTURE.',54,1180,176,973,white)
    g.restore()
  }
  g.restore()
  footer(g,t,'CYBERSPEC.DEV','DESIGN SYSTEM')
}
function printCard(g,art,t) {
  background(g,t,'paper')
  // The shadow lattice is restrained to the print field below the headline.
  const drift=out(t/.57)
  g.save();g.translate(0,125*(1-drift))
  field(g,t)
  g.restore()
  mast(g,art,'KIT OVERVIEW',t+2*BAR,true)
  const x=56
  displayLine(g,'REACT',x,400,290,969,'#201916',t/.38+.17)
  displayLine(g,'COMPONENT',x,573,219,969,'#201916',(t-.045)/.40+.15)
  displayLine(g,'KIT.',x,748,255,778,'#201916',(t-.10)/.42+.1)
  g.save();g.translate(680,719)
  const p=out((t-.12)/.55)
  g.globalAlpha=p
  line(g,0,0,310*p,0,'#7f3027',2)
  for(let k=0;k<3;k++) {
    const lx=238+k*18
    poly(g,[lx,12,lx+8,12,lx+1,29,lx-7,29],'#3f231c')
  }
  g.restore()
  footer(g,t+2*BAR,'OPEN SOURCE','MIT LICENSE',true)
}
const specimens = [
  {title:'Tune.',component:'Slider',n:'01',kind:'INPUT'},
  {title:'Trace.',component:'SignalGraph',n:'02',kind:'TELEMETRY'},
  {title:'Allocate.',component:'HexStat',n:'03',kind:'ATTRIBUTES'},
]
function codeSpec(g,spec) {
  const y=1188
  const name=spec.component
  const tokens=[['<',red],[name,white],[' />',red]]
  let x=64
  g.save();g.font='500 39px '+mono
  for(const [v,col] of tokens) {
    g.fillStyle=col;g.fillText(v,x,y);x+=g.measureText(v).width
  }
  g.restore()
  const start=777
  for(let k=0;k<3;k++) {
    const active=k===Number(spec.n)-1
    g.fillStyle=active?'#ff594c':'#40494b';g.fillRect(start+k*82,1164,68,8)
  }
  type(g,spec.n+' / 03',1018,1216,18,'#a9b4b3',{align:'right',tracking:1})
}
function product(g,art,shot,t) {
  const spec=specimens[shot], absolute=(shot+3)*BAR+t
  background(g,t,'product')
  mast(g,art,'COMPONENT KIT',absolute)
  const t0=out(t/.47)
  type(g,spec.kind,1018,189,22,mint,{align:'right',tracking:2})
  displayLine(g,spec.title,54,270,198,800,white,.53+.47*t0)
  g.save()
  const z=1.00+.032*(1-t0)+.016*(t/BAR)
  g.translate(540,685);g.scale(z,z);g.translate(-540,-685)
  drawInstruments(g,shot,t)
  g.restore()
  codeSpec(g,spec)
  footer(g,absolute,'CYBERSPEC.DEV','REACT REGISTRY')
}
// A brief optical relay between the product montage and the lockup.
// Instances are actual perspective sections of the three-blade silhouette.
function relay(g,art,t) {
  const p=clamp(t/(BAR/2)), e=smooth(p)
  g.fillStyle='#e3e2d7';g.fillRect(0,0,W,H)
  glow(g,850,244,850,900,'rgba(255,253,241,.8)','rgba(255,253,241,0)')
  for(const x of [62,196,540,884,1018]) {
    for(const y of [211,529,849,1135]) plus(g,x,y,8,'#94958d')
  }
  const cx=540+95*(1-e),cy=550+170*(1-e)
  for(let j=0;j<=52;j++) {
    const d=j/52
    // The stack turns as its orthographic slices register with one another.
    const scale=(6.4+(d-.5)*8.6*(1-e))*(1+.45*(1-e))
    const ox=(d-.55)*1050*(1-e),oy=(d-.5)*552*(1-e)
    g.save();g.translate(cx+ox,cy+oy)
    g.rotate((d-.6)*1.95*(1-e)-.04*e)
    g.scale(scale,scale);g.translate(-46.5,-42)
    if(j===52 || j===0) {
      g.fillStyle=j===0?'#212725':'#ff4c3b'
      g.fill(art.mark)
    }
    g.lineWidth=(j%6===0?2.2:1.2)/scale
    g.strokeStyle=j%6===0?'#303532':'#69716c'
    g.stroke(art.mark)
    g.restore()
  }
  mast(g,art,'TRANSMISSION',11.25+t,true)
  footer(g,11.25+t,'CYBERSPEC.DEV','IDENTITY MARK',true)
}
function closing(g,art,t) {
  background(g,t,'end')
  const centerY=523
  const b=out(t/.9)
  // Alignment targets follow the outer corners as the end mark registers.
  g.save();g.globalAlpha=.72*b
  const gap=345+48*(1-b)
  corners(g,540-gap,centerY-245,gap*2,495,22,'#58615f')
  for(const [x,y] of [[122,centerY],[958,centerY],[540,175],[540,845]]) plus(g,x,y,7,'#6a7472')
  g.restore()
  drawSculpture(g,t,{end:true})
  mast(g,art,'TRANSMISSION',12.1875+t)
  const p=out((t+.03)/.48)
  wordmark(g,art,76,915,930,white,p)
  g.save();g.globalAlpha=.4+.6*p
  type(g,'Open-source React component kit',540,1099,44,'#c8d2d1',{family:display,weight:600,align:'center'})
  g.restore()
  const ax=323
  g.fillStyle=red;g.fillRect(ax-12,1150,4,42)
  type(g,'cyberspec.dev',ax+13,1184,44,white,{weight:500,tracking:-.4})
  stampArrow(g,728,1153,29,red)
  footer(g,12.1875+t,'BUILT ON UI SDK','NOW AVAILABLE')
}
const cuts=[0,2*BAR,3*BAR,4*BAR,5*BAR,6*BAR,6.5*BAR,8*BAR]
function drawShot(g,art,idx,t) {
  g.save()
  if(idx===0) hero(g,art,t)
  else if(idx===1) printCard(g,art,t)
  else if(idx<5) product(g,art,idx-2,t)
  else if(idx===5) relay(g,art,t)
  else closing(g,art,t)
  g.restore()
}

export function makeFilm(createCanvas,brand) {
  const art={mark:new Path2D(brand.mark),letters:brand.letters.map(d=>new Path2D(d))}
  const texture=makeTexture(createCanvas)
  const outgoing=createCanvas(W,H), tail=outgoing.getContext('2d')
  let outgoingShot=-1
  return function drawFrame(g,time) {
    const t=Math.min(15-1/1000,Math.max(0,time))
    const idx=cuts.findIndex((_,i)=>i<cuts.length-1 && t<cuts[i+1])
    const age=t-cuts[idx]
    drawShot(g,art,idx,age)
    // Three independent strips of the outgoing image release in quick
    // succession. The dark edges act like the sidewalls of a sliding die.
    const duration=idx===1?.235:idx===6?.18:idx===4?0:idx===3?.09:.15
    if(idx>0 && age<duration) {
      const lastTime=cuts[idx]-cuts[idx-1]-.001
      if(outgoingShot!==idx-1) {
        tail.clearRect(0,0,W,H)
        drawShot(tail,art,idx-1,lastTime)
        outgoingShot=idx-1
      }
      for(let band=0;band<3;band++) {
        const p=smooth((age/duration*1.28-band*.135))
        if(p>=1) continue
        const y=band*450
        g.save();g.beginPath();g.rect(0,y,W,450);g.clip()
        // A diagonal gate leaves the new picture behind it.
        const x=mix(-270,1380,p)
        g.beginPath();g.moveTo(x+190,y);g.lineTo(1350,y)
        g.lineTo(1350,y+450);g.lineTo(x-75,y+450);g.closePath();g.clip()
        g.drawImage(outgoing,-p*92,0)
        if(p>.002) {
          line(g,x+190,y,x-75,y+450,'#ec5d46',7)
          line(g,x+201,y,x-64,y+450,'#ffae7d',2)
        }
        g.restore()
      }
    }
    // Stationary grain creates a lithographic surface and compresses cleanly.
    g.save();g.globalAlpha=.69
    g.fillStyle=g.createPattern(texture,'repeat');g.fillRect(0,0,W,H)
    g.restore()
  }
}
