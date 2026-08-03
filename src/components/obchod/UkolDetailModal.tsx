import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, TextArea, Tag, Dialog } from '@matusgallo/mysabds'
import { CheckSquare } from 'lucide-react'

type TagVariant = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'brand' | 'outline' | 'invert'

function stavVariant(stav: string): TagVariant {
  if (stav === 'Po termínu' || stav === 'Zrušen') return 'danger'
  if (stav === 'Aktivní') return 'success'
  return 'neutral'
}

const MOCK_KOMENTARE = [
  { text: 'fdcg', autor: 'Matúš Gallo', datum: '29.05.2026 12:06' },
]

interface UkolData {
  nazev: string
  stav: string
  makler: string
  datum: string
  cas: string
  pripomenutiDatum: string
}

interface Props {
  u: UkolData
  onClose: () => void
  onVyresit?: () => void
}

export default function UkolDetailModal({ u, onClose, onVyresit }: Props) {
  const [komentar, setKomentar] = useState('')
  const [vyresitOpen, setVyresitOpen] = useState(false)

  const termin = `${u.datum.replace(/\.$/, '')}.2026 ${u.cas}`
  const maklerLabel = u.makler.replace('\n', ' ')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const metaRows = [
    { label: 'Stav', content: <Tag label={u.stav} variant={stavVariant(u.stav)} size="sm" /> },
    { label: 'Řešitel', value: maklerLabel },
    { label: 'Termín', value: termin },
    ...(u.pripomenutiDatum ? [{ label: 'Připomínka', value: u.pripomenutiDatum }] : []),
    { label: 'Poslední aktivita', value: '29.05.2026 12:06' },
  ]

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
            <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>Detail úkolu</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Meta KV rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {metaRows.map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24 }}>
                  <span style={{ width: 160, flexShrink: 0, fontSize: 14, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>
                    {row.label}
                  </span>
                  {'content' in row
                    ? row.content
                    : <span style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{row.value}</span>
                  }
                </div>
              ))}
            </div>

            {/* Poznámka */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>Poznámka k úkolu</span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{u.nazev}</p>
            </div>

            {/* Komentáře */}
            {MOCK_KOMENTARE.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>Komentáře</span>

            {/* Přidat komentář */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TextArea
                label=""
                value={komentar}
                onChange={setKomentar}
                placeholder="Napište komentář…"
                width="100%"
                minHeight={96}
              />
              <div style={{ alignSelf: 'flex-start' }}>
                <Button label="Přidat komentář" variant="outlined" onClick={() => setKomentar('')} />
              </div>
            </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {MOCK_KOMENTARE.map((k, i) => (
                    <div key={i} style={{ background: 'var(--t-bgSecondary)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{k.text}</p>
                      <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--t-textSecondary)' }}>
                        Vytvořeno uživatelem <strong>{k.autor}</strong> dne {k.datum}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0, borderTop: '1px solid var(--t-borderPrimary)' }}>
            <Button label="Zrušit" variant="outlined" onClick={onClose} />
            <Button label="Vyřešit" variant="primary" onClick={() => setVyresitOpen(true)} />
          </div>

        </div>
      </div>
      {vyresitOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 202, background: 'rgba(10,13,18,0.4)' }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 203, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
              <Dialog
                icon={CheckSquare}
                title="Vyřešit úkol?"
                description="Tuto akci nelze vrátit."
                primaryLabel="Vyřešit"
                secondaryLabel="Zrušit"
                onPrimary={() => { setVyresitOpen(false); onVyresit?.(); onClose() }}
                onSecondary={() => setVyresitOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  )
}
