import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Pencil, Download, Mail, Phone, Plus, Trash2,
  Folder, FolderOpen, Upload,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, X,
  Maximize2, Building2, Clock, Hammer, KeyRound, ShieldCheck, Tag as TagIcon, Calendar, Home,
  RefreshCw, TrendingUp, Coins, FileText, PenLine, CalendarCheck, CalendarClock,
  Share2, Users, Landmark, User, StickyNote,
  CircleCheck, CircleX, Circle,
  ExternalLink, MailX,
  type LucideIcon,
} from 'lucide-react'
import {
  IconButton, TableHeaderCell, TableCell, Tag,
  Avatar, TextButton, Menu, MenuItem, FilterSelect, FilterButton, Dialog, Search, Breadcrumbs,
  Toggle, typography, LineTabGroup, PillTabGroup,
} from '@matusgallo/mysabds'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { nabidkyData } from '../../data/mockData'
import OdeslatHypotekariModal from '../../components/nabidky/OdeslatHypotekariModal'
import InterniPoznamkaModal from '../../components/nabidky/InterniPoznamkaModal'
import NovyNakladModal from '../../components/nabidky/NovyNakladModal'
import OstatniTokModal, { type OstatniTokFormData } from '../../components/nabidky/OstatniTokModal'
import NahratDokumentyModal from '../../components/nabidky/NahratDokumentyModal'
import VyporadaniPlateb from '../../components/nabidky/VyporadaniPlateb'
import AutomatickeStatistikyModal, {
  type StatsAutoSettings, defaultStatsSettings, statsSummaryLabel,
} from '../../components/nabidky/AutomatickeStatistikyModal'
import EmptyState from '../../components/shared/EmptyState'
import NovaNabidkaForm from '../../components/nabidky/NovaNabidkaForm'
import { nabidkaToFormData } from '../../components/nabidky/nabidkaToFormData'
import PrilezitostiNabidky, {
  type PrilezitostiSubTab, NABIDKA_PARY, NABIDKA_PRILEZITOSTI, PRILEZITOST_POSLEDNI,
} from '../../components/nabidky/PrilezitostiNabidky'
import PrilezitostPanel from '../../components/obchod/PrilezitostPanel'

interface OstatniTokRow {
  id: number
  typ: 'prijem' | 'vydaj'
  datum: string
  vs: string
  castka: number
  poznamka: string
}

const KATASTRY = [
  'Brno-město', 'Brno-Žabovřesky', 'Brno-Královo Pole', 'Brno-Bohunice', 'Brno-Líšeň',
  'Praha 1', 'Praha 2', 'Praha 3', 'Praha 4', 'Praha 5', 'Praha 6', 'Praha 7', 'Praha 8',
  'Olomouc-město', 'Plzeň 1', 'Plzeň 2', 'Plzeň 3', 'Plzeň 4',
  'Ostrava-jih', 'Ostrava-Poruba', 'Ostrava-město',
  'Hradec Králové', 'České Budějovice', 'Liberec', 'Pardubice', 'Zlín', 'Jihlava',
  'Mladá Boleslav', 'Karlovy Vary', 'Příbram', 'Tábor', 'Český Krumlov',
]

const OSTATNI_TOKY_INITIAL: OstatniTokRow[] = [
  { id: 1, typ: 'prijem', datum: '31.05.2026', vs: '22', castka: 22, poznamka: 'Test' },
  { id: 2, typ: 'vydaj', datum: '03.06.2026', vs: '222', castka: 222, poznamka: '232' },
]

function rowToTokForm(r: OstatniTokRow): OstatniTokFormData {
  return { typ: r.typ, datum: r.datum, vs: r.vs, castka: String(r.castka), poznamka: r.poznamka }
}

// ── Mock photos ───────────────────────────────────────────────────────────────

const NABIDKA_PHOTOS = [
  // Exteriér domu
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&h=1100&fit=crop&auto=format&q=80',
  // Obývací pokoj
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&h=1100&fit=crop&auto=format&q=80',
  // Kuchyně
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=1100&fit=crop&auto=format&q=80',
  // Ložnice
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&h=1100&fit=crop&auto=format&q=80',
  // Koupelna
  'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=1100&fit=crop&auto=format&q=80',
  // Zahrada
  'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=1600&h=1100&fit=crop&auto=format&q=80',
  // Pohled na dům s bazénem
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&h=1100&fit=crop&auto=format&q=80',
  // Jídelna
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=1100&fit=crop&auto=format&q=80',
]

// ── Mock detail data ──────────────────────────────────────────────────────────

const MOCK_DETAIL = {
  vlastnictvi: 'Osobní',
  stavNemovitosti: 'Velmi dobrý',
  budova: 'Dřevěná',
  uzitnaPocha: 100,
  platnostRS: '15.12.2026',
  platnostZS: '30.06.2027',
  typTransakce: 'Prodej',
  provizeBezDPH: 10000,
  provizeSdph: 12100,
  podlehaDPH: true,
  maklerJmeno: 'Dominik Bránka',
  maklerEmail: 'beta_dominik.branka@blogic.cz',
  maklerTelefon: '+420 739 437 184',
  popis: 'Nabídka nemovitosti s výbornou dopravní dostupností a infrastrukturou v okolí.',
  garaz: false,
  balkon: false,
  terasa: false,
  vybaveniBytu: true,
  vytah: false,
  bezbarierovy: false,
  rokKolaudace: null as string | null,
  rokRekonstrukce: null as string | null,
  ochrana: 'Ochranné pásmo',
  umisteni: null as string | null,
  podzemPodlazi: null as string | null,
  energetickaTrida: 'G – Mimořádně nehospodárná',
  ukEnergeticke: null as string | null,
  dleVyhlasky: 'Č. 148/2007 Sb.',
  matterport: null as string | null,
  youtube: null as string | null,
  klientJmeno: 'Tonda Vmáčka',
  klientTelefon: '777 888 999',
  klientEmail: 'dominik.branka@blogic.cz',
  klientAdresa: '',
}

const KONTAKTNI_OSOBY = [
  { jmeno: 'Petra Nováková', telefon: '776 123 456', email: 'petra.novakova@blogic.cz' },
  { jmeno: 'Martin Dvořák', telefon: '608 987 321', email: 'martin.dvorak@blogic.cz' },
  { jmeno: 'Lucie Svobodová', telefon: '721 555 044', email: 'lucie.svobodova@blogic.cz' },
]

interface ExportServer {
  name: string
  enabled: boolean
  healthy: boolean
  url: string | null
  domain: string
  logo: string
}

const EXPORT_SERVERS_INITIAL: ExportServer[] = [
  { name: 'Sreality.cz',   enabled: true,  healthy: true,  url: 'https://www.sreality.cz/detail/prodej/dum/rodinny/mybrik/1234567', domain: 'sreality.cz',       logo: '/portal-logos/sreality.ico' },
  { name: 'Realitymix.cz', enabled: true,  healthy: true,  url: 'https://www.realitymix.cz/nemovitost/1234567',                       domain: 'realitymix.cz',     logo: '/portal-logos/realitymix.png' },
  { name: 'Bazoš.cz',      enabled: true,  healthy: false, url: null,                                                                  domain: 'bazos.cz',          logo: '/portal-logos/bazos.png' },
  { name: 'Realingo',      enabled: true,  healthy: true,  url: 'https://www.realingo.cz/nemovitost/1234567',                          domain: 'realingo.cz',       logo: '/portal-logos/realingo.ico' },
  { name: 'Reality iDnes', enabled: false, healthy: true,  url: null,                                                                  domain: 'reality.idnes.cz', logo: '/portal-logos/reality-idnes.ico' },
  { name: 'České reality', enabled: false, healthy: true,  url: null,                                                                  domain: 'ceskereality.cz',   logo: '/portal-logos/ceske-reality.ico' },
  { name: 'Eurobydlení',   enabled: true,  healthy: true,  url: 'https://www.eurobydleni.cz/nemovitost/1234567',                       domain: 'eurobydleni.cz',    logo: '/portal-logos/eurobydleni.png' },
  { name: 'B3 Technology', enabled: false, healthy: true,  url: null,                                                                  domain: 'b3.cz',             logo: '/portal-logos/b3-technology.png' },
  { name: 'Reality.cz',    enabled: true,  healthy: true,  url: 'https://www.reality.cz/nemovitost/1234567',                           domain: 'reality.cz',        logo: '/portal-logos/reality-cz.png' },
  { name: 'Bezrealitky.cz',enabled: false, healthy: true,  url: null,                                                                  domain: 'bezrealitky.cz',    logo: '/portal-logos/bezrealitky.png' },
  { name: 'Sbazar.cz',     enabled: true,  healthy: true,  url: 'https://www.sbazar.cz/nemovitost/1234567',                            domain: 'sbazar.cz',         logo: '/portal-logos/sbazar.png' },
  { name: 'RealCity.cz',   enabled: false, healthy: true,  url: null,                                                                  domain: 'realcity.cz',       logo: '/portal-logos/realcity.png' },
  { name: 'Nemovitosti.cz',enabled: true,  healthy: true,  url: 'https://www.nemovitosti.cz/nemovitost/1234567',                       domain: 'nemovitosti.cz',    logo: '/portal-logos/nemovitosti.png' },
  { name: 'Reality24.cz',  enabled: false, healthy: true,  url: null,                                                                  domain: 'reality24.cz',      logo: '/portal-logos/reality24.png' },
  { name: 'Hyperreality.cz',enabled: false,healthy: true,  url: null,                                                                  domain: 'hyperreality.cz',   logo: '/portal-logos/hyperreality.png' },
]

// ── Statistiky exportů — deterministická mock data po jednotlivých realitkách ──
const STATS_DEFAULT_FROM = '2026-06-14'
const STATS_DEFAULT_TO = '2026-07-14'
const STATS_MAX_DAYS = 370
const STATS_DNI_V_NABIDCE = 19

// Průměrná denní intenzita zobrazení + počet zájmů pro každý portál.
// Vypnuté nebo nezdravé portály nic negenerují (intensity 0).
const PORTAL_STATS: Record<string, { intensity: number; interesty: number }> = {
  'Sreality.cz':   { intensity: 15, interesty: 2 },
  'Realitymix.cz': { intensity: 7,  interesty: 0 },
  'Bazoš.cz':      { intensity: 0,  interesty: 0 },
  'Realingo':      { intensity: 5,  interesty: 0 },
  'Reality iDnes': { intensity: 0,  interesty: 0 },
  'České reality': { intensity: 0,  interesty: 0 },
  'Eurobydlení':   { intensity: 4,  interesty: 1 },
  'B3 Technology': { intensity: 0,  interesty: 0 },
  'Reality.cz':    { intensity: 6,  interesty: 1 },
  'Bezrealitky.cz':{ intensity: 0,  interesty: 0 },
  'Sbazar.cz':     { intensity: 9,  interesty: 1 },
  'RealCity.cz':   { intensity: 0,  interesty: 0 },
  'Nemovitosti.cz':{ intensity: 3,  interesty: 0 },
  'Reality24.cz':  { intensity: 0,  interesty: 0 },
  'Hyperreality.cz':{ intensity: 0, interesty: 0 },
}

// Deterministický pseudonáhodný šum 0..1 z celočíselného semínka.
function statsNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// ISO (yyyy-mm-dd) → Date v lokálním čase; číslo dne od epochy (semínko pro šum).
function statsParseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function statsEpochDay(d: Date): number {
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000)
}
function statsFmtCz(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}
function statsFmtDen(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.`
}

// Seznam dní v rozsahu od–do (včetně krajů), s pojistkou proti prohození a délce.
function statsDaysInRange(from: Date, to: Date): Date[] {
  const start = from <= to ? from : to
  const end = from <= to ? to : from
  const out: Date[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  while (cur <= end && out.length < STATS_MAX_DAYS) {
    out.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// Zobrazení daného portálu pro konkrétní den — deterministicky z názvu a data.
function portalViewForDay(name: string, epochDay: number): number {
  const meta = PORTAL_STATS[name]
  if (!meta || meta.intensity === 0) return 0
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  const base = meta.intensity
  const wobble = (statsNoise(h + epochDay * 7.13) - 0.5) * base * 1.1
  const spike = statsNoise(h + epochDay * 3.37) > 0.93 ? base * 1.8 : 0
  return Math.max(0, Math.round(base + wobble + spike))
}

const fmtStatInt = (v: number) => v.toLocaleString('cs-CZ')
const fmtStatDec = (v: number) =>
  v.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Kompaktní tooltip grafu — datum + hodnota na jednom těsném řádku.
function StatsTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value?: number | string }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  const val = Number(payload[0].value ?? 0)
  return (
    <div style={{
      background: 'var(--t-bgPrimary)',
      border: '1px solid var(--t-borderPrimary)',
      borderRadius: 6,
      padding: '4px 8px',
      display: 'flex', alignItems: 'baseline', gap: 6,
      fontSize: 12, lineHeight: '16px', whiteSpace: 'nowrap',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    }}>
      <span style={{ color: 'var(--t-textSecondary)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#E05524' }}>{fmtStatInt(val)}</span>
      <span style={{ color: 'var(--t-textSecondary)' }}>zobrazení</span>
    </div>
  )
}

// Žebříček portálů — odvozený z PORTAL_STATS (stejný zdroj jako graf).
// Zobrazují se jen portály s nenulovým výkonem, seřazené podle celkových zobrazení.
interface ZebricekRow {
  server: string
  logo: string
  dni: number
  den: number
  celkem: number
}

const ZEBRICKY_ROWS: ZebricekRow[] = EXPORT_SERVERS_INITIAL
  .map(s => {
    const meta = PORTAL_STATS[s.name] ?? { intensity: 0, interesty: 0 }
    const den = meta.intensity
    return {
      server: s.name,
      logo: s.logo,
      dni: den > 0 ? STATS_DNI_V_NABIDCE : 0,
      den,
      celkem: Math.round(den * STATS_DNI_V_NABIDCE),
    }
  })
  .filter(r => r.celkem > 0)
  .sort((a, b) => b.celkem - a.celkem)

// Barevný tón záznamu v historii exportu — odvozený z textu popisu.
// Chyba → červená (zvýrazněná karta), smazání → neutrální, ostatní úspěšné akce → zelená.
type ExportLogKind = 'error' | 'neutral' | 'success'
function exportLogTone(popis: string): { kind: ExportLogKind; color: string } {
  const p = popis.toLowerCase()
  if (p.includes('chyb') || p.includes('selh') || p.includes('nezdař') || p.includes('neúspěš')) {
    return { kind: 'error', color: '#DC2626' }
  }
  if (p.includes('smaz')) return { kind: 'neutral', color: 'var(--t-textTertiary)' }
  return { kind: 'success', color: '#16A34A' }
}

const EXPORT_HISTORY_ROWS = [
  { datum: '04.11.2024 14:59', server: 'Sreality', logo: '/portal-logos/sreality.ico',      popis: 'Smazání proběhlo v pořádku' },
  { datum: '04.11.2024 14:59', server: 'Idnes',    logo: '/portal-logos/reality-idnes.ico', popis: 'Smazání nabídky bylo úspěšné [572]' },
  { datum: '24.10.2024 11:53', server: 'Sreality', logo: '/portal-logos/sreality.ico',      popis: 'Topování proběhlo v pořádku' },
  { datum: '21.10.2024 20:53', server: 'Sreality', logo: '/portal-logos/sreality.ico',      popis: 'Export nabídky [21324056] proběhl v pořádku' },
  { datum: '21.10.2024 20:53', server: 'Idnes',    logo: '/portal-logos/reality-idnes.ico', popis: 'Export nabídky proběhl v pořádku [10424315]' },
  { datum: '20.10.2024 09:12', server: 'Bazoš',    logo: '/portal-logos/bazos.png',         popis: 'Export nabídky selhal - chybí povinné pole „Cena"' },
  { datum: '18.10.2024 16:41', server: 'Reality MIX', logo: '/portal-logos/realitymix.png', popis: 'Export nabídky proběhl v pořádku [88213]' },
  { datum: '15.10.2024 08:05', server: 'Sbazar',   logo: '/portal-logos/sbazar.png',        popis: 'Export nabídky proběhl v pořádku [55201]' },
  { datum: '14.10.2024 22:30', server: 'Idnes',    logo: '/portal-logos/reality-idnes.ico', popis: 'Aktualizace nabídky proběhla v pořádku' },
  { datum: '12.10.2024 11:18', server: 'Eurobydlení', logo: '/portal-logos/eurobydleni.png', popis: 'Export nabídky selhal - nedostupné API portálu' },
  { datum: '10.10.2024 13:47', server: 'Sreality', logo: '/portal-logos/sreality.ico',      popis: 'Aktualizace ceny proběhla v pořádku' },
  { datum: '08.10.2024 07:59', server: 'Realingo', logo: '/portal-logos/realingo.ico',      popis: 'Export nabídky proběhl v pořádku [40118]' },
  { datum: '05.10.2024 19:22', server: 'Sreality', logo: '/portal-logos/sreality.ico',      popis: 'První export nabídky proběhl v pořádku [21324056]' },
]

const HISTORY_PAGE_SIZE = 7

// Počet chybových záznamů v historii exportu — pro badge u filtru a signalizaci chyby.
const EXPORT_HISTORY_ERROR_COUNT = EXPORT_HISTORY_ROWS.filter(
  r => exportLogTone(r.popis).kind === 'error',
).length

interface DokFolderNode {
  id: string
  name: string
  count: number
  children?: DokFolderNode[]
}

const DOK_TREE: DokFolderNode[] = [
  {
    id: 'nabidka', name: 'Nabídka nemovitosti', count: 0,
    children: [
      { id: 'naberovy-list', name: 'Náběrový list', count: 0 },
      { id: 'zprostredkovatelska', name: 'Zprostředkovatelská smlouva', count: 0 },
      { id: 'dodatek-zprostredkovatelska', name: 'Dodatek ke zprostředkovatelské smlouvě', count: 0 },
      { id: 'list-vlastnictvi', name: 'List vlastnictví', count: 0 },
      { id: 'gdpr', name: 'GDPR', count: 0 },
      { id: 'aml', name: 'AML', count: 0 },
      { id: 'vypis-or', name: 'Výpis z OR', count: 0 },
      { id: 'plna-moc', name: 'Plná moc', count: 0 },
      { id: 'kopie-op', name: 'Kopie OP', count: 0 },
      { id: 'dohoda-narovnani', name: 'Dohoda o narovnání', count: 0 },
      { id: 'cenova-mapa', name: 'Cenová mapa', count: 0 },
    ],
  },
  { id: 'rezervace', name: 'Rezervace nemovitosti', count: 0 },
  { id: 'prevod', name: 'Převod / pronájem nemovitosti', count: 0 },
  { id: 'nakladove', name: 'Nákladové položky', count: 0 },
  { id: 'ostatni', name: 'Ostatní', count: 0 },
  { id: 'kos', name: 'Koš', count: 0 },
]

function dokFindFolder(nodes: DokFolderNode[], id: string): DokFolderNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = dokFindFolder(n.children, id)
      if (found) return found
    }
  }
}

function dokGetAncestors(nodes: DokFolderNode[], id: string, path: DokFolderNode[] = []): DokFolderNode[] {
  for (const n of nodes) {
    if (n.id === id) return [...path, n]
    if (n.children) {
      const result = dokGetAncestors(n.children, id, [...path, n])
      if (result.length) return result
    }
  }
  return []
}


// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCena(cena: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(cena)
}

type TagVariant = 'neutral' | 'outline' | 'invert' | 'brand' | 'info' | 'success' | 'warning' | 'danger'

function stavVariant(stav: string): TagVariant {
  const s = stav.toLowerCase()
  if (s === 'aktivní') return 'brand'
  if (s === 'podepsaná smlouva' || s === 'zobchodováno') return 'success'
  if (s.includes('storno') || s.includes('spor') || s === 'rezervace zrušeno') return 'danger'
  if (s.startsWith('v převodu') || s === 'rezervace') return 'warning'
  return 'neutral'
}


function getInitials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

// Avatary jsou neutrální — jednotná tmavá barva místo náhodně barevných.
function getAvatarColor(_name: string): 'dark' {
  return 'dark'
}

// ── Sub-components ────────────────────────────────────────────────────────────

// DD.MM.YYYY → Date (lokální půlnoc). null pro neplatný/prázdný vstup.
function parseCzDate(s: string): Date | null {
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}

type ValidityState = 'ok' | 'warning' | 'danger'

// Stav platnosti: po termínu = danger, do 3 dnů před = warning, jinak ok.
function validityState(value: string): { state: ValidityState; days: number | null } {
  const dt = parseCzDate(value)
  if (!dt) return { state: 'ok', days: null }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((dt.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return { state: 'danger', days }
  if (days <= 3) return { state: 'warning', days }
  return { state: 'ok', days }
}

const VALIDITY_PALETTE: Record<ValidityState, {
  accent: string; iconBg: string; border: string; cardBg: string
}> = {
  ok:      { accent: 'var(--t-textMyDOCKPrimary)', iconBg: 'var(--t-bgMyDOCKTertiary)', border: 'var(--t-borderPrimary)',   cardBg: 'var(--t-bgSecondary)' },
  warning: { accent: '#B45309',                    iconBg: 'rgba(245,158,11,0.16)',     border: 'rgba(245,158,11,0.5)',      cardBg: 'rgba(245,158,11,0.08)' },
  danger:  { accent: '#DC2626',                    iconBg: 'rgba(220,38,38,0.14)',      border: 'rgba(220,38,38,0.5)',       cardBg: 'rgba(220,38,38,0.07)' },
}

// Stav platnosti (RS / ZS) → barva hodnoty a poznámka podle blížícího se / prošlého termínu.
function validityFact(value: string): { valueColor: string; note: string | null } {
  const { state, days } = validityState(value)
  const c = VALIDITY_PALETTE[state]
  const note =
    state === 'danger' ? (days === -1 ? 'Po platnosti od včera' : `Po platnosti (${Math.abs(days ?? 0)} dní)`)
    : state === 'warning' ? (days === 0 ? 'Platnost končí dnes' : days === 1 ? 'Zbývá 1 den' : `Zbývají ${days} dny`)
    : null
  return { valueColor: state === 'ok' ? 'var(--t-textPrimary)' : c.accent, note }
}

// Kompaktní řádek faktu — ikona + popisek + hodnota na jednom řádku, hodnota hned
// za popiskem (pevná šířka popisku zarovná hodnoty ve sloupci). Volitelná barva a
// poznámka (využívá se u platnosti RS/ZS) se přidává jako drobný barevný dovětek.
function FactLine({ icon: Icon, label, value, valueColor, note }: {
  icon: LucideIcon; label: string; value: string; valueColor?: string; note?: string | null
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, padding: '5px 0' }}>
      <Icon size={15} style={{ color: 'var(--t-textSecondary)', flexShrink: 0 }} />
      <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--t-textSecondary)', flexShrink: 0, width: 132 }}>
        {label}
      </span>
      <span title={value} style={{
        fontSize: 13, fontWeight: 600, lineHeight: '18px',
        color: valueColor ?? 'var(--t-textPrimary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
      }}>
        {value}
        {note && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: valueColor }}>· {note}</span>}
      </span>
    </div>
  )
}

function QuickActionRow({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '6px 8px',
        background: hovered ? 'var(--t-bgHover)' : 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 150ms ease',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: 'var(--t-bgMyDOCKTertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} style={{ color: 'var(--t-textMyDOCKPrimary)' }} />
      </div>
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: 14, fontWeight: 500, lineHeight: '20px',
        color: 'var(--t-textPrimary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </button>
  )
}

function DashboardWidget({
  icon: Icon, title, onClick, action, children,
}: {
  icon: LucideIcon
  title: string
  onClick?: () => void
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        width: '100%',
        background: 'var(--t-bgPrimary)',
        border: '1px solid var(--t-borderPrimary)',
        borderRadius: 12,
        padding: 16,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} style={{ color: 'var(--t-textSecondary)', flexShrink: 0 }} />
          <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>
            {title}
          </span>
        </div>
        {action ?? (onClick && (
          <IconButton icon={ArrowRight} variant="ghost" size="sm" tooltip="Přejít" onClick={onClick} />
        ))}
      </div>
      <div>{children}</div>
    </div>
  )
}

type Segment = { label: string; count: number; color: string; onClick?: () => void }

// Rozložení jako seznam: řádek na stav (tečka + popisek vlevo, počet vpravo),
// pod ním souvislý skládaný pruh se zaoblenými konci.
function DistributionList({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0)
  const visible = segments.filter(s => s.count > 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {total > 0 && (
        <div style={{ display: 'flex', gap: 6, height: 8 }}>
          {visible.map(s => (
            <div
              key={s.label}
              title={`${s.label}: ${s.count}`}
              style={{ flexGrow: s.count, flexBasis: 0, minWidth: 6, background: s.color, borderRadius: 999 }}
            />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {segments.map((s, i) => (
          <div
            key={s.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              paddingBlock: 8,
              borderTop: i === 0 ? undefined : '1px solid var(--t-borderPrimary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1, color: 'var(--t-textPrimary)', flexShrink: 0 }}>
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Rozložení stavů podle vzoru grafu „Social / CPC / Organic":
// nahoře legenda ve sloupcích (tečka + popisek, pod tím „% / počet"),
// pod ní segmentový pruh s mezerami a zaoblenými konci, šířka podle podílu.
function DistributionChart({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0)
  const visible = segments.filter(s => s.count > 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {total > 0 && (
        <div style={{ display: 'flex', gap: 6, height: 8 }}>
          {visible.map(s => (
            <div
              key={s.label}
              title={`${s.label}: ${s.count}`}
              style={{ flexGrow: s.count, flexBasis: 0, minWidth: 6, background: s.color, borderRadius: 999 }}
            />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        {segments.map(s => {
          const pct = total ? Math.round((s.count / total) * 100) : 0
          const clickable = !!s.onClick && s.count > 0
          return (
            <div
              key={s.label}
              className={clickable ? 'dist-segment-clickable' : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              title={clickable ? `Zobrazit: ${s.label}` : undefined}
              onClick={clickable ? e => { e.stopPropagation(); s.onClick!() } : undefined}
              onKeyDown={clickable ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); s.onClick!() } } : undefined}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
                cursor: clickable ? 'pointer' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, flexShrink: 0 }} />
                <span className={clickable ? 'dist-label' : undefined} style={{ fontSize: 12, color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
                {clickable && <ChevronRight size={14} className="dist-chevron" style={{ color: 'var(--t-textSecondary)', flexShrink: 0 }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: 'var(--t-textPrimary)' }}>{s.count}</span>
                <span style={{ fontSize: 13, color: 'var(--t-textSecondary)' }}>/ {pct} %</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type ExportStatus = 'ok' | 'off' | 'error'
function serverStatus(s: ExportServer): ExportStatus {
  return !s.enabled ? 'off' : s.healthy ? 'ok' : 'error'
}
function ServerLogo({ logo, name }: { logo: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div style={{
        width: 24, height: 24, borderRadius: 6,
        background: 'var(--t-bgTertiary, #E5E7EB)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: 'var(--t-textSecondary)',
        flexShrink: 0,
      }}>
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={logo}
      alt=""
      width={24}
      height={24}
      onError={() => setFailed(true)}
      style={{
        width: 24, height: 24, borderRadius: 6,
        background: '#fff', border: '1px solid var(--t-borderPrimary)',
        objectFit: 'contain', padding: 2, flexShrink: 0,
      }}
    />
  )
}

// Portál logo jako lead ikona filtračního chipu (stejná loga jako v nastavení exportu).
// FilterSelect renderuje leadIcon jako <Icon style={{ width:16, height:16, ... }} />.
function makeLogoLeadIcon(logo: string, name: string): LucideIcon {
  const LogoLeadIcon = ({ style }: { style?: CSSProperties }) => (
    <img
      src={logo}
      alt=""
      title={name}
      style={{
        width: (style?.width as number) ?? 16,
        height: (style?.height as number) ?? 16,
        flexShrink: 0,
        objectFit: 'contain',
        borderRadius: 3,
      }}
    />
  )
  return LogoLeadIcon as unknown as LucideIcon
}

const LOGO_LEAD_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  EXPORT_SERVERS_INITIAL.map(s => [s.logo, makeLogoLeadIcon(s.logo, s.name)]),
)

function exportStatusBadge(status: ExportStatus): {
  label: string
  variant: 'success' | 'danger' | 'neutral'
  icon: LucideIcon
} {
  if (status === 'ok')    return { label: 'Exportováno',    variant: 'success', icon: CircleCheck }
  if (status === 'error') return { label: 'Chyba',  variant: 'danger',  icon: CircleX }
  return { label: 'Neexportuje se', variant: 'neutral', icon: Circle }
}

const PODPISY_LIST: Array<{ name: string; status: 'signed' | 'pending' }> = [
  { name: 'Rezervační smlouva', status: 'signed' },
  { name: 'Zprostředkovatelská', status: 'pending' },
]
const AGENDA_LIST: Array<{ typ: string; klient: string; datum: string; cas: string }> = [
  { typ: 'Prohlídka', klient: 'Jan Novák', datum: 'Út 28.10.2026', cas: '14:00' },
  { typ: 'Podpis smlouvy', klient: 'Eva Dvořáková', datum: 'Čt 30.10.2026', cas: '10:30' },
  { typ: 'Předání nemovitosti', klient: 'Petr Svoboda', datum: 'Po 03.11.2026', cas: '09:00' },
]
const NAKLADY_SUM = 8400
const PROVIZE_SUM = 10000

function WidgetExporty({ onTab, onError }: { onTab: (t: string) => void; onError: () => void }) {
  const exportCounts = EXPORT_SERVERS_INITIAL.reduce(
    (acc, s) => { acc[serverStatus(s)] += 1; return acc },
    { ok: 0, error: 0, off: 0 } as Record<ExportStatus, number>,
  )
  const exportSummary: Segment[] = [
    { label: 'Exportováno',    count: exportCounts.ok,    color: '#16A34A' },
    // Chyby jsou proklik do logu exportu s vyfiltrovaným chybovým stavem.
    { label: 'Chyba exportu',  count: exportCounts.error, color: 'var(--t-textDanger)', onClick: onError },
    { label: 'Neexportuje se', count: exportCounts.off,   color: 'var(--t-textSecondary)' },
  ]
  return (
    <DashboardWidget icon={Share2} title="Exporty" onClick={() => onTab('exporty')}>
      <DistributionChart segments={exportSummary} />
    </DashboardWidget>
  )
}

function WidgetStavHypoteky({ onTab }: { onTab: (t: string) => void }) {
  // Na jedné nemovitosti může běžet víc žádostí o hypotéku (víc klientů).
  // Widget dává jen souhrn — počet žádostí a jejich rozložení podle fáze.
  // Který klient je v jaké fázi řeší samostatný výpis na záložce hypotéky.
  const faze: Array<{ label: string; count: number }> = [
    { label: 'Schvalování v bance', count: 2 },
    { label: 'Schváleno',           count: 1 },
    { label: 'Sběr podkladů',       count: 1 },
  ]
  const celkem = faze.reduce((s, f) => s + f.count, 0)
  return (
    <DashboardWidget icon={Landmark} title="Stav hypotéky" onClick={() => onTab('hypoteka')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header — velké číslo vlevo, popis + stav vpravo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, color: 'var(--t-textPrimary)', flexShrink: 0 }}>
            {celkem}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: 'var(--t-textSecondary)' }}>žádosti o hypotéku</span>
            <Tag label="Řešeno sabem" variant="info" size="sm" lead="indicator" />
          </div>
        </div>

        {/* Rozpad podle fáze — boxy vedle sebe */}
        <div style={{ display: 'flex', gap: 8 }}>
          {faze.map(f => (
            <div key={f.label} style={{
              flex: 1, display: 'flex', flexDirection: 'column', gap: 4,
              padding: '10px 12px', borderRadius: 8, background: 'var(--t-bgSecondary)',
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: 'var(--t-textPrimary)' }}>{f.count}</span>
              <span style={{ fontSize: 12, color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardWidget>
  )
}

function WidgetNaklady({ onNaklad }: { onNaklad: () => void }) {
  const nakladyPct = Math.round((NAKLADY_SUM / PROVIZE_SUM) * 100)
  return (
    <DashboardWidget icon={Coins} title="Náklady" onClick={onNaklad}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: 'var(--t-textPrimary)' }}>
            {formatCena(NAKLADY_SUM)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>
            / {formatCena(PROVIZE_SUM)} provize
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--t-bgSecondary)', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, nakladyPct)}%`, height: '100%',
            background: nakladyPct > 80 ? '#DC2626' : '#E05524',
          }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>{nakladyPct} % z provize</span>
      </div>
    </DashboardWidget>
  )
}

// Příležitosti navázané na nabídku — souhrn ze stejných dat jako záložka „Příležitosti“.
function WidgetPrilezitosti({ onClick }: { onClick: () => void }) {
  const aktivni = NABIDKA_PRILEZITOSTI.filter(p => p.stavPrilezitosti === 'Aktivní').length
  const posledni = PRILEZITOST_POSLEDNI
  const posledniKlient = posledni ? posledni.klient.split('\n')[0] : ''
  return (
    <DashboardWidget icon={Users} title="Příležitosti" onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: 'var(--t-textPrimary)' }}>{aktivni}</span>
        <span style={{ fontSize: 13, color: 'var(--t-textSecondary)' }}>
          aktivní {NABIDKA_PRILEZITOSTI.length > aktivni ? `z ${NABIDKA_PRILEZITOSTI.length}` : ''}
        </span>
      </div>
      {posledni && (
        <div style={{ marginTop: 4, fontSize: 13, color: 'var(--t-textSecondary)' }}>
          Poslední: <span style={{ color: 'var(--t-textPrimary)', fontWeight: 500 }}>
            {posledniKlient} - {posledni.datumPosledniZmeny.split(' ')[0]}
          </span>
        </div>
      )}
    </DashboardWidget>
  )
}

function WidgetAgenda({ onTab }: { onTab: (t: string) => void }) {
  return (
    <DashboardWidget icon={Calendar} title="Agenda" onClick={() => onTab('zakladni')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AGENDA_LIST.slice(0, 3).map(a => (
          <div
            key={a.typ + a.datum}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
              background: 'var(--t-bgSecondary)',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{
                fontSize: 13, fontWeight: 600, color: 'var(--t-textPrimary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {a.typ}
              </span>
              <span style={{
                fontSize: 12, color: 'var(--t-textSecondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {a.klient}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-textPrimary)' }}>{a.datum}</span>
              <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>{a.cas}</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardWidget>
  )
}

function WidgetPary({ onClick }: { onClick: () => void }) {
  // Rozložení párů podle stavu: akční „Nezpracováno" červeně, odeslané zeleně,
  // zamítnuté neutrálně šedě. Počty jdou ze stejných dat jako záložka „Příležitosti".
  const pocet = (stav: string) => NABIDKA_PARY.filter(p => p.stav === stav).length
  const segments: Segment[] = [
    { label: 'Nezpracováno', count: pocet('Nezpracováno'), color: '#DC2626' },
    { label: 'Odesláno',     count: pocet('Odesláno'),     color: '#16A34A' },
    { label: 'Zamítnuto',    count: pocet('Zamítnuto'),    color: 'var(--t-textSecondary)' },
  ]
  return (
    <DashboardWidget icon={TrendingUp} title="Nejnovější páry" onClick={onClick}>
      <DistributionList segments={segments} />
    </DashboardWidget>
  )
}

function WidgetPodpisy({ onTab }: { onTab: (t: string) => void }) {
  return (
    <DashboardWidget icon={PenLine} title="Elektronické podpisy" onClick={() => onTab('dokumenty')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {PODPISY_LIST.map(p => (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8,
            background: 'var(--t-bgSecondary)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, flexShrink: 0,
              background: p.status === 'signed' ? '#16A34A' : '#F59E0B',
            }} />
            <span style={{ fontSize: 13, color: 'var(--t-textPrimary)' }}>{p.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--t-textSecondary)' }}>
              {p.status === 'signed' ? 'Podepsáno' : 'Čeká na podpis'}
            </span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  )
}

function QuickActionsColumn({ onEdit, onHypo, onNaklad, onDownloadPhotos, onPoznamka, showPoznamka, top }: { onEdit: () => void; onHypo: () => void; onNaklad: () => void; onDownloadPhotos: () => void; onPoznamka: () => void; showPoznamka: boolean; top: number }) {
  return (
    <div style={{
      width: '100%',
      background: 'var(--t-bgPrimary)',
      border: '1px solid var(--t-borderPrimary)',
      borderRadius: 12,
      padding: 16,
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top, alignSelf: 'flex-start',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ ...typography.subheadline18Semibold, color: 'var(--t-textPrimary)' }}>
          Akce na nabídce
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          {
            title: 'Správa',
            actions: [
              { icon: RefreshCw, label: 'Změnit stav',    onClick: () => {} },
              { icon: Pencil,    label: 'Upravit nabídku', onClick: onEdit },
              { icon: Coins,     label: 'Zadat náklad',    onClick: onNaklad },
              ...(showPoznamka ? [{ icon: StickyNote, label: 'Přidat interní poznámku', onClick: onPoznamka }] : []),
            ],
          },
          {
            title: 'Marketing',
            actions: [
              { icon: Mail,       label: 'Odeslat hypo', onClick: onHypo },
              { icon: TrendingUp, label: 'Topování',     onClick: () => {} },
            ],
          },
          {
            title: 'Dokumenty',
            actions: [
              { icon: Download, label: 'Stáhnout fotografie', onClick: onDownloadPhotos },
              { icon: FileText, label: 'List vlastnictví',    onClick: () => {} },
              { icon: PenLine,  label: 'Elektronický podpis', onClick: () => {} },
            ],
          },
        ].map(group => (
          <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{
              fontSize: 16, fontWeight: 700, lineHeight: '24px',
              color: 'var(--t-textPrimary)',
              padding: '0 2px', marginBottom: 4,
            }}>
              {group.title}
            </span>
            {group.actions.map(a => (
              <QuickActionRow
                key={a.label}
                icon={a.icon}
                label={a.label}
                onClick={a.onClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function DokCountBadge({ count }: { count: number }) {
  return (
    <div style={{
      height: 20, padding: '0 6px', flexShrink: 0,
      background: 'var(--t-bgPrimary)', borderRadius: 9999,
      outline: '1px solid var(--t-borderPrimary)', outlineOffset: -1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, lineHeight: '12px', color: 'var(--t-textPrimary)' }}>{count}</span>
    </div>
  )
}

function DokTreeItem({
  folder, depth = 0, selected, expanded, onSelect, onToggle,
}: {
  folder: DokFolderNode
  depth?: number
  selected: string | null
  expanded: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const isActive = selected === folder.id
  const isExpanded = expanded.has(folder.id)
  const hasChildren = (folder.children?.length ?? 0) > 0
  const Icon = hasChildren && isExpanded ? FolderOpen : Folder
  const indent = depth === 0 ? 0 : depth === 1 ? 20 : 48

  const bg = isActive ? 'var(--t-bgMyDOCKTertiary)' : hovered ? 'var(--t-bgHover)' : 'transparent'
  const iconColor = isActive ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textSecondary)'
  const textColor = isActive ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textPrimary)'

  return (
    <div>
      <button
        onClick={() => { onSelect(folder.id); if (hasChildren) onToggle(folder.id) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%', height: 32,
          paddingLeft: 12 + indent, paddingRight: 8,
          display: 'flex', alignItems: 'center', gap: 8,
          borderRadius: isActive || hovered ? 8 : 0,
          background: bg, border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        <Icon size={16} style={{ flexShrink: 0, color: iconColor }} />
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 500, lineHeight: '20px',
          color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {folder.name}
        </span>
        {hasChildren ? (
          <ChevronRight size={16} style={{
            flexShrink: 0, color: 'var(--t-textSecondary)',
            transform: isExpanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s',
          }} />
        ) : (
          <DokCountBadge count={folder.count} />
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map(child => (
            <DokTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selected={selected}
              expanded={expanded}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Widget({ children, padding = 16 }: { children: React.ReactNode; padding?: number | string }) {
  return (
    <div style={{
      background: 'var(--t-bgPrimary)',
      border: '1px solid var(--t-borderPrimary)',
      borderRadius: 12,
      padding,
    }}>
      {children}
    </div>
  )
}

function Section({ title, icon: Icon, action, children }: { title: string; icon?: LucideIcon; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {Icon && <Icon size={16} style={{ color: 'var(--t-textSecondary)', flexShrink: 0 }} />}
        <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>
          {title}
        </span>
        {action && <div style={{ marginLeft: 'auto', flexShrink: 0 }}>{action}</div>}
      </div>
      {children}
    </div>
  )
}

// Kontaktní údaje (e-mail + telefon) s ikonami — sdílené pro klienta i makléře.
function ContactInfo({ email, telefon }: { email: string; telefon: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, fontWeight: 400, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Mail size={14} style={{ flexShrink: 0 }} />
        {email}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Phone size={14} style={{ flexShrink: 0 }} />
        {telefon}
      </span>
    </div>
  )
}

// Jeden klient v seznamu — kompaktní řádek s avatarem a proklikem přes icon button.
function KlientRow({
  osoba, onClick,
}: {
  osoba: { jmeno: string; email: string; telefon: string }
  onClick: () => void
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px',
        background: 'var(--t-bgSecondary)',
        borderRadius: 8,
      }}
    >
      <Avatar initials={getInitials(osoba.jmeno)} size="lg" color={getAvatarColor(osoba.jmeno)} />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>
          {osoba.jmeno}
        </div>
        <ContactInfo email={osoba.email} telefon={osoba.telefon} />
      </div>
      <IconButton icon={ArrowRight} variant="ghost" size="md" tooltip="Přejít na klienta" onClick={onClick} />
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'zakladni', label: 'Základní informace' },
  { value: 'prilezitosti', label: 'Příležitosti' },
  { value: 'exporty', label: 'Exporty' },
  { value: 'finance', label: 'Finance' },
  { value: 'ostatni', label: 'Ostatní finanční toky' },
  { value: 'list', label: 'List vlastnictví' },
  { value: 'dokumenty', label: 'Dokumenty' },
  { value: 'hypoteka', label: 'Hypotéka' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NabidkaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState('zakladni')
  const [prilezitostiSubTab, setPrilezitostiSubTab] = useState<PrilezitostiSubTab>('prilezitosti')
  const [novaPrilezitostOpen, setNovaPrilezitostOpen] = useState(false)
  const [exportPortal, setExportPortal] = useState<string | null>(null)
  const [exportServers, setExportServers] = useState<ExportServer[]>(EXPORT_SERVERS_INITIAL)
  const [statsFrom, setStatsFrom] = useState(STATS_DEFAULT_FROM)
  const [statsTo, setStatsTo] = useState(STATS_DEFAULT_TO)
  const [statsDateOpen, setStatsDateOpen] = useState(false)
  const [exportPortalOpen, setExportPortalOpen] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'error'>('all')
  const [scrollHistoryPending, setScrollHistoryPending] = useState(false)
  const historyRef = useRef<HTMLDivElement>(null)
  const [statsSettings, setStatsSettings] = useState<StatsAutoSettings>(() => defaultStatsSettings({
    maklerJmeno: MOCK_DETAIL.maklerJmeno,
    maklerTelefon: MOCK_DETAIL.maklerTelefon,
    maklerEmail: MOCK_DETAIL.maklerEmail,
    maklerEmailKopie: MOCK_DETAIL.maklerEmail,
  }))
  const [statsModalOpen, setStatsModalOpen] = useState(false) // modal pro nastavení odesílání statistik
  const [dokSelected, setDokSelected] = useState<string | null>('nabidka')
  const [dokExpanded, setDokExpanded] = useState<Set<string>>(new Set(['nabidka']))
  const [nahratOpen, setNahratOpen] = useState(false)
  const [internalNote, setInternalNote] = useState('')
  const [poznamkaOpen, setPoznamkaOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const [hypotekariOpen, setHypotekariOpen] = useState(false)
  const [novyNakladOpen, setNovyNakladOpen] = useState(false)
  const [tokAddOpen, setTokAddOpen] = useState(false)
  const [tokEdit, setTokEdit] = useState<OstatniTokRow | null>(null)
  const [tokDelete, setTokDelete] = useState<OstatniTokRow | null>(null)
  const [katastr, setKatastr] = useState<string | null>(null)
  const [katastrOpen, setKatastrOpen] = useState(false)
  const [katastrSearch, setKatastrSearch] = useState('')
  const [cisloLv, setCisloLv] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const katastrRef = useRef<HTMLDivElement>(null)

  // Sticky offset pro „Akce na nabídce“ — pod ukotvenou hlavičkou (app topbar 56 + výška hlavičky).
  const headerRef = useRef<HTMLDivElement>(null)
  const [stickyTop, setStickyTop] = useState(200)
  useEffect(() => {
    function measure() {
      if (headerRef.current) setStickyTop(headerRef.current.offsetHeight + 56 + 16)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Po přepnutí na záložku Exporty odscrolluj k logu (kotva z „Základní informace“ / z chybového stavu).
  useEffect(() => {
    if (scrollHistoryPending && tab === 'exporty') {
      historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setScrollHistoryPending(false)
    }
  }, [scrollHistoryPending, tab])

  // Kotva ze souhrnných widgetů na záložku „Příležitosti“ - s předvybraným pohledem.
  function goToPrilezitosti(sub: PrilezitostiSubTab) {
    setPrilezitostiSubTab(sub)
    setTab('prilezitosti')
  }

  // Kotva na chybu v exportu: přepni na Exporty, vyfiltruj jen chyby a odscrolluj k logu.
  function goToExportError() {
    setHistoryFilter('error')
    setTab('exporty')
    setScrollHistoryPending(true)
  }

  useEffect(() => {
    if (!katastrOpen) return
    const handler = (e: MouseEvent) => {
      if (katastrRef.current && !katastrRef.current.contains(e.target as Node)) {
        setKatastrOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [katastrOpen])

  useEffect(() => {
    if (!galleryOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') setActivePhoto(p => (p - 1 + NABIDKA_PHOTOS.length) % NABIDKA_PHOTOS.length)
      if (e.key === 'ArrowRight') setActivePhoto(p => (p + 1) % NABIDKA_PHOTOS.length)
      if (e.key === 'Escape') setGalleryOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [galleryOpen])

  const n = nabidkyData.find(r => r.id === Number(id))
  if (!n) {
    return <div style={{ padding: 24, color: 'var(--t-textSecondary)' }}>Nabídka nenalezena.</div>
  }

  if (editOpen) {
    return <NovaNabidkaForm initialData={nabidkaToFormData(n)} onClose={() => setEditOpen(false)} />
  }

  const d = MOCK_DETAIL

  // Stáhne všechny fotografie nabídky. Obrázky natáhneme jako blob a spustíme
  // stažení pod čitelným názvem; pokud fetch selže (CORS), otevřeme foto v novém okně.
  const nabidkaNazev = n.nazev
  async function handleDownloadPhotos() {
    for (let i = 0; i < NABIDKA_PHOTOS.length; i++) {
      try {
        const res = await fetch(NABIDKA_PHOTOS[i])
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${nabidkaNazev} — foto ${i + 1}.jpg`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } catch {
        window.open(NABIDKA_PHOTOS[i], '_blank', 'noreferrer')
      }
    }
  }


  // Statistiky exportů — data podle rozsahu data a vybraného portálu
  // (null = Vše, součet zapnutých a zdravých).
  const statsFromDate = statsParseISO(statsFrom)
  const statsToDate = statsParseISO(statsTo)
  const statsDayList = statsDaysInRange(statsFromDate, statsToDate)
  const activePortals = exportServers.filter(s => s.enabled && s.healthy)
  const statsViews: number[] = statsDayList.map(dt => {
    const ed = statsEpochDay(dt)
    return exportPortal
      ? portalViewForDay(exportPortal, ed)
      : activePortals.reduce((sum, s) => sum + portalViewForDay(s.name, ed), 0)
  })
  const chartData = statsDayList.map((dt, i) => ({ den: statsFmtDen(dt), hodnota: statsViews[i] }))
  const statsXInterval = Math.max(0, Math.floor(statsDayList.length / 12))

  const statsTotalViews = statsViews.reduce((a, b) => a + b, 0)
  const statsDailyAvg = statsViews.length ? statsTotalViews / statsViews.length : 0
  const statsInteresty = exportPortal
    ? PORTAL_STATS[exportPortal]?.interesty ?? 0
    : activePortals.reduce((sum, s) => sum + (PORTAL_STATS[s.name]?.interesty ?? 0), 0)
  const statsKonverze = statsTotalViews > 0 ? (statsInteresty / statsTotalViews) * 100 : 0

  // Vybraný portál s chybou exportu (např. Bazoš) → v grafu ukážeme chybový stav.
  const statsSelectedServer = exportServers.find(s => s.name === exportPortal)
  const statsHasError = statsSelectedServer ? serverStatus(statsSelectedServer) === 'error' : false

  const allExportsOn = exportServers.every(s => s.enabled)
  function toggleServer(name: string, on: boolean) {
    setExportServers(list => list.map(s => (s.name === name ? { ...s, enabled: on } : s)))
  }
  function toggleAllServers(on: boolean) {
    setExportServers(list => list.map(s => ({ ...s, enabled: on })))
  }

  return (
    <div style={{ margin: -24, background: 'var(--t-bgSecondary)', minHeight: 'calc(100vh - 56px)' }}>

      {/* Header title — scrolls away with the page */}
      <div style={{ background: 'var(--t-bgPrimary)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '24px 0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
              <div style={{ marginTop: 2 }}>
                <IconButton icon={ChevronLeft} variant="ghost" size="md" tooltip="Zpět na seznam" onClick={() => navigate('/nabidky')} />
              </div>
              <div style={{ minWidth: 0 }}>
                {/* typography.headline24 */}
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, lineHeight: '32px', color: 'var(--t-textPrimary)' }}>
                  {n.nazev}
                </h1>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs — stay sticky under the top bar while the title scrolls away */}
      <div ref={headerRef} style={{ position: 'sticky', top: 56, zIndex: 10, background: 'var(--t-bgPrimary)', borderBottom: '1px solid var(--t-borderPrimary)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
          <LineTabGroup tabs={TABS} value={tab} onChange={setTab} />
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 24 }}>

        {/* ── Main column ───────────────────────────────────────────────────── */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Přehled nabídky — hero karta + widgety vlevo, sticky panel akcí vpravo */}
          {tab === 'zakladni' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'flex-start' }}>

            {/* Levý obsah — hero karta přes celou šířku obou sloupců + widgety */}
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Property hero card */}
              <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, overflow: 'hidden', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20, alignItems: 'start' }}>

              {/* Photo gallery preview */}
              <div
                onClick={() => { setActivePhoto(0); setGalleryOpen(true) }}
                style={{
                  position: 'relative', borderRadius: 10, overflow: 'hidden',
                  cursor: 'pointer', height: 92,
                  background: 'var(--t-bgSecondary)',
                }}
                onMouseEnter={e => {
                  const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement
                  if (overlay) overlay.style.opacity = '1'
                }}
                onMouseLeave={e => {
                  const overlay = e.currentTarget.querySelector('[data-overlay]') as HTMLElement
                  if (overlay) overlay.style.opacity = '0'
                }}
              >
                <img
                  src={NABIDKA_PHOTOS[0]}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  data-overlay
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.35)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 150ms',
                  }}
                >
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, padding: '6px 12px', background: 'rgba(0,0,0,0.5)', borderRadius: 8 }}>
                    Galerie ({NABIDKA_PHOTOS.length})
                  </span>
                </div>
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: 'rgba(0,0,0,0.65)', color: '#fff',
                  padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                }}>
                  1 / {NABIDKA_PHOTOS.length}
                </div>
              </div>

              {/* Right column — cena + provize (fakta jsou kompaktně pod kartou) */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 12 }}>

                {/* Price + provize */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#E05524', lineHeight: 1, letterSpacing: '-0.5px' }}>
                      {formatCena(n.cena)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Tag label={n.stavNabidky} variant={stavVariant(n.stavNabidky)} size="sm" lead="indicator" />
                      <Tag label={`ID ${n.id}`} variant="brand" size="sm" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>
                      Provize{' '}
                      <span style={{ ...typography.body14Semibold, color: 'var(--t-textPrimary)' }}>{formatCena(d.provizeBezDPH)}</span>
                      {' / '}
                      <span style={{ ...typography.body14Semibold, color: 'var(--t-textPrimary)' }}>{formatCena(d.provizeSdph)}</span>
                      {' s DPH'}
                    </span>
                    {d.podlehaDPH && (
                      <span style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>
                        · Podléhá DPH
                      </span>
                    )}
                  </div>
                </div>

                {/* Platnost RS/ZS — pod sumami, barevný stav platnosti */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {([
                    { icon: CalendarCheck, label: 'Platnost RS', value: d.platnostRS },
                    { icon: CalendarClock, label: 'Platnost ZS', value: d.platnostZS },
                  ] as const).map(({ icon: Icon, label, value }) => {
                    const { valueColor, note } = validityFact(value)
                    return (
                      <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <Icon size={16} style={{ color: 'var(--t-textSecondary)', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, lineHeight: '16px', color: 'var(--t-textSecondary)' }}>{label}</span>
                          <span style={{ fontSize: 15, fontWeight: 600, lineHeight: '20px', color: valueColor, whiteSpace: 'nowrap' }}>{value}</span>
                          {note && <span style={{ fontSize: 11, fontWeight: 600, lineHeight: '14px', color: valueColor, whiteSpace: 'nowrap' }}>{note}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Fakty — kompaktní jednořádkové položky ve dvou zarovnaných sloupcích. */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              columnGap: 32, rowGap: 0,
            }}>
              <FactLine icon={Home}        label="Typ nemovitosti"  value={n.typObjektu.charAt(0).toUpperCase() + n.typObjektu.slice(1)} />
              <FactLine icon={Maximize2}   label="Užitná plocha"    value={`${d.uzitnaPocha} m²`} />
              <FactLine icon={TagIcon}     label="Typ transakce"    value={d.typTransakce} />
              <FactLine icon={ShieldCheck} label="Stav nemovitosti" value={d.stavNemovitosti} />
              <FactLine icon={KeyRound}    label="Vlastnictví"      value={d.vlastnictvi} />
              <FactLine icon={Hammer}      label="Budova"           value={d.budova} />
              <FactLine icon={Building2}   label="Pobočka"          value={n.pobocka} />
              <FactLine icon={Clock}       label="Poslední změna"   value={n.datumPosledniZmeny} />
              </div>
              </div>
              {/* /Property hero card */}

              {/* Widgety — 2 sloupce: Agenda/klient/makléř/hypotéka/náklady + Exporty/příležitosti/páry/podpisy/poznámka */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, alignItems: 'flex-start' }}>

                {/* Sloupec 1 — Agenda + Klient + Makléř + Náklady */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <WidgetAgenda onTab={setTab} />

                  <DashboardWidget icon={Users} title="Klient">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {KONTAKTNI_OSOBY.map((osoba) => (
                        <KlientRow key={osoba.email} osoba={osoba} onClick={() => navigate('/klienti')} />
                      ))}
                    </div>
                  </DashboardWidget>

                  <DashboardWidget icon={User} title="Makléř" onClick={() => navigate('/uzivatele')}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px',
                      background: 'var(--t-bgSecondary)',
                      borderRadius: 8,
                    }}>
                      <Avatar
                        initials={getInitials(d.maklerJmeno)}
                        size="lg"
                        color={getAvatarColor(d.maklerJmeno)}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        {/* body16Semibold */}
                        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>
                          {d.maklerJmeno}
                        </div>
                        {/* body14Regular */}
                        <ContactInfo email={d.maklerEmail} telefon={d.maklerTelefon} />
                      </div>
                    </div>
                  </DashboardWidget>

                  <WidgetNaklady onNaklad={() => setNovyNakladOpen(true)} />
                </div>

                {/* Sloupec 2 — Exporty + Příležitosti + Nejnovější páry + Elektronické podpisy + Stav hypotéky + Interní poznámka */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <WidgetExporty onTab={setTab} onError={goToExportError} />

                  <WidgetPrilezitosti onClick={() => goToPrilezitosti('prilezitosti')} />

                  <WidgetPary onClick={() => goToPrilezitosti('pary')} />

                  <WidgetPodpisy onTab={setTab} />

                  <WidgetStavHypoteky onTab={setTab} />

                  {internalNote.trim() && (
                    <DashboardWidget
                      icon={StickyNote}
                      title="Interní poznámka"
                      action={<TextButton label="Upravit" variant="brand" size="sm" leadIcon={Pencil} onClick={() => setPoznamkaOpen(true)} />}
                    >
                      <div style={{
                        background: 'var(--t-bgSecondary)', borderRadius: 8, padding: 12,
                        fontSize: 14, fontWeight: 400, lineHeight: '20px',
                        color: 'var(--t-textPrimary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {internalNote}
                      </div>
                    </DashboardWidget>
                  )}
                </div>
              </div>
              {/* /Widgety */}
            </div>
            {/* /Levý obsah */}

            {/* Akce na nabídce — sticky boční panel vpravo, viditelný hned od začátku navrchu */}
            <QuickActionsColumn
              onEdit={() => setEditOpen(true)}
              onHypo={() => setHypotekariOpen(true)}
              onNaklad={() => setNovyNakladOpen(true)}
              onDownloadPhotos={handleDownloadPhotos}
              onPoznamka={() => setPoznamkaOpen(true)}
              showPoznamka={!internalNote.trim()}
              top={stickyTop}
            />
          </div>
          )}


          {/* ── Příležitosti ───────────────────────────────────────────────── */}
          {tab === 'prilezitosti' && (
            <PrilezitostiNabidky
              subTab={prilezitostiSubTab}
              onSubTabChange={setPrilezitostiSubTab}
              onNovaPrilezitost={() => setNovaPrilezitostOpen(true)}
            />
          )}

          {/* ── Exporty ────────────────────────────────────────────────── */}
          {tab === 'exporty' && (
          <>
            {/* Graf + karty vlevo ve sloupci, úzký boční sloupec s nastavením exportů vpravo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>

            {/* ── Levý sloupec: graf statistik + karty pod ním ─────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {/* Odesílání statistik klientovi — samostatný widget */}
            <Widget>
              {/* Souhrn nastavení odesílání statistik klientovi — kompaktní řádek */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: 'var(--t-bgSecondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Clock size={18} style={{ color: 'var(--t-textSecondary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, lineHeight: '16px', color: 'var(--t-textSecondary)' }}>
                    Statistiky pro klienta
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, lineHeight: '22px', color: 'var(--t-textPrimary)' }}>
                      {statsSummaryLabel(statsSettings)}
                    </span>
                    <Tag
                      label={statsSettings.active ? 'Aktivní' : 'Vypnuto'}
                      variant={statsSettings.active ? 'success' : 'neutral'}
                      lead="indicator"
                      size="xs"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {statsSettings.active && (
                    <TextButton
                      label="Vypnout"
                      variant="danger"
                      leadIcon={MailX}
                      onClick={() => setStatsSettings(s => ({ ...s, active: false }))}
                    />
                  )}
                  <TextButton
                    label={statsSettings.active ? 'Upravit' : 'Nastavit'}
                    variant="brand"
                    leadIcon={Pencil}
                    onClick={() => setStatsModalOpen(true)}
                  />
                </div>
              </div>
            </Widget>

            {/* Statistiky exportů widget */}
            <Widget>
              <Section
                title="Statistiky exportů"
                action={<TextButton label="Exportovat" variant="brand" leadIcon={Download} />}
              >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Filter — datum + portály v jedné řadě filtrů, oddělené rozdělovníkem */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', position: 'relative', flexShrink: 0 }}>
                    <FilterSelect
                      label={`${statsFmtCz(statsFromDate)} – ${statsFmtCz(statsToDate)}`}
                      leadIcon={Calendar}
                      selected={statsDateOpen}
                      onClick={() => setStatsDateOpen(o => !o)}
                    />
                    {statsDateOpen && (
                      <>
                        {/* Zavření kliknutím mimo */}
                        <div
                          onClick={() => setStatsDateOpen(false)}
                          style={{ position: 'fixed', inset: 0, zIndex: 20 }}
                        />
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 21,
                          display: 'flex', alignItems: 'flex-end', gap: 12,
                          padding: 16, borderRadius: 8,
                          background: 'var(--t-bgPrimary)',
                          border: '1px solid var(--t-borderPrimary)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t-textSecondary)' }}>Datum od</span>
                            <input
                              type="date"
                              value={statsFrom}
                              max={statsTo}
                              onChange={e => setStatsFrom(e.target.value)}
                              style={{
                                padding: '8px 10px', borderRadius: 6,
                                border: '1px solid var(--t-borderPrimary)',
                                background: 'var(--t-bgPrimary)', color: 'var(--t-textPrimary)',
                                fontSize: 14, colorScheme: 'light dark',
                              }}
                            />
                          </label>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t-textSecondary)' }}>Datum do</span>
                            <input
                              type="date"
                              value={statsTo}
                              min={statsFrom}
                              onChange={e => setStatsTo(e.target.value)}
                              style={{
                                padding: '8px 10px', borderRadius: 6,
                                border: '1px solid var(--t-borderPrimary)',
                                background: 'var(--t-bgPrimary)', color: 'var(--t-textPrimary)',
                                fontSize: 14, colorScheme: 'light dark',
                              }}
                            />
                          </label>
                          <TextButton
                            label="Zavřít"
                            variant="brand"
                            onClick={() => setStatsDateOpen(false)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter — výběr portálu (select s menu) */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <FilterButton
                      label={exportPortal ?? 'Všechny portály'}
                      leadIcon={statsSelectedServer ? LOGO_LEAD_ICONS[statsSelectedServer.logo] : undefined}
                      chevronSide="right"
                      active={exportPortalOpen || exportPortal !== null}
                      onClick={() => setExportPortalOpen(o => !o)}
                    />
                    {exportPortalOpen && (
                      <>
                        {/* Zavření kliknutím mimo */}
                        <div
                          onClick={() => setExportPortalOpen(false)}
                          style={{ position: 'fixed', inset: 0, zIndex: 20 }}
                        />
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 21 }}>
                          <Menu width={260}>
                            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                              <MenuItem
                                label="Všechny portály"
                                variant={exportPortal === null ? 'active' : 'default'}
                                onClick={() => { setExportPortal(null); setExportPortalOpen(false) }}
                              />
                              {exportServers.map(s => (
                                <MenuItem
                                  key={s.name}
                                  label={s.name}
                                  leadIcon={LOGO_LEAD_ICONS[s.logo]}
                                  variant={exportPortal === s.name ? 'active' : 'default'}
                                  onClick={() => { setExportPortal(s.name); setExportPortalOpen(false) }}
                                />
                              ))}
                            </div>
                          </Menu>
                        </div>
                      </>
                    )}
                  </div>
                  </div>

                  {/* Chart */}
                  <div style={{ height: 360 }}>
                    {statsHasError ? (
                      <div style={{
                        height: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 8,
                        border: '1px dashed var(--t-borderPrimary)', borderRadius: 8,
                        background: 'var(--t-bgSecondary)', textAlign: 'center', padding: 24,
                      }}>
                        <CircleX size={32} style={{ color: 'var(--t-textDangerPrimary, #DC2626)' }} />
                        <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>
                          Chyba exportu
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', color: 'var(--t-textSecondary)', maxWidth: 360 }}>
                          Export na {statsSelectedServer?.name} se nezdařil, proto pro tento portál nemáme žádná data o zobrazení.
                        </span>
                        <TextButton
                          label="Zobrazit chybu v logu"
                          variant="brand"
                          size="md"
                          tailIcon={ChevronRight}
                          onClick={goToExportError}
                        />
                      </div>
                    ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="statsExportFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#E05524" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#E05524" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--t-borderPrimary)" />
                        <XAxis dataKey="den" tick={{ fontSize: 11, fill: 'var(--t-textSecondary)' }} interval={statsXInterval} />
                        <YAxis
                          domain={[0, 'dataMax + 3']}
                          allowDecimals={false}
                          width={32}
                          tick={{ fontSize: 11, fill: 'var(--t-textSecondary)' }}
                        />
                        <Tooltip
                          cursor={{ stroke: 'var(--t-borderPrimary)', strokeDasharray: '3 3' }}
                          content={StatsTooltip}
                        />
                        <Area
                          type="monotone"
                          dataKey="hodnota"
                          stroke="#E05524"
                          strokeWidth={2}
                          fill="url(#statsExportFill)"
                          dot={{ r: 2, fill: '#E05524', strokeWidth: 0 }}
                          activeDot={{ r: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    )}
                  </div>

                  {/* Summary stats — první řada 4 boxy, druhá řada 3 boxy */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Řada 1 — 4 hlavní statistiky */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                      {[
                        { label: 'Počet zobrazení', value: fmtStatInt(statsTotalViews) },
                        { label: 'Denní průměr', value: fmtStatDec(statsDailyAvg) },
                        { label: 'Počet zájmů', value: fmtStatInt(statsInteresty) },
                        { label: 'Konverzní poměr', value: `${fmtStatDec(statsKonverze)} %` },
                      ].map(s => (
                        <div key={s.label} style={{
                          padding: '12px 16px',
                          borderRadius: 8,
                          background: 'var(--t-bgSecondary)',
                          display: 'flex', flexDirection: 'column',
                          justifyContent: 'center', gap: 2,
                        }}>
                          {/* body14Regular */}
                          <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>
                            {s.label}
                          </span>
                          <span style={{
                            fontSize: 18, fontWeight: 700, lineHeight: '24px', letterSpacing: '-0.2px',
                            color: 'var(--t-textPrimary)',
                          }}>
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Řada 2 — 3 samostatné boxy */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                      {[
                        { label: 'Dní v nabídce', value: fmtStatInt(STATS_DNI_V_NABIDCE) },
                        { label: 'Počet zobrazení', value: fmtStatInt(statsTotalViews) },
                        { label: 'Denní průměr', value: fmtStatDec(statsDailyAvg) },
                      ].map(s => (
                        <div key={s.label} style={{
                          padding: '12px 16px',
                          borderRadius: 8,
                          background: 'var(--t-bgSecondary)',
                          display: 'flex', flexDirection: 'row', alignItems: 'center',
                          justifyContent: 'space-between', gap: 12,
                        }}>
                          {/* body14Regular */}
                          <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>
                            {s.label}
                          </span>
                          <span style={{
                            fontSize: 18, fontWeight: 700, lineHeight: '24px', letterSpacing: '-0.2px',
                            color: 'var(--t-textPrimary)', whiteSpace: 'nowrap',
                          }}>
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

              </div>
              </Section>
            </Widget>

            {/* Žebříček — stat karty podle portálu */}
            <Widget>
                <Section title="Žebříček">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 8,
                  }}>
                    {ZEBRICKY_ROWS.map(r => (
                      <div key={r.server} style={{
                        display: 'flex', flexDirection: 'column', gap: 8,
                        padding: '12px 14px',
                        background: 'var(--t-bgSecondary)',
                        borderRadius: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <ServerLogo logo={r.logo} name={r.server} />
                          <span style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.server}
                          </span>
                        </div>
                        <span style={{ ...typography.headline24, color: 'var(--t-textPrimary)', lineHeight: 1 }}>
                          {fmtStatInt(r.celkem)}
                        </span>
                        <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                          {r.dni} dní · Ø {r.den}/den
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
            </Widget>

            {/* Log exportu — kartový feed místo tabulky */}
            {(() => {
            // Filtr logu „Vše / Chyby“. Ve stavu „Chyby“ ukazujeme rovnou všechny chybové
            // záznamy (bez stránkování), aby chyba nezůstala schovaná mezi skrytými událostmi.
            const historyRows = historyFilter === 'error'
              ? EXPORT_HISTORY_ROWS.filter(r => exportLogTone(r.popis).kind === 'error')
              : EXPORT_HISTORY_ROWS
            const collapsible = historyFilter === 'all' && historyRows.length > HISTORY_PAGE_SIZE
            const visibleRows = collapsible && !historyExpanded
              ? historyRows.slice(0, HISTORY_PAGE_SIZE)
              : historyRows
            return (
            <div ref={historyRef} style={{ scrollMarginTop: 72 }}>
            <Widget>
              <Section
                title="Historie exportu"
                action={EXPORT_HISTORY_ERROR_COUNT > 0 ? (
                  <PillTabGroup
                    size="md"
                    value={historyFilter}
                    onChange={v => setHistoryFilter(v as 'all' | 'error')}
                    tabs={[
                      { value: 'all', label: 'Vše' },
                      { value: 'error', label: 'Chyby', badge: EXPORT_HISTORY_ERROR_COUNT },
                    ]}
                  />
                ) : undefined}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleRows.map((r, i) => {
                    const tone = exportLogTone(r.popis)
                    const isError = tone.kind === 'error'
                    return (
                      <div
                        key={`${r.datum}-${r.server}-${i}`}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: 6,
                          padding: '10px 12px',
                          background: isError ? 'var(--t-bgDangerTertiary)' : 'var(--t-bgSecondary)',
                          borderRadius: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <ServerLogo logo={r.logo} name={r.server} />
                            <span style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.server}
                            </span>
                          </div>
                          <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {r.datum}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          {isError ? (
                            <CircleX size={16} style={{ color: tone.color, flexShrink: 0 }} />
                          ) : (
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: tone.color, flexShrink: 0 }} />
                          )}
                          <span style={{ ...typography.body14Regular, color: 'var(--t-textPrimary)' }}>
                            {r.popis}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {collapsible && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                    <TextButton
                      label={historyExpanded
                        ? 'Zobrazit méně'
                        : `Zobrazit dalších ${historyRows.length - HISTORY_PAGE_SIZE}`}
                      variant="brand"
                      leadIcon={historyExpanded ? ChevronUp : ChevronDown}
                      onClick={() => setHistoryExpanded(v => !v)}
                    />
                  </div>
                )}
              </Section>
            </Widget>
            </div>
            )
            })()}
            </div>

            {/* ── Pravý sloupec: nastavení exportů ─────────────────────────── */}
            {/* Nastavení exportů — úzký boční sloupec vedle grafu */}
            <Widget>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Header s hromadným přepínačem */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ ...typography.subheadline18Semibold, color: 'var(--t-textPrimary)' }}>
                    Nastavení exportů
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)' }}>
                      Exportovat na vše
                    </span>
                    <Toggle
                      checked={allExportsOn}
                      onChange={on => toggleAllServers(on)}
                    />
                  </div>
                </div>

                {/* Seznam serverů — kompaktní 2řádkové řádky oddělené dividerem (úzký boční sloupec) */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {exportServers.map((s, i) => {
                    const status = serverStatus(s)
                    const badge = exportStatusBadge(status)
                    return (
                      <div
                        key={s.name}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: 6,
                          padding: '12px 0',
                          borderBottom: i < exportServers.length - 1 ? '1px solid var(--t-borderPrimary)' : undefined,
                        }}
                      >
                        {/* Hlavní řádek — logo, název, link a toggle na jedné ose */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ServerLogo logo={s.logo} name={s.name} />
                          <span style={{
                            flex: 1, minWidth: 0,
                            ...typography.body14Semibold, color: 'var(--t-textPrimary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {s.name}
                          </span>
                          <IconButton
                            icon={ExternalLink}
                            variant="ghost"
                            size="sm"
                            disabled={!(s.enabled && s.url)}
                            tooltip={s.enabled && s.url ? 'Zobrazit inzerát na portálu' : 'Inzerát zatím není publikovaný'}
                            onClick={() => { if (s.url) window.open(s.url, '_blank', 'noreferrer') }}
                          />
                          <div style={{ flexShrink: 0 }}>
                            <Toggle
                              checked={s.enabled}
                              onChange={on => toggleServer(s.name, on)}
                            />
                          </div>
                        </div>
                        {/* Stav jen u chyby — pod celým řádkem, zarovnaný pod název.
                            Proklik na badge odscrolluje do logu s vyfiltrovanými chybami. */}
                        {status === 'error' && (
                          <div
                            role="button"
                            tabIndex={0}
                            title="Zobrazit chyby v logu exportu"
                            onClick={goToExportError}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToExportError() } }}
                            style={{ display: 'flex', alignItems: 'center', paddingLeft: 34, cursor: 'pointer', width: 'fit-content' }}
                          >
                            <Tag label={badge.label} variant={badge.variant} lead="icon" icon={badge.icon} size="sm" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </Widget>
            </div>
          </>
          )}

          {/* ── Finance ────────────────────────────────────────────────── */}
          {tab === 'finance' && <VyporadaniPlateb />}

          {/* ── Ostatní finanční toky ──────────────────────────────────── */}
          {tab === 'ostatni' && (
            <Widget>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>Ostatní finanční toky</div>
                  <TextButton label="Přidat" variant="brand" leadIcon={Plus} onClick={() => setTokAddOpen(true)} />
                </div>

                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', background: 'var(--t-bgSecondary)', borderRadius: 8 }}>
                    <div style={{ width: 120, flexShrink: 0, pointerEvents: 'none' }}><TableHeaderCell size="dense" label="Datum" width="100%" /></div>
                    <div style={{ width: 120, flexShrink: 0, pointerEvents: 'none' }}><TableHeaderCell size="dense" label="Typ" width="100%" /></div>
                    <div style={{ width: 140, flexShrink: 0, pointerEvents: 'none' }}><TableHeaderCell size="dense" label="VS" width="100%" /></div>
                    <div className="th-right" style={{ width: 160, flexShrink: 0, pointerEvents: 'none' }}>
                      <TableHeaderCell size="dense" label="Částka" width="100%" />
                    </div>
                    <div style={{ flex: 1, minWidth: 200, pointerEvents: 'none' }}><TableHeaderCell size="dense" label="Poznámka" width="100%" /></div>
                    <div style={{ width: 100, flexShrink: 0, pointerEvents: 'none' }}><TableHeaderCell size="dense" empty width="100%" /></div>
                  </div>

                  {/* Rows */}
                  {OSTATNI_TOKY_INITIAL.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--t-textSecondary)' }}>
                      Žádné výsledky.
                    </div>
                  ) : (
                    OSTATNI_TOKY_INITIAL.map(r => {
                      const isPrijem = r.typ === 'prijem'
                      const rowBg = isPrijem ? '#F0FDF4' : '#FEF2F2'
                      return (
                        <div key={r.id} style={{ display: 'flex', background: rowBg }}>
                          <div style={{ width: 120, flexShrink: 0 }}>
                            <TableCell size="dense" width="100%" hovered={false} borderBottom label={r.datum} />
                          </div>
                          <div style={{ width: 120, flexShrink: 0 }}>
                            <TableCell
                              size="dense" width="100%" hovered={false} borderBottom
                              content={
                                <Tag
                                  label={isPrijem ? 'Příjem' : 'Výdaj'}
                                  variant={isPrijem ? 'success' : 'danger'}
                                  size="sm"
                                />
                              }
                            />
                          </div>
                          <div style={{ width: 140, flexShrink: 0 }}>
                            <TableCell size="dense" width="100%" hovered={false} borderBottom label={r.vs} />
                          </div>
                          <div style={{ width: 160, flexShrink: 0 }}>
                            <TableCell
                              size="dense" width="100%" hovered={false} borderBottom align="right"
                              content={
                                <span style={{ fontSize: 14, fontWeight: 600, color: isPrijem ? 'var(--t-textSuccessPrimary)' : 'var(--t-textDangerPrimary)' }}>
                                  {(isPrijem ? '+ ' : '− ') + formatCena(r.castka)}
                                </span>
                              }
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <TableCell size="dense" width="100%" hovered={false} borderBottom label={r.poznamka || '—'} />
                          </div>
                          <div style={{ width: 100, flexShrink: 0 }}>
                            <TableCell
                              size="dense" width="100%" hovered={false} borderBottom
                              content={
                                <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                  <IconButton icon={Pencil} variant="ghost" size="md" tooltip="Upravit" onClick={() => setTokEdit(r)} />
                                  <span className="icon-trash-primary">
                                    <IconButton icon={Trash2} variant="ghost" size="md" tooltip="Smazat" onClick={() => setTokDelete(r)} />
                                  </span>
                                </div>
                              }
                            />
                          </div>
                        </div>
                      )
                    })
                  )}

                  {/* Saldo */}
                  {OSTATNI_TOKY_INITIAL.length > 0 && (() => {
                    const saldo = OSTATNI_TOKY_INITIAL.reduce((s, r) => s + (r.typ === 'prijem' ? r.castka : -r.castka), 0)
                    return (
                      <div style={{ display: 'flex', background: 'var(--t-bgSecondary)', borderRadius: '0 0 8px 8px' }}>
                        <div style={{ width: 120 + 120 + 140, flexShrink: 0 }}>
                          <TableCell size="dense" width="100%" hovered={false} borderBottom={false} align="right"
                            content={<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t-textSecondary)' }}>Saldo:</span>}
                          />
                        </div>
                        <div style={{ width: 160, flexShrink: 0 }}>
                          <TableCell size="dense" width="100%" hovered={false} borderBottom={false} align="right"
                            content={
                              <span style={{
                                fontSize: 14, fontWeight: 700,
                                color: saldo >= 0 ? 'var(--t-textSuccessPrimary)' : 'var(--t-textDangerPrimary)',
                              }}>
                                {(saldo >= 0 ? '' : '− ') + formatCena(Math.abs(saldo))}
                              </span>
                            }
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <TableCell size="dense" width="100%" hovered={false} borderBottom={false} label="" />
                        </div>
                        <div style={{ width: 100, flexShrink: 0 }}>
                          <TableCell size="dense" width="100%" hovered={false} borderBottom={false} label="" />
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </Widget>
          )}

          {/* ── List vlastnictví ──────────────────────────────────────── */}
          {tab === 'list' && (
            <Widget>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Filter row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Search
                    placeholder="Číslo LV"
                    value={cisloLv}
                    onChange={setCisloLv}
                    size="sm"
                    width={240}
                  />
                  <div ref={katastrRef} style={{ position: 'relative' }}>
                    <FilterSelect
                      label={katastr ?? 'Katastrální území'}
                      selected={!!katastr}
                      onClick={() => setKatastrOpen(o => !o)}
                    />
                    {katastrOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50 }}>
                        <Menu width={320}>
                          <div style={{ padding: '8px 12px' }}>
                            <Search
                              placeholder="Hledat katastrální území…"
                              value={katastrSearch}
                              onChange={setKatastrSearch}
                              size="sm"
                              width="100%"
                            />
                          </div>
                          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                            {KATASTRY
                              .filter(k => k.toLowerCase().includes(katastrSearch.toLowerCase()))
                              .map(k => (
                                <MenuItem
                                  key={k}
                                  label={k}
                                  onClick={() => { setKatastr(k); setKatastrOpen(false); setKatastrSearch('') }}
                                />
                              ))}
                          </div>
                          {katastr && (
                            <>
                              <div style={{ height: 1, background: 'var(--t-borderPrimary)' }} />
                              <MenuItem label="Vymazat výběr" onClick={() => { setKatastr(null); setKatastrOpen(false) }} />
                            </>
                          )}
                        </Menu>
                      </div>
                    )}
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <TextButton label="Stáhnout LV" variant="brand" leadIcon={Download} />
                  </div>
                </div>

                {/* Empty state — žádné stažené LV */}
                <EmptyState
                  title="Zatím zde nejsou žádné záznamy"
                  description="Po stažení listu vlastnictví se zde zobrazí historie."
                />
              </div>
            </Widget>
          )}

          {/* ── Dokumenty ─────────────────────────────────────────────── */}
          {tab === 'dokumenty' && (() => {
            const selectedFolder = dokSelected ? dokFindFolder(DOK_TREE, dokSelected) : null
            const ancestors = dokSelected ? dokGetAncestors(DOK_TREE, dokSelected) : []
            const subFolders = selectedFolder?.children ?? []
            const toggleDokExpand = (id: string) => setDokExpanded(prev => {
              const next = new Set(prev)
              next.has(id) ? next.delete(id) : next.add(id)
              return next
            })
            const breadcrumbItems = ancestors.map(crumb => ({
              label: crumb.name,
              onClick: () => setDokSelected(crumb.id),
            }))
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'flex-start' }}>

                {/* Left tree widget */}
                <Widget padding={0}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* typography.subheadline18Semibold */}
                      <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)', flex: 1 }}>Dokumenty</span>
                      <TextButton label="Nahrát" variant="brand" leadIcon={Upload} onClick={() => setNahratOpen(true)} />
                    </div>
                    <div style={{ padding: 8, display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
                      {DOK_TREE.map(folder => (
                        <DokTreeItem
                          key={folder.id}
                          folder={folder}
                          selected={dokSelected}
                          expanded={dokExpanded}
                          onSelect={setDokSelected}
                          onToggle={toggleDokExpand}
                        />
                      ))}
                    </div>
                  </div>
                </Widget>

                {/* Right content widget */}
                <Widget>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
                    {/* Breadcrumbs + title */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Breadcrumbs items={breadcrumbItems} />
                      <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>
                        {selectedFolder?.name ?? 'Dokumenty'}
                      </span>
                    </div>

                    {/* Subfolders */}
                    {subFolders.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* typography.body16Semibold */}
                        <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>Složky</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
                          {subFolders.map(child => (
                            <div
                              key={child.id}
                              onClick={() => { setDokSelected(child.id); setDokExpanded(prev => new Set([...prev, child.id])) }}
                              style={{
                                height: 56, paddingLeft: 12, paddingRight: 12,
                                background: 'var(--t-bgSecondary)', borderRadius: 8,
                                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                              }}
                            >
                              <Folder size={16} style={{ flexShrink: 0, color: 'var(--t-textSecondary)' }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {child.name}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', letterSpacing: '0.12px', color: 'var(--t-textSecondary)' }}>
                                  {child.count} {child.count === 1 ? 'Soubor' : 'Souborů'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Files section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* typography.body16Semibold */}
                      <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>Soubory</span>
                      <EmptyState
                        title="Nejsou zde žádné soubory"
                        description="Nahrajte první soubor a zobrazí se v této složce."
                      />
                    </div>
                  </div>
                </Widget>
              </div>
            )
          })()}

          {/* ── Hypotéka ──────────────────────────────────────────────── */}
          {tab === 'hypoteka' && (
            <Widget>
              <Section title="Žádosti o hypotéku odeslané do Mydock">
                <EmptyState
                  title="Zatím nejsou žádné žádosti"
                  description="Po odeslání žádosti o hypotéku do Mydock se zde zobrazí přehled."
                />
              </Section>
            </Widget>
          )}

        </div>

      </div>

      {/* Odeslat hypotékáři modal */}
      {hypotekariOpen && <OdeslatHypotekariModal onClose={() => setHypotekariOpen(false)} />}

      {/* Interní poznámka modal */}
      {poznamkaOpen && (
        <InterniPoznamkaModal
          initialValue={internalNote}
          onClose={() => setPoznamkaOpen(false)}
          onSave={setInternalNote}
        />
      )}

      {/* Nový náklad modal */}
      {novyNakladOpen && <NovyNakladModal onClose={() => setNovyNakladOpen(false)} />}

      {/* Nastavení automatického odesílání statistik klientovi */}
      {statsModalOpen && (
        <AutomatickeStatistikyModal
          initial={statsSettings}
          onClose={() => setStatsModalOpen(false)}
          onSave={setStatsSettings}
        />
      )}

      {/* Přidat / Editovat tok modal */}
      {tokAddOpen && <OstatniTokModal onClose={() => setTokAddOpen(false)} />}
      {tokEdit && <OstatniTokModal initialData={rowToTokForm(tokEdit)} onClose={() => setTokEdit(null)} />}

      {/* Nahrát dokumenty modal */}
      {nahratOpen && <NahratDokumentyModal onClose={() => setNahratOpen(false)} defaultKategorie={dokSelected ?? undefined} />}

      {/* Vytvořit příležitost - nemovitost je předvybraná z detailu nabídky */}
      {novaPrilezitostOpen && <PrilezitostPanel nabidka={n} onClose={() => setNovaPrilezitostOpen(false)} />}

      {/* Smazat tok confirm dialog */}
      {tokDelete && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,13,18,0.4)' }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
              <Dialog
                icon={Trash2}
                title={`Smazat ${tokDelete.typ === 'prijem' ? 'příjem' : 'výdaj'}?`}
                description="Tuto akci nelze vrátit."
                primaryLabel="Smazat"
                secondaryLabel="Zrušit"
                destructive
                onPrimary={() => setTokDelete(null)}
                onSecondary={() => setTokDelete(null)}
              />
            </div>
          </div>
        </>,
        document.body,
      )}

      {/* Photo gallery lightbox */}
      {galleryOpen && createPortal(
        <div
          onClick={() => setGalleryOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Top bar */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 24px', color: '#fff',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {activePhoto + 1} / {NABIDKA_PHOTOS.length}
            </span>
            <button
              onClick={() => setGalleryOpen(false)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#fff', padding: 8, display: 'flex', borderRadius: 8,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <X size={24} />
            </button>
          </div>

          {/* Main image with prev/next */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', padding: '0 80px', minHeight: 0,
            }}
          >
            <button
              onClick={() => setActivePhoto(p => (p - 1 + NABIDKA_PHOTOS.length) % NABIDKA_PHOTOS.length)}
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
                color: '#fff', padding: 12, borderRadius: '50%', display: 'flex',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              <ChevronLeft size={28} />
            </button>

            <img
              src={NABIDKA_PHOTOS[activePhoto]}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
            />

            <button
              onClick={() => setActivePhoto(p => (p + 1) % NABIDKA_PHOTOS.length)}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer',
                color: '#fff', padding: 12, borderRadius: '50%', display: 'flex',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              <ChevronRight size={28} />
            </button>
          </div>

          {/* Thumbnails */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', gap: 8, padding: '16px 24px',
              overflowX: 'auto', justifyContent: 'center',
            }}
          >
            {NABIDKA_PHOTOS.map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt=""
                onClick={() => setActivePhoto(i)}
                style={{
                  width: 96, height: 64, objectFit: 'cover', flexShrink: 0,
                  borderRadius: 6, cursor: 'pointer',
                  opacity: i === activePhoto ? 1 : 0.55,
                  border: i === activePhoto ? '2px solid #E05524' : '2px solid transparent',
                  transition: 'opacity 150ms, border 150ms',
                }}
              />
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
