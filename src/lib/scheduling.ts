import type { DayConfig, Location, Slot } from '../types'

export const COURTS: { location: Location; court: number }[] = [
  { location: 'Langenstein', court: 1 },
  { location: 'Langenstein', court: 2 },
  { location: 'Langenstein', court: 3 },
  { location: 'Mauthausen', court: 1 },
  { location: 'Mauthausen', court: 2 },
]

/**
 * Formatiert ein Datum als lokales ISO-Datum (YYYY-MM-DD). Bewusst ohne
 * toISOString(), das auf UTC normalisiert und dadurch in Zeitzonen östlich
 * von UTC (z.B. Europe/Vienna) auf den Vortag zurückfallen kann.
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Schlägt ein Default-Datum für einen neuen Spieltag vor: der Tag nach dem
 * bisher spätesten Spieltag, oder heute, wenn es noch keinen gibt.
 */
export function suggestNextDate(existingConfigs: DayConfig[]): string {
  if (existingConfigs.length === 0) {
    return toIsoDate(new Date())
  }
  const latest = existingConfigs
    .map((config) => config.date)
    .sort()
    .at(-1)!
  const nextDate = new Date(`${latest}T00:00:00`)
  nextDate.setDate(nextDate.getDate() + 1)
  return toIsoDate(nextDate)
}

export function createDefaultDayConfig(day: number, existingConfigs: DayConfig[]): DayConfig {
  return {
    day,
    date: suggestNextDate(existingConfigs),
    startTime: '09:00',
    endTime: '18:00',
    slotLengthMinutes: 60,
  }
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('de-AT', { weekday: 'long' })
const TAB_LABEL_FORMATTER = new Intl.DateTimeFormat('de-AT', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
})

export function formatWeekday(dateIso: string): string {
  if (!dateIso) return ''
  return WEEKDAY_FORMATTER.format(new Date(`${dateIso}T00:00:00`))
}

export function formatDayTabLabel(dateIso: string): string {
  if (!dateIso) return 'Datum wählen'
  return TAB_LABEL_FORMATTER.format(new Date(`${dateIso}T00:00:00`))
}

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat('de-AT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatFullDate(dateIso: string): string {
  if (!dateIso) return ''
  return FULL_DATE_FORMATTER.format(new Date(`${dateIso}T00:00:00`))
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Erzeugt für einen Spieltag die Slots über alle 5 Plätze hinweg. Ein
 * unvollständiger letzter Slot (der über die Endzeit hinausragen würde)
 * wird nicht erzeugt.
 */
export function generateSlotsForDay(dayConfig: DayConfig): Slot[] {
  const slots: Slot[] = []
  const startMinutes = parseTimeToMinutes(dayConfig.startTime)
  const endMinutes = parseTimeToMinutes(dayConfig.endTime)

  if (dayConfig.slotLengthMinutes <= 0 || endMinutes <= startMinutes) {
    return slots
  }

  for (
    let t = startMinutes;
    t + dayConfig.slotLengthMinutes <= endMinutes;
    t += dayConfig.slotLengthMinutes
  ) {
    const slotStart = formatMinutesToTime(t)
    const slotEnd = formatMinutesToTime(t + dayConfig.slotLengthMinutes)

    for (const { location, court } of COURTS) {
      slots.push({
        id: `day${dayConfig.day}-${location}-${court}-${slotStart}`,
        day: dayConfig.day,
        location,
        court,
        startTime: slotStart,
        endTime: slotEnd,
      })
    }
  }

  return slots
}
