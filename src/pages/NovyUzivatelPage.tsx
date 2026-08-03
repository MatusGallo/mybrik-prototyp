import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Power, UserRound, Lock, Receipt, Briefcase, Globe, GraduationCap,
  FileText, Eye, EyeOff, ClipboardCheck, Camera, Check, Copy, Home, RefreshCw,
  Send, Mail, Phone, CircleCheck, Building2, type LucideIcon,
} from 'lucide-react'
import {
  Alert, Avatar, Button, Checkbox, DatePicker, FileUploadArea, IconButton,
  Input, Select, SummaryListItem, SwitchGroup, Tag, TextArea, TextButton,
  Toggle, iconSize, typography,
} from '@matusgallo/mysabds'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { pobockyData, roleData, uzivateleData } from '../data/mockOstatni'

// ── Data ──────────────────────────────────────────────────────────────────────

const NADRIZENI = [...uzivateleData]
  .filter(u => u.role !== 'Makléř')
  .sort((a, b) => `${a.prijmeni} ${a.jmeno}`.localeCompare(`${b.prijmeni} ${b.jmeno}`, 'cs'))
  .map(u => ({
    value: String(u.id),
    label: `${u.titulPred ? `${u.titulPred} ` : ''}${u.jmeno} ${u.prijmeni}`,
    sub: `${u.role} · ${u.pobocka}`,
  }))

const POBOCKY = [...new Set(pobockyData.map(p => p.nazev))]
  .sort((a, b) => a.localeCompare(b, 'cs'))
  .map(n => ({ value: n, label: n }))

const POZICE = [
  'Realitní makléř', 'Vedoucí pobočky', 'Asistent pobočky',
  'Hypoteční poradce', 'Regionální ředitel', 'Office manažer',
].map(p => ({ value: p, label: p }))

const ROLE = roleData.map(r => ({ value: r.nazev, label: r.nazev }))

const BANKY = [
  { value: '0100', label: '0100 - Komerční banka' },
  { value: '0300', label: '0300 - ČSOB' },
  { value: '0600', label: '0600 - MONETA Money Bank' },
  { value: '0800', label: '0800 - Česká spořitelna' },
  { value: '2010', label: '2010 - Fio banka' },
  { value: '2700', label: '2700 - UniCredit Bank' },
  { value: '3030', label: '3030 - Air Bank' },
  { value: '5500', label: '5500 - Raiffeisenbank' },
  { value: '6210', label: '6210 - mBank' },
  { value: '6363', label: '6363 - Partners Banka' },
]

const STAV_OPTIONS = [
  { value: 'neaktivni', label: 'Neaktivní' },
  { value: 'aktivni', label: 'Aktivní' },
]

const TYP_OSOBY_OPTIONS = [
  { value: 'fo', label: 'Fyzická osoba', icon: UserRound },
  { value: 'po', label: 'Právnická osoba', icon: Building2 },
]

const PREDVOLBY = ['+420', '+421', '+43', '+48', '+49']

const NOTIFIKACE_ZDROJE = [
  { key: 'sreality', label: 'Sreality.cz', popis: 'Nové poptávky z portálu Sreality.cz' },
  { key: 'idnes', label: 'reality iDNES.cz', popis: 'Nové poptávky z portálu reality iDNES.cz' },
  { key: 'web', label: 'Osobní web', popis: 'Nové poptávky z osobního webu makléře' },
] as const

const MEDAILONEK_MAX = 600

// Nezlomitelná mezera drží popisky čísel domu na jednom řádku.
const CP_LABEL = 'Č. p.'
const CO_LABEL = 'Č. o.'

// ── Model ─────────────────────────────────────────────────────────────────────

type Stav = 'aktivni' | 'neaktivni'
type TypOsoby = 'fo' | 'po'
type FakturaceKey = 'hpp' | 'platce' | 'neplatce'
type NotifikaceKlic = typeof NOTIFIKACE_ZDROJE[number]['key']

interface Adresa {
  ulice: string
  cisloPopisne: string
  cisloOrientacni: string
  mesto: string
  psc: string
}

const EMPTY_ADRESA: Adresa = { ulice: '', cisloPopisne: '', cisloOrientacni: '', mesto: '', psc: '' }

interface Ucet {
  predcisli: string
  cisloUctu: string
  kodBanky: string
}

const EMPTY_UCET: Ucet = { predcisli: '', cisloUctu: '', kodBanky: '' }

/** Fakturační subjekt - plátce i neplátce DPH mají stejnou sadu polí. */
interface Subjekt extends Adresa, Ucet {
  zapnuto: boolean
  typOsoby: TypOsoby
  /** U právnické osoby obchodní název, u fyzické jméno a příjmení */
  nazev: string
  ic: string
  dic: string
}

const EMPTY_SUBJEKT: Subjekt = {
  zapnuto: false, typOsoby: 'fo', nazev: '', ic: '', dic: '',
  ...EMPTY_ADRESA, ...EMPTY_UCET,
}

const SUBJEKT_DEFS: { key: 'platce' | 'neplatce'; kod: string; nazev: string; popis: string; jePlatce: boolean }[] = [
  {
    key: 'platce', kod: 'DPH', nazev: 'Plátce DPH',
    popis: 'Subjekt registrovaný k DPH - fakturace včetně DPH', jePlatce: true,
  },
  {
    key: 'neplatce', kod: 'BEZ', nazev: 'Neplátce DPH',
    popis: 'Subjekt bez registrace k DPH - fakturace bez DPH', jePlatce: false,
  },
]

// ── Layout helpers ────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
}

/** Odznak stavu bloku - dokud něco chybí, je oranžový. */
function stavVariant(chybi: number): 'success' | 'warning' {
  return chybi > 0 ? 'warning' : 'success'
}

function Card({ icon: Icon, title, description, badge, children }: {
  icon: LucideIcon
  title: string
  description: string
  badge?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section style={CARD}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: 'var(--t-bgMyDOCKTertiary)', color: 'var(--t-textMyDOCKPrimary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={iconSize.md} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ ...typography.body16Semibold, margin: 0, color: 'var(--t-textPrimary)' }}>{title}</h2>
          <p style={{ ...typography.body12Regular, margin: 0, color: 'var(--t-textSecondary)' }}>{description}</p>
        </div>
        {badge}
      </header>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </section>
  )
}

/** Popisek bloku uvnitř karty - overline (11 px, verzálky). */
function BlockLabel({ children }: { children: string }) {
  return (
    <span style={{ ...typography.overline11, color: 'var(--t-textTertiary)' }}>{children}</span>
  )
}

/** Blok polí oddělený čárkovanou linkou. */
function Block({ label, first, children }: { label: string; first?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      borderTop: first ? undefined : '1px dashed var(--t-borderPrimary)',
      paddingTop: first ? 0 : 16,
    }}>
      <BlockLabel>{label}</BlockLabel>
      {children}
    </div>
  )
}

function Cols({ cols, children }: { cols: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, alignItems: 'start' }}>
      {children}
    </div>
  )
}

/** Pole s tlačítkem vedle - tlačítko se srovná na horní hranu pole pod popiskem. */
function FieldWithAction({ field, action }: { field: React.ReactNode; action: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>{field}</div>
      <div style={{ marginTop: 24, flexShrink: 0 }}>{action}</div>
    </div>
  )
}

function Note({ children }: { children: string }) {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      background: 'var(--bgSuccessTertiary)',
      borderLeft: '2px solid var(--borderSuccess)',
      borderRadius: 6, padding: '8px 12px', marginTop: 24,
    }}>
      <CircleCheck size={iconSize.sm} style={{ color: 'var(--textSuccessPrimary)', flexShrink: 0, marginTop: 1 }} />
      <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>{children}</span>
    </div>
  )
}

function SidebarCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section style={CARD}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 8px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'var(--t-bgMyDOCKTertiary)', color: 'var(--t-textMyDOCKPrimary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={iconSize.md} />
        </div>
        <h2 style={{ ...typography.body16Semibold, margin: 0, color: 'var(--t-textPrimary)' }}>{title}</h2>
      </header>
      <div style={{ padding: '0 16px 12px' }}>
        {children}
      </div>
    </section>
  )
}

/** Zapínatelná dlaždice - hlavička s přepínačem, po zapnutí se rozbalí obsah. */
function ToggleCard({ kod, nazev, popis, zapnuto, badge, onToggle, children }: {
  kod: string
  nazev: string
  popis: string
  zapnuto: boolean
  badge?: React.ReactNode
  onToggle: (zapnuto: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div style={{
      border: '1px solid var(--t-borderPrimary)',
      borderRadius: 10,
      background: zapnuto ? 'var(--t-bgPrimary)' : 'var(--t-bgSecondary)',
    }}>
      <div
        role="switch"
        aria-checked={zapnuto}
        tabIndex={0}
        onClick={() => onToggle(!zapnuto)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle(!zapnuto)
          }
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: 12,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{
          width: 40, height: 28, borderRadius: 6, flexShrink: 0,
          background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)',
          color: 'var(--t-textSecondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...typography.body10Semibold,
        }}>
          {kod}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...typography.body14Semibold, color: 'var(--t-textPrimary)' }}>{nazev}</div>
          <div style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>{popis}</div>
        </div>
        {badge}
        <Toggle checked={zapnuto} decorative />
      </div>
      {zapnuto && children}
    </div>
  )
}

/** Řádek tabulky notifikací - zdroj a zaškrtávátka pro e-mail a SMS. */
function NotifikaceRadek({ label, popis, first, email, sms, onEmail, onSms }: {
  label: string
  popis: string
  first?: boolean
  email: boolean
  sms: boolean
  onEmail: (v: boolean) => void
  onSms: (v: boolean) => void
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 72px 72px', alignItems: 'center', gap: 12,
      padding: '10px 4px',
      borderTop: first ? undefined : '1px dashed var(--t-borderPrimary)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)' }}>{label}</div>
        <div style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>{popis}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Checkbox checked={email} onChange={onEmail} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Checkbox checked={sms} onChange={onSms} />
      </div>
    </div>
  )
}

/** Řádek náhledu profilu na webu - ikona a hodnota, nebo pomlčka. */
function NahledRadek({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
      borderTop: '1px dashed var(--t-borderPrimary)',
    }}>
      <Icon size={iconSize.sm} style={{ color: 'var(--t-textTertiary)', flexShrink: 0 }} />
      <span style={{
        ...typography.body12Regular,
        color: value ? 'var(--t-textPrimary)' : 'var(--t-textTertiary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value || '–'}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NovyUzivatelPage() {
  const navigate = useNavigate()

  // Osoba
  const [stav, setStav] = useState<Stav>('aktivni')
  const [titulPred, setTitulPred] = useState('')
  const [jmeno, setJmeno] = useState('')
  const [prijmeni, setPrijmeni] = useState('')
  const [titulZa, setTitulZa] = useState('')
  const [osobniEmail, setOsobniEmail] = useState('')
  const [predvolba, setPredvolba] = useState('+420')
  const [telefon, setTelefon] = useState('')
  const [datumNarozeni, setDatumNarozeni] = useState<Date | null>(null)
  const [rodneCislo, setRodneCislo] = useState('')
  const [cisloOp, setCisloOp] = useState('')
  const [bydliste, setBydliste] = useState<Adresa>(EMPTY_ADRESA)

  // Přihlášení
  const [firemniEmail, setFiremniEmail] = useState('')
  const [heslo, setHeslo] = useState('')
  const [hesloZnovu, setHesloZnovu] = useState('')
  const [hesloVidet, setHesloVidet] = useState(false)

  // Fakturace
  const [hppZapnuto, setHppZapnuto] = useState(false)
  const [hppUcet, setHppUcet] = useState<Ucet>(EMPTY_UCET)
  const [subjekty, setSubjekty] = useState<Record<'platce' | 'neplatce', Subjekt>>({
    platce: EMPTY_SUBJEKT,
    neplatce: EMPTY_SUBJEKT,
  })

  // Zařazení
  const [nadrizeny, setNadrizeny] = useState('')
  const [provize, setProvize] = useState('50')
  const [pobocka, setPobocka] = useState('')
  const [pozice, setPozice] = useState('')
  const [role, setRole] = useState('')

  // Web a exporty
  const [vlastniProfil, setVlastniProfil] = useState(true)
  const [pocetTopovani, setPocetTopovani] = useState('')
  const [medailonek, setMedailonek] = useState('')
  const [notifikace, setNotifikace] = useState<Record<NotifikaceKlic, { email: boolean; sms: boolean }>>({
    sreality: { email: false, sms: false },
    idnes: { email: false, sms: false },
    web: { email: false, sms: false },
  })

  // Kvalifikace
  const [zkouska, setZkouska] = useState(false)
  const [datumZkousky, setDatumZkousky] = useState<Date | null>(null)
  const [pojisteni, setPojisteni] = useState(false)
  const [vyrociPojisteni, setVyrociPojisteni] = useState<Date | null>(null)
  const [upozornitMaklere, setUpozornitMaklere] = useState(false)

  // Dokumenty
  const [dokumenty] = useState<string[]>([])

  const [showErrors, setShowErrors] = useState(false)
  const [zahoditOpen, setZahoditOpen] = useState(false)

  const zapnuteFakturace = ([
    hppZapnuto && 'hpp',
    subjekty.platce.zapnuto && 'platce',
    subjekty.neplatce.zapnuto && 'neplatce',
  ].filter(Boolean)) as FakturaceKey[]

  function setSubjekt(key: 'platce' | 'neplatce', patch: Partial<Subjekt>) {
    setSubjekty(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  function toggleSubjekt(key: 'platce' | 'neplatce', zapnuto: boolean) {
    // Vypnutím se rozpracovaná data subjektu zahodí - jinak by se odeslalo něco,
    // co uživatel nevidí.
    setSubjekty(prev => ({
      ...prev,
      [key]: zapnuto ? { ...prev[key], zapnuto: true } : { ...EMPTY_SUBJEKT },
    }))
  }

  function setNotifikaci(zdroj: NotifikaceKlic, kanal: 'email' | 'sms', value: boolean) {
    setNotifikace(prev => ({ ...prev, [zdroj]: { ...prev[zdroj], [kanal]: value } }))
  }

  function pouzitBydliste(key: 'platce' | 'neplatce') {
    setSubjekt(key, { ...bydliste })
  }

  function doplnitZProfilu(key: 'platce' | 'neplatce') {
    setSubjekt(key, { nazev: `${jmeno} ${prijmeni}`.trim() })
  }

  function zkopirovatZPlatce() {
    // Neplátce DIČ nemá, proto se nekopíruje.
    setSubjekty(prev => ({ ...prev, neplatce: { ...prev.platce, dic: '' } }))
  }

  function vygenerovatHeslo() {
    const znaky = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let nove = ''
    for (let i = 0; i < 12; i++) nove += znaky[Math.floor(Math.random() * znaky.length)]
    setHeslo(nove)
    setHesloZnovu(nove)
    setHesloVidet(true)
  }

  // ── Validace ────────────────────────────────────────────────────────────────

  const errors: Record<string, string> = {}
  const digits = (v: string) => v.replace(/\D/g, '')
  const jeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

  if (!jmeno.trim()) errors.jmeno = 'Zadejte jméno.'
  if (!prijmeni.trim()) errors.prijmeni = 'Zadejte příjmení.'
  if (!osobniEmail.trim()) errors.osobniEmail = 'Zadejte osobní e-mail.'
  else if (!jeEmail(osobniEmail)) errors.osobniEmail = 'Zadejte e-mail ve formátu jmeno@email.cz.'
  if (!telefon.trim()) errors.telefon = 'Zadejte telefonní číslo.'
  else if (digits(telefon).length !== 9) errors.telefon = 'Telefonní číslo má 9 číslic.'
  if (!datumNarozeni) errors.datumNarozeni = 'Vyberte datum narození.'
  if (!rodneCislo.trim()) errors.rodneCislo = 'Zadejte rodné číslo.'
  else if (digits(rodneCislo).length < 9) errors.rodneCislo = 'Rodné číslo má 9 nebo 10 číslic.'
  if (!cisloOp.trim()) errors.cisloOp = 'Zadejte číslo občanského průkazu.'

  if (!bydliste.ulice.trim()) errors['bydliste.ulice'] = 'Zadejte ulici.'
  if (!bydliste.cisloPopisne.trim()) errors['bydliste.cisloPopisne'] = 'Zadejte číslo popisné.'
  if (!bydliste.mesto.trim()) errors['bydliste.mesto'] = 'Zadejte město.'
  if (!bydliste.psc.trim()) errors['bydliste.psc'] = 'Zadejte PSČ.'
  else if (digits(bydliste.psc).length !== 5) errors['bydliste.psc'] = 'PSČ má 5 číslic.'

  if (!firemniEmail.trim()) errors.firemniEmail = 'Zadejte firemní e-mail.'
  else if (!jeEmail(firemniEmail)) errors.firemniEmail = 'Zadejte e-mail ve formátu jmeno@firma.cz.'
  if (heslo && heslo.length < 8) errors.heslo = 'Heslo musí mít alespoň 8 znaků.'
  if (heslo !== hesloZnovu) errors.hesloZnovu = 'Hesla se neshodují.'

  if (zapnuteFakturace.length === 0) errors.fakturace = 'Zapněte alespoň jeden způsob fakturace.'

  if (hppZapnuto) {
    if (!hppUcet.cisloUctu.trim()) errors['hpp.cisloUctu'] = 'Zadejte číslo účtu.'
    if (!hppUcet.kodBanky) errors['hpp.kodBanky'] = 'Vyberte banku.'
  }

  for (const def of SUBJEKT_DEFS) {
    const s = subjekty[def.key]
    if (!s.zapnuto) continue
    const p = `${def.key}.`
    if (!s.nazev.trim()) {
      errors[`${p}nazev`] = s.typOsoby === 'po' ? 'Zadejte obchodní název.' : 'Zadejte jméno a příjmení.'
    }
    if (!s.ic.trim()) errors[`${p}ic`] = 'Zadejte IČ.'
    else if (digits(s.ic).length !== 8) errors[`${p}ic`] = 'IČ má 8 číslic.'
    if (def.jePlatce) {
      if (!s.dic.trim()) errors[`${p}dic`] = 'Zadejte DIČ.'
      else if (digits(s.dic).length < 8) errors[`${p}dic`] = 'DIČ má 8 až 10 číslic.'
    }
    if (!s.ulice.trim()) errors[`${p}ulice`] = 'Zadejte ulici.'
    if (!s.cisloPopisne.trim()) errors[`${p}cisloPopisne`] = 'Zadejte číslo popisné.'
    if (!s.mesto.trim()) errors[`${p}mesto`] = 'Zadejte město.'
    if (!s.psc.trim()) errors[`${p}psc`] = 'Zadejte PSČ.'
    else if (digits(s.psc).length !== 5) errors[`${p}psc`] = 'PSČ má 5 číslic.'
    if (!s.cisloUctu.trim()) errors[`${p}cisloUctu`] = 'Zadejte číslo účtu.'
    if (!s.kodBanky) errors[`${p}kodBanky`] = 'Vyberte banku.'
  }

  if (!nadrizeny) errors.nadrizeny = 'Vyberte nadřízeného.'
  if (provize.trim() && (Number(provize) < 0 || Number(provize) > 100 || Number.isNaN(Number(provize)))) {
    errors.provize = 'Podíl zadejte mezi 0 a 100 %.'
  }
  if (!pobocka) errors.pobocka = 'Vyberte pobočku.'
  if (!pozice) errors.pozice = 'Vyberte pozici.'
  if (!role) errors.role = 'Vyberte roli.'

  if (medailonek.length > MEDAILONEK_MAX) errors.medailonek = `Medailonek může mít nejvýš ${MEDAILONEK_MAX} znaků.`

  if (zkouska && !datumZkousky) errors.datumZkousky = 'Vyberte datum absolvování zkoušky.'
  if (pojisteni && !vyrociPojisteni) errors.vyrociPojisteni = 'Vyberte výročí smlouvy.'

  const err = (key: string) => (showErrors ? errors[key] : undefined)

  /** Počet chybějících polí bloku - ukazuje se hned, bez čekání na odeslání. */
  const chybi = (prefix: string) => Object.keys(errors).filter(k => k.startsWith(prefix)).length

  const dirty = Boolean(
    jmeno || prijmeni || osobniEmail || telefon || firemniEmail || rodneCislo || cisloOp ||
    datumNarozeni || bydliste.ulice || bydliste.mesto || nadrizeny || pobocka || pozice || role ||
    medailonek || pocetTopovani || zapnuteFakturace.length > 0 || zkouska || pojisteni ||
    stav !== 'aktivni' || !vlastniProfil || provize !== '50'
  )

  /** `_pozvat` rozliší „Uložit" a „Uložit a pozvat" - v prototypu bez API se chovají stejně. */
  function ulozit(_pozvat: boolean) {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }
    // Prototyp bez API - uživatel se po vytvoření neukládá, vracíme se na seznam.
    navigate('/uzivatele')
  }

  function zahodit() {
    if (dirty) setZahoditOpen(true)
    else navigate('/uzivatele')
  }

  // ── Souhrn ──────────────────────────────────────────────────────────────────

  const fakturaceSouhrn = zapnuteFakturace.length === 0
    ? 'Nevybráno'
    : zapnuteFakturace
      .map(k => {
        if (k === 'hpp') return 'HPP'
        const s = subjekty[k as 'platce' | 'neplatce']
        const typ = s.typOsoby === 'po' ? 'PO' : 'FO'
        return `${k === 'platce' ? 'Plátce DPH' : 'Neplátce DPH'} (${typ})`
      })
      .join(' + ')

  const topovaniSouhrn = Number(pocetTopovani) > 0 ? `${pocetTopovani} inzerátů` : 'Netopuje'

  const kvalifikaceSouhrn = [zkouska && 'Zkouška', pojisteni && 'Pojištění']
    .filter(Boolean).join(' + ') || 'Žádná'

  const souhrnRows: { label: string; value: React.ComponentProps<typeof SummaryListItem>['value'] }[] = [
    { label: 'Fakturace', value: { kind: 'text', text: fakturaceSouhrn } },
    { label: 'Vlastní profil', value: { kind: 'text', text: vlastniProfil ? 'Ano' : 'Ne' } },
    { label: 'Exportovat jako', value: { kind: 'text', text: vlastniProfil ? 'Vlastní jméno' : 'Jméno pobočky' } },
    { label: 'Topování', value: { kind: 'text', text: topovaniSouhrn } },
    { label: 'Kvalifikace', value: { kind: 'text', text: kvalifikaceSouhrn } },
    {
      label: 'Dokumenty',
      value: { kind: 'text', text: dokumenty.length > 0 ? `${dokumenty.length} souborů` : 'Žádné' },
    },
  ]

  const celeJmeno = [titulPred, jmeno, prijmeni, titulZa].filter(Boolean).join(' ')
  const iniciály = `${jmeno[0] ?? ''}${prijmeni[0] ?? ''}`

  // ── Fakturační subjekt ──────────────────────────────────────────────────────

  function subjektBody(def: typeof SUBJEKT_DEFS[number]) {
    const s = subjekty[def.key]
    const p = `${def.key}.`
    const jePo = s.typOsoby === 'po'
    const set = (patch: Partial<Subjekt>) => setSubjekt(def.key, patch)

    return (
      <div style={{ borderTop: '1px solid var(--t-borderPrimary)', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Block label="Typ osoby" first>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <SwitchGroup
              options={TYP_OSOBY_OPTIONS}
              value={s.typOsoby}
              onChange={v => set({ typOsoby: v as TypOsoby })}
              size="compact"
            />
            <TextButton
              label="Použít trvalé bydliště" size="sm" variant="secondary" leadIcon={Home}
              onClick={() => pouzitBydliste(def.key)}
            />
            {def.key === 'neplatce' && subjekty.platce.zapnuto && (
              <TextButton
                label="Zkopírovat z plátce" size="sm" variant="secondary" leadIcon={Copy}
                onClick={zkopirovatZPlatce}
              />
            )}
          </div>
          <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
            {jePo
              ? 'Firma zapsaná v obchodním registru (s.r.o., a.s., …).'
              : 'Podnikatel bez obchodního názvu - uveďte jméno, příjmení a místo podnikání.'}
          </span>
        </Block>

        <Block label="Identifikace subjektu">
          {jePo ? (
            <Input
              label="Obchodní název" required placeholder="Např. Novák reality s.r.o."
              value={s.nazev} onChange={v => set({ nazev: v })}
              error={err(`${p}nazev`)} width="100%"
            />
          ) : (
            <FieldWithAction
              field={
                <Input
                  label="Jméno a příjmení" required placeholder="Zadejte jméno a příjmení"
                  value={s.nazev} onChange={v => set({ nazev: v })}
                  error={err(`${p}nazev`)} width="100%"
                />
              }
              action={
                <Button
                  label="Doplnit z profilu" variant="outlined" size="md"
                  onClick={() => doplnitZProfilu(def.key)}
                />
              }
            />
          )}

          <Cols cols="1fr 1fr">
            <FieldWithAction
              field={
                <Input
                  label="IČ" required placeholder="12345678" numeric
                  value={s.ic} onChange={v => set({ ic: v })}
                  error={err(`${p}ic`)}
                  helperText="Načtením z ARES se doplní název a adresa."
                  width="100%"
                />
              }
              action={<Button label="Načíst z ARES" variant="outlined" size="md" />}
            />
            {def.jePlatce ? (
              <Input
                label="DIČ" required placeholder="12345678" leadBadge="CZ"
                value={s.dic} onChange={v => set({ dic: v })}
                error={err(`${p}dic`)} width="100%"
              />
            ) : (
              <Note>Neplátce DPH nemá DIČ - pole se proto nezadává.</Note>
            )}
          </Cols>
        </Block>

        <Block label={jePo ? 'Sídlo' : 'Místo podnikání'}>
          <Cols cols="1.4fr 1fr 1fr">
            <Input
              label="Ulice" required placeholder="Zadejte ulici"
              value={s.ulice} onChange={v => set({ ulice: v })}
              error={err(`${p}ulice`)} width="100%"
            />
            <Input
              label={CP_LABEL} required placeholder="12" numeric
              value={s.cisloPopisne} onChange={v => set({ cisloPopisne: v })}
              error={err(`${p}cisloPopisne`)} width="100%"
            />
            <Input
              label={CO_LABEL} placeholder="3"
              value={s.cisloOrientacni} onChange={v => set({ cisloOrientacni: v })}
              width="100%"
            />
          </Cols>
          <Cols cols="1.4fr 1fr 1fr">
            <Input
              label="Město" required placeholder="Zadejte město"
              value={s.mesto} onChange={v => set({ mesto: v })}
              error={err(`${p}mesto`)} width="100%"
            />
            <Input
              label="PSČ" required placeholder="110 00"
              value={s.psc} onChange={v => set({ psc: v })}
              error={err(`${p}psc`)} width="100%"
            />
            <div />
          </Cols>
        </Block>

        <Block label="Bankovní účet pro výplatu">
          <Cols cols="1fr 1.4fr 1fr">
            <Input
              label="Předčíslí účtu" placeholder="000000" numeric
              value={s.predcisli} onChange={v => set({ predcisli: v })} width="100%"
            />
            <Input
              label="Číslo účtu" required placeholder="1234567890" numeric
              value={s.cisloUctu} onChange={v => set({ cisloUctu: v })}
              error={err(`${p}cisloUctu`)} width="100%"
            />
            <Select
              label="Kód banky" required placeholder="Vyberte banku"
              value={s.kodBanky} onChange={v => set({ kodBanky: v })}
              options={BANKY} searchable
              error={err(`${p}kodBanky`)} width="100%"
            />
          </Cols>
        </Block>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: 'var(--t-bgSecondary)', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header — stránka je fullscreen, bez topbaru a sidebaru; akce jsou v patičce */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--t-bgSecondary)', borderBottom: '1px solid var(--t-borderPrimary)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '16px 24px',
          display: 'flex', alignItems: 'flex-start', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
            <IconButton icon={ArrowLeft} variant="ghost" size="md" tooltip="Zpět na seznam" onClick={zahodit} />
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h1 style={{
                ...typography.headline24, margin: 0, color: 'var(--t-textPrimary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {celeJmeno || 'Nový uživatel'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Tag label="Nový záznam" size="sm" variant="neutral" />
                <Tag
                  label={stav === 'aktivni' ? 'Aktivní' : 'Neaktivní'}
                  size="sm" lead="indicator"
                  variant={stav === 'aktivni' ? 'success' : 'danger'}
                />
                <Tag
                  label={zapnuteFakturace.length === 0 ? 'Bez fakturačních údajů' : fakturaceSouhrn}
                  size="sm"
                  variant={zapnuteFakturace.length === 0 ? 'neutral' : 'success'}
                />
                <Tag
                  label={vlastniProfil ? 'Vlastní profil' : 'Bez vlastního profilu'}
                  size="sm"
                  variant={vlastniProfil ? 'success' : 'neutral'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: 24, flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20, alignItems: 'flex-start' }}>

          {/* Formulář */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Card
              icon={Power}
              title="Stav uživatele"
              description="Aktivní uživatel se může přihlásit, zobrazuje se na webu a jeho inzerce se exportuje"
              badge={
                <SwitchGroup
                  options={STAV_OPTIONS}
                  value={stav}
                  onChange={v => setStav(v as Stav)}
                  size="compact"
                />
              }
            />

            <Card
              icon={UserRound}
              title="Osoba"
              description="Identita uživatele, kontakt a trvalé bydliště"
            >
              <Block label="Identita" first>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {iniciály.trim()
                      ? <Avatar size="xxl" initials={iniciály} color="orange" />
                      : (
                        <div style={{
                          width: 64, height: 64, borderRadius: '50%',
                          background: 'var(--t-bgSecondary)', border: '1px dashed var(--t-borderPrimary)',
                          color: 'var(--t-textTertiary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Camera size={iconSize.lg} />
                        </div>
                      )}
                    <TextButton label="Nahrát foto" size="sm" variant="brand" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Cols cols="0.8fr 1.2fr 1.2fr 0.8fr">
                      <Input
                        label="Titul před jménem" placeholder="Ing."
                        value={titulPred} onChange={setTitulPred} width="100%"
                      />
                      <Input
                        label="Jméno" required placeholder="Jan"
                        value={jmeno} onChange={setJmeno} error={err('jmeno')} width="100%"
                      />
                      <Input
                        label="Příjmení" required placeholder="Novák"
                        value={prijmeni} onChange={setPrijmeni} error={err('prijmeni')} width="100%"
                      />
                      <Input
                        label="Titul za jménem" placeholder="MBA"
                        value={titulZa} onChange={setTitulZa} width="100%"
                      />
                    </Cols>
                    <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                      Profilová fotografie: JPG na výšku nebo čtverec, nejméně 1000 × 1000 px, nejvýš 2 MB. Fotografie se
                      používá na webu, v exportech i v PDF výstupech.
                    </span>
                  </div>
                </div>
              </Block>

              <Block label="Kontakt a doklady">
                <Cols cols="1fr 1fr">
                  <Input
                    label="Osobní e-mail" required type="email" placeholder="jan.novak@email.cz"
                    value={osobniEmail} onChange={setOsobniEmail} error={err('osobniEmail')} width="100%"
                  />
                  <Input
                    label="Telefon" required placeholder="777 123 456"
                    value={telefon} onChange={setTelefon}
                    leadSelect={{
                      value: predvolba,
                      options: PREDVOLBY,
                      onChange: setPredvolba,
                      ariaLabel: 'Předvolba státu',
                    }}
                    error={err('telefon')} width="100%"
                  />
                </Cols>
                <Cols cols="1fr 1fr 1fr">
                  <DatePicker
                    label="Datum narození" required
                    value={datumNarozeni} onChange={setDatumNarozeni}
                    maxDate={new Date()}
                    error={err('datumNarozeni')}
                  />
                  <Input
                    label="Rodné číslo" required placeholder="900101/1234"
                    value={rodneCislo} onChange={setRodneCislo} error={err('rodneCislo')} width="100%"
                  />
                  <Input
                    label="Číslo občanského průkazu" required placeholder="123456789" numeric
                    value={cisloOp} onChange={setCisloOp} error={err('cisloOp')} width="100%"
                  />
                </Cols>
              </Block>

              <Block label="Trvalé bydliště">
                <Cols cols="1.4fr 1fr 1fr">
                  <Input
                    label="Ulice" required placeholder="Zadejte ulici"
                    value={bydliste.ulice} onChange={v => setBydliste(p => ({ ...p, ulice: v }))}
                    error={err('bydliste.ulice')} width="100%"
                  />
                  <Input
                    label={CP_LABEL} required placeholder="12" numeric
                    value={bydliste.cisloPopisne} onChange={v => setBydliste(p => ({ ...p, cisloPopisne: v }))}
                    error={err('bydliste.cisloPopisne')} width="100%"
                  />
                  <Input
                    label={CO_LABEL} placeholder="3"
                    value={bydliste.cisloOrientacni} onChange={v => setBydliste(p => ({ ...p, cisloOrientacni: v }))}
                    width="100%"
                  />
                </Cols>
                <Cols cols="1.4fr 1fr 1fr">
                  <Input
                    label="Město" required placeholder="Zadejte město"
                    value={bydliste.mesto} onChange={v => setBydliste(p => ({ ...p, mesto: v }))}
                    error={err('bydliste.mesto')} width="100%"
                  />
                  <Input
                    label="PSČ" required placeholder="110 00"
                    value={bydliste.psc} onChange={v => setBydliste(p => ({ ...p, psc: v }))}
                    error={err('bydliste.psc')} width="100%"
                  />
                  <div />
                </Cols>
              </Block>
            </Card>

            <Card
              icon={Lock}
              title="Přihlášení do systému"
              description="Firemní e-mail slouží jako přihlašovací jméno"
              badge={
                <Tag
                  label={heslo ? 'Heslo nastaveno' : 'Pozvánka e-mailem'}
                  size="sm"
                  variant={heslo ? 'success' : 'neutral'}
                />
              }
            >
              <Cols cols="1fr 1fr">
                <Input
                  label="Firemní e-mail" required type="email" placeholder="jan.novak@firma.cz"
                  value={firemniEmail} onChange={setFiremniEmail} error={err('firemniEmail')} width="100%"
                />
                <div />
              </Cols>
              <Cols cols="1fr 1fr">
                <Input
                  label="Heslo" placeholder="Zadejte heslo"
                  type={hesloVidet ? 'text' : 'password'}
                  value={heslo} onChange={setHeslo}
                  trailIcon={hesloVidet ? EyeOff : Eye}
                  onTrailIconClick={() => setHesloVidet(v => !v)}
                  trailIconLabel={hesloVidet ? 'Skrýt heslo' : 'Zobrazit heslo'}
                  helperText="Nejméně 8 znaků."
                  error={err('heslo')} width="100%"
                />
                <FieldWithAction
                  field={
                    <Input
                      label="Heslo znovu" placeholder="Zadejte heslo znovu"
                      type={hesloVidet ? 'text' : 'password'}
                      value={hesloZnovu} onChange={setHesloZnovu}
                      error={err('hesloZnovu')} width="100%"
                    />
                  }
                  action={
                    <Button
                      label="Vygenerovat heslo" variant="outlined" size="md"
                      leadIcon={RefreshCw} onClick={vygenerovatHeslo}
                    />
                  }
                />
              </Cols>
              <Alert
                variant="info"
                label="Heslo můžete nechat prázdné"
                description="Bez hesla použijte akci Uložit a pozvat - uživatel dostane e-mailem pozvánku a heslo si nastaví sám."
              />
            </Card>

            <Card
              icon={Receipt}
              title="Fakturační údaje"
              description="Vyberte, jak makléř s kanceláří spolupracuje"
              badge={
                <Tag
                  label={zapnuteFakturace.length === 0 ? 'Nevybráno' : `${zapnuteFakturace.length} ze 3 nastaveno`}
                  size="sm"
                  variant={zapnuteFakturace.length === 0 ? 'neutral' : 'success'}
                />
              }
            >
              <Alert
                variant="info"
                rich
                label="Nejde o přepínač"
                description="Makléř může mít zaměstnanecký poměr, fakturovat jako plátce DPH, jako neplátce DPH, nebo mít víc těchto způsobů současně. Zapněte ty, které skutečně platí - alespoň jeden je povinný."
              />

              <ToggleCard
                kod="HPP"
                nazev="HPP"
                popis="Zaměstnanec - stačí bankovní účet pro výplatu"
                zapnuto={hppZapnuto}
                badge={
                  <Tag
                    label={hppZapnuto && chybi('hpp.') > 0 ? `${chybi('hpp.')} k doplnění` : hppZapnuto ? 'Nastaveno' : 'Vypnuto'}
                    size="sm"
                    variant={hppZapnuto ? (stavVariant(chybi('hpp.'))) : 'neutral'}
                  />
                }
                onToggle={zapnuto => {
                  setHppZapnuto(zapnuto)
                  if (!zapnuto) setHppUcet(EMPTY_UCET)
                }}
              >
                <div style={{ borderTop: '1px solid var(--t-borderPrimary)', padding: 16 }}>
                  <Block label="Bankovní účet pro výplatu" first>
                    <Cols cols="1fr 1.4fr 1fr">
                      <Input
                        label="Předčíslí účtu" placeholder="000000" numeric
                        value={hppUcet.predcisli} onChange={v => setHppUcet(p => ({ ...p, predcisli: v }))}
                        width="100%"
                      />
                      <Input
                        label="Číslo účtu" required placeholder="1234567890" numeric
                        value={hppUcet.cisloUctu} onChange={v => setHppUcet(p => ({ ...p, cisloUctu: v }))}
                        error={err('hpp.cisloUctu')} width="100%"
                      />
                      <Select
                        label="Kód banky" required placeholder="Vyberte banku"
                        value={hppUcet.kodBanky} onChange={v => setHppUcet(p => ({ ...p, kodBanky: v }))}
                        options={BANKY} searchable
                        error={err('hpp.kodBanky')} width="100%"
                      />
                    </Cols>
                  </Block>
                </div>
              </ToggleCard>

              {SUBJEKT_DEFS.map(def => {
                const s = subjekty[def.key]
                const pocet = chybi(`${def.key}.`)
                return (
                  <ToggleCard
                    key={def.key}
                    kod={def.kod}
                    nazev={def.nazev}
                    popis={def.popis}
                    zapnuto={s.zapnuto}
                    badge={
                      <Tag
                        label={s.zapnuto ? (pocet > 0 ? `${pocet} k doplnění` : s.typOsoby === 'po' ? 'Právnická osoba' : 'Fyzická osoba') : 'Vypnuto'}
                        size="sm"
                        variant={s.zapnuto ? stavVariant(pocet) : 'neutral'}
                      />
                    }
                    onToggle={zapnuto => toggleSubjekt(def.key, zapnuto)}
                  >
                    {subjektBody(def)}
                  </ToggleCard>
                )
              })}

              {err('fakturace') && (
                <span style={{ ...typography.body12Semibold, color: 'var(--t-textDangerPrimary)' }}>
                  {errors.fakturace}
                </span>
              )}
            </Card>

            <Card
              icon={Briefcase}
              title="Zařazení a pozice"
              description="Nadřízený, provize a zařazení na pobočce"
            >
              <Cols cols="1fr 1fr">
                <Select
                  label="Nadřízený" required placeholder="Vyberte nadřízeného"
                  value={nadrizeny} onChange={setNadrizeny}
                  options={NADRIZENI} searchable
                  error={err('nadrizeny')} width="100%"
                />
                <Input
                  label="Provize" suffix="%" numeric placeholder="50"
                  value={provize} onChange={setProvize}
                  helperText="Podíl uživatele z provize za obchod."
                  error={err('provize')} width="100%"
                />
              </Cols>
              <Block label="Pozice">
                <Cols cols="1fr 1fr 1fr">
                  <Select
                    label="Pobočka" required placeholder="Vyberte pobočku"
                    value={pobocka} onChange={setPobocka}
                    options={POBOCKY} searchable
                    error={err('pobocka')} width="100%"
                  />
                  <Select
                    label="Pozice" required placeholder="Vyberte pozici"
                    value={pozice} onChange={setPozice}
                    options={POZICE}
                    error={err('pozice')} width="100%"
                  />
                  <Select
                    label="Role" required placeholder="Vyberte roli"
                    value={role} onChange={setRole}
                    options={ROLE}
                    error={err('role')} width="100%"
                  />
                </Cols>
                <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                  Pozice určuje, jak se uživatel prezentuje na webu. Role určuje jeho práva v aplikaci.
                </span>
              </Block>
            </Card>

            <Card
              icon={Globe}
              title="Web a exporty"
              description="Jak uživatel vystupuje na webu a na inzertních portálech"
              badge={
                <Tag
                  label={vlastniProfil ? 'Vlastní profil' : 'Bez vlastního profilu'}
                  size="sm"
                  variant={vlastniProfil ? 'success' : 'neutral'}
                />
              }
            >
              <ToggleCard
                kod="WEB"
                nazev="Export vlastním profilem"
                popis="Uživatel se zobrazuje na webu a inzerce se exportuje pod jeho jménem a fotografií"
                zapnuto={vlastniProfil}
                onToggle={setVlastniProfil}
              />

              <Block label="Topování">
                <div style={{ maxWidth: 280 }}>
                  <Input
                    label="Počet topování" numeric placeholder="0"
                    value={pocetTopovani} onChange={setPocetTopovani}
                    helperText="Kolik inzerátů může uživatel držet topovaných. Prázdné pole nebo 0 znamená, že topovat nemůže."
                    width="100%"
                  />
                </div>
              </Block>

              <Block label="Medailonek">
                <TextArea
                  placeholder="Zadejte krátké představení makléře"
                  value={medailonek} onChange={setMedailonek}
                  helperText={`Zobrazí se na webu a v PDF prezentacích. Zbývá ${Math.max(0, MEDAILONEK_MAX - medailonek.length)} znaků.`}
                  error={err('medailonek')}
                  minHeight={110} width="100%"
                />
              </Block>

              <Block label="Notifikace na nové poptávky">
                <div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 72px 72px', gap: 12,
                    padding: '0 4px 6px',
                  }}>
                    <span style={{ ...typography.body12Semibold, color: 'var(--t-textSecondary)' }}>Zdroj</span>
                    <span style={{ ...typography.body12Semibold, color: 'var(--t-textSecondary)', textAlign: 'center' }}>E-mail</span>
                    <span style={{ ...typography.body12Semibold, color: 'var(--t-textSecondary)', textAlign: 'center' }}>SMS</span>
                  </div>
                  {NOTIFIKACE_ZDROJE.map((zdroj, i) => (
                    <NotifikaceRadek
                      key={zdroj.key}
                      label={zdroj.label}
                      popis={zdroj.popis}
                      first={i === 0}
                      email={notifikace[zdroj.key].email}
                      sms={notifikace[zdroj.key].sms}
                      onEmail={v => setNotifikaci(zdroj.key, 'email', v)}
                      onSms={v => setNotifikaci(zdroj.key, 'sms', v)}
                    />
                  ))}
                </div>
              </Block>
            </Card>

            <Card
              icon={GraduationCap}
              title="Kvalifikace a pojištění"
              description="Zákonné požadavky podle zákona o realitním zprostředkování"
              badge={<Tag label={kvalifikaceSouhrn} size="sm" variant={zkouska || pojisteni ? 'success' : 'neutral'} />}
            >
              <ToggleCard
                kod="ZK"
                nazev="Zkouška realitního zprostředkovatele"
                popis="Odborná zkouška podle zákona č. 39/2020 Sb."
                zapnuto={zkouska}
                onToggle={zapnuto => {
                  setZkouska(zapnuto)
                  if (!zapnuto) setDatumZkousky(null)
                }}
              >
                <div style={{ borderTop: '1px solid var(--t-borderPrimary)', padding: 16 }}>
                  <div style={{ maxWidth: 280 }}>
                    <DatePicker
                      label="Datum absolvování" required
                      value={datumZkousky} onChange={setDatumZkousky}
                      maxDate={new Date()}
                      error={err('datumZkousky')}
                    />
                  </div>
                </div>
              </ToggleCard>

              <ToggleCard
                kod="POJ"
                nazev="Pojištění profesní odpovědnosti"
                popis="Povinné pojištění pro výkon realitní činnosti"
                zapnuto={pojisteni}
                onToggle={zapnuto => {
                  setPojisteni(zapnuto)
                  if (!zapnuto) {
                    setVyrociPojisteni(null)
                    setUpozornitMaklere(false)
                  }
                }}
              >
                <div style={{ borderTop: '1px solid var(--t-borderPrimary)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ maxWidth: 280 }}>
                    <DatePicker
                      label="Výročí smlouvy" required
                      value={vyrociPojisteni} onChange={setVyrociPojisteni}
                      error={err('vyrociPojisteni')}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox checked={upozornitMaklere} onChange={setUpozornitMaklere} />
                    <div>
                      <div style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)' }}>Upozornit makléře</div>
                      <div style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                        Upozornění odejde makléři e-mailem měsíc před výročím smlouvy.
                      </div>
                    </div>
                  </div>
                </div>
              </ToggleCard>
            </Card>

            <Card
              icon={FileText}
              title="Dokumenty"
              description="Smlouvy, certifikáty, pojistky a další soubory uživatele"
              badge={
                <Tag
                  label={dokumenty.length > 0 ? `${dokumenty.length} souborů` : 'Žádné soubory'}
                  size="sm"
                  variant={dokumenty.length > 0 ? 'success' : 'neutral'}
                />
              }
            >
              <FileUploadArea
                variant="advanced"
                subtitle="PDF, JPG, PNG, DOCX nebo XLSX · nejvýš 20 MB na soubor"
              />
              <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                Nahrané dokumenty se uloží společně s uživatelem.
              </span>
            </Card>
          </div>

          {/* Náhled + souhrn */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 115 }}>
            <SidebarCard icon={Eye} title="Náhled na webu">
              <div style={{
                border: '1px solid var(--t-borderPrimary)', borderRadius: 10, overflow: 'hidden',
                background: 'var(--t-bgPrimary)',
              }}>
                <div style={{
                  height: 56,
                  background: 'linear-gradient(135deg, #E05524 0%, #F08A5D 100%)',
                }} />
                <div style={{ padding: '0 12px 12px', marginTop: -28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {iniciály.trim()
                    ? <Avatar size="xl" initials={iniciály} color="orange" ring />
                    : (
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'var(--t-bgSecondary)', border: '2px solid var(--t-bgPrimary)',
                        color: 'var(--t-textTertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        ...typography.body16Semibold,
                      }}>
                        ?
                      </div>
                    )}
                  <div style={{ ...typography.body14Semibold, color: 'var(--t-textPrimary)', textAlign: 'center' }}>
                    {celeJmeno || 'Jméno Příjmení'}
                  </div>
                  <div style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)', textAlign: 'center' }}>
                    {[pozice, pobocka].filter(Boolean).join(' · ') || 'Pozice · Pobočka'}
                  </div>
                  <div style={{ width: '100%', marginTop: 4 }}>
                    <NahledRadek icon={Phone} value={telefon ? `${predvolba} ${telefon}` : ''} />
                    <NahledRadek icon={Mail} value={firemniEmail} />
                  </div>
                </div>
              </div>
              <p style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)', margin: '8px 0 0' }}>
                {vlastniProfil
                  ? 'Takto se uživatel zobrazí v seznamu makléřů na webu.'
                  : 'Uživatel se na webu nezobrazuje - inzerce se exportuje pod jménem pobočky.'}
              </p>
            </SidebarCard>

            <SidebarCard icon={ClipboardCheck} title="Stav nastavení">
              <div>
                {souhrnRows.map((row, i) => (
                  <div key={row.label} style={{
                    borderTop: i === 0 ? undefined : '1px dashed var(--t-borderPrimary)',
                  }}>
                    <SummaryListItem label={row.label} value={row.value} length="short" align="right" />
                  </div>
                ))}
              </div>
            </SidebarCard>
          </div>
        </div>
      </div>

      {/* Patička s akcemi */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 20,
        background: 'var(--t-bgSecondary)', borderTop: '1px solid var(--t-borderPrimary)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Button label="Zahodit" variant="outlined" size="md" onClick={zahodit} />
            <Button label="Uložit" variant="outlined" size="md" leadIcon={Check} onClick={() => ulozit(false)} />
            <Button label="Uložit a pozvat" variant="primary" size="md" leadIcon={Send} onClick={() => ulozit(true)} />
          </div>
        </div>
      </div>

      {zahoditOpen && (
        <ConfirmDialog
          title="Zahodit nového uživatele?"
          description="Vyplněné údaje se neuloží."
          primaryLabel="Zahodit"
          secondaryLabel="Pokračovat v úpravách"
          destructive
          onPrimary={() => navigate('/uzivatele')}
          onSecondary={() => setZahoditOpen(false)}
        />
      )}
    </div>
  )
}
