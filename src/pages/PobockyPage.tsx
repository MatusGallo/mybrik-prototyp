import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ListPageShell from '../components/shared/ListPageShell'
import DataTable from '../components/shared/DataTable'
import PageFilterBar from '../components/shared/PageFilterBar'
import { Dialog, Tag } from '@matusgallo/mysabds'
import { Trash, Ban } from 'lucide-react'
import { pobockyData } from '../data/mockOstatni'
import { renderNazevPodtitul } from '../utils/tableRenders'

const PAGE_SIZE = 50

const HSP_OPTIONS = [...new Set(pobockyData.map(p => p.hsp))].sort((a, b) => a.localeCompare(b, 'cs'))
const OSOBA_OPTIONS = [...new Set(pobockyData.map(p => p.odpovednaOsoba))].sort((a, b) => a.localeCompare(b, 'cs'))
const STAV_OPTIONS = ['Aktivní', 'Připravuje se', 'Neaktivní', 'Zrušena']

const STAV_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
  'Aktivní': 'success',
  'Připravuje se': 'warning',
  'Neaktivní': 'neutral',
  'Zrušena': 'danger',
}

const cols = [
  { key: 'id', label: 'ID', width: 60, sortable: true },
  { key: 'nazev', label: 'Název pobočky', width: 240, flex: true, sortable: true, render: renderNazevPodtitul('nazev', 'adresa') },
  { key: 'hsp', label: 'HSP', width: 200, sortable: true, render: (r: Record<string, unknown>) => <Tag label={String(r.hsp ?? '')} size="sm" variant="neutral" /> },
  { key: 'odpovednaOsoba', label: 'Odpovědná osoba', width: 200, sortable: true },
  { key: 'telefon', label: 'Telefon', width: 160, sortable: true },
  { key: 'email', label: 'E-mail', width: 200, sortable: true },
  // šířka drží i nejdelší stav („Připravuje se“) na jednom řádku
  { key: 'stav', label: 'Stav', width: 160, sortable: true, render: (r: Record<string, unknown>) => <Tag label={String(r.stav ?? '')} size="sm" variant={STAV_VARIANT[String(r.stav)] ?? 'neutral'} lead="indicator" /> },
]

export default function PobockyPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [hsp, setHsp] = useState(new Set<string>())
  const [osoba, setOsoba] = useState(new Set<string>())
  const [stav, setStav] = useState(new Set<string>())
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Record<string, unknown> | null>(null)

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (v: string) => {
    setter(prev => { const next = new Set(prev); next.has(v) ? next.delete(v) : next.add(v); return next })
    setPage(1)
  }

  const q = search.trim().toLowerCase()
  const filtered = pobockyData.filter(p =>
    (!q || [p.nazev, p.hsp, p.odpovednaOsoba].some(v => v.toLowerCase().includes(q))) &&
    (hsp.size === 0 || hsp.has(p.hsp)) &&
    (osoba.size === 0 || osoba.has(p.odpovednaOsoba)) &&
    (stav.size === 0 || stav.has(p.stav))
  )

  const hasFilters = q !== '' || hsp.size > 0 || osoba.size > 0 || stav.size > 0
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  /** Detail i úprava jedou na stejné fullscreen obrazovce, jako u HSP. */
  function openEdit(id: number) {
    navigate(`/pobocky/${id}/upravit`)
  }

  return (
    <>
      <ListPageShell
        title="Pobočky"
        actions={[{
          label: 'Vytvořit pobočku', variant: 'primary', icon: 'plus',
          onClick: () => navigate('/pobocky/nova'),
        }]}
        filterBar={
          <PageFilterBar
            search={{
              value: search,
              onChange: v => { setSearch(v); setPage(1) },
              placeholder: 'Hledat dle názvu, HSP, odpovědné osoby',
            }}
            groups={[
              { label: 'HSP', options: HSP_OPTIONS, values: hsp, onChange: toggle(setHsp), searchable: true },
              { label: 'Odpovědná osoba', options: OSOBA_OPTIONS, values: osoba, onChange: toggle(setOsoba), searchable: true },
              { label: 'Stav', options: STAV_OPTIONS, values: stav, onChange: toggle(setStav) },
            ]}
            onClear={() => { setSearch(''); setHsp(new Set()); setOsoba(new Set()); setStav(new Set()); setPage(1) }}
          />
        }
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalCount={filtered.length}
      >
        <DataTable
          cols={cols}
          rows={pageData as unknown as Record<string, unknown>[]}
          actions={['edit', 'deactivate', 'delete']}
          emptyVariant={hasFilters ? 'search' : 'default'}
          onRowClick={row => openEdit(Number(row.id))}
          onAction={(action, row) => {
            if (action === 'edit') openEdit(Number(row.id))
            if (action === 'deactivate') setDeactivateTarget(row)
            if (action === 'delete') setDeleteTarget(row)
          }}
        />
      </ListPageShell>

      {deactivateTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(16, 26, 35, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Dialog
            icon={Ban}
            title="Deaktivovat pobočku"
            description={<>Opravdu si přejete deaktivovat pobočku <strong>{String(deactivateTarget.nazev ?? '')}</strong>? Pobočka zůstane v seznamu, ale přestane se nabízet při zakládání záznamů.</>}
            primaryLabel="Deaktivovat"
            secondaryLabel="Zrušit"
            onPrimary={() => setDeactivateTarget(null)}
            onSecondary={() => setDeactivateTarget(null)}
          />
        </div>
      )}

      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(16, 26, 35, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Dialog
            icon={Trash}
            destructive
            title="Smazat pobočku"
            description={<>Opravdu si přejete smazat pobočku <strong>{String(deleteTarget.nazev ?? '')}</strong>? Tuto akci nelze vrátit zpět.</>}
            primaryLabel="Smazat"
            secondaryLabel="Zrušit"
            onPrimary={() => setDeleteTarget(null)}
            onSecondary={() => setDeleteTarget(null)}
          />
        </div>
      )}
    </>
  )
}
