import { Barcode, Corners, DataStream, Micro, Ruler } from "@/registry/cyber/ui/micro"

// The margin of a viewer plate, with nothing in the viewer: crosses on its
// corners, a serial line at its head, a stream of memory down one side, a
// code strip down the other and a rule along its foot.
export default function MicroDemo() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 300, padding: "6px 6px 10px" }}>
      <Corners variant="cross" size={9} />
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "8px 10px", alignItems: "stretch" }}>
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
          <Micro>CS-64 // Plate 07</Micro>
          <Micro>Rev 0.1</Micro>
        </div>

        <DataStream rows={8} seed="NODE 3F:A2" />

        <div style={{ position: "relative", minHeight: 104, display: "grid", placeItems: "center" }}>
          <Corners size={7} inset={4} />
          <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden focusable="false" style={{ color: "var(--cy-line-ctl)" }}>
            <path d="M24 3 45 24 24 45 3 24Z M24 13 35 24 24 35 13 24Z" fill="none" stroke="currentColor" />
            <path d="M24 20 28 24 24 28 20 24Z" fill="currentColor" />
            <path d="M24 0v7M24 41v7M0 24h7M41 24h7" stroke="currentColor" />
          </svg>
          <Micro style={{ position: "absolute", insetBlockEnd: 6, insetInlineStart: 10 }}>Protocol 7741-C</Micro>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "stretch" }}>
          <Micro vertical>Onyx // Lot 22</Micro>
          <Barcode value="CS-64 LOT 22" vertical size={14} />
        </div>

        <div style={{ gridColumn: "1 / -1", display: "grid", gap: 5 }}>
          <Ruler />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 8 }}>
            <Barcode value="NODE 3F:A2" size={12} />
            <Micro>Link stable</Micro>
          </div>
        </div>
      </div>
    </div>
  )
}
