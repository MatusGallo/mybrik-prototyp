import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { Button, Pagination, FilterButton, Menu, MenuItem } from '@matusgallo/mysabds'
import DataTable from '../../components/shared/DataTable'
import { renderDatum } from '../../utils/tableRenders'
import { renderAvatarName } from '../../utils/renderAvatarName'
import type { ColDef } from '../../components/shared/DataTable'

const BrandCheck = (props: LucideProps) => <Check {...props} color="var(--t-textMyDOCKPrimary)" />

const TABS = [
  { value: 'naklady',    label: 'Náklady',     path: '/vyuctovani/naklady' },
  { value: 'storno',     label: 'Storno',      path: '/vyuctovani/storno' },
  { value: 'provize',    label: 'Provize',     path: '/vyuctovani/provize' },
  { value: 'vyplaty',    label: 'Výplaty',     path: '/vyuctovani/vyplaty' },
  { value: 'vyuctovani', label: 'Vyúčtování',  path: '/vyuctovani/vyuctovani' },
  { value: 'faktury',    label: 'Faktury',     path: '/vyuctovani/faktury' },
]

const COLS: Record<string, ColDef[]> = {
  naklady: [
    { key: 'id',                    label: 'ID',                      width: 60 },
    { key: 'nazevNakladu',          label: 'Název nákladu',           width: 160 },
    { key: 'kategorie',             label: 'Kategorie',               width: 130 },
    { key: 'nazevNabidky',          label: 'Název nabídky',           width: 160, flex: true },
    { key: 'typObjektu',            label: 'Typ objektu',             width: 120 },
    { key: 'hsp',                   label: 'HSP',                     width: 120 },
    { key: 'pobocka',               label: 'Pobočka',                 width: 140 },
    { key: 'makler',                label: 'Makléř',                  width: 200, render: renderAvatarName('makler') },
    { key: 'stavNabidky',           label: 'Stav nabídky',            width: 120 },
    { key: 'celkovyNaklad',         label: 'Celkový náklad',          width: 130 },
    { key: 'cena',                  label: 'Cena',                    width: 100 },
    { key: 'typNakladu',            label: 'Typ nákladu',             width: 120 },
    { key: 'dph',                   label: 'DPH',                     width: 80 },
    { key: 'datumVytvoreniNakladu', label: 'Datum vytvoření nákladu', width: 180 },
    { key: 'datumVytvoreni',        label: 'Vytvořeno',               width: 110, render: renderDatum('datumVytvoreni') },
  ],
  storno: [
    { key: 'id',             label: 'ID',               width: 60 },
    { key: 'nazevNabidky',   label: 'Název nabídky',    width: 180, flex: true },
    { key: 'typObjektu',     label: 'Typ objektu',      width: 120 },
    { key: 'hsp',            label: 'HSP',              width: 120 },
    { key: 'pobocka',        label: 'Pobočka',          width: 140 },
    { key: 'makler',         label: 'Makléř',           width: 200, render: renderAvatarName('makler') },
    { key: 'stavNabidky',    label: 'Stav nabídky',     width: 120 },
    { key: 'vratitMajiteli', label: 'Vrátit majiteli',  width: 120 },
    { key: 'castkaKVraceni', label: 'Částka k vrácení', width: 140 },
    { key: 'provize',        label: 'Provize',          width: 100 },
    { key: 'dph',            label: 'DPH',              width: 80 },
    { key: 'datumVytvoreni', label: 'Vytvořeno',  width: 110, render: renderDatum('datumVytvoreni') },
    { key: 'typProvize',     label: 'Typ provize',      width: 120 },
  ],
  provize: [
    { key: 'id',             label: 'ID',              width: 60 },
    { key: 'nazevNabidky',   label: 'Název nabídky',   width: 180, flex: true },
    { key: 'typObjektu',     label: 'Typ objektu',     width: 120 },
    { key: 'hsp',            label: 'HSP',             width: 120 },
    { key: 'pobocka',        label: 'Pobočka',         width: 140 },
    { key: 'makler',         label: 'Makléř',          width: 200, render: renderAvatarName('makler') },
    { key: 'stavNabidky',    label: 'Stav nabídky',    width: 120 },
    { key: 'provize',        label: 'Provize',         width: 100 },
    { key: 'kVyplaceni',     label: 'K vyplacení',     width: 120 },
    { key: 'typProvize',     label: 'Typ provize',     width: 120 },
    { key: 'dph',            label: 'DPH',             width: 80 },
    { key: 'datumVytvoreni', label: 'Vytvořeno', width: 110, render: renderDatum('datumVytvoreni') },
  ],
  vyplaty: [
    { key: 'id',             label: 'ID',               width: 60 },
    { key: 'nazevNabidky',   label: 'Název nabídky',    width: 160, flex: true },
    { key: 'typObjektu',     label: 'Typ objektu',      width: 120 },
    { key: 'hsp',            label: 'HSP',              width: 120 },
    { key: 'pobocka',        label: 'Pobočka',          width: 140 },
    { key: 'makler',         label: 'Makléř',           width: 200, render: renderAvatarName('makler') },
    { key: 'stavNabidky',    label: 'Stav nabídky',     width: 120 },
    { key: 'provize',        label: 'Provize',          width: 100 },
    { key: 'vyseProvize',    label: 'Výše provize',     width: 120 },
    { key: 'naklad',         label: 'Náklad',           width: 100 },
    { key: 'nakladNaStorno', label: 'Náklad na storno', width: 150 },
    { key: 'kVyplaceni',     label: 'K vyplacení',      width: 120 },
    { key: 'dph',            label: 'DPH',              width: 80 },
  ],
  vyuctovani: [
    { key: 'id',             label: 'ID',              width: 60 },
    { key: 'nazevNabidky',   label: 'Název nabídky',   width: 160, flex: true },
    { key: 'forma',          label: 'Forma',           width: 100 },
    { key: 'vs',             label: 'VS',              width: 100 },
    { key: 'ss',             label: 'SS',              width: 100 },
    { key: 'cena',           label: 'Cena',            width: 100 },
    { key: 'ucelPlatby',     label: 'Účel platby',     width: 140 },
    { key: 'typObjektu',     label: 'Typ objektu',     width: 120 },
    { key: 'hsp',            label: 'HSP',             width: 120 },
    { key: 'pobocka',        label: 'Pobočka',         width: 140 },
    { key: 'makler',         label: 'Makléř',          width: 200, render: renderAvatarName('makler') },
    { key: 'stavNabidky',    label: 'Stav nabídky',    width: 120 },
    { key: 'datumVytvoreni', label: 'Vytvořeno', width: 110, render: renderDatum('datumVytvoreni') },
  ],
  faktury: [
    { key: 'id',              label: 'ID',               width: 60 },
    { key: 'mesic',           label: 'Měsíc',            width: 100 },
    { key: 'makler',          label: 'Makléř',           width: 200, flex: true, render: renderAvatarName('makler') },
    { key: 'faktura',         label: 'Faktura',          width: 140 },
    { key: 'vs',              label: 'VS',               width: 100 },
    { key: 'provizeBezDph',   label: 'Provize bez DPH',  width: 150 },
    { key: 'provizeSDph',     label: 'Provize s DPH',    width: 140 },
    { key: 'firma',           label: 'Firma',            width: 160 },
    { key: 'datumProplaceni', label: 'Datum proplacení', width: 150 },
    { key: 'poznamka',        label: 'Poznámka',         width: 160 },
  ],
}

const DPH_OPTIONS    = [{ value: 's-bez', label: 'S/Bez DPH' }, { value: 's', label: 'S DPH' }, { value: 'bez', label: 'Bez DPH' }]
const PERIOD_OPTIONS = [{ value: 'mesic', label: 'Měsíc' }, { value: 'rok', label: 'Rok' }]
const MONTH_OPTIONS  = [
  { value: '1', label: 'Leden' }, { value: '2', label: 'Únor' }, { value: '3', label: 'Březen' },
  { value: '4', label: 'Duben' }, { value: '5', label: 'Květen' }, { value: '6', label: 'Červen' },
  { value: '7', label: 'Červenec' }, { value: '8', label: 'Srpen' }, { value: '9', label: 'Září' },
  { value: '10', label: 'Říjen' }, { value: '11', label: 'Listopad' }, { value: '12', label: 'Prosinec' },
]

type OpenKey = 'dph' | 'period' | 'month' | 'year' | null

export default function VyuctovaniPage() {
  const location = useLocation()
  const [page, setPage] = useState(1)
  const [dph, setDph] = useState('s-bez')
  const [period, setPeriod] = useState('mesic')
  const [month, setMonth] = useState('5')
  const [year, setYear] = useState('2026')
  const [open, setOpen] = useState<OpenKey>(null)
  const controlsRef = useRef<HTMLDivElement>(null)

  const years = Array.from({ length: 6 }, (_, i) => ({ value: String(2022 + i), label: String(2022 + i) }))

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (controlsRef.current && !controlsRef.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(key: OpenKey) { setOpen(prev => prev === key ? null : key) }

  const activeTab = TABS.find(t => t.path === location.pathname)?.value ?? 'naklady'
  const tabTitle  = TABS.find(t => t.value === activeTab)?.label ?? ''
  const cols      = COLS[activeTab] ?? []
  const dphLabel    = DPH_OPTIONS.find(o => o.value === dph)?.label ?? 'S/Bez DPH'
  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label ?? 'Měsíc'
  const monthLabel  = MONTH_OPTIONS.find(o => o.value === month)?.label ?? ''
  const yearLabel   = year

  const rows: Record<string, unknown>[] = []
  const totalPages = Math.max(1, Math.ceil(rows.length / 10))

  function DropMenu<T extends string>({ id, value, options, onSelect }: {
    id: OpenKey
    value: T
    options: { value: T; label: string }[]
    onSelect: (v: T) => void
  }) {
    return open === id ? (
      <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 200, animation: 'dropdownEnter 180ms cubic-bezier(0.16,1,0.3,1) both' }} width={180}>
        {options.map(o => (
          <MenuItem
            key={o.value}
            label={o.label}
            trailIcon={o.value === value ? BrandCheck as unknown as typeof Check : undefined}
            onClick={() => { onSelect(o.value); setOpen(null) }}
          />
        ))}
      </Menu>
    ) : null
  }

  return (
    <div>
      {/* Title + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, minHeight: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--t-textPrimary)', lineHeight: 1 }}>{tabTitle}</h1>
        {activeTab === 'naklady' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button label="Nový náklad na pobočku" variant="outlined" />
            <Button label="Nový náklad" variant="primary" />
          </div>
        )}
      </div>

      {/* Filters */}
      <div ref={controlsRef} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <FilterButton label={dphLabel} active onClick={() => toggle('dph')} />
            <DropMenu id="dph" value={dph} options={DPH_OPTIONS} onSelect={setDph} />
          </div>
          <div style={{ position: 'relative' }}>
            <FilterButton label={periodLabel} active onClick={() => toggle('period')} />
            <DropMenu id="period" value={period} options={PERIOD_OPTIONS} onSelect={v => { setPeriod(v); setOpen(null) }} />
          </div>
          {period === 'mesic' && (
            <div style={{ position: 'relative' }}>
              <FilterButton label={monthLabel} active onClick={() => toggle('month')} />
              <DropMenu id="month" value={month} options={MONTH_OPTIONS} onSelect={setMonth} />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <FilterButton label={yearLabel} active onClick={() => toggle('year')} />
            <DropMenu id="year" value={year} options={years} onSelect={setYear} />
          </div>
        </div>
      </div>

      {/* Provize info bar */}
      {activeTab === 'provize' && (
        <div style={{ padding: '10px 0', fontSize: 14, color: 'var(--t-textPrimary)' }}>
          Aktuální produkce:{' '}
          <strong style={{ color: 'var(--t-textMyDOCKPrimary)' }}>20 000 000,00 Kč</strong>
          {' '}k povýšení Vám zbývá{' '}
          <strong style={{ color: 'var(--t-textDangerPrimary)' }}>-20 000 000,00 Kč</strong>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <DataTable cols={cols} rows={rows} actions={['view', 'edit', 'delete']} />
      </div>

      {/* Pagination — až když se záznamy nevejdou na jednu stránku */}
      {totalPages > 1 && (
        <div style={{ marginTop: 16 }}>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}