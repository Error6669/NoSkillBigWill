import { useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../state/AuthContext'
import { clearStoredGithubToken, getStoredGithubToken, setStoredGithubToken, type PublishResult } from '../../lib/publish'
import LoginModal from './LoginModal'
import GithubTokenModal from './GithubTokenModal'

interface AppHeaderProps {
  onExport: () => void
  onImport: (file: File) => void
  onDownloadMyGames: () => void
  onLoadSampleData: () => void
  onReset: () => void
  onPublish: (token: string) => Promise<PublishResult>
}

export default function AppHeader({
  onExport,
  onImport,
  onDownloadMyGames,
  onLoadSampleData,
  onReset,
  onPublish,
}: AppHeaderProps) {
  const { isEditMode, login, logout } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImport(file)
    }
    event.target.value = ''
  }

  const runPublish = async (token: string) => {
    setPublishing(true)
    const result = await onPublish(token)
    setPublishing(false)
    if (result.success) {
      alert('Veröffentlicht! Es dauert ca. 30–60 Sekunden, bis die Änderung online sichtbar ist.')
    } else {
      if (result.error?.toLowerCase().includes('token')) {
        clearStoredGithubToken()
      }
      alert(`Veröffentlichen fehlgeschlagen: ${result.error ?? 'unbekannter Fehler'}`)
    }
  }

  const handlePublishClick = () => {
    const token = getStoredGithubToken()
    if (!token) {
      setTokenModalOpen(true)
      return
    }
    void runPublish(token)
  }

  const handleTokenSubmit = (token: string) => {
    setStoredGithubToken(token)
    setTokenModalOpen(false)
    void runPublish(token)
  }

  return (
    <header className="app-header">
      <div className="app-header__title">
        <h1>Turnierplanung</h1>
        <p className="app-header__subtitle">Doppel-Tennisturnier</p>
      </div>
      <div className="app-header__actions">
        {isEditMode && (
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Importieren
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="visually-hidden"
              onChange={handleFileChange}
            />
            <button type="button" className="btn btn--secondary" onClick={onExport}>
              Exportieren
            </button>
            <button type="button" className="btn btn--secondary" onClick={onDownloadMyGames}>
              Meine Spiele downloaden
            </button>
            <button
              type="button"
              className="btn btn--secondary-outline"
              onClick={onLoadSampleData}
            >
              Testdaten laden
            </button>
            <button type="button" className="btn btn--danger" onClick={onReset}>
              Alle Daten löschen
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={publishing}
              onClick={handlePublishClick}
            >
              {publishing ? 'Veröffentliche…' : 'Veröffentlichen'}
            </button>
          </>
        )}
        {isEditMode ? (
          <button type="button" className="btn btn--secondary" onClick={logout}>
            Logout
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={() => setLoginOpen(true)}>
            Login
          </button>
        )}
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSubmit={login} />
      <GithubTokenModal
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        onSubmit={handleTokenSubmit}
      />
    </header>
  )
}
