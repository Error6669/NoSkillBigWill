import type { AppState, MatchStatus } from '../types'
import { GROUP_IDS } from './initialData'
import { resolveTeamReference } from './koResolution'
import { formatResultSummary } from './matchResult'
import { getMatchScheduleText } from './matchDisplay'

export interface MyGameInfo {
  matchLabel: string
  opponentText: string
  statusLabel: string
  statusClass: MatchStatus
  resultText?: string
  scheduleText?: string
}

export interface MyGamesGroup {
  groupId: string
  teams: { id: string; displayName: string }[]
}

export interface MyGamesTeamRef {
  id: string
  groupId: string
  displayName: string
}

export interface MyGamesData {
  groups: MyGamesGroup[]
  teamsById: Record<string, MyGamesTeamRef>
  matchesByTeam: Record<string, MyGameInfo[]>
}

const STATUS_LABELS: Record<MatchStatus, string> = {
  unscheduled: 'offen',
  scheduled: 'verplant',
  completed: 'abgeschlossen',
  walkover: 'kampflos',
}

/**
 * Bereitet für jedes Team die Liste seiner Spiele auf (Gegner, Status,
 * Ergebnis, Termin/Platz) - Grundlage für den "Meine Spiele"-HTML-Export.
 * Berücksichtigt nur Matches, deren Teilnehmer final feststehen (bei
 * Gruppenspielen immer, bei KO-Spielen sobald die vorherige Runde
 * abgeschlossen ist) - noch offene KO-Teilnahmen werden hier bewusst nicht
 * gezeigt, um Spieler nicht mit unsicheren Terminen zu verwirren.
 */
export function buildMyGamesData(state: AppState): MyGamesData {
  const groups: MyGamesGroup[] = GROUP_IDS.map((groupId) => ({
    groupId,
    teams: state.teams
      .filter((team) => team.groupId === groupId)
      .sort((a, b) => a.position - b.position)
      .map((team) => ({ id: team.id, displayName: team.displayName })),
  }))

  const teamsById: MyGamesData['teamsById'] = {}
  for (const team of state.teams) {
    teamsById[team.id] = { id: team.id, groupId: team.groupId, displayName: team.displayName }
  }

  const matchesByTeam: MyGamesData['matchesByTeam'] = {}
  for (const team of state.teams) {
    matchesByTeam[team.id] = []
  }

  for (const match of state.matches) {
    const resolution1 = resolveTeamReference(match.team1Ref, state.teams, state.matches)
    const resolution2 = resolveTeamReference(match.team2Ref, state.teams, state.matches)
    const team1Id = resolution1.isFinal ? resolution1.teamId : undefined
    const team2Id = resolution2.isFinal ? resolution2.teamId : undefined

    const perspectives: [string | undefined, string | undefined][] = [
      [team1Id, team2Id],
      [team2Id, team1Id],
    ]

    for (const [selfId, opponentId] of perspectives) {
      if (!selfId || !matchesByTeam[selfId]) continue

      const opponentTeam = opponentId ? teamsById[opponentId] : undefined
      const opponentText = opponentTeam
        ? `${opponentTeam.id} ${opponentTeam.displayName || '– offen –'}`
        : '?'

      const scheduleText = getMatchScheduleText(match, state.slots, state.dayConfigs)

      matchesByTeam[selfId].push({
        matchLabel: match.type === 'group' ? `Gruppe ${match.groupId}` : match.label,
        opponentText,
        statusLabel: STATUS_LABELS[match.status],
        statusClass: match.status,
        resultText: formatResultSummary(match),
        scheduleText,
      })
    }
  }

  return { groups, teamsById, matchesByTeam }
}
