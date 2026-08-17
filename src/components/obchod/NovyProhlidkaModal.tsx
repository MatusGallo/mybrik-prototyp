import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarClock } from 'lucide-react'
import { Modal, Select, TextArea, DatePicker, iconSize } from '@matusgallo/mysabds'
import useEscapeClose from '../shared/useEscapeClose'

/* ──────────────────────────────────────────────────────────────────────────────
   Naplánovat prohlídku — datum a čas začátku plus délka, ne rozpětí zapsané
   ručně. Konec si aplikace dopočítá, takže se v kalendáři zablokuje celé okno
   prohlídky a uživatel nemusí vymýšlet, jak rozpětí zapsat.
────────────────────────────────────────────────────────────────────────────── */

const DELKA_OPT = [
  { value: '30', label: '30 minut' },
  { value: '45', label: '45 minut' },
  { value: '60', label: '1 hodina' },
  { value: '90', label: '1,5 hodiny' },
  { value: '120', label: '2 hodiny' },
  { value: '180', label: '3 hodiny' },
]

const POZVANKA_OPT = [
  { value: 'neposilat', label: 'Neposílat' },
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'email_sms', label: 'E-mail a SMS' },
]

const DNY = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']

/** '18.09.2026' → 'Čt 18. 9. 2026' */
function formatDen(d: Date) {
  return `${DNY[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

function formatCas(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Čas začátku posunutý o délku prohlídky - konec bloku v kalendáři. */
function konecProhlidky(zacatek: Date, minut: number) {
  return new Date(zacatek.getTime() + minut * 60_000)
}

interface Props {
  onClose: () => void
  onSave?: (zacatek: Date, delkaMinut: number) => void
}

export default function NovyProhlidkaModal({ onClose, onSave }: Props) {
  const [zacatek, setZacatek] = useState<Date | null>(null)
  const [delka, setDelka] = useState('60')
  const [pozvanka, setPozvanka] = useState('neposilat')
  const [poznamka, setPoznamka] = useState('')
  const [error, setError] = useState<string>()

  useEscapeClose(onClose)

  const delkaMinut = Number(delka)
  const konec = zacatek ? konecProhlidky(zacatek, delkaMinut) : null

  function handleSave() {
    if (!zacatek) {
      setError('Zadejte datum a čas začátku prohlídky.')
      return
    }
    onSave?.(zacatek, delkaMinut)
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
            title="Naplánovat prohlídku"
            onClose={onClose}
            width={600}
            maxHeight={760}
            actions={[
              { label: 'Zrušit', variant: 'secondary', onClick: onClose },
              { label: 'Uložit', variant: 'primary', onClick: handleSave },
            ]}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DatePicker
                  label="Začátek prohlídky"
                  required
                  showTime
                  minuteStep={15}
                  value={zacatek}
                  onChange={v => { setZacatek(v); setError(undefined) }}
                  helperText="Datum a čas, kdy prohlídka začíná"
                  error={error}
                  width="100%"
                />
                <Select
                  label="Délka prohlídky"
                  required
                  options={DELKA_OPT}
                  value={delka}
                  onChange={setDelka}
                  width="100%"
                />
              </div>

              {/* Dopočítané okno prohlídky — přesně to, co se zablokuje v kalendáři */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', background: 'var(--t-bgSecondary)',
                border: '1px solid var(--t-borderPrimary)', borderRadius: 8,
              }}>
                <CalendarClock size={iconSize.md} style={{ color: 'var(--t-textSecondary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
                    {zacatek && konec
                      ? `${formatDen(zacatek)}, ${formatCas(zacatek)}-${formatCas(konec)}`
                      : 'Termín zatím není zadaný'}
                  </span>
                  <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--t-textSecondary)' }}>
                    Tento čas se zablokuje v kalendáři
                  </span>
                </div>
              </div>

              <Select
                label="Pozvánka pro klienta"
                options={POZVANKA_OPT}
                value={pozvanka}
                onChange={setPozvanka}
                width="100%"
              />

              <TextArea
                label="Poznámka"
                value={poznamka}
                onChange={setPoznamka}
                placeholder="Zadejte doplňující informace k prohlídce"
                width="100%"
                minHeight={120}
              />
            </div>
          </Modal>
        </div>
      </div>
    </>,
    document.body,
  )
}
