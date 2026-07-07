import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../../state/AppStateContext'
import { formatDayTabLabel } from '../../lib/scheduling'
import { getSlotCellLines } from '../../lib/scheduleDisplay'
import { generateSchedulePdf, generateSchedulePdfForDay } from '../../lib/pdf/schedulePdf'
import DayConfigPanel from './DayConfigPanel'
import SlotGrid from './SlotGrid'
import UnassignedMatchesList from './UnassignedMatchesList'

export default function SchedulingView() {
  const {
    state,
    addDayConfig,
    updateDayConfig,
    removeDayConfig,
    regenerateSlotsForDay,
    assignMatchToSlot,
    unassignSlot,
    swapSlotAssignments,
  } = useAppState()

  const [selectedDay, setSelectedDay] = useState<number | null>(
    state.dayConfigs[0]?.day ?? null,
  )
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [swapSelection, setSwapSelection] = useState<string[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const [gridHeight, setGridHeight] = useState<number | undefined>(undefined)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const gridWrapperRef = useRef<HTMLDivElement>(null)
  const gridHeightLocked = useRef(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stillExists = state.dayConfigs.some((config) => config.day === selectedDay)
    if (!stillExists) {
      setSelectedDay(state.dayConfigs[0]?.day ?? null)
      setSelectedSlotId(null)
    }
  }, [state.dayConfigs, selectedDay])

  const currentDayConfig = state.dayConfigs.find((config) => config.day === selectedDay) ?? null
  const daySlots = selectedDay !== null ? state.slots.filter((slot) => slot.day === selectedDay) : []

  useEffect(() => {
    if (gridHeightLocked.current) return
    const el = gridWrapperRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry && !gridHeightLocked.current) {
        setGridHeight(entry.contentRect.height)
        gridHeightLocked.current = true
        observer.disconnect()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [selectedDay, daySlots.length])

  useEffect(() => {
    if (!exportMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [exportMenuOpen])

  const unassignedMatches = state.matches.filter((match) => !match.scheduledSlotId)
  const unassignedGroupMatches = unassignedMatches.filter((match) => match.type === 'group')
  const unassignedKoMatches = unassignedMatches.filter((match) => match.type !== 'group')

  const handleSelectDayTab = (day: number) => {
    setSelectedDay(day)
    setSelectedSlotId(null)
    setSwapSelection([])
  }

  const handleGenerate = () => {
    if (!currentDayConfig) return
    const hasAssignments = daySlots.some((slot) => slot.assignedMatchId)
    if (hasAssignments) {
      const confirmed = window.confirm(
        'Für diesen Spieltag sind bereits Spiele verplant. Beim Neu-Erzeugen der Slots gehen diese Zuordnungen verloren (die Spiele selbst bleiben erhalten, gelten aber wieder als nicht verplant). Fortfahren?',
      )
      if (!confirmed) return
    }
    regenerateSlotsForDay(currentDayConfig.day)
    setSelectedSlotId(null)
  }

  const handleRemoveDay = () => {
    if (!currentDayConfig) return
    const confirmed = window.confirm(
      `${formatDayTabLabel(currentDayConfig.date)} wirklich entfernen? Alle Slot-Zuordnungen dieses Tages gehen verloren.`,
    )
    if (confirmed) {
      removeDayConfig(currentDayConfig.day)
    }
  }

  const handleSelectSlot = (slotId: string) => {
    const slot = state.slots.find((entry) => entry.id === slotId)
    if (slot?.assignedMatchId) {
      setSelectedSlotId(null)
      setSwapSelection((prev) => {
        if (prev.includes(slotId)) return prev.filter((id) => id !== slotId)
        if (prev.length >= 2) return [slotId]
        return [...prev, slotId]
      })
      return
    }
    setSwapSelection([])
    setSelectedSlotId(slotId)
    setFeedback(null)
  }

  const handleUnassignSlot = (slotId: string) => {
    unassignSlot(slotId)
    if (selectedSlotId === slotId) setSelectedSlotId(null)
    setSwapSelection((prev) => prev.filter((id) => id !== slotId))
  }

  const handleSwapMatches = () => {
    if (swapSelection.length !== 2) return
    swapSlotAssignments(swapSelection[0], swapSelection[1])
    setSwapSelection([])
  }

  const handleAssign = (matchId: string) => {
    if (!selectedSlotId) {
      setFeedback('Bitte zuerst einen freien Slot im Plan auswählen.')
      return
    }
    const slot = state.slots.find((entry) => entry.id === selectedSlotId)
    if (slot?.assignedMatchId) {
      setFeedback('Der ausgewählte Slot ist bereits belegt. Bitte zuerst entfernen oder einen freien Slot wählen.')
      return
    }
    assignMatchToSlot(matchId, selectedSlotId)
    setFeedback(null)
    setSelectedSlotId(null)
  }

  const handleExportAllDays = () => {
    const doc = generateSchedulePdf(state)
    const timestamp = new Date().toISOString().slice(0, 10)
    doc.save(`Platzplanung-alle-tage-${timestamp}.pdf`)
    setExportMenuOpen(false)
  }

  const handleExportSingleDay = (day: number, date: string) => {
    const doc = generateSchedulePdfForDay(state, day)
    doc.save(`Platzplanung-${date}.pdf`)
    setExportMenuOpen(false)
  }

  return (
    <section className="scheduling-view">
      <div className="scheduling-header">
        <div>
          <h2>Platzplanung</h2>
          <p>
            {unassignedMatches.length} von {state.matches.length} Spielen noch nicht verplant
          </p>
        </div>
        <div className="scheduling-export" ref={exportMenuRef}>
          <button
            type="button"
            className="btn btn--secondary-outline"
            onClick={() => setExportMenuOpen((open) => !open)}
          >
            Als PDF exportieren
          </button>
          {exportMenuOpen && (
            <div className="scheduling-export__menu">
              <button type="button" onClick={handleExportAllDays}>
                Alle Tage
              </button>
              {[...state.dayConfigs]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((config) => (
                  <button
                    key={config.day}
                    type="button"
                    onClick={() => handleExportSingleDay(config.day, config.date)}
                  >
                    Nur {formatDayTabLabel(config.date)}
                  </button>
                ))}
              {state.dayConfigs.length === 0 && (
                <p className="scheduling-export__empty">Noch keine Spieltage angelegt.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="scheduling-layout">
        <div className="scheduling-main">
          <div className="day-tabs">
            {[...state.dayConfigs]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((config) => (
                <button
                  key={config.day}
                  type="button"
                  className={
                    selectedDay === config.day ? 'day-tab day-tab--active' : 'day-tab'
                  }
                  onClick={() => handleSelectDayTab(config.day)}
                >
                  {formatDayTabLabel(config.date)}
                </button>
              ))}
            <button type="button" className="day-tab day-tab--add" onClick={addDayConfig}>
              + Spieltag
            </button>
          </div>

          {currentDayConfig ? (
            <>
              <DayConfigPanel
                dayConfig={currentDayConfig}
                slotCount={daySlots.length}
                onChange={(updates) => updateDayConfig(currentDayConfig.day, updates)}
                onGenerate={handleGenerate}
                onRemove={handleRemoveDay}
              />
              {swapSelection.length === 2 && (
                <div className="scheduling-swap-bar">
                  <span>
                    {swapSelection
                      .map((slotId) => {
                        const slot = state.slots.find((entry) => entry.id === slotId)
                        const match = state.matches.find((m) => m.id === slot?.assignedMatchId)
                        return match ? getSlotCellLines(match, state.teams, state.matches).line1 : '?'
                      })
                      .join(' ⇄ ')}
                  </span>
                  <button type="button" className="btn btn--primary" onClick={handleSwapMatches}>
                    Spiele tauschen
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary-outline"
                    onClick={() => setSwapSelection([])}
                  >
                    Abbrechen
                  </button>
                </div>
              )}
              {daySlots.length > 0 ? (
                <div ref={gridWrapperRef}>
                  <SlotGrid
                    slots={daySlots}
                    matches={state.matches}
                    teams={state.teams}
                    selectedSlotId={selectedSlotId}
                    swapSelection={swapSelection}
                    onSelectSlot={handleSelectSlot}
                    onUnassignSlot={handleUnassignSlot}
                  />
                </div>
              ) : (
                <p className="scheduling-empty-hint">
                  Noch keine Slots für diesen Spieltag – Zeiten/Slotlänge einstellen und
                  "Slots erzeugen" klicken.
                </p>
              )}
            </>
          ) : (
            <p className="scheduling-empty-hint">
              Noch kein Spieltag angelegt – über "+ Spieltag" einen ersten Spieltag
              hinzufügen.
            </p>
          )}
        </div>

        <aside
          className="scheduling-sidebar"
          style={gridHeight ? { maxHeight: gridHeight, overflowY: 'auto' } : undefined}
        >
          {feedback && <div className="scheduling-feedback">{feedback}</div>}
          <UnassignedMatchesList
            groupMatches={unassignedGroupMatches}
            koMatches={unassignedKoMatches}
            teams={state.teams}
            allMatches={state.matches}
            hasSelectedSlot={Boolean(selectedSlotId)}
            onAssign={handleAssign}
          />
        </aside>
      </div>
    </section>
  )
}
