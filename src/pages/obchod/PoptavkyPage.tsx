import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@matusgallo/mysabds'
import ListPageShell from '../../components/shared/ListPageShell'
import DataTable from '../../components/shared/DataTable'
import PageFilterBar from '../../components/shared/PageFilterBar'
import NovaPoptavkaPanel from '../../components/obchod/NovaPoptavkaPanel'
import { poptavkyData } from '../../data/mockObchod'
import { renderDatum } from '../../utils/tableRenders'

const PAGE_SIZE = 10
const fmtCena = (v: number) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(v)

const cols = [
  { key: 'id', label: 'ID', width: 50 },
  { key: 'typNemovitosti', label: 'Typ nemovitosti', width: 140, flex: true, render: (r: Record<string, unknown>) => {
    const v = String(r.typNemovitosti ?? '')
    if (!v) return null
    return <Tag label={v} variant="outline" size="sm" />
  }},
  { key: 'typPoptavky', label: 'Typ poptávky', width: 120, render: (r: Record<string, unknown>) => {
    const v = String(r.typPoptavky ?? '')
    if (!v) return null
    return <Tag label={v} variant="outline" size="sm" />
  }},
  { key: 'podtyp', label: 'Podtyp', width: 90 },
  { key: 'plochaOd', label: 'Užitná plocha od', width: 130, align: 'right' as const },
  { key: 'plochaDo', label: 'Užitná plocha do', width: 130, align: 'right' as const },
  { key: 'cenaOd', label: 'Cena od', width: 140, align: 'right' as const, format: (v: unknown) => fmtCena(v as number) },
  { key: 'cenaDo', label: 'Cena do', width: 140, align: 'right' as const, format: (v: unknown) => fmtCena(v as number) },
  { key: 'klientu', label: 'Klientů', width: 80 },
  { key: 'prilezitosti', label: 'Příležitostí', width: 100 },
  { key: 'spoluprace', label: 'Spolupráce', width: 100 },
  { key: 'datumVytvoreni', label: 'Vytvořeno', width: 110, render: renderDatum('datumVytvoreni') },
]

export default function PoptavkyPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)

  const pageData = poptavkyData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <ListPageShell
        title="Poptávky"
        actions={[{ label: 'Vytvořit poptávku', variant: 'primary', icon: 'plus', onClick: () => setPanelOpen(true) }]}
        filterBar={
          <PageFilterBar
            search={{ value: search, onChange: setSearch, placeholder: 'Hledat...' }}
            onClear={() => { setSearch(''); setPage(1) }}
          />
        }
        page={page}
        totalPages={Math.ceil(619 / PAGE_SIZE)}
        onPageChange={setPage}
        totalCount={619}
      >
        <DataTable
          cols={cols}
          rows={pageData as Record<string, unknown>[]}
          actions={[]}
          onRowClick={(row) => navigate(`/obchod/poptavky/${row.id}`)}
        />
      </ListPageShell>

      {panelOpen && <NovaPoptavkaPanel onClose={() => setPanelOpen(false)} />}
    </>
  )
}
