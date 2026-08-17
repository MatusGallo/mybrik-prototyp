import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, Select, TextArea, isFloatingPanelOpen,
} from '@matusgallo/mysabds'

const VYSLEDKY = [
  { value: 'neuskutecnila_se', label: 'Neuskutečnila se' },
  { value: 'ma_zajem', label: 'Má zájem' },
  { value: 'nema_zajem', label: 'Nemá zájem' },
  { value: 'zrusena', label: 'Zrušena' },
]

interface Props {
  onClose: () => void
  onSave?: (vysledek: string, poznamka: string) => void
}

export default function ZapsatVysledekModal({ onClose, onSave }: Props) {
  const [vysledek, setVysledek] = useState('')
  const [poznamka, setPoznamka] = useState('')

  function handleSave() {
    if (onSave) onSave(vysledek, poznamka)
    onClose()
  }

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
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>Zapsat výsledek prohlídky</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>

          <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Select
              label="Výsledek prohlídky"
              required
              options={VYSLEDKY}
              value={vysledek}
              onChange={setVysledek}
              width="100%"
              placeholder="Vyberte výsledek prohlídky"
            />
            <TextArea
              label="Poznámka"
              value={poznamka}
              onChange={setPoznamka}
              placeholder="Poznámka"
              width="100%"
              minHeight={160}
            />
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
