import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, isFloatingPanelOpen,
} from '@matusgallo/mysabds'
import SelectSearch from '../shared/SelectSearch'
import { klientiData } from '../../data/mockOstatni'

const KLIENTI_OPT = klientiData
  .map(k => {
    const titul = k.titulPred ? `${k.titulPred} ` : ''
    return {
      value: String(k.id),
      label: `${titul}${k.prijmeni} ${k.jmeno}${k.nazevSpolecnosti ? ` — ${k.nazevSpolecnosti}` : ''}`,
    }
  })
  .sort((a, b) => a.label.localeCompare(b.label, 'cs'))

interface Props {
  onClose: () => void
}

export default function OdeslatHypotekariModal({ onClose }: Props) {
  const [klient, setKlient] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Nad rozbaleným seznamem nebo kalendářem patří Escape jemu, ne modálu -
      // jinak jeden stisk zavře obojí a rozepsaný formulář je pryč.
      if (isFloatingPanelOpen()) return
      onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleOdeslat() {
    if (!klient) {
      setError(true)
      return
    }
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
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>

          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>Odeslat hypotékáři</span>
            <IconButton icon={X} variant="ghost" size="md" tooltip="Zavřít" onClick={onClose} />
          </div>

          <div style={{ padding: '0 24px 20px', overflowY: 'auto' }}>
            <SelectSearch
              label=""
              options={KLIENTI_OPT}
              value={klient}
              onChange={v => { setKlient(v); setError(false) }}
              placeholder="Vyberte"
              width="100%"
            />
            {error && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--t-textDanger, #DC2626)' }}>
                Pro odeslání musíte vybrat klienta.
              </div>
            )}
          </div>

          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0, borderTop: '1px solid var(--t-borderPrimary)' }}>
            <Button label="Zrušit" variant="outlined" onClick={onClose} />
            <Button label="Odeslat" variant="primary" onClick={handleOdeslat} />
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
