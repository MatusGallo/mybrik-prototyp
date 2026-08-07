import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, Input, TextArea } from '@matusgallo/mysabds'
import { klientiData } from '../../data/mockOstatni'
import TelefonInput from './TelefonInput'
import { VYCHOZI_PREDVOLBA, maCisloTelefonu } from '../../data/telefonPredvolby'

const klienti = klientiData.filter(k => k.jmeno || k.prijmeni)

interface Props {
  onClose: () => void
  onSend?: (telefon: string, zprava: string) => void
}

export default function OdeslatSmsDialog({ onClose, onSend }: Props) {
  const [prijemceQuery, setPrijemceQuery] = useState('')
  const [telefon, setTelefon] = useState(VYCHOZI_PREDVOLBA)
  const [zprava, setZprava] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [errors, setErrors] = useState({ telefon: false, zprava: false })
  const wrapperRef = useRef<HTMLDivElement>(null)

  const suggestions = prijemceQuery.length >= 1
    ? klienti.filter(k =>
        `${k.jmeno} ${k.prijmeni}`.toLowerCase().includes(prijemceQuery.toLowerCase())
      ).slice(0, 8)
    : []

  function selectKlient(k: typeof klienti[0]) {
    setPrijemceQuery(`${k.jmeno} ${k.prijmeni}`.trim())
    setTelefon(k.telefon ?? VYCHOZI_PREDVOLBA)
    setDropdownOpen(false)
  }

  function handleSend() {
    const err = { telefon: !maCisloTelefonu(telefon), zprava: !zprava.trim() }
    setErrors(err)
    if (err.telefon || err.zprava) return
    onSend?.(telefon, zprava)
    onClose()
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,13,18,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-primary, #fff)',
          borderRadius: 16,
          boxShadow: '0px 2px 4px -2px rgba(10,13,18,0.06), 0px 4px 6px -1px rgba(10,13,18,0.10)',
          width: 720,
          maxWidth: 'calc(100vw - 32px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 24, gap: 24,
        }}>
          <span style={{ flex: 1, fontSize: 20, fontWeight: 600, fontFamily: 'Inter', lineHeight: '28px', color: 'var(--text-primary, #2C2E30)' }}>
            Odeslat SMS
          </span>
          <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
        </div>

        {/* Body */}
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Příjemce — search klientů */}
          <div ref={wrapperRef} style={{ position: 'relative' }} onFocus={() => setDropdownOpen(true)}>
            <Input
              label="Příjemce"
              placeholder="Vyhledejte klienta…"
              value={prijemceQuery}
              onChange={v => { setPrijemceQuery(v); setDropdownOpen(true) }}
              width="100%"
            />
            {dropdownOpen && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: '#fff',
                border: '1px solid #E7E8E9',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginTop: 4,
                overflow: 'hidden',
              }}>
                {suggestions.map(k => (
                  <div
                    key={k.id}
                    onMouseDown={() => selectKlient(k)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Inter',
                      color: '#2C2E30',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F5F6F7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 500 }}>{k.jmeno} {k.prijmeni}</span>
                    <span style={{ color: '#737578', fontSize: 13 }}>{k.telefon}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Telefonní číslo — auto-fill, povinné */}
          <TelefonInput
            label="Telefonní číslo"
            value={telefon}
            onChange={v => { setTelefon(v); setErrors(e => ({ ...e, telefon: false })) }}
            error={errors.telefon ? 'Zadejte telefonní číslo.' : undefined}
            required
          />

          {/* Zpráva — povinná */}
          <TextArea
            label="Zpráva"
            placeholder="Napište zprávu…"
            value={zprava}
            onChange={v => { setZprava(v); setErrors(e => ({ ...e, zprava: false })) }}
            error={errors.zprava ? 'Zpráva je povinná' : undefined}
            required
            minHeight={120}
            width="100%"
          />
        </div>

        {/* Divider */}
        <div style={{ height: 0, borderTop: '1px solid var(--border-primary, #E7E8E9)' }} />

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          gap: 8, padding: '12px 24px',
        }}>
          <Button label="Zrušit" variant="outlined" onClick={onClose} />
          <Button label="Odeslat" variant="primary" onClick={handleSend} />
        </div>
      </div>
    </div>,
    document.body
  )
}
