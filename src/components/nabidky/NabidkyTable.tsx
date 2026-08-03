import { useState } from 'react'
import { Copy, Pencil, Trash } from 'lucide-react'
import { TableHeaderCell, TableHeaderCellContent, TableCell, IconButton, Pagination, Tag } from '@matusgallo/mysabds'
import type { Nabidka } from '../../data/mockData'
import EmptyState from '../shared/EmptyState'

export const NABIDKY_COLUMNS = [
  { key: 'id',         label: 'ID' },
  { key: 'nabidka',    label: 'Nabídka' },
  { key: 'typObjektu', label: 'Typ objektu' },
  { key: 'pobocka',    label: 'Pobočka' },
  { key: 'makler',     label: 'Makléř' },
  { key: 'podkategorie', label: 'Podkategorie' },
  { key: 'stavNabidky',  label: 'Stav' },
  { key: 'vyhradni',     label: 'Výhradní spolupráce' },
  { key: 'klient',       label: 'Klient' },
  { key: 'cena',         label: 'Cena' },
  { key: 'vytvoreno',    label: 'Vytvořeno' },
  { key: 'upraveno',     label: 'Upraveno' },
  { key: 'konecLhuty',   label: 'Konec lhůty' },
] as const

export type NabidkyColKey = typeof NABIDKY_COLUMNS[number]['key']

export type SortDir = 'none' | 'asc' | 'desc'
export interface SortState {
  key: NabidkyColKey | null
  dir: SortDir
}

function parseCzDateTime(dt: string | null | undefined): number {
  if (!dt) return 0
  const [date, time] = dt.split(' ')
  const [d, m, y] = (date ?? '').split('.')
  const [hh = '0', mm = '0'] = (time ?? '').split(':')
  const iso = `${y}-${m?.padStart(2, '0')}-${d?.padStart(2, '0')}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

function sortValue(row: Nabidka, key: NabidkyColKey): string | number {
  switch (key) {
    case 'id':          return row.id
    case 'nabidka':     return row.nazev.toLocaleLowerCase('cs')
    case 'typObjektu':  return row.typObjektu
    case 'pobocka':     return row.pobocka.toLocaleLowerCase('cs')
    case 'makler':      return row.makler.toLocaleLowerCase('cs')
    case 'podkategorie':return row.podkategorie.toLocaleLowerCase('cs')
    case 'stavNabidky': return row.stavNabidky.toLocaleLowerCase('cs')
    case 'vyhradni':    return row.vyhradni ? 1 : 0
    case 'klient':      return (row.klient ?? '').toLocaleLowerCase('cs')
    case 'cena':        return row.cena
    case 'vytvoreno':   return parseCzDateTime(row.datumVytvoreni)
    case 'upraveno':    return parseCzDateTime(row.datumPosledniZmeny)
    case 'konecLhuty':  return parseCzDateTime(row.konecLhutyVkladu)
  }
}

export function sortNabidky(data: Nabidka[], sort: SortState): Nabidka[] {
  if (!sort.key || sort.dir === 'none') return data
  const key = sort.key
  const sign = sort.dir === 'asc' ? 1 : -1
  return [...data].sort((a, b) => {
    const av = sortValue(a, key)
    const bv = sortValue(b, key)
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign
    return String(av).localeCompare(String(bv), 'cs') * sign
  })
}

interface NabidkyTableProps {
  data: Nabidka[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalCount: number
  hiddenCols?: Set<string>
  sort?: SortState
  onSort?: (key: NabidkyColKey) => void
  onRowClick?: (id: number) => void
  onEdit?: (id: number) => void
  onDuplicate?: (id: number) => void
  onDelete?: (id: number) => void
}

function formatCena(cena: number) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(cena)
}

function splitDateTime(dt: string): { date: string; time: string } {
  const [date, time] = dt.split(' ')
  return { date: date ?? dt, time: time ?? '' }
}

function stavVariant(stav: string): 'brand' | 'success' | 'warning' | 'danger' | 'neutral' {
  const s = stav.toLowerCase()
  if (s === 'aktivní') return 'brand'
  if (s === 'podepsaná smlouva' || s === 'zobchodováno') return 'success'
  if (s.includes('storno') || s.includes('spor') || s === 'rezervace zrušeno') return 'danger'
  if (s.startsWith('v převodu') || s === 'rezervace') return 'warning'
  return 'neutral'
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const PHOTO_SEEDS = [
  'house1', 'realestate2', 'property3', 'villa4', 'apartment5',
  'home6', 'building7', 'residence8', 'estate9', 'flat10',
  'house11', 'condo12', 'mansion13', 'cottage14', 'loft15',
  'penthouse16', 'duplex17', 'townhouse18', 'bungalow19', 'studio20',
  'house21', 'realestate22',
]

const HEADER_HEIGHT = 40
const ACTION_WIDTH = 156
const KLIENT_MIN_WIDTH = 280

const FIXED_COL_WIDTHS: [string, number][] = [
  ['id', 72], ['nabidka', 400], ['typObjektu', 120], ['pobocka', 160],
  ['makler', 180], ['podkategorie', 156], ['stavNabidky', 200],
  ['vyhradni', 160], ['cena', 160], ['vytvoreno', 130],
  ['upraveno', 130], ['konecLhuty', 116],
]

export default function NabidkyTable({ data, page, totalPages, onPageChange, hiddenCols, sort, onSort, onRowClick, onEdit, onDuplicate, onDelete }: NabidkyTableProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const show = (key: string) => !hiddenCols?.has(key)
  const sortOf = (key: NabidkyColKey): SortDir => (sort?.key === key ? sort.dir : 'none')

  const tableMinWidth = FIXED_COL_WIDTHS.reduce((s, [k, w]) => s + (show(k) ? w : 0), 0)
    + (show('klient') ? KLIENT_MIN_WIDTH : 0)
    + ACTION_WIDTH

  if (data.length === 0) {
    return <EmptyState />
  }

  return (
    <div>
      <div style={{ overflowX: 'auto', background: 'var(--t-bgPrimary)' }}>
        <div style={{ minWidth: tableMinWidth }}>

          {/* Hlavička */}
          {data.length > 0 && <div style={{ display: 'flex' }}>
            <div style={{ borderTopLeftRadius: 8, borderBottomLeftRadius: 8, overflow: 'hidden', display: 'flex', flex: 1, height: HEADER_HEIGHT, background: 'var(--t-bgSecondary)' }}>
              {show('id')           && <TableHeaderCell label="ID" width={72} sortable sort={sortOf('id')} onSort={() => onSort?.('id')} />}
              {show('nabidka')      && <TableHeaderCell label="Nabídka" width={400} sortable sort={sortOf('nabidka')} onSort={() => onSort?.('nabidka')} />}
              {show('typObjektu')   && <TableHeaderCell label="Typ objektu" width={120} sortable sort={sortOf('typObjektu')} onSort={() => onSort?.('typObjektu')} />}
              {show('pobocka')      && <TableHeaderCell label="Pobočka" width={160} sortable sort={sortOf('pobocka')} onSort={() => onSort?.('pobocka')} />}
              {show('makler')       && <TableHeaderCell label="Makléř" width={180} sortable sort={sortOf('makler')} onSort={() => onSort?.('makler')} />}
              {show('podkategorie') && <TableHeaderCell label="Podkategorie" width={156} sortable sort={sortOf('podkategorie')} onSort={() => onSort?.('podkategorie')} />}
              {show('stavNabidky')  && <TableHeaderCell label="Stav" width={200} sortable sort={sortOf('stavNabidky')} onSort={() => onSort?.('stavNabidky')} />}
              {show('vyhradni')     && <TableHeaderCell label="Výhradní spolupráce" width={160} sortable sort={sortOf('vyhradni')} onSort={() => onSort?.('vyhradni')} />}
              {show('klient') && (
                <div style={{ flex: 1, minWidth: KLIENT_MIN_WIDTH, height: HEADER_HEIGHT, background: 'var(--t-bgSecondary)', display: 'inline-flex', alignItems: 'center', paddingLeft: 16, paddingRight: 16, boxSizing: 'border-box' }}>
                  <TableHeaderCellContent label="Klient" sortable sort={sortOf('klient')} onClick={() => onSort?.('klient')} />
                </div>
              )}
              {show('cena') && (
                <div style={{ height: 40, width: 160, background: 'var(--t-bgSecondary)', display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', flexShrink: 0, boxSizing: 'border-box' }}>
                  <div style={{ height: 24, paddingLeft: 16, paddingRight: 16, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <TableHeaderCellContent label="Cena" sortable sort={sortOf('cena')} onClick={() => onSort?.('cena')} />
                  </div>
                </div>
              )}
              {show('vytvoreno')   && <TableHeaderCell label="Vytvořeno" width={130} sortable sort={sortOf('vytvoreno')} onSort={() => onSort?.('vytvoreno')} />}
              {show('upraveno')    && <TableHeaderCell label="Upraveno" width={130} sortable sort={sortOf('upraveno')} onSort={() => onSort?.('upraveno')} />}
              {show('konecLhuty')  && <TableHeaderCell label="Konec lhůty" width={116} sortable sort={sortOf('konecLhuty')} onSort={() => onSort?.('konecLhuty')} />}
            </div>
            <div style={{ position: 'sticky', right: 0, zIndex: 2, width: ACTION_WIDTH, height: HEADER_HEIGHT, background: 'var(--t-bgSecondary)', borderTopRightRadius: 8, borderBottomRightRadius: 8, flexShrink: 0 }} />
          </div>}

          {/* Řádky */}
          {data.map((row, idx) => {
              const hovered = hoveredRow === row.id
              const vytvoreno = splitDateTime(row.datumVytvoreni)
              const upraveno = splitDateTime(row.datumPosledniZmeny)
              const konecLhuty = row.konecLhutyVkladu ? splitDateTime(row.konecLhutyVkladu) : null
              const photoSeed = PHOTO_SEEDS[idx % PHOTO_SEEDS.length]

              return (
                <div
                  key={row.id}
                  style={{ display: 'flex', alignItems: 'stretch', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick?.(row.id)}
                >
                  {show('id')         && <TableCell size="spacious" width={72} hovered={hovered} borderBottom label={String(row.id)} />}
                  {show('nabidka')    && <TableCell size="spacious" width={400} hovered={hovered} borderBottom content={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 368, overflow: 'hidden' }}>
                      <img
                        src={`https://picsum.photos/seed/${photoSeed}/60/40`}
                        alt=""
                        style={{ width: 60, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.nazev}
                        </div>
                        <div style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: '20px', color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.adresa}
                        </div>
                      </div>
                    </div>
                  } />}
                  {show('typObjektu')   && <TableCell size="spacious" width={120} hovered={hovered} borderBottom content={<Tag label={capitalize(row.typObjektu)} size="sm" variant="outline" />} />}
                  {show('pobocka')      && <TableCell size="spacious" width={160} hovered={hovered} borderBottom label={row.pobocka} />}
                  {show('makler')       && <TableCell size="spacious" width={180} hovered={hovered} borderBottom label={row.makler} />}
                  {show('podkategorie') && <TableCell size="spacious" width={156} hovered={hovered} borderBottom content={<Tag label={row.podkategorie} size="sm" variant="outline" />} />}
                  {show('stavNabidky')  && <TableCell size="spacious" width={200} hovered={hovered} borderBottom content={<Tag label={row.stavNabidky} size="sm" variant={stavVariant(row.stavNabidky)} lead="indicator" />} />}
                  {show('vyhradni')     && <TableCell size="spacious" width={160} hovered={hovered} borderBottom label={row.vyhradni ? 'Ano' : 'Ne'} />}
                  {show('klient') && (
                    <div style={{ flex: 1, minWidth: KLIENT_MIN_WIDTH, background: hovered ? 'var(--t-bgHover)' : 'var(--t-bgPrimary)', transition: 'background-color 150ms', borderBottom: '1px solid var(--t-borderPrimary)', display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 16, boxSizing: 'border-box', overflow: 'hidden' }}>
                      <span style={{ fontSize: 14, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.klient || '–'}
                      </span>
                    </div>
                  )}
                  {show('cena')         && <TableCell size="spacious" width={160} hovered={hovered} borderBottom label={formatCena(row.cena)} align="right" />}
                  {show('vytvoreno')    && <TableCell size="spacious" width={130} hovered={hovered} borderBottom label={vytvoreno.date} supporting={vytvoreno.time} />}
                  {show('upraveno')     && <TableCell size="spacious" width={130} hovered={hovered} borderBottom label={upraveno.date} supporting={upraveno.time} />}
                  {show('konecLhuty')   && <TableCell size="spacious" width={116} hovered={hovered} borderBottom label={konecLhuty?.date ?? '–'} supporting={konecLhuty?.time} />}
                  <div style={{ position: 'sticky', right: 0, zIndex: 1, flexShrink: 0, background: 'var(--t-bgPrimary)' }} onClick={e => e.stopPropagation()}>
                    <TableCell
                      size="spacious"
                      width={ACTION_WIDTH}
                      hovered={hovered}
                      borderBottom
                      content={
                        <div style={{ display: 'flex', gap: 2 }}>
                          <span className="icon-trash-primary">
                            <IconButton icon={Trash} variant="ghost" size="lg" tooltip="Smazat" onClick={() => onDelete?.(row.id)} />
                          </span>
                          <IconButton icon={Copy} variant="ghost" size="lg" tooltip="Duplikovat" onClick={() => onDuplicate?.(row.id)} />
                          <IconButton icon={Pencil} variant="ghost" size="lg" tooltip="Upravit" onClick={() => onEdit?.(row.id)} />
                        </div>
                      }
                    />
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />}
    </div>
  )
}
