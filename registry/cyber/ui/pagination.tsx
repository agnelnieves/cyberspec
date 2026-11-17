import * as React from "react"
import {
  Pagination as SdkPagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@ui-sdk/react/pagination"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "@/registry/cyber/ui/cyber/pagination.css"

const two = (n: number) => String(n).padStart(2, "0")

// "PAGE 03 / 12". The padded figures are for the eye; assistive technology
// gets "Page 3 of 12", politely, each time it changes, since a link that
// becomes current isn't announced on its own. The figure slips for a moment
// as it steps, but not as the page loads.
function Readout({ page, pageCount }: { page: number; pageCount: number }) {
  const first = React.useRef(page)
  const [stepped, setStepped] = React.useState(false)
  React.useEffect(() => {
    if (page !== first.current) setStepped(true)
  }, [page])
  return (
    <p data-kit="pagination-readout" role="status">
      <span data-sr-only>
        Page {page} of {pageCount}
      </span>
      <span aria-hidden>
        PAGE{" "}
        <b key={page} data-kit="pagination-page" data-stepped={stepped ? "" : undefined}>
          {two(page)}
        </b>{" "}
        / {two(pageCount)}
      </span>
    </p>
  )
}

// The pages of a long list as one strip of keys: previous, the pages with
// gaps where they're skipped, next. The current page is lit and underlined
// in the signal color, and a readout beside the strip says where you are.
//
// - `label` names the navigation: "Contract pages", not "Pagination".
// - Pass `pageCount`, or `total` and `pageSize`. `siblings` and `boundaries`
//   set how many pages show around the current one and at each end.
// - With `getHref` the keys are links; without it, buttons.
//
// The rest goes to ui-sdk's Pagination: `page`, `defaultPage`,
// `onPageChange`, `controller`.
function Pagination({
  label,
  readout = true,
  ...props
}: Omit<React.ComponentProps<typeof SdkPagination>, "children" | "aria-label"> & {
  label: string
  /** Whether to print "PAGE 03 / 12" beside the strip. */
  readout?: boolean
}) {
  return (
    <SdkPagination data-kit="pagination" aria-label={label} {...props}>
      {({ page, pageCount, items }) => (
        <>
          <PaginationList data-kit="pagination-list">
            <PaginationItem data-kit="pagination-item">
              <PaginationPrevious data-kit="pagination-step" data-frame="bl" data-press-flash="" data-sfx="tick" aria-label="Previous page">
                <ChevronLeft data-kit="pagination-chevron" aria-hidden />
              </PaginationPrevious>
            </PaginationItem>
            {/* Keyed by the entry itself, so a page keeps its element, and
                its focus, as the range moves around it. */}
            {items.map((item) =>
              typeof item === "number" ? (
                <PaginationItem key={item} data-kit="pagination-item">
                  <PaginationLink data-kit="pagination-link" data-frame="mid" data-press-flash="" data-sfx="select" page={item} />
                </PaginationItem>
              ) : (
                <PaginationItem key={item} data-kit="pagination-item" data-gap="">
                  <PaginationEllipsis data-kit="pagination-gap" />
                </PaginationItem>
              ),
            )}
            <PaginationItem data-kit="pagination-item">
              <PaginationNext data-kit="pagination-step" data-frame="br" data-press-flash="" data-sfx="tick" aria-label="Next page">
                <ChevronRight data-kit="pagination-chevron" aria-hidden />
              </PaginationNext>
            </PaginationItem>
          </PaginationList>
          {readout && <Readout page={page} pageCount={pageCount} />}
        </>
      )}
    </SdkPagination>
  )
}

export { Pagination }
