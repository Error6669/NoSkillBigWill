import type { Match, Team } from '../types'
import { GROUP_IDS } from './initialData'

/**
 * Erzeugt für jede Gruppe alle Round-Robin-Paarungen (jeder gegen jeden).
 * Bei 4 Teams pro Gruppe ergeben sich 6 Spiele, bei 8 Gruppen also 48 insgesamt.
 * Die Zuordnung basiert auf den festen Startplätzen (z.B. A1 vs A2), nicht auf
 * den eingetragenen Spielernamen — sie steht daher von Anfang an fest.
 */
export function generateGroupMatches(teams: Team[]): Match[] {
  const matches: Match[] = []

  for (const groupId of GROUP_IDS) {
    const groupTeams = teams
      .filter((team) => team.groupId === groupId)
      .sort((a, b) => a.position - b.position)

    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        const team1 = groupTeams[i]
        const team2 = groupTeams[j]
        matches.push({
          id: `group-${groupId}-${team1.position}-${team2.position}`,
          type: 'group',
          groupId,
          round: 1,
          label: `${team1.id} vs ${team2.id}`,
          team1Ref: { kind: 'team', teamId: team1.id },
          team2Ref: { kind: 'team', teamId: team2.id },
          team1Resolved: true,
          team2Resolved: true,
          status: 'unscheduled',
        })
      }
    }
  }

  return matches
}
