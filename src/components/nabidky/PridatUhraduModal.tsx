import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton, Button, Input, TextArea, Select } from '@matusgallo/mysabds'

export interface UhradaFormData {
  datum: string
  ucel: string
  forma: string
  castka: string
  poznamka: string
}

export const UHRADA_UCEL_OPT = [
  { value: 'rezervacni-poplatek', label: 'Rezervační poplatek' },
  { value: 'rezervacni-zaloha', label: 'Rezervační záloha' },
  { value: 'doplatek', label: 'Doplatek kupní ceny' },
]

export const UHRADA_FORMA_OPT = [
  { value: 'prevodem', label: 'Převodem' },
  { value: 'hotovost', label: 'Hotovost' },
]

export function uhradaFormaLabel(value: string): string {
  return UHRADA_FORMA_OPT.find(o => o.value === value)?.label ?? value
}

const DAYS_OF_WEEK = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
const MONTHS_CS = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const days: Array<{ day: number; current: boolean }> = []
  for (let i = startDow - 1; i >= 0; i--) days.push({ day: daysInPrevMonth - i, current: false })
  for (let d = 1; d <= daysInMonth; d++) days.push({ day: d, current: true })
  const total = Math.ceil(days.length / 7) * 7
  for (let d = 1; days.length < total; d++) days.push({ day: d, current: false })
  return days
}

function parseCz(s: string): { y: number; m: number; d: number } | null {
  const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  const d = Number(m[1]), mo = Number(m[2]) - 1, y = Number(m[3])
  const dt = new Date(y, mo, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return { y, m: mo, d }
}

function fmtCz(y: number, m: number, d: number): string {
  return `${String(d).padStart(2, '0')}.${String(m + 1).padStart(2, '0')}.${y}`
}

function dnesCz(): string {
  const d = new Date()
  return fmtCz(d.getFullYear(), d.getMonth(), d.getDate())
}

// Pole s výběrem data — trigger ve stylu inputu + kalendářový popover přes portál.
function DatePickerField({
  label, required, value, onChange, error,
}: {
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const today = new Date()
  const parsedInit = parseCz(value)
  const [calYear, setCalYear] = useState(parsedInit?.y ?? today.getFullYear())
  const [calMonth, setCalMonth] = useState(parsedInit?.m ?? today.getMonth())

  useEffect(() => {
    if (!open) return
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) {
      const POP_H = 316
      const spaceBelow = window.innerHeight - r.bottom
      const top = spaceBelow < POP_H && r.top > POP_H ? r.top - POP_H - 4 : r.bottom + 4
      const left = Math.max(8, Math.min(r.left, window.innerWidth - 268))
      setPos({ top, left })
    }
    const p = parseCz(value)
    if (p) { setCalYear(p.y); setCalMonth(p.m) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (popRef.current?.contains(e.target as Node)) return
      if (triggerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) } else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) } else setCalMonth(m => m + 1)
  }

  const sel = parseCz(value)
  const days = getCalendarDays(calYear, calMonth)
  const borderColor = error ? 'var(--t-borderDanger, #DC2626)' : open ? 'var(--t-borderMyDOCK, #E05524)' : 'var(--t-borderPrimary)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textSecondary)', marginBottom: 4 }}>
        {label}{required && <span style={{ color: 'var(--t-textDangerPrimary, #DC2626)' }}> *</span>}
      </div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          height: 32, padding: '0 12px',
          background: 'var(--t-bgPrimary)',
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          cursor: 'pointer', textAlign: 'left', width: '100%',
          boxShadow: open && !error ? '0 0 0 3px var(--t-bgMyDOCKTertiary, rgba(224,85,36,0.16))' : 'none',
          transition: 'border-color 120ms, box-shadow 120ms',
        }}
      >
        <span style={{ fontSize: 14, color: value ? 'var(--t-textPrimary)' : 'var(--t-textTertiary)' }}>
          {value || 'DD.MM.RRRR'}
        </span>
        <Calendar size={16} style={{ color: 'var(--t-textSecondary)', flexShrink: 0 }} />
      </button>
      {error && (
        <span style={{ fontSize: 12, color: 'var(--t-textDangerPrimary, #DC2626)', marginTop: 4 }}>{error}</span>
      )}

      {open && pos && createPortal(
        <div
          ref={popRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 300,
            width: 260,
            background: 'var(--t-bgPrimary)',
            border: '1px solid var(--t-borderPrimary)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(10,13,18,0.16)',
            overflow: 'hidden',
          }}
        >
          {/* Navigace měsíců */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <ChevronLeft size={16} style={{ color: 'var(--t-textSecondary)' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={calMonth}
                onChange={e => setCalMonth(Number(e.target.value))}
                style={{ border: 'none', background: 'transparent', fontSize: 14, fontWeight: 500, color: 'var(--t-textPrimary)', cursor: 'pointer', outline: 'none' }}
              >
                {MONTHS_CS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <input
                type="number"
                value={calYear}
                onChange={e => setCalYear(Number(e.target.value))}
                style={{ width: 56, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 500, color: 'var(--t-textPrimary)', outline: 'none', textAlign: 'center' }}
              />
            </div>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <ChevronRight size={16} style={{ color: 'var(--t-textSecondary)' }} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px' }}>
            {DAYS_OF_WEEK.map(d => (
              <div key={d} style={{ textAlign: 'center', padding: '4px 0', fontSize: 12, fontWeight: 600, color: 'var(--t-textMyDOCKPrimary, #E05524)' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px 10px' }}>
            {days.map((d, i) => {
              const isSel = !!sel && d.current && d.day === sel.d && calMonth === sel.m && calYear === sel.y
              const isToday = d.current && d.day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
              return (
                <div
                  key={i}
                  onClick={() => { if (d.current) { onChange(fmtCz(calYear, calMonth, d.day)); setOpen(false) } }}
                  style={{ display: 'flex', justifyContent: 'center', padding: '3px 0', cursor: d.current ? 'pointer' : 'default' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isSel ? 'var(--t-bgMyDOCK, #E05524)' : 'transparent',
                    border: !isSel && isToday ? '1px solid var(--t-borderMyDOCK, #E05524)' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: isSel ? 600 : 400,
                    color: isSel ? '#fff' : d.current ? 'var(--t-textPrimary)' : 'var(--t-textTertiary, #9ca3af)',
                  }}>
                    {d.day}
                  </div>
                </div>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

interface Props {
  onClose: () => void
  onSave?: (data: UhradaFormData) => void
  /** Datum předpisu pro titulek, např. „30.11.2024“. */
  predpisDatum?: string
  /** Předvyplněná částka (typicky zbývající saldo). */
  defaultCastka?: string
  initialData?: UhradaFormData
}

export default function PridatUhraduModal({ onClose, onSave, predpisDatum, defaultCastka, initialData }: Props) {
  const isEdit = !!initialData
  const [datum, setDatum] = useState(initialData?.datum ?? dnesCz())
  const [ucel, setUcel] = useState(initialData?.ucel ?? 'rezervacni-poplatek')
  const [forma, setForma] = useState(initialData?.forma ?? 'prevodem')
  const [castka, setCastka] = useState(initialData?.castka ?? defaultCastka ?? '')
  const [poznamka, setPoznamka] = useState(initialData?.poznamka ?? '')
  const [errors, setErrors] = useState<{ datum?: string; castka?: string }>({})

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const title = isEdit ? 'Upravit úhradu' : 'Přidat úhradu'

  function handleSubmit() {
    const newErrors: typeof errors = {}
    if (!parseCz(datum)) newErrors.datum = 'Zadejte datum ve formátu DD.MM.RRRR.'
    if (!castka.trim()) newErrors.castka = 'Tento údaj je povinný.'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
    onSave?.({ datum, ucel, forma, castka, poznamka })
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
          width: 640, maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0, gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>
                {title}
              </span>
              {predpisDatum && (
                <span style={{ fontSize: 13, color: 'var(--t-textSecondary)' }}>
                  Rezervační záloha z {predpisDatum}
                </span>
              )}
            </div>
            <IconButton icon={X} variant="ghost" size="md" tooltip="Zavřít" onClick={onClose} />
          </div>

          {/* Body */}
          <div style={{ padding: '0 24px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <DatePickerField
                label="Datum úhrady"
                required
                value={datum}
                onChange={v => { setDatum(v); if (errors.datum) setErrors(e => ({ ...e, datum: undefined })) }}
                error={errors.datum}
              />
              <Select
                label="Účel platby"
                options={UHRADA_UCEL_OPT}
                value={ucel}
                onChange={setUcel}
                width="100%"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Select
                label="Forma úhrady"
                options={UHRADA_FORMA_OPT}
                value={forma}
                onChange={setForma}
                width="100%"
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
              label="Poznámka k platbě"
              value={poznamka}
              onChange={setPoznamka}
              placeholder="Volitelná poznámka k úhradě…"
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
            <Button label={isEdit ? 'Uložit změny' : 'Přidat úhradu'} variant="primary" onClick={handleSubmit} />
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
