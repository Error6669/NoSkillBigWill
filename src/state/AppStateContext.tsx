import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { AppState, DayConfig, KoFormatSettings, Match, MatchTiebreak, Result, SetScore, Team } from '../types'
import { loadState, resetState, saveState } from '../lib/storage'
import { createSampleState } from '../lib/sampleData'
import { buildDisplayName } from '../lib/teams'
import { createDefaultDayConfig, generateSlotsForDay } from '../lib/scheduling'
import { applyResultToMatch, createDefaultSets, getMatchFormat, isTiebreakScore } from '../lib/matchResult'
import { useAuth } from './AuthContext'

/** Setzt den Verplanungs-Status, ohne ein bereits abgeschlossenes Match zurückzusetzen. */
function withScheduleStatus(match: Match, scheduledSlotId: string | undefined): Match {
  if (match.status === 'completed' || match.status === 'walkover') {
    return { ...match, scheduledSlotId }
  }
  return { ...match, scheduledSlotId, status: scheduledSlotId ? 'scheduled' : 'unscheduled' }
}

/** Verpackt eine verändernde Aktion so, dass sie außerhalb des Bearbeitungsmodus nichts tut. */
function guardAction<Args extends unknown[]>(
  isEditMode: boolean,
  fn: (...args: Args) => void,
): (...args: Args) => void {
  return (...args: Args) => {
    if (!isEditMode) return
    fn(...args)
  }
}

interface AppStateContextValue {
  state: AppState
  setState: Dispatch<SetStateAction<AppState>>
  updateTeam: (
    teamId: string,
    updates: Partial<Pick<Team, 'player1Name' | 'player2Name'>>,
  ) => void
  resetAll: () => void
  loadSampleData: () => void
  setKoFormatSetting: (round: keyof KoFormatSettings, mode: KoFormatSettings[keyof KoFormatSettings]) => void
  addDayConfig: () => void
  updateDayConfig: (
    day: number,
    updates: Partial<Pick<DayConfig, 'date' | 'startTime' | 'endTime' | 'slotLengthMinutes'>>,
  ) => void
  removeDayConfig: (day: number) => void
  regenerateSlotsForDay: (day: number) => void
  assignMatchToSlot: (matchId: string, slotId: string) => void
  unassignSlot: (slotId: string) => void
  swapSlotAssignments: (slotIdA: string, slotIdB: string) => void
  updateMatchSet: (
    matchId: string,
    setIndex: 0 | 1,
    updates: Partial<Pick<SetScore, 'team1Games' | 'team2Games'>>,
  ) => void
  updateMatchTiebreak: (matchId: string, updates: Partial<MatchTiebreak>) => void
  setMatchWalkover: (matchId: string, walkoverTeamId: string | null) => void
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const updateTeam: AppStateContextValue['updateTeam'] = (teamId, updates) => {
    setState((prev) => ({
      ...prev,
      teams: prev.teams.map((team) => {
        if (team.id !== teamId) return team
        const player1Name = updates.player1Name ?? team.player1Name
        const player2Name = updates.player2Name ?? team.player2Name
        return {
          ...team,
          player1Name,
          player2Name,
          displayName: buildDisplayName(player1Name, player2Name),
        }
      }),
    }))
  }

  const resetAll = () => {
    setState(resetState())
  }

  const loadSampleData: AppStateContextValue['loadSampleData'] = () => {
    setState(createSampleState())
  }

  const setKoFormatSetting: AppStateContextValue['setKoFormatSetting'] = (round, mode) => {
    setState((prev) => ({
      ...prev,
      koFormatSettings: { ...prev.koFormatSettings, [round]: mode },
    }))
  }

  const addDayConfig: AppStateContextValue['addDayConfig'] = () => {
    setState((prev) => {
      const nextDayNumber =
        prev.dayConfigs.reduce((max, day) => Math.max(max, day.day), 0) + 1
      return {
        ...prev,
        dayConfigs: [
          ...prev.dayConfigs,
          createDefaultDayConfig(nextDayNumber, prev.dayConfigs),
        ],
      }
    })
  }

  const updateDayConfig: AppStateContextValue['updateDayConfig'] = (day, updates) => {
    setState((prev) => ({
      ...prev,
      dayConfigs: prev.dayConfigs.map((config) =>
        config.day === day ? { ...config, ...updates } : config,
      ),
    }))
  }

  const removeDayConfig: AppStateContextValue['removeDayConfig'] = (day) => {
    setState((prev) => {
      const removedSlotIds = new Set(
        prev.slots.filter((slot) => slot.day === day).map((slot) => slot.id),
      )
      return {
        ...prev,
        dayConfigs: prev.dayConfigs.filter((config) => config.day !== day),
        slots: prev.slots.filter((slot) => slot.day !== day),
        matches: prev.matches.map((match) =>
          match.scheduledSlotId && removedSlotIds.has(match.scheduledSlotId)
            ? withScheduleStatus(match, undefined)
            : match,
        ),
      }
    })
  }

  const regenerateSlotsForDay: AppStateContextValue['regenerateSlotsForDay'] = (day) => {
    setState((prev) => {
      const config = prev.dayConfigs.find((entry) => entry.day === day)
      if (!config) return prev

      const oldSlotIds = new Set(
        prev.slots.filter((slot) => slot.day === day).map((slot) => slot.id),
      )
      const newSlots = generateSlotsForDay(config)

      return {
        ...prev,
        slots: [...prev.slots.filter((slot) => slot.day !== day), ...newSlots],
        matches: prev.matches.map((match) =>
          match.scheduledSlotId && oldSlotIds.has(match.scheduledSlotId)
            ? withScheduleStatus(match, undefined)
            : match,
        ),
      }
    })
  }

  const assignMatchToSlot: AppStateContextValue['assignMatchToSlot'] = (
    matchId,
    slotId,
  ) => {
    setState((prev) => {
      const targetSlot = prev.slots.find((slot) => slot.id === slotId)
      if (!targetSlot || targetSlot.assignedMatchId) return prev

      return {
        ...prev,
        slots: prev.slots.map((slot) =>
          slot.id === slotId ? { ...slot, assignedMatchId: matchId } : slot,
        ),
        matches: prev.matches.map((match) =>
          match.id === matchId ? withScheduleStatus(match, slotId) : match,
        ),
      }
    })
  }

  const swapSlotAssignments: AppStateContextValue['swapSlotAssignments'] = (
    slotIdA,
    slotIdB,
  ) => {
    setState((prev) => {
      const slotA = prev.slots.find((slot) => slot.id === slotIdA)
      const slotB = prev.slots.find((slot) => slot.id === slotIdB)
      if (!slotA?.assignedMatchId || !slotB?.assignedMatchId) return prev
      const matchIdA = slotA.assignedMatchId
      const matchIdB = slotB.assignedMatchId

      return {
        ...prev,
        slots: prev.slots.map((slot) => {
          if (slot.id === slotIdA) return { ...slot, assignedMatchId: matchIdB }
          if (slot.id === slotIdB) return { ...slot, assignedMatchId: matchIdA }
          return slot
        }),
        matches: prev.matches.map((match) => {
          if (match.id === matchIdA) return { ...match, scheduledSlotId: slotIdB }
          if (match.id === matchIdB) return { ...match, scheduledSlotId: slotIdA }
          return match
        }),
      }
    })
  }

  const unassignSlot: AppStateContextValue['unassignSlot'] = (slotId) => {
    setState((prev) => {
      const slot = prev.slots.find((entry) => entry.id === slotId)
      if (!slot?.assignedMatchId) return prev
      const matchId = slot.assignedMatchId

      return {
        ...prev,
        slots: prev.slots.map((entry) =>
          entry.id === slotId ? { ...entry, assignedMatchId: undefined } : entry,
        ),
        matches: prev.matches.map((match) =>
          match.id === matchId ? withScheduleStatus(match, undefined) : match,
        ),
      }
    })
  }

  const updateMatchSet: AppStateContextValue['updateMatchSet'] = (
    matchId,
    setIndex,
    updates,
  ) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((match) => {
        if (match.id !== matchId) return match
        const currentResult: Result = match.result ?? {
          sets: createDefaultSets(),
          walkover: false,
          gamesTeam1: 0,
          gamesTeam2: 0,
        }
        const format = getMatchFormat(match.type, prev.koFormatSettings)
        const sets = currentResult.sets.map((set, index) => {
          if (index !== setIndex) return set
          const merged = { ...set, ...updates }
          return { ...merged, tiebreak: isTiebreakScore(merged, format) }
        })
        return applyResultToMatch(match, { ...currentResult, sets }, prev.teams, prev.matches)
      }),
    }))
  }

  const updateMatchTiebreak: AppStateContextValue['updateMatchTiebreak'] = (
    matchId,
    updates,
  ) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((match) => {
        if (match.id !== matchId) return match
        const currentResult: Result = match.result ?? {
          sets: createDefaultSets(),
          walkover: false,
          gamesTeam1: 0,
          gamesTeam2: 0,
        }
        const matchTiebreak: MatchTiebreak = {
          team1Points: currentResult.matchTiebreak?.team1Points ?? 0,
          team2Points: currentResult.matchTiebreak?.team2Points ?? 0,
          ...updates,
        }
        return applyResultToMatch(match, { ...currentResult, matchTiebreak }, prev.teams, prev.matches)
      }),
    }))
  }

  const setMatchWalkover: AppStateContextValue['setMatchWalkover'] = (
    matchId,
    walkoverTeamId,
  ) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.map((match) => {
        if (match.id !== matchId) return match
        const currentResult: Result = match.result ?? {
          sets: createDefaultSets(),
          walkover: false,
          gamesTeam1: 0,
          gamesTeam2: 0,
        }
        return applyResultToMatch(
          match,
          {
            ...currentResult,
            walkover: walkoverTeamId !== null,
            walkoverTeam: walkoverTeamId ?? undefined,
          },
          prev.teams,
          prev.matches,
        )
      }),
    }))
  }

  const { isEditMode } = useAuth()

  const value = useMemo(
    () => ({
      state,
      // Alle folgenden Funktionen verändern den Turnierzustand und werden
      // deshalb zentral an einer Stelle gegen den Bearbeitungsschutz
      // abgesichert: Solange isEditMode false ist, tun sie schlicht nichts,
      // egal von welcher Komponente aus sie aufgerufen werden.
      setState: guardAction(isEditMode, setState),
      updateTeam: guardAction(isEditMode, updateTeam),
      resetAll: guardAction(isEditMode, resetAll),
      loadSampleData: guardAction(isEditMode, loadSampleData),
      setKoFormatSetting: guardAction(isEditMode, setKoFormatSetting),
      addDayConfig: guardAction(isEditMode, addDayConfig),
      updateDayConfig: guardAction(isEditMode, updateDayConfig),
      removeDayConfig: guardAction(isEditMode, removeDayConfig),
      regenerateSlotsForDay: guardAction(isEditMode, regenerateSlotsForDay),
      assignMatchToSlot: guardAction(isEditMode, assignMatchToSlot),
      unassignSlot: guardAction(isEditMode, unassignSlot),
      swapSlotAssignments: guardAction(isEditMode, swapSlotAssignments),
      updateMatchSet: guardAction(isEditMode, updateMatchSet),
      updateMatchTiebreak: guardAction(isEditMode, updateMatchTiebreak),
      setMatchWalkover: guardAction(isEditMode, setMatchWalkover),
    }),
    [state, isEditMode],
  )

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) {
    throw new Error('useAppState muss innerhalb von AppStateProvider verwendet werden')
  }
  return ctx
}
