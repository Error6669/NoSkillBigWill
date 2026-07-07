import type { Team } from '../types'

/**
 * Liefert die Menge der (normalisierten, kleingeschriebenen) Spielernamen,
 * die mehrfach im Turnier vorkommen - für eine optionale Warnung, kein
 * Blocker.
 */
export function getDuplicateNames(teams: Team[]): Set<string> {
  const counts = new Map<string, number>()

  for (const team of teams) {
    for (const name of [team.player1Name, team.player2Name]) {
      const normalized = name.trim().toLowerCase()
      if (!normalized) continue
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
    }
  }

  const duplicates = new Set<string>()
  for (const [name, count] of counts) {
    if (count > 1) duplicates.add(name)
  }
  return duplicates
}
