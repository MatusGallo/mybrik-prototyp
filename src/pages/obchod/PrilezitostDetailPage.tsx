import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Phone, Mail, Smartphone, MessageSquare,
  Calendar, CalendarClock, CheckSquare, Clock, MapPin, User, Pencil,
  StickyNote, RefreshCw, Send, CircleDollarSign, ChevronDown, ChevronUp, Globe,
  Maximize2, KeyRound, CircleDot, CircleCheck, Circle, Wallet, PiggyBank,
  Landmark, UserCheck, Building2,
  type LucideIcon,
} from 'lucide-react'
import {
  Avatar, Tag, IconButton, TextButton, Button, Alert, PillTabGroup,
  Menu, MenuItem, MenuHeading, SummaryListItem, TooltipIcon, typography, iconSize,
} from '@matusgallo/mysabds'
import { prilezitostiData, STAVY_PRILEZITOSTI, stavPrilezitostiVariant } from '../../data/mockObchod'
import { nabidkyData } from '../../data/mockData'
import PrilezitostPanel from '../../components/obchod/PrilezitostPanel'
import NovyUkolModal from '../../components/obchod/NovyUkolModal'
import ZapsatKomunikaceModal from '../../components/obchod/ZapsatKomunikaceModal'
import NovyProhlidkaModal from '../../components/obchod/NovyProhlidkaModal'
import ZmenitMaklereModal from '../../components/obchod/ZmenitMaklereModal'
import ZapsatVysledekModal from '../../components/obchod/ZapsatVysledekModal'
import OdeslatSmsModal from '../../components/obchod/OdeslatSmsModal'
import OdeslatEmailModal from '../../components/obchod/OdeslatEmailModal'
import OdeslatLeadHypoModal, { type LeadHypoData } from '../../components/obchod/OdeslatLeadHypoModal'
import InterniPoznamkaModal from '../../components/nabidky/InterniPoznamkaModal'

// ── Mock detail dat ─────────────────────────────────────────────────────────────
// Seznam příležitostí (mockObchod) nese jen tabulková pole. Detail k nim dokresluje to,
// co makléř na obrazovce potřebuje — zprávu klienta, nemovitost a agendu.

// Text zprávy k referenčnímu záznamu. Ostatní příležitosti dostanou obecné znění, aby
// podpis i zmíněná nemovitost vždy odpovídaly záznamu, na kterém uživatel stojí.
const ZPRAVY: Record<string, string> = {
  P332: `Dobrý den pane Dvorský,

našel jsem váš inzerát na stavební pozemek ve Vráži u Berouna a moc mě zaujal. S manželkou hledáme parcelu na stavbu rodinného domu už skoro rok a tahle lokalita by nám vyhovovala nejvíc - oba pracujeme v Berouně a děti by mohly zůstat ve stejné škole.

Rád bych se zeptal na několik věcí. Je na pozemku přípojka vody a elektřiny, případně jak daleko jsou hlavní řady? Řeší se tam kanalizace, nebo se počítá s jímkou či domovní čističkou? A je podle územního plánu možné stavět bez dalších omezení, hlavně co se týče výšky domu a zastavěnosti parcely?

Zajímalo by mě taky, jak je to s přístupovou cestou - je v majetku obce, nebo jde o soukromý pozemek? A neváže se k parcele předkupní právo nebo zástava?

Financování máme předjednané, hypotéku řešíme přes svou banku a část ceny pokryjeme z prodeje současného bytu. Pokud by se pozemek ukázal jako vhodný, jsme schopni jednat rychle.

Hodila by se mi prohlídka příští týden ve všední den odpoledne, nejlépe ve čtvrtek. Kdyby vám to nevyhovovalo, dejte prosím vědět jiný termín, přizpůsobím se.

Děkuji za odpověď a přeji hezký den,
Milan Kuzica`,
}

function zpravaKlienta(id: string, klient: string, nabidka: string) {
  return ZPRAVY[id] ?? `Dobrý den,

mám zájem o nemovitost ${nabidka}. Můžete mi prosím poslat víc informací a nabídnout termín prohlídky? Nejlépe ve všední den odpoledne.

Děkuji, ${klient}`
}

// Nemovitost — parametry, které seznam příležitostí nenese. Reálná adresa, cena a stav
// se doplní z nabídky, pokud pro dané ID existuje.
const NABIDKA_FALLBACK = {
  foto: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop&auto=format&q=80',
  adresa: 'Vráž u Berouna, Beroun, Středočeský kraj, 267 11',
  cena: 2_690_000,
  stav: 'Aktivní',
  plocha: '812 m²',
  vlastnictvi: 'Osobní',
  prilezitosti: 3,
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
    nazev: 'Zavolat klientovi do 24 h od vzniku příležitosti',
    hotovo: 'Dokončeno 5. 9. v 10:18 · Daniel Dvorský',
    datum: '5. 9.', cas: '09:00',
  },
  {
    id: 8, kind: 'komunikace', group: 'historie', icon: Mail,
    nazev: 'Odeslán e-mail - potvrzení přijetí',
    meta: 'Odchozí e-mail · Automaticky',
    datum: '4. 9.', cas: '08:35',
  },
  {
    id: 9, kind: 'komunikace', group: 'historie', icon: Clock,
    nazev: 'Příležitost přijata ze Sreality.cz',
    meta: 'Vznik příležitosti',
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

const STAVY = STAVY_PRILEZITOSTI

// ── Lead na hypotéku ────────────────────────────────────────────────────────────
// Odeslaný lead vyřizuje finanční poradce v myDOCKu, takže stavy vyřizování jsou
// cizí data - myBRIK je jen zobrazuje. Dokud není napojení hotové, kreslí je
// tenhle mock; struktura kroků odpovídá tomu, co se z myDOCKu bude načítat.

type KrokStav = 'hotovo' | 'aktualni' | 'ceka'

interface HypoKrok {
  label: string
  stav: KrokStav
  /** Kdy se krok stal. U čekajících kroků chybí. */
  kdy?: string
}

function hypoPrubeh(odeslano: Date): HypoKrok[] {
  const prideleno = new Date(odeslano.getTime() + 2 * 60_000)
  return [
    { label: 'Lead přijat v myDOCK', stav: 'hotovo', kdy: formatDateCas(odeslano) },
    { label: 'Přidělen poradci', stav: 'hotovo', kdy: formatDateCas(prideleno) },
    { label: 'Poradce kontaktuje klienta', stav: 'aktualni' },
    { label: 'Žádost podaná do banky', stav: 'ceka' },
    { label: 'Hypotéka vyřízena', stav: 'ceka' },
  ]
}

const KROK_IKONA: Record<KrokStav, LucideIcon> = {
  hotovo: CircleCheck,
  aktualni: CircleDot,
  ceka: Circle,
}

const KROK_BARVA: Record<KrokStav, string> = {
  hotovo: '#16A34A',
  aktualni: 'var(--t-textMyDOCKPrimary)',
  ceka: 'var(--t-textTertiary)',
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

function formatCena(cena: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(cena)
}

/** Date → '17. 8. 2026 · 14:05' */
function formatDateCas(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} · ${hh}:${mm}`
}

/** Telefon v podobě, kterou přijme odkaz `tel:` */
function telHref(telefon: string) {
  return `tel:${telefon.replace(/\s/g, '')}`
}

/** '04.09.2025 08:33' → '4. 9. 2025 · 08:33' */
function formatDatumCas(hodnota: string) {
  const [datum, cas] = hodnota.split(' ')
  const [den, mesic, rok] = (datum ?? '').split('.')
  if (!den || !mesic || !rok) return hodnota
  const vypis = `${Number(den)}. ${Number(mesic)}. ${rok}`
  return cas ? `${vypis} · ${cas}` : vypis
}

/** '10.09.2025 16:41' → '10. 9. 2025 (před 14 dny)' */
function formatPosledniKontakt(hodnota: string) {
  const [datum] = hodnota.split(' ')
  const [den, mesic, rok] = (datum ?? '').split('.')
  if (!den || !mesic || !rok) return hodnota
  const vypis = `${Number(den)}. ${Number(mesic)}. ${rok}`

  const tehdy = new Date(Number(rok), Number(mesic) - 1, Number(den))
  const dnes = new Date()
  dnes.setHours(0, 0, 0, 0)
  const dny = Math.round((dnes.getTime() - tehdy.getTime()) / 86_400_000)
  if (dny < 0) return vypis
  const kdy = dny === 0 ? 'dnes' : dny === 1 ? 'včera' : `před ${dny} dny`
  return `${vypis} (${kdy})`
}

// ── Styly ───────────────────────────────────────────────────────────────────────

const CARD: CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
}

// Nadpis karty i panelu — subheadline18Semibold, ne headline20.
const WIDGET_TITLE: CSSProperties = {
  ...typography.subheadline18Semibold, color: 'var(--t-textPrimary)',
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

// Barva ikony i textu „Přesunuto“ se řídí variantou štítku daného řádku — v rámci
// řádku tak drží jedna barva (ikona, badge i přesunuto), viz TagVariant.
const VARIANT_COLOR: Record<TagVariant, string> = {
  neutral: 'var(--t-textSecondary)',
  outline: 'var(--t-textSecondary)',
  invert:  'var(--t-textPrimary)',
  brand:   'var(--t-textMyDOCKPrimary)',
  info:    '#2563EB',
  success: '#16A34A',
  warning: '#B45309',
  danger:  '#DC2626',
}

const VARIANT_TINT: Record<TagVariant, string> = {
  neutral: 'var(--t-bgSecondary)',
  outline: 'var(--t-bgSecondary)',
  invert:  'var(--t-bgSecondary)',
  brand:   'var(--t-bgMyDOCKTertiary)',
  info:    'rgba(37,99,235,0.10)',
  success: 'rgba(22,163,74,0.10)',
  warning: 'rgba(245,158,11,0.12)',
  danger:  'rgba(220,38,38,0.08)',
}

// ── Sub-komponenty ──────────────────────────────────────────────────────────────

function Widget({ title, action, meta, children }: {
  title: string
  action?: React.ReactNode
  /** Doplňující údaje pod nadpisem — např. kdy a odkud zpráva přišla. */
  meta?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ ...WIDGET_TITLE, minWidth: 0 }}>{title}</span>
          {action}
        </div>
        {meta && <div style={{ marginTop: 6 }}>{meta}</div>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

// Fakt v hero kartě — vlastní zaoblený box, popisek nad hodnotou.
// Řádkový fakt v hlavičce — ikona + popisek + hodnota, volitelně proklik nebo akce.
function FactLine({ icon: Icon, label, value, href, action }: {
  icon: LucideIcon; label: string; value: string; href?: string; action?: React.ReactNode
}) {
  // Bez `flex: 1` hodnota neroztahuje řádek, takže akce sedí hned za ní.
  const valueStyle: CSSProperties = {
    fontSize: 13, fontWeight: 600, lineHeight: '18px', color: 'var(--t-textPrimary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, padding: '6px 0' }}>
      <Icon size={15} style={{ color: 'var(--t-textSecondary)', flexShrink: 0 }} />
      <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--t-textSecondary)', flexShrink: 0, width: 116 }}>
        {label}
      </span>
      {href
        ? <a href={href} title={value} style={{ ...valueStyle, textDecoration: 'none' }}>{value}</a>
        : <span title={value} style={valueStyle}>{value}</span>}
      {action && <span style={{ flexShrink: 0 }}>{action}</span>}
    </div>
  )
}

// Kompaktní fakt u nemovitosti — ikona + „Plocha 812 m²“ na jednom řádku.
function InlineFact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 13, lineHeight: '18px', color: 'var(--t-textSecondary)', whiteSpace: 'nowrap',
    }}>
      <Icon size={13} style={{ flexShrink: 0 }} />
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

  // Jednotná barva řádku podle štítku — ikona i „Přesunuto“ ji sdílejí. Uzavřené
  // (zrušené/hotové) záznamy jsou ztlumené bez ohledu na variantu.
  const accent = prosle
    ? 'var(--t-textTertiary)'
    : item.tag ? VARIANT_COLOR[item.tag.variant] : 'var(--t-textSecondary)'
  const accentTint = prosle
    ? 'var(--t-bgTertiary)'
    : item.tag ? VARIANT_TINT[item.tag.variant] : 'var(--t-bgSecondary)'
  // „Přesunuto“ nese užitečnou informaci i u uzavřených záznamů — nesmí zmizet do
  // tertiary jako ikona, drží čitelnou sekundární barvu.
  const movedColor = prosle ? 'var(--t-textSecondary)' : accent

  return (
    <div style={{
      display: 'flex', gap: 12, padding: 12,
      background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 10,
    }}>
      {/* Levý indikátor — ikona typu záznamu */}
      <div style={{
        width: 32, height: 32, borderRadius: 999, flexShrink: 0, marginTop: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: accentTint,
      }}>
        {item.kind === 'ukol'
          ? <CheckSquare size={16} style={{ color: accent }} />
          : Icon && <Icon size={16} style={{ color: accent }} />}
      </div>

      {/* Obsah */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 14, fontWeight: 600, lineHeight: '20px',
            color: prosle ? 'var(--t-textTertiary)' : 'var(--t-textPrimary)',
            textDecoration: prosle ? 'line-through' : undefined,
          }}>
            {item.nazev}
          </span>
          {item.tag && <Tag label={item.tag.label} variant={item.tag.variant} size="sm" />}
        </div>

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
              <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '16px', color: movedColor }}>
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
            fontSize: 13, fontWeight: 600, lineHeight: '18px', color: movedColor,
          }}>
            <ArrowRight size={14} style={{ flexShrink: 0 }} />
            Přesunuto na {item.presunutoNa}
          </span>
        )}

        {item.akce && (
          <div style={{ marginTop: 2, alignSelf: 'flex-start' }}>
            <Button label={item.akce} variant="outlined" size="md" leadIcon={CheckSquare} onClick={onVysledek} />
          </div>
        )}

        {item.kind === 'ukol' && !hotovo && (
          <div style={{ marginTop: 2, alignSelf: 'flex-start' }}>
            <Button label="Vyřešit" variant="outlined" size="md" leadIcon={CheckSquare} onClick={onVysledek} />
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
      </div>
    </div>
  )
}

// Zpráva klienta v zaobleném boxu. Dlouhá zpráva se sbalí, aby nezatlačila zbytek
// obrazovky — mez se měří z reálné výšky textu, ne z počtu znaků.
const ZPRAVA_MAX = 160

function ZpravaKlienta({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [dlouha, setDlouha] = useState(false)

  useEffect(() => {
    if (ref.current) setDlouha(ref.current.scrollHeight > ZPRAVA_MAX + 8)
  }, [text])

  const sbalena = dlouha && !expanded

  return (
    <div>
      <div style={{ position: 'relative', background: 'var(--t-bgSecondary)', borderRadius: 8, padding: '12px 16px' }}>
        <div
          ref={ref}
          style={{
            fontSize: 14, lineHeight: '22px', color: 'var(--t-textPrimary)', whiteSpace: 'pre-wrap',
            maxHeight: sbalena ? ZPRAVA_MAX : undefined,
            overflow: 'hidden',
          }}
        >
          {text}
        </div>
        {sbalena && (
          <div
            aria-hidden
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 48,
              borderRadius: '0 0 8px 8px', pointerEvents: 'none',
              background: 'linear-gradient(to bottom, transparent, var(--t-bgSecondary))',
            }}
          />
        )}
      </div>
      {dlouha && (
        <div style={{ marginTop: 8 }}>
          <TextButton
            label={expanded ? 'Zobrazit méně' : 'Zobrazit celou zprávu'}
            variant="brand"
            size="sm"
            leadIcon={expanded ? ChevronUp : ChevronDown}
            onClick={() => setExpanded(v => !v)}
          />
        </div>
      )}
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

// Řádek akce v pravém panelu — ikona v dlaždici + popisek. S `href` je to odkaz
// (volání se předává telefonu, ne modálu), jinak tlačítko.
function RailAction({ icon: Icon, label, href, onClick }: {
  icon: LucideIcon; label: string; href?: string; onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const style: CSSProperties = {
    width: '100%', padding: '6px 8px',
    display: 'flex', alignItems: 'center', gap: 12,
    background: hovered ? 'var(--t-bgHover)' : 'transparent',
    border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
    textDecoration: 'none', transition: 'background 0.15s',
  }
  const obsah = (
    <>
      <span style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--t-bgMyDOCKTertiary)',
      }}>
        <Icon size={iconSize.md} style={{ color: 'var(--t-textMyDOCKPrimary)' }} />
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>
        {label}
      </span>
    </>
  )
  const events = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  }

  if (href) {
    return <a href={href} style={style} {...events}>{obsah}</a>
  }
  return <button onClick={onClick} style={style} {...events}>{obsah}</button>
}

// Krok vyřizování hypotéky — stav načtený z myDOCKu, ne editovatelný záznam.
function HypoKrokRow({ krok }: { krok: HypoKrok }) {
  const Ikona = KROK_IKONA[krok.stav]
  const barva = KROK_BARVA[krok.stav]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, padding: '4px 0' }}>
      <Ikona size={iconSize.md} style={{ color: barva, flexShrink: 0 }} />
      <span style={{
        fontSize: 13, lineHeight: '18px', flex: 1, minWidth: 0,
        fontWeight: krok.stav === 'aktualni' ? 600 : 500,
        color: krok.stav === 'ceka' ? 'var(--t-textTertiary)' : 'var(--t-textPrimary)',
      }}>
        {krok.label}
      </span>
      <span style={{ ...META_TEXT, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {krok.stav === 'aktualni' ? 'Probíhá' : krok.kdy ?? ''}
      </span>
    </div>
  )
}

// ── Stránka ─────────────────────────────────────────────────────────────────────

export default function PrilezitostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [agendaFilter, setAgendaFilter] = useState('vse')
  const [historieOpen, setHistorieOpen] = useState(false)
  // Hypotéka má tři stavy: nezodpovězeno, odmítnuto (jde vrátit) a odeslaný lead.
  const [hypoLead, setHypoLead] = useState<(LeadHypoData & { odeslano: Date }) | null>(null)
  const [hypoOdmitnuto, setHypoOdmitnuto] = useState<Date | null>(null)
  const [hypoModalOpen, setHypoModalOpen] = useState(false)
  const [ukolOpen, setUkolOpen] = useState(false)
  const [komunikaceOpen, setKomunikaceOpen] = useState(false)
  const [prohlidkaOpen, setProhlidkaOpen] = useState(false)
  const [smsOpen, setSmsOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [odpovedOpen, setOdpovedOpen] = useState(false)
  const [predatOpen, setPredatOpen] = useState(false)
  const [upravitOpen, setUpravitOpen] = useState(false)
  const [vysledekOpen, setVysledekOpen] = useState(false)
  const [poznamkaOpen, setPoznamkaOpen] = useState(false)
  const [poznamka, setPoznamka] = useState('')
  const [stavMenuOpen, setStavMenuOpen] = useState(false)
  // Výchozí stav bereme ze záznamu, ať detail sedí se seznamem.
  const [stav, setStav] = useState<string>(
    () => prilezitostiData.find(r => r.id === id)?.stavPrilezitosti ?? STAVY_PRILEZITOSTI[0]
  )

  const p = prilezitostiData.find(r => r.id === id)
  if (!p) {
    return <div style={{ padding: 24, color: 'var(--t-textSecondary)' }}>Příležitost nenalezena.</div>
  }

  const [klientJmeno, klientEmail, klientTelefon] = p.klient.split('\n')

  // Nemovitost z nabídky, když pro ID existuje; jinak parametry z fallbacku.
  const nabidka = nabidkyData.find(n => n.id === p.idNabidky)
  const nemovitost = {
    ...NABIDKA_FALLBACK,
    adresa: nabidka?.adresa ?? NABIDKA_FALLBACK.adresa,
    cena: nabidka?.cena ?? NABIDKA_FALLBACK.cena,
    stav: nabidka?.stavNabidky ?? NABIDKA_FALLBACK.stav,
  }

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
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0, padding: '24px 0' }}>
              <div style={{ marginTop: 2 }}>
                <IconButton icon={ArrowLeft} variant="ghost" size="md" tooltip="Zpět na seznam" onClick={() => navigate('/obchod/prilezitosti')} />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, lineHeight: '32px', color: 'var(--t-textPrimary)', minWidth: 0 }}>
                Příležitost - {klientJmeno}
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
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Identita + kontakt */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                    <Avatar initials={getInitials(klientJmeno)} size="lg" color="dark" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>
                        {klientJmeno}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Tag label={stav} variant={stavPrilezitostiVariant(stav)} size="sm" lead="indicator" />
                        <Tag label={p.id} variant="neutral" size="sm" />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--t-borderPrimary)' }} />

                  {/* Fakta o příležitosti — kompaktní řádky ve dvou sloupcích */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    columnGap: 32, rowGap: 0,
                  }}>
                    <FactLine
                      icon={User}
                      label="Makléř"
                      value={p.makler}
                      action={<TextButton label="Předat" variant="brand" size="sm" leadIcon={RefreshCw} onClick={() => setPredatOpen(true)} />}
                    />
                    <FactLine icon={Globe} label="Zdroj příležitosti" value={p.zdroj} />
                    <FactLine icon={Phone} label="Telefon" value={klientTelefon} href={`tel:${klientTelefon.replace(/\s/g, '')}`} />
                    <FactLine icon={Mail} label="E-mail" value={klientEmail} href={`mailto:${klientEmail}`} />
                    <FactLine icon={CalendarClock} label="Přišla" value={formatDatumCas(p.datumVytvoreni)} />
                    <FactLine icon={Clock} label="Poslední kontakt" value={formatPosledniKontakt(p.datumPosledniZmeny)} />
                  </div>
                </div>
              </div>

              {/* Zájem o hypotéku — dokud není odeslaný lead, stojí tady dotaz */}
              {!hypoLead && !hypoOdmitnuto && (
                <Alert
                  variant="warning"
                  rich
                  icon={CircleDollarSign}
                  label="Má klient zájem o hypotéku?"
                  description="Vyžaduje odpověď - při zájmu doplníte částky a lead odejde finančnímu poradci."
                  actions={[
                    { label: 'Ano, odeslat lead', variant: 'warning', leadIcon: Send, onClick: () => setHypoModalOpen(true) },
                    { label: 'Nemá zájem', variant: 'secondary', onClick: () => setHypoOdmitnuto(new Date()) },
                  ]}
                />
              )}

              {/* Odmítnutí není konec — klient si to může rozmyslet, lead jde
                  odeslat i po zamítnutí. */}
              {!hypoLead && hypoOdmitnuto && (
                <Alert
                  variant="neutral-subtle"
                  rich
                  icon={CircleDollarSign}
                  label="Klient nemá zájem o hypotéku"
                  description={`Zaznamenáno ${formatDateCas(hypoOdmitnuto)}. Pokud si to klient rozmyslí, lead můžete odeslat i teď.`}
                  actions={[
                    { label: 'Přesto odeslat lead', variant: 'secondary', leadIcon: Send, onClick: () => setHypoModalOpen(true) },
                  ]}
                />
              )}

              {/* Odeslaný lead — přehled odeslání a stavy vyřizování z myDOCKu */}
              {hypoLead && (
                <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ ...WIDGET_TITLE, minWidth: 0 }}>Lead na hypotéku</span>
                      <Tag label="V řešení" variant="info" size="sm" lead="indicator" />
                    </div>
                    <TextButton
                      label="Upravit lead"
                      variant="brand"
                      size="sm"
                      leadIcon={Pencil}
                      onClick={() => setHypoModalOpen(true)}
                    />
                  </div>

                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Kdy, komu a s jakými částkami lead odešel */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      columnGap: 32, rowGap: 0,
                    }}>
                      <FactLine icon={Send} label="Odesláno" value={formatDateCas(hypoLead.odeslano)} />
                      <FactLine icon={UserCheck} label="Přiděleno" value={hypoLead.prijemce} />
                      <FactLine icon={Wallet} label="Kupní cena" value={formatCena(hypoLead.kupniCena)} />
                      <FactLine icon={PiggyBank} label="Vlastní zdroje" value={formatCena(hypoLead.vlastniZdroje)} />
                      <FactLine
                        icon={Landmark}
                        label="Výše úvěru"
                        value={`${formatCena(hypoLead.vyseUveru)}${hypoLead.kupniCena > 0
                          ? ` · LTV ${Math.round((hypoLead.vyseUveru / hypoLead.kupniCena) * 100)} %`
                          : ''}`}
                      />
                      <FactLine
                        icon={Building2}
                        label="Přiřazení"
                        value={hypoLead.prirazeni === 'hsp' ? 'Poradce z HSP' : 'Číslo poradce'}
                      />
                    </div>

                    {hypoLead.poznamka.trim() && (
                      <div style={{
                        background: 'var(--t-bgSecondary)', borderRadius: 8, padding: '8px 12px',
                        fontSize: 13, lineHeight: '20px', color: 'var(--t-textSecondary)', whiteSpace: 'pre-wrap',
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--t-textPrimary)' }}>Poznámka pro poradce: </span>
                        {hypoLead.poznamka}
                      </div>
                    )}

                    {/* Stav vyřizování — cizí data, myBRIK je jen zobrazuje */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--t-borderPrimary)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                        <span style={GROUP_LABEL}>Stav vyřizování</span>
                        <span style={META_TEXT}>Načteno z myDOCK · {formatDateCas(hypoLead.odeslano)}</span>
                      </div>
                      {hypoPrubeh(hypoLead.odeslano).map(krok => (
                        <HypoKrokRow key={krok.label} krok={krok} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Zpráva od klienta */}
              <Widget
                title="Zpráva od klienta"
                action={<TextButton label="Odpovědět" variant="brand" leadIcon={Mail} onClick={() => setOdpovedOpen(true)} />}
                meta={
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ ...META_TEXT, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={13} style={{ flexShrink: 0 }} />
                      Doručeno: <span style={{ fontWeight: 600, color: 'var(--t-textPrimary)' }}>{formatDatumCas(p.datumVytvoreni)}</span>
                    </span>
                    <span style={{ ...META_TEXT, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Globe size={13} style={{ flexShrink: 0 }} />
                      Kanál: <span style={{ fontWeight: 600, color: 'var(--t-textPrimary)' }}>{p.typKontaktu} ({p.zdroj})</span>
                    </span>
                  </div>
                }
              >
                <ZpravaKlienta text={zpravaKlienta(p.id, klientJmeno, p.nazevNabidky)} />
              </Widget>

              {/* Nemovitost, na kterou příležitost reaguje */}
              <Widget
                title="Reaguje na nabídku"
                action={<Tag label={`ID ${p.idNabidky}`} variant="neutral" size="sm" />}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <img
                    src={nemovitost.foto}
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
                    <span style={{ ...META_TEXT, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} style={{ flexShrink: 0 }} />
                      {nemovitost.adresa}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 700, lineHeight: '28px', color: 'var(--t-textPrimary)', letterSpacing: '-0.3px' }}>
                      {formatCena(nemovitost.cena)}
                    </span>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 2 }}>
                      <InlineFact icon={Maximize2} label="Plocha" value={nemovitost.plocha} />
                      <InlineFact icon={KeyRound} label="Vlastnictví" value={nemovitost.vlastnictvi} />
                      <InlineFact icon={CircleDot} label="Stav" value={nemovitost.stav} />
                      <InlineFact icon={MessageSquare} label="Příležitostí" value={String(nemovitost.prilezitosti)} />
                    </div>
                  </div>
                </div>
              </Widget>

              {/* Agenda a komunikace */}
              <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={WIDGET_TITLE}>Agenda a komunikace</span>
                  <TooltipIcon
                    content="Úkoly se uzavírají odškrtnutím. U schůzky se vždy zadává výsledek (proběhla, neproběhla, zrušena nebo přesunuta), který se uloží do historie."
                    placement="right"
                  />
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
                          {historieOpen && historieStarsi.map(item => (
                            <AgendaRow key={item.id} item={item} onVysledek={() => setVysledekOpen(true)} />
                          ))}
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

              </div>
            </div>

            {/* ── Pravý panel ─────────────────────────────────────────── */}
            <div style={{ position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Stav a akce */}
            <div style={{ ...CARD, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Stav příležitosti */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ ...WIDGET_TITLE, minWidth: 0 }}>Stav příležitosti</span>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <TextButton label="Změnit" variant="brand" size="sm" leadIcon={RefreshCw} onClick={() => setStavMenuOpen(v => !v)} />
                    {stavMenuOpen && (
                      <>
                        <div onClick={() => setStavMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 21 }}>
                          <Menu width={240}>
                            <MenuHeading label="Stav příležitosti" />
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
                  <Tag label={stav} variant={stavPrilezitostiVariant(stav)} size="md" lead="indicator" />
                </div>
              </div>

              {([
                {
                  title: 'Komunikace',
                  actions: [
                    { icon: Pencil, label: 'Zapsat komunikaci', onClick: () => setKomunikaceOpen(true) },
                    { icon: Mail, label: 'Odeslat e-mail', onClick: () => setEmailOpen(true) },
                    { icon: Smartphone, label: 'Odeslat SMS', onClick: () => setSmsOpen(true) },
                    // Volání obsluhuje telefon uživatele, ne formulář v aplikaci.
                    { icon: Phone, label: 'Zavolat', href: telHref(klientTelefon) },
                  ],
                },
                {
                  title: 'Plánování',
                  actions: [
                    { icon: Calendar, label: 'Naplánovat prohlídku', onClick: () => setProhlidkaOpen(true) },
                    { icon: CheckSquare, label: 'Naplánovat úkol', onClick: () => setUkolOpen(true) },
                  ],
                },
                {
                  title: 'Správa',
                  actions: [
                    { icon: Pencil, label: 'Upravit příležitost', onClick: () => setUpravitOpen(true) },
                    { icon: StickyNote, label: 'Interní poznámka', onClick: () => setPoznamkaOpen(true) },
                  ],
                },
              ] as { title: string; actions: { icon: LucideIcon; label: string; href?: string; onClick?: () => void }[] }[]).map(group => (
                <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{
                    fontSize: 16, fontWeight: 700, lineHeight: '24px',
                    color: 'var(--t-textPrimary)', padding: '0 2px', marginBottom: 4,
                  }}>{group.title}</span>
                  {group.actions.map(a => (
                    <RailAction key={a.label} icon={a.icon} label={a.label} href={a.href} onClick={a.onClick} />
                  ))}
                </div>
              ))}

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

            {/* Souhrn — propojené záznamy jako rekapitulace, oddělená karta pod akcemi */}
            <div style={{ ...CARD, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={WIDGET_TITLE}>Propojené záznamy</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SummaryListItem
                  label="Nabídka"
                  length="short"
                  align="right"
                  value={{ kind: 'action', label: String(p.idNabidky), onClick: () => navigate(`/nabidky/${p.idNabidky}`) }}
                />
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SummaryListItem
                  label="Poptávka"
                  length="short"
                  align="right"
                  value={{ kind: 'action', label: p.idPoptavky, onClick: () => navigate('/obchod/poptavky') }}
                />
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SummaryListItem
                  label="Pobočka"
                  length="short"
                  align="right"
                  value={{ kind: 'text', text: p.pobocka }}
                />
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {komunikaceOpen && (
        <ZapsatKomunikaceModal
          onClose={() => setKomunikaceOpen(false)}
          onSave={navazujici => {
            if (navazujici === 'ukol') setUkolOpen(true)
            if (navazujici === 'prohlidka') setProhlidkaOpen(true)
          }}
        />
      )}
      {prohlidkaOpen && <NovyProhlidkaModal onClose={() => setProhlidkaOpen(false)} />}
      {ukolOpen && <NovyUkolModal defaultResitel={p.makler} onClose={() => setUkolOpen(false)} />}
      {smsOpen && (
        <OdeslatSmsModal
          telefon={klientTelefon}
          klient={klientJmeno}
          onClose={() => setSmsOpen(false)}
        />
      )}
      {emailOpen && (
        <OdeslatEmailModal
          email={klientEmail}
          klient={klientJmeno}
          onClose={() => setEmailOpen(false)}
        />
      )}
      {odpovedOpen && (
        <OdeslatEmailModal
          title="Odpovědět na zprávu"
          email={klientEmail}
          klient={klientJmeno}
          defaultPredmet={`Re: ${p.nazevNabidky}`}
          onClose={() => setOdpovedOpen(false)}
        />
      )}
      {hypoModalOpen && (
        <OdeslatLeadHypoModal
          cenaNemovitosti={nemovitost.cena}
          hsp={p.franchiza}
          klient={klientJmeno}
          initial={hypoLead ?? undefined}
          onClose={() => setHypoModalOpen(false)}
          onSend={lead => {
            // Úprava drží původní čas odeslání - lead se posílá jednou.
            setHypoLead(prev => ({ ...lead, odeslano: prev?.odeslano ?? new Date() }))
            setHypoOdmitnuto(null)
          }}
        />
      )}
      {predatOpen && <ZmenitMaklereModal currentMakler={p.makler} onClose={() => setPredatOpen(false)} />}
      {upravitOpen && (
        <PrilezitostPanel
          nabidka={nabidka}
          initial={{
            telefon: klientTelefon,
            email: klientEmail,
            jmeno: klientJmeno.split(' ')[0],
            prijmeni: klientJmeno.split(' ').slice(1).join(' '),
            pobocka: p.pobocka,
            makler: p.makler,
          }}
          onClose={() => setUpravitOpen(false)}
        />
      )}
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
