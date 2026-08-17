import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, TextArea, isFloatingPanelOpen,
} from '@matusgallo/mysabds'

interface Props {
  /** Výchozí text — prázdný při zakládání, vyplněný při úpravě. */
  initialValue?: string
  onClose: () => void
  onSave: (text: string) => void
}

export default function InterniPoznamkaModal({ initialValue = '', onClose, onSave }: Props) {
  const [text, setText] = useState(initialValue)

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

  const isEdit = initialValue.trim().length > 0

  function handleSave() {
    onSave(text.trim())
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
          width: 560,
          maxWidth: '96vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>

          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
              {isEdit ? 'Upravit interní poznámku' : 'Interní poznámka'}
            </span>
            <IconButton icon={X} variant="ghost" size="md" tooltip="Zavřít" onClick={onClose} />
          </div>

          <div style={{ padding: '0 24px 20px', overflowY: 'auto' }}>
            <TextArea
              value={text}
              onChange={setText}
              placeholder="Interní poznámka k nabídce, viditelná jen pro tým…"
              width="100%"
              minHeight={140}
            />
          </div>

          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0, borderTop: '1px solid var(--t-borderPrimary)' }}>
            <Button label="Zrušit" variant="outlined" onClick={onClose} />
            <Button label="Uložit" variant="primary" onClick={handleSave} disabled={text.trim().length === 0} />
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
