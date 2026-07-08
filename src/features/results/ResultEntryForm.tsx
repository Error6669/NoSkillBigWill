import type { FocusEvent } from 'react'
import type { Match } from '../../types'
import {
  createDefaultSets,
  getMatchFormat,
  getMatchTiebreakIssue,
  getSetScoreIssue,
  getSetWinnerSide,
} from '../../lib/matchResult'
import { useAppState } from '../../state/AppStateContext'

interface ResultEntryFormProps {
  match: Match
  team1Id: string
  team2Id: string
}

export default function ResultEntryForm({ match, team1Id, team2Id }: ResultEntryFormProps) {
  const { state, updateMatchSet, updateMatchTiebreak, setMatchWalkover } = useAppState()
  const format = getMatchFormat(match.type, state.koFormatSettings)
  const sets = match.result?.sets.length === 2 ? match.result.sets : createDefaultSets()
  const walkoverTeam = match.result?.walkoverTeam
  const isWalkover = match.result?.walkover ?? false

  const set1Winner = getSetWinnerSide(sets[0])
  const set2Winner = getSetWinnerSide(sets[1])
  const needsMatchTiebreak = Boolean(set1Winner && set2Winner && set1Winner !== set2Winner)

  const handleWalkoverToggle = (teamId: string) => {
    setMatchWalkover(match.id, walkoverTeam === teamId ? null : teamId)
  }

  // Beim ersten Klick/Fokussieren die aktuelle Zahl markieren, damit sie
  // sich direkt durch Eintippen überschreiben lässt. Per Mausklick setzt der
  // Browser die Cursor-Position aber erst NACH dem focus-Event neu, was eine
  // sofortige .select()-Auswahl sonst wieder aufheben würde - daher leicht
  // verzögert (nächster Tick), nachdem der Browser fertig ist.
  const handleFocusSelect = (event: FocusEvent<HTMLInputElement>) => {
    const target = event.target
    window.setTimeout(() => target.select(), 0)
  }

  return (
    <div className="result-entry">
      <div className="result-entry__walkover">
        <label>
          <input
            type="checkbox"
            checked={walkoverTeam === team1Id}
            onChange={() => handleWalkoverToggle(team1Id)}
          />
          Team 1 w.o. (kampflos verloren)
        </label>
        <label>
          <input
            type="checkbox"
            checked={walkoverTeam === team2Id}
            onChange={() => handleWalkoverToggle(team2Id)}
          />
          Team 2 w.o. (kampflos verloren)
        </label>
      </div>

      {!isWalkover && (
        <div className="result-entry__row">
          <div className="result-entry__inputs">
            {[0, 1].map((setIndex) => {
              const issue = getSetScoreIssue(sets[setIndex], format)
              return (
                <div className="result-entry__set" key={setIndex}>
                  <div className="result-entry__set-inputs">
                    <span className="result-entry__set-label">Satz {setIndex + 1}</span>
                    <input
                      type="number"
                      min={0}
                      className={issue ? 'input result-entry__score input--warning' : 'input result-entry__score'}
                      value={sets[setIndex].team1Games}
                      onFocus={handleFocusSelect}
                      onChange={(event) =>
                        updateMatchSet(match.id, setIndex as 0 | 1, {
                          team1Games: Number(event.target.value),
                        })
                      }
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min={0}
                      className={issue ? 'input result-entry__score input--warning' : 'input result-entry__score'}
                      value={sets[setIndex].team2Games}
                      onFocus={handleFocusSelect}
                      onChange={(event) =>
                        updateMatchSet(match.id, setIndex as 0 | 1, {
                          team2Games: Number(event.target.value),
                        })
                      }
                    />
                    {sets[setIndex].tiebreak && (
                      <span className="result-entry__tiebreak-badge">TB</span>
                    )}
                  </div>
                  {issue && <span className="result-entry__issue">{issue}</span>}
                </div>
              )
            })}

            {needsMatchTiebreak && (() => {
              const matchTiebreak = {
                team1Points: match.result?.matchTiebreak?.team1Points ?? 0,
                team2Points: match.result?.matchTiebreak?.team2Points ?? 0,
              }
              const tiebreakIssue = getMatchTiebreakIssue(matchTiebreak, format)
              return (
                <div className="result-entry__set">
                  <div className="result-entry__match-tiebreak">
                    <span className="result-entry__set-label">Matchtiebreak</span>
                    <input
                      type="number"
                      min={0}
                      className={
                        tiebreakIssue ? 'input result-entry__score input--warning' : 'input result-entry__score'
                      }
                      value={matchTiebreak.team1Points}
                      onFocus={handleFocusSelect}
                      onChange={(event) =>
                        updateMatchTiebreak(match.id, { team1Points: Number(event.target.value) })
                      }
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min={0}
                      className={
                        tiebreakIssue ? 'input result-entry__score input--warning' : 'input result-entry__score'
                      }
                      value={matchTiebreak.team2Points}
                      onFocus={handleFocusSelect}
                      onChange={(event) =>
                        updateMatchTiebreak(match.id, { team2Points: Number(event.target.value) })
                      }
                    />
                  </div>
                  {tiebreakIssue && <span className="result-entry__issue">{tiebreakIssue}</span>}
                </div>
              )
            })()}
          </div>

          <p className="result-entry__hint">
            Sätze bis {format.setGames} (TB bei {format.setGames}:{format.setGames} bis{' '}
            {format.setTiebreakTo}), Matchtiebreak bis {format.matchTiebreakTo}
          </p>
        </div>
      )}
    </div>
  )
}
