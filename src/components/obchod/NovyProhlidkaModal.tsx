import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton, Button, Input, Select, TextArea } from '@matusgallo/mysabds'

const DAYS_OF_WEEK = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
const MONTHS_CS = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

const DELKA_OPT = [
  { value: '30', label: '30 minut' },
  { value: '60', label: '1 hodina' },
  { value: '90', label: '1,5 hodiny' },
  { value: '120', label: '2 hodiny' },
]

const POZVANKA_OPT = [
  { value: 'neposilat', label: 'Neposílat' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'email_sms', label: 'Email + SMS' },
]

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

interface Props {
  onClose: () => void
}

export default function NovyProhlidkaModal({ onClose }: Props) {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState({ y: today.getFullYear(), m: today.getMonth(), d: today.getDate() })
  const [delka, setDelka] = useState('60')
  const [cas, setCas] = useState('')
  const [pozvanka, setPozvanka] = useState('neposilat')
  const [poznamka, setPoznamka] = useState('')

  const days = getCalendarDays(calYear, calMonth)

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) } else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) } else setCalMonth(m => m + 1)
  }

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
          width: 760,
          maxWidth: '96vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>

          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>Nová prohlídka</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>

          <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start' }}>

              <div style={{ border: '1px solid var(--t-borderPrimary)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                  <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                    <ChevronLeft style={{ width: 16, height: 16, color: 'var(--t-textSecondary)' }} />
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
                  <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                    <ChevronRight style={{ width: 16, height: 16, color: 'var(--t-textSecondary)' }} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px' }}>
                  {DAYS_OF_WEEK.map(d => (
                    <div key={d} style={{ textAlign: 'center', padding: '4px 0', fontSize: 12, fontWeight: 600, color: 'var(--t-textMyDOCKPrimary, #E05524)' }}>
                      {d}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px 8px' }}>
                  {days.map((d, i) => {
                    const isSel = d.current && d.day === selected.d && calMonth === selected.m && calYear === selected.y
                    return (
                      <div
                        key={i}
                        onClick={() => d.current && setSelected({ y: calYear, m: calMonth, d: d.day })}
                        style={{ display: 'flex', justifyContent: 'center', padding: '3px 0', cursor: d.current ? 'pointer' : 'default' }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: isSel ? 'var(--t-bgMyDOCK, #E05524)' : 'transparent',
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
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Select label="Délka prohlídky" options={DELKA_OPT} value={delka} onChange={setDelka} width="100%" />
                <Input label="Čas prohlídky" value={cas} onChange={setCas} width="100%" />
                <Select label="Pozvánka pro klienta" options={POZVANKA_OPT} value={pozvanka} onChange={setPozvanka} width="100%" />
              </div>
            </div>

            <TextArea label="Poznámka" value={poznamka} onChange={setPoznamka} placeholder="Doplňující informace" width="100%" minHeight={120} />
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
