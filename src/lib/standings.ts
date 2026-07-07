import type { Match, Standing } from '../types'

function isMatchDecided(match: Match): boolean {
  return match.status === 'completed' || match.status === 'walkover'
}

function resolvedGroupTeamIds(match: Match): { team1Id?: string; team2Id?: string } {
  return {
    team1Id: match.team1Ref.kind === 'team' ? match.team1Ref.teamId : undefined,
    team2Id: match.team2Ref.kind === 'team' ? match.team2Ref.teamId : undefined,
  }
}

export function isGroupFinished(groupMatches: Match[]): boolean {
  return groupMatches.length > 0 && groupMatches.every(isMatchDecided)
}

interface BaseStats {
  matchesPlayed: number
  wins: number
  losses: number
  points: number
  gamesWon: number
  gamesLost: number
}

function computeBaseStats(teamIds: string[], groupMatches: Match[]): Map<string, BaseStats> {
  const stats = new Map<string, BaseStats>(
    teamIds.map((teamId) => [
      teamId,
      { matchesPlayed: 0, wins: 0, losses: 0, points: 0, gamesWon: 0, gamesLost: 0 },
    ]),
  )

  for (const match of groupMatches) {
    if (!isMatchDecided(match)) continue
    const { team1Id, team2Id } = resolvedGroupTeamIds(match)
    const s1 = team1Id ? stats.get(team1Id) : undefined
    const s2 = team2Id ? stats.get(team2Id) : undefined
    if (!s1 || !s2 || !team1Id || !team2Id) continue

    const gamesTeam1 = match.result?.gamesTeam1 ?? 0
    const gamesTeam2 = match.result?.gamesTeam2 ?? 0

    s1.matchesPlayed += 1
    s2.matchesPlayed += 1
    s1.gamesWon += gamesTeam1
    s1.gamesLost += gamesTeam2
    s2.gamesWon += gamesTeam2
    s2.gamesLost += gamesTeam1

    if (match.winner === team1Id) {
      s1.wins += 1
      s1.points += 1
      s2.losses += 1
    } else if (match.winner === team2Id) {
      s2.wins += 1
      s2.points += 1
      s1.losses += 1
    }
  }

  return stats
}

function headToHeadWinner(teamA: string, teamB: string, groupMatches: Match[]): string | undefined {
  const match = groupMatches.find((entry) => {
    if (!isMatchDecided(entry)) return false
    const { team1Id, team2Id } = resolvedGroupTeamIds(entry)
    return (team1Id === teamA && team2Id === teamB) || (team1Id === teamB && team2Id === teamA)
  })
  return match?.winner
}

function miniTablePoints(teamIds: string[], groupMatches: Match[]): Map<string, number> {
  const points = new Map<string, number>(teamIds.map((id) => [id, 0]))
  for (const match of groupMatches) {
    if (!isMatchDecided(match)) continue
    const { team1Id, team2Id } = resolvedGroupTeamIds(match)
    if (!team1Id || !team2Id || !teamIds.includes(team1Id) || !teamIds.includes(team2Id)) continue
    if (match.winner && points.has(match.winner)) {
      points.set(match.winner, (points.get(match.winner) ?? 0) + 1)
    }
  }
  return points
}

function compareByGameStats(a: string, b: string, stats: Map<string, BaseStats>): number {
  const sa = stats.get(a)!
  const sb = stats.get(b)!
  const diffA = sa.gamesWon - sa.gamesLost
  const diffB = sb.gamesWon - sb.gamesLost
  if (diffB !== diffA) return diffB - diffA
  if (sb.gamesWon !== sa.gamesWon) return sb.gamesWon - sa.gamesWon
  return a.localeCompare(b)
}

/**
 * Sortiert eine Gruppe nach Punkten und wendet die Tiebreak-Regeln an:
 * - Gleichstand von genau 2 Teams: direktes Duell entscheidet (falls schon
 *   gespielt), sonst Gamedifferenz/-gewonnene Games.
 * - Gleichstand von mehr als 2 Teams: Mini-Tabelle nur unter den
 *   betroffenen Teams, danach Gesamt-Gamedifferenz, danach
 *   Gesamt-gewonnene-Games.
 */
export function computeGroupStandings(teamIds: string[], groupMatches: Match[]): Standing[] {
  const stats = computeBaseStats(teamIds, groupMatches)

  const clustersByPoints = new Map<number, string[]>()
  for (const teamId of teamIds) {
    const points = stats.get(teamId)!.points
    const cluster = clustersByPoints.get(points) ?? []
    cluster.push(teamId)
    clustersByPoints.set(points, cluster)
  }

  const orderedTeamIds: string[] = []
  const sortedPointGroups = Array.from(clustersByPoints.entries()).sort((a, b) => b[0] - a[0])

  for (const [, cluster] of sortedPointGroups) {
    if (cluster.length === 1) {
      orderedTeamIds.push(cluster[0])
      continue
    }

    if (cluster.length === 2) {
      const [a, b] = cluster
      const winner = headToHeadWinner(a, b, groupMatches)
      if (winner === a) {
        orderedTeamIds.push(a, b)
      } else if (winner === b) {
        orderedTeamIds.push(b, a)
      } else {
        orderedTeamIds.push(...[...cluster].sort((x, y) => compareByGameStats(x, y, stats)))
      }
      continue
    }

    const miniPoints = miniTablePoints(cluster, groupMatches)
    const sortedCluster = [...cluster].sort((a, b) => {
      const miniDiff = (miniPoints.get(b) ?? 0) - (miniPoints.get(a) ?? 0)
      if (miniDiff !== 0) return miniDiff
      return compareByGameStats(a, b, stats)
    })
    orderedTeamIds.push(...sortedCluster)
  }

  return orderedTeamIds.map((teamId, index) => {
    const s = stats.get(teamId)!
    return {
      teamId,
      matchesPlayed: s.matchesPlayed,
      wins: s.wins,
      losses: s.losses,
      points: s.points,
      gamesWon: s.gamesWon,
      gamesLost: s.gamesLost,
      gamesDifference: s.gamesWon - s.gamesLost,
      rank: index + 1,
    }
  })
}
