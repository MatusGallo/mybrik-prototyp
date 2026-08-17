import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowDownToLine, ArrowUpFromLine, type LucideIcon } from 'lucide-react'
import { IconButton, Button, Input, TextArea, isFloatingPanelOpen,
} from '@matusgallo/mysabds'

export type TokTyp = 'prijem' | 'vydaj'

export interface OstatniTokFormData {
  typ: TokTyp
  datum: string
  vs: string
  castka: string
  poznamka: string
}

interface Props {
  onClose: () => void
  initialData?: OstatniTokFormData
}

export default function OstatniTokModal({ onClose, initialData }: Props) {
  const isEdit = !!initialData
  const [typ, setTyp] = useState<TokTyp>(initialData?.typ ?? 'prijem')
  const [datum, setDatum] = useState(initialData?.datum ?? '')
  const [vs, setVs] = useState(initialData?.vs ?? '')
  const [castka, setCastka] = useState(initialData?.castka ?? '')
  const [poznamka, setPoznamka] = useState(initialData?.poznamka ?? '')
  const [errors, setErrors] = useState<{ datum?: string; vs?: string; castka?: string }>({})

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

  const titleAction = isEdit ? 'Upravit' : 'Nový finanční tok'

  function handleSubmit() {
    const newErrors: typeof errors = {}
    if (!datum.trim()) newErrors.datum = 'Tento údaj je povinný.'
    if (!vs.trim()) newErrors.vs = 'Tento údaj je povinný.'
    if (!castka.trim()) newErrors.castka = 'Tento údaj je povinný.'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
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
          width: 720, maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>
              {titleAction}
            </span>
            <IconButton icon={X} variant="ghost" size="md" tooltip="Zavřít" onClick={onClose} />
          </div>

          {/* Body */}
          <div style={{ padding: '0 24px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Typ selector — card-style radio */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textSecondary)', marginBottom: 8 }}>
                Typ <span style={{ color: 'var(--t-textDangerPrimary)' }}>*</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {([
                  { v: 'prijem', label: 'Příjem', icon: ArrowDownToLine },
                  { v: 'vydaj', label: 'Výdaj', icon: ArrowUpFromLine },
                ] as { v: TokTyp; label: string; icon: LucideIcon }[]).map(opt => {
                  const Icon = opt.icon
                  const active = typ === opt.v
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setTyp(opt.v)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 6, padding: '12px 16px',
                        background: active ? 'var(--t-bgMyDOCKTertiary)' : 'var(--t-bgPrimary)',
                        border: active ? '2px solid var(--t-borderMyDOCK)' : '1px solid var(--t-borderPrimary)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'background 120ms, border-color 120ms',
                      }}
                    >
                      <Icon
                        size={22}
                        color={active ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textSecondary)'}
                      />
                      <span style={{
                        fontSize: 14, fontWeight: 600, lineHeight: '20px',
                        color: active ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textPrimary)',
                      }}>
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
              <Input
                label="Datum"
                required
                value={datum}
                onChange={v => { setDatum(v); if (errors.datum) setErrors(e => ({ ...e, datum: undefined })) }}
                placeholder="DD.MM.RRRR"
                width="100%"
                error={errors.datum}
              />
              <Input
                label="Variabilní symbol"
                required
                value={vs}
                onChange={v => { setVs(v); if (errors.vs) setErrors(e => ({ ...e, vs: undefined })) }}
                placeholder="Zadejte VS"
                width="100%"
                numeric
                error={errors.vs}
              />
              <Input
                label="Částka"
                required
                value={castka}
                onChange={v => { setCastka(v); if (errors.castka) setErrors(e => ({ ...e, castka: undefined })) }}
                placeholder="0,00"
                width="100%"
                suffix="Kč"
                numeric
                textAlign="right"
                error={errors.castka}
              />
            </div>

            <TextArea
              label="Poznámka"
              value={poznamka}
              onChange={setPoznamka}
              placeholder="Volitelná poznámka k toku…"
              width="100%"
              minHeight={96}
            />
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', gap: 8, flexShrink: 0,
            borderTop: '1px solid var(--t-borderPrimary)',
          }}>
            <Button label="Zrušit" variant="outlined" onClick={onClose} />
            <Button label={isEdit ? 'Uložit' : 'Přidat'} variant="primary" onClick={handleSubmit} />
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
