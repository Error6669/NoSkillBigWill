import type { Match, Slot, Team } from '../../types'
import { COURTS } from '../../lib/scheduling'
import { getSlotCellLines } from '../../lib/scheduleDisplay'
import type { ScheduleConflicts } from '../../lib/scheduleConflicts'
import { useCanEdit } from '../../state/AuthContext'
import SlotCell from './SlotCell'

interface SlotGridProps {
  slots: Slot[]
  matches: Match[]
  teams: Team[]
  selectedSlotId: string | null
  swapSelection: string[]
  conflicts?: ScheduleConflicts
  onSelectSlot: (slotId: string) => void
  onUnassignSlot: (slotId: string) => void
}

const LANGENSTEIN_COURTS = COURTS.filter((entry) => entry.location === 'Langenstein')
const MAUTHAUSEN_COURTS = COURTS.filter((entry) => entry.location === 'Mauthausen')

export default function SlotGrid({
  slots,
  matches,
  teams,
  selectedSlotId,
  swapSelection,
  conflicts,
  onSelectSlot,
  onUnassignSlot,
}: SlotGridProps) {
  const canEdit = useCanEdit()
  const times = Array.from(new Set(slots.map((slot) => slot.startTime))).sort()

  // Im ausgeloggten Zustand werden die Mauthausen-Plätze nur angezeigt, wenn
  // dort tatsächlich mindestens ein Spiel eingeteilt ist - sonst bleibt die
  // Spalte für Besucher ausgeblendet (kein Interesse an leeren Plätzen dort).
  const hasMauthausenAssignment = slots.some(
    (slot) => slot.location === 'Mauthausen' && slot.assignedMatchId,
  )
  const showMauthausen = canEdit || hasMauthausenAssignment

  const renderCell = (
    time: string,
    location: (typeof COURTS)[number]['location'],
    court: number,
  ) => {
    const slot = slots.find(
      (entry) => entry.startTime === time && entry.location === location && entry.court === court,
    )
    if (!slot) {
      return <td key={`${location}-${court}`} />
    }
    const match = matches.find((m) => m.id === slot.assignedMatchId)
    const conflictLevel = conflicts?.redSlotIds.has(slot.id)
      ? 'red'
      : conflicts?.orangeSlotIds.has(slot.id)
        ? 'orange'
        : undefined
    return (
      <td key={`${location}-${court}`}>
        <SlotCell
          slot={slot}
          match={match}
          location={location}
          lines={match ? getSlotCellLines(match, teams, matches) : undefined}
          isSelected={selectedSlotId === slot.id}
          isSwapSelected={swapSelection.includes(slot.id)}
          conflictLevel={conflictLevel}
          onSelect={() => onSelectSlot(slot.id)}
          onUnassign={() => onUnassignSlot(slot.id)}
        />
      </td>
    )
  }

  return (
    <div className="slot-grid__scroll">
      <table className="slot-grid">
        <thead>
          <tr>
            <th rowSpan={2} className="slot-grid__time-col">
              Uhrzeit
            </th>
            <th colSpan={3} className="slot-grid__location-header slot-grid__location-header--langenstein">
              Langenstein
            </th>
            {showMauthausen && (
              <>
                <th rowSpan={2} className="slot-grid__spacer" />
                <th colSpan={2} className="slot-grid__location-header slot-grid__location-header--mauthausen">
                  Mauthausen
                </th>
              </>
            )}
          </tr>
          <tr>
            {LANGENSTEIN_COURTS.map(({ court }) => (
              <th key={`langenstein-${court}`} className="slot-grid__court-header--langenstein">
                Platz {court}
              </th>
            ))}
            {showMauthausen &&
              MAUTHAUSEN_COURTS.map(({ court }) => (
                <th key={`mauthausen-${court}`} className="slot-grid__court-header--mauthausen">
                  Platz {court}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <td className="slot-grid__time-col">{time}</td>
              {LANGENSTEIN_COURTS.map(({ court }) => renderCell(time, 'Langenstein', court))}
              {showMauthausen && (
                <>
                  <td className="slot-grid__spacer" />
                  {MAUTHAUSEN_COURTS.map(({ court }) => renderCell(time, 'Mauthausen', court))}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
