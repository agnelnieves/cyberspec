// Native vectors adapted to CYBERSPEC's supplied brand reference.
// The wordmark is geometry, so it stays exact across machines and video frames.
import { crtArtwork } from "./social-motion.mjs"
const glyphs = {
  C: "M40 7L33 0H7L0 7V53L7 60H33L40 53",
  Y: "M0 0V10L20 30L40 10V0M20 30V60",
  B: "M0 0H29L38 9V21L25 30L40 43V52L32 60H0ZM0 30H25",
  E: "M40 0H0V60H40M0 30H31",
  R: "M0 60V0H30L40 10V20L30 30H0M25 30L40 60",
  S: "M40 7L33 0H7L0 7V23L7 30H33L40 37V53L33 60H7L0 53",
  P: "M0 60V0H30L40 10V20L30 30H0",
}
const mark = `<path d="M24 0H45L0 84ZM48 0H69L24 84ZM72 0H93L48 84Z" fill="#ff534b"/>`
function wordmark(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="#ff534b" stroke-width="5.6" stroke-linecap="square" stroke-linejoin="miter">${[..."CYBERSPEC"].map((letter, i) => `<path transform="translate(${i * 57} 0)" d="${glyphs[letter]}"/>`).join("")}</g>`
}
function text(x, y, value, size = 13, opacity = .88, anchor = "start") {
  return `<text x="${x}" y="${y}" fill="#ff534b" opacity="${opacity}" font-family="Terminal,monospace" font-size="${size}" font-weight="400" letter-spacing="1" text-anchor="${anchor}">${value}</text>`
}
export function socialArtwork(width = 1200, height = 630, time = null) {
  const square = width === height
  const w = width, h = height
  const outer = { x: w * .04, y: h * .084, width: w * .92, height: h * .832 }
  const inner = { x: w * .17, y: h * (square ? .22 : .205), width: w * .66, height: h * (square ? .56 : .59) }
  const ox = outer.x, oy = outer.y, or = ox + outer.width, ob = oy + outer.height
  const ix = inner.x, iy = inner.y, ir = ix + inner.width, ib = iy + inner.height
  const room = `M0 ${h * .046}L${ox} ${oy}L${ix} ${iy}M${w} ${h * .046}L${or} ${oy}L${ir} ${iy}M0 ${h * .954}L${ox} ${ob}L${ix} ${ib}M${w} ${h * .954}L${or} ${ob}L${ir} ${ib}M${w / 2} 0V${iy}M${w / 2} ${ib}V${h}M0 ${h / 2}H${ix}M${ir} ${h / 2}H${w}`
  const logo = square
    ? `<g transform="translate(${w / 2 - 60} ${h * .33}) scale(1.3)">${mark}</g>${wordmark(w / 2 - 298, h * .50, 1.2)}`
    : `<g transform="translate(${w / 2 - 325} ${h / 2 - 42})">${mark}</g>${wordmark(w / 2 - 195, h / 2 - 32, 1.05)}`
  if (time !== null) return crtArtwork({ w, h, time, logo, room, outer, inner, text })
  const timecode = "00:41:38"
  const data = "12.53"
  const labelY = square ? h * .64 : h / 2 + 78
  const status = "...... /// [ &gt; CONNECTING... &lt; ] \\\\\\ ......"
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="CYBERSPEC coral-red wordmark in a dark wireframe chamber">
<defs><radialGradient id="atmosphere"><stop stop-color="#1c393b" stop-opacity=".48"/><stop offset=".58" stop-color="#0d171a" stop-opacity=".22"/><stop offset="1" stop-color="#080b0d" stop-opacity="0"/></radialGradient><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0H4" stroke="#000" stroke-opacity=".14" stroke-width="1"/></pattern></defs>
<path fill="#080c0e" d="M0 0H${w}V${h}H0Z"/>
<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * .48}" ry="${h * .42}" fill="url(#atmosphere)"/>
<g fill="none" stroke="#ff534b" stroke-width=".8" opacity=".65"><rect x="${ox}" y="${oy}" width="${outer.width}" height="${outer.height}"/><path d="${room}"/></g>
<rect x="${ix}" y="${iy}" width="${inner.width}" height="${inner.height}" fill="none" stroke="#ff534b" stroke-width=".8" opacity=".7"/>
${logo}
${text(w / 2, labelY, "CYBERPUNK COMPONENTS // UI SDK", square ? 15 : 12, .64, "middle")}
${text(w / 2, h * .045, square ? "/// [ &gt; CONNECTING... &lt; ] \\\\\\" : status, square ? 14 : 12.5, .92, "middle")}
${!square ? text(w * .955, h * .045, "// -- 2026 -- //", 12, .92, "end") : ""}
${text(w * .026, h * .968, "//////////", square ? 15 : 13)}
${text(w / 2, h * .968, square ? `// TIME ${timecode} //` : `// TIME ........ ${timecode} // IN ........ ${data} MB/S //`, square ? 13 : 12, .86, "middle")}
${text(w * .975, h * .968, "/// -- 00213", 12, .86, "end")}
${square ? text(w / 2, h * .86, "// -- 2026 -- //", 14, .55, "middle") : ""}
<rect width="${w}" height="${h}" fill="url(#scan)"/>
</svg>`
}
