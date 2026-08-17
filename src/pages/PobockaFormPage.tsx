import { Fragment, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Eye, EyeOff } from 'lucide-react'
import {
  Button, Divider, FileUploadArea, IconButton, Input, Select,
  Tag, Toggle, ToggleItem, TooltipIcon, iconSize, typography,
} from '@matusgallo/mysabds'
import AdresaNaseptavac from '../components/shared/AdresaNaseptavac'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import TelefonInput from '../components/shared/TelefonInput'
import { BarvaPicker, BarvaVzorek, normalizovatHex } from '../components/shared/BarvaPicker'
import { celaAdresa } from '../data/adresyRegistr'
import { hspData, pobockyData } from '../data/mockOstatni'
import { chybaTelefonu } from '../data/telefonPredvolby'
import {
  MUSTKY, VYCHOZI_KRYTI,
  emptyPobockaForm, pobockaFormFromRow,
  type MustekDef, type MustkyStav, type Obrazek, type PobockaForm,
} from '../data/pobockaForm'

// ── Volby ────────────────────────────────────────────────────────────────────

const HSP_OPTIONS = hspData
  .filter(h => h.stav === 'Aktivní')
  .map(h => ({ value: h.nazev, label: h.nazev }))
  .sort((a, b) => a.label.localeCompare(b.label, 'cs'))

const UMISTENI_OPTIONS = [
  { value: 'stred', label: 'Střed' },
  { value: 'vpravo-dole', label: 'Vpravo dole' },
  { value: 'vlevo-dole', label: 'Vlevo dole' },
  { value: 'dlazdice', label: 'Dlaždice přes celou fotografii' },
]

const HLAVNI_BARVY = ['#E8542A', '#1B1D21', '#1F5FA9', '#2E7D5B', '#7C4DFF']
const DOPLNKOVE_BARVY = ['#1B1D21', '#6E7379', '#B4522A', '#173A63', '#B9A25B']

const OBRAZEK_LIMIT = 'PNG s průhledným pozadím · nejméně 800 × 600 px · nejvýš 1 MB'

/** Zkratky se v chybové hlášce nesmí zmenšit na „id pobočky". */
const ZKRATKA_NA_ZACATKU = /^(ID|API|FTP|KN|PDF)\b/

function chybaPole(label: string) {
  const text = ZKRATKA_NA_ZACATKU.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1)
  return `Zadejte ${text}.`
}

// ── Obrázky ───────────────────────────────────────────────────────────────────

function velikostSouboru(bytes: number) {
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} kB`
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`
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

function Card({ title, description, tooltip, badge, children }: {
  title: string
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

/** Logo portálu - stejná dlaždice 24 px jako v nastavení exportu na detailu nabídky. */
function MustekLogo({ def }: { def: MustekDef }) {
  const [chyba, setChyba] = useState(false)

  const zaklad: React.CSSProperties = {
    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
    border: '1px solid var(--t-borderPrimary)',
  }

  // Bez souboru (nebo když se nenačte) zaskočí iniciála portálu.
  if (!def.logo || chyba) {
    return (
      <div style={{
        ...zaklad, background: 'var(--t-bgTertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...typography.body10Semibold, color: 'var(--t-textSecondary)',
      }}>
        {def.nazev.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={def.logo}
      alt=""
      width={24}
      height={24}
      onError={() => setChyba(true)}
      style={{ ...zaklad, background: '#FFFFFF', objectFit: 'contain', padding: 2 }}
    />
  )
}

/**
 * Řádek s přepínačem - po zapnutí se pod ním rozbalí obsah. Řádky odděluje
 * `Divider`, žádný rám kolem: v seznamu dvanácti portálů by rámy přebily obsah.
 */
function PrepinacRadek({ lead, label, supportText, description, checked, bezOdsazeni, onChange, children }: {
  lead?: React.ReactNode
  label: string
  supportText?: string
  description?: string
  checked: boolean
  /** Samostatný řádek v kartě - odsazení řeší karta, ne řádek */
  bezOdsazeni?: boolean
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
          height: 32, padding: 0,
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        {lead}
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
        <div style={{
          padding: bezOdsazeni ? '16px 0 0' : '12px 0 16px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Řádek souhrnu s vlastní hodnotou - míry kopírují `SummaryListItem`. Potřeba
 * tam, kde hodnota nese barvu: `SummaryListItem` vykresluje `kind: 'badges'`
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
function SouhrnHodnota({ text }: { text: string }) {
  return (
    <span style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)', textAlign: 'right' }}>
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
 * Pole s barvou - vzorek otevírá vlastní panel výběru. Design system zatím
 * komponentu na barvu nemá, nativní `input[type=color]` by otevřel dialog
 * operačního systému.
 */
function BarevnePole({ label, value, presety, helperText, onChange }: {
  label: string
  value: string
  presety: string[]
  helperText: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  // Rozepsaný hex („#1F5") nemá platnou barvu - vzorek drží poslední platnou.
  const platny = normalizovatHex(value) ?? '#FFFFFF'

  return (
    <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{ marginTop: 24, flexShrink: 0 }}>
        <BarvaVzorek
          barva={platny}
          label={`${label} - otevřít výběr barvy`}
          expanded={open}
          onClick={() => setOpen(o => !o)}
        />
      </div>
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
      {open && (
        <BarvaPicker
          value={platny}
          presety={presety}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

/** Krytí vodoznaku - v design systemu chybí posuvník, proto nativní `input[type=range]`. */
function KrytiPosuvnik({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const podil = ((value - 10) / 90) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label htmlFor="kryti-watermarku" style={{ ...typography.body14Semibold, color: 'var(--t-textSecondary)' }}>
        Krytí
      </label>
      {/* Pole je vysoké 32 px, posuvník proto sedí ve stejně vysokém řádku. */}
      <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          id="kryti-watermarku"
          className="mybrik-slider"
          type="range"
          min={10}
          max={100}
          step={5}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right,
              var(--t-bgMyDOCKPrimary) 0 ${podil}%,
              var(--t-bgTertiary) ${podil}% 100%)`,
          }}
        />
        <span style={{
          ...typography.body14Medium, color: 'var(--t-textPrimary)',
          minWidth: 40, textAlign: 'right', flexShrink: 0,
        }}>
          {value}{' '}%
        </span>
      </div>
      <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
        Čím nižší krytí, tím průhlednější vodoznak.
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
          background: 'var(--t-bgPrimary)',
          borderRadius: 12, padding: 12,
          outline: '1px solid var(--t-borderPrimary)', outlineOffset: -0.5,
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
              ...typography.body14Medium, color: 'var(--t-textPrimary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {obrazek.nazev}
            </div>
            <div style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>
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

/**
 * Ilustrační výřez mapy - prototyp nemá mapové dlaždice, scéna je proto
 * nakreslená staticky. Barvy jsou natvrdo: mapa je obrázek, ne prvek rozhraní.
 */
function MapaVyrez({ napichnuto, children }: { napichnuto: boolean; children?: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden',
      outline: '1px solid var(--t-borderPrimary)', outlineOffset: -0.5,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg
        viewBox="0 0 800 200"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <rect width="800" height="200" fill="#EDEFEA" />

        {/* Zeleň a voda */}
        <rect x="556" y="16" width="168" height="82" rx="10" fill="#DCE8D2" />
        <rect x="60" y="130" width="120" height="58" rx="10" fill="#DCE8D2" />
        <path
          d="M-20 176 C 90 156, 150 200, 260 182 S 430 140, 560 158 S 720 186, 820 168"
          fill="none" stroke="#C9DDEC" strokeWidth="20" strokeLinecap="round"
        />

        {/* Bloky domů */}
        <g fill="#E3E5DF">
          <rect x="30" y="24" width="94" height="52" rx="6" />
          <rect x="150" y="24" width="120" height="52" rx="6" />
          <rect x="300" y="24" width="72" height="52" rx="6" />
          <rect x="396" y="30" width="120" height="46" rx="6" />
          <rect x="212" y="106" width="86" height="44" rx="6" />
          <rect x="330" y="102" width="132" height="40" rx="6" />
          <rect x="496" y="118" width="96" height="36" rx="6" />
          <rect x="640" y="112" width="110" height="46" rx="6" />
        </g>

        {/* Silnice - hlavní tah je teplejší, ostatní bílé */}
        <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
          <path d="M0 92 H800" strokeWidth="14" />
          <path d="M0 160 H800" strokeWidth="8" />
          <path d="M136 0 V200" strokeWidth="8" />
          <path d="M286 0 V200" strokeWidth="10" />
          <path d="M478 0 V200" strokeWidth="8" />
          <path d="M620 0 V200" strokeWidth="8" />
          <path d="M0 20 H540" strokeWidth="6" />
        </g>
        <path
          d="M-20 210 L 240 74 L 470 96 L 830 -10"
          fill="none" stroke="#F6E3BE" strokeWidth="16" strokeLinecap="round"
        />
      </svg>

      {/* Pin se stínem, ať je čitelný i nad silnicí */}
      <MapPin
        size={iconSize.xl}
        fill={napichnuto ? 'var(--t-bgMyDOCKPrimary)' : '#FFFFFF'}
        style={{
          position: 'relative',
          color: napichnuto ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textTertiary)',
          filter: 'drop-shadow(0 1px 2px rgba(16, 26, 35, .35))',
        }}
      />
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PobockaFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate()
  const { id } = useParams()

  const isEdit = mode === 'edit'
  const row = isEdit ? pobockyData.find(p => String(p.id) === id) : undefined
  // Výchozí hodnoty se spočítají jednou — u editace z existujícího záznamu.
  const [init] = useState<PobockaForm>(() => (row ? pobockaFormFromRow(row) : emptyPobockaForm()))

  // Základní údaje
  const [nazev, setNazev] = useState(init.nazev)
  const [predvolba, setPredvolba] = useState(init.predvolba)
  const [telefon, setTelefon] = useState(init.telefon)
  const [email, setEmail] = useState(init.email)
  const [hsp, setHsp] = useState(init.hsp)
  const [zobrazitNaWebu, setZobrazitNaWebu] = useState(init.zobrazitNaWebu)

  // Adresa
  const [adresa, setAdresa] = useState(init.adresa)

  // Branding
  const [logo, setLogo] = useState<Obrazek | null>(init.logo)
  const [hlavniBarva, setHlavniBarva] = useState(init.hlavniBarva)
  const [doplnkovaBarva, setDoplnkovaBarva] = useState(init.doplnkovaBarva)

  // Watermark
  const [watermark, setWatermark] = useState(init.watermark)
  const [watermarkObrazek, setWatermarkObrazek] = useState<Obrazek | null>(init.watermarkObrazek)
  const [umisteni, setUmisteni] = useState(init.umisteni)
  const [kryti, setKryti] = useState(init.kryti)

  // Exportní můstky - v mapě jsou jen zapnuté portály
  const [mustky, setMustky] = useState<MustkyStav>(init.mustky)

  // Katastr nemovitostí
  const [knJmeno, setKnJmeno] = useState(init.knJmeno)
  const [knHeslo, setKnHeslo] = useState(init.knHeslo)
  const [knHesloVidet, setKnHesloVidet] = useState(false)

  const [tajneVidet, setTajneVidet] = useState<Record<string, boolean>>({})
  const [showErrors, setShowErrors] = useState(false)
  const [zavritOpen, setZavritOpen] = useState(false)

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

  if (!nazev.trim()) errors.nazev = 'Zadejte název pobočky.'
  const chybaTel = chybaTelefonu(predvolba, telefon)
  if (chybaTel) errors.telefon = chybaTel
  if (!email.trim()) errors.email = 'Zadejte e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = 'Zadejte e-mail ve formátu pobocka@firma.cz.'
  if (!hsp) errors.hsp = 'Vyberte HSP.'
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

  // Rozpracovaný formulář = cokoli jiného, než s čím se stránka otevřela.
  const dirty =
    nazev !== init.nazev ||
    predvolba !== init.predvolba ||
    telefon !== init.telefon ||
    email !== init.email ||
    hsp !== init.hsp ||
    zobrazitNaWebu !== init.zobrazitNaWebu ||
    adresa !== init.adresa ||
    logo !== init.logo ||
    hlavniBarva !== init.hlavniBarva ||
    doplnkovaBarva !== init.doplnkovaBarva ||
    watermark !== init.watermark ||
    watermarkObrazek !== init.watermarkObrazek ||
    umisteni !== init.umisteni ||
    kryti !== init.kryti ||
    knJmeno !== init.knJmeno ||
    knHeslo !== init.knHeslo ||
    JSON.stringify(mustky) !== JSON.stringify(init.mustky)

  function ulozit() {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }
    // Prototyp bez API - změny se neukládají, vracíme se na seznam.
    navigate('/pobocky')
  }

  function zavrit() {
    if (dirty) setZavritOpen(true)
    else navigate('/pobocky')
  }

  // ── Souhrn ──────────────────────────────────────────────────────────────────

  const watermarkStav = !watermark
    ? { label: 'Vypnuto', variant: 'neutral' as const }
    : watermarkObrazek
      ? { label: 'Aktivní', variant: 'success' as const }
      : { label: 'Chybí obrázek', variant: 'warning' as const }

  const souhrnRows: { label: string; text: string }[] = [
    { label: 'HSP', text: hsp || '–' },
    { label: 'Adresa', text: adresa || '–' },
    { label: 'Aktivní exporty', text: String(aktivniMustky.length) },
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

  // Kontrola až za hooky — jinak by se při přechodu mezi režimy rozešlo jejich pořadí.
  if (isEdit && !row) {
    return (
      <div style={{ padding: 24, ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>
        Pobočka nenalezena.
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
            <IconButton icon={ArrowLeft} variant="ghost" size="md" tooltip="Zpět na seznam" onClick={zavrit} />
            <h1 style={{
              ...typography.headline24, margin: 0, color: 'var(--t-textPrimary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {isEdit ? 'Upravit pobočku' : 'Vytvořit pobočku'}
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

            <Card
              title="Základní údaje"
            >
              <Input
                label="Název pobočky" required
                placeholder="Např. Skvělá realitní kancelář"
                value={nazev} onChange={setNazev}
                error={err('nazev')}
                width="100%"
              />
              <Cols cols="1fr 1fr">
                <TelefonInput
                  required
                  value={telefon} onChange={setTelefon}
                  predvolba={predvolba} onPredvolbaChange={setPredvolba}
                  error={err('telefon')}
                />
                <Input
                  label="E-mail" required type="email"
                  placeholder="pobocka@firma.cz"
                  value={email} onChange={setEmail}
                  error={err('email')} width="100%"
                />
              </Cols>
              <Select
                label="HSP - hlavní správce pobočky" required
                placeholder="Vyberte HSP"
                value={hsp} onChange={setHsp}
                options={HSP_OPTIONS} searchable
                helperText="Určuje, pod jaký subjekt pobočka spadá ve smlouvách a ve fakturaci."
                error={err('hsp')} width="100%"
              />
              <ToggleItem
                label="Zobrazit pobočku na webu"
                description="Pobočka se objeví v seznamu kontaktů na veřejném webu."
                checked={zobrazitNaWebu}
                onChange={setZobrazitNaWebu}
              />
            </Card>

            <Card
              title="Adresa pobočky"
            >
              {/* Pobočka drží adresu v jednom poli, ne v rozpadu - z nabídky se
                  proto vyplní celá adresa včetně PSČ a města. */}
              <AdresaNaseptavac
                label="Adresa" required
                placeholder="Začněte psát adresu…"
                value={adresa} onChange={setAdresa}
                onVybrat={a => setAdresa(celaAdresa(a))}
                error={err('adresa')}
                helperText="Po výběru z našeptávače se doplní souřadnice a pin na mapě."
              />
              <MapaVyrez napichnuto={Boolean(adresa.trim())}>
                {adresa.trim() && (
                  <div style={{
                    position: 'absolute', left: 12, bottom: 12, right: 12,
                    background: 'var(--t-bgPrimary)', borderRadius: 8, padding: '8px 12px',
                    boxShadow: '0 1px 2px rgba(16, 26, 35, .2)',
                  }}>
                    <div style={{
                      ...typography.body14Medium, color: 'var(--t-textPrimary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {adresa}
                    </div>
                    <div style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>
                      Souřadnice {souradnice(adresa)}
                    </div>
                  </div>
                )}
              </MapaVyrez>
            </Card>

            <Card
              title="Branding výstupů"
            >
              <Block label="Logo pobočky" first>
                <ObrazekPole
                  obrazek={logo}
                  subtitle={OBRAZEK_LIMIT}
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

              {/* Jediná zapínatelná sekce - popisek bloku by jen zopakoval název karty */}
              <Divider />
              <PrepinacRadek
                label="Watermark na fotografie"
                supportText={watermark && watermarkObrazek ? `Krytí ${kryti} %` : undefined}
                description="Vodoznak vypálený do exportovaných fotografií"
                checked={watermark}
                bezOdsazeni
                onChange={prepnoutWatermark}
              >
                <ObrazekPole
                  obrazek={watermarkObrazek}
                  subtitle={OBRAZEK_LIMIT}
                  onVybrat={vybratWatermark}
                  onOdebrat={odebratWatermark}
                />
                {err('watermark') && (
                  <span style={{ ...typography.body12Semibold, color: 'var(--t-textDangerPrimary)' }}>
                    {errors.watermark}
                  </span>
                )}
                <Cols cols="240px minmax(0, 1fr)">
                  <Select
                    label="Umístění" required placeholder="Vyberte umístění"
                    value={umisteni} onChange={setUmisteni}
                    options={UMISTENI_OPTIONS} width="100%"
                  />
                  <KrytiPosuvnik value={kryti} onChange={setKryti} />
                </Cols>
              </PrepinacRadek>
            </Card>

            <Card
              title="Exportní můstky"
              tooltip="Zapněte ty portály, na které pobočka inzeruje. U zapnutého portálu doplňte přístupové údaje - bez nich se nabídky neodešlou. Vypnutím se zadané údaje zahodí."
              badge={
                <Tag
                  label={`${aktivniMustky.length} z ${MUSTKY.length} zapnuto`}
                  size="sm"
                  variant={aktivniMustky.length === 0 ? 'neutral' : 'success'}
                />
              }
            >
              {/* Řádky místo karet - dvanáct rámů by kartu rozdrobilo */}
              {/* Řádek je 32 px vysoký, mezeru k oddělovači drží gap */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MUSTKY.map((def, i) => {
                  const aktivni = def.key in mustky
                  const pocetChybi = chybi(`mustek.${def.key}.`)
                  return (
                    <Fragment key={def.key}>
                      {i > 0 && <Divider />}
                      <PrepinacRadek
                        lead={<MustekLogo def={def} />}
                        label={def.nazev}
                        supportText={aktivni ? (pocetChybi > 0 ? `${pocetChybi} k doplnění` : 'Nastaveno') : undefined}
                        checked={aktivni}
                        onChange={() => prepnoutMustek(def)}
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
                                value={aktivni ? mustky[def.key][pole.key] : ''}
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
                      </PrepinacRadek>
                    </Fragment>
                  )
                })}
              </div>
            </Card>

            <Card
              title="Stahování listu vlastnictví"
              tooltip="Bez přístupu do katastru se list vlastnictví k nabídce stahuje ručně."
            >
              <Cols cols="minmax(0, 1fr) minmax(0, 1fr)">
                <Input
                  label="Přihlašovací jméno"
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
                      <SouhrnHodnota text={row.text} />
                    </SouhrnRow>
                  </Fragment>
                ))}
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SouhrnRow label="Na webu">
                  <Tag
                    label={zobrazitNaWebu ? 'Zobrazeno' : 'Skryto'}
                    size="sm"
                    variant={zobrazitNaWebu ? 'success' : 'neutral'}
                  />
                </SouhrnRow>
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SouhrnRow label="Logo výstupů">
                  <Tag
                    label={logo ? 'Nahráno' : 'Chybí'}
                    size="sm"
                    variant={logo ? 'success' : 'neutral'}
                  />
                </SouhrnRow>
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SouhrnRow label="Watermark">
                  <Tag label={watermarkStav.label} size="sm" variant={watermarkStav.variant} />
                </SouhrnRow>
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SouhrnRow label="Napojení KN">
                  <Tag
                    label={knHotovo ? 'Nastaveno' : 'Nenastaveno'}
                    size="sm"
                    variant={knHotovo ? 'success' : 'neutral'}
                  />
                </SouhrnRow>
              </div>
            </SidebarCard>

            <SidebarCard title="Náhled výstupu">
              {nahled}
              <p style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)', margin: '8px 0 0' }}>
                Ilustrační náhled PDF prezentace s aktuálním logem, barvami a vodoznakem.
              </p>
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
              label={isEdit ? 'Uložit změny' : 'Vytvořit pobočku'}
              variant="primary" size="md" onClick={ulozit}
            />
          </div>
        </div>
      </div>

      {zavritOpen && (
        <ConfirmDialog
          title={isEdit ? 'Zavřít bez uložení změn?' : 'Zavřít bez vytvoření pobočky?'}
          description={isEdit ? 'Provedené změny se neuloží.' : 'Vyplněné údaje se neuloží.'}
          primaryLabel="Zavřít"
          secondaryLabel="Pokračovat v úpravách"
          destructive
          onPrimary={() => navigate('/pobocky')}
          onSecondary={() => setZavritOpen(false)}
        />
      )}
    </div>
  )
}
