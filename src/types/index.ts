export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'

export type TeamPosition = 1 | 2 | 3 | 4

export interface Team {
  id: string
  groupId: GroupId
  position: TeamPosition
  player1Name: string
  player2Name: string
  displayName: string
}

export type MatchType =
  | 'group'
  | 'quarterfinal'
  | 'semifinal'
  | 'final'
  | 'thirdPlace'

export type MatchStatus = 'unscheduled' | 'scheduled' | 'completed' | 'walkover'

/**
 * Referenziert einen Teilnehmer eines Matches. Bei Gruppenspielen ist das
 * direkt ein Team. Bei KO-Spielen kann es noch offen sein (Gruppensieger
 * oder Sieger/Verlierer eines anderen Matches) und wird erst zur Laufzeit
 * aufgelöst (siehe Match.team1Resolved/team2Resolved).
 */
export type TeamReference =
  | { kind: 'team'; teamId: string }
  | { kind: 'groupWinner'; groupId: GroupId }
  | { kind: 'matchWinner'; matchId: string }
  | { kind: 'matchLoser'; matchId: string }

export interface SetScore {
  team1Games: number
  team2Games: number
  /** true, wenn dieser Satz per Tiebreak entschieden wurde */
  tiebreak: boolean
}

export interface MatchTiebreak {
  team1Points: number
  team2Points: number
}

export interface Result {
  sets: SetScore[]
  matchTiebreak?: MatchTiebreak
  walkover: boolean
  /** Team, das das Match per w.o. verliert */
  walkoverTeam?: string
  winnerTeamId?: string
  gamesTeam1: number
  gamesTeam2: number
}

export interface Match {
  id: string
  type: MatchType
  groupId?: GroupId
  round: number
  label: string
  team1Ref: TeamReference
  team2Ref: TeamReference
  /** true, sobald team1Ref auf ein konkretes, feststehendes Team aufgelöst ist */
  team1Resolved: boolean
  team2Resolved: boolean
  scheduledSlotId?: string
  result?: Result
  winner?: string
  loser?: string
  status: MatchStatus
}

export type Location = 'Langenstein' | 'Mauthausen'

export interface Slot {
  id: string
  day: number
  location: Location
  court: number
  startTime: string
  endTime: string
  assignedMatchId?: string
}

export interface Standing {
  teamId: string
  matchesPlayed: number
  wins: number
  losses: number
  points: number
  gamesWon: number
  gamesLost: number
  gamesDifference: number
  rank: number
}

export interface DayConfig {
  day: number
  /** ISO-Datum (YYYY-MM-DD), aus dem der Wochentag abgeleitet wird */
  date: string
  startTime: string
  endTime: string
  slotLengthMinutes: number
}

/** short = 2 Sätze bis 4 (Tiebreak bei 4:4 bis 5, Matchtiebreak bis 7). long = 2 Sätze bis 6 (Tiebreak bei 6:6 bis 7, Matchtiebreak bis 10). */
export type MatchFormatMode = 'short' | 'long'

export interface KoFormatSettings {
  quarterfinal: MatchFormatMode
  semifinal: MatchFormatMode
  /** gilt für Finale und Kleines Finale gemeinsam */
  final: MatchFormatMode
}

export interface AppState {
  teams: Team[]
  matches: Match[]
  slots: Slot[]
  dayConfigs: DayConfig[]
  koFormatSettings: KoFormatSettings
}
