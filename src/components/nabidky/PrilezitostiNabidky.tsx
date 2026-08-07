import { useNavigate } from 'react-router-dom'
import { Plus, ArrowUpRight, Phone, Mail } from 'lucide-react'
import { Avatar, Tag, TextButton, PillTabGroup } from '@matusgallo/mysabds'
import DataTable from '../shared/DataTable'
import { renderAvatarName, initials, avatarColor } from '../../utils/renderAvatarName'
import { renderDatum } from '../../utils/tableRenders'
import { prilezitostiData, stavPrilezitostiVariant } from '../../data/mockObchod'

// ── Data ──────────────────────────────────────────────────────────────────────
// Prototyp: páry i příležitosti navázané na nabídku bereme z mocku obchodu, aby
// proklik na jejich detail fungoval. ID odpovídají záznamům v mockObchod.

export type ParStav = 'Nezpracováno' | 'Odesláno' | 'Zamítnuto'

export interface NabidkaParRow {
  poptavkaId: number
  klient: string
  sparovano: string
  stav: ParStav
}

export const NABIDKA_PARY: NabidkaParRow[] = [
  { poptavkaId: 3,  klient: 'Linda Kukačková', sparovano: '14.10.2025', stav: 'Odesláno' },
  { poptavkaId: 7,  klient: 'Petra Novotná',   sparovano: '14.10.2025', stav: 'Nezpracováno' },
  { poptavkaId: 11, klient: 'Tomáš Čáp',       sparovano: '14.10.2025', stav: 'Odesláno' },
]

const PRILEZITOSTI_IDS = ['P6', 'P8', 'P45', 'P512', 'P514', 'P517', 'P520', 'P523', 'P526']

export const NABIDKA_PRILEZITOSTI = prilezitostiData.filter(p => PRILEZITOSTI_IDS.includes(p.id))

/** „DD.MM.YYYY HH:mm“ → řaditelný klíč „YYYYMMDDHHmm“. */
function czTsKey(s: string): string {
  const [datum, cas = ''] = s.split(' ')
  const [dd = '', mm = '', yyyy = ''] = datum.split('.')
  return yyyy + mm + dd + cas.replace(':', '')
}

/** Příležitost s nejnovější aktivitou - pro souhrnný widget na přehledu nabídky. */
export const PRILEZITOST_POSLEDNI = [...NABIDKA_PRILEZITOSTI]
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

// Telefon a e-mail pod sebou, každý s vlastní ikonou — do 64px řádky se vejdou oba.
function KontaktCell({ telefon, email }: { telefon: string; email: string }) {
  if (!telefon && !email) return <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>–</span>
  const line = {
    display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
    fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)',
  } as const
  const text = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const
  const icon = { color: 'var(--t-textSecondary)', flexShrink: 0 } as const
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      {telefon && (
        <span style={line}>
          <Phone size={14} style={icon} />
          <span style={text}>{telefon}</span>
        </span>
      )}
      {email && (
        <span style={line}>
          <Mail size={14} style={icon} />
          <span style={text}>{email}</span>
        </span>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export type PrilezitostiSubTab = 'prilezitosti' | 'pary'

interface Props {
  subTab: PrilezitostiSubTab
  onSubTabChange: (t: PrilezitostiSubTab) => void
  onNovaPrilezitost: () => void
}

export default function PrilezitostiNabidky({ subTab, onSubTabChange, onNovaPrilezitost }: Props) {
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
          onChange={v => onSubTabChange(v as PrilezitostiSubTab)}
          tabs={[
            { value: 'prilezitosti', label: 'Příležitosti',      badge: NABIDKA_PRILEZITOSTI.length },
            { value: 'pary',     label: 'Poptávky (páry)',  badge: NABIDKA_PARY.length },
          ]}
        />
        <TextButton label="Vytvořit příležitost" variant="brand" leadIcon={Plus} onClick={onNovaPrilezitost} />
      </div>

      {/* Příležitosti ke konkrétní nabídce — přehledný výpis příležitostí.
          Detail příležitosti se otevírá v novém panelu, aby uživatel neztratil nabídku. */}
      {subTab === 'prilezitosti' && (
        <DataTable
          cols={[
            { key: 'id', label: 'ID', width: 80 },
            // Jméno se táhne na dostupnou šířku, ostatní sloupce mají pevnou
            { key: 'klient', label: 'Jméno klienta', width: 240, flex: true, render: r => <KlientCell jmeno={klientParts(r.klient).jmeno} /> },
            // Telefon a e-mail drží jeden sloupec — na řádce se čtou jako jeden údaj o klientovi
            { key: 'kontakt', label: 'Kontakt', width: 280, render: r => {
              const { telefon, email } = klientParts(r.klient)
              return <KontaktCell telefon={telefon} email={email} />
            } },
            { key: 'posledniKontakt', label: 'Poslední kontakt', width: 150, render: renderDatum('posledniKontakt') },
            { key: 'stavPrilezitosti', label: 'Aktuální stav', width: 190, render: r => (
              <Tag label={String(r.stavPrilezitosti)} variant={stavPrilezitostiVariant(String(r.stavPrilezitosti))} size="sm" lead="indicator" />
            ) },
            { key: 'detail', label: '', width: 110, render: r => (
              <TextButton
                label="Detail"
                variant="brand"
                size="sm"
                tailIcon={ArrowUpRight}
                onClick={() => window.open(`/obchod/prilezitosti/${r.id}`, '_blank', 'noopener')}
              />
            ) },
          ]}
          rows={NABIDKA_PRILEZITOSTI as unknown as Record<string, unknown>[]}
          actions={[]}
          emptyTitle="K této nabídce zatím nejsou žádné příležitosti"
          emptyDescription="Vytvořte první příležitost a zobrazí se v tomto seznamu."
          emptyCta={{ label: 'Vytvořit příležitost', onClick: onNovaPrilezitost }}
        />
      )}

      {/* Poptávky spárované s nabídkou */}
      {subTab === 'pary' && (
        <DataTable
          cols={[
            { key: 'poptavkaId', label: 'ID', width: 80, format: v => `L${v}` },
            { key: 'klient', label: 'Klient', width: 240, render: renderAvatarName('klient') },
            { key: 'sparovano', label: 'Spárováno', width: 150 },
            { key: 'stav', label: 'Stav', width: 150, flex: true, render: r => (
              <Tag label={String(r.stav)} variant={parStavVariant(String(r.stav))} size="sm" lead="indicator" />
            ) },
          ]}
          rows={NABIDKA_PARY as unknown as Record<string, unknown>[]}
          actions={[]}
          onRowClick={row => navigate(`/obchod/poptavky/${row.poptavkaId}`)}
          emptyTitle="K této nabídce zatím nejsou žádné páry"
          emptyDescription="Jakmile se poptávka spáruje s touto nabídkou, uvidíte ji zde."
        />
      )}
    </div>
  )
}
