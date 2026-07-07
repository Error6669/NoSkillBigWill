import { useEffect, useRef, useState, type ChangeEvent } from 'react'
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
  const [filling, setFilling] = useState(false)
  const [fillActive, setFillActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Der Fortschrittsbalken braucht einen Render-Zwischenschritt zwischen
  // Breite 0% und 100%, sonst überspringt der Browser die CSS-Transition.
  useEffect(() => {
    if (!filling) {
      setFillActive(false)
      return
    }
    const raf = requestAnimationFrame(() => setFillActive(true))
    return () => cancelAnimationFrame(raf)
  }, [filling])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImport(file)
    }
    event.target.value = ''
  }

  const runPublish = async (token: string) => {
    const result = await onPublish(token)
    if (!result.success) {
      if (result.error?.toLowerCase().includes('token')) {
        clearStoredGithubToken()
      }
      alert(`Veröffentlichen fehlgeschlagen: ${result.error ?? 'unbekannter Fehler'}`)
      return
    }
    // Erfolgreich: Fortschrittsbalken zeigt für 1 Minute (ungefähre
    // Deployment-Dauer) den Fortschritt, danach zurück zum Normalzustand.
    setFilling(true)
    window.setTimeout(() => setFilling(false), 60000)
  }

  const handlePublishClick = () => {
    if (filling) return
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
        <h1>NoSkillBigWill</h1>
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
            <button type="button" className="btn btn--secondary" onClick={onLoadSampleData}>
              Testdaten laden
            </button>
            <button type="button" className="btn btn--secondary" onClick={onReset}>
              Alle Daten löschen
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--publish"
              onClick={handlePublishClick}
            >
              {filling && (
                <span className={fillActive ? 'btn--publish__fill btn--publish__fill--active' : 'btn--publish__fill'} />
              )}
              <span className="btn--publish__label">{filling ? 'Veröffentliche…' : 'Veröffentlichen'}</span>
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
