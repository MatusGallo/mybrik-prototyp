import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2 } from 'lucide-react'
import {
  Modal, Button, IconButton, Input, Select, DatePicker, TableHeaderCell,
  Tag, typography,
} from '@matusgallo/mysabds'
import EmptyState from '../shared/EmptyState'

/* ──────────────────────────────────────────────────────────────────────────────
   Zpracování plateb — jedno okno, ve kterém uživatel rozvrhne, co se s penězi
   stane: co doteče na provizi, co se převede z rezervačního poplatku a co se
   vrací. Rekapitulace nahoře přepočítává „zbývá" živě podle rozepsaných plateb,
   takže uživatel před uložením vidí, jestli mu zakázka sedne na nulu.
────────────────────────────────────────────────────────────────────────────── */

export const UCEL_OPT = [
  { value: 'uhrada-nekryte-provize', label: 'Úhrada nekryté provize' },
  { value: 'prevod-rp-na-provizi', label: 'Převod zálohy na provizi' },
  { value: 'vraceni-rp-zajemci', label: 'Vrácení zálohy zájemci' },
  { value: 'predani-rp-majiteli', label: 'Předání zálohy majiteli' },
  { value: 'rezervacni-poplatek', label: 'Úhrada rezervační zálohy' },
]

export const FORMA_OPT = [
  { value: 'prevodem', label: 'Převodem' },
  { value: 'hotove', label: 'Hotově' },
  { value: 'z-uschovny', label: 'Z úschovny' },
  { value: 'zapocteni', label: 'Započtení' },
]

// Účely, které navyšují uhrazenou provizi.
export const UCEL_NA_PROVIZI = ['uhrada-nekryte-provize', 'prevod-rp-na-provizi']
// Účely, které ubírají z peněz držených v rezervaci.
export const UCEL_Z_REZERVACE = ['prevod-rp-na-provizi', 'vraceni-rp-zajemci', 'predani-rp-majiteli']

export interface PlatbaDraft {
  id: number
  ucel: string
  castka: string
  forma: string
  splatnost: Date | null
}

export interface ZpracovaniPlatebSouhrn {
  /** Kolik klient složil na rezervačním poplatku */
  rezervaceSlozeno: number
  /** Kolik z rezervace je už vypořádané (převedené, vrácené, předané) */
  rezervaceVyporadano: number
  provizeCelkem: number
  provizeUhrazeno: number
  poplatekVCene: boolean
}

interface Props {
  onClose: () => void
  onSave?: (platby: PlatbaDraft[]) => void
  souhrn: ZpracovaniPlatebSouhrn
  /** Předvolený účel u první platby — podle karty, ze které se okno otevřelo. */
  defaultUcel?: string
  /** Předvyplněná částka první platby, typicky zbývající dluh. */
  defaultCastka?: string
}

function formatCena(cena: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(cena)
}

function parseCastka(s: string): number {
  const n = Number(s.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Blok rekapitulace — dominantní je jediné číslo, které uživatele zajímá:
// kolik zbyde po zpracování. Vstupy do výpočtu jsou pod ním jako kontext.
// Tři sloupce popisek–hodnota se do 720px modalu nevešly, popisky se lámaly.
function RecapBlock({ title, amount, tone, context, divider }: {
  title: string
  amount: number
  tone: 'success' | 'danger'
  context: string
  divider?: boolean
}) {
  return (
    <div style={{
      flex: 1, minWidth: 0, padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 2,
      borderLeft: divider ? '1px solid var(--borderPrimary)' : 'none',
    }}>
      <span style={{ ...typography.overline11, color: 'var(--textTertiary)' }}>{title}</span>
      <span style={{
        ...typography.headline20,
        color: tone === 'danger' ? 'var(--textDangerPrimary)' : 'var(--textSuccessPrimary)',
        whiteSpace: 'nowrap',
      }}>
        {formatCena(amount)}
      </span>
      <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>{context}</span>
    </div>
  )
}

// Šířky sloupců tabulky plateb — jedna definice pro záhlaví i řádky.
const GRID = 'minmax(0, 1fr) 100px 120px 140px 32px'

export default function ZpracovaniPlatebModal({
  onClose, onSave, souhrn, defaultUcel = 'uhrada-nekryte-provize', defaultCastka,
}: Props) {
  const [platby, setPlatby] = useState<PlatbaDraft[]>([
    { id: 1, ucel: defaultUcel, castka: defaultCastka ?? '', forma: 'prevodem', splatnost: null },
  ])
  const [errors, setErrors] = useState<Record<number, { castka?: string; splatnost?: string }>>({})

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function update(id: number, patch: Partial<PlatbaDraft>) {
    setPlatby(rows => rows.map(r => (r.id === id ? { ...r, ...patch } : r)))
    setErrors(e => ({ ...e, [id]: {} }))
  }

  function addRow() {
    setPlatby(rows => [
      ...rows,
      { id: Math.max(0, ...rows.map(r => r.id)) + 1, ucel: '', castka: '', forma: 'prevodem', splatnost: null },
    ])
  }

  // Živý dopad rozepsaných plateb na provizi a na peníze v rezervaci.
  const naProvizi = platby
    .filter(p => UCEL_NA_PROVIZI.includes(p.ucel))
    .reduce((s, p) => s + parseCastka(p.castka), 0)
  const zRezervace = platby
    .filter(p => UCEL_Z_REZERVACE.includes(p.ucel))
    .reduce((s, p) => s + parseCastka(p.castka), 0)

  const rezervaceZbyva = souhrn.rezervaceSlozeno - souhrn.rezervaceVyporadano
  const rezervacePoZpracovani = rezervaceZbyva - zRezervace
  const provizeZbyva = souhrn.provizeUhrazeno - souhrn.provizeCelkem
  const provizePoZpracovani = provizeZbyva + naProvizi

  const maZmeny = naProvizi > 0 || zRezervace > 0

  function handleSave() {
    const next: typeof errors = {}
    for (const p of platby) {
      const row: { castka?: string; splatnost?: string } = {}
      if (parseCastka(p.castka) <= 0) row.castka = 'Zadejte částku větší než nula.'
      if (!p.splatnost) row.splatnost = 'Vyberte datum splatnosti.'
      if (Object.keys(row).length > 0) next[p.id] = row
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSave?.(platby)
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
            title="Zpracování plateb"
            onClose={onClose}
            width={720}
            maxHeight={720}
            actions={[
              { label: 'Zrušit', variant: 'secondary', onClick: onClose },
              { label: 'Uložit platby', variant: 'primary', disabled: platby.length === 0, onClick: handleSave },
            ]}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Rekapitulace — kolik po zpracování zbyde v rezervaci a na provizi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'stretch',
                  border: '1px solid var(--borderPrimary)', borderRadius: 8, overflow: 'hidden',
                }}>
                  <RecapBlock
                    title={maZmeny ? 'Rezervace po zpracování' : 'Zbývá v rezervaci'}
                    amount={maZmeny ? rezervacePoZpracovani : rezervaceZbyva}
                    tone={(maZmeny ? rezervacePoZpracovani : rezervaceZbyva) < 0 ? 'danger' : 'success'}
                    context={`složeno ${formatCena(souhrn.rezervaceSlozeno)} · vypořádáno ${formatCena(souhrn.rezervaceVyporadano)}`}
                  />
                  <RecapBlock
                    title={maZmeny ? 'Provize po zpracování' : 'Zbývá uhradit na provizi'}
                    amount={maZmeny ? provizePoZpracovani : provizeZbyva}
                    tone={(maZmeny ? provizePoZpracovani : provizeZbyva) < 0 ? 'danger' : 'success'}
                    context={`provize ${formatCena(souhrn.provizeCelkem)} · uhrazeno ${formatCena(souhrn.provizeUhrazeno)}`}
                    divider
                  />
                </div>

                {/* Kontext, který není číslo, a proto nepatří do pásu nad ním */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>
                    Rezervační záloha zahrnutá v ceně
                  </span>
                  <Tag
                    label={souhrn.poplatekVCene ? 'Ano' : 'Ne'}
                    variant={souhrn.poplatekVCene ? 'success' : 'neutral'}
                    size="sm"
                    lead="indicator"
                  />
                </div>
              </div>

              {/* Tabulka plateb */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {platby.length === 0 ? (
                  <EmptyState
                    title="Žádné platby k zpracování"
                    description="Přidejte platbu a rozvrhněte, co se s penězi na zakázce stane."
                    cta={{ label: 'Přidat platbu', onClick: addRow }}
                  />
                ) : (
                  <>
                    <div>
                      {/* Záhlaví — popisky sloupců zastupují popisky polí v řádcích */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: GRID, gap: 8,
                        background: 'var(--bgSecondary)', borderRadius: 8,
                      }}>
                        {['Účel platby', 'Částka', 'Forma', 'Splatnost'].map(c => (
                          <div key={c} style={{ pointerEvents: 'none', minWidth: 0 }}>
                            <TableHeaderCell size="dense" label={c} width="100%" />
                          </div>
                        ))}
                        <div style={{ pointerEvents: 'none' }}>
                          <TableHeaderCell size="dense" empty width="100%" />
                        </div>
                      </div>

                      {platby.map((p, i) => {
                        const err = errors[p.id] ?? {}
                        return (
                          <div
                            key={p.id}
                            style={{
                              display: 'grid', gridTemplateColumns: GRID, gap: 8,
                              alignItems: 'start', padding: '8px 0',
                              borderBottom: i === platby.length - 1 ? 'none' : '1px solid var(--borderPrimary)',
                            }}
                          >
                            <Select
                              ariaLabel="Účel platby"
                              placeholder="Vyberte účel"
                              options={UCEL_OPT}
                              value={p.ucel}
                              onChange={v => update(p.id, { ucel: v })}
                              width="100%"
                            />
                            <Input
                              value={p.castka}
                              onChange={v => update(p.id, { castka: v })}
                              placeholder="0"
                              suffix="Kč"
                              numeric
                              textAlign="right"
                              width="100%"
                              error={err.castka}
                            />
                            <Select
                              ariaLabel="Forma platby"
                              options={FORMA_OPT}
                              value={p.forma}
                              onChange={v => update(p.id, { forma: v })}
                              width="100%"
                            />
                            <DatePicker
                              value={p.splatnost}
                              onChange={v => update(p.id, { splatnost: v })}
                              width="100%"
                              error={err.splatnost}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: 32 }}>
                              <IconButton
                                icon={Trash2}
                                variant="ghost"
                                size="sm"
                                destructive
                                tooltip="Odebrat platbu"
                                onClick={() => setPlatby(rows => rows.filter(r => r.id !== p.id))}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div>
                      <Button label="Přidat platbu" variant="outlined" size="md" leadIcon={Plus} onClick={addRow} />
                    </div>
                  </>
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
