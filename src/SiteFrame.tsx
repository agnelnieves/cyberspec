import type { ReactNode } from "react"
import "./site-frame.css"

function FrameOutline({ narrow = false }: { narrow?: boolean }) {
  const contour = narrow
    ? "M1 22 22 1H151L162 23H198L209 1H359V720L338 741H22L1 720Z"
    : "M1 44 44 1H490L511 27H689L710 1H1199V678L1158 719H43L1 677Z"
  const bounds = narrow ? "M0 0H360V742H0Z" : "M0 0H1200V720H0Z"
  return (
    <svg className={narrow ? "site-outline narrow" : "site-outline wide"}
      viewBox={narrow ? "0 0 360 742" : "0 0 1200 720"} preserveAspectRatio="none"
      aria-hidden="true" focusable="false">
      <path d={bounds + contour} fill="var(--cy-void)" fillRule="evenodd" />
      <path d={contour} fill="none" stroke="var(--site-keyline)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function SiteFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="site-sheet">
      <div className="site-housing">
        {header}
        <div className="site-bezel" aria-hidden="true">
          <FrameOutline />
          <FrameOutline narrow />
        </div>
      </div>
      <div data-site-scroll="">{children}</div>
    </div>
  )
}

export { SiteFrame }
