import type { Match, Slot, Team } from '../types'
import { resolveTeamReference } from './koResolution'

export interface ScheduleConflicts {
  redSlotIds: Set<string>
  orangeSlotIds: Set<string>
}

interface TeamSlotAssignment {
  teamId: string
  slotId: string
  startTime: string
}

const EMPTY_CONFLICTS: ScheduleConflicts = { redSlotIds: new Set(), orangeSlotIds: new Set() }

/**
 * Ermittelt Doppelbelegungs- (rot) und Rücken-an-Rücken-Konflikte (orange)
 * für die Slots eines einzelnen Spieltags:
 * - rot: dasselbe Doppel spielt zur exakt selben Uhrzeit auf zwei Plätzen
 *   (unmöglich).
 * - orange: dasselbe Doppel spielt in zwei direkt aufeinanderfolgenden
 *   Zeitslots (auch standortübergreifend), hat also keine Pause dazwischen.
 * Berücksichtigt auch KO-Spiele mit noch vorläufigen Teilnehmern (aktuell
 * aufgelöstes Team, siehe resolveTeamReference).
 */
export function computeScheduleConflicts(
  daySlots: Slot[],
  matches: Match[],
  teams: Team[],
): ScheduleConflicts {
  if (daySlots.length === 0) return EMPTY_CONFLICTS

  const sortedTimes = Array.from(new Set(daySlots.map((slot) => slot.startTime))).sort()
  const timeIndex = new Map(sortedTimes.map((time, index) => [time, index]))

  const assignments: TeamSlotAssignment[] = []
  for (const slot of daySlots) {
    if (!slot.assignedMatchId) continue
    const match = matches.find((m) => m.id === slot.assignedMatchId)
    if (!match) continue
    const r1 = resolveTeamReference(match.team1Ref, teams, matches)
    const r2 = resolveTeamReference(match.team2Ref, teams, matches)
    for (const resolution of [r1, r2]) {
      if (resolution.teamId) {
        assignments.push({ teamId: resolution.teamId, slotId: slot.id, startTime: slot.startTime })
      }
    }
  }

  const byTeam = new Map<string, TeamSlotAssignment[]>()
  for (const assignment of assignments) {
    const list = byTeam.get(assignment.teamId) ?? []
    list.push(assignment)
    byTeam.set(assignment.teamId, list)
  }

  const redSlotIds = new Set<string>()
  const orangeSlotIds = new Set<string>()

  for (const teamAssignments of byTeam.values()) {
    if (teamAssignments.length < 2) continue
    for (let i = 0; i < teamAssignments.length; i++) {
      for (let j = i + 1; j < teamAssignments.length; j++) {
        const a = teamAssignments[i]
        const b = teamAssignments[j]
        if (a.startTime === b.startTime) {
          redSlotIds.add(a.slotId)
          redSlotIds.add(b.slotId)
          continue
        }
        const indexA = timeIndex.get(a.startTime)
        const indexB = timeIndex.get(b.startTime)
        if (indexA !== undefined && indexB !== undefined && Math.abs(indexA - indexB) === 1) {
          orangeSlotIds.add(a.slotId)
          orangeSlotIds.add(b.slotId)
        }
      }
    }
  }

  // Rot (unmöglich) hat Vorrang vor Orange (nur eng getaktet), falls ein
  // Slot rein rechnerisch in beide Kategorien fallen würde.
  for (const id of redSlotIds) {
    orangeSlotIds.delete(id)
  }

  return { redSlotIds, orangeSlotIds }
}
