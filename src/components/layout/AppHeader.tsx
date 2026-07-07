import { useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../state/AuthContext'
import LoginModal from './LoginModal'

interface AppHeaderProps {
  onExport: () => void
  onImport: (file: File) => void
  onDownloadMyGames: () => void
  onLoadSampleData: () => void
  onReset: () => void
}

export default function AppHeader({
  onExport,
  onImport,
  onDownloadMyGames,
  onLoadSampleData,
  onReset,
}: AppHeaderProps) {
  const { isEditMode, login, logout } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImport(file)
    }
    event.target.value = ''
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
    </header>
  )
}
