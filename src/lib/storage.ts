import type { AppState } from '../types'
import { createInitialTeams } from './initialData'
import { generateGroupMatches } from './groupMatches'
import { generateKoMatches } from './koMatches'
import { DEFAULT_KO_FORMAT_SETTINGS } from './matchResult'
import { toIsoDate } from './scheduling'

const STORAGE_KEY = 'turnier-app-state-v1'

function createSeedState(): AppState {
  const teams = createInitialTeams()
  const matches = [...generateGroupMatches(teams), ...generateKoMatches()]
  return { teams, matches, slots: [], dayConfigs: [], koFormatSettings: DEFAULT_KO_FORMAT_SETTINGS }
}

/**
 * Ergänzt zuvor gespeicherte Zustände (aus älteren Versionen der App) um
 * Felder, die erst später hinzugekommen sind, damit bestehende Turnierdaten
 * beim Laden nicht verloren gehen.
 */
function upgradeState(state: AppState): AppState {
  const hasKoMatches = state.matches.some((match) => match.type !== 'group')
  const today = toIsoDate(new Date())
  return {
    ...state,
    matches: hasKoMatches ? state.matches : [...state.matches, ...generateKoMatches()],
    dayConfigs: (state.dayConfigs ?? []).map((config) => ({
      ...config,
      date: config.date || today,
    })),
    koFormatSettings: state.koFormatSettings ?? DEFAULT_KO_FORMAT_SETTINGS,
  }
}

/**
 * Prüft grob, ob ein geparstes JSON-Objekt wie ein gültiger App-Zustand
 * aussieht (Teams/Matches vorhanden), bevor es übernommen wird.
 */
function isValidAppStateShape(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppState>
  return Array.isArray(candidate.teams) && candidate.teams.length > 0 && Array.isArray(candidate.matches)
}

/** Ergänzt fehlende Arrays (z.B. aus älteren Exporten) durch leere Defaults. */
function withArrayDefaults(state: AppState): AppState {
  return {
    ...state,
    slots: state.slots ?? [],
    dayConfigs: state.dayConfigs ?? [],
  }
}

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return createSeedState()
  try {
    const parsed = JSON.parse(raw)
    if (!isValidAppStateShape(parsed)) return createSeedState()
    return upgradeState(withArrayDefaults(parsed))
  } catch {
    return createSeedState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetState(): AppState {
  localStorage.removeItem(STORAGE_KEY)
  return createSeedState()
}

export function exportStateToFile(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  link.href = url
  link.download = `turnier-export-${timestamp}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function importStateFromFile(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (!isValidAppStateShape(parsed)) {
          reject(new Error('Die Datei enthält kein gültiges Turnier-JSON (Teams/Spiele fehlen).'))
          return
        }
        resolve(upgradeState(withArrayDefaults(parsed)))
      } catch {
        reject(new Error('Die Datei enthält kein gültiges Turnier-JSON.'))
      }
    }
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'))
    reader.readAsText(file)
  })
}
