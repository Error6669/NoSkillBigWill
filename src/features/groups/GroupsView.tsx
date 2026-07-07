import { useState } from 'react'
import type { GroupId } from '../../types'
import { GROUP_IDS } from '../../lib/initialData'
import { generateGroupsPdf } from '../../lib/pdf/groupsPdf'
import { getDuplicateNames } from '../../lib/validation'
import { useAppState } from '../../state/AppStateContext'
import GroupCard from './GroupCard'
import TiebreakInfoModal from './TiebreakInfoModal'

type GroupFilter = 'all' | GroupId

export default function GroupsView() {
  const { state, updateTeam } = useAppState()
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all')
  const [infoOpen, setInfoOpen] = useState(false)
  const duplicateNames = getDuplicateNames(state.teams)
  const completedCount = state.teams.filter(
    (team) => team.player1Name.trim() && team.player2Name.trim(),
  ).length

  const visibleGroupIds = groupFilter === 'all' ? GROUP_IDS : [groupFilter]

  const handlePdfExport = () => {
    const doc = generateGroupsPdf(state.teams, state.matches)
    const timestamp = new Date().toISOString().slice(0, 10)
    doc.save(`Gruppenuebersicht-${timestamp}.pdf`)
  }

  return (
    <section>
      <div className="groups-summary">
        <div>
          <div className="groups-summary__title">
            <h2>Gruppenphase</h2>
            <button
              type="button"
              className="info-button"
              aria-label="Wie wird die Tabelle sortiert?"
              title="Wie wird die Tabelle sortiert?"
              onClick={() => setInfoOpen(true)}
            >
              i
            </button>
          </div>
          <p>
            {completedCount} von {state.teams.length} Doppeln vollständig
            erfasst
          </p>
        </div>
        <button type="button" className="btn btn--secondary-outline" onClick={handlePdfExport}>
          Als PDF exportieren
        </button>
      </div>

      <TiebreakInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />

      <div className="groups-filters">
        <button
          type="button"
          className={
            groupFilter === 'all' ? 'groups-filter groups-filter--active' : 'groups-filter'
          }
          onClick={() => setGroupFilter('all')}
        >
          Alle Gruppen
        </button>
        {GROUP_IDS.map((groupId) => (
          <button
            key={groupId}
            type="button"
            className={
              groupFilter === groupId ? 'groups-filter groups-filter--active' : 'groups-filter'
            }
            onClick={() => setGroupFilter(groupId)}
          >
            Gruppe {groupId}
          </button>
        ))}
      </div>

      <div className="groups-grid">
        {visibleGroupIds.map((groupId) => (
          <GroupCard
            key={groupId}
            groupId={groupId}
            teams={state.teams
              .filter((team) => team.groupId === groupId)
              .sort((a, b) => a.position - b.position)}
            matches={state.matches.filter(
              (match) => match.type === 'group' && match.groupId === groupId,
            )}
            duplicateNames={duplicateNames}
            onUpdateTeam={updateTeam}
          />
        ))}
      </div>
    </section>
  )
}
