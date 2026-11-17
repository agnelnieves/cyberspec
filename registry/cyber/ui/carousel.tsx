import * as React from "react"
import {
  Carousel as SdkCarousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselViewport,
} from "@ui-sdk/react/carousel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "@/registry/cyber/ui/cyber/button.css"
import "@/registry/cyber/ui/cyber/carousel.css"

type CarouselSlide = {
  id: string
  // What the slide is called: printed under the still, and the name of its
  // indicator.
  title: string
  // The still: an <svg>, an <img>. It fills a 16:9 frame.
  media: React.ReactNode
  caption?: React.ReactNode
}

const two = (n: number) => String(n).padStart(2, "0")

// "02 / 05", for the eye only: each slide is already labelled by its
// position ("2 of 5") and the SDK announces the one that comes into view.
// The figure slips for a moment as it steps, but not as the page loads.
function Readout({ page, pageCount }: { page: number; pageCount: number }) {
  const first = React.useRef(page)
  const [stepped, setStepped] = React.useState(false)
  React.useEffect(() => {
    if (page !== first.current) setStepped(true)
  }, [page])
  return (
    <p data-kit="carousel-readout" aria-hidden>
      <b key={page} data-kit="carousel-page" data-stepped={stepped ? "" : undefined}>
        {two(page)}
      </b>{" "}
      / {two(pageCount)}
    </p>
  )
}

// A viewer: stills in a cut frame, one at a time, each with a caption
// under it. Swipe or drag the frame, press the keys, or focus the frame
// and use the arrow keys, Home and End. A row of segments shows where you
// are (the current one is lit and wider) beside a readout of the same,
// and each segment goes straight to its slide.
//
// - `label` names the viewer ("Recon stills").
// - `slides`: `{ id, title, media, caption? }`.
// - `code`: a line of micro-print over the frame. Decoration only.
//
// The rest goes to ui-sdk's Carousel: `page`, `defaultPage`,
// `onPageChange`, `loop`, `controller`.
function Carousel({
  label,
  slides,
  code,
  ...props
}: Omit<React.ComponentProps<typeof SdkCarousel>, "children" | "aria-label"> & {
  label: string
  slides: CarouselSlide[]
  code?: string
}) {
  return (
    <SdkCarousel data-kit="carousel" aria-label={label} {...props}>
      {({ page, pageCount }) => (
        <>
          {code && (
            <span data-kit="carousel-code" data-micro aria-hidden>
              {code}
            </span>
          )}
          {/* The frame is around the viewport, not on it: a frame's cuts and
              edges would scroll away with the slides. It lights when the
              viewport inside it takes focus. */}
          <div data-kit="carousel-frame" data-frame="tr bl" data-frame-focus="within">
            <CarouselViewport data-kit="carousel-viewport">
              <CarouselContent data-kit="carousel-content">
                {slides.map((slide) => (
                  <CarouselItem key={slide.id} data-kit="carousel-slide">
                    <figure data-kit="carousel-figure">
                      <div data-kit="carousel-media" data-scanlines="">
                        {slide.media}
                      </div>
                      <figcaption data-kit="carousel-caption">
                        <span data-kit="carousel-title">{slide.title}</span>
                        {slide.caption != null && <span data-kit="carousel-text">{slide.caption}</span>}
                      </figcaption>
                    </figure>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </CarouselViewport>
          </div>
          <div data-kit="carousel-bar">
            <CarouselIndicatorGroup data-kit="carousel-indicators" aria-label="Choose a slide">
              {slides.map((slide, index) => (
                <CarouselIndicator key={slide.id} data-kit="carousel-indicator" data-sfx="select" page={index + 1} aria-label={slide.title} />
              ))}
            </CarouselIndicatorGroup>
            <Readout page={page} pageCount={pageCount ?? slides.length} />
            <div data-kit="carousel-steps">
              <CarouselPrevious
                data-kit="button"
                data-frame="notch br"
                data-press-flash=""
                data-tone="secondary"
                data-icon=""
                data-sfx="tick"
                aria-label="Previous slide"
              >
                <ChevronLeft data-kit="carousel-chevron" aria-hidden />
              </CarouselPrevious>
              <CarouselNext
                data-kit="button"
                data-frame="notch br"
                data-press-flash=""
                data-tone="secondary"
                data-icon=""
                data-sfx="tick"
                aria-label="Next slide"
              >
                <ChevronRight data-kit="carousel-chevron" aria-hidden />
              </CarouselNext>
            </div>
          </div>
        </>
      )}
    </SdkCarousel>
  )
}

export { Carousel }
export type { CarouselSlide }
