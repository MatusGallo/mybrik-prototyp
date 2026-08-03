import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, Input, Select, ToggleItem } from '@matusgallo/mysabds'

const KATEGORIE_OPT = [
  { value: 'pravni-sluzby', label: 'Právní služby' },
  { value: 'staging', label: 'Staging' },
  { value: 'inzerce', label: 'Inzerce vč. sociálních sítí' },
  { value: 'geometricke', label: 'Geometrické práce' },
  { value: 'inspekce', label: 'Inspekce nemovitosti' },
  { value: 'penb', label: 'PENB' },
  { value: 'pudorysy', label: 'Půdorysy' },
  { value: '3d', label: '3D prohlídka' },
  { value: 'graficke', label: 'Grafické práce' },
  { value: 'foto', label: 'Fotografické práce, video' },
  { value: 'vizualizace', label: 'Vizualizace' },
  { value: 'jine', label: 'Jiné' },
  { value: 'topovani', label: 'Topování' },
]

const PLATBA_OPT = [
  { value: 'provize', label: 'Provize' },
  { value: 'makler', label: 'Makléř' },
  { value: 'makler-bez-struktury', label: 'Makléř (bez struktury)' },
  { value: 'hsp', label: 'HSP' },
]

const DPH_OPT = [
  { value: '0', label: '0 %' },
  { value: '12', label: '12 %' },
  { value: '21', label: '21 %' },
]

function formatCena(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount) + ' Kč'
}

export interface NakladFormData {
  nazev: string
  dodavatel: string
  kategorie: string
  platba: string
  datum: string
  platceDPH: boolean
  dph: string
  castka: string
}

interface Props {
  onClose: () => void
  initialData?: NakladFormData
}

export default function NovyNakladModal({ onClose, initialData }: Props) {
  const isEdit = !!initialData
  const [nazev, setNazev] = useState(initialData?.nazev ?? '')
  const [dodavatel, setDodavatel] = useState(initialData?.dodavatel ?? '')
  const [kategorie, setKategorie] = useState(initialData?.kategorie ?? 'pravni-sluzby')
  const [platba, setPlatba] = useState(initialData?.platba ?? 'provize')
  const [datum, setDatum] = useState(initialData?.datum ?? '01.06.2026')
  const [platceDPH, setPlatceDPH] = useState(initialData?.platceDPH ?? false)
  const [dph, setDph] = useState(initialData?.dph ?? '21')
  const [castka, setCastka] = useState(initialData?.castka ?? '')
  const [errors, setErrors] = useState<{ nazev?: string; castka?: string }>({})

  // Calculation
  const castkaNum = parseFloat(castka.replace(',', '.').replace(/\s/g, '')) || 0
  const dphRate = parseFloat(dph) / 100
  const castkaCelkem = platceDPH ? castkaNum * (1 + dphRate) : castkaNum

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSubmit() {
    const newErrors: { nazev?: string; castka?: string } = {}
    if (!nazev.trim()) newErrors.nazev = 'Toto pole je povinné.'
    if (!castka.trim() || castkaNum <= 0) newErrors.castka = 'Zadejte částku.'
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
          <div style={{
            padding: 24, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexShrink: 0,
          }}>
            <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>
              {isEdit ? 'Editace nákladu' : 'Nový náklad'}
            </span>
            <IconButton icon={X} variant="ghost" size="md" tooltip="Zavřít" onClick={onClose} />
          </div>

          {/* Body */}
          <div style={{ padding: '0 24px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Input
              label="Název nákladu"
              required
              value={nazev}
              onChange={v => { setNazev(v); if (errors.nazev) setErrors(e => ({ ...e, nazev: undefined })) }}
              placeholder="Název nákladu"
              width="100%"
              error={errors.nazev}
            />

            <Input
              label="Dodavatel služeb"
              value={dodavatel}
              onChange={setDodavatel}
              placeholder="Dodavatel služeb"
              width="100%"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Select
                label="Kategorie nákladu"
                options={KATEGORIE_OPT}
                value={kategorie}
                onChange={setKategorie}
                width="100%"
              />
              <Select
                label="Platba na vrub"
                options={PLATBA_OPT}
                value={platba}
                onChange={setPlatba}
                width="100%"
              />
            </div>

            {/* Datum + Částka row — both half width */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input
                label="Datum vzniku"
                value={datum}
                onChange={setDatum}
                width="100%"
              />
              <Input
                label={platceDPH ? 'Částka bez DPH' : 'Částka'}
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

            {/* DPH plátce toggle + (conditional) DPH select + total vč. DPH */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ToggleItem
                checked={platceDPH}
                onChange={setPlatceDPH}
                label="Dodavatel je plátce DPH"
              />
              {platceDPH && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
                  <Select
                    options={DPH_OPT}
                    value={dph}
                    onChange={setDph}
                    width="100%"
                  />
                  <div style={{
                    height: 32,
                    padding: '0 16px',
                    background: 'var(--t-bgSecondary)',
                    border: '1px solid var(--t-borderPrimary)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t-textSecondary)', whiteSpace: 'nowrap' }}>
                      Vč. DPH
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-textPrimary)', whiteSpace: 'nowrap' }}>
                      {formatCena(castkaCelkem)}
                    </span>
                  </div>
                </div>
              )}
            </div>
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
