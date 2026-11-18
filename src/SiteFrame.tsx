import { useLayoutEffect, useRef, type ReactNode } from "react"
import "./site-frame.css"

function FrameOutline() {
  const frame = useRef<SVGSVGElement>(null)
  const mask = useRef<SVGPathElement>(null)
  const outline = useRef<SVGPathElement>(null)

  useLayoutEffect(() => {
    const svg = frame.current!
    // Without a viewBox, one SVG unit is one CSS pixel. Only the straight
    // runs change length as the opening around the page resizes.
    function draw({ width, height }: DOMRectReadOnly) {
      const style = getComputedStyle(svg)
      const cut = parseFloat(style.getPropertyValue("--site-bottom-cut"))
      const depth = parseFloat(style.getPropertyValue("--site-notch-depth"))
      const half = parseFloat(style.getPropertyValue("--site-notch-half"))
      const left = width / 2 - half
      const right = width / 2 + half
      const shoulder = 20
      const contour = [
        `M1 ${1 + cut}l${cut} ${-cut}`,
        `H${left - shoulder}l${shoulder} ${depth}H${right}l${shoulder} ${-depth}`,
        `H${width - 1}V${height - 1 - cut}l${-cut} ${cut}`,
        `H${1 + cut}l${-cut} ${-cut}Z`,
      ].join("")
      mask.current!.setAttribute("d", `M0 0H${width}V${height}H0Z${contour}`)
      outline.current!.setAttribute("d", contour)
    }
    draw(svg.getBoundingClientRect())
    const observer = new ResizeObserver(([entry]) => draw(entry.contentRect))
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  return (
    <svg ref={frame} className="site-outline" aria-hidden="true" focusable="false">
      <path ref={mask} fill="var(--cy-void)" fillRule="evenodd" />
      <path ref={outline} fill="none" stroke="var(--site-keyline)" strokeWidth="1.25" />
    </svg>
  )
}

function SiteFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="site-sheet">
        <div className="site-housing">
          {header}
          <div className="site-bezel" aria-hidden="true">
            <FrameOutline />
          </div>
        </div>
        <div data-site-scroll="">{children}</div>
      </div>
      <div className="site-frame-edge top" aria-hidden="true" />
      <div className="site-frame-edge bottom" aria-hidden="true" />
    </>
  )
}

export { SiteFrame }
