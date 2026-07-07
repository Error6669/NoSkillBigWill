import type { Standing, Team } from '../../types'

interface StandingsTableProps {
  standings: Standing[]
  teams: Team[]
  isFinished: boolean
}

export default function StandingsTable({ standings, teams, isFinished }: StandingsTableProps) {
  return (
    <div className="standings-table">
      <h4>
        Tabelle{' '}
        <span
          className={
            isFinished ? 'standings-table__badge standings-table__badge--final' : 'standings-table__badge'
          }
        >
          {isFinished ? 'Endstand' : 'vorläufig'}
        </span>
      </h4>
      <table>
        <thead>
          <tr>
            <th>Doppel</th>
            <th>Name</th>
            <th>Sp</th>
            <th>S</th>
            <th>N</th>
            <th>+/-</th>
            <th>Pkt</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing) => {
            const team = teams.find((entry) => entry.id === standing.teamId)
            return (
              <tr
                key={standing.teamId}
                className={standing.rank === 1 ? 'standings-table__row--leader' : undefined}
              >
                <td className="standings-table__position">{team?.id ?? standing.teamId}</td>
                <td className="standings-table__team">{team?.displayName || '– offen –'}</td>
                <td>{standing.matchesPlayed}</td>
                <td>{standing.wins}</td>
                <td>{standing.losses}</td>
                <td>
                  {standing.gamesDifference > 0 ? `+${standing.gamesDifference}` : standing.gamesDifference}
                </td>
                <td>{standing.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
