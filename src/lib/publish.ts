import type { AppState } from '../types'
import { isValidAppStateShape, normalizeState } from './storage'

/** Dieses Feature ist fest an dieses eine Repository/Deployment gekoppelt. */
const GITHUB_OWNER = 'Error6669'
const GITHUB_REPO = 'NoSkillBigWill'
const GITHUB_DATA_PATH = 'public/tournament-data.json'
const GITHUB_BRANCH = 'main'

const DATA_FILE_NAME = 'tournament-data.json'
const LAST_PUBLISHED_KEY = 'turnier-last-published-at-v1'
const GITHUB_TOKEN_KEY = 'turnier-github-token-v1'

export interface PublishedPayload {
  publishedAt: string
  state: AppState
}

/** Der file://-Build kann keine eigenen Dateien per fetch() nachladen (Browser-Sicherheitsbeschränkung) - dort macht der Abgleich keinen Sinn. */
export function isFileProtocol(): boolean {
  return window.location.protocol === 'file:'
}

/**
 * Lädt die veröffentlichten Turnierdaten (falls vorhanden und gültig). Gibt
 * null zurück, wenn nicht erreichbar, kein gültiges JSON, oder file://.
 */
export async function fetchPublishedState(): Promise<PublishedPayload | null> {
  if (isFileProtocol()) return null
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}${DATA_FILE_NAME}`, {
      cache: 'no-store',
    })
    if (!response.ok) return null
    const payload = (await response.json()) as Partial<PublishedPayload>
    if (!payload?.publishedAt || !isValidAppStateShape(payload.state)) return null
    return { publishedAt: payload.publishedAt, state: normalizeState(payload.state) }
  } catch {
    return null
  }
}

export function getLastKnownPublishedAt(): string | null {
  return localStorage.getItem(LAST_PUBLISHED_KEY)
}

function setLastKnownPublishedAt(value: string): void {
  localStorage.setItem(LAST_PUBLISHED_KEY, value)
}

export function getStoredGithubToken(): string | null {
  return localStorage.getItem(GITHUB_TOKEN_KEY)
}

export function setStoredGithubToken(token: string): void {
  localStorage.setItem(GITHUB_TOKEN_KEY, token)
}

export function clearStoredGithubToken(): void {
  localStorage.removeItem(GITHUB_TOKEN_KEY)
}

export interface PublishResult {
  success: boolean
  error?: string
}

const AUSTRIA_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat('de-AT', {
  timeZone: 'Europe/Vienna',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** z.B. "09.07.2026, 21:45:12" - österreichische Zeit unabhängig von der Zeitzone des Geräts. */
function formatAustrianTimestamp(): string {
  return AUSTRIA_TIMESTAMP_FORMATTER.format(new Date())
}

/**
 * Schreibt den aktuellen Turnierzustand über die GitHub-Contents-API in
 * public/tournament-data.json auf dem main-Branch. Das löst automatisch den
 * bestehenden GitHub-Actions-Deployment-Workflow aus (Push auf main).
 */
export async function publishStateToGithub(state: AppState, token: string): Promise<PublishResult> {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_DATA_PATH}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  }

  try {
    const currentFile = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, { headers })
    if (currentFile.status === 401 || currentFile.status === 403) {
      return { success: false, error: 'Token ungültig oder ohne Schreibrecht für dieses Repository.' }
    }
    const sha: string | undefined = currentFile.ok ? (await currentFile.json()).sha : undefined

    const publishedAt = new Date().toISOString()
    const payload: PublishedPayload = { publishedAt, state }
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))))

    const putResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Turnierdaten veröffentlichen (${formatAustrianTimestamp()})`,
        content,
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
      }),
    })

    if (!putResponse.ok) {
      const body = await putResponse.json().catch(() => null)
      return { success: false, error: body?.message ?? `Fehler beim Veröffentlichen (HTTP ${putResponse.status})` }
    }

    setLastKnownPublishedAt(publishedAt)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Netzwerkfehler.',
    }
  }
}

/** Vom Auto-Sync beim Laden aufgerufen, wenn eine aktuellere Veröffentlichung übernommen wurde. */
export function recordAdoptedPublishedAt(publishedAt: string): void {
  setLastKnownPublishedAt(publishedAt)
}
