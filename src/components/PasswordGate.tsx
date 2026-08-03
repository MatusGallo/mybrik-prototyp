import { useState, useEffect, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Input, Button } from '@matusgallo/mysabds'

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

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (password === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1')
      setAuthed(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (!checked) return null
  if (authed) return <>{children}</>

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--t-bgSecondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--t-bgPrimary)',
          border: '1px solid var(--t-borderPrimary)',
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 8px 24px rgba(10,13,18,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 12,
          background: 'var(--t-bgMyDOCKTertiary, #fff5f0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={24} style={{ color: 'var(--t-textMyDOCKPrimary)' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)' }}>
            myBRIK
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--t-textSecondary)' }}>
            Zadejte heslo pro vstup do aplikace
          </p>
        </div>

        <div style={{ width: '100%' }}>
          <Input
            label="Heslo"
            type="password"
            value={password}
            onChange={v => { setPassword(v); if (error) setError(false) }}
            error={error ? 'Nesprávné heslo' : undefined}
            placeholder="Zadejte heslo"
            width="100%"
          />
        </div>

        <div style={{ width: '100%', display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <Button
              label="Pokračovat"
              variant="primary"
              onClick={handleSubmit}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
