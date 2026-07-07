import type { Match } from '../types'

/**
 * Erzeugt das strukturelle KO-Baum-Gerüst (Viertelfinale, Halbfinale, Finale,
 * kleines Finale). Die Teilnehmer stehen erst fest, sobald die Gruppenphase
 * bzw. die vorherigen KO-Runden abgeschlossen sind - das Auflösen anhand der
 * Tabellen kommt in einem späteren Schritt. Bis dahin zeigen team1Ref/team2Ref
 * nur, worauf das Match wartet (z.B. "Sieger Gruppe A").
 */
export function generateKoMatches(): Match[] {
  const matches: Match[] = [
    {
      id: 'vf1',
      type: 'quarterfinal',
      round: 1,
      label: 'VF1',
      team1Ref: { kind: 'groupWinner', groupId: 'A' },
      team2Ref: { kind: 'groupWinner', groupId: 'H' },
      team1Resolved: false,
      team2Resolved: false,
      status: 'unscheduled',
    },
    {
      id: 'vf2',
      type: 'quarterfinal',
      round: 1,
      label: 'VF2',
      team1Ref: { kind: 'groupWinner', groupId: 'B' },
      team2Ref: { kind: 'groupWinner', groupId: 'G' },
      team1Resolved: false,
      team2Resolved: false,
      status: 'unscheduled',
    },
    {
      id: 'vf3',
      type: 'quarterfinal',
      round: 1,
      label: 'VF3',
      team1Ref: { kind: 'groupWinner', groupId: 'C' },
      team2Ref: { kind: 'groupWinner', groupId: 'F' },
      team1Resolved: false,
      team2Resolved: false,
      status: 'unscheduled',
    },
    {
      id: 'vf4',
      type: 'quarterfinal',
      round: 1,
      label: 'VF4',
      team1Ref: { kind: 'groupWinner', groupId: 'D' },
      team2Ref: { kind: 'groupWinner', groupId: 'E' },
      team1Resolved: false,
      team2Resolved: false,
      status: 'unscheduled',
    },
    {
      id: 'sf1',
      type: 'semifinal',
      round: 2,
      label: 'HF1',
      team1Ref: { kind: 'matchWinner', matchId: 'vf1' },
      team2Ref: { kind: 'matchWinner', matchId: 'vf4' },
      team1Resolved: false,
      team2Resolved: false,
      status: 'unscheduled',
    },
    {
      id: 'sf2',
      type: 'semifinal',
      round: 2,
      label: 'HF2',
      team1Ref: { kind: 'matchWinner', matchId: 'vf2' },
      team2Ref: { kind: 'matchWinner', matchId: 'vf3' },
      team1Resolved: false,
      team2Resolved: false,
      status: 'unscheduled',
    },
    {
      id: 'final',
      type: 'final',
      round: 3,
      label: 'Finale',
      team1Ref: { kind: 'matchWinner', matchId: 'sf1' },
      team2Ref: { kind: 'matchWinner', matchId: 'sf2' },
      team1Resolved: false,
      team2Resolved: false,
      status: 'unscheduled',
    },
    {
      id: 'third-place',
      type: 'thirdPlace',
      round: 4,
      label: 'Kleines Finale',
      team1Ref: { kind: 'matchLoser', matchId: 'sf1' },
      team2Ref: { kind: 'matchLoser', matchId: 'sf2' },
      team1Resolved: false,
      team2Resolved: false,
      status: 'unscheduled',
    },
  ]

  return matches
}
