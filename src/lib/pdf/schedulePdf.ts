import { jsPDF } from 'jspdf'
import type { AppState, DayConfig, Location, Match, Slot, Team } from '../../types'
import { formatFullDate, formatWeekday } from '../scheduling'
import { getMatchRowDisplay } from '../matchDisplay'
import {
  COLOR_BORDER,
  COLOR_MAUTHAUSEN,
  COLOR_PRIMARY,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  COLOR_WHITE,
  drawPdfFooter,
  drawPdfHeader,
  HEADER_HEIGHT,
  MARGIN_X,
  type RGB,
} from './pdfTheme'

interface SchedulePage {
  dayConfig: DayConfig
  location: Location
  slots: Slot[]
}

const LANGENSTEIN_COURTS = [1, 2, 3]
const MAUTHAUSEN_COURTS = [1, 2]
/** Zeilenhöhe knapp bemessen für 3 Textzeilen (Positionen, Team1 vs., Team2) + etwas Polster. */
const ROW_HEIGHT = 17

function buildSchedulePages(state: AppState, dayConfigs: DayConfig[]): SchedulePage[] {
  const pages: SchedulePage[] = []
  for (const dayConfig of dayConfigs) {
    const daySlots = state.slots.filter((slot) => slot.day === dayConfig.day)
    const langensteinSlots = daySlots.filter((slot) => slot.location === 'Langenstein')
    const mauthausenSlots = daySlots.filter((slot) => slot.location === 'Mauthausen')

    if (langensteinSlots.length > 0) {
      pages.push({ dayConfig, location: 'Langenstein', slots: langensteinSlots })
    }
    if (mauthausenSlots.some((slot) => slot.assignedMatchId)) {
      pages.push({ dayConfig, location: 'Mauthausen', slots: mauthausenSlots })
    }
  }
  return pages
}

function buildSchedulePdfFromPages(pages: SchedulePage[], state: AppState): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  if (pages.length === 0) {
    drawEmptyNotice(doc)
    return doc
  }

  pages.forEach((page, index) => {
    if (index > 0) doc.addPage()
    drawDaySchedulePage(doc, page, state.matches, state.teams, index + 1, pages.length)
  })

  return doc
}

/**
 * Baut den A4-Hochformat-PDF-Export der Platzplanung für alle Spieltage:
 * eine Seite je Spieltag+Standort. Die Langenstein-Seite eines Tages wird
 * immer erzeugt (sobald für den Tag Slots existieren), die Mauthausen-Seite
 * nur, wenn dort tatsächlich mindestens ein Match zugeordnet ist.
 */
export function generateSchedulePdf(state: AppState): jsPDF {
  const sortedDays = [...state.dayConfigs].sort((a, b) => a.date.localeCompare(b.date))
  return buildSchedulePdfFromPages(buildSchedulePages(state, sortedDays), state)
}

/**
 * Wie generateSchedulePdf, aber beschränkt auf einen einzelnen Spieltag.
 */
export function generateSchedulePdfForDay(state: AppState, day: number): jsPDF {
  const dayConfig = state.dayConfigs.find((config) => config.day === day)
  const pages = dayConfig ? buildSchedulePages(state, [dayConfig]) : []
  return buildSchedulePdfFromPages(pages, state)
}

function drawEmptyNotice(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  drawPdfHeader(doc, pageWidth, 'Platzplanung', 'Doppel-Tennisturnier')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR_TEXT_MUTED)
  doc.text(
    'Es wurden noch keine Spieltage mit Slots angelegt.',
    MARGIN_X,
    HEADER_HEIGHT + 16,
  )
  drawPdfFooter(doc, pageWidth, pageHeight, 'Seite 1/1')
}

function drawDaySchedulePage(
  doc: jsPDF,
  page: SchedulePage,
  matches: Match[],
  teams: Team[],
  pageNumber: number,
  totalPages: number,
) {
  const { dayConfig, location, slots } = page
  const accentColor: RGB = location === 'Langenstein' ? COLOR_PRIMARY : COLOR_MAUTHAUSEN
  const courts = location === 'Langenstein' ? LANGENSTEIN_COURTS : MAUTHAUSEN_COURTS

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const weekday = formatWeekday(dayConfig.date)
  const dateLabel = formatFullDate(dayConfig.date)
  drawPdfHeader(doc, pageWidth, 'Platzplanung', `${weekday}, ${dateLabel} – ${location}`, accentColor)

  const times = Array.from(new Set(slots.map((slot) => slot.startTime))).sort()
  const timeColWidth = 13
  const headerRowHeight = 8
  const contentWidth = pageWidth - MARGIN_X * 2
  const courtColWidth = (contentWidth - timeColWidth) / courts.length
  const tableTop = HEADER_HEIGHT + 10
  // Zeilen nur so hoch wie der Inhalt (3 Textzeilen) tatsächlich braucht,
  // nicht auf die Seitenhöhe gestreckt.
  const rowHeight = ROW_HEIGHT

  doc.setFillColor(...accentColor)
  doc.rect(MARGIN_X, tableTop, timeColWidth, headerRowHeight, 'F')
  courts.forEach((_court, index) => {
    doc.rect(
      MARGIN_X + timeColWidth + index * courtColWidth,
      tableTop,
      courtColWidth,
      headerRowHeight,
      'F',
    )
  })

  doc.setTextColor(...COLOR_WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Uhrzeit', MARGIN_X + timeColWidth / 2, tableTop + headerRowHeight / 2 + 1.5, {
    align: 'center',
  })
  courts.forEach((court, index) => {
    const x = MARGIN_X + timeColWidth + index * courtColWidth
    doc.text(`Platz ${court}`, x + courtColWidth / 2, tableTop + headerRowHeight / 2 + 1.5, {
      align: 'center',
    })
  })

  times.forEach((time, rowIndex) => {
    const rowY = tableTop + headerRowHeight + rowIndex * rowHeight

    doc.setDrawColor(...COLOR_BORDER)
    doc.setLineWidth(0.2)
    doc.rect(MARGIN_X, rowY, timeColWidth, rowHeight, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOR_TEXT_MUTED)
    doc.text(time, MARGIN_X + timeColWidth / 2, rowY + rowHeight / 2 + 1, { align: 'center' })

    courts.forEach((court, colIndex) => {
      const x = MARGIN_X + timeColWidth + colIndex * courtColWidth
      doc.rect(x, rowY, courtColWidth, rowHeight, 'S')

      const slot = slots.find((entry) => entry.startTime === time && entry.court === court)
      const match = slot ? matches.find((m) => m.id === slot.assignedMatchId) : undefined

      if (match) {
        const display = getMatchRowDisplay(match, teams, matches)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(...COLOR_TEXT)
        doc.text(display.positions, x + 2, rowY + 4, { maxWidth: courtColWidth - 4 })

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...COLOR_TEXT_MUTED)
        doc.text(`${display.team1Text} vs.`, x + 2, rowY + 9, { maxWidth: courtColWidth - 4 })
        doc.text(display.team2Text, x + 2, rowY + 13.5, { maxWidth: courtColWidth - 4 })
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...COLOR_TEXT_MUTED)
        doc.text('frei', x + courtColWidth / 2, rowY + rowHeight / 2 + 1, { align: 'center' })
      }
    })
  })

  drawPdfFooter(doc, pageWidth, pageHeight, `Seite ${pageNumber}/${totalPages}`)
}
