import { createContext, useContext } from 'react'

interface Auth {
  /** Zahodí přihlášení a vrátí uživatele na přihlašovací obrazovku. */
  logout: () => void
}

/** Poskytuje ho PasswordGate, jakmile je uživatel přihlášený. */
export const AuthContext = createContext<Auth>({ logout: () => {} })

export function useAuth() {
  return useContext(AuthContext)
}
