import type { Match, Team } from '../../types'
import { getMatchRowDisplay } from '../../lib/matchDisplay'
import { resolveTeamReference } from '../../lib/koResolution'
import ResultEntryForm from './ResultEntryForm'

interface MatchResultRowProps {
  match: Match
  teams: Team[]
  allMatches: Match[]
}

const STATUS_LABELS: Record<Match['status'], string> = {
  unscheduled: 'offen',
  scheduled: 'verplant',
  completed: 'abgeschlossen',
  walkover: 'kampflos',
}

export default function MatchResultRow({ match, teams, allMatches }: MatchResultRowProps) {
  const display = getMatchRowDisplay(match, teams, allMatches)
  const resolution1 = resolveTeamReference(match.team1Ref, teams, allMatches)
  const resolution2 = resolveTeamReference(match.team2Ref, teams, allMatches)
  const team1Id = resolution1.isFinal ? resolution1.teamId : undefined
  const team2Id = resolution2.isFinal ? resolution2.teamId : undefined
  const canEnterResult = Boolean(team1Id && team2Id)

  return (
    <div className="result-row">
      <div className="result-row__summary">
        <span className="result-row__prefix">{display.positions}:</span>
        <span
          className={
            match.winner && match.winner === team1Id
              ? 'result-row__team result-row__team--winner'
              : 'result-row__team'
          }
        >
          {display.team1Text}
        </span>
        <span className="result-row__vs">vs.</span>
        <span
          className={
            match.winner && match.winner === team2Id
              ? 'result-row__team result-row__team--winner'
              : 'result-row__team'
          }
        >
          {display.team2Text}
        </span>
        <span className={`result-row__status result-row__status--${match.status}`}>
          {STATUS_LABELS[match.status]}
        </span>
      </div>

      {canEnterResult ? (
        <ResultEntryForm match={match} team1Id={team1Id!} team2Id={team2Id!} />
      ) : (
        <p className="result-row__pending-note">
          Teilnehmer stehen noch nicht endgültig fest – Ergebnis kann erst eingetragen werden,
          sobald beide feststehen.
        </p>
      )}
    </div>
  )
}
