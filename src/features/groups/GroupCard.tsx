import type { GroupId, Match, Team } from '../../types'
import { getMatchRowDisplay } from '../../lib/matchDisplay'
import { computeGroupStandings, isGroupFinished } from '../../lib/standings'
import TeamRow from './TeamRow'
import StandingsTable from './StandingsTable'

interface GroupCardProps {
  groupId: GroupId
  teams: Team[]
  matches: Match[]
  duplicateNames: Set<string>
  onUpdateTeam: (
    teamId: string,
    updates: Partial<Pick<Team, 'player1Name' | 'player2Name'>>,
  ) => void
}

export default function GroupCard({
  groupId,
  teams,
  matches,
  duplicateNames,
  onUpdateTeam,
}: GroupCardProps) {
  const standings = computeGroupStandings(
    teams.map((team) => team.id),
    matches,
  )
  const finished = isGroupFinished(matches)

  return (
    <div className="group-card">
      <h3 className="group-card__title">Gruppe {groupId}</h3>
      <div className="group-card__teams">
        {teams.map((team) => (
          <TeamRow
            key={team.id}
            team={team}
            duplicateNames={duplicateNames}
            onUpdateTeam={onUpdateTeam}
          />
        ))}
      </div>
      <StandingsTable standings={standings} teams={teams} isFinished={finished} />
      <div className="group-card__matches">
        <h4>Gruppenspiele ({matches.length})</h4>
        <ul>
          {matches.map((match) => {
            const display = getMatchRowDisplay(match, teams, matches)
            return (
              <li key={match.id}>
                <span className="match-label__positions">{display.positions}:</span>
                <span className="match-label__names">
                  <span
                    className={
                      display.winnerId && display.winnerId === display.team1Id
                        ? 'match-label__team match-label__team--winner'
                        : 'match-label__team'
                    }
                  >
                    {display.team1Text}
                  </span>
                  {' vs. '}
                  <span
                    className={
                      display.winnerId && display.winnerId === display.team2Id
                        ? 'match-label__team match-label__team--winner'
                        : 'match-label__team'
                    }
                  >
                    {display.team2Text}
                  </span>
                  {display.resultText && (
                    <span className="match-label__result"> ({display.resultText})</span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
