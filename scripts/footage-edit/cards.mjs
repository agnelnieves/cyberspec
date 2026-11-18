// Title-safe CRT transmission cards, drawn in a 1920 × 1080 coordinate system.
const width = 1920
const height = 1080
const coral = '#ff594f'
const mono = '"JetBrains Mono", Menlo, monospace'

const unit = n => Math.min(1, Math.max(0, n))
const ease = n => 1 - (1 - unit(n)) ** 3

function softLight(ctx, x, y, radiusX, radiusY, center, edge) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(radiusX, radiusY)
  const light = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  light.addColorStop(0, center)
  light.addColorStop(1, edge)
  ctx.fillStyle = light
  ctx.fillRect(-1, -1, 2, 2)
  ctx.restore()
}

function atmosphere(createCanvas) {
  const canvas = createCanvas(width, height)
  const g = canvas.getContext('2d')
  g.fillStyle = '#080b0f'
  g.fillRect(0, 0, width, height)
  softLight(g, 985, 522, 1050, 730, 'rgba(24,57,60,.37)', 'rgba(11,25,30,0)')
  softLight(g, 750, 534, 544, 226, 'rgba(84,33,36,.22)', 'rgba(60,22,26,0)')
  softLight(g, 1084, 541, 535, 200, 'rgba(42,107,108,.21)', 'rgba(45,85,88,0)')
  // A stationary raster holds together through video compression.
  g.fillStyle = 'rgba(0,0,0,.09)'
  for (let y = 0; y < height; y += 4) g.fillRect(0, y, width, 1)
  return canvas
}

function wireframe(ctx, t) {
  const settling = 1 - ease(t / .48)
  const ox = 78 - settling * 4
  const oy = 94 - settling * 3
  const ix = 319 + settling * 13
  const iy = 214 + settling * 8
  const right = width - ix
  const bottom = height - iy
  ctx.save()
  ctx.strokeStyle = '#713331'
  ctx.lineWidth = 1.4
  ctx.strokeRect(ox, oy, width - 2 * ox, height - 2 * oy)
  ctx.strokeRect(ix, iy, width - 2 * ix, height - 2 * iy)
  ctx.beginPath()
  for (const sx of [0, 1]) {
    for (const sy of [0, 1]) {
      const y1 = sy ? height - oy : oy
      const x2 = sx ? right : ix
      const y2 = sy ? bottom : iy
      const edgeY = y1 - (y2 - y1) * ox / (ix - ox)
      ctx.moveTo(sx * width, edgeY)
      ctx.lineTo(x2, y2)
    }
  }
  ctx.moveTo(0, height / 2)
  ctx.lineTo(ix, height / 2)
  ctx.moveTo(right, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.moveTo(width / 2, 0)
  ctx.lineTo(width / 2, iy)
  ctx.moveTo(width / 2, bottom)
  ctx.lineTo(width / 2, height)
  ctx.stroke()
  // Four small registration marks briefly separate as the signal finds lock.
  const shift = 9 * settling
  ctx.strokeStyle = '#bc5047'
  ctx.lineWidth = 1.6
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const x = width / 2 + sx * (width / 2 - ix + shift)
    const y = height / 2 + sy * (height / 2 - iy + shift)
    ctx.beginPath()
    ctx.moveTo(x - sx * 24, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y - sy * 15)
    ctx.stroke()
  }
  ctx.restore()
}

function text(ctx, content, x, y, size, color, align = 'left', tracking = 1) {
  ctx.save()
  ctx.font = '500 ' + size + 'px ' + mono
  ctx.letterSpacing = tracking + 'px'
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(content, x, y)
  ctx.restore()
}

function dataStrip(ctx, kind, t) {
  const lock = kind === 'intro' ? (t < .24 ? 'SYNC' : 'CONNECTED') : 'TRANSMISSION COMPLETE'
  const textWidth = kind === 'intro' ? 399 : 510
  ctx.fillStyle = '#101c20'
  ctx.fillRect((width - textWidth) / 2, 23, textWidth, 43)
  text(ctx, '/// [ ' + lock + ' ] ///', 960, 52, 20, coral, 'center', 1.6)
  text(ctx, 'CS  /  UI SDK', 1839, 53, 18, '#b85a52', 'right')
  ctx.strokeStyle = '#c3554d'
  ctx.lineWidth = 1.7
  ctx.beginPath()
  for (let i = 0; i < 12; i++) {
    const x = 80 + i * 12
    ctx.moveTo(x, 1037)
    ctx.lineTo(x + 8, 1018)
  }
  ctx.stroke()
  const timecode = [Math.floor(t), Math.floor((t % 1) * 30)]
    .map(value => String(value).padStart(2, '0')).join(':')
  ctx.fillStyle = '#090e12'
  ctx.fillRect(773, 1011, 374, 34)
  text(ctx, 'TX  //  00:' + timecode, 960, 1033, 17, '#b95a53', 'center', 1.6)
  text(ctx, kind === 'intro' ? 'IN  /  01' : 'OUT  /  02', 1839, 1033, 17, '#b95a53', 'right')
}

export function makeCards(canvasLib, brand) {
  const ground = atmosphere(canvasLib.createCanvas)
  const mark = new canvasLib.Path2D(brand.mark)
  const letters = brand.letters.map(path => new canvasLib.Path2D(path))

  function paintBrand(g, progress, color) {
    g.save()
    g.fillStyle = color
    g.strokeStyle = color
    g.translate(0, 8)
    g.fill(mark)
    g.translate(130, 10.5)
    g.scale(1.05, 1.05)
    g.lineJoin = 'miter'
    g.lineCap = 'square'
    g.lineWidth = 5.6
    letters.forEach((path, index) => {
      const settle = ease((progress * 1.28 - index * .035))
      g.save()
      g.globalAlpha *= .33 + settle * .67
      g.translate(index * 57 + (1 - settle) * 6, 0)
      g.setLineDash([340, 340])
      g.lineDashOffset = (1 - settle) * 100
      g.stroke(path)
      g.restore()
    })
    g.restore()
  }

  return function drawCard(ctx, kind, t, duration) {
    const closing = kind === 'outro'
    const age = Math.max(0, Math.min(t, duration))
    const progress = ease(age / (closing ? .56 : .48))
    ctx.save()
    ctx.drawImage(ground, 0, 0)
    wireframe(ctx, age)
    dataStrip(ctx, kind, age)

    ctx.save()
    const scale = 1.41 + .025 * progress
    ctx.translate(width / 2, closing ? 494 : 531)
    ctx.scale(scale, scale)
    ctx.translate(-330, -50)
    // A very short phosphor register settles onto the primary vector edges.
    if (progress < .99) {
      ctx.save()
      ctx.globalAlpha = .30 * (1 - progress)
      ctx.translate(8 * (1 - progress), 0)
      paintBrand(ctx, progress, '#65c5c3')
      ctx.restore()
    }
    paintBrand(ctx, progress, coral)
    ctx.restore()

    if (closing) {
      ctx.globalAlpha = .60 + .40 * ease((age - .04) / .3)
      text(ctx, 'cyberspec.dev', 960, 650, 43, '#9ee7e6', 'center', 1)
    }
    ctx.restore()
  }
}
