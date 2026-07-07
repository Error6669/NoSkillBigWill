import type { DayConfig, Match, Slot, Team, TeamReference } from '../../types'
import { resolveTeamReference } from '../../lib/koResolution'
import { describePlaceholder, formatTeamLabel } from '../../lib/teamReference'
import { getMatchScheduleText } from '../../lib/matchDisplay'

interface KoMatchCardProps {
  match: Match
  teams: Team[]
  allMatches: Match[]
  slots: Slot[]
  dayConfigs: DayConfig[]
}

interface SideDisplay {
  text: string
  teamId?: string
  isFinal: boolean
}

function resolveSide(ref: TeamReference, teams: Team[], allMatches: Match[]): SideDisplay {
  const resolution = resolveTeamReference(ref, teams, allMatches)
  if (resolution.teamId) {
    return {
      text: formatTeamLabel(resolution.teamId, teams),
      teamId: resolution.teamId,
      isFinal: resolution.isFinal,
    }
  }
  return { text: describePlaceholder(ref, allMatches), isFinal: false }
}

export default function KoMatchCard({
  match,
  teams,
  allMatches,
  slots,
  dayConfigs,
}: KoMatchCardProps) {
  const side1 = resolveSide(match.team1Ref, teams, allMatches)
  const side2 = resolveSide(match.team2Ref, teams, allMatches)
  const scheduleText = getMatchScheduleText(match, slots, dayConfigs)
  const isWalkover = match.status === 'walkover'
  const isCompleted = match.status === 'completed'
  const sets = match.result?.sets ?? []
  const matchTiebreak = match.result?.matchTiebreak

  const sideClassName = (side: SideDisplay) => {
    const classes = ['ko-match__side']
    if (match.winner && side.teamId === match.winner) classes.push('ko-match__side--winner')
    if (side.teamId && !side.isFinal) classes.push('ko-match__side--provisional')
    return classes.join(' ')
  }

  return (
    <div className="ko-match">
      <div className="ko-match__label">{match.label}</div>

      <div className={sideClassName(side1)}>
        <span className="ko-match__name-group">
          <span>{side1.text}</span>
          {side1.teamId && !side1.isFinal && <span className="ko-match__tag">vorläufig</span>}
        </span>
        {isCompleted && (
          <span className="ko-match__scores">
            {sets.map((set, index) => (
              <span key={index} className="ko-match__score">
                {set.team1Games}
              </span>
            ))}
            {matchTiebreak && (
              <span className="ko-match__score ko-match__score--tiebreak">
                {matchTiebreak.team1Points}
              </span>
            )}
          </span>
        )}
      </div>

      <div className={sideClassName(side2)}>
        <span className="ko-match__name-group">
          <span>{side2.text}</span>
          {side2.teamId && !side2.isFinal && <span className="ko-match__tag">vorläufig</span>}
        </span>
        {isCompleted && (
          <span className="ko-match__scores">
            {sets.map((set, index) => (
              <span key={index} className="ko-match__score">
                {set.team2Games}
              </span>
            ))}
            {matchTiebreak && (
              <span className="ko-match__score ko-match__score--tiebreak">
                {matchTiebreak.team2Points}
              </span>
            )}
          </span>
        )}
      </div>

      {isWalkover && <div className="ko-match__walkover-note">kampflos</div>}
      {scheduleText && <div className="ko-match__schedule">{scheduleText}</div>}
    </div>
  )
}
