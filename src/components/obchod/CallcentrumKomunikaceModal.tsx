import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, Input, TextArea, Select } from '@matusgallo/mysabds'

const TYP_OPT = [
  { value: 'Telefon', label: 'Telefon' },
  { value: 'SMS', label: 'SMS' },
  { value: 'E-mail', label: 'E-mail' },
  { value: 'Osobně', label: 'Osobně' },
]

const VYSLEDEK_OPT = [
  { value: 'Nesprávný kontaktní údaj', label: 'Nesprávný kontaktní údaj' },
  { value: 'Klient nekomunikuje', label: 'Klient nekomunikuje' },
  { value: 'Klient nemá zájem', label: 'Klient nemá zájem' },
  { value: 'Předány doplňující informace', label: 'Předány doplňující informace' },
  { value: 'Zájem o schůzku', label: 'Zájem o schůzku' },
  { value: 'Čeká se na výsledek schůzky', label: 'Čeká se na výsledek schůzky' },
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

export default function CallcentrumKomunikaceModal({ onClose }: Props) {
  const [datum, setDatum] = useState(formatNow)
  const [typ, setTyp] = useState('Telefon')
  const [vysledek, setVysledek] = useState('Nesprávný kontaktní údaj')
  const [poznamka, setPoznamka] = useState('')

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
          width: 640,
          maxWidth: '96vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>

          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>Zapsání komunikace</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>

          <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <Input label="Datum a čas" required value={datum} onChange={setDatum} width="100%" />
              <Select label="Typ komunikace" options={TYP_OPT} value={typ} onChange={setTyp} width="100%" />
            </div>
            <Select label="Výsledek komunikace" options={VYSLEDEK_OPT} value={vysledek} onChange={setVysledek} width="100%" />
            <TextArea label="Poznámka" value={poznamka} onChange={setPoznamka} width="100%" minHeight={120} />
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
