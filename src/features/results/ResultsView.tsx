import { useState } from 'react'
import { useAppState } from '../../state/AppStateContext'
import { GROUP_IDS } from '../../lib/initialData'
import { getMatchSectionTitle, sortMatchesForResults } from '../../lib/matchSort'
import MatchResultRow from './MatchResultRow'

type ResultFilter = 'all' | 'open' | 'played'
type SectionFilter = 'all' | 'knockout' | (typeof GROUP_IDS)[number]

const FILTERS: { id: ResultFilter; label: string }[] = [
  { id: 'all', label: 'Alle Spiele' },
  { id: 'open', label: 'Ohne Ergebnis' },
  { id: 'played', label: 'Gespielt' },
]

const SECTION_FILTERS: { id: SectionFilter; label: string }[] = [
  { id: 'all', label: 'Alle Abschnitte' },
  ...GROUP_IDS.map((groupId) => ({ id: groupId as SectionFilter, label: `Gruppe ${groupId}` })),
  { id: 'knockout', label: 'Finalspiele' },
]

function isPlayed(status: string) {
  return status === 'completed' || status === 'walkover'
}

function matchesSection(match: { type: string; groupId?: string }, section: SectionFilter) {
  if (section === 'all') return true
  if (section === 'knockout') return match.type !== 'group'
  return match.type === 'group' && match.groupId === section
}

export default function ResultsView() {
  const { state } = useAppState()
  const [filter, setFilter] = useState<ResultFilter>('all')
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all')

  const sortedMatches = sortMatchesForResults(state.matches)
  const filteredMatches = sortedMatches.filter((match) => {
    if (filter === 'open' && isPlayed(match.status)) return false
    if (filter === 'played' && !isPlayed(match.status)) return false
    return matchesSection(match, sectionFilter)
  })

  const playedCount = state.matches.filter((match) => isPlayed(match.status)).length

  let lastSectionTitle: string | null = null

  return (
    <section className="results-view">
      <div className="results-header">
        <h2>Ergebnisse</h2>
        <p>
          {playedCount} von {state.matches.length} Spielen abgeschlossen
        </p>
      </div>

      <div className="results-filters">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={
              filter === entry.id
                ? 'results-filter results-filter--active'
                : 'results-filter'
            }
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}

      </div>

      <div className="results-filters results-filters--sections">
        {SECTION_FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={
              sectionFilter === entry.id
                ? 'results-filter results-filter--active'
                : 'results-filter'
            }
            onClick={() => setSectionFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="results-list">
        {filteredMatches.map((match) => {
          const sectionTitle = getMatchSectionTitle(match)
          const showSectionHeader = sectionTitle !== lastSectionTitle
          lastSectionTitle = sectionTitle

          return (
            <div key={match.id}>
              {showSectionHeader && (
                <h3 className="results-section-title">{sectionTitle}</h3>
              )}
              <MatchResultRow match={match} teams={state.teams} allMatches={state.matches} />
            </div>
          )
        })}
        {filteredMatches.length === 0 && (
          <p className="results-empty-hint">Keine Spiele für diesen Filter.</p>
        )}
      </div>
    </section>
  )
}
