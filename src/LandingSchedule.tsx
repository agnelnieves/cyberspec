import { useState } from "react"
import { addDays, formatDate, todayDate, weekday } from "@ui-sdk/core/date"
import { ArrowUpRight } from "lucide-react"
import { Calendar } from "@/registry/cyber/ui/calendar"
import { Feed, type FeedItem } from "@/registry/cyber/ui/feed"
import "./landing-schedule.css"

const broadcasts: Partial<Record<number, Pick<FeedItem, "time" | "actor" | "text">[]>> = {
  1: [
    { time: "07:45", actor: "Sound check", text: "A short tone opens the morning broadcast." },
    { time: "08:00", actor: "Weather forecast", text: "Wind and waves across the North Atlantic." },
    { time: "08:20", actor: "Sign-off", text: "The hosts say goodbye until Wednesday." },
  ],
  3: [
    { time: "11:50", actor: "Sound check", text: "The Reykjavík hosts call their guests in Tórshavn." },
    { time: "12:00", actor: "Harbor news", text: "Today’s tides and news from the docks." },
    { time: "12:15", actor: "Time check", text: "The hosts give the time before they sign off." },
  ],
  5: [
    { time: "17:00", actor: "Weekly roundup", text: "Island stations share their stories from the week." },
    { time: "17:30", actor: "Listener letters", text: "Messages from listeners on both sides of the Atlantic." },
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
        <h2 id="relay-title">Radio schedule.</h2>
        <p>Pick a date to see what’s on the radio. This sample station in Reykjavík broadcasts on Mondays, Wednesdays, and Fridays.</p>
      </header>
      <div className="schedule-panels">
        <div className="schedule-calendar">
          <h3 className="showcase-component"><a href="/preview/calendar">Calendar <ArrowUpRight aria-hidden size={17} /></a></h3>
          <Calendar
            aria-label="Reykjavík radio calendar"
            value={date}
            onValueChange={(value) => { if (typeof value === "string") setDate(value) }}
            timeZone="UTC"
            locale="en"
            weekStartsOn={1}
            code="REYKJAVÍK // UTC"
          />
        </div>
        <div className="schedule-timeline">
          <h3 className="showcase-component"><a href="/preview/feed">Daily lineup <ArrowUpRight aria-hidden size={17} /></a></h3>
          <div className="schedule-date" role="status" aria-atomic="true">
            <h4><time dateTime={date}>{dateLabel}</time></h4>
            <p>{items.length ? `${items.length} events · UTC` : "No broadcasts scheduled"}</p>
          </div>
          {items.length > 0 ? (
            <Feed label={`Radio schedule for ${dateLabel}, UTC`} items={items} />
          ) : (
            <p className="schedule-empty">Next broadcast on {displayDate(nextBroadcast(date))}.</p>
          )}
        </div>
      </div>
    </section>
  )
}
