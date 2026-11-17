import { Pagination } from "@/registry/cyber/ui/pagination"

export default function PaginationDemo() {
  return (
    <>
      <Pagination label="Archive pages" pageCount={12} defaultPage={3} />
    </>
  )
}
