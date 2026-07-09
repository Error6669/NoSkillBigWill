import type { AppState } from '../types'
import { buildMyGamesData } from './myGames'

/**
 * Baut eine eigenständige, mobiltaugliche HTML-Datei: Übersicht aller
 * Gruppen/Doppel, per Klick auf ein Doppel erscheinen dessen Spiele mit
 * Zeit/Platz. Läuft komplett offline (kein Server, keine externen
 * Ressourcen) - alle Daten sind zum Exportzeitpunkt eingebettet.
 */
export function generateMyGamesHtml(state: AppState): string {
  const data = buildMyGamesData(state)
  // "<" escapen, damit z.B. ein Spielername mit "</script>" das Dokument
  // nicht zerstören kann.
  const embeddedJson = JSON.stringify(data).replace(/</g, '\\u003c')

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Meine Spiele – Turnierplanung</title>
<style>
  :root {
    --color-bg: #f4f7f4;
    --color-surface: #ffffff;
    --color-border: #dde3dd;
    --color-text: #1b231e;
    --color-text-muted: #5c675f;
    --color-primary: #1f6f43;
    --color-primary-dark: #17532f;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
    background: var(--color-bg);
    color: var(--color-text);
  }
  header {
    background: var(--color-primary);
    color: #fff;
    padding: 16px 20px;
  }
  header h1 { margin: 0; font-size: 20px; }
  header p { margin: 4px 0 0; font-size: 13px; opacity: 0.85; }
  main { padding: 16px; max-width: 640px; margin: 0 auto; }
  .group-block { margin-bottom: 20px; }
  .group-block h2 {
    font-size: 15px;
    color: var(--color-primary);
    margin: 0 0 8px;
  }
  .team-list { display: flex; flex-direction: column; gap: 6px; }
  .team-button {
    display: block;
    width: 100%;
    text-align: left;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 14px;
    color: var(--color-text);
    cursor: pointer;
  }
  .team-button:active { border-color: var(--color-primary); }
  .team-button strong { color: var(--color-primary-dark); margin-right: 6px; }

  #detail-view { display: none; }
  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-size: 14px;
    padding: 8px 0;
    cursor: pointer;
  }
  .detail-title { font-size: 18px; margin: 4px 0 16px; }
  .game-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 10px;
  }
  .game-card__opponent { font-weight: 600; margin-bottom: 6px; }
  .game-card__meta { font-size: 13px; color: var(--color-text-muted); margin: 3px 0 0; }
  .badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
  }
  .badge--completed { background: rgba(31,111,67,0.12); color: var(--color-primary-dark); border-color: var(--color-primary); }
  .badge--walkover { background: rgba(192,57,43,0.1); color: #c0392b; border-color: #c0392b; }
  .empty-hint { color: var(--color-text-muted); font-size: 13px; }
</style>
</head>
<body>
<header>
  <h1>Meine Spiele</h1>
  <p>Doppel auswählen, um die eigenen Spieltermine zu sehen</p>
</header>
<main>
  <div id="group-view"></div>
  <div id="detail-view">
    <button class="back-button" type="button" onclick="showGroups()">← Zurück zur Übersicht</button>
    <h2 class="detail-title" id="detail-title"></h2>
    <div id="detail-games"></div>
  </div>
</main>
<script id="tournament-data" type="application/json">${embeddedJson}</script>
<script>
  var DATA = JSON.parse(document.getElementById('tournament-data').textContent);

  function renderGroups() {
    var container = document.getElementById('group-view');
    container.innerHTML = '';
    DATA.groups.forEach(function (group) {
      var block = document.createElement('div');
      block.className = 'group-block';
      var heading = document.createElement('h2');
      heading.textContent = 'Gruppe ' + group.groupId;
      block.appendChild(heading);
      var list = document.createElement('div');
      list.className = 'team-list';
      group.teams.forEach(function (team) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'team-button';
        var strong = document.createElement('strong');
        strong.textContent = team.id;
        button.appendChild(strong);
        button.appendChild(document.createTextNode(team.displayName || '– offen –'));
        button.onclick = function () { showDetail(team.id); };
        list.appendChild(button);
      });
      block.appendChild(list);
      container.appendChild(block);
    });
  }

  function showDetail(teamId) {
    var team = DATA.teamsById[teamId];
    var games = DATA.matchesByTeam[teamId] || [];
    document.getElementById('detail-title').textContent =
      team.id + ' · ' + (team.displayName || '– offen –');

    var gamesContainer = document.getElementById('detail-games');
    gamesContainer.innerHTML = '';

    if (games.length === 0) {
      var hint = document.createElement('p');
      hint.className = 'empty-hint';
      hint.textContent = 'Für dieses Doppel sind aktuell keine Spiele hinterlegt.';
      gamesContainer.appendChild(hint);
    }

    games.forEach(function (game) {
      var card = document.createElement('div');
      card.className = 'game-card';

      var opponent = document.createElement('div');
      opponent.className = 'game-card__opponent';
      opponent.textContent = 'vs. ' + game.opponentText;
      card.appendChild(opponent);

      var statusBadge = document.createElement('span');
      statusBadge.className = 'badge badge--' + game.statusClass;
      statusBadge.textContent = game.statusLabel;
      card.appendChild(statusBadge);

      var schedule = document.createElement('div');
      schedule.className = 'game-card__meta';
      schedule.textContent = game.scheduleText || 'Noch nicht verplant';
      card.appendChild(schedule);

      if (game.resultText) {
        var result = document.createElement('div');
        result.className = 'game-card__meta';
        result.textContent = 'Ergebnis: ' + game.resultText;
        card.appendChild(result);
      }

      gamesContainer.appendChild(card);
    });

    document.getElementById('group-view').style.display = 'none';
    document.getElementById('detail-view').style.display = 'block';
    window.scrollTo(0, 0);
  }

  function showGroups() {
    document.getElementById('detail-view').style.display = 'none';
    document.getElementById('group-view').style.display = 'block';
  }

  renderGroups();
</script>
</body>
</html>
`
}

export function downloadMyGamesHtml(state: AppState): void {
  const html = generateMyGamesHtml(state)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const timestamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `Meine-Spiele-${timestamp}.html`
  link.click()
  URL.revokeObjectURL(url)
}
