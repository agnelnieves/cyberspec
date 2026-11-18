// Browser-side, deterministic canvas scene used by the poster and the 30 fps loop.
import { mapLandPath } from "../registry/cyber/lib/map/geography.ts"
import { createGlobeProjection, globeVector } from "../registry/cyber/lib/map/orthographic.ts"

const canvas = document.createElement("canvas")
const exportCanvas = document.createElement("canvas")
exportCanvas.width = 1200
exportCanvas.height = 630
const ctx = canvas.getContext("2d", { alpha: false })
const coral = "#ff585b",
  cyan = "#68f4f5",
  paper = "#ffe9e5",
  voidInk = "#07070c"
const tau = Math.PI * 2
const rad = Math.PI / 180
const wordmark = new Path2D()
const brand = document.querySelector("[data-site-logo]")
for (const [index, letter] of [...brand.querySelectorAll("[data-site-wordmark] path")].entries()) {
  const offset = 130 + index * 57 * 1.05
  wordmark.addPath(new Path2D(letter.getAttribute("d")), new DOMMatrix([1.05, 0, 0, 1.05, offset, 18.5]))
}
const slash = new Path2D(brand.querySelector("path").getAttribute("d"))
const reykjavik = [-21.94, 64.15]
const city = globeVector(reykjavik)

// The basemap uses relative path segments in a 1024-unit Mercator projection.
// Sample horizontal land spans at a constant surface spacing for this card size.
function sampleLand(spacing) {
  const rings = mapLandPath
    .split("M")
    .slice(1)
    .map((ring) => {
      const numbers = ring.match(/-?\d+(?:\.\d+)?/g).map(Number)
      const points = []
      let x = 0,
        y = 0
      for (let i = 0; i < numbers.length; i += 2) {
        x += numbers[i]
        y += numbers[i + 1]
        points.push({ x, y })
      }
      return points
    })
  const samples = []
  for (let row = 0; row * spacing < 170; row++) {
    const latitude = row * spacing - 85
    const y = (1 - Math.asinh(Math.tan(latitude * rad)) / Math.PI) * 512
    const crossings = []
    for (const ring of rings) {
      let a = ring.at(-1)
      for (const b of ring) {
        if (a.y > y !== b.y > y) crossings.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y))
        a = b
      }
    }
    crossings.sort((a, b) => a - b)
    const count = Math.round((360 * Math.cos(latitude * rad)) / spacing)
    const stagger = (row % 2) / 2
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const start = Math.ceil((crossings[i] / 1024) * count - stagger)
      const end = (crossings[i + 1] / 1024) * count - stagger
      for (let column = start; column < end; column++) {
        const longitude = ((column + stagger) / count) * 360 - 180
        const point = globeVector([longitude, latitude])
        const cosine = point.x * city.x + point.y * city.y + point.z * city.z
        samples.push({ ...point, distance: Math.acos(Math.max(-1, Math.min(1, cosine))) / rad })
      }
    }
  }
  return samples
}

function globeLine(from, to, coordinate) {
  const line = []
  for (let degrees = from; degrees <= to; degrees += 2) line.push(globeVector(coordinate(degrees)))
  return line
}
const data = sampleLand(1.27)
const geogrid = []
for (let lon = -180; lon < 180; lon += 30) geogrid.push(globeLine(-90, 90, (lat) => [lon, lat]))
for (let lat = -60; lat <= 60; lat += 30) geogrid.push(globeLine(-180, 180, (lon) => [lon, lat]))
const framePath = new Path2D("M18 44L44 18H1182V579L1149 612H49L18 581Z")
function line(x1, y1, x2, y2, color, w = 1) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = w
  ctx.stroke()
}
function type(text, x, y, font, color, spacing = 0) {
  ctx.font = font
  ctx.fillStyle = color
  ctx.letterSpacing = spacing + "px"
  ctx.fillText(text, x, y)
  ctx.letterSpacing = "0px"
}
function logo(x, y, width) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(width / 660, width / 660)
  ctx.fillStyle = coral
  ctx.save()
  ctx.translate(0, 8)
  ctx.fill(slash)
  ctx.restore()
  ctx.strokeStyle = "#ffe3df"
  ctx.lineWidth = 5.6 * 1.05
  ctx.lineCap = "square"
  ctx.lineJoin = "miter"
  ctx.stroke(wordmark)
  ctx.restore()
}
function globe(t) {
  const theta = (t / 8) * tau
  const drift = (1 - Math.cos(theta)) / 2
  const cx = 967 - 6 * drift,
    cy = 398 + 7 * drift,
    r = 344 + 16 * drift
  const longitude = -10 - 20 * drift,
    lat = 24 + 2 * Math.sin(theta) + 2 * drift
  const p = createGlobeProjection([longitude, lat], 2 * cx, 2 * cy, r)
  const atmosphere = ctx.createRadialGradient(cx, cy, r * 0.94, cx, cy, r * 1.065)
  atmosphere.addColorStop(0, "rgba(170,36,31,.1)")
  atmosphere.addColorStop(0.45, "rgba(187,34,38,.055)")
  atmosphere.addColorStop(1, "rgba(160,27,33,0)")
  ctx.fillStyle = atmosphere
  ctx.fillRect(cx - r * 1.07, cy - r * 1.07, r * 2.14, r * 2.14)
  const sea = ctx.createRadialGradient(cx + 0.26 * r, cy - 0.36 * r, 0, cx, cy, r * 1.18)
  sea.addColorStop(0, "#2c131a")
  sea.addColorStop(0.57, "#1f0f17")
  sea.addColorStop(0.9, "#100b13")
  sea.addColorStop(1, "#0e0c12")
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, tau)
  ctx.fillStyle = sea
  ctx.fill()
  ctx.strokeStyle = "#6b2b32"
  ctx.lineWidth = 1.05
  ctx.stroke()
  ctx.beginPath()
  for (const points of geogrid) {
    let on = false
    for (const v of points) {
      const v2 = p.rotate(v)
      if (v2.z > 0) {
        const x = cx + r * v2.x,
          y = cy + r * v2.y
        if (on) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      }
      on = v2.z > 0
    }
  }
  ctx.lineWidth = 0.8
  ctx.strokeStyle = "rgba(240,102,99,.245)"
  ctx.stroke()
  const relief = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r * 0.6)
  relief.addColorStop(0, "#913136")
  relief.addColorStop(0.37, "#ec5456")
  relief.addColorStop(0.68, "#ff7373")
  relief.addColorStop(1, "#ff4a50")
  const bands = 14
  const paths = Array.from({ length: bands }, () => new Path2D())
  const ringPaths = Array.from({ length: 8 }, () => new Path2D())
  const scanTime = (t - 0.62) / 4.65
  const scanOn = scanTime > 0 && scanTime < 1
  const distance = scanTime * 100
  const waveOpacity = scanOn ? Math.min(1, scanTime * 16, (1 - scanTime) * 4) : 0
  const dot = (1.87 * r) / 354
  for (const v of data) {
    const b = p.rotate(v)
    if (b.z <= 0) continue
    const band = Math.min(bands - 1, Math.floor(b.z * bands))
    const axis = (dot * (1 - (band + 0.5) / bands)) / (Math.hypot(b.x, b.y) || 1),
      dx = -b.y * axis,
      dy = b.x * axis
    const x = cx + b.x * r,
      y = cy + b.y * r
    paths[band].moveTo(x - dx, y - dy)
    paths[band].lineTo(x + dx + 0.001, y + dy)
    if (scanOn) {
      const ring = distance - v.distance
      if (ring >= 0 && ring < 8) {
        const path = ringPaths[Math.floor(ring)]
        path.moveTo(x - dx * 0.42, y - dy * 0.42)
        path.lineTo(x + dx * 0.42 + 0.015, y + dy * 0.42 + 0.015)
      }
    }
  }
  ctx.lineCap = "round"
  ctx.strokeStyle = relief
  paths.forEach((path, i) => {
    ctx.globalAlpha = 0.28 + (0.72 * (i + 1)) / bands
    ctx.lineWidth = Math.max(0.22, (dot * 2 * (i + 0.5)) / bands)
    ctx.stroke(path)
  })
  ctx.globalAlpha = 1
  if (scanOn) {
    ringPaths.forEach((path, i) => {
      ctx.lineWidth = 2.65
      ctx.strokeStyle = "rgba(247,204,173," + 0.82 * (1 - i / 8) * waveOpacity + ")"
      ctx.stroke(path)
    })
    // Radio wave traced geodesically across the same sphere as the land.
    const angular = distance * rad
    const clat = 64.15 * rad,
      clon = -21.94 * rad
    ctx.beginPath()
    let on = false
    for (let i = 0; i <= 360; i += 2) {
      const a = i * rad
      const lat = Math.asin(
        Math.sin(clat) * Math.cos(angular) + Math.cos(clat) * Math.sin(angular) * Math.cos(a),
      )
      const lon =
        clon +
        Math.atan2(
          Math.sin(a) * Math.sin(angular) * Math.cos(clat),
          Math.cos(angular) - Math.sin(clat) * Math.sin(lat),
        )
      const q = p.point([lon / rad, lat / rad])
      if (q.visible) {
        if (on) ctx.lineTo(q.x, q.y)
        else ctx.moveTo(q.x, q.y)
      }
      on = q.visible
    }
    ctx.strokeStyle = "rgba(137,241,239," + 0.3 * waveOpacity + ")"
    ctx.lineWidth = 1.1
    ctx.stroke()
  }
  ctx.lineCap = "butt"
  // A short secondary limb line is also present in the landing globe.
  ctx.strokeStyle = "rgba(247,105,103,.46)"
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.arc(cx, cy, r + 6, -1.49, -0.77)
  ctx.stroke()
  const waypoint = p.point(reykjavik)
  return waypoint
}
function pin(x, y, t) {
  const tx = x + 35,
    ty = y - 38
  ctx.beginPath()
  ctx.moveTo(x + 10, y - 9)
  ctx.lineTo(tx - 11, ty + 6)
  ctx.lineTo(tx + 1, ty + 6)
  ctx.lineWidth = 1.3
  ctx.strokeStyle = cyan
  ctx.stroke()
  const w = 151,
    h = 46
  ctx.fillStyle = "rgba(7,11,17,.96)"
  ctx.fillRect(tx, ty - 12, w, h)
  type("REYKJAVÍK", tx + 8, ty + 6, "600 17px Kode", cyan, 0.7)
  type("64.15°N  21.94°W", tx + 8, ty + 25, "500 13px Kode", "#ade3e0", 0.25)
  const size = 17
  ctx.fillStyle = "#0a151b"
  ctx.fillRect(x - size / 2, y - size / 2, size, size)
  ctx.strokeStyle = cyan
  ctx.lineWidth = 1.55
  ctx.strokeRect(x - size / 2, y - size / 2, size, size)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x - 6.5, y - 6.5, 13, 13)
  ctx.clip()
  for (let s = -18; s < 15; s += 4) line(x + s, y + 8, x + s + 9, y - 8, "rgba(102,241,242,.55)", 0.8)
  ctx.restore()
  ctx.fillStyle = cyan
  ctx.fillRect(x - 2, y - 2, 4, 4)
  const beat = Math.max(0, 1 - Math.abs(t - 0.86) / 0.44)
  if (beat) {
    ctx.strokeStyle = "rgba(100,245,246," + beat * 0.6 + ")"
    ctx.strokeRect(x - 12, y - 12, 24, 24)
  }
}
// Frames hold each registration error for a few exposures before the letters settle.
const titleBursts = [
  { frame: 45, strengths: [0.32, 0.32, 1, 1, 1, 0.64, 0.64, -0.67, -0.67, -0.25, -0.25, 0.14, 0.14] },
  { frame: 166, strengths: [-0.3, -0.3, -0.81, -0.81, -0.81, 0.48, 0.48, 0.48, 0.2, 0.2] },
]
function headline(t) {
  const frame = Math.round(t * 30)
  const cue = titleBursts.find(
    ({ frame: start, strengths }) => frame >= start && frame < start + strengths.length,
  )
  if (!cue) {
    type("CYBERPUNK", 72, 314, "550 103px Kode", paper, -6.3)
    type("INTERFACES.", 72, 407, "550 103px Kode", coral, -6.3)
    return
  }
  const intensity = cue.strengths[frame - cue.frame]
  function lineOfType(text, baseline, color, bands) {
    const top = baseline - 81
    const bottom = baseline + 4
    // Draw disjoint strips of the glyphs, on top of the original background.
    const strips = [
      [top, bands[0], 0],
      [bands[0], bands[1], 17],
      [bands[1], bands[2], 0],
      [bands[2], bands[3], -10],
      [bands[3], bottom, 0],
    ]
    for (const [y, until, shift] of strips) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(25, y, 690, until - y)
      ctx.clip()
      ctx.translate(intensity * (shift + 1), baseline)
      ctx.transform(1, 0, -0.022 * intensity, 1, 0, 0)
      ctx.globalAlpha = 0.87
      type(text, 72 - 6.6 * intensity, 0, "550 103px Kode", cyan, -6.3)
      type(text, 72 + 5.2 * intensity, 0, "550 103px Kode", "#ff3a55", -6.3)
      ctx.globalAlpha = 1
      type(text, 72, 0, "550 103px Kode", color, -6.3)
      ctx.restore()
    }
  }
  lineOfType("CYBERPUNK", 314, paper, [263, 272, 289, 293])
  lineOfType("INTERFACES.", 407, coral, [352, 358, 379, 389])
}
window.renderArtwork = function (t, scale) {
  const w = 1200,
    h = 630
  if (canvas.width !== w * scale || canvas.height !== h * scale) {
    canvas.width = w * scale
    canvas.height = h * scale
  }
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.globalAlpha = 1
  ctx.fillStyle = voidInk
  ctx.fillRect(0, 0, w, h)
  ctx.save()
  ctx.clip(framePath)
  const bg = ctx.createRadialGradient(876, 290, 5, 876, 290, 869)
  bg.addColorStop(0, "#251319")
  bg.addColorStop(0.65, "#100d14")
  bg.addColorStop(1, voidInk)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  for (let x = 44; x < w; x += 24)
    for (let y = 49; y < h; y += 24) {
      const strength = Math.max(0, 1 - Math.abs(y - 328) / 310)
      ctx.fillStyle = "rgba(237,110,110," + strength * (0.1 + (0.17 * x) / w) + ")"
      ctx.fillRect(x, y, 1.25, 1.25)
    }
  const wp = globe(t)
  const shade = ctx.createLinearGradient(465, 0, 769, 0)
  shade.addColorStop(0, "rgba(7,7,12,.55)")
  shade.addColorStop(0.32, "rgba(7,7,12,.37)")
  shade.addColorStop(1, "rgba(7,7,12,0)")
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, 769, h)
  const toe = ctx.createLinearGradient(0, 478, 0, 630)
  toe.addColorStop(0, "rgba(7,7,12,0)")
  toe.addColorStop(0.6, "rgba(7,7,12,.20)")
  toe.addColorStop(1, "rgba(7,7,12,.73)")
  ctx.fillStyle = toe
  ctx.fillRect(0, 478, w, 152)
  pin(wp.x, wp.y, t)
  logo(75, 65, 256)
  line(77, 207, 103, 207, cyan, 2)
  type("OPEN-SOURCE REACT LIBRARY", 116, 213, "550 19px Kode", cyan, 1.1)
  headline(t)
  type("Cut-corner controls, charts, and maps.", 77, 462, "500 32px Rajdhani", "#e6cfcf", 0)
  line(76, 537, 1125, 537, "rgba(234,100,101,.27)", 1)
  type("cyberspec.dev", 76, 571, "550 17px Kode", "#ede1e1", 0.35)
  ctx.restore()
  ctx.strokeStyle = "#773138"
  ctx.lineWidth = 1.15
  ctx.stroke(framePath)
  const output = exportCanvas.getContext("2d", { alpha: false })
  output.imageSmoothingEnabled = true
  output.imageSmoothingQuality = "high"
  output.drawImage(canvas, 0, 0, w, h)
  return exportCanvas.toDataURL("image/png").split(",")[1]
}
