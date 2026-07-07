import type { Team } from '../../types'
import { useCanEdit } from '../../state/AuthContext'

interface TeamRowProps {
  team: Team
  duplicateNames: Set<string>
  onUpdateTeam: (
    teamId: string,
    updates: Partial<Pick<Team, 'player1Name' | 'player2Name'>>,
  ) => void
}

export default function TeamRow({ team, duplicateNames, onUpdateTeam }: TeamRowProps) {
  const canEdit = useCanEdit()
  const p1 = team.player1Name.trim()
  const p2 = team.player2Name.trim()
  const isEmpty = !p1 && !p2
  const isIncomplete = !isEmpty && (!p1 || !p2)
  const p1Duplicate = p1 !== '' && duplicateNames.has(p1.toLowerCase())
  const p2Duplicate = p2 !== '' && duplicateNames.has(p2.toLowerCase())

  return (
    <div className={isIncomplete ? 'team-row team-row--incomplete' : 'team-row'}>
      <span className="team-row__label">{team.id}</span>
      <div className="team-row__inputs">
        <input
          type="text"
          placeholder="Spieler 1"
          value={team.player1Name}
          disabled={!canEdit}
          onChange={(event) =>
            onUpdateTeam(team.id, { player1Name: event.target.value })
          }
          className={p1Duplicate ? 'input input--warning' : 'input'}
        />
        <input
          type="text"
          placeholder="Spieler 2"
          value={team.player2Name}
          disabled={!canEdit}
          onChange={(event) =>
            onUpdateTeam(team.id, { player2Name: event.target.value })
          }
          className={p2Duplicate ? 'input input--warning' : 'input'}
        />
      </div>
      {isIncomplete && <span className="team-row__hint">unvollständig</span>}
      {(p1Duplicate || p2Duplicate) && (
        <span className="team-row__hint team-row__hint--warning">
          Name mehrfach vergeben
        </span>
      )}
    </div>
  )
}
