import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Modal, Input, TextArea, Select, DatePicker, ToggleItem } from '@matusgallo/mysabds'
import useEscapeClose from '../shared/useEscapeClose'
import { uzivateleData } from '../../data/mockOstatni'

/* ──────────────────────────────────────────────────────────────────────────────
   Naplánovat úkol — termín i připomínka se vybírají v kalendáři s hodinami, ne
   psaním do textového pole. Ručně zapsaný termín se v každém záznamu vypíše
   jinak a nedá se z něj počítat.
────────────────────────────────────────────────────────────────────────────── */

const RESITEL_OPT = uzivateleData
  .filter(u => u.role === 'Makléř' || u.role === 'Administrátor')
  .map(u => ({ value: `${u.jmeno} ${u.prijmeni}`, label: `${u.jmeno} ${u.prijmeni}` }))

/**
 * Makléř ze záznamu patří do nabídky, i když v seznamu uživatelů není - jinak by
 * se úkol otevřel s prázdným řešitelem právě u toho, komu záznam patří.
 */
function resitelOpt(defaultResitel?: string) {
  if (!defaultResitel || RESITEL_OPT.some(o => o.value === defaultResitel)) return RESITEL_OPT
  return [{ value: defaultResitel, label: defaultResitel }, ...RESITEL_OPT]
}

interface Props {
  defaultResitel?: string
  onClose: () => void
  onSave?: (termin: Date) => void
}

export default function NovyUkolModal({ defaultResitel, onClose, onSave }: Props) {
  const RESITELE = resitelOpt(defaultResitel)
  const [nazev, setNazev] = useState('')
  const [popis, setPopis] = useState('')
  const [termin, setTermin] = useState<Date | null>(null)
  const [resitel, setResitel] = useState(defaultResitel ?? RESITELE[0]?.value ?? '')
  const [pripomenuti, setPripomenuti] = useState(false)
  const [datumPripomenuti, setDatumPripomenuti] = useState<Date | null>(null)
  const [errors, setErrors] = useState<{
    nazev?: string; popis?: string; termin?: string; pripomenuti?: string
  }>({})

  useEscapeClose(onClose)

  function handleSave() {
    const next: typeof errors = {}
    if (!nazev.trim()) next.nazev = 'Zadejte název úkolu.'
    if (!popis.trim()) next.popis = 'Zadejte popis úkolu.'
    if (!termin) next.termin = 'Zadejte termín úkolu.'
    if (pripomenuti && !datumPripomenuti) next.pripomenuti = 'Zadejte datum a čas připomínky.'
    else if (pripomenuti && termin && datumPripomenuti && datumPripomenuti > termin) {
      next.pripomenuti = 'Připomínka musí být dřív než termín úkolu.'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return
    if (termin) onSave?.(termin)
    onClose()
  }

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,13,18,0.4)' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201, padding: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Modal
            title="Naplánovat úkol"
            onClose={onClose}
            width={600}
            maxHeight={760}
            actions={[
              { label: 'Zrušit', variant: 'secondary', onClick: onClose },
              { label: 'Uložit', variant: 'primary', onClick: handleSave },
            ]}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Název"
                required
                value={nazev}
                onChange={v => { setNazev(v); setErrors(e => ({ ...e, nazev: undefined })) }}
                placeholder="Zadejte název úkolu"
                error={errors.nazev}
                width="100%"
              />
              <TextArea
                label="Popis úkolu"
                required
                value={popis}
                onChange={v => { setPopis(v); setErrors(e => ({ ...e, popis: undefined })) }}
                placeholder="Zadejte popis úkolu"
                error={errors.popis}
                width="100%"
                minHeight={120}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DatePicker
                  label="Termín"
                  required
                  showTime
                  minuteStep={15}
                  value={termin}
                  onChange={v => { setTermin(v); setErrors(e => ({ ...e, termin: undefined })) }}
                  error={errors.termin}
                  width="100%"
                />
                <Select
                  label="Řešitel"
                  required
                  options={RESITELE}
                  value={resitel}
                  onChange={setResitel}
                  width="100%"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ToggleItem label="Připomínka" position="right" checked={pripomenuti} onChange={setPripomenuti} />
                {pripomenuti && (
                  <div style={{ width: '50%' }}>
                    <DatePicker
                      label="Datum a čas připomínky"
                      required
                      showTime
                      minuteStep={15}
                      value={datumPripomenuti}
                      onChange={v => { setDatumPripomenuti(v); setErrors(e => ({ ...e, pripomenuti: undefined })) }}
                      error={errors.pripomenuti}
                      width="100%"
                    />
                  </div>
                )}
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </>,
    document.body,
  )
}
