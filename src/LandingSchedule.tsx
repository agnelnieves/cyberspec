import { useState } from "react"
import { addDays, formatDate, todayDate, weekday } from "@ui-sdk/core/date"
import { ArrowUpRight } from "lucide-react"
import { Calendar } from "@/registry/cyber/ui/calendar"
import { Feed, type FeedItem } from "@/registry/cyber/ui/feed"
import "./landing-schedule.css"

const broadcasts: Partial<Record<number, Pick<FeedItem, "time" | "actor" | "text">[]>> = {
  1: [
    { time: "07:45", actor: "Carrier check", text: "Send a test tone to the coastal receivers." },
    { time: "08:00", actor: "Weather bulletin", text: "Broadcast the North Atlantic wind and swell forecast." },
    { time: "08:20", actor: "Sign-off", text: "Read the station call sign and return to standby." },
  ],
  3: [
    { time: "11:50", actor: "Link test", text: "Check the audio circuit between Reykjavík and Tórshavn." },
    { time: "12:00", actor: "Harbor report", text: "Read the tide tables and harbor notices." },
    { time: "12:15", actor: "Time signal", text: "Close the broadcast with a UTC time check." },
  ],
  5: [
    { time: "17:00", actor: "Weekly roundup", text: "Relay the week’s reports from island stations." },
    { time: "17:30", actor: "Listener reports", text: "Read reception notes from across the Atlantic." },
  ],
}

function nextBroadcast(date: string) {
  const day = weekday(date)
  const daysUntil = Object.keys(broadcasts).map((key) => (Number(key) - day + 7) % 7)
  return addDays(date, Math.min(...daysUntil))
}

function displayDate(date: string) {
  return formatDate(date, "en", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

export function LandingSchedule() {
  const [date, setDate] = useState(() => nextBroadcast(todayDate("UTC")))
  const dateLabel = displayDate(date)
  const items = (broadcasts[weekday(date)] ?? []).map((entry) => ({
    ...entry, id: `${date}-${entry.time}`, dateTime: `${date}T${entry.time}:00Z`,
  }))
  return (
    <section id="relay-schedule" className="landing-schedule" aria-labelledby="relay-title">
      <header className="schedule-intro">
        <h2 id="relay-title">Relay schedule.</h2>
        <p>Choose a date to see the Reykjavík relay’s sample broadcasts. It transmits every Monday, Wednesday and Friday.</p>
      </header>
      <div className="schedule-panels">
        <div className="schedule-calendar">
          <h3 className="showcase-component"><a href="/preview/calendar">Calendar <ArrowUpRight aria-hidden size={17} /></a></h3>
          <Calendar
            aria-label="Reykjavík relay broadcast calendar"
            value={date}
            onValueChange={(value) => { if (typeof value === "string") setDate(value) }}
            timeZone="UTC"
            locale="en"
            weekStartsOn={1}
            code="REYKJAVÍK // UTC"
          />
        </div>
        <div className="schedule-timeline">
          <h3 className="showcase-component"><a href="/preview/feed">Timeline feed <ArrowUpRight aria-hidden size={17} /></a></h3>
          <div className="schedule-date" role="status" aria-atomic="true">
            <h4><time dateTime={date}>{dateLabel}</time></h4>
            <p>{items.length ? `${items.length} events · UTC` : "No broadcasts scheduled"}</p>
          </div>
          {items.length > 0 ? (
            <Feed label={`Reykjavík relay schedule for ${dateLabel}, UTC`} items={items} />
          ) : (
            <p className="schedule-empty">The relay’s next broadcast is {displayDate(nextBroadcast(date))}.</p>
          )}
        </div>
      </div>
    </section>
  )
}
