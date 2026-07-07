import type { Match, Team, TeamReference } from '../types'
import { computeGroupStandings, isGroupFinished } from './standings'

export interface ResolvedReference {
  teamId?: string
  /** true = feststehend (Gruppe fertig / Quell-Match final entschieden) */
  isFinal: boolean
}

function isMatchFinalAndDecided(match: Match | undefined, teams: Team[], matches: Match[]): boolean {
  if (!match) return false
  if (match.status !== 'completed' && match.status !== 'walkover') return false
  const r1 = resolveTeamReference(match.team1Ref, teams, matches)
  const r2 = resolveTeamReference(match.team2Ref, teams, matches)
  return r1.isFinal && r2.isFinal
}

/**
 * Löst eine Team-Referenz rein rechnerisch auf - ohne jemals die
 * gespeicherte Referenz zu verändern. Dadurch bleibt das Ergebnis immer
 * konsistent mit dem aktuellen Datenstand, auch wenn ein Gruppenspiel im
 * Nachhinein korrigiert wird und eine Gruppe dadurch wieder als "nicht
 * abgeschlossen" gilt.
 *
 * - team: immer final.
 * - groupWinner: final, sobald alle Gruppenspiele entschieden sind; vorher
 *   ggf. der aktuell führende Gruppenerste (nur wenn schon mind. ein Spiel
 *   entschieden ist).
 * - matchWinner/matchLoser: final, sobald das referenzierte Match selbst
 *   final entschieden ist (rekursiv, da dessen Teilnehmer ihrerseits final
 *   sein müssen).
 */
export function resolveTeamReference(
  ref: TeamReference,
  teams: Team[],
  matches: Match[],
): ResolvedReference {
  switch (ref.kind) {
    case 'team':
      return { teamId: ref.teamId, isFinal: true }

    case 'groupWinner': {
      const groupMatches = matches.filter((m) => m.type === 'group' && m.groupId === ref.groupId)
      const hasAnyDecided = groupMatches.some(
        (m) => m.status === 'completed' || m.status === 'walkover',
      )
      if (!hasAnyDecided) return { isFinal: false }

      const teamIds = teams.filter((t) => t.groupId === ref.groupId).map((t) => t.id)
      const standings = computeGroupStandings(teamIds, groupMatches)
      return { teamId: standings[0]?.teamId, isFinal: isGroupFinished(groupMatches) }
    }

    case 'matchWinner': {
      const source = matches.find((m) => m.id === ref.matchId)
      if (!isMatchFinalAndDecided(source, teams, matches)) return { isFinal: false }
      return { teamId: source!.winner, isFinal: Boolean(source!.winner) }
    }

    case 'matchLoser': {
      const source = matches.find((m) => m.id === ref.matchId)
      if (!isMatchFinalAndDecided(source, teams, matches)) return { isFinal: false }
      return { teamId: source!.loser, isFinal: Boolean(source!.loser) }
    }

    default:
      return { isFinal: false }
  }
}
