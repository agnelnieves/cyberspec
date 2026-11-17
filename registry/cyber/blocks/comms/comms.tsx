import * as React from "react"
import { Phone, PhoneOff, RotateCcw, Send } from "lucide-react"
import { contacts, creditsOf, earlierCalls, type Line, type Offer, type Presence } from "@/registry/cyber/blocks/comms/data"
import { Portrait } from "@/registry/cyber/blocks/comms/portrait"
import { Avatar, AvatarStack } from "@/registry/cyber/ui/avatar"
import { Badge } from "@/registry/cyber/ui/badge"
import { Button } from "@/registry/cyber/ui/button"
import { ChoiceList } from "@/registry/cyber/ui/choice-list"
import { Feed, type FeedItem } from "@/registry/cyber/ui/feed"
import { GlitchText } from "@/registry/cyber/ui/glitch-text"
import { ItemList } from "@/registry/cyber/ui/item-list"
import { Meter } from "@/registry/cyber/ui/meter"
import { Barcode, Corners, Micro } from "@/registry/cyber/ui/micro"
import { Panel } from "@/registry/cyber/ui/panel"
import { Readout } from "@/registry/cyber/ui/readout"
import { Screen } from "@/registry/cyber/ui/screen"
import { ScrollArea } from "@/registry/cyber/ui/scroll-area"
import { Switch } from "@/registry/cyber/ui/switch"
import { notify } from "@/registry/cyber/ui/toaster"
import "@/registry/cyber/blocks/comms/comms.css"

// Contacts and messages: who's on the list, the record of whoever is
// chosen, and the thread with them. A thread whose job offer hasn't been
// answered is the flagged one, on the list and in its title bar.
//
// A reply is chosen with the arrow keys and sent with Enter or the Send
// key, so walking the replies never sends one. Sending takes the replies
// away while the contact answers, so focus goes to the line that says what
// the thread is doing, which is always there. Choosing a contact leaves
// focus in the list.

type Message = Line & { id: string }
type OfferState = "open" | "accepted" | "declined"

type Thread = {
  lines: Message[]
  // The replies on offer, as a key into the contact's script. None: the
  // thread has run out.
  node: string | null
  waiting: boolean
  unread: number
  offer: OfferState | null
  standing: number
}

const startThreads = (): Record<string, Thread> =>
  Object.fromEntries(
    contacts.map((contact) => [
      contact.id,
      {
        lines: contact.history.map((line, index) => ({ ...line, id: `${contact.id}-${index}` })),
        node: contact.start,
        waiting: false,
        unread: contact.unread,
        offer: contact.offer ? "open" : null,
        standing: contact.standing,
      },
    ]),
  )

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const two = (value: number) => String(value).padStart(2, "0")
const stamp = () => {
  const now = new Date()
  return `${days[now.getDay()]} ${two(now.getHours())}:${two(now.getMinutes())}`
}
const clock = (seconds: number) => `${two(Math.floor(seconds / 60))}:${two(seconds % 60)}`
const nameOf = (id: string) => contacts.find((contact) => contact.id === id)?.name ?? ""

function PresenceBadge({ presence }: { presence: Presence }) {
  if (presence === "online")
    return (
      <Badge tone="ok" status live>
        Online
      </Badge>
    )
  return presence === "busy" ? (
    <Badge status>Busy</Badge>
  ) : (
    <Badge tone="mute" status>
      Away
    </Badge>
  )
}

// The attached brief: what the job is, in a frame of its own. It stays in
// the thread after it's answered, and says how.
function Brief({ offer, state }: { offer: Offer; state: OfferState }) {
  return (
    <div data-comms-brief="" data-frame="tl br" data-state={state}>
      <div data-comms-brief-head="">
        <span data-kit="hint">Brief received {offer.received}</span>
        {state === "open" ? <Badge tone="flag">Open offer</Badge> : state === "accepted" ? <Badge tone="ok">Accepted</Badge> : <Badge tone="mute">Declined</Badge>}
      </div>
      <h3 data-comms-brief-title="">{offer.name}</h3>
      <dl data-comms-terms="">
        <div>
          <dt>Type</dt>
          <dd>{offer.kind}</dd>
        </div>
        <div>
          <dt>Objective</dt>
          <dd>{offer.objective}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{offer.location}</dd>
        </div>
      </dl>
      <div data-comms-brief-foot="">
        <AvatarStack label="Crew on this job" size="sm">
          {offer.crew.map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </AvatarStack>
        <span data-comms-pay="">
          <span data-kit="label">Pays</span>
          <span data-kit="value">{creditsOf(offer.pay)}</span>
        </span>
      </div>
    </div>
  )
}

export default function Comms() {
  const [threads, setThreads] = React.useState(startThreads)
  const [selected, setSelected] = React.useState("mara")
  const [choice, setChoice] = React.useState<string | null>(null)
  const [held, setHeld] = React.useState(false)
  const [taken, setTaken] = React.useState(0)
  const [ringing, setRinging] = React.useState<string | null>(null)
  const [call, setCall] = React.useState<{ id: string; since: number } | null>(null)
  const [elapsed, setElapsed] = React.useState(0)
  const [calls, setCalls] = React.useState<FeedItem[]>(earlierCalls)

  // What a timer needs to know when it fires, long after the render that
  // set it: who's on screen now, and whether toasts are being held.
  const now = React.useRef({ selected, held })
  React.useEffect(() => {
    now.current = { selected, held }
  }, [selected, held])

  // Every pause on this screen is a timer in this set. Restoring the inbox
  // moves the epoch on, so a timer set before it finds it has nothing to do.
  const timers = React.useRef(new Set<ReturnType<typeof setTimeout>>())
  const epoch = React.useRef(0)
  const later = (ms: number, run: (current: boolean) => void) => {
    const from = epoch.current
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      run(from === epoch.current)
    }, ms)
    timers.current.add(timer)
  }
  React.useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  // The line under the thread takes focus when what had it leaves: the
  // replies after one is sent, a toast after its key is pressed.
  const stateLine = React.useRef<HTMLParagraphElement>(null)
  const [focusTick, setFocusTick] = React.useState(0)
  React.useEffect(() => {
    if (focusTick) stateLine.current?.focus()
  }, [focusTick])

  React.useEffect(() => {
    if (!call) return
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - call.since) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [call])

  const contact = contacts.find((entry) => entry.id === selected) ?? contacts[0]
  const thread = threads[contact.id]
  const replies = thread.waiting || !thread.node ? [] : (contact.script[thread.node] ?? [])
  // The first reply is the chosen one until another is, as on any radio
  // group that has to have an answer.
  const reply = replies.find((entry) => entry.value === choice) ?? replies[0]

  const unread = Object.values(threads).reduce((sum, entry) => sum + entry.unread, 0)
  const offers = Object.values(threads).filter((entry) => entry.offer === "open").length

  // Opening a thread reads it.
  const open = (id: string) => {
    setSelected(id)
    setChoice(null)
    setThreads((all) => (all[id].unread ? { ...all, [id]: { ...all[id], unread: 0 } } : all))
  }

  const send = () => {
    if (!reply) return
    const { id, name } = contact
    const sent = reply
    const at = stamp()
    setThreads((all) => {
      const before = all[id]
      const shift = sent.outcome === "accept" ? 6 : sent.outcome === "decline" ? -9 : 1
      return {
        ...all,
        [id]: {
          ...before,
          lines: [...before.lines, { id: `${id}-${before.lines.length}`, from: "me", time: at, text: sent.label }],
          waiting: true,
          offer: sent.outcome === "accept" ? "accepted" : sent.outcome === "decline" ? "declined" : before.offer,
          standing: Math.max(0, Math.min(100, before.standing + shift)),
        },
      }
    })
    if (sent.outcome === "accept") setTaken((count) => count + 1)
    setChoice(null)
    setFocusTick((tick) => tick + 1)

    // They answer after about as long as it takes to type it.
    later(1300 + sent.answer.length * 14, (current) => {
      if (!current) return
      const viewing = now.current.selected === id
      const back = stamp()
      setThreads((all) => {
        const before = all[id]
        return {
          ...all,
          [id]: {
            ...before,
            lines: [...before.lines, { id: `${id}-${before.lines.length}`, from: "them", time: back, text: sent.answer }],
            waiting: false,
            node: sent.next ?? null,
            unread: viewing ? 0 : before.unread + 1,
          },
        }
      })
      if (now.current.held) return
      notify(`${name} replied`, {
        description: sent.answer,
        action: viewing
          ? undefined
          : {
              label: `Open thread with ${name}`,
              onAction: () => {
                open(id)
                setFocusTick((tick) => tick + 1)
              },
            },
      })
    })
  }

  const log = (actor: string, text: string, missed?: boolean) =>
    setCalls((entries) => [...entries, { id: `call-${entries.length}-${Date.now()}`, time: stamp(), actor, text, tone: missed ? ("flag" as const) : undefined }].slice(-5))

  // The Call key: hangs up if this contact is on the line, refuses if
  // someone else is, and otherwise rings. The promise it returns keeps the
  // key pending while it rings.
  const dial = () => {
    const { id, name } = contact
    if (call?.id === id) {
      const length = clock(Math.floor((Date.now() - call.since) / 1000))
      setCall(null)
      log(name, `Call ended after ${length}.`)
      notify("Call ended", { description: `${name}, ${length} on the line.` })
      return
    }
    if (call) {
      notify("Line in use", { tone: "warning", description: `End the call with ${nameOf(call.id)} first.` })
      return
    }
    if (ringing) return
    setRinging(id)
    return new Promise<void>((resolve) => {
      later(1500, (current) => {
        setRinging(null)
        resolve()
        if (!current) return
        if (contact.call.connects) {
          setElapsed(0)
          setCall({ id, since: Date.now() })
          log(name, "Connected.")
          notify(`Connected to ${name}`, { tone: "success", description: contact.call.line })
        } else {
          log(name, "No answer.", true)
          notify("No answer", { tone: "warning", description: `${name}. ${contact.call.line}` })
        }
      })
    })
  }

  const restore = () => {
    epoch.current += 1
    setThreads(startThreads())
    setSelected("mara")
    setChoice(null)
    setTaken(0)
    setCall(null)
    setCalls(earlierCalls)
    notify("Inbox restored", { description: "Six threads, two offers waiting." })
  }

  // C calls, from anywhere on the screen. The key is only listened for
  // while focus is inside the screen, and it presses the Call key itself so
  // the key shows the ringing.
  const callKey = React.useRef<HTMLButtonElement>(null)
  const recordId = React.useId()
  const onScreenKey = (event: React.KeyboardEvent) => {
    if (event.key.toLowerCase() !== "c" || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
    if ((event.target as Element).closest("input, textarea, select, [contenteditable]")) return
    callKey.current?.click()
  }

  const onLine = call?.id === contact.id
  const offer = contact.offer
  const last = thread.lines[thread.lines.length - 1]

  const messages: FeedItem[] = thread.lines.map((line) => ({
    id: line.id,
    time: line.time,
    actor: line.from === "me" ? "You" : contact.name,
    text: line.text,
    tone: line.offer ? "flag" : undefined,
  }))

  const trailing =
    thread.offer === "open" && offer
      ? `New job: ${offer.name}`
      : thread.offer === "accepted"
        ? "Job accepted"
        : thread.offer === "declined"
          ? "Offer declined"
          : `${thread.lines.length} messages`

  const state = thread.waiting
    ? `Sent. ${contact.name} is typing.`
    : replies.length
      ? `${replies.length} replies ready. Choose one and send it.`
      : "Nothing left to answer. The thread is quiet."

  return (
    <Screen
      label="Comms"
      onKeyDown={onScreenKey}
      status={
        <>
          <Readout label="Unread" value={unread} size="sm" tone={unread ? "flag" : "signal"} />
          <Readout label="Open offers" value={offers} size="sm" tone="accent" />
          <Readout label="Jobs taken" value={taken} size="sm" />
        </>
      }
      aside={
        <div data-comms-line="">
          <span role="status">
            {call ? (
              <Badge tone="signal" status live>
                On call: {nameOf(call.id)}
              </Badge>
            ) : ringing ? (
              <Badge status live>
                Ringing {nameOf(ringing)}
              </Badge>
            ) : (
              <Badge tone="mute" status>
                Line idle
              </Badge>
            )}
          </span>
          {call && (
            <span data-kit="value" role="timer" aria-label="Call time">
              {clock(elapsed)}
            </span>
          )}
          <Button
            size="sm"
            tone="ghost"
            data-agent-confirm="Restores the inbox to how it started. Every reply sent this session and the call log are discarded."
            onClick={restore}
          >
            <RotateCcw aria-hidden />
            Restore inbox
          </Button>
        </div>
      }
      hints={[
        { keys: ["↑", "↓"], label: "Browse" },
        { keys: "↵", label: "Send reply" },
        { keys: "C", label: "Call" },
      ]}
      code="CS-C4 // COMMS // VANTA RELAY LT-04 // PROTOCOL 7741-C"
    >
      <div data-kit="comms">
        <div data-comms-list="">
          <h2 data-sr-only>Contact list</h2>
          <ItemList
            label="Contacts"
            countLabel="unread"
            value={selected}
            // Pressing the chosen row again would clear the choice; the
            // record and the thread always show someone, so that's ignored.
            onValueChange={(value) => value && open(value)}
            items={contacts.map((entry) => ({
              value: entry.id,
              label: entry.name,
              meta: entry.role,
              flag: threads[entry.id].offer === "open" ? "Job offer waiting" : undefined,
              count: threads[entry.id].unread || undefined,
            }))}
          />
        </div>

        <section data-comms-record="" aria-labelledby={recordId}>
          <div data-comms-record-head="">
            <h2 id={recordId} data-kit="label">
              Contact record
            </h2>
            <Micro>{contact.channel} // Rev 0.1</Micro>
          </div>
          <div data-comms-plate="" data-frame="tl br" key={contact.id}>
            <Corners size={8} inset={7} />
            <Portrait look={contact.look} seed={contact.name} />
            <Micro data-comms-plate-code="">
              ID plate 0{contact.look + 1} // {contact.district}
            </Micro>
            <Barcode data-comms-plate-bars="" value={`${contact.channel} ${contact.name}`} vertical size={10} />
          </div>
          <div data-comms-who="">
            <GlitchText as="p" data-comms-name="">
              {contact.name}
            </GlitchText>
            <p data-comms-role="">
              {contact.role}
              <span aria-hidden> // </span>
              <span data-sr-only>, </span>
              {contact.district}
            </p>
            {onLine ? (
              <Badge tone="signal" status live>
                On call
              </Badge>
            ) : (
              <PresenceBadge presence={contact.presence} />
            )}
          </div>
          <dl data-comms-facts="">
            <div>
              <dt>Channel</dt>
              <dd>{contact.channel}</dd>
            </div>
            <div>
              <dt>Last contact</dt>
              <dd>{last.time}</dd>
            </div>
            <div>
              <dt>Jobs together</dt>
              <dd>{two(contact.jobs + (thread.offer === "accepted" ? 1 : 0))}</dd>
            </div>
          </dl>
          <Meter label="Standing" value={thread.standing} />
          <Button ref={callKey} tone="signal" data-comms-call="" onClick={dial}>
            {onLine ? <PhoneOff aria-hidden /> : <Phone aria-hidden />}
            {onLine ? `End call with ${contact.name}` : `Call ${contact.name}`}
          </Button>
        </section>

        <div data-comms-thread="" key={contact.id}>
          <Panel
            variant="titled"
            tone={thread.offer === "open" ? "flag" : "default"}
            title={contact.name}
            level={2}
            code={`${contact.channel} // ${thread.offer === "open" ? "INBOUND // ANSWER BEFORE 04:00" : "THREAD SYNCED"}`}
            actions={trailing}
          >
            <ScrollArea label={`Messages with ${contact.name}`} maxHeight={264} stickToEnd>
              <Feed label={`Thread with ${contact.name}`} items={messages} live={thread.waiting} />
            </ScrollArea>
            {offer && thread.offer && <Brief offer={offer} state={thread.offer} />}
          </Panel>

          <div data-comms-answer="">
            <p data-comms-state="" role="status" tabIndex={-1} ref={stateLine}>
              {state}
            </p>
            {reply && (
              // Enter sends the chosen reply. The arrow keys only choose.
              <div
                data-comms-replies=""
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || event.repeat || !(event.target as Element).closest('[data-kit="choice"]')) return
                  event.preventDefault()
                  send()
                }}
              >
                <ChoiceList
                  key={thread.node}
                  label={`Reply to ${contact.name}`}
                  options={replies.map((entry) => ({ value: entry.value, label: entry.label }))}
                  value={reply.value}
                  onValueChange={(value) => setChoice(value)}
                />
              </div>
            )}
            <div data-kit="actions">
              <Button
                tone={reply ? "flag" : "secondary"}
                disabled={!reply}
                // Turning a job down can't be taken back, so an agent has to ask first.
                data-agent-confirm={
                  reply?.outcome === "decline" && offer ? `Declines the job offer "${offer.name}" from ${contact.name}. It won't be offered again.` : undefined
                }
                onClick={send}
              >
                <Send aria-hidden />
                Send reply
              </Button>
            </div>
          </div>
        </div>

        <div data-comms-deck="">
          <Panel title="Line" level={2} tone="signal" code="VANTA MK.II // RELAY LT-04" actions={call ? "In use" : ringing ? "Ringing" : "Idle"}>
            <Switch label="Hold notifications" checked={held} onCheckedChange={(next) => setHeld(next)} />
            <p data-kit="hint">Replies still arrive and are counted. The deck just stays quiet.</p>
            <Feed label="Call log" items={calls} />
          </Panel>
        </div>
      </div>
    </Screen>
  )
}
