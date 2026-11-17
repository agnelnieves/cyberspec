import { Tree } from "@/registry/cyber/ui/tree"

export default function TreeDemo() {
  return (
    <>
      <Tree
        label="Deck storage"
        defaultExpanded={["daemons", "routes"]}
        defaultValue="daemons/ghostwrite.dmn"
        items={[
          {
            value: "daemons",
            label: "daemons",
            meta: "3",
            children: [
              { value: "daemons/ghostwrite.dmn", label: "ghostwrite.dmn", meta: "4.2K" },
              { value: "daemons/deadlock.dmn", label: "deadlock.dmn", meta: "8.0K" },
              { value: "daemons/null-ping.dmn", label: "null-ping.dmn", meta: "1.1K" },
            ],
          },
          {
            value: "routes",
            label: "routes",
            meta: "2",
            children: [
              { value: "routes/lowtide-run.rte", label: "lowtide-run.rte", meta: "12K" },
              {
                value: "routes/archive",
                label: "archive",
                meta: "1",
                children: [{ value: "routes/archive/cinder-row.rte", label: "cinder-row.rte", meta: "9.4K" }],
              },
            ],
          },
          {
            value: "vault",
            label: "vault",
            meta: "Locked",
            disabled: true,
            children: [{ value: "vault/ledger.key", label: "ledger.key" }],
          },
          { value: "boot.cfg", label: "boot.cfg", meta: "0.3K" },
        ]}
      />
    </>
  )
}
