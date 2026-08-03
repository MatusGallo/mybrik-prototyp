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

const PAGE_SIZE = 10

function stavPrilezitostiVariant(stav: string) {
  if (stav === 'Aktivní') return 'success' as const
  if (stav === 'Prohlídka') return 'info' as const
  return 'neutral' as const
}

const cols = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'idLeadu', label: 'ID leadu', width: 80 },
  { key: 'idNabidky', label: 'ID nabídky', width: 90 },
  { key: 'nazevNabidky', label: 'Název nabídky', width: 240, flex: true },
  { key: 'datumVytvoreni', label: 'Vytvořeno', width: 110, render: renderDatum('datumVytvoreni') },
  { key: 'datumPosledniZmeny', label: 'Upraveno', width: 110, render: renderDatum('datumPosledniZmeny') },
  { key: 'makler', label: 'Makléř', width: 220, render: renderAvatarName('makler') },
  { key: 'pobocka', label: 'Pobočka', width: 160 },
  { key: 'franchiza', label: 'Franchíza', width: 130 },
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
  { key: 'typNabidky', label: 'Typ nabídky', width: 100 },
  { key: 'typKontaktu', label: 'Typ kontaktu', width: 120, render: (r: Record<string, unknown>) => {
    const typ = String(r.typKontaktu ?? '')
    const Icon = typ === 'Telefon' ? Phone : typ === 'E-mail' ? Mail : null
    if (!typ) return null
    return <Tag label={typ} variant="neutral" size="sm" lead={Icon ? 'icon' : 'none'} icon={Icon ?? undefined} />
  }},
  { key: 'ucelKontaktu', label: 'Účel kontaktu', width: 150 },
  { key: 'stavPrilezitosti', label: 'Stav příležitosti', width: 148, render: (r: Record<string, unknown>) => {
    const stav = String(r.stavPrilezitosti ?? '')
    if (!stav) return null
    return <Tag label={stav} variant={stavPrilezitostiVariant(stav)} size="sm" />
  }},
  { key: 'stavProhlidky', label: 'Stav prohlídky', width: 150 },
  { key: 'zdroj', label: 'Zdroj', width: 160 },
]

export default function PrilezitostiPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)

  const pageData = prilezitostiData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <ListPageShell
        title="Příležitosti"
        actions={[{ label: 'Vytvořit příležitost', variant: 'primary', icon: 'plus', onClick: () => setPanelOpen(true) }]}
        filterBar={
          <PageFilterBar
            search={{ value: search, onChange: setSearch, placeholder: 'Hledat...' }}
            onClear={() => { setSearch(''); setPage(1) }}
          />
        }
        page={page}
        totalPages={Math.ceil(1186 / PAGE_SIZE)}
        onPageChange={setPage}
        totalCount={1186}
      >
        <DataTable
          cols={cols}
          rows={pageData as Record<string, unknown>[]}
          actions={[]}
          onRowClick={(row) => navigate(`/obchod/prilezitosti/${row.id}`)}
        />
      </ListPageShell>

      {panelOpen && <PrilezitostPanel onClose={() => setPanelOpen(false)} />}
    </>
  )
}
