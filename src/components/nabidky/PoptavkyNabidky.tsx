import { useNavigate } from 'react-router-dom'
import { Plus, ArrowUpRight } from 'lucide-react'
import { Avatar, Tag, TextButton, PillTabGroup } from '@matusgallo/mysabds'
import DataTable from '../shared/DataTable'
import { renderAvatarName, initials, avatarColor } from '../../utils/renderAvatarName'
import { poptavkyData } from '../../data/mockObchod'

// ── Data ──────────────────────────────────────────────────────────────────────
// Prototyp: páry i poptávky navázané na nabídku bereme z mocku obchodu, aby
// proklik na jejich detail fungoval. ID odpovídají záznamům v mockObchod.

export type ParStav = 'Nezpracováno' | 'Odesláno' | 'Zamítnuto'

export interface NabidkaParRow {
  leadId: number
  klient: string
  sparovano: string
  stav: ParStav
}

export const NABIDKA_PARY: NabidkaParRow[] = [
  { leadId: 3,  klient: 'Linda Kukačková', sparovano: '14.10.2025', stav: 'Odesláno' },
  { leadId: 7,  klient: 'Petra Novotná',   sparovano: '14.10.2025', stav: 'Nezpracováno' },
  { leadId: 11, klient: 'Tomáš Čáp',       sparovano: '14.10.2025', stav: 'Odesláno' },
]

const POPTAVKY_IDS = ['P6', 'P8', 'P45']

export const NABIDKA_POPTAVKY = poptavkyData.filter(p => POPTAVKY_IDS.includes(p.id))

/** „DD.MM.YYYY HH:mm“ → řaditelný klíč „YYYYMMDDHHmm“. */
function czTsKey(s: string): string {
  const [datum, cas = ''] = s.split(' ')
  const [dd = '', mm = '', yyyy = ''] = datum.split('.')
  return yyyy + mm + dd + cas.replace(':', '')
}

/** Poptávka s nejnovější aktivitou - pro souhrnný widget na přehledu nabídky. */
export const POPTAVKA_POSLEDNI = [...NABIDKA_POPTAVKY]
  .sort((a, b) => czTsKey(b.datumPosledniZmeny).localeCompare(czTsKey(a.datumPosledniZmeny)))[0]

// Klient je v mocku uložený jako „jméno / e-mail / telefon“ na třech řádcích.
function klientParts(value: unknown): { jmeno: string; email: string; telefon: string } {
  const [jmeno = '', email = '', telefon = ''] = String(value ?? '').split('\n')
  return { jmeno, email, telefon }
}

function parStavVariant(stav: string): 'danger' | 'success' | 'neutral' {
  if (stav === 'Nezpracováno') return 'danger'
  if (stav === 'Odesláno') return 'success'
  return 'neutral'
}

function poptavkaStavVariant(stav: string): 'success' | 'info' | 'neutral' {
  if (stav === 'Aktivní') return 'success'
  if (stav === 'Prohlídka') return 'info'
  return 'neutral'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KlientCell({ jmeno }: { jmeno: string }) {
  if (!jmeno) return <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>–</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <Avatar size="sm" initials={initials(jmeno)} color={avatarColor(jmeno)} />
      <span style={{
        fontSize: 14, color: 'var(--t-textPrimary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {jmeno}
      </span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export type PoptavkySubTab = 'poptavky' | 'pary'

interface Props {
  subTab: PoptavkySubTab
  onSubTabChange: (t: PoptavkySubTab) => void
  onNovaPoptavka: () => void
}

export default function PoptavkyNabidky({ subTab, onSubTabChange, onNovaPoptavka }: Props) {
  const navigate = useNavigate()

  return (
    <div style={{
      background: 'var(--t-bgPrimary)',
      border: '1px solid var(--t-borderPrimary)',
      borderRadius: 12,
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Přepínač pohledu + primární akce */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <PillTabGroup
          size="md"
          value={subTab}
          onChange={v => onSubTabChange(v as PoptavkySubTab)}
          tabs={[
            { value: 'poptavky', label: 'Poptávky',      badge: NABIDKA_POPTAVKY.length },
            { value: 'pary',     label: 'Leady (páry)',  badge: NABIDKA_PARY.length },
          ]}
        />
        <TextButton label="Vytvořit poptávku" variant="brand" leadIcon={Plus} onClick={onNovaPoptavka} />
      </div>

      {/* Poptávky ke konkrétní nabídce — přehledný výpis příležitostí.
          Detail poptávky se otevírá v novém panelu, aby uživatel neztratil nabídku. */}
      {subTab === 'poptavky' && (
        <DataTable
          cols={[
            { key: 'id', label: 'ID', width: 80 },
            // Jméno se táhne na dostupnou šířku, ostatní sloupce mají pevnou
            { key: 'klient', label: 'Jméno poptávajícího', width: 240, flex: true, render: r => <KlientCell jmeno={klientParts(r.klient).jmeno} /> },
            { key: 'telefon', label: 'Telefon', width: 150, render: r => (
              <span style={{ fontSize: 14, color: 'var(--t-textPrimary)', whiteSpace: 'nowrap' }}>
                {klientParts(r.klient).telefon || '–'}
              </span>
            ) },
            { key: 'email', label: 'Mail', width: 260, render: r => {
              const email = klientParts(r.klient).email
              if (!email) return <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>–</span>
              return (
                <span style={{
                  fontSize: 14, color: 'var(--t-textPrimary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {email}
                </span>
              )
            } },
            { key: 'stavPoptavky', label: 'Aktuální stav', width: 140, render: r => (
              <Tag label={String(r.stavPoptavky)} variant={poptavkaStavVariant(String(r.stavPoptavky))} size="sm" lead="indicator" />
            ) },
            { key: 'detail', label: '', width: 180, render: r => (
              <TextButton
                label="Detail poptávky"
                variant="brand"
                size="sm"
                tailIcon={ArrowUpRight}
                onClick={() => window.open(`/obchod/poptavky/${r.id}`, '_blank', 'noopener')}
              />
            ) },
          ]}
          rows={NABIDKA_POPTAVKY as unknown as Record<string, unknown>[]}
          actions={[]}
          emptyTitle="K této nabídce zatím nejsou žádné poptávky"
          emptyDescription="Vytvořte první poptávku a zobrazí se v tomto seznamu."
          emptyCta={{ label: 'Vytvořit poptávku', onClick: onNovaPoptavka }}
        />
      )}

      {/* Leady spárované s nabídkou */}
      {subTab === 'pary' && (
        <DataTable
          cols={[
            { key: 'leadId', label: 'ID', width: 80, format: v => `L${v}` },
            { key: 'klient', label: 'Klient', width: 240, render: renderAvatarName('klient') },
            { key: 'sparovano', label: 'Spárováno', width: 150 },
            { key: 'stav', label: 'Stav', width: 150, flex: true, render: r => (
              <Tag label={String(r.stav)} variant={parStavVariant(String(r.stav))} size="sm" lead="indicator" />
            ) },
          ]}
          rows={NABIDKA_PARY as unknown as Record<string, unknown>[]}
          actions={[]}
          onRowClick={row => navigate(`/obchod/lead/${row.leadId}`)}
          emptyTitle="K této nabídce zatím nejsou žádné páry"
          emptyDescription="Jakmile se lead spáruje s touto nabídkou, uvidíte ho zde."
        />
      )}
    </div>
  )
}
