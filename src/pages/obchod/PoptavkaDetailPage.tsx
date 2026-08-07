import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search as SearchIcon, Eye, Plus } from 'lucide-react'
import { IconButton, Breadcrumbs, LineTabGroup, TextButton, Tag, TableHeaderCell, TableCell, Avatar } from '@matusgallo/mysabds'
import { poptavkyData, prilezitostiData } from '../../data/mockObchod'
import { initials, avatarColor } from '../../utils/renderAvatarName'
import DetailParuModal, { type ParRow } from '../../components/obchod/DetailParuModal'
import NovyKlientPoptavkyPanel from '../../components/obchod/NovyKlientPoptavkyPanel'

const TABS = [
  { value: 'klienti',      label: 'Klienti' },
  { value: 'prilezitosti', label: 'Příležitosti' },
  { value: 'pary',         label: 'Páry' },
]

const fmtCena = (v: number) =>
  new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 2 }).format(v)

// ── Mock data per poptávka ───────────────────────────────────────────────────────────

interface KlientRow {
  id: number
  klient: string
  makler: string
  vytvoren: string
  posledniAktivita: string
  prilezitosti: number
  platnostDo: string
  stav: string
}

const KLIENTI_MOCK: KlientRow[] = [
  {
    id: 1, klient: 'Tomáš Čáp', makler: 'Michaela Flachsová',
    vytvoren: '16.05.2023 16:26:48', posledniAktivita: '01.06.2026 20:24:51',
    prilezitosti: 1, platnostDo: '18.05.2023 16:26', stav: 'Expirovaný',
  },
]

const PARY_MOCK: ParRow[] = [
  {
    klient: 'Tomáš Čáp', idNabidky: 20, nazev: 'Prodej bytu 2+1 se zahradou - 54.3m²',
    typ: 'byt', podtyp: '2 + 1', plocha: 54, cena: 4498000,
    vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' },
    adresa: 'Kraj Vysočina, Žďár nad Sázavou, Světnov, 166, 59102',
    tagy: ['Velmi dobrý', 'Osobní', 'Cihlová'],
    historie: [
      { nemovitost: 'Prodej bytu 2 + kk, Praha 5', posledniAktivita: '17.05.2023 13:45', vytvoreno: '16.05.2023 16:26', vytvorilUzivatel: 'Tomáš Čáp', stav: 'Aktivní' },
      { nemovitost: 'Prodej rodinného domu, Beroun', posledniAktivita: '21.07.2023 15:05', vytvoreno: '21.07.2023 15:04', vytvorilUzivatel: 'Tomáš Čáp', stav: 'Aktivní' },
    ],
    klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' },
  },
  { klient: 'Tomáš Čáp', idNabidky: 205, nazev: 'Byt 1+1, Mladá Boleslav',                              typ: 'byt', podtyp: '1 + 1',  plocha: 60, cena: 5000000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Středočeský kraj, Mladá Boleslav', tagy: ['Dobrý', 'Cihlová'], historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 639, nazev: 'Krásné Malšovice 2+1',                                 typ: 'byt', podtyp: '2 + 1',  plocha: 66, cena: 5343000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Hradec Králové, Malšovice',     tagy: ['Velmi dobrý'],         historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 753, nazev: 'náměstí Republiky 915',                                typ: 'byt', podtyp: '2 + 1',  plocha: 60, cena: 5090000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Praha, náměstí Republiky 915', tagy: ['Dobrý'],                historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 989, nazev: 'Moderní apartmán 2+KK s balkónem v Korzo Lipno',       typ: 'byt', podtyp: '2 + kk', plocha: 66, cena: 6290000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Lipno nad Vltavou',             tagy: ['Velmi dobrý'],         historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1279, nazev: '3+kk Rybářská 124, UH',                               typ: 'byt', podtyp: '3 + kk', plocha: 62, cena: 4990000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Uherské Hradiště, Rybářská 124', tagy: ['Dobrý'],                historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1354, nazev: 'Prodej bytu 3+1, Liberec, Na Skřivanech',             typ: 'byt', podtyp: '3 + 1',  plocha: 60, cena: 4490000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Liberec, Na Skřivanech',         tagy: ['Dobrý'],                historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1376, nazev: 'Prodej bytu 2+kk 48,5m2, Jaurisova 19, Praha 4 – Nusle', typ: 'byt', podtyp: '2 + kk', plocha: 48, cena: 5990000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Praha 4, Nusle, Jaurisova 19',   tagy: ['Velmi dobrý'],         historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1469, nazev: 'Prodej, Byt 2+kk, ulice Pražská třída, Kukleny - Hradec Králové', typ: 'byt', podtyp: '2 + kk', plocha: 48, cena: 7000000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Hradec Králové, Kukleny',     tagy: ['Dobrý'],                historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1493, nazev: 'Prodej novostavby 1,5+kk Kamechy',                    typ: 'byt', podtyp: '2 + kk', plocha: 49, cena: 6100000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Brno, Kamechy',                  tagy: ['Velmi dobrý'],         historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
]

// ── Sub-components ───────────────────────────────────────────────────────────────

function StavBadge({ stav }: { stav: string }) {
  const variant: 'success' | 'danger' | 'neutral' =
    stav === 'Aktivní'    ? 'success' :
    stav === 'Expirovaný' ? 'danger'  : 'neutral'
  return <Tag label={stav} variant={variant} size="sm" lead="indicator" />
}

function AvatarText({ name }: { name: string }) {
  if (!name) return <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>–</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <Avatar size="sm" initials={initials(name)} color={avatarColor(name)} />
      <span style={{ fontSize: 14, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  )
}

function SectionCard({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {title && <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>{title}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────────

export default function PoptavkaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState('klienti')
  const [novyKlientOpen, setNovyKlientOpen] = useState(false)
  const [detailParOpen, setDetailParOpen] = useState<ParRow | null>(null)

  const poptavka = poptavkyData.find(l => String(l.id) === id)
  if (!poptavka) {
    return <div style={{ padding: 24, color: 'var(--t-textSecondary)' }}>Poptávka nenalezena.</div>
  }

  const poptavkaKod = `L${poptavka.id}`
  const prilezitostiZPoptavky = prilezitostiData.filter(p => p.idPoptavky === poptavkaKod)

  return (
    <>
    <div style={{ margin: -24, background: 'var(--t-bgSecondary)', minHeight: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div style={{ background: 'var(--t-bgSecondary)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <IconButton icon={ArrowLeft} variant="ghost" size="md" onClick={() => navigate('/obchod/poptavky')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Breadcrumbs items={[
                { label: 'Poptávky', onClick: () => navigate('/obchod/poptavky') },
                { label: poptavkaKod },
              ]} />
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)' }}>
                Detail poptávky {poptavkaKod}
              </h1>
              <div style={{ alignSelf: 'flex-start' }}>
                <StavBadge stav="Aktivní" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky tabs */}
      <div style={{ position: 'sticky', top: 56, zIndex: 10, background: 'var(--t-bgSecondary)', borderBottom: '1px solid var(--t-borderPrimary)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <LineTabGroup tabs={TABS} value={tab} onChange={setTab} />
        </div>
      </div>

      {/* Body — 2 : 1 grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'flex-start' }}>

          {/* Left */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Klienti */}
            {tab === 'klienti' && (
              <SectionCard
                title="Klienti"
                action={<TextButton label="Nový klient" variant="brand" leadIcon={Plus} onClick={() => setNovyKlientOpen(true)} />}
              >
                <SimpleTable
                  cols={[
                    { key: 'id', label: 'ID', width: 60 },
                    { key: 'klient', label: 'Klient', width: 180, render: r => <AvatarText name={String(r.klient)} /> },
                    { key: 'makler', label: 'Makléř', width: 200, render: r => <AvatarText name={String(r.makler)} /> },
                    { key: 'vytvoren', label: 'Vytvořen', width: 170 },
                    { key: 'posledniAktivita', label: 'Poslední aktivita', width: 170 },
                    { key: 'prilezitosti', label: 'Příležitostí', width: 110, align: 'right' },
                    { key: 'platnostDo', label: 'Platnost do', width: 160 },
                    { key: 'stav', label: 'Stav', width: 130, render: r => <StavBadge stav={String(r.stav)} /> },
                  ]}
                  rows={KLIENTI_MOCK as unknown as Record<string, unknown>[]}
                  rowActions={[
                    { icon: SearchIcon, tooltip: 'Detail' },
                    { icon: Eye,        tooltip: 'Zobrazit' },
                  ]}
                />
              </SectionCard>
            )}

            {/* Příležitosti */}
            {tab === 'prilezitosti' && (
              <SectionCard title={undefined}>
                {prilezitostiZPoptavky.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--t-textSecondary)' }}>K této poptávce zatím nejsou žádné příležitosti.</div>
                ) : (
                  <SimpleTable
                    cols={[
                      { key: 'id', label: 'ID', width: 70 },
                      { key: 'klient',     label: 'Klient',     width: 180, render: r => <AvatarText name={String(r.klient).split('\n')[0]} /> },
                      { key: 'idNabidky',  label: 'ID nabídky', width: 100 },
                      { key: 'nazevNabidky', label: 'Název',    width: 280, flex: true },
                      { key: 'typNabidky', label: 'Typ',        width: 90 },
                      { key: 'podtyp',     label: 'Podtyp',     width: 90, render: () => <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>2 + kk</span> },
                      { key: 'plocha',     label: 'Plocha',     width: 80,  align: 'right', render: () => <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>55</span> },
                      { key: 'cena',       label: 'Cena',       width: 140, align: 'right', render: () => <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>{fmtCena(5490000)}</span> },
                      { key: 'datumPosledniZmeny', label: 'Poslední aktivita', width: 160 },
                      { key: 'stavPrilezitosti', label: 'Stav', width: 110, render: r => <Tag label={String(r.stavPrilezitosti)} variant="success" size="sm" lead="indicator" /> },
                    ]}
                    rows={prilezitostiZPoptavky as unknown as Record<string, unknown>[]}
                    onRowClick={(row) => window.open(`/obchod/prilezitosti/${row.id}`, '_blank')}
                  />
                )}
              </SectionCard>
            )}

            {/* Páry */}
            {tab === 'pary' && (
              <SectionCard title={undefined}>
                <SimpleTable
                  cols={[
                    { key: 'klient',    label: 'Klient',     width: 160, render: r => <AvatarText name={String(r.klient)} /> },
                    { key: 'idNabidky', label: 'ID nabídky', width: 100 },
                    { key: 'nazev',     label: 'Název',      width: 360, flex: true },
                    { key: 'typ',       label: 'Typ',        width: 80 },
                    { key: 'podtyp',    label: 'Podtyp',     width: 90 },
                    { key: 'plocha',    label: 'Plocha',     width: 80,  align: 'right' },
                    { key: 'cena',      label: 'Cena',       width: 140, align: 'right', format: (v) => fmtCena(v as number) },
                  ]}
                  rows={PARY_MOCK as unknown as Record<string, unknown>[]}
                  onRowClick={(row) => setDetailParOpen(row as unknown as ParRow)}
                />
              </SectionCard>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ width: '100%', background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SideSection title="Informace o nemovitosti" first>
              <SidebarRow label="Typ obchodu" value={poptavka.typPoptavky} />
              <SidebarRow label="Type nemovitosti" value={poptavka.typNemovitosti} />
              <SidebarRow label="Podtyp" value={poptavka.podtyp || ''} />
              <SidebarRow label="Užitná plocha" value={poptavka.plochaOd || poptavka.plochaDo ? `${poptavka.plochaOd} - ${poptavka.plochaDo} m²` : ''} />
              <SidebarRow label="Cena" value={`${fmtCena(poptavka.cenaOd)} - ${fmtCena(poptavka.cenaDo)}`} />
              <SidebarRow label="Lokalita" value="" />
            </SideSection>

            <SideSection title="Status poptávky">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 24 }}>
                <span style={{ fontSize: 13, color: 'var(--t-textSecondary)', width: 140, flexShrink: 0 }}>Stav</span>
                <Tag label="Aktivní" variant="brand" size="sm" />
              </div>
              <SidebarRow label="Poslední aktivita" value={poptavka.datumVytvoreni} />
              <SidebarRow label="Vytvořeno" value={poptavka.datumVytvoreni} />
            </SideSection>

            <SideSection title="Propojené záznamy">
              <SidebarRow label="Klientů" value={poptavka.klientu} />
              <SidebarRow label="Příležitostí" value={String(poptavka.prilezitosti)} />
              <SidebarRow label="Spolupráce" value={poptavka.spoluprace} />
            </SideSection>
          </div>

        </div>
      </div>
    </div>

    {novyKlientOpen && <NovyKlientPoptavkyPanel onClose={() => setNovyKlientOpen(false)} />}
    {detailParOpen && <DetailParuModal par={detailParOpen} onClose={() => setDetailParOpen(null)} />}
    </>
  )
}

function SideSection({ title, children, first }: { title: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{ paddingTop: first ? 0 : 12, borderTop: first ? undefined : '1px solid var(--t-borderPrimary)' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t-textPrimary)', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: 24, gap: 12, fontSize: 13 }}>
      <span style={{ color: 'var(--t-textSecondary)', width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--t-textPrimary)', fontWeight: 500, flex: 1, wordBreak: 'break-all' }}>{value || '—'}</span>
    </div>
  )
}

// ── Minimal inline table (uses design system TableHeaderCell + TableCell) ──────

interface SimpleColDef {
  key: string
  label: string
  width?: number
  flex?: boolean
  align?: 'left' | 'right'
  render?: (row: Record<string, unknown>) => React.ReactNode
  format?: (value: unknown) => string
}

interface RowAction {
  icon: typeof SearchIcon
  tooltip?: string
  onClick?: (row: Record<string, unknown>) => void
}

function SimpleTable({ cols, rows, rowActions, onRowClick }: { cols: SimpleColDef[]; rows: Record<string, unknown>[]; rowActions?: RowAction[]; onRowClick?: (row: Record<string, unknown>) => void }) {
  const actionsWidth = rowActions ? rowActions.length * 40 + (rowActions.length - 1) * 2 + 32 : 0
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: cols.reduce((s, c) => s + (c.width ?? 0), 0) + actionsWidth }}>
        {/* Header */}
        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', background: 'var(--t-bgSecondary)' }}>
          {cols.map(c => (
            <div key={c.key} className={c.align === 'right' ? 'th-right' : undefined} style={{ flex: c.flex ? 1 : 'none', minWidth: c.flex ? c.width : undefined, pointerEvents: 'none' }}>
              <TableHeaderCell label={c.label} width={c.flex ? '100%' : c.width} />
            </div>
          ))}
          {rowActions && <div style={{ width: actionsWidth, flexShrink: 0 }} />}
        </div>

        {/* Rows */}
        {rows.map((row, ri) => {
          const hovered = hoveredRow === ri
          return (
            <div
              key={ri}
              style={{ display: 'flex', cursor: onRowClick ? 'pointer' : 'default' }}
              onMouseEnter={() => setHoveredRow(ri)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => onRowClick?.(row)}
            >
              {cols.map(c => {
                const label = c.format ? c.format(row[c.key]) : (c.render ? undefined : String(row[c.key] ?? '–'))
                const content = !c.format && c.render ? c.render(row) : undefined
                return c.flex ? (
                  <div key={c.key} style={{ flex: 1, minWidth: c.width, display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 16, borderBottom: '1px solid var(--t-borderPrimary)', background: hovered ? 'var(--t-bgHover)' : undefined, transition: 'background 150ms' }}>
                    {content ?? <span style={{ fontSize: 14, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
                  </div>
                ) : (
                  <TableCell
                    key={c.key}
                    size="spacious"
                    width={c.width}
                    hovered={hovered}
                    borderBottom
                    label={label}
                    content={content ? <div style={{ overflow: 'hidden', minWidth: 0, width: (c.width ?? 0) - 32 }}>{content}</div> : undefined}
                    align={c.align === 'right' ? 'right' : 'left'}
                  />
                )
              })}
              {rowActions && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{ width: actionsWidth, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, paddingRight: 16, borderBottom: '1px solid var(--t-borderPrimary)', background: hovered ? 'var(--t-bgHover)' : undefined, transition: 'background 150ms' }}
                >
                  {rowActions.map((a, i) => (
                    <IconButton key={i} icon={a.icon} variant="ghost" size="md" tooltip={a.tooltip} onClick={() => a.onClick?.(row)} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

