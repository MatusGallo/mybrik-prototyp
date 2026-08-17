import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@matusgallo/mysabds'
import ListPageShell from '../../components/shared/ListPageShell'
import DataTable from '../../components/shared/DataTable'
import PageFilterBar from '../../components/shared/PageFilterBar'
import NabidkaNemovitostiPanel from '../../components/obchod/NabidkaNemovitostiPanel'
import { nabidkaNemovitostiData, typNemovitostiLabel, typNemovitostiVariant, typObchoduVariant } from '../../data/mockObchod'
import { pobockyData, makleriList } from '../../data/mockOstatni'
import { renderDatum } from '../../utils/tableRenders'
import { renderAvatarName } from '../../utils/renderAvatarName'

const POBOCKY = pobockyData.map(p => p.nazev)
const STAVY = ['Aktivní', 'Uzavřeno', 'Storno', 'V přípravě']
const PAGE_SIZE = 50
const fmt = (v: number) => v > 0 ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(v) : '0 Kč'

const cols = [
  { key: 'id', label: 'ID', width: 50 },
  { key: 'idTicketu', label: 'ID ticketu', width: 90 },
  { key: 'ccId', label: 'CC ID', width: 70 },
  { key: 'cena', label: 'Cena', width: 140, align: 'right' as const, format: (v: unknown) => fmt(v as number) },
  // Barvy sjednocené s Příležitostmi a Poptávkami. Pozor na pojmenování: „Typ
  // objektu“ je druh nemovitosti, zatímco „Typ nemovitosti“ tady nese prodej /
  // pronájem, tedy totéž co „Typ poptávky“ na poptávkách.
  { key: 'typObjektu', label: 'Typ objektu', width: 110, render: (r: Record<string, unknown>) => {
    const v = String(r.typObjektu ?? '')
    if (!v) return null
    return <Tag label={typNemovitostiLabel(v)} variant={typNemovitostiVariant(v)} size="sm" />
  }},
  { key: 'typNemovitosti', label: 'Typ nemovitosti', width: 130, render: (r: Record<string, unknown>) => {
    const v = String(r.typNemovitosti ?? '')
    if (!v) return null
    return <Tag label={v} variant={typObchoduVariant(v)} size="sm" />
  }},
  { key: 'makler', label: 'Makléř', width: 240, flex: true, render: renderAvatarName('makler') },
  { key: 'pobocka', label: 'Pobočka', width: 240, flex: true },
  { key: 'nabidkaId', label: 'Nabídka ID', width: 90 },
  { key: 'klient', label: 'Klient', width: 180, render: renderAvatarName('klient') },
  { key: 'stav', label: 'Stav', width: 80 },
  { key: 'provize', label: 'Provize', width: 90 },
  { key: 'datumDokonceni', label: 'Datum dokončení', width: 140 },
  { key: 'datumVytvoreni', label: 'Vytvořeno', width: 110, render: renderDatum('datumVytvoreni') },
  { key: 'datumPosledniZmeny', label: 'Upraveno', width: 110, render: renderDatum('datumPosledniZmeny') },
]

export default function NabidkaNemovitostiPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [pobocka, setPobocka] = useState(new Set<string>())
  const [makler, setMakler] = useState(new Set<string>())
  const [stav, setStav] = useState(new Set<string>())
  const [klient, setKlient] = useState('')
  const [datumVytvoreni, setDatumVytvoreni] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (v: string) =>
    setter(prev => { const next = new Set(prev); next.has(v) ? next.delete(v) : next.add(v); return next })

  const pageData = nabidkaNemovitostiData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
    <ListPageShell
      title="Nabídka nemovitostí"
      actions={[{ label: 'Vytvořit nabídku nemovitosti', variant: 'primary', icon: 'plus', onClick: () => setPanelOpen(true) }]}
      filterBar={
        <PageFilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Hledat dle ID ticketu, nabídky...' }}
          groups={[
            { label: 'Pobočka', options: POBOCKY, values: pobocka, onChange: toggle(setPobocka), searchable: true },
            { label: 'Makléř', options: makleriList, values: makler, onChange: toggle(setMakler), searchable: true },
            { label: 'Stav', options: STAVY, values: stav, onChange: toggle(setStav) },
          ]}
          fields={[
            { label: 'Klient', value: klient, onChange: setKlient },
            { label: 'Datum vytvoření', type: 'date', value: datumVytvoreni, onChange: setDatumVytvoreni },
          ]}
          onClear={() => { setSearch(''); setPobocka(new Set()); setMakler(new Set()); setStav(new Set()); setKlient(''); setDatumVytvoreni(''); setPage(1) }}
        />
      }
      page={page}
      totalPages={Math.ceil(nabidkaNemovitostiData.length / PAGE_SIZE)}
      onPageChange={setPage}
      totalCount={nabidkaNemovitostiData.length}
    >
      <DataTable
        cols={cols}
        rows={pageData as Record<string, unknown>[]}
        actions={['history', 'edit', 'delete']}
        onRowClick={(row) => navigate(`/obchod/nabidka-nemovitosti/${row.id}`)}
        onAction={(action, row) => {
          if (action === 'edit') setEditRow(row)
        }}
      />
    </ListPageShell>

    {panelOpen && <NabidkaNemovitostiPanel onClose={() => setPanelOpen(false)} />}
    {editRow && (
      <NabidkaNemovitostiPanel
        initial={{
          typNemovitosti: String(editRow.typObjektu ?? ''),
          typNabidky: (editRow.typNemovitosti as 'Prodej' | 'Pronájem') ?? 'Prodej',
          cena: Number(editRow.cena ?? 0),
          cenaNespec: Number(editRow.cena ?? 0) > 0 ? 'Ne' : 'Ano',
          klient: String(editRow.klient ?? ''),
          makler: String(editRow.makler ?? ''),
          pobocka: String(editRow.pobocka ?? ''),
        }}
        onClose={() => setEditRow(null)}
      />
    )}
    </>
  )
}
