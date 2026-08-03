import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Phone, Mail, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { IconButton, Button, Input, TextArea, RadioItem } from '@matusgallo/mysabds'

type KomunikaceTyp = 'telefon' | 'email' | 'osobne'

const TYPY: { value: KomunikaceTyp; label: string; icon: LucideIcon }[] = [
  { value: 'telefon', label: 'Telefon', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'osobne', label: 'Osobně', icon: Users },
]

function formatNow() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()} ${hh}:${min}`
}

interface Props {
  onClose: () => void
}

export default function ZapsatKomunikaceModal({ onClose }: Props) {
  const [nazev, setNazev] = useState('')
  const [zpusob, setZpusob] = useState<KomunikaceTyp>('telefon')
  const [datum, setDatum] = useState(formatNow)
  const [poznamka, setPoznamka] = useState('')
  const [vytoritUkol, setVytoritUkol] = useState(false)
  const [naplanovatProhlidku, setNaplanovatProhlidku] = useState(false)

  function handleVytoritUkol(v: boolean) {
    setVytoritUkol(v)
    if (v) setNaplanovatProhlidku(false)
  }

  function handleNaplanovatProhlidku(v: boolean) {
    setNaplanovatProhlidku(v)
    if (v) setVytoritUkol(false)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,13,18,0.4)' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'var(--t-bgPrimary)',
          borderRadius: 16,
          width: 720,
          maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>

          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>Zapsat komunikaci</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Název" required value={nazev} onChange={setNazev} width="100%" />

              <div>
                <span style={{ fontSize: 13, color: 'var(--t-textSecondary)', display: 'block', marginBottom: 8 }}>
                  Způsob komunikace
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {TYPY.map(({ value, label, icon: Icon }) => {
                    const selected = zpusob === value
                    return (
                      <div
                        key={value}
                        onClick={() => setZpusob(value)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: 8, padding: '16px 8px', borderRadius: 8, cursor: 'pointer',
                          border: `1px solid ${selected ? 'var(--t-borderMyDOCK)' : 'var(--t-borderPrimary)'}`,
                          background: selected ? 'var(--t-bgMyDOCKTertiary)' : 'var(--t-bgSecondary)',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                      >
                        <Icon style={{ width: 22, height: 22, color: selected ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textSecondary)' }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: selected ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textSecondary)' }}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ width: '50%' }}>
                <Input label="Datum a čas komunikace" required value={datum} onChange={setDatum} width="100%" />
              </div>

              <TextArea label="Poznámka" value={poznamka} onChange={setPoznamka} placeholder="Poznámka" width="100%" minHeight={120} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>Navazující akce</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <RadioItem label="Vytvořit úkol" checked={vytoritUkol} onChange={handleVytoritUkol} />
                <RadioItem label="Naplánovat prohlídku" checked={naplanovatProhlidku} onChange={handleNaplanovatProhlidku} />
              </div>
            </div>

          </div>

          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0, borderTop: '1px solid var(--t-borderPrimary)' }}>
            <Button label="Zrušit" variant="outlined" onClick={onClose} />
            <Button label="Uložit" variant="primary" onClick={onClose} />
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
