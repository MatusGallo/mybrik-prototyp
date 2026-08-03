import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Eye, MessageCircle, Phone, CheckSquare, FileText,
  Bell, Copy, Pencil, Trash, Plus, User, ArrowUpRight, Mail, type LucideIcon,
} from 'lucide-react'
import { IconButton, LineTabGroup, TextButton, Tooltip, Tag, TableHeaderCell, TableCell, Avatar, Dialog } from '@matusgallo/mysabds'
import { prilezitostiData } from '../../data/mockObchod'
import NovyUkolModal from '../../components/obchod/NovyUkolModal'
import ZapsatKomunikaceModal from '../../components/obchod/ZapsatKomunikaceModal'
import NovyProhlidkaModal from '../../components/obchod/NovyProhlidkaModal'
import ZmenitMaklereModal from '../../components/obchod/ZmenitMaklereModal'
import ProhlidkaDetailModal from '../../components/obchod/ProhlidkaDetailModal'
import ZapsatVysledekModal from '../../components/obchod/ZapsatVysledekModal'
import UkolDetailModal from '../../components/obchod/UkolDetailModal'

// ── Mock detail data ────────────────────────────────────────────────────────────

const PROHLIDKY = [
  {
    id: 1, mesic: 'Prosinec', den: '29', cas: '12:00',
    doplnujiciInfo: '',
    adresa: 'Středočeský kraj, Mladá Boleslav, Mladá Boleslav I, Pražská brána 4/4, 29301',
    stav: 'Zrušena',
    resitel: '',
    termin: '29.12.2023',
    delka: '30 min',
    posledniAktivita: '25.05.2026 13:19',
  },
  {
    id: 2, mesic: 'Červenec', den: '31', cas: '15:00',
    doplnujiciInfo: 'Dobrý den, posílám pozvánku na prohlídku. Díky',
    adresa: 'Středočeský kraj, Mladá Boleslav, Mladá Boleslav I, Pražská brána 4/4, 29301',
    stav: 'Zrušena',
    resitel: 'Michaela Flachsová',
    termin: '31.07.2025',
    delka: '60 min',
    posledniAktivita: '20.08.2025 15:19',
  },
  {
    id: 3, mesic: 'Srpen', den: '24', cas: '13:00',
    doplnujiciInfo: 'Ahoj, potkáme se na Suttnerové 814/17, těším se.',
    adresa: 'Středočeský kraj, Mladá Boleslav, Mladá Boleslav I, Pražská brána 4/4, 29301',
    stav: 'Čeká na výsledek',
    resitel: 'Michaela Flachsová',
    termin: '24.08.2025',
    delka: '60 min',
    posledniAktivita: '20.08.2025 15:19',
  },
]

const UKOLY = [
  {
    id: 1, datum: '14.10.', cas: '12:00',
    nazev: 'Zapsat výsledek prohlídky z 24.08.2025 13:00',
    priorita: 'nenastavena', makler: 'Michaela\nFlachsová', stav: 'Zrušen', pripomenutiDatum: '',
  },
  {
    id: 2, datum: '07.05.', cas: '12:00',
    nazev: 'test',
    priorita: 'nenastavena', makler: 'Michaela\nFlachsová', stav: 'Po termínu', pripomenutiDatum: '',
  },
  {
    id: 3, datum: '22.05.', cas: '12:00',
    nazev: 'dgdfgd',
    priorita: 'nenastavena', makler: 'Michaela\nFlachsová', stav: 'Po termínu', pripomenutiDatum: '',
  },
  {
    id: 4, datum: '27.06.', cas: '12:00',
    nazev: 'V termínu',
    priorita: '', makler: 'Michaela\nFlachsová', stav: 'Aktivní', pripomenutiDatum: '29.05.2026 00:00',
  },
]

const KOMUNIKACE_ITEMS = [
  {
    id: 1, typ: 'telefon',
    title: 'Telefonický hovor – zájem o nemovitost',
    poznamka: 'Klient projevil zájem o prohlídku. Domluvena schůzka na příští týden. Preferuje odpolední termín.',
    autor: 'Michaela Flachsová', datum: '05.03.2024 12:46',
  },
  {
    id: 2, typ: 'email',
    title: 'Potvrzení termínu prohlídky',
    poznamka: 'Zaslán email s potvrzením termínu na 24.08.2025 13:00. Klient odpověděl kladně.',
    autor: 'Matúš Gallo', datum: '20.08.2025 15:19',
  },
]

const TYP_MAP: Record<string, { icon: LucideIcon; label: string }> = {
  telefon: { icon: Phone,          label: 'Telefon' },
  email:   { icon: Mail,           label: 'E-mail' },
  sms:     { icon: MessageCircle,  label: 'SMS' },
}

const HISTORIE_ITEMS = [
  { datum: '25.05.2026 13:46', udalost: 'Prohlídka upravena 25.05.2026 12:00', autor: 'Matúš Gallo' },
  { datum: '25.05.2026 13:19', udalost: 'Odeslána sms', autor: 'Matúš Gallo' },
  { datum: '25.05.2026 13:19', udalost: 'Naplánovaná prohlídka na 25.05.2026 12:00:00', autor: 'Matúš Gallo' },
  { datum: '25.05.2026 13:19', udalost: 'Prohlídka upravena 24.08.2025 13:00', autor: 'Matúš Gallo' },
  { datum: '25.05.2026 13:19', udalost: 'Prohlídka upravena 31.07.2025 15:00', autor: 'Matúš Gallo' },
  { datum: '25.05.2026 13:19', udalost: 'Prohlídka upravena 29.12.2023 12:00', autor: 'Matúš Gallo' },
  { datum: '25.05.2026 13:03', udalost: 'Upraven úkol – Zapsat výsledek prohlídky z 24.08.2025 13:00', autor: 'Matúš Gallo' },
  { datum: '14.10.2025 09:56', udalost: 'Vytvořen nový úkol – Zapsat výsledek prohlídky z 24.08.2025 13:00', autor: 'The God' },
  { datum: '20.08.2025 15:19', udalost: 'Odeslána sms', autor: 'Michaela Flachsová' },
  { datum: '20.08.2025 15:19', udalost: 'Odeslán email', autor: 'Michaela Flachsová' },
  { datum: '20.08.2025 15:19', udalost: 'Naplánovaná prohlídka na 24.08.2025 13:00:00', autor: 'Michaela Flachsová' },
  { datum: '20.08.2025 15:18', udalost: 'Prohlídka upravena 31.07.2025 15:00', autor: 'Michaela Flachsová' },
  { datum: '31.07.2025 09:15', udalost: 'Odeslána sms', autor: 'Michaela Flachsová' },
  { datum: '31.07.2025 09:15', udalost: 'Odeslán email', autor: 'Michaela Flachsová' },
  { datum: '31.07.2025 09:15', udalost: 'Naplánovaná prohlídka na 31.07.2025 15:00:00', autor: 'Michaela Flachsová' },
  { datum: '31.07.2025 09:14', udalost: 'Prohlídka upravena 29.12.2023 12:00', autor: 'Michaela Flachsová' },
  { datum: '31.07.2025 09:11', udalost: 'Odeslána sms', autor: 'Michaela Flachsová' },
  { datum: '28.07.2025 20:32', udalost: 'Odeslána sms', autor: 'Michaela Flachsová' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────────

const MONTH_NUM_FULL: Record<string, string> = {
  '1': 'Leden', '2': 'Únor', '3': 'Březen', '4': 'Duben', '5': 'Květen', '6': 'Červen',
  '7': 'Červenec', '8': 'Srpen', '9': 'Září', '10': 'Říjen', '11': 'Listopad', '12': 'Prosinec',
}

const MONTH_ABBR: Record<string, string> = {
  'Leden': 'Led', 'Únor': 'Úno', 'Březen': 'Bře', 'Duben': 'Dub',
  'Květen': 'Kvě', 'Červen': 'Čvn', 'Červenec': 'Čvc', 'Srpen': 'Srp',
  'Září': 'Zář', 'Říjen': 'Říj', 'Listopad': 'Lis', 'Prosinec': 'Pro',
}

type BadgeVariant = 'neutral' | 'outline' | 'invert' | 'brand' | 'info' | 'success' | 'warning' | 'danger'

function stavPrilezitostiVariant(stav: string): BadgeVariant {
  if (stav === 'Aktivní') return 'success'
  if (stav === 'Prohlídka') return 'info'
  return 'neutral'
}

function stavVariant(stav: string): BadgeVariant {
  if (stav === 'Zrušena') return 'danger'
  if (stav === 'Čeká na výsledek') return 'warning'
  if (stav === 'Má zájem') return 'success'
  return 'neutral'
}

function ukolStavVariant(stav: string): BadgeVariant {
  if (stav === 'Po termínu' || stav === 'Zrušen') return 'danger'
  if (stav === 'Aktivní') return 'success'
  return 'neutral'
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLOR_KEYS = ['purple', 'blue', 'orange', 'green', 'teal', 'red', 'pink', 'dark'] as const
function getAvatarColor(name: string): typeof AVATAR_COLOR_KEYS[number] {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLOR_KEYS[hash % AVATAR_COLOR_KEYS.length]
}

// ── Sub-components ───────────────────────────────────────────────────────────────

const SECTION_HEADING: React.CSSProperties = {
  fontSize: 16, fontWeight: 600,
  color: 'var(--t-textPrimary)',
  marginBottom: 8,
}

const KV_ROW: React.CSSProperties = {
  display: 'flex', gap: 12, fontSize: 13,
  height: 24, alignItems: 'center',
}
const KV_LABEL: React.CSSProperties = { color: 'var(--t-textSecondary)', width: 100, flexShrink: 0 }
const KV_VALUE: React.CSSProperties = { color: 'var(--t-textPrimary)', fontWeight: 500, flex: 1, wordBreak: 'break-all' }

function DateBadge({ month, day, time }: { month: string; day: string; time: string }) {
  return (
    <div style={{
      borderRadius: 6,
      outline: '1px solid var(--t-borderPrimary)',
      outlineOffset: -1,
      display: 'inline-flex',
      flexDirection: 'column',
      flexShrink: 0,
      width: 68,
      alignSelf: 'flex-start',
      overflow: 'hidden',
      background: 'var(--t-bgPrimary)',
    }}>
      <div style={{
        padding: '2px 8px',
        background: 'var(--t-bgTertiary)',
        outline: '1px solid var(--t-borderPrimary)',
        outlineOffset: -1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}>
        <span style={{
          color: 'var(--t-textSecondary)',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          lineHeight: '12px',
          letterSpacing: '0.11px',
        }}>
          {month}
        </span>
      </div>
      <div style={{
        height: 48,
        padding: '0 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          color: 'var(--t-textSecondary)',
          fontSize: 14,
          fontWeight: 500,
          lineHeight: '20px',
        }}>
          {day}
        </span>
        <span style={{
          color: 'var(--t-textSecondary)',
          fontSize: 12,
          lineHeight: '16px',
          whiteSpace: 'nowrap',
        }}>
          {time}
        </span>
      </div>
    </div>
  )
}

function SideSection({ title, children, first }: { title: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div style={{ paddingTop: first ? 0 : 12, borderTop: first ? undefined : '1px solid var(--t-borderPrimary)' }}>
      <div style={SECTION_HEADING}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function KVRow({ label, value, orange, copyable }: { label: string; value: string; orange?: boolean; copyable?: boolean }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={KV_ROW}>
      <span style={KV_LABEL}>{label}</span>
      <span style={{ ...KV_VALUE, color: orange ? 'var(--t-textMyDOCKPrimary)' : KV_VALUE.color, display: 'flex', alignItems: 'center', gap: 4 }}>
        {value}
        {copyable && (
          <div style={{ borderRadius: 6, background: copied ? 'var(--t-bgHover)' : 'transparent', flexShrink: 0 }}>
            <IconButton
              icon={Copy}
              variant="ghost"
              size="sm"
              tooltip={copied ? 'Zkopírováno' : 'Zkopírovat'}
              onClick={handleCopy}
            />
          </div>
        )}
      </span>
    </div>
  )
}

function ProhlidkaRow({ p }: { p: typeof PROHLIDKY[0]; isLast?: boolean }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [vysledekOpen, setVysledekOpen] = useState(false)
  return (
    <div style={{ display: 'flex', gap: 16, padding: 12, background: 'var(--t-bgSecondary)', borderRadius: 8 }}>
      {/* Date badge */}
      <DateBadge month={MONTH_ABBR[p.mesic] ?? p.mesic.slice(0, 3)} day={p.den} time={p.cas} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ alignSelf: 'flex-start' }}>
          <Tag label={p.stav} variant={stavVariant(p.stav)} size="sm" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-textSecondary)', lineHeight: '16px', letterSpacing: '0.12px' }}>Adresa</span>
            <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{p.adresa}</p>
          </div>
          {p.doplnujiciInfo && (
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-textSecondary)', lineHeight: '16px', letterSpacing: '0.12px' }}>Doplňující informace</span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{p.doplnujiciInfo}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <TextButton label="Změnit výsledek" variant="brand" onClick={() => setVysledekOpen(true)} />
            <TextButton label="Detail" variant="brand" onClick={() => setDetailOpen(true)} />
          </div>
          {detailOpen && <ProhlidkaDetailModal p={p} onClose={() => setDetailOpen(false)} />}
          {vysledekOpen && <ZapsatVysledekModal onClose={() => setVysledekOpen(false)} />}
        </div>
      </div>
    </div>
  )
}

function UkolRow({ u }: { u: typeof UKOLY[0] }) {
  const datumParts = u.datum.split('.')
  const ukolDay = datumParts[0] ?? ''
  const ukolMonth = MONTH_NUM_FULL[String(parseInt(datumParts[1] ?? '0'))] ?? ''
  const zrusen = u.stav === 'Zrušen'
  const [detailOpen, setDetailOpen] = useState(false)
  const [vyresitOpen, setVyresitOpen] = useState(false)
  const [smazatOpen, setSmazatOpen] = useState(false)
  return (
    <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--t-bgSecondary)', borderRadius: 8 }}>
      <DateBadge month={MONTH_ABBR[ukolMonth] ?? ukolMonth.slice(0, 3)} day={ukolDay} time={u.cas} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Tag label={u.stav} variant={ukolStavVariant(u.stav)} size="sm" />
          <Tag label={u.pripomenutiDatum || u.priorita} variant="neutral" size="sm" lead="icon" icon={Bell} />
          <Tag label={u.makler.replace('\n', ' ')} variant="neutral" size="sm" lead="icon" icon={User} />
        </div>
        <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {u.nazev}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 2, flexShrink: 0, alignSelf: 'flex-start' }}>
        <IconButton icon={Eye} variant="ghost" size="md" onClick={() => setDetailOpen(true)} />
        {!zrusen && <IconButton icon={Pencil} variant="ghost" size="md" />}
        {!zrusen && <IconButton icon={CheckSquare} variant="ghost" size="md" onClick={() => setVyresitOpen(true)} />}
        {!zrusen && <IconButton icon={Trash} variant="ghost" size="md" onClick={() => setSmazatOpen(true)} />}
      </div>
    </div>
    {detailOpen && <UkolDetailModal u={u} onClose={() => setDetailOpen(false)} onVyresit={() => setVyresitOpen(true)} />}
    {vyresitOpen && createPortal(
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,13,18,0.4)' }} />
        <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <Dialog
              icon={CheckSquare}
              title="Vyřešit úkol?"
              description="Tuto akci nelze vrátit."
              primaryLabel="Vyřešit"
              secondaryLabel="Zrušit"
              onPrimary={() => setVyresitOpen(false)}
              onSecondary={() => setVyresitOpen(false)}
            />
          </div>
        </div>
      </>,
      document.body
    )}
    {smazatOpen && createPortal(
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,13,18,0.4)' }} />
        <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <Dialog
              icon={Trash}
              title="Smazat úkol?"
              description="Tuto akci nelze vrátit."
              primaryLabel="Smazat"
              secondaryLabel="Zrušit"
              destructive
              onPrimary={() => setSmazatOpen(false)}
              onSecondary={() => setSmazatOpen(false)}
            />
          </div>
        </div>
      </>,
      document.body
    )}
    </>
  )
}

function KomunikaceItem({ k }: { k: typeof KOMUNIKACE_ITEMS[0] }) {
  const { icon: TypIcon, label: typLabel } = TYP_MAP[k.typ] ?? { icon: MessageCircle, label: k.typ }
  return (
    <div style={{ background: 'var(--t-bgSecondary)', borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag label={typLabel} variant="neutral" size="sm" lead="icon" icon={TypIcon} />
        <Tooltip content="Vytvořil" placement="top">
          <span style={{ display: 'inline-flex' }}>
            <Tag label={k.autor} variant="neutral" size="sm" lead="icon" icon={User} />
          </span>
        </Tooltip>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--t-textSecondary)', whiteSpace: 'nowrap' }}>{k.datum}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)' }}>{k.title}</span>
        <p style={{ margin: 0, fontSize: 13, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>{k.poznamka}</p>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'prehled', label: 'Přehled' },
  { value: 'ukoly', label: 'Úkoly' },
  { value: 'komunikace', label: 'Komunikace' },
  { value: 'historie', label: 'Historie' },
]

export default function PrilezitostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState('prehled')
  const [ukolModalOpen, setUkolModalOpen] = useState(false)
  const [komunikaceModalOpen, setKomunikaceModalOpen] = useState(false)
  const [prohlidkaModalOpen, setProhlidkaModalOpen] = useState(false)
  const [zmenitMaklereOpen, setZmenitMaklereOpen] = useState(false)

  const p = prilezitostiData.find(r => r.id === id)
  if (!p) {
    return (
      <div style={{ padding: 24, color: 'var(--t-textSecondary)' }}>
        Příležitost nenalezena.
      </div>
    )
  }

  const [klientJmeno, klientEmail, klientTelefon] = p.klient.split('\n')

  return (
    <>
    <div style={{ margin: -24, background: 'var(--t-bgSecondary)', minHeight: 'calc(100vh - 56px)' }}>

      {/* Header — breadcrumbs + title */}
      <div style={{ background: 'var(--t-bgSecondary)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconButton
                icon={ArrowLeft}
                variant="ghost"
                size="md"
                onClick={() => navigate('/obchod/prilezitosti')}
              />
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)' }}>
                {p.nazevNabidky}
              </h1>
            </div>

            {/* Rychlé akce */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
              {[
                { icon: MessageCircle, label: 'Zpráva' },
                { icon: Eye, label: 'Prohlídka' },
                { icon: Phone, label: 'Komunikace' },
                { icon: CheckSquare, label: 'Úkol' },
                { icon: FileText, label: 'Poznámka' },
              ].map(({ icon: Icon, label }) => (
                <IconButton key={label} icon={Icon} variant="soft" size="lg" tooltip={label} />
              ))}
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

      {/* Body — 2 : 1 column grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'flex-start' }}>

        {/* Left — content */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Přehled */}
          {tab === 'prehled' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Naplánované prohlídky */}
              <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
                    Naplánované prohlídky
                  </span>
                  <TextButton label="Zapsat schůzku" variant="brand" leadIcon={Plus} onClick={() => setProhlidkaModalOpen(true)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PROHLIDKY.map((ph, i) => <ProhlidkaRow key={ph.id} p={ph} isLast={i === PROHLIDKY.length - 1} />)}
                </div>
              </div>

              {/* Úkoly */}
              <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
                    Úkoly
                  </span>
                  <TextButton label="Nový úkol" variant="brand" leadIcon={Plus} onClick={() => setUkolModalOpen(true)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {UKOLY.map(u => <UkolRow key={u.id} u={u} />)}
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                  <TextButton label="Zobrazit všechny úkoly" variant="brand" size="sm" onClick={() => setTab('ukoly')} />
                </div>
              </div>

              {/* Komunikace */}
              <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
                    Komunikace
                  </span>
                  <TextButton label="Zapsat komunikaci" variant="brand" leadIcon={Plus} onClick={() => setKomunikaceModalOpen(true)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {KOMUNIKACE_ITEMS.map(k => <KomunikaceItem key={k.id} k={k} />)}
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                  <TextButton label="Zobrazit veškerou komunikaci" variant="brand" size="sm" onClick={() => setTab('komunikace')} />
                </div>
              </div>

            </div>
          )}

          {/* Úkoly tab */}
          {tab === 'ukoly' && (
            <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
                  Úkoly
                </span>
                <TextButton label="Nový úkol" variant="brand" leadIcon={Plus} onClick={() => setUkolModalOpen(true)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {UKOLY.map(u => <UkolRow key={u.id} u={u} />)}
              </div>
            </div>
          )}

          {/* Komunikace tab */}
          {tab === 'komunikace' && (
            <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
                  Komunikace
                </span>
                <TextButton label="Zapsat komunikaci" variant="brand" leadIcon={Plus} onClick={() => setKomunikaceModalOpen(true)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {KOMUNIKACE_ITEMS.map(k => <KomunikaceItem key={k.id} k={k} />)}
              </div>
            </div>
          )}

          {/* Historie tab */}
          {tab === 'historie' && (
            <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, overflow: 'hidden', padding: 16 }}>
              {/* Header */}
              <div style={{ display: 'flex', background: 'var(--t-bgSecondary)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ pointerEvents: 'none' }}>
                  <TableHeaderCell label="Datum" size="dense" width={170} />
                </div>
                <div style={{ flex: 1, pointerEvents: 'none' }}>
                  <TableHeaderCell label="Událost" size="dense" width="100%" />
                </div>
                <div style={{ pointerEvents: 'none' }}>
                  <TableHeaderCell label="Autor" size="dense" width={200} />
                </div>
              </div>
              {/* Rows */}
              {HISTORIE_ITEMS.map((h, i) => {
                const isLast = i === HISTORIE_ITEMS.length - 1
                return (
                  <div key={i} style={{ display: 'flex' }}>
                    <TableCell size="dense" width={170} hovered={false} borderBottom={!isLast} label={h.datum} />
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      paddingLeft: 12, paddingRight: 12,
                      borderBottom: !isLast ? '1px solid var(--t-borderPrimary)' : undefined,
                    }}>
                      <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{h.udalost}</span>
                    </div>
                    <TableCell
                      size="dense"
                      width={200}
                      hovered={false}
                      borderBottom={!isLast}
                      content={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar initials={getInitials(h.autor)} size="sm" color={getAvatarColor(h.autor)} />
                          <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{h.autor}</span>
                        </div>
                      }
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right — Sidebar */}
        <div style={{
          width: '100%',
          background: 'var(--t-bgPrimary)',
          border: '1px solid var(--t-borderPrimary)',
          borderRadius: 12, padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Client name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)', flex: 1 }}>{klientJmeno}</span>
            <IconButton icon={Eye} variant="ghost" size="md" />
          </div>

          <SideSection title="Detail klienta" first>
            <KVRow label="Telefon" value={klientTelefon} copyable />
            <KVRow label="E-mail" value={klientEmail} copyable />
          </SideSection>

          <SideSection title="Detail makléře">
            <KVRow label="Jméno" value={p.makler} />
            <KVRow label="Telefon" value="+420774 416 649" copyable />
            <KVRow label="E-mail" value="beta_flachsovamichaela@sabservis.cz" copyable />
            <TextButton label="Změnit makléře" variant="brand" size="sm" onClick={() => setZmenitMaklereOpen(true)} />
          </SideSection>

          <SideSection title="Status příležitosti">
            <div style={KV_ROW}>
              <span style={KV_LABEL}>Stav</span>
              <div style={{ flex: 1 }}>
                <Tag label={p.stavPrilezitosti} variant={stavPrilezitostiVariant(p.stavPrilezitosti)} size="sm" />
              </div>
            </div>
            <KVRow label="Poslední aktivita" value={p.datumPosledniZmeny} />
          </SideSection>

          <SideSection title="Propojené záznamy">
            <KVRow label="Spolupracující makléř" value={p.makler} />
            <div style={KV_ROW}>
              <span style={KV_LABEL}>Nabídka</span>
              <a style={{ ...KV_VALUE, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--t-textMyDOCKPrimary)', cursor: 'pointer', textDecoration: 'none' }} onClick={() => window.open(`/nabidky/${p.idNabidky}`, '_blank')}>
                {p.idNabidky}
                <ArrowUpRight size={14} style={{ color: '#E05524', flexShrink: 0 }} />
              </a>
            </div>
            <div style={KV_ROW}>
              <span style={KV_LABEL}>Lead</span>
              <a style={{ ...KV_VALUE, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--t-textMyDOCKPrimary)', cursor: 'pointer', textDecoration: 'none' }} onClick={() => window.open(`/obchod/leady/${p.idLeadu}`, '_blank')}>
                {p.idLeadu.replace('L', '')}
                <ArrowUpRight size={14} style={{ color: '#E05524', flexShrink: 0 }} />
              </a>
            </div>
          </SideSection>

          <SideSection title="Doplňující informace">
            <span style={{ fontSize: 13, color: 'var(--t-textSecondary)' }}>Uzavření systémem</span>
          </SideSection>

          <SideSection title="Financování">
            <KVRow label="Zájem o hypotéku" value="Ne" />
          </SideSection>

          <SideSection title={`Nabídka ${p.idNabidky}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <a
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-textMyDOCKPrimary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 2 }}
                onClick={() => window.open(`/nabidky/${p.idNabidky}`, '_blank')}
              >
                {p.nazevNabidky}
                <ArrowUpRight size={14} style={{ flexShrink: 0 }} />
              </a>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--t-textSecondary)' }}>
                Středočeský kraj, Mladá Boleslav, Mladá Boleslav I, Pražská brána 4/4, 29301
              </p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {['Velmi dobrý', 'Osobní', 'Cílová'].map(tag => (
                  <Tag key={tag} label={tag} variant="neutral" size="sm" />
                ))}
              </div>
            </div>
          </SideSection>
        </div>

      </div>
      </div>
    </div>

    {ukolModalOpen && <NovyUkolModal defaultResitel={p.makler} onClose={() => setUkolModalOpen(false)} />}
    {komunikaceModalOpen && <ZapsatKomunikaceModal onClose={() => setKomunikaceModalOpen(false)} />}
    {prohlidkaModalOpen && <NovyProhlidkaModal onClose={() => setProhlidkaModalOpen(false)} />}
    {zmenitMaklereOpen && <ZmenitMaklereModal currentMakler={p.makler} onClose={() => setZmenitMaklereOpen(false)} />}
  </>
  )
}
