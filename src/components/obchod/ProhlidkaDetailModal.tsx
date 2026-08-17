import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, Tag, isFloatingPanelOpen,
} from '@matusgallo/mysabds'
import { stavProhlidkyVariant } from '../../data/mockObchod'

const MOCK_HISTORY = [
  { autor: 'Michaela Flachsová', datum: '31.07.2025 09:14', poznamka: 'Dobrý den, posílám pozvánku na prohlídku. Díky' },
  { autor: 'Matúš Gallo', datum: '25.05.2026 13:19', poznamka: 'Ahoj, potkáme se na Suttnerové 814/17, těším se.' },
]

type Prohlidka = {
  resitel: string
  termin: string
  delka: string
  posledniAktivita: string
  stav: string
}

interface Props {
  p: Prohlidka
  onClose: () => void
}

export default function ProhlidkaDetailModal({ p, onClose }: Props) {
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
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>Detail prohlídky</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Stav', content: <Tag label={p.stav} variant={stavProhlidkyVariant(p.stav)} size="sm" /> },
                { label: 'Řešitel', content: p.resitel || '—' },
                { label: 'Termín prohlídky', content: p.termin },
                { label: 'Délka prohlídky', content: p.delka },
                { label: 'Poslední aktivita', content: p.posledniAktivita },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24 }}>
                  <span style={{ width: 160, flexShrink: 0, fontSize: 14, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>
                    {row.label}
                  </span>
                  {typeof row.content === 'string'
                    ? <span style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{row.content}</span>
                    : row.content
                  }
                </div>
              ))}
            </div>


            {/* Historie změn */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>Historie změn</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_HISTORY.map((h, i) => (
                <div key={i} style={{ background: 'var(--t-bgSecondary)', borderRadius: 8, padding: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-textSecondary)', lineHeight: '16px', letterSpacing: '0.12px' }}>
                    {h.autor}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--t-textSecondary)', lineHeight: '16px', marginLeft: 4 }}>
                    · {h.datum}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>
                    {h.poznamka}
                  </p>
                </div>
              ))}
            </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, borderTop: '1px solid var(--t-borderPrimary)' }}>
            <Button label="Zavřít" variant="outlined" onClick={onClose} />
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
