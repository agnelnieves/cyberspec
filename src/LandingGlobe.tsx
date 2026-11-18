import { memo, useEffect, useId, useRef } from "react"
import { project } from "@/registry/cyber/lib/map/camera"
import { mapLandPath } from "@/registry/cyber/lib/map/geography"
import { createGlobeProjection, globeVector, type GlobeProjection, type GlobeVector } from "@/registry/cyber/lib/map/orthographic"
import "./landing-globe.css"

const size = 760
const radius = 354
const center = size / 2
const startLongitude = -26
const latitude = 23
const view = createGlobeProjection([startLongitude, latitude], size, size, radius)
const city = [-21.94, 64.15] as const
const waypoint = view.point(city)
const rotationPeriod = 240_000
const radians = Math.PI / 180
const bands = 12
const spacing = 1.15
const dotRadius = 1.55
const rounded = (value: number) => Number(value.toFixed(2))

// A scanline through the bundled Natural Earth basemap gives the land spans
// at one latitude. Cutting alternating spans also leaves the lakes open.
function landRings() {
  return mapLandPath.split("M").slice(1).map((ring) => {
    const numbers = ring.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
    const points = []
    let x = 0, y = 0
    for (let i = 0; i < numbers.length; i += 2) {
      x += numbers[i]
      y += numbers[i + 1]
      points.push({ x, y })
    }
    return points
  })
}

function landDots() {
  const rings = landRings()
  const points: GlobeVector[] = []
  for (let row = 0; row * spacing < 170; row++) {
    const latitude = row * spacing - 85
    const { y } = project([0, latitude])
    const crossings: number[] = []
    for (const ring of rings) {
      let a = ring[ring.length - 1]
      for (const b of ring) {
        if ((a.y > y) !== (b.y > y)) crossings.push(a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y))
        a = b
      }
    }
    crossings.sort((a, b) => a - b)
    // Constant surface spacing, even where the parallels approach the pole.
    const count = Math.round(360 * Math.cos(latitude * radians) / spacing)
    const stagger = (row % 2) / 2
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const start = Math.ceil(crossings[i] / 1024 * count - stagger)
      const end = (crossings[i + 1] / 1024) * count - stagger
      for (let column = start; column < end; column++) {
        const longitude = (column + stagger) / count * 360 - 180
        points.push(globeVector([longitude, latitude]))
      }
    }
  }
  return points
}

function graticule() {
  const lines: GlobeVector[][] = []
  function line(from: number, to: number, coordinate: (degree: number) => [number, number]) {
    const points = []
    for (let degree = from; degree <= to; degree += 2) points.push(globeVector(coordinate(degree)))
    lines.push(points)
  }
  for (let lon = -180; lon < 180; lon += 30) line(-90, 90, (lat) => [lon, lat])
  for (let lat = -60; lat <= 60; lat += 30) line(-180, 180, (lon) => [lon, lat])
  return lines
}

function projectDots(points: GlobeVector[], projection: GlobeProjection, draw: (band: number, x: number, y: number, dx: number, dy: number) => void) {
  for (const point of points) {
    const p = projection.rotate(point)
    if (p.z <= 0) continue
    const band = Math.min(bands - 1, Math.floor(p.z * bands))
    // On the limb, the radial axis foreshortens while the tangent stays long.
    const axis = dotRadius * (1 - (band + 0.5) / bands) / (Math.sqrt(p.x * p.x + p.y * p.y) || 1)
    const dx = -p.y * axis, dy = p.x * axis
    draw(band, center + p.x * radius - dx, center + p.y * radius - dy, 2 * dx, 2 * dy)
  }
}

function projectGrid(lines: GlobeVector[][], projection: GlobeProjection, draw: (connect: boolean, x: number, y: number) => void) {
  for (const line of lines) {
    let penDown = false
    for (const point of line) {
      const p = projection.rotate(point)
      if (p.z > 0) draw(penDown, center + p.x * radius, center + p.y * radius)
      penDown = p.z > 0
    }
  }
}

function buildSurface() {
  const points = landDots()
  const lines = graticule()
  const dots: string[][] = Array.from({ length: bands }, () => [])
  const grid: string[] = []
  projectDots(points, view, (band, x, y, dx, dy) => dots[band].push(`M${rounded(x)},${rounded(y)}l${rounded(dx)},${rounded(dy)}`))
  projectGrid(lines, view, (connect, x, y) => grid.push(`${connect ? "L" : "M"}${rounded(x)},${rounded(y)}`))
  return { points, lines, dots: dots.map((band) => band.join("")), grid: grid.join("") }
}

type Surface = ReturnType<typeof buildSurface>
let cachedSurface: Surface | undefined

function animateGlobe(svg: SVGSVGElement, surface: Surface) {
  const canvas = svg.querySelector("canvas")!
  const context = canvas.getContext("2d")
  if (!context) return
  const ctx: CanvasRenderingContext2D = context
  const skin = svg.closest<HTMLElement>('[data-skin="cyber"]')
  const pin = svg.querySelector<SVGGElement>(".landing-globe-waypoint")!
  const leader = pin.querySelector("path")!
  const tag = pin.querySelector<SVGGElement>(".landing-globe-tag")!
  const gridElement = svg.querySelector(".landing-globe-grid")!
  const reduced = matchMedia("(prefers-reduced-motion: reduce)")
  let longitude = startLongitude
  let frame = 0, lastTime: number | null = null
  let visible = false, drawn = false
  let gridColor = "", tagWidth = 0, visibleRight = size
  let landColor: CanvasGradient

  function paint() {
    const projection = createGlobeProjection([longitude, latitude], size, size, radius)
    ctx.clearRect(0, 0, size, size)
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 0.65
    ctx.globalAlpha = 0.16
    ctx.beginPath()
    projectGrid(surface.lines, projection, (connect, x, y) => {
      if (connect) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    })
    ctx.stroke()

    const paths = Array.from({ length: bands }, () => new Path2D())
    projectDots(surface.points, projection, (band, x, y, dx, dy) => {
      paths[band].moveTo(x, y)
      paths[band].lineTo(x + dx, y + dy)
    })
    ctx.strokeStyle = landColor
    ctx.lineCap = "round"
    paths.forEach((path, band) => {
      ctx.lineWidth = dotRadius * 2 * (band + 0.5) / bands
      ctx.globalAlpha = 0.35 + 0.65 * (band + 1) / bands
      ctx.stroke(path)
    })

    const p = projection.point(city)
    pin.style.visibility = p.visible ? "" : "hidden"
    if (p.visible) {
      pin.setAttribute("transform", `translate(${rounded(p.x)} ${rounded(p.y)})`)
      const flip = p.x + 49 + tagWidth > visibleRight
      if (flip !== pin.hasAttribute("data-flipped")) {
        pin.toggleAttribute("data-flipped", flip)
        leader.setAttribute("transform", flip ? "scale(-1 1)" : "scale(1)")
      }
      tag.setAttribute("transform", `translate(${flip ? -49 - tagWidth : 49} -26)`)
    }
    if (!drawn) {
      svg.setAttribute("data-rotating-surface", "")
      drawn = true
    }
  }

  function resize() {
    if (!visible || document.hidden) return
    const rect = svg.getBoundingClientRect()
    if (!rect.width) return
    const pixels = Math.round(rect.width * Math.min(window.devicePixelRatio || 1, 2))
    if (canvas.width !== pixels) canvas.width = canvas.height = pixels
    ctx.setTransform(pixels / size, 0, 0, pixels / size, 0, 0)
    landColor = ctx.createLinearGradient(0, 0, size, 450)
    svg.querySelectorAll<SVGStopElement>("linearGradient stop").forEach(stop => {
      landColor.addColorStop(stop.offset.baseVal, getComputedStyle(stop).stopColor)
    })
    gridColor = getComputedStyle(gridElement).stroke
    tagWidth = tag.getBBox().width
    visibleRight = Math.min(size, (document.documentElement.clientWidth - rect.left - 18) * size / rect.width)
    if (drawn) paint()
  }

  // At this speed a 30 Hz update moves the equator by a fraction of a pixel.
  // The animation touches only canvas paths and the one SVG marker.
  function tick(time: number) {
    if (lastTime === null) lastTime = time
    if (time - lastTime >= 1000 / 30 - 1) {
      longitude = (longitude - (time - lastTime) * 360 / rotationPeriod) % 360
      lastTime = time
      paint()
    }
    frame = requestAnimationFrame(tick)
  }

  function sync() {
    const moving = visible && !document.hidden && !reduced.matches && skin?.dataset.fx === "full"
    resize()
    if (moving && !frame) {
      frame = requestAnimationFrame(tick)
    } else if (!moving && frame) {
      cancelAnimationFrame(frame)
      frame = 0
      lastTime = null
    }
  }
  const observedSize = new ResizeObserver(resize)
  observedSize.observe(svg)
  const viewport = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
  viewport.observe(svg)
  const theme = new MutationObserver(sync)
  if (skin) theme.observe(skin, { attributes: true, attributeFilter: ["style", "data-fx"] })
  reduced.addEventListener("change", sync)
  document.addEventListener("visibilitychange", sync)
  return () => {
    cancelAnimationFrame(frame)
    viewport.disconnect()
    observedSize.disconnect()
    theme.disconnect()
    reduced.removeEventListener("change", sync)
    document.removeEventListener("visibilitychange", sync)
    svg.removeAttribute("data-rotating-surface")
    pin.style.visibility = ""
    pin.removeAttribute("data-flipped")
    leader.removeAttribute("transform")
    tag.setAttribute("transform", "translate(49 -26)")
    pin.setAttribute("transform", `translate(${waypoint.x} ${waypoint.y})`)
  }
}

const LandingGlobe = memo(function LandingGlobe() {
  const id = useId()
  const svg = useRef<SVGSVGElement>(null)
  const surface = cachedSurface ??= buildSurface()
  const { dots, grid } = surface
  useEffect(() => {
    if (svg.current) return animateGlobe(svg.current, surface)
  }, [surface])
  return (
    <svg ref={svg} className="landing-globe" viewBox="0 0 760 760" width="760" height="760" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-ocean`} cx="60%" cy="37%" r="74%">
          <stop offset="0" stopColor="var(--earth-ocean-lit)" />
          <stop offset=".76" stopColor="var(--earth-ocean-dark)" />
          <stop offset="1" stopColor="var(--cy-void)" />
        </radialGradient>
        <linearGradient id={`${id}-land`} x1="0" y1="0" x2="760" y2="450" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--earth-land-shadow)" />
          <stop offset=".56" stopColor="var(--cy-accent)" />
          <stop offset=".84" stopColor="var(--earth-land-lit)" />
          <stop offset="1" stopColor="var(--cy-accent)" />
        </linearGradient>
        <pattern id={`${id}-hatch`} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M-1 2l2-4M1 6l4-8" fill="none" stroke="var(--cy-signal)" strokeWidth=".7" opacity=".48" />
        </pattern>
      </defs>
      <circle cx={center} cy={center} r={radius} fill={`url(#${id}-ocean)`} />
      <g className="landing-globe-still">
        <path className="landing-globe-grid" d={grid} fill="none" />
        <g stroke={`url(#${id}-land)`} strokeLinecap="round" fill="none">
          {dots.map((path, band) => (
            <path key={band} d={path} strokeWidth={dotRadius * 2 * (band + 0.5) / bands} opacity={0.35 + 0.65 * (band + 1) / bands} />
          ))}
        </g>
      </g>
      <foreignObject x="0" y="0" width={size} height={size} className="landing-globe-animation">
        <canvas width={size} height={size} />
      </foreignObject>
      <circle className="landing-globe-rim" cx={center} cy={center} r={radius} fill="none" />
      <path className="landing-globe-limb" d="M464 29a361 361 0 0 1 212 144" fill="none" />
      <g className="landing-globe-waypoint" transform={`translate(${waypoint.x} ${waypoint.y})`}>
        <path d="M12 -8l20 -20h15" fill="none" stroke="currentColor" />
        <rect x="-10" y="-10" width="20" height="20" fill="var(--cy-void)" stroke="currentColor" strokeWidth="2" />
        <rect x="-8" y="-8" width="16" height="16" fill={`url(#${id}-hatch)`} />
        <rect x="-2" y="-2" width="4" height="4" fill="currentColor" />
        <g className="landing-globe-tag" transform="translate(49 -26)">
          <rect x="0" y="-1.06em" width="8.7em" height="2.52em" fill="var(--cy-void)" opacity=".94" />
          <text x=".35em" y="0">REYKJAVÍK</text>
          <text className="landing-globe-coordinates" x=".44em" y="1.42em">64.15°N  21.94°W</text>
        </g>
      </g>
    </svg>
  )
})

export { LandingGlobe }
