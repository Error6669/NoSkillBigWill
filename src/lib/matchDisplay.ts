import type { DayConfig, Match, Slot, Team } from '../types'
import { resolveTeamRef, describeTeamReference } from './teamReference'
import { formatResultSummary } from './matchResult'
import { formatFullDate, formatWeekday } from './scheduling'

function formatTeamId(team: Team | undefined): string {
  return team?.id ?? '?'
}

function formatTeamName(team: Team | undefined): string {
  return team?.displayName || '–'
}

export interface MatchRowDisplay {
  positions: string
  team1Id?: string
  team2Id?: string
  team1Text: string
  team2Text: string
  winnerId?: string
  resultText?: string
}

/**
 * Anzeige-Infos für eine Match-Zeile (Gruppenphase-Tabelle, Ergebnisliste):
 * Positionscode(s), Teilnehmertexte je Seite (getrennt, damit der Sieger
 * gezielt hervorgehoben werden kann) und - sobald ein Ergebnis eingetragen
 * ist - der Spielstand. Bei KO-Spielen wird der aktuelle Auflösungsstand
 * (final oder vorläufig) über describeTeamReference berücksichtigt.
 */
export function getMatchRowDisplay(
  match: Match,
  teams: Team[],
  allMatches: Match[],
): MatchRowDisplay {
  if (match.type === 'group') {
    const team1 = resolveTeamRef(match.team1Ref, teams)
    const team2 = resolveTeamRef(match.team2Ref, teams)
    return {
      positions: `${formatTeamId(team1)} vs. ${formatTeamId(team2)}`,
      team1Id: team1?.id,
      team2Id: team2?.id,
      team1Text: formatTeamName(team1),
      team2Text: formatTeamName(team2),
      winnerId: match.winner,
      resultText: formatResultSummary(match),
    }
  }

  return {
    positions: match.label,
    team1Id: match.team1Ref.kind === 'team' ? match.team1Ref.teamId : undefined,
    team2Id: match.team2Ref.kind === 'team' ? match.team2Ref.teamId : undefined,
    team1Text: describeTeamReference(match.team1Ref, teams, allMatches),
    team2Text: describeTeamReference(match.team2Ref, teams, allMatches),
    winnerId: match.winner,
    resultText: formatResultSummary(match),
  }
}

/**
 * Termin-/Ort-Text eines Matches, sobald es einem Slot zugeordnet ist, z.B.
 * "Sonntag, 05.07.2026 · 10:00–11:00 · Langenstein Platz 2". Undefined,
 * solange das Match noch nicht verplant ist.
 */
export function getMatchScheduleText(
  match: Match,
  slots: Slot[],
  dayConfigs: DayConfig[],
): string | undefined {
  if (!match.scheduledSlotId) return undefined
  const slot = slots.find((entry) => entry.id === match.scheduledSlotId)
  if (!slot) return undefined

  const dayConfig = dayConfigs.find((entry) => entry.day === slot.day)
  const weekday = dayConfig ? formatWeekday(dayConfig.date) : ''
  const dateLabel = dayConfig ? formatFullDate(dayConfig.date) : ''
  return `${weekday}, ${dateLabel} · ${slot.startTime}–${slot.endTime} · ${slot.location} Platz ${slot.court}`
}
