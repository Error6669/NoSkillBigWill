import type { Match, Team } from '../../types'
import { getSlotCellLines } from '../../lib/scheduleDisplay'

interface UnassignedMatchesListProps {
  groupMatches: Match[]
  koMatches: Match[]
  teams: Team[]
  allMatches: Match[]
  hasSelectedSlot: boolean
  onAssign: (matchId: string) => void
}

function MatchListItem({
  match,
  teams,
  allMatches,
  onAssign,
}: {
  match: Match
  teams: Team[]
  allMatches: Match[]
  onAssign: (matchId: string) => void
}) {
  const lines = getSlotCellLines(match, teams, allMatches)
  return (
    <li onDoubleClick={() => onAssign(match.id)}>
      <span className="unassigned-matches__positions">{lines.line1}</span>
      <span className="unassigned-matches__names">
        {lines.team1Text} vs. {lines.team2Text}
      </span>
    </li>
  )
}

export default function UnassignedMatchesList({
  groupMatches,
  koMatches,
  teams,
  allMatches,
  hasSelectedSlot,
  onAssign,
}: UnassignedMatchesListProps) {
  const matchesByGroup = new Map<string, Match[]>()
  for (const match of groupMatches) {
    const key = match.groupId ?? ''
    const entries = matchesByGroup.get(key) ?? []
    entries.push(match)
    matchesByGroup.set(key, entries)
  }
  const sortedGroupIds = Array.from(matchesByGroup.keys()).sort()

  return (
    <div className="unassigned-matches">
      <h3>Noch nicht verplante Spiele</h3>
      <p className="unassigned-matches__hint">
        {hasSelectedSlot
          ? 'Doppelklick auf ein Match weist es dem ausgewählten Slot zu.'
          : 'Zuerst einen freien Slot im Plan auswählen.'}
      </p>

      <div className="unassigned-matches__section">
        <h4>Gruppenspiele ({groupMatches.length})</h4>
        {sortedGroupIds.map((groupId) => (
          <div key={groupId} className="unassigned-matches__group">
            <h5 className="unassigned-matches__group-title">Gruppe {groupId}</h5>
            <ul>
              {matchesByGroup.get(groupId)!.map((match) => (
                <MatchListItem
                  key={match.id}
                  match={match}
                  teams={teams}
                  allMatches={allMatches}
                  onAssign={onAssign}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="unassigned-matches__section">
        <h4>KO-Spiele ({koMatches.length})</h4>
        <ul>
          {koMatches.map((match) => (
            <MatchListItem
              key={match.id}
              match={match}
              teams={teams}
              allMatches={allMatches}
              onAssign={onAssign}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}
