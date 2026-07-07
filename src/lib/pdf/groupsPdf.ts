import { jsPDF } from 'jspdf'
import type { GroupId, Match, Standing, Team } from '../../types'
import { GROUP_IDS } from '../initialData'
import { getMatchRowDisplay } from '../matchDisplay'
import { computeGroupStandings, isGroupFinished } from '../standings'
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

const GRID_COLUMNS = 2
const GRID_ROWS = 2
const GROUPS_PER_PAGE = GRID_COLUMNS * GRID_ROWS
const GUTTER = 8
const BOX_TITLE_HEIGHT = 7
const BOX_PADDING = 4

/**
 * Baut den A4-Hochformat-PDF-Export der Gruppenphase: 4 Gruppen pro Seite,
 * je mit Tabelle (inkl. vorläufig/Endstand) und den Gruppenspielen samt
 * bereits eingetragenen Ergebnissen (Sieger fett hervorgehoben). Die
 * einzelnen Doppelnamen stehen bereits in der Tabelle und werden bei den
 * Spielen nicht nochmal wiederholt (dort nur die Positionscodes).
 */
export function generateGroupsPdf(teams: Team[], matches: Match[]): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const totalPages = Math.ceil(GROUP_IDS.length / GROUPS_PER_PAGE)

  const gridTop = HEADER_HEIGHT + 10
  const contentWidth = pageWidth - MARGIN_X * 2
  const boxWidth = (contentWidth - GUTTER * (GRID_COLUMNS - 1)) / GRID_COLUMNS
  const availableHeight = pageHeight - gridTop - FOOTER_RESERVED
  const boxHeight = (availableHeight - GUTTER * (GRID_ROWS - 1)) / GRID_ROWS

  GROUP_IDS.forEach((groupId, index) => {
    const pageIndex = Math.floor(index / GROUPS_PER_PAGE)
    const indexOnPage = index % GROUPS_PER_PAGE

    if (indexOnPage === 0) {
      if (pageIndex > 0) doc.addPage()
      drawPdfHeader(doc, pageWidth, 'Turnierplanung', 'Gruppenphase – Doppel-Tennisturnier')
      drawPdfFooter(doc, pageWidth, pageHeight, `Seite ${pageIndex + 1}/${totalPages}`)
    }

    const col = indexOnPage % GRID_COLUMNS
    const row = Math.floor(indexOnPage / GRID_COLUMNS)
    const x = MARGIN_X + col * (boxWidth + GUTTER)
    const y = gridTop + row * (boxHeight + GUTTER)

    const groupTeams = teams
      .filter((team) => team.groupId === groupId)
      .sort((a, b) => a.position - b.position)
    const groupMatches = matches.filter(
      (match) => match.type === 'group' && match.groupId === groupId,
    )

    drawGroupBox(doc, x, y, boxWidth, boxHeight, groupId, groupTeams, groupMatches)
  })

  return doc
}

function drawGroupBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  groupId: GroupId,
  groupTeams: Team[],
  groupMatches: Match[],
) {
  doc.setDrawColor(...COLOR_BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, width, height, 2, 2, 'S')

  const standings = computeGroupStandings(
    groupTeams.map((team) => team.id),
    groupMatches,
  )
  const finished = isGroupFinished(groupMatches)

  doc.setFillColor(...COLOR_PRIMARY)
  doc.roundedRect(x, y, width, BOX_TITLE_HEIGHT, 2, 2, 'F')
  doc.rect(x, y + BOX_TITLE_HEIGHT / 2, width, BOX_TITLE_HEIGHT / 2, 'F')

  doc.setTextColor(...COLOR_WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`Gruppe ${groupId}`, x + BOX_PADDING, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(finished ? 'Endstand' : 'vorläufig', x + width - BOX_PADDING, y + 5, {
    align: 'right',
  })

  const innerX = x + BOX_PADDING
  const innerWidth = width - BOX_PADDING * 2
  let cursorY = y + BOX_TITLE_HEIGHT + 9

  cursorY = drawStandingsTable(doc, innerX, cursorY, innerWidth, standings, groupTeams)
  cursorY += 7
  drawMatchList(doc, innerX, cursorY, innerWidth, groupMatches, groupTeams)
}

function drawStandingsTable(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  standings: Standing[],
  groupTeams: Team[],
): number {
  const statColWidth = 9
  const statColumns = ['Sp', 'S', 'N', '+/-', 'Pkt']
  const statsStartX = x + width - statColWidth * statColumns.length
  const positionColWidth = 12
  const nameColX = x + positionColWidth

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...COLOR_TEXT_MUTED)
  doc.text('Doppel', x, y)
  doc.text('Name', nameColX, y)
  statColumns.forEach((label, index) => {
    doc.text(label, statsStartX + index * statColWidth, y)
  })

  doc.setDrawColor(...COLOR_BORDER)
  doc.setLineWidth(0.2)
  doc.line(x, y + 2, x + width, y + 2)

  let rowY = y + 8
  standings.forEach((standing) => {
    const team = groupTeams.find((entry) => entry.id === standing.teamId)
    const isLeader = standing.rank === 1

    doc.setFont('helvetica', isLeader ? 'bold' : 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...(isLeader ? COLOR_PRIMARY_DARK : COLOR_TEXT))
    doc.text(team?.id ?? standing.teamId, x, rowY)
    doc.setTextColor(...(isLeader ? COLOR_PRIMARY_DARK : COLOR_TEXT))
    doc.text(team?.displayName || '– offen –', nameColX, rowY, {
      maxWidth: statsStartX - nameColX - 3,
    })

    const diffText =
      standing.gamesDifference > 0 ? `+${standing.gamesDifference}` : String(standing.gamesDifference)
    const values = [
      String(standing.matchesPlayed),
      String(standing.wins),
      String(standing.losses),
      diffText,
      String(standing.points),
    ]
    values.forEach((value, index) => {
      doc.text(value, statsStartX + index * statColWidth, rowY)
    })

    rowY += 7
  })

  return rowY
}

function drawMatchList(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  groupMatches: Match[],
  groupTeams: Team[],
): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...COLOR_TEXT_MUTED)
  doc.text(`Spiele (${groupMatches.length})`, x, y)

  let rowY = y + 7
  groupMatches.forEach((match) => {
    const display = getMatchRowDisplay(match, groupTeams, groupMatches)
    const team1IsWinner = Boolean(display.winnerId) && display.winnerId === display.team1Id
    const team2IsWinner = Boolean(display.winnerId) && display.winnerId === display.team2Id

    doc.setFontSize(7.5)
    let cursorX = x
    doc.setFont('helvetica', team1IsWinner ? 'bold' : 'normal')
    doc.setTextColor(...(team1IsWinner ? COLOR_PRIMARY_DARK : COLOR_TEXT))
    const team1Label = display.team1Id ?? '?'
    doc.text(team1Label, cursorX, rowY)
    cursorX += doc.getTextWidth(team1Label) + 3

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR_TEXT_MUTED)
    doc.text('vs', cursorX, rowY)
    cursorX += doc.getTextWidth('vs') + 3

    doc.setFont('helvetica', team2IsWinner ? 'bold' : 'normal')
    doc.setTextColor(...(team2IsWinner ? COLOR_PRIMARY_DARK : COLOR_TEXT))
    const team2Label = display.team2Id ?? '?'
    doc.text(team2Label, cursorX, rowY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR_TEXT_MUTED)
    doc.text(display.resultText ?? '–', x + width, rowY, { align: 'right' })

    rowY += 6.5
  })

  return rowY
}
