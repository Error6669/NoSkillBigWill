import type { Location, Match, Slot } from '../../types'
import type { SlotCellLines } from '../../lib/scheduleDisplay'

interface SlotCellProps {
  slot: Slot
  match?: Match
  lines?: SlotCellLines
  location: Location
  isSelected: boolean
  isSwapSelected: boolean
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
  onSelect,
  onUnassign,
}: SlotCellProps) {
  const isOccupied = Boolean(match)

  const classNames = ['slot-cell']
  classNames.push(isOccupied ? 'slot-cell--occupied' : 'slot-cell--empty')
  classNames.push(location === 'Langenstein' ? 'slot-cell--langenstein' : 'slot-cell--mauthausen')
  if (isSelected) classNames.push('slot-cell--selected')
  if (isSwapSelected) classNames.push('slot-cell--swap-selected')

  return (
    <div
      className={classNames.join(' ')}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Slot ${slot.startTime}-${slot.endTime}, ${slot.location} Platz ${slot.court}`}
    >
      {isOccupied && lines ? (
        <>
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
