import { useState, type FormEvent } from 'react'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (password: string) => boolean
}

export default function LoginModal({ open, onClose, onSubmit }: LoginModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  if (!open) return null

  const handleClose = () => {
    setPassword('')
    setError(false)
    onClose()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const success = onSubmit(password)
    if (success) {
      handleClose()
    } else {
      setError(true)
    }
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-card login-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Anmelden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-card__header">
          <h3>Anmelden</h3>
          <button type="button" className="modal-card__close" aria-label="Schließen" onClick={handleClose}>
            ×
          </button>
        </div>

        <form className="login-modal__body" onSubmit={handleSubmit}>
          <label className="login-modal__label" htmlFor="login-password">
            Passwort
          </label>
          <input
            id="login-password"
            type="password"
            autoFocus
            className={error ? 'input input--warning' : 'input'}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError(false)
            }}
          />
          {error && <p className="login-modal__error">Falsches Passwort.</p>}
          <button type="submit" className="btn btn--primary login-modal__submit">
            Anmelden
          </button>
        </form>
      </div>
    </div>
  )
}
