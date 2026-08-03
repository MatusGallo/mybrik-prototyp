import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, MapPin, Star, Image as ImageIcon, Share2, FileText,
  Eye, EyeOff, ClipboardCheck, Check, CircleCheck, type LucideIcon,
} from 'lucide-react'
import {
  Alert, Button, FileUploadArea, IconButton, Input, Select, SummaryListItem,
  Tag, Toggle, ToggleItem, iconSize, typography,
} from '@matusgallo/mysabds'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { hspData, pobockyData } from '../data/mockOstatni'

// ── Data ──────────────────────────────────────────────────────────────────────

const HSP_OPTIONS = hspData
  .filter(h => h.stav === 'Aktivní')
  .map(h => ({ value: h.nazev, label: h.nazev }))
  .sort((a, b) => a.label.localeCompare(b.label, 'cs'))

const OSOBA_OPTIONS = [...new Set(pobockyData.map(p => p.odpovednaOsoba))]
  .sort((a, b) => a.localeCompare(b, 'cs'))
  .map(o => ({ value: o, label: o }))

const STAV_OPTIONS = ['Připravuje se', 'Aktivní', 'Neaktivní'].map(s => ({ value: s, label: s }))

const UMISTENI_OPTIONS = [
  { value: 'stred', label: 'Střed' },
  { value: 'vpravo-dole', label: 'Vpravo dole' },
  { value: 'vlevo-dole', label: 'Vlevo dole' },
  { value: 'dlazdice', label: 'Dlaždice přes celou fotografii' },
]

const HLAVNI_BARVY = ['#E8542A', '#1B1D21', '#1F5FA9', '#2E7D5B', '#7C4DFF']
const DOPLNKOVE_BARVY = ['#1B1D21', '#6E7379', '#B4522A', '#173A63', '#B9A25B']

const VYCHOZI_HLAVNI = '#E8542A'
const VYCHOZI_DOPLNKOVA = '#1B1D21'
const VYCHOZI_KRYTI = 75

// ── Exportní můstky ───────────────────────────────────────────────────────────

interface MustekPole {
  key: string
  label: string
  placeholder: string
  /** Údaj se v poli maskuje a odkrývá se tlačítkem */
  tajny?: boolean
}

interface MustekDef {
  key: string
  nazev: string
  pole: MustekPole[]
}

const MUSTKY: MustekDef[] = [
  {
    key: 'sreality', nazev: 'Sreality.cz',
    pole: [
      { key: 'idPobocky', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'hash', label: 'Hash pro přihlášení', placeholder: 'Zadejte hash', tajny: true },
      { key: 'klic', label: 'Klíč pro přihlášení', placeholder: 'Zadejte klíč', tajny: true },
      { key: 'idMaklere', label: 'ID makléře pro callcentrum', placeholder: 'Např. 1042' },
    ],
  },
  {
    key: 'realitymix', nazev: 'Reality MIX',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'klic', label: 'Klíč', placeholder: 'Zadejte klíč', tajny: true },
    ],
  },
  {
    key: 'bazos', nazev: 'Bazoš.cz',
    pole: [
      { key: 'jmeno', label: 'Přihlašovací jméno', placeholder: 'Zadejte jméno' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'realingo', nazev: 'Realingo',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'klic', label: 'Klíč', placeholder: 'Zadejte klíč', tajny: true },
    ],
  },
  {
    key: 'idnes', nazev: 'Reality iDNES.cz',
    pole: [
      { key: 'jmenoApi', label: 'Přihlašovací jméno k API', placeholder: 'Zadejte jméno' },
      { key: 'hesloApi', label: 'Heslo k API', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'jmenoFtp', label: 'Přihlašovací jméno k FTP', placeholder: 'Zadejte jméno' },
      { key: 'hesloFtp', label: 'Heslo k FTP', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'ceskereality', nazev: 'České reality',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'idFirmy', label: 'ID firmy', placeholder: 'Např. 3120' },
    ],
  },
  {
    key: 'ulovdomov', nazev: 'UlovDomov',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'eurobydleni', nazev: 'Eurobydlení',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'klic', label: 'Klíč', placeholder: 'Zadejte klíč', tajny: true },
    ],
  },
  {
    key: 'b3', nazev: 'B3 Technology',
    pole: [
      { key: 'idPobocky', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'hash', label: 'Hash pro přihlášení', placeholder: 'Zadejte hash', tajny: true },
      { key: 'klic', label: 'Klíč pro přihlášení', placeholder: 'Zadejte klíč', tajny: true },
      { key: 'idMaklere', label: 'ID makléře pro callcentrum', placeholder: 'Např. 1042' },
    ],
  },
  {
    key: 'avizo', nazev: 'Avízo',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'realitycechy', nazev: 'Reality Čechy',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'osobniweb', nazev: 'Osobní web',
    pole: [
      { key: 'jmeno', label: 'Uživatelské jméno', placeholder: 'Zadejte jméno' },
      { key: 'heslo', label: 'Heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
]

/** Zkratky se v chybové hlášce nesmí zmenšit na „id pobočky". */
const ZKRATKA_NA_ZACATKU = /^(ID|API|FTP|KN|PDF)\b/

function chybaPole(label: string) {
  const text = ZKRATKA_NA_ZACATKU.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1)
  return `Zadejte ${text}.`
}

function pocetAktivnichText(pocet: number) {
  if (pocet === 0) return 'Žádný můstek'
  if (pocet === 1) return '1 aktivní'
  if (pocet < 5) return `${pocet} aktivní`
  return `${pocet} aktivních`
}

// ── Obrázky ───────────────────────────────────────────────────────────────────

interface Obrazek {
  nazev: string
  velikost: string
  url: string
  sirka: number
  vyska: number
}

function velikostSouboru(bytes: number) {
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} kB`
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`
}

function nacistObrazek(file: File): Promise<Obrazek> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const zaklad = { nazev: file.name, velikost: velikostSouboru(file.size), url }
    const img = new Image()
    img.onload = () => resolve({ ...zaklad, sirka: img.naturalWidth, vyska: img.naturalHeight })
    img.onerror = () => resolve({ ...zaklad, sirka: 0, vyska: 0 })
    img.src = url
  })
}

/** Souřadnice se v prototypu nedopočítávají z mapy - odvodí se z adresy, ať drží. */
function souradnice(adresa: string) {
  let h = 0
  for (const znak of adresa) h = (h * 31 + znak.charCodeAt(0)) % 100000
  const lat = 49.5 + (h % 1000) / 4000
  const lon = 14.2 + (Math.floor(h / 1000) % 1000) / 1000
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}

// ── Layout helpers ────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
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
function Block({ label, first, badge, children }: {
  label: string
  first?: boolean
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      borderTop: first ? undefined : '1px dashed var(--t-borderPrimary)',
      paddingTop: first ? 0 : 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <BlockLabel>{label}</BlockLabel>
        {badge}
      </div>
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

/**
 * Výběr barvy - design system zatím vlastní komponentu nemá, proto vzorník
 * a nativní `input[type=color]` vedle pole s hexadecimálním zápisem.
 */
function BarevnePole({ label, value, presety, helperText, onChange }: {
  label: string
  value: string
  presety: string[]
  helperText: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input
          type="color"
          aria-label={`${label} - výběr ze vzorníku`}
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          style={{
            marginTop: 24, width: 32, height: 32, flexShrink: 0, padding: 2,
            border: '1px solid var(--t-borderPrimary)', borderRadius: 8,
            background: 'var(--t-bgPrimary)', cursor: 'pointer',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Input
            label={label}
            value={value}
            onChange={v => onChange(v.toUpperCase())}
            placeholder="#E8542A"
            helperText={helperText}
            width="100%"
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginLeft: 40 }}>
        {presety.map(barva => (
          <button
            key={barva}
            type="button"
            aria-label={`Nastavit barvu ${barva}`}
            aria-pressed={barva.toUpperCase() === value.toUpperCase()}
            onClick={() => onChange(barva.toUpperCase())}
            style={{
              width: 20, height: 20, borderRadius: 6, cursor: 'pointer', padding: 0,
              background: barva,
              border: barva.toUpperCase() === value.toUpperCase()
                ? '2px solid var(--t-borderMyDOCK)'
                : '1px solid var(--t-borderPrimary)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** Krytí vodoznaku - v design systemu chybí posuvník, proto nativní `input[type=range]`. */
function KrytiPosuvnik({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label htmlFor="kryti-watermarku" style={{ ...typography.body14Semibold, color: 'var(--t-textSecondary)' }}>
        Krytí {value}{' '}%
      </label>
      <input
        id="kryti-watermarku"
        type="range"
        min={10}
        max={100}
        step={5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', height: 32, accentColor: 'var(--t-bgMyDOCKPrimary)', cursor: 'pointer' }}
      />
      <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
        Čím nižší krytí, tím průhlednější vodoznak na fotografii.
      </span>
    </div>
  )
}

/** Nahrání obrázku - dokud soubor není vybraný, je vidět plocha pro přetažení. */
function ObrazekPole({ obrazek, subtitle, onVybrat, onOdebrat }: {
  obrazek: Obrazek | null
  subtitle: string
  onVybrat: (file: File) => void
  onOdebrat: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

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
      {obrazek ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          border: '1px solid var(--t-borderPrimary)', borderRadius: 10, padding: 12,
        }}>
          <img
            src={obrazek.url}
            alt=""
            style={{
              width: 64, height: 48, objectFit: 'contain', flexShrink: 0,
              borderRadius: 6, background: 'var(--t-bgSecondary)',
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              ...typography.body14Semibold, color: 'var(--t-textPrimary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {obrazek.nazev}
            </div>
            <div style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
              {obrazek.sirka > 0 ? `${obrazek.sirka} × ${obrazek.vyska} px · ` : ''}{obrazek.velikost}
            </div>
          </div>
          <Button label="Nahradit" variant="outlined" size="md" onClick={() => inputRef.current?.click()} />
          <Button label="Odebrat" variant="outlined" size="md" destructive onClick={onOdebrat} />
        </div>
      ) : (
        <FileUploadArea
          variant="advanced"
          subtitle={subtitle}
          onSelect={() => inputRef.current?.click()}
          onUpload={() => inputRef.current?.click()}
        />
      )}
    </>
  )
}

/** Dlaždice exportního můstku - klik zapíná odesílání na portál. */
function MustekDlazdice({ nazev, aktivni, stav, onToggle }: {
  nazev: string
  aktivni: boolean
  stav: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={aktivni}
      onClick={onToggle}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column', gap: 2,
        alignItems: 'center', justifyContent: 'center',
        padding: '14px 12px', minHeight: 68, cursor: 'pointer',
        borderRadius: 10,
        border: aktivni ? '2px solid var(--t-borderMyDOCK)' : '1px solid var(--t-borderPrimary)',
        background: aktivni ? 'var(--t-bgPrimary)' : 'var(--t-bgSecondary)',
      }}
    >
      {aktivni && (
        <CircleCheck
          size={iconSize.sm}
          style={{ position: 'absolute', top: 6, right: 6, color: 'var(--t-textMyDOCKPrimary)' }}
        />
      )}
      <span style={{
        ...typography.body14Semibold,
        color: aktivni ? 'var(--t-textPrimary)' : 'var(--t-textSecondary)',
        textAlign: 'center',
      }}>
        {nazev}
      </span>
      <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>{stav}</span>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NovaPobockaPage() {
  const navigate = useNavigate()

  // Základní údaje
  const [nazev, setNazev] = useState('')
  const [telefon, setTelefon] = useState('')
  const [email, setEmail] = useState('')
  const [hsp, setHsp] = useState('')
  const [odpovednaOsoba, setOdpovednaOsoba] = useState('')
  const [stav, setStav] = useState('Připravuje se')
  const [zobrazitNaWebu, setZobrazitNaWebu] = useState(false)

  // Adresa
  const [adresa, setAdresa] = useState('')

  // Branding
  const [logo, setLogo] = useState<Obrazek | null>(null)
  const [hlavniBarva, setHlavniBarva] = useState(VYCHOZI_HLAVNI)
  const [doplnkovaBarva, setDoplnkovaBarva] = useState(VYCHOZI_DOPLNKOVA)

  // Watermark
  const [watermark, setWatermark] = useState(false)
  const [watermarkObrazek, setWatermarkObrazek] = useState<Obrazek | null>(null)
  const [umisteni, setUmisteni] = useState('stred')
  const [kryti, setKryti] = useState(VYCHOZI_KRYTI)

  // Exportní můstky - v mapě jsou jen zapnuté portály
  const [mustky, setMustky] = useState<Record<string, Record<string, string>>>({})

  // Katastr nemovitostí
  const [knJmeno, setKnJmeno] = useState('')
  const [knHeslo, setKnHeslo] = useState('')
  const [knHesloVidet, setKnHesloVidet] = useState(false)

  const [tajneVidet, setTajneVidet] = useState<Record<string, boolean>>({})
  const [showErrors, setShowErrors] = useState(false)
  const [zahoditOpen, setZahoditOpen] = useState(false)

  const aktivniMustky = MUSTKY.filter(m => m.key in mustky)

  function prepnoutMustek(def: MustekDef) {
    // Vypnutím se přístupové údaje zahodí - jinak by se odeslalo něco, co uživatel nevidí.
    setMustky(prev => {
      if (def.key in prev) {
        const { [def.key]: _zahozeno, ...zbytek } = prev
        return zbytek
      }
      return { ...prev, [def.key]: Object.fromEntries(def.pole.map(p => [p.key, ''])) }
    })
  }

  function setMustekPole(mustek: string, pole: string, hodnota: string) {
    setMustky(prev => ({ ...prev, [mustek]: { ...prev[mustek], [pole]: hodnota } }))
  }

  function vybratLogo(file: File) {
    nacistObrazek(file).then(obrazek => {
      setLogo(prev => {
        if (prev) URL.revokeObjectURL(prev.url)
        return obrazek
      })
    })
  }

  function odebratLogo() {
    if (logo) URL.revokeObjectURL(logo.url)
    setLogo(null)
  }

  function vybratWatermark(file: File) {
    nacistObrazek(file).then(obrazek => {
      setWatermarkObrazek(prev => {
        if (prev) URL.revokeObjectURL(prev.url)
        return obrazek
      })
    })
  }

  function odebratWatermark() {
    if (watermarkObrazek) URL.revokeObjectURL(watermarkObrazek.url)
    setWatermarkObrazek(null)
  }

  function prepnoutWatermark(zapnuto: boolean) {
    setWatermark(zapnuto)
    if (!zapnuto) {
      odebratWatermark()
      setUmisteni('stred')
      setKryti(VYCHOZI_KRYTI)
    }
  }

  // ── Validace ────────────────────────────────────────────────────────────────

  const errors: Record<string, string> = {}
  const digits = (v: string) => v.replace(/\D/g, '')

  if (!nazev.trim()) errors.nazev = 'Zadejte název pobočky.'
  if (!telefon.trim()) errors.telefon = 'Zadejte telefonní číslo.'
  else if (digits(telefon).length !== 9) errors.telefon = 'Telefonní číslo má 9 číslic.'
  if (!email.trim()) errors.email = 'Zadejte e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = 'Zadejte e-mail ve formátu pobocka@firma.cz.'
  if (!hsp) errors.hsp = 'Vyberte HSP.'
  if (!odpovednaOsoba) errors.odpovednaOsoba = 'Vyberte odpovědnou osobu.'
  if (!adresa.trim()) errors.adresa = 'Zadejte adresu pobočky.'

  if (watermark && !watermarkObrazek) errors.watermark = 'Nahrajte obrázek vodoznaku, nebo watermark vypněte.'

  for (const def of aktivniMustky) {
    for (const pole of def.pole) {
      if (!mustky[def.key][pole.key].trim()) {
        errors[`mustek.${def.key}.${pole.key}`] = chybaPole(pole.label)
      }
    }
  }

  if (knJmeno.trim() && !knHeslo.trim()) errors.knHeslo = 'Zadejte heslo do katastru.'
  if (knHeslo.trim() && !knJmeno.trim()) errors.knJmeno = 'Zadejte uživatelské jméno do katastru.'

  const err = (key: string) => (showErrors ? errors[key] : undefined)

  /** Počet chybějících polí bloku - ukazuje se hned, bez čekání na odeslání. */
  const chybi = (prefix: string) => Object.keys(errors).filter(k => k.startsWith(prefix)).length

  const knHotovo = Boolean(knJmeno.trim() && knHeslo.trim())

  const dirty = Boolean(
    nazev || telefon || email || hsp || odpovednaOsoba || adresa || logo || watermark ||
    knJmeno || knHeslo || aktivniMustky.length > 0 || zobrazitNaWebu ||
    stav !== 'Připravuje se' || hlavniBarva !== VYCHOZI_HLAVNI || doplnkovaBarva !== VYCHOZI_DOPLNKOVA
  )

  function vytvorit() {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }
    // Prototyp bez API - pobočka se po vytvoření neukládá, vracíme se na seznam.
    navigate('/pobocky')
  }

  function zahodit() {
    if (dirty) setZahoditOpen(true)
    else navigate('/pobocky')
  }

  // ── Souhrn ──────────────────────────────────────────────────────────────────

  const watermarkSouhrn = !watermark
    ? 'Vypnuto'
    : watermarkObrazek ? 'Aktivní' : 'Chybí obrázek'

  const souhrnRows: { label: string; value: React.ComponentProps<typeof SummaryListItem>['value'] }[] = [
    { label: 'HSP', value: { kind: 'text', text: hsp || 'Nevybráno' } },
    { label: 'Logo výstupů', value: { kind: 'text', text: logo ? 'Nahráno' : 'Chybí' } },
    { label: 'Watermark', value: { kind: 'text', text: watermarkSouhrn } },
    { label: 'Aktivní exporty', value: { kind: 'text', text: String(aktivniMustky.length) } },
    { label: 'Napojení KN', value: { kind: 'text', text: knHotovo ? 'Nastaveno' : 'Nenastaveno' } },
    { label: 'Zobrazeno na webu', value: { kind: 'text', text: zobrazitNaWebu ? 'Ano' : 'Ne' } },
  ]

  // ── Náhled výstupu ──────────────────────────────────────────────────────────

  const watermarkVNahledu = watermark && watermarkObrazek

  const watermarkPozice: React.CSSProperties =
    umisteni === 'vpravo-dole' ? { right: 8, bottom: 8 }
      : umisteni === 'vlevo-dole' ? { left: 8, bottom: 8 }
        : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }

  const nahled = (
    <div style={{
      border: '1px solid var(--t-borderPrimary)', borderRadius: 10, overflow: 'hidden',
      background: 'var(--t-bgPrimary)',
    }}>
      <div style={{
        height: 44, background: doplnkovaBarva, display: 'flex', alignItems: 'center', padding: '0 12px',
      }}>
        {logo
          ? <img src={logo.url} alt="" style={{ maxHeight: 24, maxWidth: 120, objectFit: 'contain' }} />
          : (
            <span style={{ ...typography.body12Semibold, color: '#FFFFFF', opacity: 0.72 }}>
              Vaše logo
            </span>
          )}
      </div>
      <div style={{ height: 4, background: hlavniBarva }} />
      <div style={{
        position: 'relative', height: 96, overflow: 'hidden',
        background: 'linear-gradient(135deg, #C7D2CC 0%, #AEB9B4 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ ...typography.body10Semibold, color: '#FFFFFF', opacity: 0.7 }}>Fotografie</span>
        {watermarkVNahledu && umisteni === 'dlazdice' && (
          <div style={{
            position: 'absolute', inset: 0, opacity: kryti / 100,
            backgroundImage: `url(${watermarkObrazek.url})`,
            backgroundRepeat: 'repeat', backgroundSize: '48px auto',
          }} />
        )}
        {watermarkVNahledu && umisteni !== 'dlazdice' && (
          <img
            src={watermarkObrazek.url}
            alt=""
            style={{
              position: 'absolute', ...watermarkPozice,
              maxWidth: 56, maxHeight: 40, objectFit: 'contain', opacity: kryti / 100,
            }}
          />
        )}
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--t-bgSecondary)' }} />
        <div style={{ height: 8, width: '60%', borderRadius: 4, background: 'var(--t-bgSecondary)' }} />
      </div>
    </div>
  )

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
                {nazev || 'Nová pobočka'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Tag label="Nový záznam" size="sm" variant="neutral" />
                <Tag
                  label={stav}
                  size="sm" lead="indicator"
                  variant={stav === 'Aktivní' ? 'success' : stav === 'Neaktivní' ? 'danger' : 'warning'}
                />
                <Tag
                  label={hsp || 'HSP nevybráno'}
                  size="sm"
                  variant={hsp ? 'success' : 'neutral'}
                />
                <Tag
                  label={zobrazitNaWebu ? 'Zobrazeno na webu' : 'Skryto na webu'}
                  size="sm"
                  variant={zobrazitNaWebu ? 'success' : 'neutral'}
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
              icon={Building2}
              title="Základní údaje"
              description="Kontakt na pobočku, její zařazení a viditelnost"
            >
              <Block label="Kontakt" first>
                <Input
                  label="Název pobočky" required
                  placeholder="Např. Realitní kancelář Praha 6"
                  value={nazev} onChange={setNazev}
                  error={err('nazev')}
                  helperText="Název, pod kterým pobočka vystupuje v systému i na webu."
                  width="100%"
                />
                <Cols cols="1fr 1fr">
                  <Input
                    label="Telefon" required leadBadge="+420"
                    placeholder="777 123 456"
                    value={telefon} onChange={setTelefon}
                    error={err('telefon')} width="100%"
                  />
                  <Input
                    label="E-mail" required type="email"
                    placeholder="pobocka@firma.cz"
                    value={email} onChange={setEmail}
                    error={err('email')} width="100%"
                  />
                </Cols>
              </Block>

              <Block label="Zařazení">
                <Cols cols="1fr 1fr 1fr">
                  <Select
                    label="HSP" required placeholder="Vyberte HSP"
                    value={hsp} onChange={setHsp}
                    options={HSP_OPTIONS} searchable
                    helperText="Subjekt, pod který pobočka spadá ve smlouvách a ve fakturaci."
                    error={err('hsp')} width="100%"
                  />
                  <Select
                    label="Odpovědná osoba" required placeholder="Vyberte osobu"
                    value={odpovednaOsoba} onChange={setOdpovednaOsoba}
                    options={OSOBA_OPTIONS} searchable
                    error={err('odpovednaOsoba')} width="100%"
                  />
                  <Select
                    label="Stav" required placeholder="Vyberte stav"
                    value={stav} onChange={setStav}
                    options={STAV_OPTIONS}
                    helperText="Neaktivní pobočku nelze přiřadit k novým nabídkám."
                    width="100%"
                  />
                </Cols>
              </Block>

              <Block label="Viditelnost">
                <ToggleItem
                  label="Zobrazit pobočku na webu"
                  description="Pobočka se objeví v seznamu kontaktů na veřejném webu."
                  checked={zobrazitNaWebu}
                  onChange={setZobrazitNaWebu}
                />
              </Block>
            </Card>

            <Card
              icon={MapPin}
              title="Adresa pobočky"
              description="Použije se na výstupech, na webu a v exportech"
              badge={
                <Tag
                  label={adresa.trim() ? 'Vyplněno' : 'Nevyplněno'}
                  size="sm"
                  variant={adresa.trim() ? 'success' : 'neutral'}
                />
              }
            >
              <Input
                label="Adresa" required
                placeholder="Začněte psát adresu…"
                value={adresa} onChange={setAdresa}
                error={err('adresa')}
                helperText="Po výběru z našeptávače se doplní souřadnice a pin na mapě."
                width="100%"
              />
              <div style={{
                position: 'relative', height: 200, borderRadius: 10, overflow: 'hidden',
                border: '1px solid var(--t-borderPrimary)',
                background: 'var(--t-bgSecondary)',
                backgroundImage:
                  'repeating-linear-gradient(0deg, var(--t-borderPrimary) 0 1px, transparent 1px 40px),' +
                  'repeating-linear-gradient(90deg, var(--t-borderPrimary) 0 1px, transparent 1px 40px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MapPin
                  size={iconSize.xl}
                  style={{ color: adresa.trim() ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textTertiary)' }}
                />
                {adresa.trim() && (
                  <div style={{
                    position: 'absolute', left: 12, bottom: 12, right: 12,
                    background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)',
                    borderRadius: 8, padding: '8px 12px',
                  }}>
                    <div style={{
                      ...typography.body14Semibold, color: 'var(--t-textPrimary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {adresa}
                    </div>
                    <div style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                      Souřadnice {souradnice(adresa)}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card
              icon={Star}
              title="Branding výstupů"
              description="Logo a barvy v PDF prezentacích a v tiskových výstupech"
              badge={
                <Tag
                  label={logo ? 'Logo nahráno' : 'Bez loga'}
                  size="sm"
                  variant={logo ? 'success' : 'neutral'}
                />
              }
            >
              <Block label="Logo pobočky" first>
                <ObrazekPole
                  obrazek={logo}
                  subtitle="PNG s průhledným pozadím · nejméně 800 × 600 px · nejvýš 1 MB"
                  onVybrat={vybratLogo}
                  onOdebrat={odebratLogo}
                />
              </Block>

              <Block label="Barvy">
                <Cols cols="1fr 1fr">
                  <BarevnePole
                    label="Hlavní barva"
                    value={hlavniBarva}
                    presety={HLAVNI_BARVY}
                    helperText="Nadpisy, linky a akcenty ve výstupech."
                    onChange={setHlavniBarva}
                  />
                  <BarevnePole
                    label="Doplňková barva"
                    value={doplnkovaBarva}
                    presety={DOPLNKOVE_BARVY}
                    helperText="Pozadí hlaviček, patiček a druhotných prvků."
                    onChange={setDoplnkovaBarva}
                  />
                </Cols>
              </Block>
            </Card>

            <Card
              icon={ImageIcon}
              title="Watermark na fotografie"
              description="Vodoznak vypálený do exportovaných fotografií"
              badge={<Toggle checked={watermark} onChange={prepnoutWatermark} />}
            >
              {watermark ? (
                <>
                  <ObrazekPole
                    obrazek={watermarkObrazek}
                    subtitle="PNG s průhledným pozadím · nejméně 800 × 600 px · nejvýš 1 MB"
                    onVybrat={vybratWatermark}
                    onOdebrat={odebratWatermark}
                  />
                  {err('watermark') && (
                    <span style={{ ...typography.body12Semibold, color: 'var(--t-textDangerPrimary)' }}>
                      {errors.watermark}
                    </span>
                  )}
                  <Cols cols="1fr 1fr">
                    <Select
                      label="Umístění" required placeholder="Vyberte umístění"
                      value={umisteni} onChange={setUmisteni}
                      options={UMISTENI_OPTIONS} width="100%"
                    />
                    <KrytiPosuvnik value={kryti} onChange={setKryti} />
                  </Cols>
                </>
              ) : (
                <Alert
                  variant="info"
                  label="Watermark je vypnutý"
                  description="Exportované fotografie se odešlou bez vodoznaku."
                />
              )}
            </Card>

            <Card
              icon={Share2}
              title="Exportní můstky"
              description="Vyberte portály, na které se nabídky pobočky odesílají"
              badge={
                <Tag
                  label={pocetAktivnichText(aktivniMustky.length)}
                  size="sm"
                  variant={aktivniMustky.length === 0 ? 'neutral' : 'success'}
                />
              }
            >
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8,
              }}>
                {MUSTKY.map(def => {
                  const aktivni = def.key in mustky
                  const pocetChybi = chybi(`mustek.${def.key}.`)
                  return (
                    <MustekDlazdice
                      key={def.key}
                      nazev={def.nazev}
                      aktivni={aktivni}
                      stav={aktivni ? (pocetChybi > 0 ? 'Doplňte přístupy' : 'Nastaveno') : 'Neaktivní'}
                      onToggle={() => prepnoutMustek(def)}
                    />
                  )
                })}
              </div>

              {aktivniMustky.length === 0 ? (
                <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                  Zatím není zapnutý žádný můstek. Kliknutím na dlaždici portál zapnete a doplníte přístupové údaje.
                </span>
              ) : (
                aktivniMustky.map((def, i) => {
                  const pocetChybi = chybi(`mustek.${def.key}.`)
                  return (
                    <Block
                      key={def.key}
                      label={`${def.nazev} - přístupové údaje`}
                      first={i === 0}
                      badge={
                        <Tag
                          label={pocetChybi > 0 ? `${pocetChybi} k doplnění` : 'Nastaveno'}
                          size="sm"
                          variant={pocetChybi > 0 ? 'warning' : 'success'}
                        />
                      }
                    >
                      <Cols cols="1fr 1fr">
                        {def.pole.map(pole => {
                          const id = `${def.key}.${pole.key}`
                          const videt = Boolean(tajneVidet[id])
                          return (
                            <Input
                              key={pole.key}
                              label={pole.label}
                              required
                              placeholder={pole.placeholder}
                              value={mustky[def.key][pole.key]}
                              onChange={v => setMustekPole(def.key, pole.key, v)}
                              type={pole.tajny && !videt ? 'password' : 'text'}
                              trailIcon={pole.tajny ? (videt ? EyeOff : Eye) : undefined}
                              onTrailIconClick={
                                pole.tajny
                                  ? () => setTajneVidet(prev => ({ ...prev, [id]: !prev[id] }))
                                  : undefined
                              }
                              trailIconLabel={pole.tajny ? (videt ? 'Skrýt údaj' : 'Zobrazit údaj') : undefined}
                              error={err(`mustek.${id}`)}
                              width="100%"
                            />
                          )
                        })}
                      </Cols>
                    </Block>
                  )
                })
              )}
            </Card>

            <Card
              icon={FileText}
              title="Stahování listu vlastnictví"
              description="Přístup do dálkového nahlížení do katastru nemovitostí"
              badge={
                <Tag
                  label={knHotovo ? 'Nastaveno' : 'Nenastaveno'}
                  size="sm"
                  variant={knHotovo ? 'success' : 'neutral'}
                />
              }
            >
              <Cols cols="1fr 1fr">
                <Input
                  label="Uživatelské jméno"
                  placeholder="Zadejte jméno"
                  value={knJmeno} onChange={setKnJmeno}
                  error={err('knJmeno')} width="100%"
                />
                <Input
                  label="Heslo"
                  placeholder="Zadejte heslo"
                  type={knHesloVidet ? 'text' : 'password'}
                  value={knHeslo} onChange={setKnHeslo}
                  trailIcon={knHesloVidet ? EyeOff : Eye}
                  onTrailIconClick={() => setKnHesloVidet(v => !v)}
                  trailIconLabel={knHesloVidet ? 'Skrýt heslo' : 'Zobrazit heslo'}
                  error={err('knHeslo')} width="100%"
                />
              </Cols>
              <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                Bez přístupu do katastru se list vlastnictví stahuje ručně.
              </span>
            </Card>
          </div>

          {/* Náhled + souhrn */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 115 }}>
            <SidebarCard icon={Eye} title="Náhled výstupu">
              {nahled}
              <p style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)', margin: '8px 0 0' }}>
                Ilustrační náhled PDF prezentace s aktuálním logem, barvami a vodoznakem.
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
            <Button label="Vytvořit pobočku" variant="primary" size="md" leadIcon={Check} onClick={vytvorit} />
          </div>
        </div>
      </div>

      {zahoditOpen && (
        <ConfirmDialog
          title="Zahodit novou pobočku?"
          description="Vyplněné údaje se neuloží."
          primaryLabel="Zahodit"
          secondaryLabel="Pokračovat v úpravách"
          destructive
          onPrimary={() => navigate('/pobocky')}
          onSecondary={() => setZahoditOpen(false)}
        />
      )}
    </div>
  )
}
