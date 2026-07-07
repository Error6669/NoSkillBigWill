import { useLayoutEffect, useRef, useState } from 'react'
import type { KoFormatSettings, MatchFormatMode } from '../../types'
import { useAppState } from '../../state/AppStateContext'
import { generateKoPdf } from '../../lib/pdf/koPdf'
import KoMatchCard from './KoMatchCard'

const QUARTERFINAL_IDS = ['vf1', 'vf4', 'vf2', 'vf3']
const SEMIFINAL_IDS = ['sf1', 'sf2']

const FORMAT_SELECT_ITEMS: { round: keyof KoFormatSettings; label: string }[] = [
  { round: 'quarterfinal', label: 'Viertelfinale' },
  { round: 'semifinal', label: 'Halbfinale' },
  { round: 'final', label: 'Finale + Kleines Finale' },
]

export default function KoPhaseView() {
  const { state, setKoFormatSetting } = useAppState()
  const findMatch = (id: string) => state.matches.find((match) => match.id === id)
  const finalMatch = findMatch('final')
  const thirdPlaceMatch = findMatch('third-place')

  const hfMatchesRef = useRef<HTMLDivElement>(null)
  const hf1Ref = useRef<HTMLDivElement>(null)
  const hf2Ref = useRef<HTMLDivElement>(null)
  const finalCardRef = useRef<HTMLDivElement>(null)
  const [finalMarginTop, setFinalMarginTop] = useState(0)

  useLayoutEffect(() => {
    const recompute = () => {
      const hfMatches = hfMatchesRef.current
      const hf1 = hf1Ref.current
      const hf2 = hf2Ref.current
      const finalCard = finalCardRef.current
      if (!hfMatches || !hf1 || !hf2 || !finalCard) return

      // Relativ zum jeweiligen "Matches"-Container (nicht zur ganzen
      // Bracket-Spalte) messen, damit sich die Höhe der Rundentitel
      // ("Halbfinale" vs. "Finale") exakt aufhebt.
      const containerTop = hfMatches.getBoundingClientRect().top
      const hf1Center = hf1.getBoundingClientRect().top - containerTop + hf1.offsetHeight / 2
      const hf2Center = hf2.getBoundingClientRect().top - containerTop + hf2.offsetHeight / 2
      const midpoint = (hf1Center + hf2Center) / 2
      const desiredTop = midpoint - finalCard.offsetHeight / 2
      setFinalMarginTop(Math.max(0, desiredTop))
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(hf1Ref.current!)
    observer.observe(hf2Ref.current!)
    observer.observe(finalCardRef.current!)
    window.addEventListener('resize', recompute)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', recompute)
    }
  }, [state.matches, state.teams, state.slots, state.dayConfigs])

  const handlePdfExport = () => {
    const doc = generateKoPdf(state)
    const timestamp = new Date().toISOString().slice(0, 10)
    doc.save(`KO-Phase-${timestamp}.pdf`)
  }

  return (
    <section className="ko-phase-view">
      <div className="ko-phase-header">
        <div>
          <h2>KO-Phase</h2>
          <p>Viertelfinale, Halbfinale und Finale im Überblick</p>
        </div>
        <button type="button" className="btn btn--secondary-outline" onClick={handlePdfExport}>
          Als PDF exportieren
        </button>
      </div>

      <div className="ko-format-settings">
        <span className="ko-format-settings__label">Spielformat je Runde:</span>
        {FORMAT_SELECT_ITEMS.map(({ round, label }) => (
          <label key={round} className="ko-format-settings__item">
            {label}
            <select
              value={state.koFormatSettings[round]}
              onChange={(event) =>
                setKoFormatSetting(round, event.target.value as MatchFormatMode)
              }
            >
              <option value="short">2 Sätze bis 4 (Tiebreak bis 7)</option>
              <option value="long">2 Sätze bis 6 (Tiebreak bis 10)</option>
            </select>
          </label>
        ))}
      </div>

      <div className="ko-bracket">
        <div className="ko-bracket__round">
          <span className="ko-bracket__round-title">Viertelfinale</span>
          <div className="ko-bracket__matches">
            {QUARTERFINAL_IDS.map((id) => {
              const match = findMatch(id)
              return match ? (
                <KoMatchCard
                  key={id}
                  match={match}
                  teams={state.teams}
                  allMatches={state.matches}
                  slots={state.slots}
                  dayConfigs={state.dayConfigs}
                />
              ) : null
            })}
          </div>
        </div>

        <div className="ko-bracket__round">
          <span className="ko-bracket__round-title">Halbfinale</span>
          <div className="ko-bracket__matches" ref={hfMatchesRef}>
            {SEMIFINAL_IDS.map((id, index) => {
              const match = findMatch(id)
              if (!match) return null
              return (
                <div key={id} ref={index === 0 ? hf1Ref : hf2Ref}>
                  <KoMatchCard
                    match={match}
                    teams={state.teams}
                    allMatches={state.matches}
                    slots={state.slots}
                    dayConfigs={state.dayConfigs}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="ko-bracket__round">
          <span className="ko-bracket__round-title">Finale</span>
          <div className="ko-bracket__matches ko-bracket__matches--anchored">
            <div className="ko-bracket__final-group" style={{ marginTop: finalMarginTop }}>
              <div ref={finalCardRef}>
                {finalMatch && (
                  <KoMatchCard
                    match={finalMatch}
                    teams={state.teams}
                    allMatches={state.matches}
                    slots={state.slots}
                    dayConfigs={state.dayConfigs}
                  />
                )}
              </div>

              <span className="ko-bracket__round-title ko-bracket__round-title--secondary">
                Kleines Finale
              </span>
              {thirdPlaceMatch && (
                <KoMatchCard
                  match={thirdPlaceMatch}
                  teams={state.teams}
                  allMatches={state.matches}
                  slots={state.slots}
                  dayConfigs={state.dayConfigs}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
