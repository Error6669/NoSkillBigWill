import type { AppState, Match, MatchTiebreak, MatchType, Result, SetScore, Team } from '../types'
import { GROUP_IDS, TEAM_POSITIONS } from './initialData'
import { buildDisplayName } from './teams'
import { generateGroupMatches } from './groupMatches'
import { generateKoMatches } from './koMatches'
import { applyResultToMatch, DEFAULT_KO_FORMAT_SETTINGS, getMatchFormat, type MatchFormat } from './matchResult'

/**
 * 32 Beispiel-Namenspaare für die Testdaten-Funktion - rein zum schnellen
 * Ausprobieren der App, ohne alles händisch eintippen zu müssen.
 */
const SAMPLE_PLAYER_PAIRS: [string, string][] = [
  ['Klaus', 'Mario'],
  ['Thomas', 'Alexander'],
  ['Peter', 'Stefan'],
  ['Anna', 'Julia'],
  ['Max', 'Moritz'],
  ['Lisa', 'Nora'],
  ['Tom', 'Jakob'],
  ['Sabine', 'Christina'],
  ['Michael', 'Andreas'],
  ['Georg', 'Franz'],
  ['Elke', 'Petra'],
  ['Herbert', 'Karl'],
  ['Sepp', 'Hans'],
  ['Markus', 'Daniel'],
  ['Verena', 'Sonja'],
  ['Martina', 'Bettina'],
  ['Robert', 'Werner'],
  ['Gerhard', 'Helmut'],
  ['Claudia', 'Ingrid'],
  ['Renate', 'Florian'],
  ['Sebastian', 'Patrick'],
  ['Lukas', 'Simon'],
  ['David', 'Manuel'],
  ['Fabian', 'Nicole'],
  ['Sandra', 'Melanie'],
  ['Jasmin', 'Wolfgang'],
  ['Rudolf', 'Alfred'],
  ['Kurt', 'Bernd'],
  ['Dieter', 'Johann'],
  ['Josef', 'Monika'],
  ['Brigitte', 'Ursula'],
  ['Gabriele', 'Walter'],
]

export function createSampleTeams(): Team[] {
  let pairIndex = 0
  return GROUP_IDS.flatMap((groupId) =>
    TEAM_POSITIONS.map((position) => {
      const [player1Name, player2Name] = SAMPLE_PLAYER_PAIRS[pairIndex % SAMPLE_PLAYER_PAIRS.length]
      pairIndex += 1
      return {
        id: `${groupId}${position}`,
        groupId,
        position,
        player1Name,
        player2Name,
        displayName: buildDisplayName(player1Name, player2Name),
      }
    }),
  )
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomBool(probabilityTrue: number): boolean {
  return Math.random() < probabilityTrue
}

/** Erzeugt einen zufälligen, regelkonformen Satzstand für den angegebenen Sieger. */
function randomSet(winnerIsTeam1: boolean, format: MatchFormat): SetScore {
  const { setGames, setTiebreakTo } = format
  const isTiebreak = randomBool(0.2)
  const winnerGames = isTiebreak ? setTiebreakTo : setGames
  const loserGames = isTiebreak ? setGames : randomInt(0, setGames - 1)
  return winnerIsTeam1
    ? { team1Games: winnerGames, team2Games: loserGames, tiebreak: isTiebreak }
    : { team1Games: loserGames, team2Games: winnerGames, tiebreak: isTiebreak }
}

/** Erzeugt einen zufälligen, regelkonformen Matchtiebreak-Stand (2 Punkte Vorsprung). */
function randomMatchTiebreak(winnerIsTeam1: boolean, format: MatchFormat): MatchTiebreak {
  const { matchTiebreakTo } = format
  const winnerPoints = matchTiebreakTo + randomInt(0, 2)
  const loserPoints = randomInt(0, winnerPoints - 2)
  return winnerIsTeam1
    ? { team1Points: winnerPoints, team2Points: loserPoints }
    : { team1Points: loserPoints, team2Points: winnerPoints }
}

/**
 * Erzeugt ein zufälliges, aber immer regelkonformes Ergebnis: meist ein
 * klarer 2-Satz-Sieg (mit gelegentlichem Tiebreak-Satz), in ca. 25% der
 * Fälle ein 1:1 mit entscheidendem Matchtiebreak.
 */
function randomResult(type: MatchType): Result {
  const format = getMatchFormat(type)
  const splitSets = randomBool(0.25)
  const matchWinnerIsTeam1 = randomBool(0.5)

  let sets: SetScore[]
  let matchTiebreak: MatchTiebreak | undefined

  if (splitSets) {
    sets = [randomSet(true, format), randomSet(false, format)]
    matchTiebreak = randomMatchTiebreak(matchWinnerIsTeam1, format)
  } else {
    sets = [randomSet(matchWinnerIsTeam1, format), randomSet(matchWinnerIsTeam1, format)]
  }

  return { sets, matchTiebreak, walkover: false, gamesTeam1: 0, gamesTeam2: 0 }
}

export function createSampleState(): AppState {
  const teams = createSampleTeams()
  let matches: Match[] = [...generateGroupMatches(teams), ...generateKoMatches()]

  const applyRandomResult = (matchId: string) => {
    matches = matches.map((match) => {
      if (match.id !== matchId) return match
      return applyResultToMatch(match, randomResult(match.type), teams, matches)
    })
  }

  // Reihenfolge ist wichtig: KO-Runden lösen ihre Teilnehmer erst auf, sobald
  // die jeweils vorherige Runde (Gruppenphase bzw. Vorrunde) abgeschlossen ist.
  matches.filter((match) => match.type === 'group').forEach((match) => applyRandomResult(match.id))
  ;['vf1', 'vf2', 'vf3', 'vf4'].forEach(applyRandomResult)
  ;['sf1', 'sf2'].forEach(applyRandomResult)
  ;['final', 'third-place'].forEach(applyRandomResult)

  return { teams, matches, slots: [], dayConfigs: [], koFormatSettings: DEFAULT_KO_FORMAT_SETTINGS }
}
