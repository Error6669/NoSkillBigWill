import type { KoFormatSettings, Match, MatchTiebreak, MatchType, Result, SetScore, Team } from '../types'
import { resolveTeamReference } from './koResolution'

export function createDefaultSets(): SetScore[] {
  return [
    { team1Games: 0, team2Games: 0, tiebreak: false },
    { team1Games: 0, team2Games: 0, tiebreak: false },
  ]
}

/**
 * Kurzer Textstand eines entschiedenen Matches, z.B. "4:2, 4:1" oder
 * "kampflos". Undefined, solange kein Ergebnis vorliegt.
 */
export function formatResultSummary(match: Match): string | undefined {
  if (match.status === 'walkover') return 'kampflos'
  if (match.status !== 'completed' || !match.result) return undefined

  const setsText = match.result.sets.map((set) => `${set.team1Games}:${set.team2Games}`).join(', ')
  const tiebreak = match.result.matchTiebreak
  const tiebreakText = tiebreak ? ` (MTB ${tiebreak.team1Points}:${tiebreak.team2Points})` : ''
  return `${setsText}${tiebreakText}`
}

export type MatchWinnerSide = 'team1' | 'team2' | null

export function getSetWinnerSide(set: SetScore): MatchWinnerSide {
  if (set.team1Games === set.team2Games) return null
  return set.team1Games > set.team2Games ? 'team1' : 'team2'
}

/**
 * Ein Match besteht aus genau 2 Sätzen (kein Best-of-3). Gewinnt eine
 * Mannschaft beide Sätze, steht der Sieger fest. Bei 1:1 entscheidet der
 * Matchtiebreak.
 */
export function computeWinnerSide(
  sets: SetScore[],
  matchTiebreak?: MatchTiebreak,
): MatchWinnerSide {
  if (sets.length < 2) return null
  const side1 = getSetWinnerSide(sets[0])
  const side2 = getSetWinnerSide(sets[1])
  if (!side1 || !side2) return null
  if (side1 === side2) return side1

  if (!matchTiebreak || matchTiebreak.team1Points === matchTiebreak.team2Points) {
    return null
  }
  return matchTiebreak.team1Points > matchTiebreak.team2Points ? 'team1' : 'team2'
}

export function sumGames(sets: SetScore[]): { gamesTeam1: number; gamesTeam2: number } {
  return sets.reduce(
    (acc, set) => ({
      gamesTeam1: acc.gamesTeam1 + (set.team1Games || 0),
      gamesTeam2: acc.gamesTeam2 + (set.team2Games || 0),
    }),
    { gamesTeam1: 0, gamesTeam2: 0 },
  )
}

export interface MatchFormat {
  setGames: number
  setTiebreakTo: number
  matchTiebreakTo: number
}

const SHORT_FORMAT: MatchFormat = { setGames: 4, setTiebreakTo: 5, matchTiebreakTo: 7 }
const LONG_FORMAT: MatchFormat = { setGames: 6, setTiebreakTo: 7, matchTiebreakTo: 10 }

/** Default, falls noch keine Einstellung gewählt wurde (entspricht dem bisherigen, fest codierten Verhalten). */
export const DEFAULT_KO_FORMAT_SETTINGS: KoFormatSettings = {
  quarterfinal: 'short',
  semifinal: 'long',
  final: 'long',
}

/**
 * Ermittelt das Satzformat für ein Match. Gruppenspiele sind immer "short"
 * (fest). Bei KO-Spielen (Viertelfinale/Halbfinale/Finale inkl. Kleines
 * Finale) ist es pro Runde separat einstellbar über koFormatSettings.
 */
export function getMatchFormat(
  type: MatchType,
  koFormatSettings: KoFormatSettings = DEFAULT_KO_FORMAT_SETTINGS,
): MatchFormat {
  if (type === 'group') return SHORT_FORMAT

  const mode =
    type === 'quarterfinal'
      ? koFormatSettings.quarterfinal
      : type === 'semifinal'
        ? koFormatSettings.semifinal
        : koFormatSettings.final

  return mode === 'long' ? LONG_FORMAT : SHORT_FORMAT
}

/**
 * Ein Satz gilt als per Tiebreak entschieden, wenn der Spielstand genau dem
 * Tiebreak-Ergebnis des jeweiligen Formats entspricht (z.B. 5:4 bzw. 7:6).
 * Das muss nicht manuell markiert werden, sondern ergibt sich aus den Games.
 */
export function isTiebreakScore(
  set: { team1Games: number; team2Games: number },
  format: MatchFormat,
): boolean {
  const { setGames, setTiebreakTo } = format
  return (
    (set.team1Games === setTiebreakTo && set.team2Games === setGames) ||
    (set.team2Games === setTiebreakTo && set.team1Games === setGames)
  )
}

/**
 * Prüft einen (nicht-leeren) Satzstand gegen das Regelwerk des jeweiligen
 * Formats. Gibt eine kurze Fehlermeldung zurück, wenn der Stand so nicht
 * zustande kommen kann (z.B. mehr Games als das Tiebreak-Ergebnis erlaubt,
 * oder ein Spielstand, der keinem gültigen Satzergebnis entspricht).
 * Ein 0:0-Stand gilt als "noch nicht eingetragen" und wird nicht bemängelt.
 */
export function getSetScoreIssue(
  set: { team1Games: number; team2Games: number },
  format: MatchFormat,
): string | undefined {
  const { team1Games: a, team2Games: b } = set
  if (a === 0 && b === 0) return undefined
  if (a < 0 || b < 0 || !Number.isInteger(a) || !Number.isInteger(b)) {
    return 'Ungültig: Spiele müssen ganze, nicht-negative Zahlen sein'
  }

  const { setGames, setTiebreakTo } = format
  const winner = Math.max(a, b)
  const loser = Math.min(a, b)

  if (winner > setTiebreakTo) {
    return `Ungültig: maximal ${setTiebreakTo} Spiele in diesem Format möglich`
  }
  if (a === b) {
    return 'Ungültig: ein Satz kann nicht unentschieden enden'
  }
  const isRegularWin = winner === setGames && loser < setGames
  const isTiebreakWin = winner === setTiebreakTo && loser === setGames
  if (!isRegularWin && !isTiebreakWin) {
    return `Ungültiger Satzstand für dieses Format (bis ${setGames}, Tiebreak ${setTiebreakTo}:${setGames})`
  }
  return undefined
}

/**
 * Prüft einen (nicht-leeren) Matchtiebreak-Stand: mindestens bis zum
 * Zielwert des Formats (7 bzw. 10) und mit 2 Punkten Vorsprung gewonnen,
 * analog zu einem regulären Satz-Tiebreak.
 */
export function getMatchTiebreakIssue(
  tiebreak: { team1Points: number; team2Points: number },
  format: MatchFormat,
): string | undefined {
  const { team1Points: a, team2Points: b } = tiebreak
  if (a === 0 && b === 0) return undefined
  if (a < 0 || b < 0 || !Number.isInteger(a) || !Number.isInteger(b)) {
    return 'Ungültig: Punkte müssen ganze, nicht-negative Zahlen sein'
  }
  if (a === b) {
    return 'Ungültig: ein Matchtiebreak kann nicht unentschieden enden'
  }
  const { matchTiebreakTo } = format
  const winner = Math.max(a, b)
  const loser = Math.min(a, b)
  const validWin = winner >= matchTiebreakTo && winner - loser >= 2
  if (!validWin) {
    return `Ungültiger Matchtiebreak-Stand (mind. ${matchTiebreakTo}, 2 Punkte Vorsprung)`
  }
  return undefined
}

/**
 * Löst die aktuell feststehenden (finalen) Teilnehmer eines Matches auf.
 * Ergebnisse dürfen nur für Matches gespeichert werden, deren Teilnehmer
 * final feststehen (bei Gruppenspielen immer der Fall, bei KO-Spielen erst
 * sobald die vorherige Runde abgeschlossen ist).
 */
function resolvedTeamIds(
  match: Match,
  teams: Team[],
  allMatches: Match[],
): { team1Id?: string; team2Id?: string } {
  const r1 = resolveTeamReference(match.team1Ref, teams, allMatches)
  const r2 = resolveTeamReference(match.team2Ref, teams, allMatches)
  return {
    team1Id: r1.isFinal ? r1.teamId : undefined,
    team2Id: r2.isFinal ? r2.teamId : undefined,
  }
}

/**
 * Wendet einen (teilweise) geänderten Result-Entwurf auf ein Match an und
 * berechnet Sieger/Verlierer/Status neu. Zentrale Stelle, damit Ergebnis-
 * Eingabe und w.o.-Wertung konsistent denselben Berechnungsweg nutzen.
 */
export function applyResultToMatch(
  match: Match,
  result: Result,
  teams: Team[],
  allMatches: Match[],
): Match {
  const { team1Id, team2Id } = resolvedTeamIds(match, teams, allMatches)

  if (result.walkover) {
    const loserId = result.walkoverTeam
    const winnerId = loserId === team1Id ? team2Id : loserId === team2Id ? team1Id : undefined
    const finalResult: Result = {
      ...result,
      sets: result.sets.length === 2 ? result.sets : createDefaultSets(),
      gamesTeam1: 0,
      gamesTeam2: 0,
      winnerTeamId: winnerId,
    }
    return { ...match, result: finalResult, winner: winnerId, loser: loserId, status: 'walkover' }
  }

  const winnerSide = computeWinnerSide(result.sets, result.matchTiebreak)
  const winnerTeamId = winnerSide === 'team1' ? team1Id : winnerSide === 'team2' ? team2Id : undefined
  const loserTeamId = winnerSide === 'team1' ? team2Id : winnerSide === 'team2' ? team1Id : undefined
  const { gamesTeam1, gamesTeam2 } = sumGames(result.sets)

  const finalResult: Result = { ...result, gamesTeam1, gamesTeam2, winnerTeamId }

  return {
    ...match,
    result: finalResult,
    winner: winnerTeamId,
    loser: loserTeamId,
    status: winnerTeamId ? 'completed' : match.scheduledSlotId ? 'scheduled' : 'unscheduled',
  }
}
