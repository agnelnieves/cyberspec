import { Crosshair, FileText, Trash2 } from "lucide-react"
import { Badge, type BadgeTone } from "@/registry/cyber/ui/badge"
import { DataTable, type DataTableColumn } from "@/registry/cyber/ui/data-table"
import type { MenuEntry } from "@/registry/cyber/ui/menu"

type Status = "open" | "tracked" | "claimed"

type Contract = {
  id: string
  name: string
  district: string
  status: Status
  payout: number
}

const contracts: Contract[] = [
  {
    id: "relay-sweep",
    name: "Relay sweep",
    district: "Glasswater",
    status: "open",
    payout: 4200,
  },
  {
    id: "cold-run",
    name: "Cold storage run",
    district: "Lowtide",
    status: "tracked",
    payout: 2850,
  },
  {
    id: "optics-recovery",
    name: "Optics recovery",
    district: "Meridian Heights",
    status: "open",
    payout: 12600,
  },
  {
    id: "ledger-audit",
    name: "Ledger audit",
    district: "The Stacks",
    status: "claimed",
    payout: 6400,
  },
  {
    id: "night-escort",
    name: "Night escort",
    district: "Cinder Row",
    status: "open",
    payout: 1950,
  },
  {
    id: "jacket-return",
    name: "Mesh jacket return",
    district: "Lowtide",
    status: "claimed",
    payout: 800,
  },
]

const statuses: Record<Status, { label: string; tone: BadgeTone }> = {
  open: { label: "Open", tone: "ok" },
  tracked: { label: "Tracked", tone: "flag" },
  claimed: { label: "Claimed", tone: "signal" },
}

// Credits, grouped in threes by a space: ¤ 4 200.
const credits = (amount: number) => `¤ ${String(amount).replace(/\B(?=(\d{3})+$)/g, " ")}`

const columns: DataTableColumn<Contract>[] = [
  {
    id: "name",
    header: "Contract",
    rowHeader: true,
    cell: (contract) => contract.name,
    sort: (contract) => contract.name,
  },
  {
    id: "district",
    header: "District",
    cell: (contract) => contract.district,
    sort: (contract) => contract.district,
  },
  {
    id: "status",
    header: "Status",
    cell: (contract) => (
      <Badge tone={statuses[contract.status].tone} status={contract.status === "open"}>
        {statuses[contract.status].label}
      </Badge>
    ),
    sort: (contract) => statuses[contract.status].label,
  },
  {
    id: "payout",
    header: "Payout",
    numeric: true,
    cell: (contract) => credits(contract.payout),
    sort: (contract) => contract.payout,
  },
]

const actions = (contract: Contract): MenuEntry[] => [
  { value: "track", label: "Track", icon: <Crosshair aria-hidden /> },
  { value: "brief", label: "Open brief", icon: <FileText aria-hidden /> },
  { type: "separator" },
  {
    value: "drop",
    label: "Drop contract",
    icon: <Trash2 aria-hidden />,
    destructive: true,
    confirm: `Drops ${contract.name} and returns it to the board`,
  },
]

export default function DataTableDemo() {
  return (
    <>
      <DataTable
        caption="Contracts"
        code="BOARD 3F:A2 // REV 0.1"
        columns={columns}
        rows={contracts}
        rowLabel={(contract) => contract.name}
        defaultSelected={["optics-recovery", "ledger-audit"]}
        defaultSort={{ column: "payout", direction: "descending" }}
        actions={actions}
      />
    </>
  )
}
