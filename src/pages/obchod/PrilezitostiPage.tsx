import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Mail } from 'lucide-react'
import { Avatar, Tag } from '@matusgallo/mysabds'
import ListPageShell from '../../components/shared/ListPageShell'
import DataTable from '../../components/shared/DataTable'
import PageFilterBar from '../../components/shared/PageFilterBar'
import PrilezitostPanel from '../../components/obchod/PrilezitostPanel'
import { renderDatum } from '../../utils/tableRenders'
import { renderAvatarName, initials, avatarColor } from '../../utils/renderAvatarName'
import { prilezitostiData } from '../../data/mockObchod'
import { pobockyData, makleriList } from '../../data/mockOstatni'

const PAGE_SIZE = 10

const POBOCKY = pobockyData.map(p => p.nazev)
const TYPY_OBCHODU = ['Prodej', 'Pronájem']
const distinct = (key: 'typKontaktu' | 'zdroj') =>
  Array.from(new Set(prilezitostiData.map(p => p[key]))).filter(Boolean).sort((a, b) => a.localeCompare(b, 'cs'))
const TYPY_KONTAKTU = distinct('typKontaktu')
const ZDROJE = distinct('zdroj')

const cols = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'nazevNabidky', label: 'Název nabídky', width: 240, flex: true },
  { key: 'klient', label: 'Klient', width: 260, render: (r: Record<string, unknown>) => {
    const [name, email, phone] = String(r.klient ?? '').split('\n')
    if (!name) return <span style={{ color: 'var(--t-textPrimary)', fontSize: 14 }}>–</span>
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', width: '100%' }}>
        <Avatar size="sm" initials={initials(name)} color={avatarColor(name)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden', minWidth: 0 }}>
          <span style={{ fontSize: 14, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {(phone || email) && (
            <span style={{ fontSize: 12, color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[phone, email].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>
    )
  }},
  { key: 'stavProhlidky', label: 'Stav', width: 150 },
  { key: 'typNabidky', label: 'Typ nabídky', width: 100 },
  { key: 'makler', label: 'Makléř', width: 220, render: renderAvatarName('makler') },
  { key: 'pobocka', label: 'Pobočka', width: 160 },
  { key: 'franchiza', label: 'HSP', width: 130 },
  { key: 'datumVytvoreni', label: 'Vytvořeno', width: 110, render: renderDatum('datumVytvoreni') },
  { key: 'datumPosledniZmeny', label: 'Upraveno', width: 110, render: renderDatum('datumPosledniZmeny') },
  { key: 'idNabidky', label: 'ID nabídky', width: 90 },
  { key: 'typKontaktu', label: 'Typ kontaktu', width: 120, render: (r: Record<string, unknown>) => {
    const typ = String(r.typKontaktu ?? '')
    const Icon = typ === 'Telefon' ? Phone : typ === 'E-mail' ? Mail : null
    if (!typ) return null
    return <Tag label={typ} variant="neutral" size="sm" lead={Icon ? 'icon' : 'none'} icon={Icon ?? undefined} />
  }},
  { key: 'zdroj', label: 'Zdroj', width: 160 },
]

// ID a název nabídku identifikují, ty se vypnout nedají.
const LOCKED_COLS = new Set(['id', 'nazevNabidky'])
const TOGGLEABLE_COLS = cols
  .filter(c => !LOCKED_COLS.has(c.key))
  .map(c => ({ key: c.key, label: c.label }))

export default function PrilezitostiPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typObchodu, setTypObchodu] = useState(new Set<string>())
  const [makler, setMakler] = useState(new Set<string>())
  const [pobocka, setPobocka] = useState(new Set<string>())
  const [typKontaktu, setTypKontaktu] = useState(new Set<string>())
  const [zdroj, setZdroj] = useState(new Set<string>())
  const [vytvoreno, setVytvoreno] = useState('')
  const [upraveno, setUpraveno] = useState('')
  const [hiddenCols, setHiddenCols] = useState(new Set<string>())
  const [panelOpen, setPanelOpen] = useState(false)

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (v: string) =>
    setter(prev => { const next = new Set(prev); next.has(v) ? next.delete(v) : next.add(v); return next })

  const pageData = prilezitostiData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const visibleCols = cols.filter(c => !hiddenCols.has(c.key))

  return (
    <>
      <ListPageShell
        title="Příležitosti"
        actions={[{ label: 'Vytvořit příležitost', variant: 'primary', icon: 'plus', onClick: () => setPanelOpen(true) }]}
        filterBar={
          <PageFilterBar
            search={{ value: search, onChange: setSearch, placeholder: 'Hledat...' }}
            groups={[
              { label: 'Typ obchodu', options: TYPY_OBCHODU, values: typObchodu, onChange: toggle(setTypObchodu) },
              { label: 'Makléř', options: makleriList, values: makler, onChange: toggle(setMakler), searchable: true },
              { label: 'Pobočka', options: POBOCKY, values: pobocka, onChange: toggle(setPobocka), searchable: true },
              { label: 'Typ kontaktu', options: TYPY_KONTAKTU, values: typKontaktu, onChange: toggle(setTypKontaktu) },
              { label: 'Zdroj', options: ZDROJE, values: zdroj, onChange: toggle(setZdroj), searchable: true },
            ]}
            fields={[
              { label: 'Vytvořeno', type: 'date', value: vytvoreno, onChange: setVytvoreno },
              { label: 'Upraveno', type: 'date', value: upraveno, onChange: setUpraveno },
            ]}
            columns={TOGGLEABLE_COLS}
            hiddenCols={hiddenCols}
            onToggleCol={toggle(setHiddenCols)}
            onHideAllCols={() => setHiddenCols(new Set(TOGGLEABLE_COLS.map(c => c.key)))}
            onShowAllCols={() => setHiddenCols(new Set())}
            onClear={() => {
              setSearch(''); setTypObchodu(new Set()); setMakler(new Set()); setPobocka(new Set())
              setTypKontaktu(new Set()); setZdroj(new Set()); setVytvoreno(''); setUpraveno(''); setPage(1)
            }}
          />
        }
        page={page}
        totalPages={Math.ceil(1186 / PAGE_SIZE)}
        onPageChange={setPage}
        totalCount={1186}
      >
        <DataTable
          cols={visibleCols}
          rows={pageData as Record<string, unknown>[]}
          actions={[]}
          onRowClick={(row) => navigate(`/obchod/prilezitosti/${row.id}`)}
        />
      </ListPageShell>

      {panelOpen && <PrilezitostPanel onClose={() => setPanelOpen(false)} />}
    </>
  )
}
