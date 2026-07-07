import type { GroupId, Team, TeamPosition } from '../types'

export const GROUP_IDS: GroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
export const TEAM_POSITIONS: TeamPosition[] = [1, 2, 3, 4]

export function createInitialTeams(): Team[] {
  return GROUP_IDS.flatMap((groupId) =>
    TEAM_POSITIONS.map((position) => ({
      id: `${groupId}${position}`,
      groupId,
      position,
      player1Name: '',
      player2Name: '',
      displayName: '',
    })),
  )
}
