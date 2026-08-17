import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Phone, Mail, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { IconButton, Button, Input, TextArea, DatePicker, RadioItem } from '@matusgallo/mysabds'
import useEscapeClose from '../shared/useEscapeClose'

type KomunikaceTyp = 'telefon' | 'email' | 'osobne'

/** Co se má otevřít po uložení zápisu. */
export type NavazujiciAkce = 'ukol' | 'prohlidka' | null

const TYPY: { value: KomunikaceTyp; label: string; icon: LucideIcon }[] = [
  { value: 'telefon', label: 'Telefon', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'osobne', label: 'Osobně', icon: Users },
]

interface Props {
  onClose: () => void
  /** Zápis se uloží a volající otevře zvolenou navazující akci. */
  onSave?: (navazujici: NavazujiciAkce) => void
}

export default function ZapsatKomunikaceModal({ onClose, onSave }: Props) {
  const [nazev, setNazev] = useState('')
  const [zpusob, setZpusob] = useState<KomunikaceTyp>('telefon')
  const [datum, setDatum] = useState<Date | null>(() => new Date())
  const [poznamka, setPoznamka] = useState('')
  // Navazující akce se vybírá včetně možnosti žádné - bez ní by se jednou
  // zvolený přepínač nedal vzít zpět.
  const [navazujici, setNavazujici] = useState<NavazujiciAkce>(null)
  const [errors, setErrors] = useState<{ nazev?: string; datum?: string }>({})

  useEscapeClose(onClose)

  function handleSave() {
    const next: typeof errors = {}
    if (!nazev.trim()) next.nazev = 'Zadejte název komunikace.'
    if (!datum) next.datum = 'Zadejte datum a čas komunikace.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSave?.(navazujici)
    onClose()
  }

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
            <IconButton icon={X} variant="ghost" size="md" tooltip="Zavřít" onClick={onClose} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                label="Název"
                required
                value={nazev}
                onChange={v => { setNazev(v); setErrors(e => ({ ...e, nazev: undefined })) }}
                placeholder="Zadejte název komunikace"
                error={errors.nazev}
                width="100%"
              />

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
                <DatePicker
                  label="Datum a čas komunikace"
                  required
                  showTime
                  minuteStep={5}
                  value={datum}
                  onChange={v => { setDatum(v); setErrors(e => ({ ...e, datum: undefined })) }}
                  error={errors.datum}
                  width="100%"
                />
              </div>

              <TextArea label="Poznámka" value={poznamka} onChange={setPoznamka} placeholder="Zadejte poznámku ke komunikaci" width="100%" minHeight={120} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>Navazující akce</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <RadioItem
                  label="Bez navazující akce"
                  checked={navazujici === null}
                  onChange={() => setNavazujici(null)}
                />
                <RadioItem
                  label="Naplánovat úkol"
                  description="Po uložení zápisu se otevře formulář úkolu."
                  checked={navazujici === 'ukol'}
                  onChange={() => setNavazujici('ukol')}
                />
                <RadioItem
                  label="Naplánovat prohlídku"
                  description="Po uložení zápisu se otevře formulář prohlídky."
                  checked={navazujici === 'prohlidka'}
                  onChange={() => setNavazujici('prohlidka')}
                />
              </div>
            </div>

          </div>

          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0, borderTop: '1px solid var(--t-borderPrimary)' }}>
            <Button label="Zrušit" variant="outlined" onClick={onClose} />
            <Button label="Uložit" variant="primary" onClick={handleSave} />
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
