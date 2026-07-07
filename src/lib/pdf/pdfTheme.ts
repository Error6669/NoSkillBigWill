export type RGB = [number, number, number]

export const COLOR_PRIMARY: RGB = [31, 111, 67]
export const COLOR_PRIMARY_DARK: RGB = [23, 83, 47]
export const COLOR_MAUTHAUSEN: RGB = [47, 111, 143]
export const COLOR_MAUTHAUSEN_DARK: RGB = [35, 86, 111]
export const COLOR_TEXT: RGB = [27, 35, 30]
export const COLOR_TEXT_MUTED: RGB = [92, 103, 95]
export const COLOR_BORDER: RGB = [221, 227, 221]
export const COLOR_WHITE: RGB = [255, 255, 255]

export const MARGIN_X = 14
export const HEADER_HEIGHT = 24
export const FOOTER_RESERVED = 14

export function drawPdfHeader(
  doc: import('jspdf').jsPDF,
  pageWidth: number,
  title: string,
  subtitle: string,
  accentColor: RGB = COLOR_PRIMARY,
) {
  doc.setFillColor(...accentColor)
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')

  doc.setTextColor(...COLOR_WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(title, MARGIN_X, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(subtitle, MARGIN_X, 20)
}

export function drawPdfFooter(
  doc: import('jspdf').jsPDF,
  pageWidth: number,
  pageHeight: number,
  pageLabel: string,
) {
  const timestamp = new Date().toLocaleString('de-AT')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLOR_TEXT_MUTED)
  doc.text(`Erstellt am ${timestamp}`, MARGIN_X, pageHeight - 8)
  doc.text(pageLabel, pageWidth - MARGIN_X, pageHeight - 8, { align: 'right' })
}
