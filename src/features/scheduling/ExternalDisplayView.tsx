import { useEffect, useMemo, useState } from 'react'
import { useAppState } from '../../state/AppStateContext'
import { COURTS, formatFullDate, formatWeekday, toIsoDate } from '../../lib/scheduling'
import { getSlotCellLines } from '../../lib/scheduleDisplay'
import type { DayConfig, Location } from '../../types'

const LANGENSTEIN_COURTS = COURTS.filter((entry) => entry.location === 'Langenstein')
const MAUTHAUSEN_COURTS = COURTS.filter((entry) => entry.location === 'Mauthausen')

/** Heutiger Spieltag, falls vorhanden - sonst der chronologisch erste angelegte Spieltag. */
function findDefaultDay(sortedDayConfigs: DayConfig[]): number | null {
  if (sortedDayConfigs.length === 0) return null
  const today = toIsoDate(new Date())
  const todayConfig = sortedDayConfigs.find((config) => config.date === today)
  return (todayConfig ?? sortedDayConfigs[0]).day
}

export default function ExternalDisplayView() {
  const { state } = useAppState()
  const sortedDayConfigs = useMemo(
    () => [...state.dayConfigs].sort((a, b) => a.date.localeCompare(b.date)),
    [state.dayConfigs],
  )
  const [day, setDay] = useState<number | null>(() => findDefaultDay(sortedDayConfigs))

  // Falls der aktuell gezeigte Tag nicht mehr existiert (z.B. gelöscht),
  // auf einen gültigen Tag zurückfallen.
  useEffect(() => {
    if (day !== null && sortedDayConfigs.some((config) => config.day === day)) return
    setDay(findDefaultDay(sortedDayConfigs))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedDayConfigs])

  const currentIndex = sortedDayConfigs.findIndex((config) => config.day === day)
  const dayConfig = currentIndex >= 0 ? sortedDayConfigs[currentIndex] : undefined
  const daySlots = state.slots.filter((slot) => slot.day === day)
  const times = Array.from(new Set(daySlots.map((slot) => slot.startTime))).sort()
  const hasMauthausen = daySlots.some((slot) => slot.location === 'Mauthausen' && slot.assignedMatchId)

  const goToPrevDay = () => {
    if (currentIndex > 0) setDay(sortedDayConfigs[currentIndex - 1].day)
  }
  const goToNextDay = () => {
    if (currentIndex >= 0 && currentIndex < sortedDayConfigs.length - 1) {
      setDay(sortedDayConfigs[currentIndex + 1].day)
    }
  }

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
      <div className="external-display__header">
        <button
          type="button"
          className="external-display__nav-btn"
          disabled={currentIndex <= 0}
          onClick={goToPrevDay}
          aria-label="Vorheriger Spieltag"
        >
          ‹
        </button>
        <h1>
          {dayConfig
            ? `Platzplan – ${formatWeekday(dayConfig.date)}, ${formatFullDate(dayConfig.date)}`
            : 'Platzplan'}
        </h1>
        <button
          type="button"
          className="external-display__nav-btn"
          disabled={currentIndex === -1 || currentIndex >= sortedDayConfigs.length - 1}
          onClick={goToNextDay}
          aria-label="Nächster Spieltag"
        >
          ›
        </button>
      </div>

      {!dayConfig ? (
        <p className="external-display__hint">Noch kein Spieltag angelegt.</p>
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
                <th key={`l-${court}`} className="external-display__court-header">
                  Platz {court}
                </th>
              ))}
              {hasMauthausen &&
                MAUTHAUSEN_COURTS.map(({ court }) => (
                  <th key={`m-${court}`} className="external-display__court-header">
                    Platz {court}
                  </th>
                ))}
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
