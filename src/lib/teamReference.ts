import type { Match, Team, TeamReference } from '../types'
import { resolveTeamReference } from './koResolution'

export function resolveTeamRef(ref: TeamReference, teams: Team[]): Team | undefined {
  if (ref.kind !== 'team') return undefined
  return teams.find((team) => team.id === ref.teamId)
}

export function formatTeamLabel(teamId: string, teams: Team[]): string {
  const team = teams.find((entry) => entry.id === teamId)
  if (!team) return teamId
  return team.displayName ? `${team.id} ${team.displayName}` : team.id
}

export function describePlaceholder(ref: TeamReference, matches: Match[]): string {
  switch (ref.kind) {
    case 'groupWinner':
      return `Sieger Gruppe ${ref.groupId}`
    case 'matchWinner': {
      const match = matches.find((m) => m.id === ref.matchId)
      return `Sieger ${match?.label ?? ref.matchId}`
    }
    case 'matchLoser': {
      const match = matches.find((m) => m.id === ref.matchId)
      return `Verlierer ${match?.label ?? ref.matchId}`
    }
    default:
      return '?'
  }
}

/**
 * Beschreibt eine Team-Referenz für die Anzeige: den echten Teamnamen sobald
 * final feststeht, andernfalls den aktuell führenden Gruppenersten explizit
 * als "vorläufig" markiert (sofern schon ein Gruppenspiel entschieden ist),
 * sonst den generischen Platzhalter (z.B. "Sieger Gruppe A").
 */
export function describeTeamReference(
  ref: TeamReference,
  teams: Team[],
  matches: Match[],
): string {
  const resolution = resolveTeamReference(ref, teams, matches)

  if (resolution.teamId) {
    const label = formatTeamLabel(resolution.teamId, teams)
    if (resolution.isFinal) return label
    return `${describePlaceholder(ref, matches)} (vorläufig: ${label})`
  }

  return describePlaceholder(ref, matches)
}
