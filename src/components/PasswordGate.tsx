import { useState, useEffect, type ReactNode } from 'react'
import { LoginBackground, LoginCard, tokens } from '@matusgallo/mysabds'
import { AuthContext } from '../auth'
import myBrikLogo from '../assets/mybrik-logo.svg'

// Pozor: tohle není bezpečnostní hranice - heslo leží v JS bundlu a přečte ho
// každý, kdo otevře DevTools. Drží náhodného návštěvníka mimo rozpracovaný
// prototyp, nic víc - skutečná klientská data za tímhle stát nesmí.
const PASSWORD = 'myBRIK2026'
const STORAGE_KEY = 'mybrik-auth'

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setAuthed(localStorage.getItem(STORAGE_KEY) === '1')
    setChecked(true)
  }, [])

  function handleSubmit() {
    if (password === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1')
      setAuthed(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
    setPassword('')
    setError(false)
  }

  if (!checked) return null
  if (authed) return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <LoginBackground color={tokens.bgMyDOCKPrimary} />
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoginCard
          logo={<img src={myBrikLogo} alt="" style={{ height: 24, width: 'auto' }} />}
          appName="myBRIK"
          password={password}
          onPasswordChange={v => { setPassword(v); if (error) setError(false) }}
          error={error ? 'Heslo nesedí. Zkuste ho zadat znovu.' : undefined}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
