import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const AUTH_STORAGE_KEY = 'turnier-edit-mode-v1'

/**
 * Rein clientseitiger Bearbeitungsschutz, kein echter Zugriffsschutz: Das
 * Passwort liegt im ausgelieferten JS-Bundle und kann von technisch
 * versierten Besuchern eingesehen werden. Ziel ist nur, normale Besucher
 * einer öffentlich gehosteten Version vom versehentlichen Verändern der
 * Turnierdaten abzuhalten - keine echte Datenschutz-/Zugriffskontrolle.
 */
const EDIT_PASSWORD = 'NoSkillBigWill2026'

interface AuthContextValue {
  isEditMode: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(
    () => localStorage.getItem(AUTH_STORAGE_KEY) === 'true',
  )

  useEffect(() => {
    if (isEditMode) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true')
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [isEditMode])

  const login = (password: string): boolean => {
    if (password !== EDIT_PASSWORD) return false
    setIsEditMode(true)
    return true
  }

  const logout = () => {
    setIsEditMode(false)
  }

  return <AuthContext.Provider value={{ isEditMode, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden')
  }
  return ctx
}

/** Kurzform für Komponenten, die nur wissen müssen, ob Bearbeiten aktuell erlaubt ist. */
export function useCanEdit(): boolean {
  return useAuth().isEditMode
}
