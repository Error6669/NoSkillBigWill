import type { Match, Team } from '../types'
import { describeTeamReference, resolveTeamRef } from './teamReference'

export interface SlotCellLines {
  line1: string
  team1Text: string
  team2Text: string
}

/**
 * Kompakte Darstellung für belegte Slot-Zellen im Plan: Zeile 1 = Kurzcode
 * (z.B. "A1 vs. A2" oder "VF1"), darunter Team 1 und Team 2 auf getrennten
 * Zeilen (Umbruch nach "vs."), damit lange Namen nicht ineinanderlaufen.
 */
export function getSlotCellLines(
  match: Match,
  teams: Team[],
  allMatches: Match[],
): SlotCellLines {
  if (match.type === 'group') {
    const team1 = resolveTeamRef(match.team1Ref, teams)
    const team2 = resolveTeamRef(match.team2Ref, teams)
    return {
      line1: `${team1?.id ?? '?'} vs. ${team2?.id ?? '?'}`,
      team1Text: team1?.displayName || '–',
      team2Text: team2?.displayName || '–',
    }
  }

  const team1Text = describeTeamReference(match.team1Ref, teams, allMatches)
  const team2Text = describeTeamReference(match.team2Ref, teams, allMatches)
  return {
    line1: match.label,
    team1Text,
    team2Text,
  }
}
