// Three tapered blades use the 24 / 21 / 84 construction from src/Brand.tsx.
// A small perspective renderer keeps the sculpture independent of WebGL and the page.
const clamp = (v) => Math.max(0, Math.min(1, v))
const mix = (a, b, k) => a + (b - a) * k
const smooth = (a, b, v) => {
  const x = clamp((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const gauss = (x, width) => Math.exp(-(x * x) / (width * width))
const rgb = (c) => 'rgb(' + c.map(v => Math.round(Math.max(0, Math.min(255, v)))).join(',') + ')'
const colorMix = (a, b, k) => a.map((v, i) => mix(v, b[i], k))
const hash = (i) => {
  const a = Math.sin(i * 73.9381 + .731) * 31092.4993
  return a - Math.floor(a)
}
const unit = ([x, y]) => {
  const n = Math.hypot(x, y)
  return [x / n, y / n]
}
const basic = [[24, 0], [45, 0], [0, 84]]

// Parallel offsets retain the very long point where the two flanks meet.
function insetTriangle(d) {
  const sides = basic.map((p, i) => {
    const next = basic[(i + 1) % 3]
    const [dx, dy] = unit([next[0] - p[0], next[1] - p[1]])
    const nx = -dy, ny = dx
    return [nx, ny, nx * p[0] + ny * p[1] + d]
  })
  return sides.map((line, i) => {
    const a = sides[(i + 2) % 3]
    const det = a[0] * line[1] - a[1] * line[0]
    return [(a[2] * line[1] - a[1] * line[2]) / det, (a[0] * line[2] - a[2] * line[0]) / det]
  })
}
function outline(inset) {
  const vs = insetTriangle(inset)
  return vs.flatMap((v, i) => {
    const r = i === 2 ? .42 : .78
    return [vs[(i + 2) % 3], vs[(i + 1) % 3]].map(other => {
      const u = unit([other[0] - v[0], other[1] - v[1]])
      return [v[0] + u[0] * r, v[1] + u[1] * r]
    })
  })
}

// Flange, thermal isolation chamber, nickel gasket, red seal, then the rolled lip.
const profile = [
  [-7.5, .74, 'dark'], [-7.27, .33, 'satin'], [-6.89, .24, 'wall'],
  [-6.49, .31, 'black'], [-6.38, .86, 'satin'], [-6.1, .91, 'black'],
  [-5.96, .35, 'satin'], [-5.58, .35, 'red'], [-5.27, 1.18, 'dark'],
  [-3.56, 1.18, 'vent'], [-3.45, .27, 'satin'], [-3.07, .24, 'wall'],
  [-2.94, .54, 'black'], [-2.63, .54, 'dark'], [-2.52, .15, 'satin'],
  [-1.78, .12, 'wall'], [-1.47, .40, 'dark'], [-1.24, .4, 'red'],
  [-1.13, .03, 'dark'], [-.20, 0, 'wall'], [.07, .08, 'chrome'],
  [.31, .24, 'chrome'], [.49, .5, 'chrome'], [.57, .73, 'chrome']
].map(([z, inset, mat]) => ({z, inset, mat, path: outline(inset)}))

function makeCamera(time, end) {
  const t = Math.max(0, time)
  if (end) {
    return {
      rx: -.44 + .050 * Math.sin(.75 * t), ry: .23 + .090 * Math.sin(.64 * t + .15),
      rz: -.035 + .022 * Math.sin(t * .7), spread: (1 - smooth(.05, 1.35, t)) * .53,
      width: 622, height: 544, center: [540, 523], lamp: .23 + .045 * t, time: t
    }
  }
  const pull = smooth(.08, 1.83, t)
  const roll = smooth(1.83, 3.72, t)
  return {
    rx: mix(-1.00, -.57, pull) + .14 * roll, ry: mix(.47, .34, pull) - .38 * roll,
    rz: mix(.60, -.10, pull) + .17 * roll,
    spread: (1 - smooth(.53, 1.90, t)) * 1.15 + .06 * (1 - roll),
    width: mix(2650, 876, pull) + roll * 22, height: mix(2400, 727, pull),
    center: [mix(652, 540, pull), mix(713, 652, pull)], lamp: -.03 + .15 * t, time: t
  }
}

function projection(camera) {
  const ax = Math.cos(camera.rx), bx = Math.sin(camera.rx)
  const ay = Math.cos(camera.ry), by = Math.sin(camera.ry)
  const az = Math.cos(camera.rz), bz = Math.sin(camera.rz)
  const rotate = (x, y, z) => {
    const v = ax * y - bx * z, w = bx * y + ax * z
    const u = x * ay + w * by
    return [az * u - bz * v, bz * u + az * v, w * ay - x * by]
  }
  const blades = [0, 1, 2].map(i => {
    const asym = i - 1
    const angle = asym * camera.spread * .086
    const co = Math.cos(angle), si = Math.sin(angle)
    const spin = (x, y, z) => rotate(x * co - y * si, y * co + x * si, z)
    const raw = (x, y, z) => {
      const ux = x - 30, uy = y - 18
      return rotate(ux * co - uy * si + 30 + 24 * i - 46.5 + asym * 8.5 * camera.spread,
        ux * si + uy * co + 18 - 42 - asym * 8 * camera.spread,
        z + 3.75 + asym * 9 * camera.spread)
    }
    return { i, spin, raw, z: raw(23, 30, 0)[2] }
  })
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity
  const lens = 330
  const flatten = (v) => {
    const p = lens / (lens - v[2])
    return [v[0] * p, v[1] * p]
  }
  for (const b of blades) for (const p of basic) for (const z of [-7.5,.57]) {
    const [x, y] = flatten(b.raw(...p,z))
    left = Math.min(left,x); right = Math.max(right,x)
    top = Math.min(top,y); bottom = Math.max(bottom,y)
  }
  const scale = Math.min(camera.width / (right-left), camera.height / (bottom-top))
  const ox = camera.center[0] - (right + left) * scale * .5
  const oy = camera.center[1] - (top + bottom) * scale * .5
  for (const b of blades) {
    b.scale = scale
    b.project = (x, y, z = .57) => {
      const [u,v] = flatten(b.raw(x,y,z))
      return [ox + u * scale, oy + v * scale]
    }
  }
  return blades.sort((a,b) => a.z-b.z)
}

function polygon(ctx, pts, fill) {
  ctx.beginPath()
  ctx.moveTo(...pts[0])
  for(let j=1; j<pts.length; j++) ctx.lineTo(...pts[j])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}
function stroke(ctx, p, q, color, width) {
  ctx.beginPath()
  ctx.moveTo(...p)
  ctx.lineTo(...q)
  ctx.lineWidth = width
  ctx.strokeStyle = color
  ctx.stroke()
}
const uv = (u, v) => [(24 + 21 * u) * (1 - v), 84 * v]

function drawBody(ctx, b, camera) {
  const {project: P} = b
  const metal = ['#070c12','#121821','#4f5863','#bcc1bc','#26272b']
  // Render each altitude ring before the next. Its upward-facing shelves hide earlier rings.
  let prev = profile[0]
  polygon(ctx, prev.path.map(p=>P(...p,prev.z)), '#131017')
  for (const ring of profile.slice(1)) {
    for (let j=0; j<6; j++) {
      const k = (j+1)%6
      const a = prev.path[j], e=prev.path[k], c=ring.path[k], d=ring.path[j]
      const dx=e[0]-a[0], dy=e[1]-a[1], dz=ring.z-prev.z
      const nx=dy*dz, ny=-dx*dz, nz=dx*(d[1]-a[1])-dy*(d[0]-a[0])
      const n=Math.hypot(nx,ny,nz)
      const normal=b.spin(nx/n, ny/n, nz/n)
      if (normal[2] < -.1) continue
      const pts=[P(...a,prev.z),P(...e,prev.z),P(...c,ring.z),P(...d,ring.z)]
      const light=clamp(.48-.40*normal[0]-.25*normal[1]+.27*normal[2])
      const phase=.6*normal[0] + .32*normal[1] + .06*b.i + camera.lamp
      const spec=.52*gauss(phase-.24,.17)+.72*gauss(phase+.52,.13)
      let fill
      switch(ring.mat) {
        case 'satin': case 'chrome': {
          const value=clamp(.09+.30*light+.75*spec)
          fill=rgb(colorMix([29,25,27],[236,243,239],value)); break
        }
        case 'red': fill=rgb(colorMix([70,8,12],[248,56,52],light*.65+spec*.3)); break
        case 'wall': fill=rgb(colorMix([28,28,33],[170,176,177],.44*light+.55*spec)); break
        case 'black': fill=metal[0]; break
        case 'dark': fill=metal[1]; break
        default: fill='#13151c'
      }
      polygon(ctx,pts,fill)
      // Tight fins run through the recessed chamber, not across the surrounding bright flange.
      if (ring.mat==='vent' && Math.hypot(dx,dy)>5) {
        const count=Math.floor(Math.hypot(dx,dy)/1.33)
        for(let n=0;n<count;n++) {
          const u=(n+.30)/count, v=(n+.68)/count
          const pt=(a,e,t,z)=>P(mix(a[0],e[0],t),mix(a[1],e[1],t),z)
          polygon(ctx,[pt(a,e,u,prev.z),pt(a,e,v,prev.z),pt(d,c,v,ring.z),pt(d,c,u,ring.z)],
            rgb(colorMix([22,23,31],[122,126,124],.18+.33*light+.34*spec)))
        }
      }
    }
    prev=ring
  }
}

function surfaceTone(b, position, camera) {
  // The long softbox and narrow edge lamp slide independently over the brushed faces.
  const u = position + b.i*.088 - camera.lamp
  const key = .59 * gauss(u-.04,.265) + .50 * gauss(u-.14,.050)
  const bounce = .21 * gauss(u-.62,.28) + .12 * gauss(u-.82,.055)
  const strip = .11*gauss(u+.25,.022)
  const redLight = gauss(u-.40,.088) + .49*gauss(u+.35,.18)
  if(b.i===1) {
    return rgb([140+96*key+95*bounce+77*redLight+60*strip,
      10+62*key+41*bounce+12*redLight+73*strip, 20+51*key+26*bounce+7*redLight+62*strip])
  }
  const base = b.i===0 ? [45,48,52] : [38,45,52]
  const grey=key+bounce+strip
  return rgb([base[0]+187*grey+94*redLight, base[1]+191*grey+5*redLight,
    base[2]+188*grey+8*redLight])
}

function drawFace(ctx,b,camera) {
  const P=b.project
  const surface=profile[profile.length-1]
  const mapped=surface.path.map(p=>P(...p,surface.z))
  // Slightly skew the reflected strip with respect to the ribs, like a studio environment card.
  const start=P(18,-11), end=P(14,85)
  const grad=ctx.createLinearGradient(...start,...end)
  for(let j=0;j<=60;j++) grad.addColorStop(j/60,surfaceTone(b,j/60,camera))
  polygon(ctx,mapped,grad)
  ctx.save()
  ctx.clip()
  const at=(u,v)=>P(...uv(u,v))
  // The airfoil catches a broad raking reflection across its leading edge.
  // Stack translucent bands of continuously varying curvature inside the face.
  for (let k=0;k<22;k++) {
    const u=.015+k*.0175, path=[]
    for (let j=0;j<=12;j++) {
      const v=j/12
      path.push(at(u+.073*Math.sin(v*3.8-.55),v))
    }
    for (let j=12;j>=0;j--) {
      const v=j/12
      path.push(at(u+.02+.073*Math.sin(v*3.8-.55),v))
    }
    const power=gauss((k-7)/22,.19)
    polygon(ctx,path,'rgba(245,240,231,'+(.008+power*(b.i===1?.08:.14))+')')
  }
  const ramp=[]
  for(let j=0;j<=15;j++) {
    const v=j/15
    ramp.push(at(.91-.14*Math.sin(v*2.7),v))
  }
  ramp.push(at(1.1,1),at(1.1,0))
  const edgeLight=ctx.createLinearGradient(...at(.4,.02),...at(.4,.98))
  edgeLight.addColorStop(0,'rgba(15,12,18,.09)')
  edgeLight.addColorStop(.32,'rgba(54,19,20,.18)')
  edgeLight.addColorStop(.68,'rgba(12,14,23,.17)')
  edgeLight.addColorStop(1,'rgba(245,238,220,.12)')
  polygon(ctx,ramp,edgeLight)
  // Fine brushing is pinned to the material, so it doesn't crawl as the camera moves.
  for(let j=0;j<277;j++) {
    const v=hash(j+8)*.995, u=hash(j+329)*1.33-.165, length=.035+hash(j+969)*.5
    stroke(ctx,at(u,v),at(u+length,v+.00062), j%3?'rgba(255,235,220,.087)':'rgba(0,6,14,.13)',Math.min(1.24,b.scale*.046))
  }
  // A bead-blasted channel with a chrome shoulder runs up the wide face of each blade.
  const slot=(u,v,w,h,cap,color)=>{
    const a=v+h
    const capU=Math.min(w*.3,cap*3), capV=Math.min(h*.25,cap)
    polygon(ctx,[[u+capU,v],[u+w,v],[u+w,a-capV],[u+w-capU,a],[u,a],[u,v+capV]].map(p=>at(...p)),color)
  }
  const u=.228
  slot(u-.018,.151,.113,.427,.004,'rgba(232,221,209,.40)')
  slot(u-.022,.148,.100,.427,.004,'#151820')
  slot(u+.001,.152,.048,.414,.003, b.i===1?'#491719':'#363a40')
  slot(u+.006,.158,.037,.075,.002, b.i===1?'#ebbb94':'#ff6151')
  // Witness marks are engraved into the material alongside the groove.
  for(let k=0;k<23;k++){
    const v=.168+k*.0116
    stroke(ctx,at(u+.126,v),at(u+.126+(k%5===0?.123:.063),v),
      b.i===1?'rgba(70,10,16,.67)':'rgba(10,16,19,.55)',Math.max(.6,b.scale*.084))
  }
  // Each part has a differently keyed index. The reddish portion is a sunken enamel insert.
  const signal=b.i===1?'#f7c9ac':'#f04534'
  for(let k=0;k<3;k++) {
    const u0=.55+k*.105
    polygon(ctx,[[u0,.195],[u0+.066,.195],[u0+.046,.216],[u0-.018,.216]].map(p=>at(...p)),
      k<=b.i?signal:'rgba(15,16,19,.55)')
  }
  // Split the stock near the head with a very narrow half-lap joint.
  stroke(ctx,at(0,.1065),at(1,.1065),'rgba(242,238,222,.34)',Math.max(.6,b.scale*.083))
  stroke(ctx,at(0,.1048),at(1,.1048),'rgba(13,13,20,.73)',Math.max(.65,b.scale*.13))
  // Flush fasteners sit in two milled counterbores; ellipse orientation is obtained from projection.
  for(const [x,y,r] of [[.18,.047,.72],[.82,.047,.70],[.50,.527,.43]]) {
    const [cx,cy]=uv(x,y)
    const ring=(radius,z,fill)=>{
      const points=Array.from({length:22},(_,i)=>{
        const a=i*Math.PI*2/22
        return P(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,z)
      })
      polygon(ctx,points,fill)
    }
    const A=P(cx-r,cy-r), B=P(cx+r,cy+r)
    const rim=ctx.createLinearGradient(...A,...B)
    rim.addColorStop(0,'#171820'); rim.addColorStop(.36,'#53565b'); rim.addColorStop(.67,'#dde0d6'); rim.addColorStop(1,'#7a7479')
    ring(r*1.21,.589,rim); ring(r,.598,'#1c1c22'); ring(r*.75,.601,'#77797b')
    ring(r*.46,.61,'#28272c')
    const angle=.37+b.i*.44
    stroke(ctx,P(cx-r*.5*Math.cos(angle),cy-r*.5*Math.sin(angle)),P(cx+r*.5*Math.cos(angle),cy+r*.5*Math.sin(angle)),
      '#1b1c21',Math.max(.6,b.scale*r*.19))
  }
  ctx.restore()
}

export function drawSculpture(ctx, time, options = {}) {
  const camera=makeCamera(time, Boolean(options.end))
  ctx.save()
  ctx.lineJoin='round'
  ctx.lineCap='butt'
  for (const blade of projection(camera)) {
    drawBody(ctx,blade,camera)
    drawFace(ctx,blade,camera)
  }
  ctx.restore()
}
