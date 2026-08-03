import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@matusgallo/mysabds'
import ListPageShell from '../components/shared/ListPageShell'
import DataTable from '../components/shared/DataTable'
import PageFilterBar from '../components/shared/PageFilterBar'
import { hspData } from '../data/mockOstatni'
import { renderDatum } from '../utils/tableRenders'
import { renderAvatarName } from '../utils/renderAvatarName'

const PAGE_SIZE = 10

const stavVariant = (stav: string): 'success' | 'danger' =>
  stav === 'Aktivní' ? 'success' : 'danger'

const cols = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'nazev', label: 'Název HSP', width: 400, flex: true },
  { key: 'stav', label: 'Stav', width: 120, render: (r: Record<string, unknown>) => <Tag label={r.stav as string} size="sm" variant={stavVariant(r.stav as string)} lead="indicator" /> },
  { key: 'odpovednáOsoba', label: 'Odpovědná osoba', width: 240, render: renderAvatarName('odpovednáOsoba') },
  { key: 'datumVytvoreni', label: 'Vytvořeno', width: 110, render: renderDatum('datumVytvoreni') },
  { key: 'datumPosledniZmeny', label: 'Upraveno', width: 110, render: renderDatum('datumPosledniZmeny') },
]

export default function HspPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [fDatumVytvoreni, setFDatumVytvoreni] = useState('')
  const [fDatumZmeny, setFDatumZmeny] = useState('')
  const [stavValues, setStavValues] = useState(new Set<string>())

  const toggleStav = (v: string) => setStavValues(prev => {
    const next = new Set(prev)
    next.has(v) ? next.delete(v) : next.add(v)
    return next
  })

  const pageData = hspData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <ListPageShell
      title="HSP"
      actions={[
        { label: 'Vytvořit HSP', variant: 'primary', icon: 'plus', onClick: () => navigate('/hsp/nove') },
      ]}
      filterBar={
        <PageFilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Hledat dle názvu HSP...' }}
          groups={[
            { label: 'Stav', options: ['Aktivní', 'Neaktivní'], values: stavValues, onChange: toggleStav },
          ]}
          fields={[
            { label: 'Datum vytvoření', type: 'date', value: fDatumVytvoreni, onChange: setFDatumVytvoreni },
            { label: 'Datum poslední změny', type: 'date', value: fDatumZmeny, onChange: setFDatumZmeny },
          ]}
          onClear={() => { setSearch(''); setFDatumVytvoreni(''); setFDatumZmeny(''); setStavValues(new Set()); setPage(1) }}
        />
      }
      page={page}
      totalPages={Math.ceil(hspData.length / PAGE_SIZE)}
      onPageChange={setPage}
      totalCount={hspData.length}
    >
      <DataTable cols={cols} rows={pageData as Record<string, unknown>[]} actions={['view', 'edit', 'delete']} />
    </ListPageShell>
  )
}
