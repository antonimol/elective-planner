import { showsInTerm } from '../lib/clashes'
import { assignLanes } from '../lib/layout'
import { formatMinutes } from '../lib/time'
import type { Meeting, Offering, Term } from '../lib/types'
import { DAYS } from '../lib/format'

const DAY_START = 8 * 60
const DAY_END = 21 * 60 + 30
const PX_PER_MIN = 1
const BANDS = [480, 570, 660, 750, 840, 930, 1020, 1110, 1200, 1290]
const LUNCH = { start: 840, end: 930 }

interface Props {
  offerings: Offering[]
  term: Term
  mandatoryIds: Set<string>
  clashingMeetingIds: Set<string>
  preview?: Offering | null
}

interface Block {
  meeting: Meeting
  offering: Offering
  preview: boolean
}

export function Timetable({ offerings, term, mandatoryIds, clashingMeetingIds, preview }: Props) {
  const blocks: Block[] = offerings.flatMap((o) =>
    o.meetings.filter((m) => showsInTerm(m.termSpan, term)).map((m) => ({ meeting: m, offering: o, preview: false })),
  )
  if (preview && !offerings.some((o) => o.id === preview.id)) {
    for (const m of preview.meetings) {
      if (showsInTerm(m.termSpan, term)) blocks.push({ meeting: m, offering: preview, preview: true })
    }
  }
  const y = (min: number) => (min - DAY_START) * PX_PER_MIN
  const height = y(DAY_END)

  return (
    <div className="timetable" role="table" aria-label={`Timetable ${term}`}>
      <div className="tt-head" role="row">
        <div className="tt-corner" />
        {DAYS.map((d) => (
          <div key={d} className="tt-day-name" role="columnheader">
            {d}
          </div>
        ))}
      </div>
      <div className="tt-body" style={{ height }}>
        <div className="tt-times" aria-hidden>
          {BANDS.map((b) => (
            <span key={b} style={{ top: y(b) }}>
              {formatMinutes(b)}
            </span>
          ))}
        </div>
        {DAYS.map((day) => {
          const dayBlocks = blocks.filter((b) => b.meeting.day === day)
          const lanes = assignLanes(dayBlocks.map((b) => ({ id: key(b), start: b.meeting.start, end: b.meeting.end })))
          return (
            <div key={day} className="tt-day" role="row" aria-label={day}>
              {BANDS.map((b) => (
                <div key={b} className="tt-line" style={{ top: y(b) }} />
              ))}
              <div className="tt-lunch" style={{ top: y(LUNCH.start), height: y(LUNCH.end) - y(LUNCH.start) }} />
              {dayBlocks.map((b) => {
                const place = lanes.get(key(b)) ?? { lane: 0, lanes: 1 }
                const clash = clashingMeetingIds.has(b.meeting.id)
                const kind = b.preview ? 'preview' : mandatoryIds.has(b.offering.id) ? 'mandatory' : 'elective'
                const time = `${formatMinutes(b.meeting.start)}–${formatMinutes(b.meeting.end)}`
                return (
                  <div
                    key={key(b)}
                    role="cell"
                    className={`tt-block ${kind} ${clash ? 'clash' : ''} ${place.lanes > 1 ? 'narrow' : ''}`}
                    style={{
                      top: y(b.meeting.start),
                      height: (b.meeting.end - b.meeting.start) * PX_PER_MIN,
                      left: `${(place.lane / place.lanes) * 100}%`,
                      width: `${100 / place.lanes}%`,
                    }}
                    title={`${b.offering.title} (${b.offering.section})\n${day} ${time}${b.meeting.room ? `, room ${b.meeting.room}` : ''}${
                      b.offering.termType === 'S1' ? '\nWhole semester (S1)' : ''
                    }${clash ? '\nClashes with another course' : ''}`}
                  >
                    <strong>{b.offering.title}</strong>
                    <span className="tt-meta">
                      {[b.offering.section, b.offering.termType === 'S1' ? 'S1' : null, time, b.meeting.room]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    {clash && <span className="tt-clash-tag">Clash</span>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function key(b: Block): string {
  return `${b.preview ? 'p-' : ''}${b.meeting.id}`
}
