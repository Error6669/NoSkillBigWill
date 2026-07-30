# Turnierplanung ("NoSkillBigWill") — Projektstatus

Stand: 2026-07-17. Dieses Dokument fasst alles zusammen, was nötig ist, um in einer neuen Session nahtlos weiterzuarbeiten.

## Was ist das für ein Projekt?

Eine lokale/gehostete Browser-App zur Organisation eines Doppel-Tennisturniers: 8 Gruppen (A–H) mit je 4 Doppeln, Gruppenphase (Round-Robin) + KO-Phase (Viertelfinale → Halbfinale → Finale + Kleines Finale). Kein eigenes Backend — reine Client-App mit localStorage-Persistenz, die optional per Knopfdruck einen gemeinsamen Datenstand über GitHub veröffentlichen kann.

- **Lokales Verzeichnis:** `/Users/simonmac/Documents/Dev2_Turnier`
- **GitHub-Repo:** https://github.com/Error6669/NoSkillBigWill (Owner: `Error6669`, Repo: `NoSkillBigWill`)
- **Live-Seite (GitHub Pages):** https://error6669.github.io/NoSkillBigWill/
- **Login-Passwort (Bearbeitungsmodus):** `NoSkillBigWill2026` — **kein echter Sicherheitsschutz**, nur eine UI-Sperre gegen versehentliches Verändern durch normale Besucher (Passwort steht im öffentlichen Code).

## Ursprüngliche Anforderungen (Kurzfassung des Start-Prompts)

Der Ausgangsauftrag beschrieb eine React+TypeScript+Vite-App mit:
- localStorage-Persistenz + manuellem JSON-Export/Import als Backup
- clientseitigem PDF-Export (jsPDF)
- schlichtem/sportlichem Design
- genauen Tennis-Zählregeln: Gruppenphase/Viertelfinale = 2 Sätze bis 4 Games (Tiebreak bei 4:4 bis 5), Matchtiebreak bis 7; Halbfinale/Finale/Kleines Finale = 2 Sätze bis 6 Games (Tiebreak bei 6:6 bis 7), Matchtiebreak bis 10
- genauer Tiebreak-Tabellenlogik: bei Gleichstand von 2 Teams entscheidet das direkte Duell; bei 3+ Teams eine Mini-Tabelle nur unter den betroffenen Teams, danach Gesamt-Gamedifferenz, danach Gesamt-gewonnene Games
- w.o.-Handling (Checkbox beim verlierenden Team)
- einem 7-Meilensteine-Bauplan, der mit "Feinschliff" (Polishing) endete

Alle 7 Meilensteine sind fertig. Danach kamen zahlreiche weitere Erweiterungen dazu (siehe unten).

## Architektur & Tech-Stack

- **React 19 + TypeScript + Vite**, kein Router (Tab-basierte Navigation über React State)
- **State-Management:** React Context (`src/state/AppStateContext.tsx`) — ein zentrales `AppState`-Objekt (Teams, Matches, Slots, Tageskonfigurationen, KO-Format-Einstellungen), automatisch in `localStorage` gespeichert (Key `turnier-app-state-v1`)
- **Auth:** `src/state/AuthContext.tsx` — Passwort-Check, Edit-Status in `localStorage` (Key `turnier-edit-mode-v1`). Alle verändernden Funktionen in `AppStateContext` sind zentral über einen `guardAction`-Wrapper abgesichert (nicht nur UI-Elemente ausgeblendet/deaktiviert, sondern die Aktionen selbst greifen im ausgeloggten Zustand nicht).
- **KO-Auflösung:** `src/lib/koResolution.ts` — rein rechnerisches, nie mutierendes Auflösen von Team-Referenzen (`resolveTeamReference`), damit nachträgliche Ergebniskorrekturen die KO-Bracket-Anzeige immer korrekt neu berechnen.
- **Tiebreak-Logik:** `src/lib/standings.ts`
- **PDF-Export:** `src/lib/pdf/*.ts` (jsPDF, 3 Module: Gruppen, Platzplan, KO-Phase + gemeinsames Theme)
- **Veröffentlichen/Sync:** `src/lib/publish.ts` — `public/tournament-data.json` ist die gemeinsame, öffentlich lesbare Datenquelle. Beim Laden (nur über http/https, nicht `file://`) wird geprüft, ob eine neuere Version veröffentlicht wurde, und ggf. automatisch übernommen (nur wenn `publishedAt` neuer ist als der zuletzt bekannte Stand dieses Browsers — sonst bleiben lokale unveröffentlichte Änderungen beim Neuladen erhalten). Der "Veröffentlichen"-Button schreibt den aktuellen Stand über die GitHub-Contents-API in `public/tournament-data.json` (Commit-Message inkl. österreichischer Zeit). Der GitHub-Token dafür wird **pro Gerät** in `localStorage` gespeichert (Key `turnier-github-token-v1`), nie im Code.

## Zwei Build-Varianten (wichtig!)

`vite.config.ts` unterscheidet über die Env-Variable `GITHUB_PAGES_BASE`:

- **`npm run build`** (lokaler Gebrauch, `file://`): `base: './'`, Bundle als klassisches **IIFE** (kein `type="module"`, kein Code-Splitting) — ES-Module werden von Browsern immer im CORS-Modus geladen, was unter `file://` fehlschlägt. Zusätzlicher `postbuild`-Schritt (`scripts/strip-crossorigin.mjs`) entfernt `crossorigin`/`type="module"` aus `dist/index.html` und ergänzt `defer`.
- **`npm run build:pages`** (GitHub Pages, benötigt `GITHUB_PAGES_BASE=/NoSkillBigWill/` als Env-Var): normale ES-Module + Code-Splitting, `base` = Unterpfad. Wird automatisch von der GitHub-Action gesetzt (`github.event.repository.name`).

Beide Varianten sind nötig, weil Vite standardmäßig `crossorigin`/ES-Module-Skripte erzeugt, die unter `file://` nicht laden.

## Deployment (GitHub Actions)

`.github/workflows/deploy.yml` — läuft bei jedem Push auf `main`, baut mit `build:pages` und deployt auf GitHub Pages (Environment `github-pages`, muss unter **Settings → Pages → Source: GitHub Actions** stehen). Dauert nach einem Push ca. 30–60 Sekunden.

**Bekannte Eigenheit:** Der Workflow hat `concurrency: group: pages, cancel-in-progress: true` — bei mehreren Pushes/Veröffentlichungen kurz hintereinander bricht der ältere Lauf ab, bevor er fertig wird. Falls die Live-Seite nach einem Push nicht aktualisiert scheint: Actions-Tab prüfen, ggf. den Workflow manuell über "Run workflow" neu anstoßen (und dabei kurz nicht gleichzeitig pushen/veröffentlichen).

## Git-Workflow-Hinweise

- Der Nutzer ist mit der Kommandozeile nicht sehr vertraut — Git-Befehle im Chat kurz erklären, nicht nur ausführen.
- **Ich (Claude) darf laut Systemvorgabe die Git-Konfiguration nicht selbst setzen** und kann mich in diesem Sandbox-Terminal nicht interaktiv bei GitHub authentifizieren (kein TTY) — Pushes muss der Nutzer selbst in einem echten Terminal-Fenster ausführen (`git push`).
- **Sehr häufiges Muster:** Push wird mit "rejected (fetch first)" abgelehnt, weil zwischenzeitlich über den "Veröffentlichen"-Button ein Daten-Commit auf GitHub gelandet ist. Lösung immer gleich: `git fetch origin`, dann `git merge origin/main -m "..."` (i.d.R. konfliktfrei, da Daten- und Code-Änderungen meist unterschiedliche Dateien betreffen), dann erneut `git push`.
- Committen nur wenn explizit gewünscht; bisher wurde nach jeder fertigen Änderung committet und der Nutzer hat selbst gepusht.

## .gitignore-Wichtiges

`node_modules`, `dist`, `*.zip` (lokale Test-Builds), **`Auslosung.json`** und **`turnier-export-*.json`** (enthalten echte Spielernamen — niemals committen), `.claude/settings.local.json`.

## Test-/Cleanup-Workflow, der sich etabliert hat

Nach jeder Code-Änderung: `npx tsc --noEmit -p tsconfig.app.json`, dann `npm run build` (lokale Variante). Für UI-Verifikation: temporär `npm install --no-save playwright`, Wegwerf-Testskript nach `.check-*.mjs` im Projektroot schreiben, ausführen, danach **immer** wieder löschen + `rm -rf node_modules/playwright*` + `grep playwright package.json` zur Kontrolle, dass nichts liegen geblieben ist. Dev-Server für den Nutzer über `npm run dev` (Hintergrund) starten, wenn er selbst etwas ausprobieren will.

## Erledigte Meilensteine & Features (chronologisch)

**Ursprüngliche 7 Meilensteine:** Grunddaten/Setup, Gruppenphase (Tabellen, Tiebreak-Logik, Validierung), Platzplanung (Slot-Grid, Swap, PDF), Ergebniserfassung (Satz-/Matchtiebreak-Validierung, w.o.), KO-Phase (Bracket, pixelgenaue Positionierung, PDF), PDF-Exporte (3 Module), Feinschliff (Testdaten-Loader, Edge-Cases, Responsive/Dark-Mode).

**Danach zusätzlich umgesetzt:**
- Lokaler `file://`-Build (IIFE-Workaround, siehe oben)
- Git/GitHub-Repo aufgesetzt, `.gitignore` gehärtet
- Login-/Bearbeitungsschutz (`AuthContext`, zentrale `guardAction`-Absicherung, Ergebnisse-Reiter im ausgeloggten Zustand komplett ausgeblendet)
- GitHub-Pages-Hosting (dualer Build, Actions-Workflow)
- "Veröffentlichen"-Mechanismus (gemeinsames `tournament-data.json`, GitHub-API-Push, Fortschrittsbalken statt Meldung, pro-Gerät-Token)
- KO-Format pro Runde einstellbar (Viertelfinale/Halbfinale/Finale je "2 Sätze bis 4" oder "bis 6")
- Externe Anzeige (`?display=`-Query-Param, eigenes Fenster, nur Lese-Ansicht des Tages-Platzplans, Tag-Navigation mit Standardauswahl "heute", großzügigere Schrift, sticky Kopfzeile, farblich unterscheidbare Platz-Spalten-Überschriften, Auto-Update über das `storage`-Event bei Änderungen im Hauptfenster)
- Konflikt-Markierung in der Platzplanung (rot = Doppel doppelt zur selben Zeit verplant, orange = Doppel ohne Pause im direkt nächsten Zeitslot, nur im eingeloggten Zustand, berücksichtigt auch vorläufige KO-Teilnehmer)
- Diverses Feintuning: einheitliche Header-Buttons, Fokus-Text-Markierung bei Ergebnis-Eingabefeldern, "Meine Spiele"-Format vereinfacht (`vs. B2: Name` statt `Gruppe B: vs B2 Name`)

## Bekannte Eigenheiten / Wenn etwas komisch wirkt

- **Kein Merge bei "Veröffentlichen"**: Der Publish-Mechanismus überschreibt beim Klick den kompletten Datenstand — kein intelligentes Zusammenführen. Bei paralleler Bearbeitung auf mehreren Geräten kann die zuletzt veröffentlichte Version die andere komplett überschreiben. Für einen einzelnen Organisator unproblematisch.
- **Sync nur beim Laden, nicht laufend**: Ein bereits offener Tab merkt nicht automatisch, wenn irgendwo neu veröffentlicht wurde — echtes Neuladen der Seite nötig.
- **GitHub-Störungen**: Am 2026-07-09 gab es einen echten, dokumentierten GitHub-Actions-Ausfall (siehe githubstatus.com) — falls ein Workflow-Lauf lange in der Warteschlange hängt, lohnt sich ein Blick dorthin, bevor man an der eigenen Konfiguration zweifelt.
- **Externe Anzeige** ist bewusst komplett nicht-interaktiv (keine Buttons außer Tag-Vor/Zurück) — reine Projektions-/Zweitbildschirm-Ansicht.

## Offene Ideen (nicht umgesetzt, nur besprochen)

- Warnhinweis statt stillem Überschreiben, falls beim Laden eine neuere veröffentlichte Version lokale unveröffentlichte Änderungen verwerfen würde — bisher nicht gewünscht/gebaut.

## Befehle-Spickzettel

```bash
# Node/npm verfügbar machen (nvm)
export NVM_DIR="$HOME/.nvm" && \. "$NVM_DIR/nvm.sh"

npm run dev              # lokaler Dev-Server (localhost:5173)
npm run build             # lokaler file://-Build → dist/
GITHUB_PAGES_BASE=/NoSkillBigWill/ npm run build:pages   # Pages-Build testen
npx tsc --noEmit -p tsconfig.app.json   # Typecheck
npm run lint               # oxlint

git fetch origin && git merge origin/main -m "Merge remote-published tournament data"
git push
```
