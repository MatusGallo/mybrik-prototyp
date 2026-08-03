import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, Input, TextArea, Select, ToggleItem } from '@matusgallo/mysabds'
import { uzivateleData } from '../../data/mockOstatni'

const RESITEL_OPT = uzivateleData
  .filter(u => u.role === 'Makléř' || u.role === 'Administrátor')
  .map(u => ({ value: `${u.jmeno} ${u.prijmeni}`, label: `${u.jmeno} ${u.prijmeni}` }))

interface Props {
  defaultResitel?: string
  onClose: () => void
}

export default function NovyUkolModal({ defaultResitel, onClose }: Props) {
  const [nazev, setNazev] = useState('')
  const [popis, setPopis] = useState('')
  const [termin, setTermin] = useState('')
  const [resitel, setResitel] = useState(defaultResitel ?? RESITEL_OPT[0]?.value ?? '')
  const [pripomenuti, setPripomenuti] = useState(false)
  const [datumPripomenuti, setDatumPripomenuti] = useState('')

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
          width: 560,
          maxWidth: '96vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>

          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>Nový úkol</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>

          <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            <Input label="Název" required value={nazev} onChange={setNazev} placeholder="Zadejte název úkolu" width="100%" />
            <TextArea label="Popis úkolu" required value={popis} onChange={setPopis} placeholder="Zadejte popis úkolu" width="100%" minHeight={120} />
            <Input label="Termín" required value={termin} onChange={setTermin} placeholder="Např. 01.05.2026 09:00" width="100%" />
            <Select label="Řešitel" required options={RESITEL_OPT} value={resitel} onChange={setResitel} width="100%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ToggleItem label="Připomínka" position="right" checked={pripomenuti} onChange={setPripomenuti} />
              {pripomenuti && (
                <Input
                  label="Datum a čas připomínky"
                  value={datumPripomenuti}
                  onChange={setDatumPripomenuti}
                  placeholder="Např. 01.05.2026 09:00"
                  width="100%"
                />
              )}
            </div>
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
