// Video-line loss of sync: adjacent blocks pick up the incoming image at
// different instants, register their red/cyan channels, then settle together.
const width = 1920, height = 1080
const clamp = n => Math.max(0, Math.min(1, n))
const ease = n => { const x=clamp(n); return x*x*(3-2*x) }
const noise = n => {
  const value = Math.sin(n * 78.233 + 31.71) * 43758.5453
  return value - Math.floor(value)
}

function wrappedStrip(g, image, y, h, shift) {
  const dx = Math.round(shift)
  g.drawImage(image, 0, y, width, h, dx, y, width, h)
  if (dx>0) g.drawImage(image, width-dx, y, dx, h, 0, y, dx, h)
  if (dx<0) g.drawImage(image, 0, y, -dx, h, width+dx, y, -dx, h)
}

export function makeSplice(createCanvas, closing) {
  const composite=createCanvas(width,height), g=composite.getContext('2d')
  const red=createCanvas(width,height), cyan=createCanvas(width,height)
  const redContext=red.getContext('2d'), cyanContext=cyan.getContext('2d')
  const seed=closing?151:37
  const bands=[]
  for(let y=0, i=0;y<height;i++) {
    const h=Math.min(height-y,Math.floor(9 + noise(i+seed)**2 * 83))
    const distance=Math.abs((y+h/2)/height-.5)*2
    const order=closing?1-distance:distance
    bands.push({y,h,reveal:.12+.46*order+.15*noise(i+seed+6),polarity:noise(i+seed+13)>.5?1:-1})
    y+=h
  }
  function isolate(channel, tint) {
    channel.globalCompositeOperation='copy'
    channel.drawImage(composite,0,0)
    channel.globalCompositeOperation='multiply'
    channel.fillStyle=tint
    channel.fillRect(0,0,width,height)
    channel.globalCompositeOperation='source-over'
  }
  return (out, outgoing, incoming, progress, frame) => {
    if(progress<=0 || progress>=1) {
      out.drawImage(progress<=0?outgoing:incoming,0,0)
      return
    }
    const beat=Math.floor(frame/3)
    const envelope=Math.sin(Math.PI*progress)**1.5
    const surge=(.30+.70*Math.exp(-((progress-.52)**2)/.013))*envelope
    for(const [i,band] of bands.entries()) {
      const {y,h,reveal,polarity}=band
      const advance=ease((progress-reveal)/.22)
      const shift=polarity*surge*(noise(seed+i*8+beat*2)**2*148+8)
      if(advance<1) wrappedStrip(g,outgoing,y,h,shift)
      if(advance>0) {
        g.save()
        g.beginPath()
        // Pixel-block boundaries break up the smooth wiping edge.
        const span=advance===1?width:Math.ceil(advance*width/16)*16
        g.rect(polarity>0?0:width-span,y,span,h)
        g.clip()
        wrappedStrip(g,incoming,y,h,-shift*.64)
        g.restore()
      }
      // A damaged scanline stretches actual picture pixels for a few frames.
      if(surge>.14 && noise(i*5+beat+seed)>.68) {
        const sx=24+Math.floor(noise(i+13)*1550)
        const sw=Math.round((28+noise(i+19)*167)*surge)
        const sh=Math.max(1,Math.min(h,Math.round(7*surge)))
        const src=advance>.50?incoming:outgoing
        g.drawImage(src,sx,y,3,sh,sx,y,Math.max(sw,1),sh)
      }
    }
    out.drawImage(composite,0,0)
    const displacement=Math.round(surge*(16+noise(beat+seed)*20))
    if(!displacement) return
    isolate(redContext,'#ff0000')
    isolate(cyanContext,'#00ffff')
    out.save()
    // Most rows stay in register: broken rows briefly show two separate edges.
    for(const [i,{y,h,polarity}] of bands.entries()) {
      if(noise(i+beat+seed)<.38) continue
      out.globalCompositeOperation='source-over'
      wrappedStrip(out,red,y,h,polarity*displacement)
      out.globalCompositeOperation='lighter'
      wrappedStrip(out,cyan,y,h,-polarity*Math.ceil(displacement*.48))
    }
    out.restore()
  }
}
