// Deterministic CRT frames for the eight-second social loop. Every visual is
// sampled from time so offline exports do not depend on browser timer speed.
const TAU = Math.PI * 2
const fract = (value) => value - Math.floor(value)
const random = (seed) => fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453)
const burst = (time, start, duration) => {
  const p = (time - start) / duration
  return p > 0 && p < 1 ? Math.sin(p * Math.PI) ** .7 : 0
}

export function crtArtwork({ w, h, time, logo, room, outer, inner, text }) {
  const t = ((time % 8) + 8) % 8
  const phase = t / 8
  // Three discrete signal failures, with a readable hold between each one.
  // Distortion changes position and color; there are no full-screen flashes.
  const glitch = Math.max(burst(t, .48, .64), burst(t, 3.38, .64), burst(t, 6.08, .64))
  const step = Math.floor(t * 15)
  const kick = [1, -.55, .8, -1, .45][step % 5]
  const spread = .6 + glitch * 8
  const breathe = .5 - .5 * Math.cos(phase * TAU)
  const scanY = (fract(phase * 2 + .16) * 1.4 - .2) * h
  const sweepOpacity = .65
  const bars = [
    { y: h / 2 - 38, height: 10, shift: 28 },
    { y: h / 2 - 4, height: 18, shift: -21 },
    { y: h / 2 + 26, height: 7, shift: 37 },
  ]
  const disturbed = glitch > .015
  const slices = disturbed ? bars.map((bar, i) => `<g clip-path="url(#slice-${i})"><g transform="translate(${bar.shift * glitch * kick} 0)"><use href="#phosphor-logo"/><use href="#cyan-logo" transform="translate(${-spread * 1.6} 1)" opacity="${glitch * .7}"/></g></g>`).join("") : ""

  const roomLines = `<g fill="none" stroke="#ff534b" stroke-width=".9"><rect x="${outer.x}" y="${outer.y}" width="${outer.width}" height="${outer.height}"/><path d="${room}"/><rect x="${inner.x}" y="${inner.y}" width="${inner.width}" height="${inner.height}"/></g>`
  // Expanding lines make the depth visible even in a small social preview.
  const travelingFrames = [0, .25, .5, .75].map((offset) => {
    const p = fract(phase * 2 + offset)
    const q = p * p
    const alpha = Math.sin(p * Math.PI) * .48
    const x = inner.x + (outer.x - inner.x) * q
    const y = inner.y + (outer.y - inner.y) * q
    const width = inner.width + (outer.width - inner.width) * q
    const height = inner.height + (outer.height - inner.height) * q
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="#ff6256" stroke-width="${.6 + p * .6}" opacity="${alpha}"/>`
  }).join("")

  const staticLines = Array.from({ length: 42 }, (_, i) => {
    const seed = i + Math.floor(t * 12) * 47
    const x = random(seed) * w
    const y = random(seed + 41) * h
    const length = 1 + random(seed + 71) * (glitch > .2 ? 36 : 8)
    return `<path d="M${x} ${y}h${length}" stroke="#c3e1d6" stroke-width=".7" opacity="${.04 + glitch * .12}"/>`
  }).join("")
  const signalBars = Array.from({ length: 36 }, (_, i) => {
    const amplitude = .3 + .7 * (.5 + .5 * Math.sin(i * .75 - phase * TAU * 4))
    const height = 2 + amplitude * (9 + glitch * 8)
    return `<rect x="${w / 2 - 106 + i * 6}" y="${h * .715 - height / 2}" width="2" height="${height}" fill="#ff534b" opacity="${.2 + amplitude * .45}"/>`
  }).join("")
  const clock = `00:${String(Math.floor(t)).padStart(2, "0")}:${String(Math.floor(t * 30) % 30).padStart(2, "0")}`
  const checksum = Math.floor(65535 * (.5 + .5 * Math.sin(phase * TAU * 2))).toString(16).padStart(4, "0").toUpperCase()
  const status = disturbed ? "SIGNAL CORRUPTED" : t < 1.12 ? "ACQUIRING SIGNAL" : "CONNECTION ESTABLISHED"
  const footer = disturbed ? `// CRC ${checksum} // RE-SYNC ........` : `// TIME ${clock} // SIGNAL ${Math.round(97 + 2 * Math.sin(phase * TAU))}% //`
  const rgbLogo = (color) => logo.replaceAll("#ff534b", color)
  const scale = 1 + breathe * .012
  const centerTransform = `translate(${w / 2} ${h / 2}) scale(${scale}) translate(${-w / 2} ${-h / 2})`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="CYBERSPEC CRT signal with red phosphor, scan sweeps and brief RGB glitches">
<defs>
  <g id="phosphor-logo">${logo}</g>
  <g id="cyan-logo">${rgbLogo("#6ddcc8")}</g>
  <g id="red-logo">${rgbLogo("#ff2146")}</g>
  <g id="room-lines">${roomLines}</g>
  <filter id="bloom" x="-25%" y="-50%" width="150%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="soft" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="1"/></filter>
  <radialGradient id="atmosphere"><stop stop-color="#21484a" stop-opacity="${.48 + breathe * .12}"/><stop offset=".6" stop-color="#0d171a" stop-opacity=".25"/><stop offset="1" stop-color="#080b0d" stop-opacity="0"/></radialGradient>
  <radialGradient id="vignette" r=".75"><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
  <linearGradient id="roll" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#75c9bc" stop-opacity="0"/><stop offset=".75" stop-color="#75c9bc" stop-opacity=".035"/><stop offset=".96" stop-color="#b2e3d4" stop-opacity=".1"/><stop offset="1" stop-color="#b2e3d4" stop-opacity="0"/></linearGradient>
  <linearGradient id="scan-glow" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ff534b" stop-opacity="0"/><stop offset=".88" stop-color="#ff534b" stop-opacity=".08"/><stop offset=".98" stop-color="#ffc6a6" stop-opacity=".32"/><stop offset="1" stop-color="#ff534b" stop-opacity="0"/></linearGradient>
  <pattern id="raster" width="3" height="4" patternUnits="userSpaceOnUse" patternTransform="translate(0 ${fract(phase * 16) * 4})"><path d="M0 0H3" stroke="#000" stroke-opacity=".26"/><path d="M.5 0V4" stroke="#f96c58" stroke-opacity=".025"/></pattern>
  <mask id="brand-mask"><rect width="${w}" height="${h}" fill="white"/>${disturbed ? bars.map((bar) => `<rect y="${bar.y}" width="${w}" height="${bar.height}" fill="black"/>`).join("") : ""}</mask>
  ${bars.map((bar, i) => `<clipPath id="slice-${i}"><rect y="${bar.y}" width="${w}" height="${bar.height}"/></clipPath>`).join("")}
  <clipPath id="screen-tear"><rect y="${h * .33}" width="${w}" height="${5 + glitch * 10}"/><rect y="${h * .78}" width="${w}" height="4"/></clipPath>
</defs>
<rect width="${w}" height="${h}" fill="#080c0e"/>
<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * .49}" ry="${h * .57}" fill="url(#atmosphere)"/>
<g opacity=".68"><use href="#room-lines"/></g>
<g opacity=".12" filter="url(#soft)"><use href="#room-lines"/></g>
${travelingFrames}
${disturbed ? `<g clip-path="url(#screen-tear)"><rect width="${w}" height="${h}" fill="#080c0e"/><use href="#room-lines" transform="translate(${35 * glitch * kick} 0)" opacity=".8"/></g>` : ""}
<g transform="${centerTransform}">
  <use href="#phosphor-logo" filter="url(#bloom)" opacity="${.22 + glitch * .3}"/>
  <use href="#red-logo" transform="translate(${spread} 0)" opacity="${.3 + glitch * .45}"/>
  <use href="#cyan-logo" transform="translate(${-spread} ${glitch * 1.5})" opacity="${.16 + glitch * .5}"/>
  <g mask="url(#brand-mask)"><use href="#phosphor-logo"/></g>
  ${slices}
</g>
${text(w / 2, h / 2 + 78, "CYBERPUNK COMPONENTS // UI SDK", 12, .76, "middle")}
${signalBars}
${text(w / 2, h * .045, `/// [ &gt; ${status} &lt; ] \\\\\\`, 12.5, .92, "middle")}
${text(w * .955, h * .045, "// -- 2026 -- //", 12, .92, "end")}
${text(w * .026, h * .968, "//////////", 13, .88)}
${text(w / 2, h * .968, footer, 12, .88, "middle")}
${text(w * .975, h * .968, `CRC / ${checksum}`, 12, .86, "end")}
<rect y="${scanY - 130}" width="${w}" height="130" fill="url(#roll)"/>
<rect y="${scanY - 65}" width="${w}" height="65" fill="url(#scan-glow)" opacity="${sweepOpacity}"/>
<path d="M0 ${scanY - 1}H${w}" stroke="#ffc2a6" stroke-width="1" opacity=".15"/>
${staticLines}
${disturbed ? `<path d="M${w * .16} ${h / 2 - 16}h${w * .52}" stroke="#ff7369" stroke-width="1" opacity="${glitch * .36}"/><rect x="${w * .75}" y="${h / 2 + 47}" width="${glitch * 68}" height="3" fill="#7ebcab" opacity=".6"/>` : ""}
<rect width="${w}" height="${h}" fill="url(#raster)"/>
<rect width="${w}" height="${h}" fill="url(#vignette)"/>
</svg>`
}
