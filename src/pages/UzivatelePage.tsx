import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from '@matusgallo/mysabds'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import ListPageShell from '../components/shared/ListPageShell'
import DataTable, { type ColDef } from '../components/shared/DataTable'
import PageFilterBar from '../components/shared/PageFilterBar'
import UzivatelPanel from '../components/uzivatele/UzivatelPanel'
import type { UzivatelPanelMode, UzivatelData } from '../components/uzivatele/UzivatelPanel'
import { uzivateleData } from '../data/mockOstatni'
import { renderAvatarJmenoPodtitul } from '../utils/renderAvatarName'

const PAGE_SIZE = 50

const POBOCKA_OPTIONS = [...new Set(uzivateleData.map(u => u.pobocka))].sort((a, b) => a.localeCompare(b, 'cs'))
const HSP_OPTIONS = [...new Set(uzivateleData.map(u => u.hsp))].sort((a, b) => a.localeCompare(b, 'cs'))
const STAV_OPTIONS = ['Aktivní', 'Pozvánka odeslána', 'Neaktivní', 'Blokován']

const STAV_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
  'Aktivní': 'success',
  'Pozvánka odeslána': 'warning',
  'Neaktivní': 'neutral',
  'Blokován': 'danger',
}

const cols: ColDef[] = [
  { key: 'id', label: 'ID', width: 60, sortable: true },
  { key: 'prijmeni', label: 'Jméno a příjmení', width: 260, flex: true, sortable: true, render: renderAvatarJmenoPodtitul('titulPred', 'jmeno', 'prijmeni', 'role') },
  { key: 'telefon', label: 'Telefon', width: 160, sortable: true },
  { key: 'firemnEmail', label: 'E-mail', width: 200, sortable: true },
  { key: 'pobocka', label: 'Pobočka', width: 180, sortable: true },
  { key: 'hsp', label: 'HSP', width: 190, sortable: true, render: row => <Tag label={String(row.hsp ?? '')} size="sm" variant="neutral" /> },
  // šířka drží i nejdelší stav („Pozvánka odeslána“) na jednom řádku
  { key: 'stav', label: 'Stav', width: 190, sortable: true, render: row => (
    <Tag label={String(row.stav ?? '')} size="sm" lead="indicator" variant={STAV_VARIANT[String(row.stav)] ?? 'neutral'} />
  ) },
]

export default function UzivatelePage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [pobocka, setPobocka] = useState(new Set<string>())
  const [hsp, setHsp] = useState(new Set<string>())
  const [stav, setStav] = useState(new Set<string>())
  const [panelMode, setPanelMode] = useState<UzivatelPanelMode | null>(null)
  const [selected, setSelected] = useState<UzivatelData | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<UzivatelData | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<UzivatelData | null>(null)

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (v: string) => {
    setter(prev => { const next = new Set(prev); next.has(v) ? next.delete(v) : next.add(v); return next })
    setPage(1)
  }

  function openDetail(row: Record<string, unknown>) {
    setSelected(row as unknown as UzivatelData)
    setPanelMode('detail')
  }

  function openEdit(u?: UzivatelData) {
    setSelected(u)
    setPanelMode('edit')
  }

  const q = search.trim().toLowerCase()
  const filtered = uzivateleData.filter(u =>
    (!q || `${u.titulPred} ${u.jmeno} ${u.prijmeni} ${u.telefon} ${u.firemnEmail} ${u.osobniEmail}`.toLowerCase().includes(q)) &&
    (pobocka.size === 0 || pobocka.has(u.pobocka)) &&
    (hsp.size === 0 || hsp.has(u.hsp)) &&
    (stav.size === 0 || stav.has(u.stav))
  )

  const hasFilters = q !== '' || pobocka.size > 0 || hsp.size > 0 || stav.size > 0
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  return (
    <>
      <ListPageShell
        title="Uživatelé"
        actions={[
          { label: 'Export', variant: 'export', icon: 'download' },
          { label: 'Vytvořit uživatele', variant: 'primary', icon: 'plus', onClick: () => navigate('/uzivatele/novy') },
        ]}
        filterBar={
          <PageFilterBar
            search={{
              value: search,
              onChange: v => { setSearch(v); setPage(1) },
              placeholder: 'Hledat dle jména, telefonu, e-mailu',
            }}
            groups={[
              { label: 'Pobočka', options: POBOCKA_OPTIONS, values: pobocka, onChange: toggle(setPobocka), searchable: true },
              { label: 'HSP', options: HSP_OPTIONS, values: hsp, onChange: toggle(setHsp), searchable: true },
              { label: 'Stav', options: STAV_OPTIONS, values: stav, onChange: toggle(setStav) },
            ]}
            onClear={() => {
              setSearch('')
              setPobocka(new Set()); setHsp(new Set()); setStav(new Set())
              setPage(1)
            }}
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
          onRowClick={openDetail}
          onAction={(action, row) => {
            if (action === 'edit') openEdit(row as unknown as UzivatelData)
            if (action === 'deactivate') setDeactivateTarget(row as unknown as UzivatelData)
            if (action === 'delete') setDeleteTarget(row as unknown as UzivatelData)
          }}
        />
      </ListPageShell>

      {panelMode && (
        <UzivatelPanel
          mode={panelMode}
          uzivatel={selected}
          onClose={() => setPanelMode(null)}
          onEdit={() => openEdit(selected)}
        />
      )}

      {deactivateTarget && (
        <ConfirmDialog
          title={`Deaktivovat uživatele ${deactivateTarget.jmeno} ${deactivateTarget.prijmeni}?`}
          description="Uživatel se nebude moct přihlásit a zmizí z výběrů. Přístup mu můžete kdykoli obnovit."
          primaryLabel="Deaktivovat"
          secondaryLabel="Zrušit"
          onPrimary={() => setDeactivateTarget(null)}
          onSecondary={() => setDeactivateTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Smazat uživatele ${deleteTarget.jmeno} ${deleteTarget.prijmeni}?`}
          description="Tato akce je nevratná. Uživatel bude trvale odstraněn ze systému."
          primaryLabel="Smazat"
          secondaryLabel="Zrušit"
          destructive
          onPrimary={() => setDeleteTarget(null)}
          onSecondary={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
