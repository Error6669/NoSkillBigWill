import type { Match, MatchType } from '../types'

const TYPE_ORDER: Record<MatchType, number> = {
  group: 0,
  quarterfinal: 1,
  semifinal: 2,
  final: 3,
  thirdPlace: 4,
}

/**
 * Sortierung für die Ergebnisliste: Gruppenspiele (A-H), dann Viertelfinale,
 * Halbfinale, Finale, Kleines Finale.
 */
export function sortMatchesForResults(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const typeDiff = TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
    if (typeDiff !== 0) return typeDiff
    if (a.type === 'group' && b.type === 'group' && a.groupId !== b.groupId) {
      return (a.groupId ?? '').localeCompare(b.groupId ?? '')
    }
    return a.id.localeCompare(b.id)
  })
}

export function getMatchSectionTitle(match: Match): string {
  switch (match.type) {
    case 'group':
      return `Gruppe ${match.groupId}`
    case 'quarterfinal':
      return 'Viertelfinale'
    case 'semifinal':
      return 'Halbfinale'
    case 'final':
      return 'Finale'
    case 'thirdPlace':
      return 'Kleines Finale'
    default:
      return ''
  }
}
