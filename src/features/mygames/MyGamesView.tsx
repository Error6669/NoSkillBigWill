import { useState } from 'react'
import { useAppState } from '../../state/AppStateContext'
import { buildMyGamesData } from '../../lib/myGames'

export default function MyGamesView() {
  const { state } = useAppState()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const data = buildMyGamesData(state)

  if (selectedTeamId) {
    const team = data.teamsById[selectedTeamId]
    const games = data.matchesByTeam[selectedTeamId] ?? []

    return (
      <section className="my-games-view">
        <button
          type="button"
          className="my-games-back"
          onClick={() => setSelectedTeamId(null)}
        >
          ← Zurück zur Übersicht
        </button>
        <h2 className="my-games-detail-title">
          {team.id} · {team.displayName || '– offen –'}
        </h2>

        {games.length === 0 && (
          <p className="my-games-empty-hint">
            Für dieses Doppel sind aktuell keine Spiele hinterlegt.
          </p>
        )}

        <div className="my-games-list">
          {games.map((game, index) => (
            <div className="my-games-card" key={index}>
              <div className="my-games-card__opponent">vs. {game.opponentText}</div>
              <span className={`my-games-badge my-games-badge--${game.statusClass}`}>
                {game.statusLabel}
              </span>
              <div className="my-games-card__meta">
                {game.scheduleText ?? 'Noch nicht verplant'}
              </div>
              {game.resultText && (
                <div className="my-games-card__meta">Ergebnis: {game.resultText}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="my-games-view">
      <div className="my-games-header">
        <h2>Meine Spiele</h2>
        <p>Doppel auswählen, um die eigenen Spieltermine zu sehen</p>
      </div>

      {data.groups.map((group) => (
        <div className="my-games-group" key={group.groupId}>
          <h3>Gruppe {group.groupId}</h3>
          <div className="my-games-team-list">
            {group.teams.map((team) => (
              <button
                key={team.id}
                type="button"
                className="my-games-team-button"
                onClick={() => setSelectedTeamId(team.id)}
              >
                <strong>{team.id}</strong> {team.displayName || '– offen –'}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
