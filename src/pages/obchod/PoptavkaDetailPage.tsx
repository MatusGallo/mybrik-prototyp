import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Phone, Mail, Smartphone,
  Calendar, CalendarClock, CheckSquare, Clock, MapPin, User, Pencil,
  StickyNote, RefreshCw, Send, CircleDollarSign, ChevronDown, ChevronUp,
  type LucideIcon,
} from 'lucide-react'
import {
  Avatar, Tag, IconButton, TextButton, Button, Alert, PillTabGroup, Checkbox,
  Menu, MenuItem, MenuHeading,
} from '@matusgallo/mysabds'
import { poptavkyData } from '../../data/mockObchod'
import NovyUkolModal from '../../components/obchod/NovyUkolModal'
import ZapsatKomunikaceModal from '../../components/obchod/ZapsatKomunikaceModal'
import NovyProhlidkaModal from '../../components/obchod/NovyProhlidkaModal'
import ZmenitMaklereModal from '../../components/obchod/ZmenitMaklereModal'
import ZapsatVysledekModal from '../../components/obchod/ZapsatVysledekModal'
import InterniPoznamkaModal from '../../components/nabidky/InterniPoznamkaModal'

// ── Mock detail dat ─────────────────────────────────────────────────────────────
// Seznam poptávek (mockObchod) nese jen tabulková pole. Detail k nim dokresluje to,
// co makléř na obrazovce potřebuje — zprávu klienta, nemovitost a agendu.

const DETAIL = {
  zprava: `Dobrý den pane Dvorský,

mám zájem o prohlídku pozemku ve Vráži u Berouna. Chtěl bych se zeptat, zda je na pozemku přípojka vody a elektřiny a jestli je možné stavět bez dalších omezení. Hodila by se mi prohlídka příští týden ve všední den odpoledne, nejlépe ve čtvrtek.

Děkuji, Milan Kuzica`,
  doruceno: '4. 9. 2025, 08:33',
  kanal: 'Webový formulář (Sreality)',
  posledniKontakt: '10. 9. 2025 (před 14 dny)',
  hypotekaDotaz: true,
}

const NABIDKA = {
  foto: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop&auto=format&q=80',
  adresa: 'Vráž u Berouna, Beroun, Středočeský kraj, 267 11',
  cena: 2_690_000,
  plocha: '812 m²',
  vlastnictvi: 'Osobní',
  stav: 'Aktivní',
  poptavek: 3,
}

type AgendaKind = 'ukol' | 'schuzka' | 'komunikace'
type AgendaGroup = 'vysledek' | 'poTerminu' | 'nadchazejici' | 'historie'
type TagVariant = 'neutral' | 'outline' | 'invert' | 'brand' | 'info' | 'success' | 'warning' | 'danger'

interface AgendaItem {
  id: number
  kind: AgendaKind
  group: AgendaGroup
  /** Ikona typu — jen u schůzek a komunikace, úkol má vlastní. */
  icon?: LucideIcon
  nazev: string
  misto?: string
  resitel?: string
  /** Doplněk za řešitelem, např. „Úkol · Slíbeno klientovi“. */
  meta?: string
  /** Šedý boxík pod položkou — poznámka k záznamu. */
  poznamka?: string
  duvodZruseni?: string
  presunutoZ?: string
  presunutoNa?: string
  datum: string
  cas?: string
  tag?: { label: string; variant: TagVariant }
  /** Akce, kterou položka vyžaduje (schůzka bez zadaného výsledku). */
  akce?: string
  hotovo?: string
}

const AGENDA: AgendaItem[] = [
  {
    id: 1, kind: 'schuzka', group: 'vysledek', icon: Calendar,
    nazev: 'Prohlídka pozemku s klientem',
    misto: 'Vráž u Berouna, parcela 412/3', resitel: 'Daniel Dvorský',
    presunutoZ: '11. 9.',
    datum: 'Čt 18. 9.', cas: '15:00-16:00',
    tag: { label: 'Proběhla', variant: 'warning' },
    akce: 'Zadat výsledek schůzky',
  },
  {
    id: 2, kind: 'ukol', group: 'poTerminu',
    nazev: 'Poslat klientovi informace o přípojkách a územním plánu',
    resitel: 'Daniel Dvorský', meta: 'Úkol · Slíbeno klientovi',
    datum: '22. 9.', cas: '12:00',
    tag: { label: 'Po termínu', variant: 'danger' },
  },
  {
    id: 3, kind: 'schuzka', group: 'nadchazejici', icon: Calendar,
    nazev: 'Druhá prohlídka - klient přivede manželku',
    misto: 'Vráž u Berouna, parcela 412/3', resitel: 'Daniel Dvorský',
    poznamka: 'Vzít snímek katastrální mapy a nabídku sousedního pozemku 412/4.',
    datum: 'Út 30. 9.', cas: '16:00-17:00',
    tag: { label: 'Schůzka', variant: 'info' },
  },
  {
    id: 4, kind: 'ukol', group: 'nadchazejici',
    nazev: 'Připravit návrh rezervační smlouvy',
    resitel: 'Daniel Dvorský', meta: 'Úkol',
    datum: 'Po 6. 10.', cas: '10:00',
    tag: { label: 'Úkol', variant: 'warning' },
  },
  {
    id: 5, kind: 'schuzka', group: 'historie', icon: CalendarClock,
    nazev: 'Prohlídka pozemku s klientem',
    misto: 'Vráž u Berouna, parcela 412/3', resitel: 'Daniel Dvorský',
    duvodZruseni: 'Klient se den předem omluvil - pracovní cesta. Domluven náhradní termín po telefonu.',
    presunutoNa: 'Čt 18. 9. 2025, 15:00',
    datum: 'Čt 11. 9.', cas: '15:00-16:00',
    tag: { label: 'Zrušeno - přesunuto', variant: 'neutral' },
  },
  {
    id: 6, kind: 'komunikace', group: 'historie', icon: Phone,
    nazev: 'Telefonát - omluva a přesun prohlídky',
    meta: 'Příchozí hovor · 4 min', resitel: 'Daniel Dvorský',
    poznamka: 'Klient nemůže ve čtvrtek 11. 9., domluven nový termín 18. 9. v 15:00. Zájem trvá.',
    datum: '10. 9.', cas: '16:41',
  },
  {
    id: 7, kind: 'ukol', group: 'historie',
    nazev: 'Zavolat klientovi do 24 h od poptávky',
    hotovo: 'Dokončeno 5. 9. v 10:18 · Daniel Dvorský',
    datum: '5. 9.', cas: '09:00',
  },
  {
    id: 8, kind: 'komunikace', group: 'historie', icon: Mail,
    nazev: 'Odeslán e-mail - potvrzení přijetí poptávky',
    meta: 'Odchozí e-mail · Automaticky',
    datum: '4. 9.', cas: '08:35',
  },
  {
    id: 9, kind: 'komunikace', group: 'historie', icon: Clock,
    nazev: 'Poptávka přijata ze Sreality.cz',
    meta: 'Vznik poptávky',
    datum: '4. 9.', cas: '08:33',
  },
]

// Agenda je časová osa vzestupně — minulost navrchu, budoucnost dole. Historie se
// řeší zvlášť (viz sekce Historie v komponentě), tady zůstávají jen aktivní skupiny.
const AGENDA_GROUPS: { key: AgendaGroup; label: string }[] = [
  { key: 'vysledek', label: 'Čeká na zadání výsledku' },
  { key: 'poTerminu', label: 'Po termínu' },
  { key: 'nadchazejici', label: 'Nadcházející' },
]

const STAVY = ['Nová', 'Kontaktováno', 'Domluvená prohlídka', 'Nemá zájem', 'Uzavřeno']

// ── Helpers ─────────────────────────────────────────────────────────────────────

function stavVariant(stav: string): TagVariant {
  if (stav === 'Aktivní' || stav === 'Nová') return 'success'
  if (stav === 'Domluvená prohlídka' || stav === 'Kontaktováno') return 'brand'
  if (stav === 'Nemá zájem') return 'danger'
  return 'neutral'
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

function formatCena(cena: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(cena)
}

// ── Styly ───────────────────────────────────────────────────────────────────────

const CARD: CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
}

const WIDGET_TITLE: CSSProperties = {
  fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)',
}

const GROUP_LABEL: CSSProperties = {
  fontSize: 11, fontWeight: 600, lineHeight: '12px', letterSpacing: '0.11px',
  textTransform: 'uppercase', color: 'var(--t-textTertiary)',
}

const META_TEXT: CSSProperties = {
  fontSize: 12, lineHeight: '16px', color: 'var(--t-textSecondary)',
}

// Barevný kontext položky agendy podle skupiny — co čeká na akci, musí být vidět.
const GROUP_TONE: Record<AgendaGroup, { bg: string; border: string }> = {
  vysledek:     { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.5)' },
  poTerminu:    { bg: 'rgba(220,38,38,0.05)',  border: 'rgba(220,38,38,0.35)' },
  nadchazejici: { bg: 'var(--t-bgPrimary)',    border: 'var(--t-borderPrimary)' },
  historie:     { bg: 'var(--t-bgPrimary)',    border: 'var(--t-borderPrimary)' },
}

// ── Sub-komponenty ──────────────────────────────────────────────────────────────

function Widget({ title, action, children }: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '16px 16px 0',
      }}>
        <span style={{ ...WIDGET_TITLE, minWidth: 0 }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

// Buňka faktu v hero kartě — popisek nad hodnotou, oddělená svislou linkou.
function HeroFact({ label, value, action, first }: {
  label: string; value: string; action?: React.ReactNode; first?: boolean
}) {
  return (
    <div style={{
      flex: 1, minWidth: 160, padding: '10px 16px',
      borderLeft: first ? undefined : '1px solid var(--t-borderPrimary)',
    }}>
      <div style={META_TEXT}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span title={value} style={{
          fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textPrimary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value}
        </span>
        {action}
      </div>
    </div>
  )
}

// Kompaktní fakt u nemovitosti — „Plocha 812 m²“ na jednom řádku.
function InlineFact({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--t-textSecondary)', whiteSpace: 'nowrap' }}>
      {label}{' '}
      <span style={{ fontWeight: 600, color: 'var(--t-textPrimary)' }}>{value}</span>
    </span>
  )
}

function AgendaRow({ item, onVysledek }: { item: AgendaItem; onVysledek: () => void }) {
  const tone = GROUP_TONE[item.group]
  const zruseno = !!item.duvodZruseni
  const hotovo = !!item.hotovo
  const prosle = zruseno || hotovo
  const Icon = item.icon

  return (
    <div style={{
      display: 'flex', gap: 12, padding: 12,
      background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 10,
    }}>
      {/* Levý indikátor — úkol se zavírá odškrtnutím, ostatní nesou ikonu typu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0, paddingTop: 1 }}>
        {item.kind === 'ukol' && <Checkbox checked={hotovo} />}
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: prosle ? 'var(--t-bgTertiary)'
            : item.kind === 'schuzka' ? 'rgba(37,99,235,0.10)'
            : item.kind === 'ukol' ? 'var(--t-bgMyDOCKTertiary)'
            : 'var(--t-bgSecondary)',
        }}>
          {item.kind === 'ukol'
            ? <CheckSquare size={15} style={{ color: prosle ? 'var(--t-textTertiary)' : 'var(--t-textMyDOCKPrimary)' }} />
            : Icon && <Icon size={15} style={{ color: prosle ? 'var(--t-textTertiary)' : item.kind === 'schuzka' ? '#2563EB' : 'var(--t-textSecondary)' }} />}
        </div>
      </div>

      {/* Obsah */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{
          fontSize: 14, fontWeight: 600, lineHeight: '20px',
          color: prosle ? 'var(--t-textTertiary)' : 'var(--t-textPrimary)',
          textDecoration: prosle ? 'line-through' : undefined,
        }}>
          {item.nazev}
        </span>

        {(item.misto || item.resitel || item.meta || item.presunutoZ) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {item.misto && (
              <span style={{ ...META_TEXT, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} style={{ flexShrink: 0 }} />{item.misto}
              </span>
            )}
            {item.resitel && (
              <span style={{ ...META_TEXT, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <User size={13} style={{ flexShrink: 0 }} />{item.resitel}
              </span>
            )}
            {item.meta && <span style={META_TEXT}>{item.meta}</span>}
            {item.presunutoZ && (
              <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '16px', color: 'var(--t-textMyDOCKPrimary)' }}>
                Přesunuto z {item.presunutoZ}
              </span>
            )}
          </div>
        )}

        {item.hotovo && <span style={META_TEXT}>{item.hotovo}</span>}

        {(item.poznamka || item.duvodZruseni) && (
          <div style={{
            background: 'var(--t-bgSecondary)', borderRadius: 8, padding: '8px 12px',
            fontSize: 13, lineHeight: '20px', color: 'var(--t-textSecondary)',
          }}>
            {item.duvodZruseni && (
              <span style={{ fontWeight: 600, color: 'var(--t-textPrimary)' }}>Důvod zrušení: </span>
            )}
            {item.duvodZruseni ?? item.poznamka}
          </div>
        )}

        {item.presunutoNa && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, lineHeight: '18px', color: 'var(--t-textMyDOCKPrimary)',
          }}>
            <ArrowRight size={14} style={{ flexShrink: 0 }} />
            Přesunuto na {item.presunutoNa}
          </span>
        )}

        {item.akce && (
          <div style={{ marginTop: 2, alignSelf: 'flex-start' }}>
            <Button label={item.akce} variant="primary" size="md" leadIcon={CheckSquare} onClick={onVysledek} />
          </div>
        )}
      </div>

      {/* Termín + stav */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
        flexShrink: 0, textAlign: 'right',
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, lineHeight: '18px', whiteSpace: 'nowrap',
          color: prosle ? 'var(--t-textTertiary)' : 'var(--t-textPrimary)',
          textDecoration: prosle ? 'line-through' : undefined,
        }}>
          {item.datum}
        </span>
        {item.cas && (
          <span style={{
            ...META_TEXT, whiteSpace: 'nowrap',
            textDecoration: prosle ? 'line-through' : undefined,
          }}>
            {item.cas}
          </span>
        )}
        {item.tag && <Tag label={item.tag.label} variant={item.tag.variant} size="sm" />}
      </div>
    </div>
  )
}

// Nadpis skupiny v časové ose — popisek + dopočítaná linka.
function GroupHeading({ label, color }: { label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ ...GROUP_LABEL, color: color ?? 'var(--t-textTertiary)' }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--t-borderPrimary)' }} />
    </div>
  )
}

// Řádek akce v pravém panelu — ikona v dlaždici + popisek.
function RailAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '6px 8px',
        display: 'flex', alignItems: 'center', gap: 12,
        background: hovered ? 'var(--t-bgHover)' : 'transparent',
        border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--t-bgMyDOCKTertiary)',
      }}>
        <Icon size={16} style={{ color: 'var(--t-textMyDOCKPrimary)' }} />
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>
        {label}
      </span>
    </button>
  )
}

// ── Stránka ─────────────────────────────────────────────────────────────────────

export default function PoptavkaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [agendaFilter, setAgendaFilter] = useState('vse')
  const [historieOpen, setHistorieOpen] = useState(false)
  const historieRef = useRef<HTMLDivElement>(null)
  const [hypotekaOdpoved, setHypotekaOdpoved] = useState<'ano' | 'ne' | null>(null)
  const [ukolOpen, setUkolOpen] = useState(false)
  const [komunikaceOpen, setKomunikaceOpen] = useState(false)
  const [schuzkaOpen, setSchuzkaOpen] = useState(false)
  const [predatOpen, setPredatOpen] = useState(false)
  const [vysledekOpen, setVysledekOpen] = useState(false)
  const [poznamkaOpen, setPoznamkaOpen] = useState(false)
  const [poznamka, setPoznamka] = useState('')
  const [stavMenuOpen, setStavMenuOpen] = useState(false)
  const [stav, setStav] = useState('Domluvená prohlídka')

  // Po rozbalení historie odscrolluj na konec — nejnovější záznam má zůstat u dneška.
  useEffect(() => {
    if (historieOpen && historieRef.current) {
      historieRef.current.scrollTop = historieRef.current.scrollHeight
    }
  }, [historieOpen])

  const p = poptavkyData.find(r => r.id === id)
  if (!p) {
    return <div style={{ padding: 24, color: 'var(--t-textSecondary)' }}>Poptávka nenalezena.</div>
  }

  const [klientJmeno, klientEmail, klientTelefon] = p.klient.split('\n')

  const viditelne = AGENDA.filter(a => agendaFilter === 'vse'
    || (agendaFilter === 'ukoly' && a.kind === 'ukol')
    || (agendaFilter === 'schuzky' && a.kind === 'schuzka')
    || (agendaFilter === 'komunikace' && a.kind === 'komunikace'))

  // Historie chronologicky vzestupně; poslední záznam před dneškem zůstává vidět,
  // starší se schovají za akci a scrollují.
  const historie = viditelne.filter(a => a.group === 'historie').reverse()
  const historiePosledni = historie[historie.length - 1]
  const historieStarsi = historie.slice(0, -1)

  return (
    <>
      <div style={{ margin: -24, background: 'var(--t-bgSecondary)', minHeight: 'calc(100vh - 56px)' }}>

        {/* Hlavička — bílý pás přes celou šířku, stejně jako v detailu nabídky */}
        <div style={{ background: 'var(--t-bgPrimary)', borderBottom: '1px solid var(--t-borderPrimary)' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0, padding: '24px 0 16px' }}>
              <div style={{ marginTop: 2 }}>
                <IconButton icon={ArrowLeft} variant="ghost" size="md" tooltip="Zpět na seznam" onClick={() => navigate('/obchod/poptavky')} />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, lineHeight: '32px', color: 'var(--t-textPrimary)', minWidth: 0 }}>
                Poptávka - {klientJmeno}
                <span style={{ fontWeight: 500, color: 'var(--t-textTertiary)' }}> · {p.id}</span>
              </h1>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1440, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>

            {/* ── Obsah ───────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

              {/* Klient — hero karta */}
              <div style={CARD}>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Avatar initials={getInitials(klientJmeno)} size="lg" color="dark" />
                    <span style={{ fontSize: 20, fontWeight: 700, lineHeight: '28px', color: 'var(--t-textPrimary)' }}>
                      {klientJmeno}
                    </span>
                    <Tag label={p.stavPoptavky} variant={stavVariant(p.stavPoptavky)} size="sm" lead="indicator" />
                    <Tag label={p.id} variant="neutral" size="sm" />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button label={klientTelefon} variant="outlined" size="md" leadIcon={Phone} />
                    <Button label={klientEmail} variant="outlined" size="md" leadIcon={Mail} />
                    <Button label="SMS" variant="outlined" size="md" leadIcon={Smartphone} />
                  </div>
                </div>

                {/* Fakta o poptávce */}
                <div style={{ display: 'flex', borderTop: '1px solid var(--t-borderPrimary)', flexWrap: 'wrap' }}>
                  <HeroFact
                    first
                    label="Makléř"
                    value={p.makler}
                    action={<TextButton label="Předat" variant="brand" size="sm" leadIcon={RefreshCw} onClick={() => setPredatOpen(true)} />}
                  />
                  <HeroFact label="Zdroj poptávky" value={p.zdroj} />
                  <HeroFact label="Přišla" value={p.datumVytvoreni} />
                  <HeroFact label="Poslední kontakt" value={DETAIL.posledniKontakt} />
                </div>
              </div>

              {/* Zájem o hypotéku — dotaz zmizí po odpovědi */}
              {DETAIL.hypotekaDotaz && hypotekaOdpoved === null && (
                <Alert
                  variant="warning"
                  rich
                  icon={CircleDollarSign}
                  label="Má klient zájem o hypotéku?"
                  description="Vyžaduje odpověď - při zájmu se odešle lead finančnímu poradci."
                  actions={[
                    { label: 'Ano, odeslat lead', variant: 'warning', leadIcon: Send, onClick: () => setHypotekaOdpoved('ano') },
                    { label: 'Ne', variant: 'secondary', onClick: () => setHypotekaOdpoved('ne') },
                  ]}
                />
              )}
              {hypotekaOdpoved === 'ano' && (
                <Alert
                  variant="success"
                  label="Lead byl odeslán finančnímu poradci."
                  onDismiss={() => setHypotekaOdpoved(null)}
                />
              )}

              {/* Zpráva od klienta */}
              <Widget
                title="Zpráva od klienta"
                action={<TextButton label="Odpovědět" variant="brand" onClick={() => setKomunikaceOpen(true)} />}
              >
                <div style={{
                  background: 'var(--t-bgSecondary)',
                  borderLeft: '3px solid #E05524',
                  borderRadius: '0 8px 8px 0',
                  padding: '12px 16px',
                  fontSize: 14, lineHeight: '22px', color: 'var(--t-textPrimary)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {DETAIL.zprava}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                  <span style={META_TEXT}>
                    Doručeno: <span style={{ fontWeight: 600, color: 'var(--t-textPrimary)' }}>{DETAIL.doruceno}</span>
                  </span>
                  <span style={META_TEXT}>
                    Kanál: <span style={{ fontWeight: 600, color: 'var(--t-textPrimary)' }}>{DETAIL.kanal}</span>
                  </span>
                </div>
              </Widget>

              {/* Nemovitost, na kterou poptávka reaguje */}
              <Widget
                title="Reaguje na nabídku"
                action={<Tag label={`ID ${p.idNabidky}`} variant="neutral" size="sm" />}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <img
                    src={NABIDKA.foto}
                    alt=""
                    style={{ width: 148, height: 100, objectFit: 'cover', borderRadius: 8, flexShrink: 0, background: 'var(--t-bgTertiary)' }}
                  />
                  <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <button
                        onClick={() => navigate(`/nabidky/${p.idNabidky}`)}
                        style={{
                          padding: 0, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
                          fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textMyDOCKPrimary)',
                        }}
                      >
                        {p.nazevNabidky}
                      </button>
                      <TextButton
                        label="Otevřít nabídku"
                        variant="brand"
                        tailIcon={ArrowUpRight}
                        onClick={() => navigate(`/nabidky/${p.idNabidky}`)}
                      />
                    </div>
                    <span style={META_TEXT}>{NABIDKA.adresa}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, lineHeight: '28px', color: 'var(--t-textPrimary)', letterSpacing: '-0.3px' }}>
                      {formatCena(NABIDKA.cena)}
                    </span>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 2 }}>
                      <InlineFact label="Plocha" value={NABIDKA.plocha} />
                      <InlineFact label="Vlastnictví" value={NABIDKA.vlastnictvi} />
                      <InlineFact label="Stav" value={NABIDKA.stav} />
                      <InlineFact label="Poptávek" value={String(NABIDKA.poptavek)} />
                    </div>
                  </div>
                </div>
              </Widget>

              {/* Agenda a komunikace */}
              <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 16px 0' }}>
                  <span style={WIDGET_TITLE}>Agenda a komunikace</span>
                </div>

                {/* Filtr typu záznamu */}
                <div style={{ padding: '12px 16px' }}>
                  <PillTabGroup
                    size="md"
                    value={agendaFilter}
                    onChange={setAgendaFilter}
                    tabs={[
                      { value: 'vse', label: 'Vše' },
                      { value: 'ukoly', label: 'Úkoly' },
                      { value: 'schuzky', label: 'Schůzky' },
                      { value: 'komunikace', label: 'Komunikace' },
                    ]}
                  />
                </div>

                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Historie — navrchu, sbalená za akcí; vidět zůstává poslední záznam před dneškem */}
                  {historie.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <GroupHeading label="Historie" />

                      {historieStarsi.length > 0 && (
                        <>
                          <div style={{ alignSelf: 'flex-start' }}>
                            <TextButton
                              label={historieOpen
                                ? 'Skrýt starší záznamy'
                                : `Zobrazit starší záznamy (${historieStarsi.length})`}
                              variant="brand"
                              size="sm"
                              leadIcon={historieOpen ? ChevronUp : ChevronDown}
                              onClick={() => setHistorieOpen(v => !v)}
                            />
                          </div>
                          {historieOpen && (
                            <div
                              ref={historieRef}
                              style={{
                                maxHeight: 320, overflowY: 'auto',
                                display: 'flex', flexDirection: 'column', gap: 8,
                                paddingRight: 4,
                              }}
                            >
                              {historieStarsi.map(item => (
                                <AgendaRow key={item.id} item={item} onVysledek={() => setVysledekOpen(true)} />
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {historiePosledni && (
                        <AgendaRow item={historiePosledni} onVysledek={() => setVysledekOpen(true)} />
                      )}
                    </div>
                  )}

                  {/* Dnešek a budoucnost */}
                  {AGENDA_GROUPS.map(g => {
                    const items = viditelne.filter(a => a.group === g.key)
                    if (items.length === 0) return null
                    return (
                      <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <GroupHeading
                          label={g.label}
                          color={g.key === 'poTerminu' ? '#DC2626' : g.key === 'vysledek' ? '#B45309' : undefined}
                        />
                        {items.map(item => (
                          <AgendaRow key={item.id} item={item} onVysledek={() => setVysledekOpen(true)} />
                        ))}
                      </div>
                    )
                  })}

                  {viditelne.length === 0 && (
                    <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', fontSize: 14, color: 'var(--t-textSecondary)' }}>
                      Pro vybraný filtr tu nic není.
                    </p>
                  )}
                </div>

                {/* Zakládání agendy + vysvětlení, proč se schůzka nezavírá odškrtnutím */}
                <div style={{ borderTop: '1px solid var(--t-borderPrimary)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button label="Zapsat komunikaci" variant="primary" size="md" leadIcon={Pencil} onClick={() => setKomunikaceOpen(true)} />
                    <Button label="Naplánovat schůzku" variant="outlined" size="md" leadIcon={Calendar} onClick={() => setSchuzkaOpen(true)} />
                    <Button label="Nový úkol" variant="outlined" size="md" leadIcon={CheckSquare} onClick={() => setUkolOpen(true)} />
                  </div>
                  <p style={{ margin: 0, ...META_TEXT }}>
                    Úkoly se uzavírají odškrtnutím. U schůzky se vždy zadává výsledek (proběhla, neproběhla, zrušena
                    nebo přesunuta), který se uloží do historie.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Pravý panel ─────────────────────────────────────────── */}
            <div style={{ ...CARD, padding: 16, position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Stav poptávky */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={GROUP_LABEL}>Stav poptávky</span>
                  <div style={{ position: 'relative' }}>
                    <TextButton label="Změnit stav" variant="brand" size="sm" leadIcon={RefreshCw} onClick={() => setStavMenuOpen(v => !v)} />
                    {stavMenuOpen && (
                      <>
                        <div onClick={() => setStavMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 21 }}>
                          <Menu width={240}>
                            <MenuHeading label="Stav poptávky" />
                            {STAVY.map(s => (
                              <MenuItem
                                key={s}
                                label={s}
                                variant={stav === s ? 'active' : 'default'}
                                onClick={() => { setStav(s); setStavMenuOpen(false) }}
                              />
                            ))}
                          </Menu>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ alignSelf: 'flex-start' }}>
                  <Tag label={stav} variant={stavVariant(stav)} size="md" lead="indicator" />
                </div>
              </div>

              {[
                {
                  title: 'Komunikace',
                  actions: [
                    { icon: Pencil, label: 'Zapsat komunikaci', onClick: () => setKomunikaceOpen(true) },
                    { icon: Mail, label: 'Odeslat e-mail', onClick: () => setKomunikaceOpen(true) },
                    { icon: Smartphone, label: 'Odeslat SMS', onClick: () => setKomunikaceOpen(true) },
                    { icon: Phone, label: 'Zavolat', onClick: () => setKomunikaceOpen(true) },
                  ],
                },
                {
                  title: 'Plánování',
                  actions: [
                    { icon: Calendar, label: 'Naplánovat schůzku', onClick: () => setSchuzkaOpen(true) },
                    { icon: CheckSquare, label: 'Nový úkol', onClick: () => setUkolOpen(true) },
                  ],
                },
                {
                  title: 'Správa',
                  actions: [
                    { icon: RefreshCw, label: 'Předat makléři', onClick: () => setPredatOpen(true) },
                    { icon: StickyNote, label: 'Interní poznámka', onClick: () => setPoznamkaOpen(true) },
                  ],
                },
              ].map(group => (
                <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ ...GROUP_LABEL, padding: '0 2px', marginBottom: 4 }}>{group.title}</span>
                  {group.actions.map(a => (
                    <RailAction key={a.label} icon={a.icon} label={a.label} onClick={a.onClick} />
                  ))}
                </div>
              ))}

              {/* Propojené záznamy */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--t-borderPrimary)', paddingTop: 16 }}>
                <span style={GROUP_LABEL}>Propojené záznamy</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={META_TEXT}>Nabídka</span>
                    <TextButton label={String(p.idNabidky)} variant="brand" size="sm" tailIcon={ArrowUpRight} onClick={() => navigate(`/nabidky/${p.idNabidky}`)} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={META_TEXT}>Lead</span>
                    <TextButton label={p.idLeadu} variant="brand" size="sm" tailIcon={ArrowUpRight} onClick={() => navigate('/obchod/lead')} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={META_TEXT}>Pobočka</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-textPrimary)' }}>{p.pobocka}</span>
                  </div>
                </div>
              </div>

              {/* Interní poznámka */}
              {poznamka.trim() && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--t-borderPrimary)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={GROUP_LABEL}>Interní poznámka</span>
                    <TextButton label="Upravit" variant="brand" size="sm" leadIcon={Pencil} onClick={() => setPoznamkaOpen(true)} />
                  </div>
                  <div style={{
                    background: 'var(--t-bgSecondary)', borderRadius: 8, padding: 12,
                    fontSize: 13, lineHeight: '20px', color: 'var(--t-textPrimary)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {poznamka}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {komunikaceOpen && <ZapsatKomunikaceModal onClose={() => setKomunikaceOpen(false)} />}
      {schuzkaOpen && <NovyProhlidkaModal onClose={() => setSchuzkaOpen(false)} />}
      {ukolOpen && <NovyUkolModal defaultResitel={p.makler} onClose={() => setUkolOpen(false)} />}
      {predatOpen && <ZmenitMaklereModal currentMakler={p.makler} onClose={() => setPredatOpen(false)} />}
      {vysledekOpen && <ZapsatVysledekModal onClose={() => setVysledekOpen(false)} />}
      {poznamkaOpen && (
        <InterniPoznamkaModal
          initialValue={poznamka}
          onClose={() => setPoznamkaOpen(false)}
          onSave={text => { setPoznamka(text); setPoznamkaOpen(false) }}
        />
      )}
    </>
  )
}
