import * as React from "react"
import { Listbox, ListboxGroup, ListboxGroupLabel, ListboxItem, ListboxItemIndicator } from "@ui-sdk/react/listbox"
import { BriefcaseBusiness, ChevronDown, ChevronRight, Cpu, Crosshair, LogOut, MapPin, Package, PhoneCall, Radar, RotateCcw, ScanSearch, Shield, Truck, Wrench } from "lucide-react"
import { Place, Portrait, Vehicle } from "@/registry/cyber/blocks/jobs/art"
import { board, contacts, creditsOf, distanceOf, offer, type Difficulty, type Group, type Job, type Kind } from "@/registry/cyber/blocks/jobs/data"
import { AlertDialog } from "@/registry/cyber/ui/alert-dialog"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { Card } from "@/registry/cyber/ui/card"
import { Checkbox, CheckboxGroup } from "@/registry/cyber/ui/checkbox"
import { GlitchText } from "@/registry/cyber/ui/glitch-text"
import { HoverCard } from "@/registry/cyber/ui/hover-card"
import { Barcode, Micro, Ruler } from "@/registry/cyber/ui/micro"
import { Panel } from "@/registry/cyber/ui/panel"
import { Progress } from "@/registry/cyber/ui/progress"
import { Readout } from "@/registry/cyber/ui/readout"
import { Screen } from "@/registry/cyber/ui/screen"
import { Tabs } from "@/registry/cyber/ui/tabs"
import { notify } from "@/registry/cyber/ui/toaster"
import { Toggle } from "@/registry/cyber/ui/toggle"
import "@/registry/cyber/blocks/jobs/jobs.css"

// The job board: what's open on the left, the chosen job in the middle, the
// people and places it touches on the right. One job is tracked, and that's
// the only thing on the screen in yellow besides whatever is new.
//
// The list is a ui-sdk Listbox with its own rows, since a job row carries
// more than the kit's ItemList prints (a type, a difficulty, a distance).
// Choosing follows the arrow keys, so the sheet beside it changes as the
// list is walked. Whatever removes the chosen job (turning it in, abandoning
// it) sends focus to the sheet's heading, which is always there.

const groups: { value: Group; label: string }[] = [
  { value: "nearby", label: "Nearby" },
  { value: "side", label: "Side work" },
]

const glyphs: Record<Kind, React.ReactNode> = {
  Intrusion: <Cpu />,
  Courier: <Package />,
  Recovery: <ScanSearch />,
  Extraction: <LogOut />,
  Escort: <Shield />,
  "Bench work": <Wrench />,
  Survey: <Radar />,
}

const ranks: Record<Difficulty, number> = { Low: 1, Moderate: 2, Dangerous: 3 }

// A difficulty is its word, with one to three pips lit before it.
function Level({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span data-jobs-level={difficulty.toLowerCase()}>
      <span data-jobs-pips="" aria-hidden>
        {[1, 2, 3].map((pip) => (
          <span key={pip} data-on={pip <= ranks[difficulty] ? "" : undefined} />
        ))}
      </span>
      {difficulty}
    </span>
  )
}

function JobList({
  label,
  jobs,
  selected,
  tracked,
  fresh,
  onSelect,
}: {
  label: string
  jobs: Job[]
  selected: string | null
  tracked: string | null
  fresh: string[]
  onSelect: (id: string, pressed: boolean) => void
}) {
  if (!jobs.length) return <p data-kit="hint">Nothing open under this filter.</p>
  return (
    <Listbox
      aria-label={label}
      data-jobs-list=""
      // An explicit press also opens the brief for the already selected row.
      deselectable
      value={jobs.some((job) => job.id === selected) ? selected : null}
      onValueChange={(value, details) => {
        const id = value ?? selected
        if (id) onSelect(id, details.reason === "item-press")
      }}
    >
      {groups.map((group) => {
        const rows = jobs.filter((job) => job.group === group.value)
        if (!rows.length) return null
        return (
          <ListboxGroup key={group.value} data-jobs-group="">
            <ListboxGroupLabel data-jobs-group-label="">
              <span data-kit="label">{group.label}</span>
              <span data-kit="value" aria-hidden>
                {String(rows.length).padStart(2, "0")}
              </span>
            </ListboxGroupLabel>
            {rows.map((job) => (
              <ListboxItem
                key={job.id}
                value={job.id}
                label={job.name}
                data-jobs-row=""
                data-frame="br"
                data-tracked={tracked === job.id ? "" : undefined}
              >
                <span data-jobs-glyph="" aria-hidden>
                  {glyphs[job.kind]}
                </span>
                <span data-jobs-name="">{job.name}</span>
                <span data-jobs-tags="">
                  {fresh.includes(job.id) && <Badge tone="flag">New</Badge>}
                  {tracked === job.id && (
                    <Badge tone="flag">
                      <Crosshair aria-hidden />
                      Tracked
                    </Badge>
                  )}
                  <ListboxItemIndicator data-jobs-pointer="" aria-hidden>
                    <ChevronRight />
                  </ListboxItemIndicator>
                </span>
                <Level difficulty={job.difficulty} />
                <span data-jobs-distance="" data-kit="value">
                  {distanceOf(job.distance)}
                </span>
              </ListboxItem>
            ))}
          </ListboxGroup>
        )
      })}
    </Listbox>
  )
}

const startDone = () => Object.fromEntries([...board, offer].map((job) => [job.id, job.done]))

export default function Jobs() {
  const [jobs, setJobs] = React.useState(board)
  const [filter, setFilter] = React.useState<"all" | "priority">("all")
  const [selected, setSelected] = React.useState<string | null>("glass-jaw")
  const [tracked, setTracked] = React.useState<string | null>("glass-jaw")
  const [waypoint, setWaypoint] = React.useState<string | null>(null)
  const [fresh, setFresh] = React.useState(["cold-chain", "paper-lantern"])
  const [done, setDone] = React.useState<Record<string, string[]>>(startDone)
  const [credits, setCredits] = React.useState(15240)
  const [cleared, setCleared] = React.useState(12)
  const [offered, setOffered] = React.useState(true)
  const [boardOpen, setBoardOpen] = React.useState(false)
  const boardId = React.useId()
  const browse = React.useRef<HTMLButtonElement>(null)
  // The job the open question is about. It's held apart from the selection
  // so the dialog keeps its wording while it closes over the next job.
  const [abandoning, setAbandoning] = React.useState<Job | null>(null)

  // Focus goes to the sheet's heading whenever the thing that had it is
  // about to leave the page or go dead: bump the tick with the change.
  const heading = React.useRef<HTMLHeadingElement>(null)
  const [focusTick, setFocusTick] = React.useState(0)
  const afterDialog = React.useRef(false)
  React.useEffect(() => {
    if (focusTick) heading.current?.focus()
  }, [focusTick])

  const job = jobs.find((entry) => entry.id === selected) ?? null
  const trackedJob = jobs.find((entry) => entry.id === tracked) ?? null
  const waypointJob = jobs.find((entry) => entry.id === waypoint) ?? null

  const select = (id: string, pressed: boolean) => {
    setSelected(id)
    setFresh((ids) => ids.filter((entry) => entry !== id))
    if (pressed && browse.current?.getClientRects().length) {
      setBoardOpen(false)
      setFocusTick((tick) => tick + 1)
    }
  }

  // Takes a job off the board and chooses the one that moves into its place.
  const remove = (id: string) => {
    const rest = jobs.filter((entry) => entry.id !== id)
    const visible = filter === "priority" ? jobs.filter((entry) => entry.priority) : jobs
    const remaining = visible.filter((entry) => entry.id !== id)
    const index = visible.findIndex((entry) => entry.id === id)
    const next = remaining[Math.min(index, remaining.length - 1)] ?? rest[0]
    if (!remaining.length) setFilter("all")
    setJobs(rest)
    setSelected(next?.id ?? null)
    if (next) setFresh((ids) => ids.filter((entry) => entry !== next.id))
    if (tracked === id) setTracked(null)
    if (waypoint === id) setWaypoint(null)
  }

  const restore = () => {
    setJobs(board)
    setFilter("all")
    setSelected("glass-jaw")
    setTracked("glass-jaw")
    setWaypoint(null)
    setFresh(["cold-chain", "paper-lantern"])
    setDone(startDone())
    setOffered(true)
    setFocusTick((tick) => tick + 1)
    notify("Board restored", { description: "Seven jobs open, one offer waiting." })
  }

  const list = (label: string, rows: Job[]) => (
    <JobList label={label} jobs={rows} selected={selected} tracked={tracked} fresh={fresh} onSelect={select} />
  )
  const priority = jobs.filter((entry) => entry.priority)
  const isNew = (rows: Job[]) => (rows.some((entry) => fresh.includes(entry.id)) ? "New" : undefined)

  const ticked = job ? (done[job.id] ?? []) : []
  const complete = job != null && ticked.length === job.objectives.length
  const contact = job ? contacts[job.contact] : null
  const sender = contacts[offer.contact]

  return (
    <Screen
      label="Job board"
      data-jobs-screen=""
      status={
        <>
          <Readout label="Open jobs" value={jobs.length} size="sm" tone="accent" />
          <Readout label="Jobs cleared" value={cleared} size="sm" />
          <Readout label="Credits" value={credits} prefix="¤" size="sm" />
        </>
      }
      aside={
        <dl data-jobs-now="">
          <div>
            <dt data-kit="label">Tracking</dt>
            <dd>{trackedJob ? <Badge tone="flag">{trackedJob.name}</Badge> : <Badge tone="mute">Nothing</Badge>}</dd>
          </div>
          <div>
            <dt data-kit="label">Waypoint</dt>
            <dd data-kit="value">{waypointJob ? waypointJob.place.name : "Not set"}</dd>
          </div>
        </dl>
      }
      hints={[
        { keys: ["↑", "↓"], label: "Browse jobs" },
        { keys: ["←", "→"], label: "Switch filter" },
        { keys: "Space", label: "Tick objective" },
      ]}
      code="CS-J7 // BOARD SYNCED // LOWTIDE EXCHANGE // PROTOCOL 7741-C"
    >
      <div data-kit="jobs">
        <Button
          ref={browse}
          data-jobs-browse=""
          aria-expanded={boardOpen}
          aria-controls={boardId}
          onClick={() => setBoardOpen((open) => !open)}
        >
          <BriefcaseBusiness aria-hidden />
          Browse jobs
          {offered && <Badge tone="flag">1 offer</Badge>}
          <ChevronDown aria-hidden />
        </Button>
        <div id={boardId} data-jobs-board="" data-open={boardOpen ? "" : undefined}>
          <h2 data-sr-only>Open jobs</h2>
          <Tabs
            label="Job filter"
            variant="key"
            value={filter}
            onValueChange={(value) => {
              setFilter(value === "priority" ? "priority" : "all")
              if (value === "priority" && !job?.priority && priority[0]) select(priority[0].id, false)
            }}
            tabs={[
              { value: "all", label: "All jobs", content: list("All jobs", jobs) },
              { value: "priority", label: "Priority", flag: isNew(priority), disabled: !priority.length, content: list("Priority jobs", priority) },
            ]}
          />

          {offered && (
            <Panel
              variant="titled"
              tone="flag"
              title={`Job offer: ${offer.name}`}
              code={`${offer.code} // INBOUND // ANSWER BEFORE 04:00`}
              actions={sender.name}
              data-jobs-offer=""
              footer={
                <>
                  <span>Pays {creditsOf(offer.pay)}</span>
                  <span data-kit="actions">
                    <Button
                      size="sm"
                      data-agent-confirm={`Declines the job offer "${offer.name}" from ${sender.name}. It won't be offered again.`}
                      onClick={() => {
                        setOffered(false)
                        setBoardOpen(false)
                        setFocusTick((tick) => tick + 1)
                        notify("Offer declined", { description: `${sender.name} will find someone else.` })
                      }}
                    >
                      Decline offer
                    </Button>
                    <Button
                      size="sm"
                      tone="flag"
                      onClick={() => {
                        setOffered(false)
                        setBoardOpen(false)
                        setJobs((rows) => [...rows, offer])
                        setFilter("all")
                        setSelected(offer.id)
                        setFocusTick((tick) => tick + 1)
                        notify("Job accepted", { tone: "success", description: `${offer.name} is on the board under Side work.` })
                      }}
                    >
                      Accept offer
                    </Button>
                  </span>
                </>
              }
            >
              <dl data-jobs-terms="">
                <div>
                  <dt>Type</dt>
                  <dd>
                    {offer.kind}, <Level difficulty={offer.difficulty} />
                  </dd>
                </div>
                <div>
                  <dt>Objective</dt>
                  <dd>Carry a credit chit across Glasswater without a scan.</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>
                    {offer.place.name}, {distanceOf(offer.distance)}
                  </dd>
                </div>
              </dl>
            </Panel>
          )}
        </div>

        <article data-jobs-sheet="" aria-labelledby="jobs-sheet-title">
          {job && contact ? (
            <>
              <header data-jobs-head="">
                <div data-jobs-serial="">
                  <Micro>
                    {job.code} // {job.kind} // {job.district}
                  </Micro>
                  <Barcode value={job.code} size={8} />
                </div>
                <div data-jobs-title="">
                  <h2 id="jobs-sheet-title" ref={heading} tabIndex={-1}>
                    <GlitchText>{job.name}</GlitchText>
                  </h2>
                  <Level difficulty={job.difficulty} />
                </div>
                <p data-jobs-summary="">{job.brief[0]}</p>
                <div data-jobs-meta="">
                  <p data-kit="hint">
                    {job.kind} in {job.district}, <span data-kit="value">{distanceOf(job.distance)}</span> out. Posted by{" "}
                    <HoverCard
                      name={contact.name}
                      role={contact.role}
                      href="#jobs-contact"
                      facts={[
                        { label: "District", value: contact.district },
                        { label: contact.fact[0], value: contact.fact[1] },
                      ]}
                    />
                    .
                  </p>
                  <span data-jobs-marks="">
                    {job.priority && <Badge>Priority</Badge>}
                    {tracked === job.id && <Badge tone="flag">Tracked</Badge>}
                  </span>
                </div>
              </header>

              {/* Keyed by the job, so the sheet tears in when another is chosen. */}
              <div key={job.id} data-jobs-body="">
                <div data-jobs-objectives="">
                  <CheckboxGroup
                    label="Objectives"
                    value={ticked}
                    onValueChange={(value) => {
                      setDone((all) => ({ ...all, [job.id]: value }))
                      if (value.length === job.objectives.length && !complete) {
                        notify("Objectives complete", { tone: "success", description: `${job.name} is ready to turn in.` })
                      }
                    }}
                  >
                    {job.objectives.map((objective) => (
                      <Checkbox key={objective.id} value={objective.id} label={objective.label} />
                    ))}
                  </CheckboxGroup>
                  <div data-jobs-progress="">
                    <Progress
                      label="Job progress"
                      value={(ticked.length / job.objectives.length) * 100}
                      segments={job.objectives.length * 4}
                    />
                    <Readout label="Pays" value={job.pay} prefix="¤" size="sm" />
                  </div>
                </div>

                <section data-jobs-brief="" aria-labelledby="jobs-brief-title">
                  <div data-jobs-rule="">
                    <h3 id="jobs-brief-title" data-kit="label">
                      Brief
                    </h3>
                    <Micro>Net protocol 7741-C // From {contact.name}</Micro>
                  </div>
                  {job.brief.slice(1).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              </div>

              <footer data-jobs-actions="">
                <p data-kit="hint" role="status">
                  {complete
                    ? "Every objective is done. Turn the job in to be paid."
                    : `${ticked.length} of ${job.objectives.length} objectives done. Tick them all to turn the job in.`}
                </p>
                <div data-kit="actions">
                  <Toggle
                    icon={<Crosshair aria-hidden />}
                    pressed={tracked === job.id}
                    onPressedChange={(on) => {
                      setTracked(on ? job.id : null)
                      notify(on ? `Tracking ${job.name}` : "Tracking off", {
                        description: on ? "The route and its objectives are on your overlay." : `${job.name} is off your overlay.`,
                      })
                    }}
                  >
                    Track job
                  </Toggle>
                  <AlertDialog
                    trigger="Abandon job"
                    title={`Abandon ${(abandoning ?? job).name}?`}
                    description={`${contacts[(abandoning ?? job).contact].name} gives the work to someone else, and the objectives you've ticked are lost. An abandoned job doesn't come back to the board.`}
                    confirm="Abandon"
                    cancel="Keep job"
                    agentConfirm={`Abandons the job "${(abandoning ?? job).name}": removes it from the board and discards its objective progress. This can't be undone.`}
                    code={`${(abandoning ?? job).code} // ANSWER REQUIRED`}
                    onOpenChange={(open) => {
                      if (open) setAbandoning(job)
                    }}
                    onOpenChangeComplete={(open) => {
                      if (open) return
                      setAbandoning(null)
                      if (!afterDialog.current) return
                      afterDialog.current = false
                      setFocusTick((tick) => tick + 1)
                    }}
                    onConfirm={() => {
                      const gone = abandoning ?? job
                      // The dialog hands focus back to its key once it has
                      // closed, so the move to the heading waits for that.
                      // Abandoning the last job takes the dialog off the
                      // page with the sheet, and nothing is left to wait for.
                      if (jobs.length > 1) afterDialog.current = true
                      else setFocusTick((tick) => tick + 1)
                      remove(gone.id)
                      notify("Job abandoned", { tone: "warning", description: `${gone.name} is off the board.` })
                    }}
                  />
                  <Button
                    tone="primary"
                    disabled={!complete}
                    onClick={() => {
                      setCredits((sum) => sum + job.pay)
                      setCleared((count) => count + 1)
                      remove(job.id)
                      setFocusTick((tick) => tick + 1)
                      notify("Job turned in", { tone: "success", description: `${creditsOf(job.pay)} paid by ${contact.name}.` })
                    }}
                  >
                    Turn in job
                  </Button>
                </div>
              </footer>
              <Ruler />
            </>
          ) : (
            <div data-jobs-clear="">
              <Micro>CS-J7 // No open contracts</Micro>
              <h2 id="jobs-sheet-title" ref={heading} tabIndex={-1}>
                Board clear
              </h2>
              <p data-kit="hint">Nothing is open. Fixers post again after dark, or you can put this board back the way it was.</p>
              <Button onClick={restore}>
                <RotateCcw aria-hidden />
                Restore board
              </Button>
            </div>
          )}
        </article>

        {job && contact && (
          <aside data-jobs-records="" aria-labelledby="jobs-records-title">
            <div data-jobs-rule="">
              <h3 id="jobs-records-title" data-kit="label">
                Linked records
              </h3>
              <span data-kit="value" aria-hidden>
                03
              </span>
            </div>
            <div key={job.id} data-jobs-cards="">
              <Card
                id="jobs-contact"
                level={4}
                title={contact.name}
                meta={`${contact.role} // ${contact.district}`}
                media={<Portrait look={contact.look} seed={contact.name} />}
                footer={
                  <>
                    <span>Contact</span>
                    <Button
                      size="sm"
                      onClick={() => notify(`Calling ${contact.name}`, { description: "Line open. Keep it short." })}
                    >
                      <PhoneCall aria-hidden />
                      Call contact
                    </Button>
                  </>
                }
              >
                {contact.fact[0]}: {contact.fact[1]}
              </Card>
              <Card
                level={4}
                title={job.place.name}
                meta={job.place.meta}
                media={<Place seed={job.place.name} />}
                footer={
                  <>
                    <span>Place</span>
                    <Toggle
                      size="sm"
                      icon={<MapPin aria-hidden />}
                      pressed={waypoint === job.id}
                      onPressedChange={(on) => {
                        setWaypoint(on ? job.id : null)
                        notify(on ? "Waypoint set" : "Waypoint cleared", { description: job.place.name })
                      }}
                    >
                      Waypoint
                    </Toggle>
                  </>
                }
              >
                {job.place.note}
              </Card>
              <Card
                level={4}
                title={job.vehicle.name}
                meta={job.vehicle.meta}
                media={<Vehicle shape={job.vehicle.shape} />}
                footer={
                  <>
                    <span>Vehicle</span>
                    <Button
                      size="sm"
                      onClick={() => notify(`${job.vehicle.name} requested`, { description: "Two minutes out, if the tideway is clear." })}
                    >
                      <Truck aria-hidden />
                      Request vehicle
                    </Button>
                  </>
                }
              >
                {job.vehicle.note}
              </Card>
            </div>
          </aside>
        )}
      </div>
    </Screen>
  )
}
