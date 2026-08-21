import { Fragment, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Building2, Eye, EyeOff, Trash2, UserRound } from 'lucide-react'
import {
  Avatar, Button, Checkbox, CheckboxItem, DatePicker, Divider, FileUploadArea, IconButton,
  Input, RadioGroupItem, Select, SwitchGroup, Tag, TextArea, TextButton, Toggle, TooltipIcon,
  typography,
} from '@matusgallo/mysabds'
import AdresaNaseptavac from '../components/shared/AdresaNaseptavac'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import TelefonInput from '../components/shared/TelefonInput'
import type { AdresniMisto } from '../data/adresyRegistr'
import { pobockyData, roleData, uzivateleData } from '../data/mockOstatni'
import { chybaTelefonu } from '../data/telefonPredvolby'
import {
  EMPTY_SUBJEKT, EMPTY_UCET,
  emptyUzivatelForm, uzivatelFormFromRow,
  type Adresa, type Dokument, type Foto, type Notifikace, type NotifikaceKlic,
  type Stav, type Subjekt, type SubjektKey, type TypOsoby, type Ucet,
  type UzivatelForm, type Zpusob,
} from '../data/uzivatelForm'

// ── Volby ────────────────────────────────────────────────────────────────────

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
  { value: 'aktivni', label: 'Aktivní' },
  { value: 'neaktivni', label: 'Neaktivní' },
]

const TYP_OSOBY_OPTIONS = [
  { value: 'fo', label: 'Fyzická osoba', icon: UserRound },
  { value: 'po', label: 'Právnická osoba', icon: Building2 },
]


const NOTIFIKACE_ZDROJE = [
  { key: 'sreality', label: 'Sreality.cz', popis: 'Nové poptávky z portálu Sreality.cz' },
  { key: 'idnes', label: 'reality iDNES.cz', popis: 'Nové poptávky z portálu reality iDNES.cz' },
  { key: 'web', label: 'Osobní web', popis: 'Nové poptávky z osobního webu makléře' },
] as const

const MEDAILONEK_MAX = 600

const TYP_DOKUMENTU = [
  'Smlouva', 'Certifikát / zkouška', 'Pojistná smlouva', 'Občanský průkaz', 'Ostatní',
].map(t => ({ value: t, label: t }))

/** Pod kým se inzerce exportuje, když makléř nemá vlastní profil. */
const EXPORT_ZASTUPCI = [...uzivateleData]
  .filter(u => u.role !== 'Makléř')
  .sort((a, b) => `${a.prijmeni} ${a.jmeno}`.localeCompare(`${b.prijmeni} ${b.jmeno}`, 'cs'))
  .map(u => ({ value: String(u.id), label: `${u.jmeno} ${u.prijmeni}`, sub: u.pobocka }))

// ── Model ─────────────────────────────────────────────────────────────────────

/**
 * Maska rodného čísla - uživatel píše jen číslice, lomítko doplní pole samo za
 * šestou číslicí. Delší než 10 číslic rodné číslo nikdy není, zbytek se zahodí.
 *
 * `smazaneLomitko` řeší mazání: kdyby maska po backspace lomítko hned vrátila,
 * uživatel by se přes šestou číslici nedostal zpátky.
 */
function maskaRodnehoCisla(hodnota: string, predchozi: string) {
  const smazaneLomitko = predchozi.endsWith('/') && hodnota === predchozi.slice(0, -1)
  let cifry = hodnota.replace(/\D/g, '').slice(0, 10)
  if (smazaneLomitko) cifry = cifry.slice(0, -1)
  return cifry.length >= 6 ? `${cifry.slice(0, 6)}/${cifry.slice(6)}` : cifry
}

/**
 * Adresa z našeptávače do polí formuláře. Část obce se nepřenáší - formulář pro
 * ni pole nemá a do města nepatří, protože to je jméno obce, ne její části.
 */
function adresaZRegistru(a: AdresniMisto): Adresa {
  return {
    ulice: a.ulice,
    cisloPopisne: a.cisloPopisne,
    cisloOrientacni: a.cisloOrientacni,
    psc: a.psc,
    mesto: a.mesto,
  }
}

function velikostSouboru(bytes: number) {
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} kB`
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`
}

function nacistFoto(file: File): Promise<Foto> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const zaklad = { nazev: file.name, velikost: velikostSouboru(file.size), url }
    const img = new Image()
    img.onload = () => resolve({ ...zaklad, sirka: img.naturalWidth, vyska: img.naturalHeight })
    img.onerror = () => resolve({ ...zaklad, sirka: 0, vyska: 0 })
    img.src = url
  })
}

/** Fotka musí být na výšku nebo čtverec a dost velká pro tisk. */
function fotoVarovani(foto: Foto): string | null {
  if (foto.sirka === 0) return null
  if (foto.sirka > foto.vyska) return 'Fotografie je na šířku. Použijte snímek na výšku nebo čtverec.'
  if (foto.sirka < 1000 || foto.vyska < 1000) return 'Fotografie je menší než 1000 × 1000 px, v tiskových výstupech bude rozmazaná.'
  return null
}

function pocetSouboru(pocet: number) {
  if (pocet === 1) return '1 soubor'
  if (pocet < 5) return `${pocet} soubory`
  return `${pocet} souborů`
}

/** Barva dlaždice podle přípony - stejná paleta jako File Upload Item v DS. */
const PRIPONA_BARVA: Record<string, string> = {
  pdf: '#CD2900', doc: '#2563EB', docx: '#2563EB',
  xls: '#16A34A', xlsx: '#16A34A',
  png: '#16A34A', jpg: '#9333EA', jpeg: '#9333EA',
}

/** Dlaždice s příponou souboru. */
function PriponaDlazdice({ pripona }: { pripona: string }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 6, flexShrink: 0,
      background: PRIPONA_BARVA[pripona] ?? '#737578', color: '#FFFFFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...typography.body10Semibold,
    }}>
      {pripona.slice(0, 4).toUpperCase()}
    </div>
  )
}

const SUBJEKT_DEFS: { key: SubjektKey; nazev: string; popis: string; jePlatce: boolean }[] = [
  {
    key: 'platce', nazev: 'Plátce DPH',
    popis: 'Subjekt registrovaný k DPH - fakturace včetně DPH', jePlatce: true,
  },
  {
    key: 'neplatce', nazev: 'Neplátce DPH',
    popis: 'Subjekt bez registrace k DPH - fakturace bez DPH', jePlatce: false,
  },
]

const SUBJEKT_KEYS = SUBJEKT_DEFS.map(d => d.key)

// ── Layout helpers ────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
}

function Card({ title, description, tooltip, badge, children }: {
  title: string
  /** Bez popisu zůstane v hlavičce jen nadpis - vysvětlení pak nese pole samo. */
  description?: string
  tooltip?: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section style={CARD}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {/* Nadpis widgetu = subheadline18Semibold */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h2 style={{ ...typography.subheadline18Semibold, margin: 0, color: 'var(--t-textPrimary)' }}>{title}</h2>
            {tooltip && <TooltipIcon content={tooltip} placement="right" />}
          </div>
          {description && (
            <p style={{ ...typography.body12Regular, margin: 0, color: 'var(--t-textSecondary)' }}>{description}</p>
          )}
        </div>
        {badge}
      </header>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </section>
  )
}

/** Popisek bloku uvnitř karty. */
function BlockLabel({ children }: { children: string }) {
  return (
    <span style={{ ...typography.body14Semibold, color: 'var(--t-textPrimary)' }}>{children}</span>
  )
}

/** Blok polí oddělený čárkovanou linkou; `action` sedí vpravo u popisku. */
function Block({ label, first, action, children }: {
  label: string
  first?: boolean
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      borderTop: first ? undefined : '1px dashed var(--t-borderPrimary)',
      paddingTop: first ? 0 : 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <BlockLabel>{label}</BlockLabel>
        {action}
      </div>
      {children}
    </div>
  )
}

function Cols({ cols, stejnaVyska, children }: {
  cols: string
  /** Karty vedle sebe srovná na stejnou výšku, i když má jedna delší popis */
  stejnaVyska?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: cols, gap: 12,
      alignItems: stejnaVyska ? 'stretch' : 'start',
    }}>
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

/**
 * Karta jako `CheckboxGroupItem` z DS (padding 16, radius 12), ale s přepínačem
 * místo checkboxu. Po zapnutí se obsah (`children`) rozbalí uvnitř karty.
 * Zapnutý stav nese přepínač a rozbalený obsah, rám zůstává neutrální.
 */
function ToggleCard({ label, supportText, description, checked, onChange, children }: {
  label: string
  supportText?: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  children?: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)

  // Karta nesmí mít `overflow: hidden` — ustřihla by rozbalený seznam Selectu.
  // Spodní rohy si proto zaobluje sám rozbalený obsah.
  return (
    <div style={{
      borderRadius: 12, background: 'var(--t-bgPrimary)',
      outline: `1px solid var(--t-border${hovered ? 'PrimaryHover' : 'Primary'})`,
      outlineOffset: -0.5,
      transition: 'outline-color .15s',
    }}>
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onChange(!checked)
          }
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: 16,
          display: 'flex', alignItems: 'flex-start', gap: 12,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)' }}>{label}</span>
            {supportText && (
              <span style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>{supportText}</span>
            )}
          </div>
          <div style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>{description}</div>
        </div>
        <Toggle checked={checked} decorative />
      </div>
      {checked && children && (
        <>
          <Divider />
          {children}
        </>
      )}
    </div>
  )
}

/** Tělo rozbalené přepínací karty - podbarvené, se zaoblenými spodními rohy. */
/**
 * Řádek s přepínačem bez rámu - po zapnutí se pod ním rozbalí obsah. Sousední
 * řádky odděluje `Divider`, ne box: rámy uvnitř karty tříští obsah.
 */
function PrepinacRadek({ label, supportText, description, checked, onChange, children }: {
  label: string
  supportText?: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div>
      <div
        className="toggle-card-head"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onChange(!checked)
          }
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)' }}>{label}</span>
            {supportText && (
              <span style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>{supportText}</span>
            )}
          </div>
          {description && (
            <div style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>{description}</div>
          )}
        </div>
        <Toggle checked={checked} decorative />
      </div>
      {/* Bez obsahu se obal nevykreslí - jinak by po řádku zbylo prázdné odsazení. */}
      {checked && children && (
        <div style={{ padding: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function ToggleCardBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--t-bgSecondary)', padding: 16,
      borderRadius: '0 0 11px 11px',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {children}
    </div>
  )
}

/**
 * Řádek souhrnu s vlastní hodnotou - míry kopírují `SummaryListItem`
 * (24 px, gap 12, popisek 14/400 textSecondary, hodnota vpravo). Potřeba tam,
 * kde hodnota nese barvu: `SummaryListItem` vykresluje `kind: 'badges'`
 * natvrdo jako `Tag variant="neutral"`.
 */
function SouhrnRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', minHeight: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{
        flex: '0 1 auto', ...typography.body14Regular, color: 'var(--t-textSecondary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

/** Textová hodnota souhrnu - delší text láme řádky doprava, ne doleva. */
function SouhrnHodnota({ text, barva }: { text: string; barva?: 'success' | 'danger' }) {
  const color = barva === 'success' ? 'var(--t-textSuccessPrimary)'
    : barva === 'danger' ? 'var(--t-textDangerPrimary)'
      : 'var(--t-textPrimary)'
  return (
    <span style={{ ...typography.body14Medium, color, textAlign: 'right' }}>
      {text}
    </span>
  )
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={CARD}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
        <h2 style={{ ...typography.subheadline18Semibold, margin: 0, color: 'var(--t-textPrimary)' }}>{title}</h2>
      </header>
      <div style={{ padding: '0 16px 16px' }}>
        {children}
      </div>
    </section>
  )
}

/**
 * Pole pro profilovou fotografii - dokud není nahraná, je vidět plocha pro
 * přetažení; po nahrání kruhový náhled s parametry souboru a akcemi.
 */
function FotoPole({ foto, iniciály, onVybrat, onOdebrat }: {
  foto: Foto | null
  iniciály: string
  onVybrat: (file: File) => void
  onOdebrat: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const varovani = foto ? fotoVarovani(foto) : null

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) onVybrat(file)
          e.target.value = ''
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {foto ? (
          <img
            src={foto.url}
            alt=""
            style={{
              width: 64, height: 64, objectFit: 'cover', flexShrink: 0,
              borderRadius: '50%', background: 'var(--t-bgSecondary)',
            }}
          />
        ) : iniciály ? (
          <Avatar size="xxl" initials={iniciály} color="orange" />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'var(--t-bgSecondary)',
            boxShadow: 'inset 0 0 0 1px var(--t-borderPrimary)',
          }} />
        )}
        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              label={foto ? 'Nahradit' : 'Nahrát fotografii'}
              variant="outlined" size="md"
              onClick={() => inputRef.current?.click()}
            />
            {foto && <Button label="Odebrat" variant="outlined" size="md" destructive onClick={onOdebrat} />}
          </div>
          {foto ? (
            <>
              <span style={{
                ...typography.body12Regular, color: 'var(--t-textSecondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {foto.nazev} · {foto.sirka > 0 ? `${foto.sirka} × ${foto.vyska} px · ` : ''}{foto.velikost}
              </span>
              {varovani && (
                <span style={{ ...typography.body12Regular, color: 'var(--t-textWarningPrimary)' }}>
                  {varovani}
                </span>
              )}
            </>
          ) : (
            <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
              JPG nebo PNG · od 1000 × 1000 px · do 2 MB · Fotografie se používá na webu, v exportech i v PDF výstupech.
            </span>
          )}
        </div>
      </div>
    </>
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
      padding: '10px 0',
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UzivatelFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate()
  const { id } = useParams()

  const isEdit = mode === 'edit'
  const row = isEdit ? uzivateleData.find(u => String(u.id) === id) : undefined
  // Výchozí hodnoty se spočítají jednou — u editace z existujícího záznamu.
  const [init] = useState<UzivatelForm>(() => (row ? uzivatelFormFromRow(row) : emptyUzivatelForm()))

  // Osoba
  const [stav, setStav] = useState<Stav>(init.stav)
  const [titulPred, setTitulPred] = useState(init.titulPred)
  const [jmeno, setJmeno] = useState(init.jmeno)
  const [prijmeni, setPrijmeni] = useState(init.prijmeni)
  const [titulZa, setTitulZa] = useState(init.titulZa)
  const [osobniEmail, setOsobniEmail] = useState(init.osobniEmail)
  const [predvolba, setPredvolba] = useState(init.predvolba)
  const [telefon, setTelefon] = useState(init.telefon)
  const [datumNarozeni, setDatumNarozeni] = useState<Date | null>(init.datumNarozeni)
  const [rodneCislo, setRodneCislo] = useState(init.rodneCislo)
  const [cisloOp, setCisloOp] = useState(init.cisloOp)
  const [bydliste, setBydliste] = useState<Adresa>(init.bydliste)
  const [foto, setFoto] = useState<Foto | null>(init.foto)

  // Přihlášení
  const [firemniEmail, setFiremniEmail] = useState(init.firemniEmail)
  const [heslo, setHeslo] = useState('')
  const [hesloZnovu, setHesloZnovu] = useState('')
  const [hesloVidet, setHesloVidet] = useState(false)

  // Fakturace
  const [zpusob, setZpusob] = useState<Zpusob | null>(init.zpusob)
  const [hppUcet, setHppUcet] = useState<Ucet>(init.hppUcet)
  const [subjekty, setSubjekty] = useState<Record<SubjektKey, Subjekt>>(init.subjekty)

  // Zařazení
  const [nadrizeny, setNadrizeny] = useState(init.nadrizeny)
  const [provize, setProvize] = useState(init.provize)
  const [pobocka, setPobocka] = useState(init.pobocka)
  const [pozice, setPozice] = useState(init.pozice)
  const [role, setRole] = useState(init.role)

  // Web a exporty
  const [vlastniProfil, setVlastniProfil] = useState(init.vlastniProfil)
  const [pocetTopovani, setPocetTopovani] = useState(init.pocetTopovani)
  const [medailonek, setMedailonek] = useState(init.medailonek)
  const [notifikace, setNotifikace] = useState<Notifikace>(init.notifikace)

  // Kvalifikace
  const [zkouska, setZkouska] = useState(init.zkouska)
  const [datumZkousky, setDatumZkousky] = useState<Date | null>(init.datumZkousky)
  const [pojisteni, setPojisteni] = useState(init.pojisteni)
  const [vyrociPojisteni, setVyrociPojisteni] = useState<Date | null>(init.vyrociPojisteni)
  const [upozornitMaklere, setUpozornitMaklere] = useState(init.upozornitMaklere)

  // Dokumenty
  const [dokumenty, setDokumenty] = useState<Dokument[]>(init.dokumenty)
  const [exportovatJako, setExportovatJako] = useState(init.exportovatJako)
  const dokumentyInputRef = useRef<HTMLInputElement>(null)

  const [showErrors, setShowErrors] = useState(false)
  const [zavritOpen, setZavritOpen] = useState(false)

  const zapnuteSubjekty = SUBJEKT_KEYS.filter(k => subjekty[k].zapnuto)

  /** Popis vybraného způsobu fakturace pro odznak karty a souhrn. */
  const fakturaceLabel = zpusob === null
    ? 'Nevybráno'
    : zpusob === 'hpp' ? 'HPP'
      : zapnuteSubjekty.length === 2 ? 'Plátce i neplátce DPH'
        : zapnuteSubjekty.length === 1 ? (zapnuteSubjekty[0] === 'platce' ? 'Plátce DPH' : 'Neplátce DPH')
          : 'Bez subjektu'

  function setSubjekt(key: SubjektKey, patch: Partial<Subjekt>) {
    setSubjekty(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  /** Přepnutí větve zahodí data té druhé - jinak by se odeslalo něco, co není vidět. */
  function vybratZpusob(novy: Zpusob) {
    if (novy === zpusob) return
    setZpusob(novy)
    if (novy === 'hpp') {
      setSubjekty({ platce: { ...EMPTY_SUBJEKT }, neplatce: { ...EMPTY_SUBJEKT } })
    } else {
      setHppUcet(EMPTY_UCET)
    }
  }

  function toggleSubjekt(key: SubjektKey, zapnuto: boolean) {
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

  function pouzitBydliste(key: SubjektKey) {
    setSubjekt(key, { ...bydliste })
  }

  function doplnitZProfilu(key: SubjektKey) {
    setSubjekt(key, { jmeno, prijmeni })
  }

  function zkopirovatZPlatce() {
    // Neplátce DIČ nemá, proto se nekopíruje.
    setSubjekty(prev => ({ ...prev, neplatce: { ...prev.platce, dic: '' } }))
  }

  function vybratFoto(file: File) {
    nacistFoto(file).then(nove => {
      // Předchozí náhled se uvolní, jinak by objektová URL zůstala v paměti.
      setFoto(prev => {
        if (prev) URL.revokeObjectURL(prev.url)
        return nove
      })
    })
  }

  function odebratFoto() {
    setFoto(prev => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }

  function vygenerovatHeslo() {
    const znaky = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let nove = ''
    for (let i = 0; i < 12; i++) nove += znaky[Math.floor(Math.random() * znaky.length)]
    setHeslo(nove)
    setHesloZnovu(nove)
    setHesloVidet(true)
  }

  function pridatDokumenty(files: FileList | null) {
    if (!files || files.length === 0) return
    const dnes = new Date().toLocaleDateString('cs-CZ')
    const nove: Dokument[] = Array.from(files).map((file, i) => ({
      id: Date.now() + i,
      nazev: file.name,
      velikost: velikostSouboru(file.size),
      pripona: file.name.split('.').pop()?.toLowerCase() ?? '',
      typ: '',
      pridano: dnes,
    }))
    setDokumenty(prev => [...prev, ...nove])
  }

  function nastavitTypDokumentu(id: number, typ: string) {
    setDokumenty(prev => prev.map(d => (d.id === id ? { ...d, typ } : d)))
  }

  function smazatDokument(id: number) {
    setDokumenty(prev => prev.filter(d => d.id !== id))
  }

  // ── Validace ────────────────────────────────────────────────────────────────

  const errors: Record<string, string> = {}
  const digits = (v: string) => v.replace(/\D/g, '')
  const jeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

  if (!jmeno.trim()) errors.jmeno = 'Zadejte jméno.'
  if (!prijmeni.trim()) errors.prijmeni = 'Zadejte příjmení.'
  if (!osobniEmail.trim()) errors.osobniEmail = 'Zadejte osobní e-mail.'
  else if (!jeEmail(osobniEmail)) errors.osobniEmail = 'Zadejte e-mail ve formátu jmeno@email.cz.'
  const chybaTel = chybaTelefonu(predvolba, telefon)
  if (chybaTel) errors.telefon = chybaTel
  if (!datumNarozeni) errors.datumNarozeni = 'Vyberte datum narození.'
  if (!rodneCislo.trim()) errors.rodneCislo = 'Zadejte rodné číslo.'
  else if (digits(rodneCislo).length < 9) errors.rodneCislo = 'Rodné číslo má 9 nebo 10 číslic.'
  if (!cisloOp.trim()) errors.cisloOp = 'Zadejte číslo občanského průkazu.'

  if (!bydliste.ulice.trim()) errors['bydliste.ulice'] = 'Zadejte ulici.'
  if (!bydliste.cisloPopisne.trim()) errors['bydliste.cisloPopisne'] = 'Zadejte číslo popisné.'
  if (!bydliste.psc.trim()) errors['bydliste.psc'] = 'Zadejte PSČ.'
  else if (digits(bydliste.psc).length !== 5) errors['bydliste.psc'] = 'PSČ má 5 číslic.'
  if (!bydliste.mesto.trim()) errors['bydliste.mesto'] = 'Zadejte město.'

  if (!firemniEmail.trim()) errors.firemniEmail = 'Zadejte firemní e-mail.'
  else if (!jeEmail(firemniEmail)) errors.firemniEmail = 'Zadejte e-mail ve formátu jmeno@firma.cz.'
  if (heslo && heslo.length < 8) errors.heslo = 'Heslo musí mít alespoň 8 znaků.'
  if (heslo !== hesloZnovu) errors.hesloZnovu = 'Hesla se neshodují.'

  if (zpusob === null) errors.fakturace = 'Vyberte, jak makléř s kanceláří spolupracuje.'
  if (zpusob === 'fakturace' && zapnuteSubjekty.length === 0) {
    errors.fakturace = 'Zapněte alespoň jeden fakturační subjekt.'
  }

  if (zpusob === 'hpp') {
    if (!hppUcet.cisloUctu.trim()) errors['hpp.cisloUctu'] = 'Zadejte číslo účtu.'
    if (!hppUcet.kodBanky) errors['hpp.kodBanky'] = 'Vyberte banku.'
  }

  for (const def of SUBJEKT_DEFS) {
    const s = subjekty[def.key]
    if (!s.zapnuto) continue
    const p = `${def.key}.`
    if (s.typOsoby === 'po') {
      if (!s.obchodniNazev.trim()) errors[`${p}obchodniNazev`] = 'Zadejte obchodní název.'
    } else {
      if (!s.jmeno.trim()) errors[`${p}jmeno`] = 'Zadejte jméno.'
      if (!s.prijmeni.trim()) errors[`${p}prijmeni`] = 'Zadejte příjmení.'
    }
    if (!s.ic.trim()) errors[`${p}ic`] = 'Zadejte IČ.'
    else if (digits(s.ic).length !== 8) errors[`${p}ic`] = 'IČ má 8 číslic.'
    if (def.jePlatce) {
      if (!s.dic.trim()) errors[`${p}dic`] = 'Zadejte DIČ.'
      else if (digits(s.dic).length < 8) errors[`${p}dic`] = 'DIČ má 8 až 10 číslic.'
    }
    if (!s.ulice.trim()) errors[`${p}ulice`] = 'Zadejte ulici.'
    if (!s.cisloPopisne.trim()) errors[`${p}cisloPopisne`] = 'Zadejte číslo popisné.'
    if (!s.psc.trim()) errors[`${p}psc`] = 'Zadejte PSČ.'
    else if (digits(s.psc).length !== 5) errors[`${p}psc`] = 'PSČ má 5 číslic.'
    if (!s.mesto.trim()) errors[`${p}mesto`] = 'Zadejte město.'
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

  if (!vlastniProfil && !exportovatJako) errors.exportovatJako = 'Vyberte, pod kým se má inzerce exportovat.'
  for (const dokument of dokumenty) {
    if (!dokument.typ) errors[`dokument.${dokument.id}`] = 'Vyberte typ dokumentu.'
  }

  if (medailonek.length > MEDAILONEK_MAX) errors.medailonek = `Medailonek může mít nejvýš ${MEDAILONEK_MAX} znaků.`

  if (zkouska && !datumZkousky) errors.datumZkousky = 'Vyberte datum absolvování zkoušky.'
  if (pojisteni && !vyrociPojisteni) errors.vyrociPojisteni = 'Vyberte výročí smlouvy.'

  const err = (key: string) => (showErrors ? errors[key] : undefined)

  // Rozpracovaný formulář = cokoli jiného, než s čím se stránka otevřela.
  const dirty =
    stav !== init.stav ||
    titulPred !== init.titulPred ||
    jmeno !== init.jmeno ||
    prijmeni !== init.prijmeni ||
    titulZa !== init.titulZa ||
    osobniEmail !== init.osobniEmail ||
    predvolba !== init.predvolba ||
    telefon !== init.telefon ||
    datumNarozeni !== init.datumNarozeni ||
    rodneCislo !== init.rodneCislo ||
    cisloOp !== init.cisloOp ||
    foto !== init.foto ||
    firemniEmail !== init.firemniEmail ||
    heslo !== '' || hesloZnovu !== '' ||
    zpusob !== init.zpusob ||
    nadrizeny !== init.nadrizeny ||
    provize !== init.provize ||
    pobocka !== init.pobocka ||
    pozice !== init.pozice ||
    role !== init.role ||
    vlastniProfil !== init.vlastniProfil ||
    exportovatJako !== init.exportovatJako ||
    pocetTopovani !== init.pocetTopovani ||
    medailonek !== init.medailonek ||
    zkouska !== init.zkouska ||
    datumZkousky !== init.datumZkousky ||
    pojisteni !== init.pojisteni ||
    vyrociPojisteni !== init.vyrociPojisteni ||
    upozornitMaklere !== init.upozornitMaklere ||
    dokumenty.length !== init.dokumenty.length ||
    JSON.stringify(bydliste) !== JSON.stringify(init.bydliste) ||
    JSON.stringify(hppUcet) !== JSON.stringify(init.hppUcet) ||
    JSON.stringify(subjekty) !== JSON.stringify(init.subjekty) ||
    JSON.stringify(notifikace) !== JSON.stringify(init.notifikace)

  function ulozit() {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }
    // Prototyp bez API - uživatel se neukládá, vracíme se na seznam.
    navigate('/uzivatele')
  }

  function zavrit() {
    if (dirty) setZavritOpen(true)
    else navigate('/uzivatele')
  }

  // ── Souhrn ──────────────────────────────────────────────────────────────────

  function souhrnSubjekt(key: SubjektKey) {
    const s = subjekty[key]
    if (!s.zapnuto) return 'Nenastaveno'
    const typ = s.typOsoby === 'po' ? 'PO' : 'FO'
    const nazev = s.typOsoby === 'po' ? s.obchodniNazev.trim() : `${s.jmeno} ${s.prijmeni}`.trim()
    return `${typ} - ${nazev || 'bez názvu'}`
  }

  const celeJmeno = [titulPred, jmeno, prijmeni, titulZa].filter(Boolean).join(' ')
  const iniciály = `${jmeno[0] ?? ''}${prijmeni[0] ?? ''}`.trim()

  const souhrnRows: { label: string; text: string; barva?: 'success' | 'danger' }[] = [
    { label: 'Jméno', value: celeJmeno, fallback: '–' },
    { label: 'Telefon', value: telefon ? `${predvolba} ${telefon}` : '', fallback: '–' },
    { label: 'E-mail', value: firemniEmail, fallback: '–' },
    { label: 'Pozice', value: pozice, fallback: '–' },
    { label: 'Pobočka', value: pobocka, fallback: '–' },
    { label: 'Role', value: role, fallback: '–' },
    { label: 'Fakturace', value: fakturaceLabel, fallback: 'Nevybráno' },
    // Podrobnost k subjektu má smysl jen u toho zapnutého - HPP a fakturace se vylučují.
    ...(subjekty.platce.zapnuto ? [{ label: 'Plátce DPH', value: souhrnSubjekt('platce'), fallback: '–' }] : []),
    ...(subjekty.neplatce.zapnuto ? [{ label: 'Neplátce DPH', value: souhrnSubjekt('neplatce'), fallback: '–' }] : []),
    { label: 'Provize', value: provize ? `${provize} %` : '', fallback: '–' },
    { label: 'Topování', value: Number(pocetTopovani) > 0 ? `${pocetTopovani} inzerátů` : '', fallback: 'Netopuje' },
    {
      label: 'Export vlastním profilem',
      value: vlastniProfil ? 'Ano' : 'Ne',
      fallback: '–',
      barva: vlastniProfil ? 'success' as const : undefined,
    },
    {
      label: 'Exportovat jako',
      value: vlastniProfil
        ? 'Vlastní jméno'
        : EXPORT_ZASTUPCI.find(z => z.value === exportovatJako)?.label ?? '',
      fallback: 'Nevybráno',
    },
    { label: 'Dokumenty', value: dokumenty.length > 0 ? pocetSouboru(dokumenty.length) : '', fallback: 'Žádné' },
  ].map(row => ({
    label: row.label,
    text: row.value || row.fallback,
    barva: 'barva' in row ? row.barva : undefined,
  }))

  const kvalifikaceSouhrn = [zkouska && 'Zkouška', pojisteni && 'Pojištění'].filter(Boolean).join(' + ')

  // ── Fakturační subjekt ──────────────────────────────────────────────────────

  function subjektBody(def: typeof SUBJEKT_DEFS[number]) {
    const s = subjekty[def.key]
    const p = `${def.key}.`
    const jePo = s.typOsoby === 'po'
    const set = (patch: Partial<Subjekt>) => setSubjekt(def.key, patch)

    return (
      <ToggleCardBody>
        <Block
          label="Typ osoby"
          first
          action={def.key === 'neplatce' && subjekty.platce.zapnuto
            ? (
              <TextButton
                label="Zkopírovat z plátce" size="sm" variant="brand"
                onClick={zkopirovatZPlatce}
              />
            )
            : undefined}
        >
          <div>
            <SwitchGroup
              options={TYP_OSOBY_OPTIONS}
              value={s.typOsoby}
              onChange={v => set({ typOsoby: v as TypOsoby })}
              size="compact"
            />
          </div>
        </Block>

        <Block
          label="Identifikace subjektu"
          action={jePo
            ? undefined
            : (
              <TextButton
                label="Doplnit z profilu" size="sm" variant="brand"
                onClick={() => doplnitZProfilu(def.key)}
              />
            )}
        >
          {jePo ? (
            <Input
              label="Obchodní název" required
              placeholder="Např. Novák reality s.r.o."
              value={s.obchodniNazev} onChange={v => set({ obchodniNazev: v })}
              error={err(`${p}obchodniNazev`)} width="100%"
            />
          ) : (
            <Cols cols="minmax(0, 1fr) minmax(0, 1fr)">
              <Input
                label="Jméno" required placeholder="Zadejte jméno"
                value={s.jmeno} onChange={v => set({ jmeno: v })}
                error={err(`${p}jmeno`)} width="100%"
              />
              <Input
                label="Příjmení" required placeholder="Zadejte příjmení"
                value={s.prijmeni} onChange={v => set({ prijmeni: v })}
                error={err(`${p}prijmeni`)} width="100%"
              />
            </Cols>
          )}

          <Cols cols="1fr 1fr">
            <FieldWithAction
              field={
                <Input
                  label="IČ" required placeholder="12345678" numeric
                  value={s.ic} onChange={v => set({ ic: v })}
                  error={err(`${p}ic`)}
                  helperText="Z ARES se doplní název a adresa."
                  width="100%"
                />
              }
              action={<Button label="Načíst z ARES" variant="outlined" size="md" />}
            />
            {/* Neplátce DPH nemá DIČ — místo zůstane prázdné. */}
            {def.jePlatce && (
              <Input
                label="DIČ" required placeholder="12345678" leadBadge="CZ"
                value={s.dic} onChange={v => set({ dic: v })}
                error={err(`${p}dic`)} width="100%"
              />
            )}
          </Cols>
        </Block>

        <Block
          label={jePo ? 'Sídlo' : 'Místo podnikání'}
          action={
            <TextButton
              label="Použít trvalé bydliště" size="sm" variant="brand"
              onClick={() => pouzitBydliste(def.key)}
            />
          }
        >
          {/* Ulice bere zbytek místa, čísla jen tolik, kolik potřebuje popisek. */}
          <Cols cols="minmax(0, 1fr) 110px 120px">
            <AdresaNaseptavac
              required
              value={s.ulice}
              onChange={v => set({ ulice: v })}
              onVybrat={a => set(adresaZRegistru(a))}
              error={err(`${p}ulice`)}
            />
            <Input
              label="Číslo popisné" required placeholder="123" numeric
              value={s.cisloPopisne} onChange={v => set({ cisloPopisne: v })}
              error={err(`${p}cisloPopisne`)} width="100%"
            />
            <Input
              label="Číslo orientační" placeholder="4a"
              value={s.cisloOrientacni} onChange={v => set({ cisloOrientacni: v })}
              width="100%"
            />
          </Cols>
          <Cols cols="100px minmax(0, 1fr) 120px">
            <Input
              label="PSČ" required placeholder="110 00"
              value={s.psc} onChange={v => set({ psc: v })}
              error={err(`${p}psc`)} width="100%"
            />
            <Input
              label="Město" required placeholder="Zadejte město"
              value={s.mesto} onChange={v => set({ mesto: v })}
              error={err(`${p}mesto`)} width="100%"
            />
            <div />
          </Cols>
        </Block>

        <Block label="Bankovní účet pro výplatu">
          {/* Sloupec s bankou je 240 px — rozbalený seznam kopíruje šířku pole,
              takže se do něj vejde i delší název banky. */}
          <Cols cols="120px minmax(0, 1fr) 240px">
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
      </ToggleCardBody>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Kontrola až za hooky — jinak by se při přechodu mezi režimy rozešlo jejich pořadí.
  if (isEdit && !row) {
    return (
      <div style={{ padding: 24, ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>
        Uživatel nenalezen.
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--t-bgSecondary)', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header — stránka je fullscreen, bez topbaru a sidebaru; akce jsou v patičce */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--t-bgPrimary)', borderBottom: '1px solid var(--t-borderPrimary)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '16px 24px',
          display: 'flex', alignItems: 'flex-start', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <IconButton icon={ChevronLeft} variant="ghost" size="md" tooltip="Zpět na seznam" onClick={zavrit} />
            <h1 style={{
              ...typography.headline24, margin: 0, color: 'var(--t-textPrimary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isEdit ? 'Upravit uživatele' : 'Vytvořit uživatele'}
            </h1>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: 24, flex: 1 }}>
        {/* Souhrn zabírá třetinu šířky, formulář dvě třetiny */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20, alignItems: 'flex-start' }}>

          {/* Formulář */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Card title="Osoba">
              <Block label="Identita" first>
                <Cols cols="110px minmax(0, 1fr) minmax(0, 1fr) 110px">
                  <Input
                    label="Titul" placeholder="Např. Ing."
                    value={titulPred} onChange={setTitulPred} width="100%"
                  />
                  <Input
                    label="Jméno" required placeholder="Zadejte jméno"
                    value={jmeno} onChange={setJmeno} error={err('jmeno')} width="100%"
                  />
                  <Input
                    label="Příjmení" required placeholder="Zadejte příjmení"
                    value={prijmeni} onChange={setPrijmeni} error={err('prijmeni')} width="100%"
                  />
                  <Input
                    label="Titul za" placeholder="Např. MBA"
                    value={titulZa} onChange={setTitulZa} width="100%"
                  />
                </Cols>
              </Block>

              <Block label="Profilová fotografie">
                <FotoPole
                  foto={foto}
                  iniciály={iniciály}
                  onVybrat={vybratFoto}
                  onOdebrat={odebratFoto}
                />
              </Block>

              <Block label="Kontakt a doklady">
                <Cols cols="minmax(0, 1fr) minmax(0, 1fr)">
                  <Input
                    label="Osobní e-mail" required type="email" placeholder="jmeno@email.cz"
                    value={osobniEmail} onChange={setOsobniEmail} error={err('osobniEmail')} width="100%"
                  />
                  <TelefonInput
                    required
                    value={telefon} onChange={setTelefon}
                    predvolba={predvolba} onPredvolbaChange={setPredvolba}
                    error={err('telefon')}
                  />
                </Cols>
                <Cols cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)">
                  <DatePicker
                    label="Datum narození" required
                    value={datumNarozeni} onChange={setDatumNarozeni}
                    maxDate={new Date()}
                    error={err('datumNarozeni')}
                  />
                  <Input
                    label="Rodné číslo" required placeholder="900101/1234"
                    value={rodneCislo}
                    onChange={v => setRodneCislo(prev => maskaRodnehoCisla(v, prev))}
                    error={err('rodneCislo')} width="100%"
                  />
                  <Input
                    label="Číslo občanského průkazu" required placeholder="123456789" numeric
                    value={cisloOp} onChange={setCisloOp} error={err('cisloOp')} width="100%"
                  />
                </Cols>
              </Block>

              <Block label="Trvalé bydliště">
                <Cols cols="minmax(0, 1fr) 110px 120px">
                  <AdresaNaseptavac
                    required
                    value={bydliste.ulice}
                    onChange={v => setBydliste(p => ({ ...p, ulice: v }))}
                    onVybrat={a => setBydliste(p => ({ ...p, ...adresaZRegistru(a) }))}
                    error={err('bydliste.ulice')}
                  />
                  <Input
                    label="Číslo popisné" required placeholder="123" numeric
                    value={bydliste.cisloPopisne} onChange={v => setBydliste(p => ({ ...p, cisloPopisne: v }))}
                    error={err('bydliste.cisloPopisne')} width="100%"
                  />
                  <Input
                    label="Číslo orientační" placeholder="4a"
                    value={bydliste.cisloOrientacni} onChange={v => setBydliste(p => ({ ...p, cisloOrientacni: v }))}
                    width="100%"
                  />
                </Cols>
                <Cols cols="100px minmax(0, 1fr) 120px">
                  <Input
                    label="PSČ" required placeholder="110 00"
                    value={bydliste.psc} onChange={v => setBydliste(p => ({ ...p, psc: v }))}
                    error={err('bydliste.psc')} width="100%"
                  />
                  <Input
                    label="Město" required placeholder="Zadejte město"
                    value={bydliste.mesto} onChange={v => setBydliste(p => ({ ...p, mesto: v }))}
                    error={err('bydliste.mesto')} width="100%"
                  />
                  <div />
                </Cols>
              </Block>

            </Card>

            <Card title="Přihlášení do systému">
              <Cols cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)">
                <Input
                  label="Firemní e-mail" required type="email" placeholder="jmeno@firma.cz"
                  helperText="Slouží jako přihlašovací jméno."
                  value={firemniEmail} onChange={setFiremniEmail} error={err('firemniEmail')} width="100%"
                />
                <Input
                  label="Heslo" placeholder="Zadejte heslo"
                  type={hesloVidet ? 'text' : 'password'}
                  value={heslo} onChange={setHeslo}
                  trailIcon={hesloVidet ? EyeOff : Eye}
                  onTrailIconClick={() => setHesloVidet(v => !v)}
                  trailIconLabel={hesloVidet ? 'Skrýt heslo' : 'Zobrazit heslo'}
                  helperText="Bez hesla dostane uživatel e-mailem pozvánku a nastaví si ho sám."
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
                  action={<Button label="Vygenerovat" variant="outlined" size="md" onClick={vygenerovatHeslo} />}
                />
              </Cols>
            </Card>

            <Card
              title="Fakturační údaje"
              tooltip="Makléř je buď zaměstnanec na HPP, nebo kanceláři fakturuje. Fakturovat může jako plátce DPH, jako neplátce DPH, nebo pod oběma subjekty současně. Přepnutím větve se údaje té druhé zahodí."
            >
              {/* Vylučující se větve nese radio, ne přepínače - jinak by se
                  vzájemně vypínaly a uživatel by pravidlo poznal až po kliknutí. */}
              <Cols cols="minmax(0, 1fr) minmax(0, 1fr)" stejnaVyska>
                <RadioGroupItem
                  label="Zaměstnanec na HPP"
                  description="Kancelář vyplácí odměnu na bankovní účet"
                  checked={zpusob === 'hpp'}
                  onChange={() => vybratZpusob('hpp')}
                  width="100%"
                />
                <RadioGroupItem
                  label="Fakturuje kanceláři"
                  description="OSVČ nebo firma - plátce DPH, neplátce DPH, nebo obojí"
                  checked={zpusob === 'fakturace'}
                  onChange={() => vybratZpusob('fakturace')}
                  width="100%"
                />
              </Cols>

              {zpusob === 'hpp' && (
                <Block label="Bankovní účet pro výplatu">
                  <Cols cols="120px minmax(0, 1fr) 240px">
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
              )}

              {zpusob === 'fakturace' && (
                <Block label="Fakturační subjekty">
                  <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                    Zapněte ty, které makléř skutečně má - klidně oba současně. Alespoň jeden je povinný.
                  </span>
                  {SUBJEKT_DEFS.map(def => {
                    const s = subjekty[def.key]
                    const typLabel = s.typOsoby === 'po' ? 'Právnická osoba' : 'Fyzická osoba'
                    return (
                      <ToggleCard
                        key={def.key}
                        label={def.nazev}
                        supportText={s.zapnuto ? typLabel : undefined}
                        description={def.popis}
                        checked={s.zapnuto}
                        onChange={v => toggleSubjekt(def.key, v)}
                      >
                        {subjektBody(def)}
                      </ToggleCard>
                    )
                  })}
                </Block>
              )}

              {err('fakturace') && (
                <span style={{ ...typography.body12Semibold, color: 'var(--t-textDangerPrimary)' }}>
                  {errors.fakturace}
                </span>
              )}
            </Card>

            <Card
              title="Zařazení a pozice"
            >
              <Cols cols="minmax(0, 1fr) 160px">
                <Select
                  label="Nadřízený" required placeholder="Vyberte nadřízeného"
                  value={nadrizeny} onChange={setNadrizeny}
                  options={NADRIZENI} searchable
                  error={err('nadrizeny')} width="100%"
                />
                <Input
                  label="Provize" suffix="%" numeric placeholder="50"
                  value={provize} onChange={setProvize}
                  helperText="Podíl z provize za obchod."
                  error={err('provize')} width="100%"
                />
              </Cols>
              <Block label="Pozice">
                <Cols cols="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)">
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
              </Block>
            </Card>

            <Card
              title="Web a exporty"
              badge={
                <Tag
                  label={vlastniProfil ? 'Vlastní profil' : 'Cizí profil'}
                  size="sm"
                  variant={vlastniProfil ? 'success' : 'neutral'}
                />
              }
            >
              <PrepinacRadek
                label="Export vlastním profilem"
                supportText={vlastniProfil ? 'Vlastní jméno' : 'Jméno pobočky'}
                description={vlastniProfil
                  ? 'Uživatel se zobrazuje na webu a inzerce se exportuje pod jeho jménem a fotografií.'
                  : 'Uživatel se na webu nezobrazuje, inzerce se exportuje pod jménem pobočky.'}
                checked={vlastniProfil}
                onChange={zapnuto => {
                  setVlastniProfil(zapnuto)
                  if (zapnuto) setExportovatJako('')
                }}
              />

              {/* Bez vlastního profilu musí inzerci někdo zastoupit. */}
              {!vlastniProfil && (
                <Cols cols="minmax(0, 320px) minmax(0, 1fr)">
                  <Select
                    label="Exportovat jako" required placeholder="Vyberte zástupce"
                    value={exportovatJako} onChange={setExportovatJako}
                    options={EXPORT_ZASTUPCI} searchable
                    error={err('exportovatJako')} width="100%"
                  />
                  <div />
                </Cols>
              )}

              <Divider />

              {/* Jedno pole - popisek bloku ani poznámka vedle nejsou potřeba */}
              <Cols cols="minmax(0, 240px) minmax(0, 1fr)">
                <Input
                  label="Počet topování" numeric placeholder="0" suffix="inzerátů"
                  value={pocetTopovani} onChange={setPocetTopovani}
                  helperText="Bez hodnoty uživatel topovat nemůže."
                  width="100%"
                />
                <div />
              </Cols>

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
                    paddingBottom: 6,
                  }}>
                    <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>Zdroj</span>
                    <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)', textAlign: 'center' }}>E-mail</span>
                    <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)', textAlign: 'center' }}>SMS</span>
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
              title="Kvalifikace a pojištění"
            >
              <PrepinacRadek
                label="Zkouška realitního zprostředkovatele"
                description="Odborná zkouška podle zákona č. 39/2020 Sb."
                checked={zkouska}
                onChange={zapnuto => {
                  setZkouska(zapnuto)
                  if (!zapnuto) setDatumZkousky(null)
                }}
              >
                <Cols cols="240px minmax(0, 1fr)">
                  <DatePicker
                    label="Datum absolvování" required
                    value={datumZkousky} onChange={setDatumZkousky}
                    maxDate={new Date()}
                    error={err('datumZkousky')}
                  />
                  <div />
                </Cols>
              </PrepinacRadek>

              <Divider />

              <PrepinacRadek
                label="Pojištění profesní odpovědnosti"
                description="Povinné pojištění pro výkon realitní činnosti"
                checked={pojisteni}
                onChange={zapnuto => {
                  setPojisteni(zapnuto)
                  if (!zapnuto) {
                    setVyrociPojisteni(null)
                    setUpozornitMaklere(false)
                  }
                }}
              >
                <Cols cols="240px minmax(0, 1fr)">
                  <DatePicker
                    label="Výročí smlouvy" required
                    value={vyrociPojisteni} onChange={setVyrociPojisteni}
                    error={err('vyrociPojisteni')}
                  />
                  <div />
                </Cols>
                <CheckboxItem
                  label="Upozornit makléře"
                  description="Upozornění odejde makléři e-mailem měsíc před výročím smlouvy."
                  checked={upozornitMaklere}
                  onChange={setUpozornitMaklere}
                />
              </PrepinacRadek>
            </Card>

            <Card
              title="Dokumenty"
              badge={
                <Tag
                  label={dokumenty.length > 0 ? pocetSouboru(dokumenty.length) : 'Žádné soubory'}
                  size="sm"
                  variant={dokumenty.length > 0 ? 'success' : 'neutral'}
                />
              }
            >
              <input
                ref={dokumentyInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
                style={{ display: 'none' }}
                onChange={e => {
                  pridatDokumenty(e.target.files)
                  e.target.value = ''
                }}
              />
              <FileUploadArea
                variant="advanced"
                subtitle="PDF, JPG, PNG, DOCX nebo XLSX · nejvýš 20 MB na soubor"
                onSelect={() => dokumentyInputRef.current?.click()}
                onUpload={() => dokumentyInputRef.current?.click()}
              />

              {dokumenty.length > 0 && (
                <div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px 80px', gap: 12,
                    paddingBottom: 8,
                  }}>
                    <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>Soubor</span>
                    <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>Typ dokumentu</span>
                    <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)', textAlign: 'right' }}>Akce</span>
                  </div>
                  {dokumenty.map(dokument => (
                    <Fragment key={dokument.id}>
                      <Divider />
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px 80px', gap: 12,
                        alignItems: 'center', padding: '8px 0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <PriponaDlazdice pripona={dokument.pripona} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              ...typography.body14Medium, color: 'var(--t-textPrimary)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {dokument.nazev}
                            </div>
                            <div style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                              {dokument.velikost} · přidáno {dokument.pridano}
                            </div>
                          </div>
                        </div>
                        <Select
                          ariaLabel={`Typ dokumentu ${dokument.nazev}`}
                          placeholder="Vyberte typ"
                          value={dokument.typ}
                          onChange={typ => nastavitTypDokumentu(dokument.id, typ)}
                          options={TYP_DOKUMENTU}
                          error={err(`dokument.${dokument.id}`)}
                          width="100%"
                        />
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <IconButton icon={Eye} variant="outlined" size="md" tooltip="Zobrazit" />
                          <IconButton
                            icon={Trash2} variant="outlined" size="md" tooltip="Smazat"
                            onClick={() => smazatDokument(dokument.id)}
                          />
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Souhrn + náhled */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 89 }}>
            <SidebarCard title="Souhrn">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {souhrnRows.map((row, i) => (
                  <Fragment key={row.label}>
                    {i > 0 && <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />}
                    <SouhrnRow label={row.label}>
                      <SouhrnHodnota text={row.text} barva={row.barva} />
                    </SouhrnRow>
                  </Fragment>
                ))}
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SouhrnRow label="Kvalifikace">
                  {kvalifikaceSouhrn
                    ? <Tag label={kvalifikaceSouhrn} size="sm" variant="success" />
                    : <Tag label="Žádná" size="sm" variant="neutral" />}
                </SouhrnRow>
              </div>
            </SidebarCard>

            <SidebarCard title="Stav uživatele">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SwitchGroup
                  options={STAV_OPTIONS}
                  value={stav}
                  onChange={v => setStav(v as Stav)}
                  size="compact"
                  fullWidth
                />
                <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                  Aktivní uživatel se může přihlásit, zobrazuje se na webu a jeho inzerce se exportuje.
                </span>
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
            <Button label="Zavřít" variant="outlined" size="md" onClick={zavrit} />
            <Button
              label={isEdit ? 'Uložit změny' : heslo ? 'Vytvořit uživatele' : 'Vytvořit a pozvat'}
              variant="primary" size="md" onClick={ulozit}
            />
          </div>
        </div>
      </div>

      {zavritOpen && (
        <ConfirmDialog
          title={isEdit ? 'Zavřít bez uložení změn?' : 'Zavřít bez vytvoření uživatele?'}
          description={isEdit ? 'Provedené změny se neuloží.' : 'Vyplněné údaje se neuloží.'}
          primaryLabel="Zavřít"
          secondaryLabel="Pokračovat v úpravách"
          destructive
          onPrimary={() => navigate('/uzivatele')}
          onSecondary={() => setZavritOpen(false)}
        />
      )}
    </div>
  )
}
