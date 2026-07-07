import { jsPDF } from 'jspdf'
import type { AppState, Match, Team, TeamReference } from '../../types'
import { resolveTeamReference } from '../koResolution'
import { describePlaceholder, formatTeamLabel } from '../teamReference'
import { formatWeekday } from '../scheduling'
import {
  COLOR_BORDER,
  COLOR_PRIMARY,
  COLOR_PRIMARY_DARK,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  COLOR_WHITE,
  drawPdfFooter,
  drawPdfHeader,
  FOOTER_RESERVED,
  HEADER_HEIGHT,
  MARGIN_X,
} from './pdfTheme'

const QUARTERFINAL_IDS = ['vf1', 'vf4', 'vf2', 'vf3']
const GAP = 6
const COL_GAP = 12
const BOX_TITLE_HEIGHT = 6

interface SideInfo {
  text: string
  teamId?: string
  isFinal: boolean
}

/**
 * Kompakter Termin-Text fürs PDF: Wochentag statt Datum (Platzsparender,
 * besser lesbar in großer Schrift), z.B. "Montag · 09:00–10:00 ·
 * Langenstein Platz 1".
 */
function getPdfScheduleText(match: Match, state: AppState): string | undefined {
  if (!match.scheduledSlotId) return undefined
  const slot = state.slots.find((entry) => entry.id === match.scheduledSlotId)
  if (!slot) return undefined
  const dayConfig = state.dayConfigs.find((entry) => entry.day === slot.day)
  const weekday = dayConfig ? formatWeekday(dayConfig.date) : ''
  return `${weekday} · ${slot.startTime}–${slot.endTime} · ${slot.location} Platz ${slot.court}`
}

function resolveSide(ref: TeamReference, teams: Team[], allMatches: Match[]): SideInfo {
  const resolution = resolveTeamReference(ref, teams, allMatches)
  if (resolution.teamId) {
    return {
      text: formatTeamLabel(resolution.teamId, teams),
      teamId: resolution.teamId,
      isFinal: resolution.isFinal,
    }
  }
  return { text: describePlaceholder(ref, allMatches), isFinal: false }
}

/**
 * Baut den A4-Querformat-PDF-Export der KO-Phase: Viertelfinale, Halbfinale,
 * Finale und Kleines Finale als Turnierbaum auf einer Seite, mit Sieger-
 * Hervorhebung, vorläufig-Kennzeichnung und Termin/Ergebnis sofern vorhanden.
 */
export function generateKoPdf(state: AppState): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  drawPdfHeader(doc, pageWidth, 'Turnierplanung', 'KO-Phase – Doppel-Tennisturnier')

  const findMatch = (id: string) => state.matches.find((m) => m.id === id)

  const contentTop = HEADER_HEIGHT + 12
  const contentHeight = pageHeight - contentTop - FOOTER_RESERVED
  const contentWidth = pageWidth - MARGIN_X * 2
  const colWidth = (contentWidth - COL_GAP * 2) / 3

  const qfX = MARGIN_X
  const hfX = MARGIN_X + colWidth + COL_GAP
  const finalX = MARGIN_X + (colWidth + COL_GAP) * 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXT_MUTED)
  doc.text('VIERTELFINALE', qfX, contentTop - 4)
  doc.text('HALBFINALE', hfX, contentTop - 4)
  doc.text('FINALE', finalX, contentTop - 4)

  const qfBoxHeight = (contentHeight - GAP * 3) / 4
  const qfCenters: number[] = []
  QUARTERFINAL_IDS.forEach((id, index) => {
    const y = contentTop + index * (qfBoxHeight + GAP)
    qfCenters.push(y + qfBoxHeight / 2)
    const match = findMatch(id)
    if (match) drawMatchBox(doc, qfX, y, colWidth, qfBoxHeight, match, state)
  })

  const hf1Center = (qfCenters[0] + qfCenters[1]) / 2
  const hf2Center = (qfCenters[2] + qfCenters[3]) / 2
  const hfBoxHeight = qfBoxHeight

  const sf1 = findMatch('sf1')
  if (sf1) drawMatchBox(doc, hfX, hf1Center - hfBoxHeight / 2, colWidth, hfBoxHeight, sf1, state)
  const sf2 = findMatch('sf2')
  if (sf2) drawMatchBox(doc, hfX, hf2Center - hfBoxHeight / 2, colWidth, hfBoxHeight, sf2, state)

  const finalCenter = (hf1Center + hf2Center) / 2
  const finalBoxHeight = hfBoxHeight
  const finalY = finalCenter - finalBoxHeight / 2
  const finalMatch = findMatch('final')
  if (finalMatch) drawMatchBox(doc, finalX, finalY, colWidth, finalBoxHeight, finalMatch, state)

  const thirdPlaceY = finalY + finalBoxHeight + GAP + 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXT_MUTED)
  doc.text('KLEINES FINALE', finalX, thirdPlaceY - 4)
  const thirdPlaceMatch = findMatch('third-place')
  if (thirdPlaceMatch) {
    drawMatchBox(doc, finalX, thirdPlaceY, colWidth, finalBoxHeight, thirdPlaceMatch, state)
  }

  drawPdfFooter(doc, pageWidth, pageHeight, 'Seite 1/1')

  return doc
}

function drawMatchBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  match: Match,
  state: AppState,
) {
  doc.setDrawColor(...COLOR_BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, height, 2, 2, 'S')

  doc.setFillColor(...COLOR_PRIMARY)
  doc.roundedRect(x, y, width, BOX_TITLE_HEIGHT, 2, 2, 'F')
  doc.rect(x, y + BOX_TITLE_HEIGHT / 2, width, BOX_TITLE_HEIGHT / 2, 'F')
  doc.setTextColor(...COLOR_WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(match.label, x + 3, y + 4.3)

  const side1 = resolveSide(match.team1Ref, state.teams, state.matches)
  const side2 = resolveSide(match.team2Ref, state.teams, state.matches)
  const isCompleted = match.status === 'completed'
  const sets = match.result?.sets ?? []
  const matchTiebreak = match.result?.matchTiebreak

  const rowsTop = y + BOX_TITLE_HEIGHT + 4.5
  const rowHeight = 7
  ;[side1, side2].forEach((side, index) => {
    const rowY = rowsTop + index * rowHeight
    const isWinner = Boolean(match.winner) && side.teamId === match.winner
    const nameMaxWidth = isCompleted ? width - 30 : width - 6

    doc.setFont('helvetica', isWinner ? 'bold' : 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...(isWinner ? COLOR_PRIMARY_DARK : COLOR_TEXT))
    doc.text(side.text, x + 3, rowY, { maxWidth: nameMaxWidth })

    if (side.teamId && !side.isFinal) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...COLOR_TEXT_MUTED)
      doc.text('(vorläufig)', x + width - 3, rowY, { align: 'right' })
    }

    if (isCompleted) {
      const gamesForSide = sets.map((set) => (index === 0 ? set.team1Games : set.team2Games))
      const tiebreakForSide = matchTiebreak
        ? index === 0
          ? matchTiebreak.team1Points
          : matchTiebreak.team2Points
        : undefined
      const scoreParts = gamesForSide.map(String)
      if (tiebreakForSide !== undefined) scoreParts.push(`(${tiebreakForSide})`)

      doc.setFont('helvetica', isWinner ? 'bold' : 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(...(isWinner ? COLOR_PRIMARY_DARK : COLOR_TEXT))
      doc.text(scoreParts.join('   '), x + width - 3, rowY, { align: 'right' })
    }
  })

  let metaY = rowsTop + 2 * rowHeight + 2.5
  const scheduleText = getPdfScheduleText(match, state)
  if (scheduleText) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_TEXT)
    doc.text(scheduleText, x + 3, metaY, { maxWidth: width - 6 })
    metaY += 5
  }

  if (match.status === 'walkover') {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(200, 60, 50)
    doc.text('kampflos', x + 3, metaY, { maxWidth: width - 6 })
  }
}
