import type { Location, Match, Slot } from '../../types'
import type { SlotCellLines } from '../../lib/scheduleDisplay'
import { useCanEdit } from '../../state/AuthContext'

interface SlotCellProps {
  slot: Slot
  match?: Match
  lines?: SlotCellLines
  location: Location
  isSelected: boolean
  isSwapSelected: boolean
  conflictLevel?: 'red' | 'orange'
  onSelect: () => void
  onUnassign: () => void
}

export default function SlotCell({
  slot,
  match,
  lines,
  location,
  isSelected,
  isSwapSelected,
  conflictLevel,
  onSelect,
  onUnassign,
}: SlotCellProps) {
  const canEdit = useCanEdit()
  const isOccupied = Boolean(match)

  const classNames = ['slot-cell']
  classNames.push(isOccupied ? 'slot-cell--occupied' : 'slot-cell--empty')
  classNames.push(location === 'Langenstein' ? 'slot-cell--langenstein' : 'slot-cell--mauthausen')
  if (isSelected) classNames.push('slot-cell--selected')
  if (isSwapSelected) classNames.push('slot-cell--swap-selected')
  if (!canEdit) classNames.push('slot-cell--readonly')
  if (conflictLevel === 'red') classNames.push('slot-cell--conflict-red')
  if (conflictLevel === 'orange') classNames.push('slot-cell--conflict-orange')

  return (
    <div
      className={classNames.join(' ')}
      onClick={canEdit ? onSelect : undefined}
      role="button"
      tabIndex={0}
      aria-label={`Slot ${slot.startTime}-${slot.endTime}, ${slot.location} Platz ${slot.court}`}
      title={
        conflictLevel === 'red'
          ? 'Konflikt: Doppel spielt zur selben Uhrzeit auf einem anderen Platz'
          : conflictLevel === 'orange'
            ? 'Hinweis: Doppel spielt direkt im nächsten Zeitslot erneut, keine Pause'
            : undefined
      }
    >
      {isOccupied && lines ? (
        <>
          {canEdit && (
            <button
              type="button"
              className="slot-cell__remove"
              aria-label="Zuordnung entfernen"
              onClick={(event) => {
                event.stopPropagation()
                onUnassign()
              }}
            >
              ×
            </button>
          )}
          <span className="slot-cell__match-positions">{lines.line1}</span>
          <span className="slot-cell__match-names">
            {lines.team1Text} vs.
            <br />
            {lines.team2Text}
          </span>
        </>
      ) : (
        <span className="slot-cell__empty-label">frei</span>
      )}
    </div>
  )
}
