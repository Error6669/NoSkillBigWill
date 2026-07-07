import type { DayConfig } from '../../types'
import { formatWeekday } from '../../lib/scheduling'

interface DayConfigPanelProps {
  dayConfig: DayConfig
  slotCount: number
  onChange: (
    updates: Partial<Pick<DayConfig, 'date' | 'startTime' | 'endTime' | 'slotLengthMinutes'>>,
  ) => void
  onGenerate: () => void
  onRemove: () => void
}

export default function DayConfigPanel({
  dayConfig,
  slotCount,
  onChange,
  onGenerate,
  onRemove,
}: DayConfigPanelProps) {
  const weekday = formatWeekday(dayConfig.date)

  return (
    <div className="day-config-panel">
      {weekday && <div className="day-config-panel__weekday">{weekday}</div>}
      <div className="day-config-panel__field">
        <label htmlFor={`date-${dayConfig.day}`}>Datum</label>
        <input
          id={`date-${dayConfig.day}`}
          type="date"
          className="input"
          value={dayConfig.date}
          onChange={(event) => onChange({ date: event.target.value })}
        />
      </div>
      <div className="day-config-panel__field">
        <label htmlFor={`start-${dayConfig.day}`}>Startzeit</label>
        <input
          id={`start-${dayConfig.day}`}
          type="time"
          className="input"
          value={dayConfig.startTime}
          onChange={(event) => onChange({ startTime: event.target.value })}
        />
      </div>
      <div className="day-config-panel__field">
        <label htmlFor={`end-${dayConfig.day}`}>Endzeit</label>
        <input
          id={`end-${dayConfig.day}`}
          type="time"
          className="input"
          value={dayConfig.endTime}
          onChange={(event) => onChange({ endTime: event.target.value })}
        />
      </div>
      <div className="day-config-panel__field">
        <label htmlFor={`length-${dayConfig.day}`}>Slotlänge (Minuten)</label>
        <input
          id={`length-${dayConfig.day}`}
          type="number"
          min={15}
          step={5}
          className="input"
          value={dayConfig.slotLengthMinutes}
          onChange={(event) => onChange({ slotLengthMinutes: Number(event.target.value) })}
        />
      </div>
      <div className="day-config-panel__actions">
        <button type="button" className="btn btn--secondary-outline" onClick={onGenerate}>
          {slotCount > 0 ? 'Slots neu erzeugen' : 'Slots erzeugen'}
        </button>
        <button type="button" className="btn btn--danger-outline" onClick={onRemove}>
          Spieltag entfernen
        </button>
      </div>
    </div>
  )
}
