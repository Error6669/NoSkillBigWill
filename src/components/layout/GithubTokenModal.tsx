import { useState, type FormEvent } from 'react'

interface GithubTokenModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (token: string) => void
}

export default function GithubTokenModal({ open, onClose, onSubmit }: GithubTokenModalProps) {
  const [token, setToken] = useState('')

  if (!open) return null

  const handleClose = () => {
    setToken('')
    onClose()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!token.trim()) return
    onSubmit(token.trim())
    setToken('')
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-card login-modal"
        role="dialog"
        aria-modal="true"
        aria-label="GitHub-Token eingeben"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-card__header">
          <h3>GitHub-Token eingeben</h3>
          <button type="button" className="modal-card__close" aria-label="Schließen" onClick={handleClose}>
            ×
          </button>
        </div>

        <form className="login-modal__body" onSubmit={handleSubmit}>
          <p className="login-modal__hint">
            Einmalig pro Gerät nötig, um veröffentlichen zu können. Der Token wird nur lokal in
            diesem Browser gespeichert, nie im Programmcode. Ein fein zugeschnittener
            Personal-Access-Token mit "Contents: Read and write" nur für dieses Repository reicht.
          </p>
          <label className="login-modal__label" htmlFor="github-token">
            Token
          </label>
          <input
            id="github-token"
            type="password"
            autoFocus
            className="input"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <button type="submit" className="btn btn--primary login-modal__submit">
            Speichern &amp; veröffentlichen
          </button>
        </form>
      </div>
    </div>
  )
}
