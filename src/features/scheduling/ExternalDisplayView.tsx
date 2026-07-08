import { useAppState } from '../../state/AppStateContext'
import { COURTS, formatFullDate, formatWeekday } from '../../lib/scheduling'
import { getSlotCellLines } from '../../lib/scheduleDisplay'
import type { Location } from '../../types'

const LANGENSTEIN_COURTS = COURTS.filter((entry) => entry.location === 'Langenstein')
const MAUTHAUSEN_COURTS = COURTS.filter((entry) => entry.location === 'Mauthausen')

function getDisplayDayFromUrl(): number | null {
  const value = new URLSearchParams(window.location.search).get('display')
  const day = Number(value)
  return value !== null && Number.isInteger(day) ? day : null
}

export default function ExternalDisplayView() {
  const { state } = useAppState()
  const day = getDisplayDayFromUrl()
  const dayConfig = state.dayConfigs.find((config) => config.day === day)
  const daySlots = state.slots.filter((slot) => slot.day === day)
  const times = Array.from(new Set(daySlots.map((slot) => slot.startTime))).sort()
  const hasMauthausen = daySlots.some((slot) => slot.location === 'Mauthausen' && slot.assignedMatchId)

  const renderCell = (time: string, location: Location, court: number) => {
    const slot = daySlots.find(
      (entry) => entry.startTime === time && entry.location === location && entry.court === court,
    )
    if (!slot) return <td key={`${location}-${court}`} />
    const match = state.matches.find((m) => m.id === slot.assignedMatchId)
    const lines = match ? getSlotCellLines(match, state.teams, state.matches) : null
    return (
      <td key={`${location}-${court}`}>
        <div className={lines ? 'external-display__cell external-display__cell--occupied' : 'external-display__cell'}>
          {lines ? (
            <>
              <div className="external-display__positions">{lines.line1}</div>
              <div className="external-display__names">
                {lines.team1Text} vs. {lines.team2Text}
              </div>
            </>
          ) : (
            <span className="external-display__empty">frei</span>
          )}
        </div>
      </td>
    )
  }

  return (
    <div className="external-display">
      {dayConfig && (
        <div className="external-display__header">
          <h1>
            Platzplan – {formatWeekday(dayConfig.date)}, {formatFullDate(dayConfig.date)}
          </h1>
        </div>
      )}

      {!dayConfig ? (
        <p className="external-display__hint">Kein gültiger Spieltag ausgewählt.</p>
      ) : times.length === 0 ? (
        <p className="external-display__hint">Für diesen Spieltag sind noch keine Slots angelegt.</p>
      ) : (
        <table className="external-display__table">
          <thead>
            <tr>
              <th rowSpan={2} className="external-display__time-col">
                Uhrzeit
              </th>
              <th colSpan={3}>Langenstein</th>
              {hasMauthausen && (
                <>
                  <th rowSpan={2} className="external-display__spacer" />
                  <th colSpan={2}>Mauthausen</th>
                </>
              )}
            </tr>
            <tr>
              {LANGENSTEIN_COURTS.map(({ court }) => (
                <th key={`l-${court}`}>Platz {court}</th>
              ))}
              {hasMauthausen &&
                MAUTHAUSEN_COURTS.map(({ court }) => <th key={`m-${court}`}>Platz {court}</th>)}
            </tr>
          </thead>
          <tbody>
            {times.map((time) => (
              <tr key={time}>
                <td className="external-display__time-col">{time}</td>
                {LANGENSTEIN_COURTS.map(({ court }) => renderCell(time, 'Langenstein', court))}
                {hasMauthausen && (
                  <>
                    <td className="external-display__spacer" />
                    {MAUTHAUSEN_COURTS.map(({ court }) => renderCell(time, 'Mauthausen', court))}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
