import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, AlertTriangle, Search as SearchIcon, Home, Building, MapPin, Building2, Warehouse, Upload, Trash2, Plus, Calculator, X, type LucideIcon } from 'lucide-react'
import { Button, TextButton, Input, Select, TextArea, CheckboxItem, Tag, IconButton } from '@matusgallo/mysabds'
import AdresaNaseptavac from '../shared/AdresaNaseptavac'
import SelectSearch from '../shared/SelectSearch'
import TelefonInput from '../shared/TelefonInput'
import KlientSearchModal from '../klienti/KlientSearchModal'
import type { KlientData } from '../klienti/KlientPanel'
import { celaAdresa, type AdresniMisto } from '../../data/adresyRegistr'
import { uzivateleData } from '../../data/mockOstatni'
import { VYCHOZI_PREDVOLBA, maCisloTelefonu } from '../../data/telefonPredvolby'

// ── Constants ────────────────────────────────────────────────────────────────

const MAKLERI_OPT = uzivateleData
  .filter(u => u.role === 'Makléř' || u.role === 'Administrátor')
  .map(u => ({
    value: String(u.id),
    label: `${u.prijmeni} ${u.jmeno} (${u.id})`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, 'cs'))

const TYP_NEMOVITOSTI: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'dum', label: 'Dům', Icon: Home },
  { value: 'byt', label: 'Byt', Icon: Building },
  { value: 'pozemek', label: 'Pozemek', Icon: MapPin },
  { value: 'komercni', label: 'Komerční', Icon: Building2 },
  { value: 'ostatni', label: 'Ostatní', Icon: Warehouse },
]

const POCET_MISTNOSTI = ['1 pokoj', '2 pokoje', '3 pokoje', '4 pokoje', '5 a více pokojů', 'Atypický']

const PODKATEGORIE = [
  'Chata', 'Památka/jiné', 'Rodinný', 'Vila',
  'Na klíč', 'Chalupa', 'Zemědělská usedlost', 'Vícegenerační dům',
]

const ZASTAVA = [
  'Bydlení', 'Bydlení a kanceláře', 'Obchodní', 'Administrativní',
  'Průmyslová', 'Venkovská', 'Rekreační', 'Rekreačně nevyužitá',
]

const TYP_DOMU = ['Přízemní', 'Patrový']

const POLOHA_DOMU = ['Řadový', 'Rohový', 'V bloku', 'Samostatný']

const STAV_OBJEKTU = [
  'Velmi dobrý', 'Dobrý', 'Špatný', 'Ve výstavbě',
  'Projekt', 'Novostavba', 'K demolici', 'Před rekonstrukcí',
  'Po rekonstrukci', 'V rekonstrukci',
]

const ADRESA_TYP_OPT = [
  { v: 'bod', label: 'Adresní bod' },
  { v: 'parcela', label: 'Parcela' },
  { v: 'gps', label: 'GPS' },
] as const

const UROVEN_ZNEPRESNENIA_OPT = [
  { value: 'dle-zadani', label: 'Adresa zobrazena dle zadání' },
  { value: 'ulice', label: 'Adresa zobrazena na úroveň ulice' },
  { value: 'mesto', label: 'Adresa zobrazena na úroveň města' },
  { value: 'kraj', label: 'Adresa zobrazena na úroveň kraje' },
]

const VLASTNICTVI_OPT = [
  { value: 'osobni', label: 'Osobní' },
  { value: 'druzstevni', label: 'Družstevní' },
  { value: 'obecni', label: 'Obecní / Státní' },
  { value: 'obchodni', label: 'Obchodní podíl' },
]

const MATERIAL_OPT = [
  { value: '', label: 'Materiál' },
  { value: 'drevostavba', label: 'Dřevostavba' },
  { value: 'cihlova', label: 'Cihlová' },
  { value: 'kamenna', label: 'Kamenná' },
  { value: 'montovana', label: 'Montovaná' },
  { value: 'panelova', label: 'Panelová' },
  { value: 'skeletova', label: 'Skeletová' },
]

const LOKACE_OPT = [
  { value: 'centrum', label: 'Centrum obce' },
  { value: 'klidna', label: 'Klidná část obce' },
  { value: 'rusna', label: 'Rušná část obce' },
  { value: 'okraj', label: 'Okraj obce' },
  { value: 'sidliste', label: 'Sídliště' },
  { value: 'polosamota', label: 'Polosamota' },
]

const DALSI_ZARIZENI = ['Bazén', 'Sklep', 'Garáž', 'Parkování', 'Terasa']

const ZDROJ_VODY = ['Místní zdroj vody', 'Vodovod', 'Studna', 'Retenční nádrž na dešťovou vodu']
const TYP_STUDNY = ['Vrtaná studna', 'Kopaná studna']
const ROZVOD_PLYNU = ['Individuální', 'Plynovod']
const ROZVOD_TOPENI = [
  'Lokální plynové', 'Lokální tuhá paliva', 'Lokální elektrické', 'Ústřední plynové',
  'Ústřední tuhá paliva', 'Ústřední elektrické', 'Ústřední dálkové', 'Jiné', 'Podlahové',
]
const TOPNE_TELESO = [
  'WAW', 'Podlahové vytápění', 'Radiátory', 'Přímotop',
  'Infrapanel', 'Krbová kamna', 'Krb', 'Kotel na tuhá paliva',
  'Kamna', 'Klimatizace', 'Akumulační kamna', 'Jiné',
]
const ZDROJ_TOPENI = [
  'WAW', 'Plynový kondenzační kotel', 'Plynový kotel', 'Elektrokotel',
  'Tepelné čerpadlo', 'Přímotop', 'Infrapanel', 'Krbová kamna',
  'Krb', 'Kotel na tuhá paliva', 'Kamna', 'Ústřední dálkové',
  'Centrální dálkové', 'Pára s výměníkem', 'Akumulační kamna', 'Jiné',
]
const ZDROJ_TEPLE_VODY = [
  'Plynový kondenzační kotel', 'Plynový kotel', 'Elektrokotel', 'Tepelné čerpadlo',
  'Plynová karma', 'Kotel na tuhá paliva', 'Bojler - elektro', 'Bojler - plyn',
  'Průtokový ohřívač', 'Centrální dálkový ohřev', 'Jiné',
]
const TYP_ODPADU = ['Veřejná kanalizace', 'ČOV pro celý objekt', 'Septik', 'Jímka', 'Trativod']
const KOMUNIKACE = ['Betonová', 'Dlážděná', 'Asfaltová', 'Neupravená', 'Zpevněná', 'Šterková', 'Šotolina', 'Není přijezdová komunikace']
const DOPRAVA = ['Vlak', 'Dálnice', 'Silnice', 'MHD', 'Autobus']
const ELEKTRINA = ['120 V', '230 V', '400 V', 'Bez přípojky']
const POCET_FAZI = ['1 fáze', '3 fáze']
const JISTICE = ['16A', '20A', '25A', '32A', '40A', '50A', '63A']

const OCHRANA_OPT = [
  { value: '', label: 'Ochrana' },
  { value: 'ochranne-pasmo', label: 'Ochranné pásmo' },
  { value: 'narodni-park', label: 'Národní park' },
  { value: 'chko', label: 'CHKO' },
  { value: 'pamatkova-zona', label: 'Památková zóna' },
  { value: 'pamatkova-rezervace', label: 'Památková rezervace' },
]

const VYBAVENI_OPT = [
  { value: 'ano', label: 'Ano' },
  { value: 'ne', label: 'Ne' },
  { value: 'castecne', label: 'Částečně' },
]

const EN_NAROCNOST_OPT = [
  { value: 'A', label: 'A – Mimořádně úsporná' },
  { value: 'B', label: 'B – Velmi úsporná' },
  { value: 'C', label: 'C – Úsporná' },
  { value: 'D', label: 'D – Méně úsporná' },
  { value: 'E', label: 'E – Nehospodárná' },
  { value: 'F', label: 'F – Mimořádně nehospodárná' },
  { value: 'G', label: 'G – Mimořádně nehospodárná' },
]

const VYHLASKA_OPT = [
  { value: '148-2007', label: 'Č. 148/2007 Sb.' },
  { value: '78-2013', label: 'Č. 78/2013 Sb.' },
  { value: '264-2020', label: 'Č. 264/2020 Sb.' },
]

const CENA_ZA_OPT = [
  { value: 'nemovitost', label: 'nemovitost' },
  { value: 'mesic', label: 'měsíc' },
  { value: 'm2', label: 'm²' },
  { value: 'm2-mesic', label: 'm² / měsíc' },
  { value: 'm2-rok', label: 'm² / rok' },
  { value: 'rok', label: 'rok' },
]

const PROVIZE_JEDNOTKA_OPT = [
  { value: 'kc', label: 'Kč' },
  { value: 'procento', label: '%' },
]

// ── Types ────────────────────────────────────────────────────────────────────

type SectionStatus = 'locked' | 'open' | 'done' | 'warning'

interface DalsiVlastnik {
  telefon: string
  email: string
  jmeno: string
  prijmeni: string
  titulPred: string
  titulZa: string
  ulice: string
  cp: string
  co: string
  mesto: string
  psc: string
}

const EMPTY_VLASTNIK: DalsiVlastnik = {
  telefon: VYCHOZI_PREDVOLBA, email: '', jmeno: '', prijmeni: '',
  titulPred: '', titulZa: '', ulice: '', cp: '', co: '', mesto: '', psc: '',
}

/**
 * Adresa z našeptávače do polí kontaktní adresy - klient i další vlastníci je
 * mají stejné. Část obce se nepřenáší, formulář pro ni pole nemá.
 */
function adresaZRegistru(a: AdresniMisto) {
  return { ulice: a.ulice, cp: a.cisloPopisne, co: a.cisloOrientacni, psc: a.psc, mesto: a.mesto }
}

interface MaklerItem {
  jmeno: string
  procento: string
}

const EMPTY_MAKLER: MaklerItem = { jmeno: '', procento: '100' }

export interface FormData {
  typNemovitosti: string
  sdph: 'sdph' | 'bezdph'
  typObchodu: 'prodej' | 'pronajem'
  spoluvlastnicky: boolean
  aukce: boolean
  pocetMistnosti: string[]
  podkategorie: string[]
  zastava: string[]
  vlastnictvi: string
  stavObjektu: string[]
  typDomu: string[]
  polohaDomu: string[]
  nazevNabidky: string
  adresaTyp: 'bod' | 'parcela' | 'gps'
  urovenZnepresnenia: string
  adresa: string
  // Informace o stavbě
  material: string
  lokace: string
  rokKolaudace: string
  datumZahajeni: string
  datumUkonceni: string
  rokVystavby: string
  datumNastehovani: string
  rokRekonstrukce: string
  // Další zařízení
  dalsiZarizeni: string[]
  // Plochy
  uzitnaPolocha: string
  plochaZastavena: string
  zahrada: string
  plochaPozemku: string
  celkovaPlocha: string
  uzitnaPlochaPrizemi: string
  plochaDilen: string
  plochaZahrady: string
  // Podlaží
  nadzemnich: string
  podzemnich: string
  // Popis
  popis: string
  popisEn: string
  // Vybavení objektu
  zdrojVody: string[]
  typStudny: string[]
  rozvodPlynu: string[]
  rozvodTopeni: string[]
  topneTeleso: string[]
  zdrojTopeni: string[]
  zdrojTepleVody: string[]
  typOdpadu: string[]
  komunikace: string[]
  doprava: string[]
  elektrina: string[]
  pocetFazi: string[]
  jistice: string[]
  fotovoltaika: 'ano' | 'ne'
  solarniPanely: 'ano' | 'ne'
  bezbarierovy: 'ano' | 'ne'
  // Další informace
  ochrana: string
  nakladyBydleni: string
  vybaveni: string
  pocetGarazi: string
  mistKParkovani: string
  // Energetická náročnost
  enNarocnost: string
  vyhlaska: string
  ukEnNarocnosti: string
  nizkoenergeticky: boolean
  telefon: string
  email: string
  jmeno: string
  prijmeni: string
  titulPred: string
  titulZa: string
  nazevSpolecnosti: string
  ic: string
  pozice: string
  ulice: string
  cp: string
  co: string
  mesto: string
  psc: string
  dalsiVlastnici: DalsiVlastnik[]
  cena: string
  cenaZa: string
  inzerovatBezCeny: boolean
  poznamkaKCene: string
  vcetneProvize: boolean
  plusProvizeRK: boolean
  vyhradniSpoluprace: boolean
  moznostOdpoctuDPH: boolean
  cenaVcetnePoplatku: boolean
  cenaVcPravnihoServisu: boolean
  najemceNeplaitProvizi: boolean
  vyseVratneKauce: string
  provize: string
  provizeJednotka: 'kc' | 'procento'
  makleri: MaklerItem[]
  fotografie: string[]
  video: string[]
  youtube: string
  matterport: string
  exportovatMatterport: 'ano' | 'ne'
  mapyPanorama: string
}

const INIT: FormData = {
  typNemovitosti: 'dum',
  sdph: 'sdph',
  typObchodu: 'prodej',
  spoluvlastnicky: false,
  aukce: false,
  pocetMistnosti: [],
  podkategorie: [],
  zastava: [],
  vlastnictvi: 'osobni',
  stavObjektu: [],
  typDomu: [],
  polohaDomu: [],
  nazevNabidky: '',
  adresaTyp: 'bod',
  urovenZnepresnenia: 'dle-zadani',
  adresa: '',
  material: '',
  lokace: 'centrum',
  rokKolaudace: '',
  datumZahajeni: '',
  datumUkonceni: '',
  rokVystavby: '',
  datumNastehovani: '',
  rokRekonstrukce: '',
  dalsiZarizeni: [],
  uzitnaPolocha: '',
  plochaZastavena: '',
  zahrada: '',
  plochaPozemku: '',
  celkovaPlocha: '',
  uzitnaPlochaPrizemi: '',
  plochaDilen: '',
  plochaZahrady: '',
  nadzemnich: '',
  podzemnich: '',
  popis: '',
  popisEn: '',
  zdrojVody: [],
  typStudny: [],
  rozvodPlynu: [],
  rozvodTopeni: [],
  topneTeleso: [],
  zdrojTopeni: [],
  zdrojTepleVody: [],
  typOdpadu: [],
  komunikace: [],
  doprava: [],
  elektrina: [],
  pocetFazi: [],
  jistice: [],
  fotovoltaika: 'ne',
  solarniPanely: 'ne',
  bezbarierovy: 'ne',
  ochrana: '',
  nakladyBydleni: '',
  vybaveni: 'ano',
  pocetGarazi: '',
  mistKParkovani: '',
  enNarocnost: 'G',
  vyhlaska: '148-2007',
  ukEnNarocnosti: '',
  nizkoenergeticky: false,
  telefon: VYCHOZI_PREDVOLBA,
  email: '',
  jmeno: '',
  prijmeni: '',
  titulPred: '',
  titulZa: '',
  nazevSpolecnosti: '',
  ic: '',
  pozice: '',
  ulice: '',
  cp: '',
  co: '',
  mesto: '',
  psc: '',
  dalsiVlastnici: [],
  cena: '',
  cenaZa: 'nemovitost',
  inzerovatBezCeny: false,
  poznamkaKCene: '',
  vcetneProvize: false,
  plusProvizeRK: false,
  vyhradniSpoluprace: false,
  moznostOdpoctuDPH: false,
  cenaVcetnePoplatku: false,
  cenaVcPravnihoServisu: false,
  najemceNeplaitProvizi: false,
  vyseVratneKauce: '',
  provize: '',
  provizeJednotka: 'kc',
  makleri: [{ jmeno: MAKLERI_OPT[0]?.value ?? '', procento: '100' }],
  fotografie: [],
  video: [],
  youtube: '',
  matterport: '',
  exportovatMatterport: 'ne',
  mapyPanorama: '',
}

// ── Styles ───────────────────────────────────────────────────────────────────

const G2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const G3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const G4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }

// ── Sub-components ────────────────────────────────────────────────────────────

function ToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 6,
        border: `1px solid ${active ? 'var(--t-borderMyDOCK)' : 'var(--t-borderPrimary)'}`,
        background: active ? 'var(--t-bgMyDOCKPrimary)' : 'var(--t-bgPrimary)',
        color: active ? '#fff' : 'var(--t-textPrimary)',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function PropTypeBtn({
  icon: Icon, label, active, onClick,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '12px 20px',
        borderRadius: 8,
        border: `2px solid ${active ? 'var(--t-borderMyDOCK)' : 'var(--t-borderPrimary)'}`,
        background: active ? 'var(--t-bgMyDOCKTertiary)' : 'var(--t-bgPrimary)',
        color: active ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textSecondary)',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        minWidth: 80,
        transition: 'border-color 0.15s, background 0.15s, color 0.15s',
      }}
    >
      <Icon size={22} />
      <span>{label}</span>
    </button>
  )
}

function StepIcon({ status }: { status: SectionStatus }) {
  if (status === 'done') {
    return (
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'var(--t-bgSuccessTertiary)',
        border: '1px solid var(--t-borderSuccess)',
        color: 'var(--t-textSuccessPrimary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Check size={16} strokeWidth={3} />
      </div>
    )
  }
  if (status === 'warning') {
    return (
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'var(--t-bgWarningTertiary)',
        border: '1px solid var(--t-borderWarning)',
        color: 'var(--t-textWarningPrimary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AlertTriangle size={16} strokeWidth={2.5} />
      </div>
    )
  }
  if (status === 'open') {
    // Concentric "current" indicator — outer halo, brand ring, white dot
    return (
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(224, 85, 36, 0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 0 0 3px rgba(224, 85, 36, 0.10)',
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--t-bgMyDOCKPrimary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
        </div>
      </div>
    )
  }
  // locked / upcoming — dashed empty circle
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      border: '2px dashed var(--t-borderPrimary)',
      background: 'transparent',
      flexShrink: 0,
    }} />
  )
}

function SummaryChips({ items }: { items: string[] }) {
  const visible = items.filter(Boolean)
  if (!visible.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {visible.map((item, i) => (
        <Tag key={i} label={item} variant="neutral" size="sm" />
      ))}
    </div>
  )
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const required = title.endsWith(' *')
  const cleanTitle = required ? title.slice(0, -2) : title
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* typography.body16Semibold */}
      <span style={{
        fontSize: 16, fontWeight: 600, lineHeight: '24px',
        color: 'var(--t-textPrimary)',
      }}>
        {cleanTitle}
        {required && <span style={{ color: 'var(--t-textDangerPrimary)' }}> *</span>}
      </span>
      {children}
    </div>
  )
}

// ── Step Rail Item ────────────────────────────────────────────────────────────

interface RailItemProps {
  title: string
  status: SectionStatus
  summary: string[]
  onClick: () => void
  isLast?: boolean
}

function RailItem({ title, status, summary, onClick, isLast }: RailItemProps) {
  const isOpen = status === 'open'
  const isLocked = status === 'locked'
  const isDone = status === 'done' || status === 'warning'

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onClick}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        borderRadius: 8,
        cursor: isLocked ? 'default' : 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => {
        if (!isLocked) e.currentTarget.style.background = 'var(--t-bgSecondary)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {/* Connecting line below icon, extends into next item */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: 12 + 19, // padding-left + (icon-width / 2 - line-width / 2) = 12 + 20 - 1
          top: 10 + 44, // padding-top + icon-height + small gap = 10 + 40 + 4
          bottom: -10, // extend through next item's top padding so the line reaches its icon
          width: 2,
          borderRadius: 1,
          background: 'var(--t-borderPrimary)',
          pointerEvents: 'none',
        }} />
      )}
      <StepIcon status={status} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1, paddingTop: 10 }}>
        <span style={{
          fontSize: 14, fontWeight: isOpen ? 700 : 600, lineHeight: '20px',
          color: isLocked
            ? 'var(--t-textTertiary)'
            : isOpen
              ? 'var(--t-textMyDOCKPrimary)'
              : 'var(--t-textPrimary)',
        }}>
          {title}
        </span>
        {isDone && summary.length > 0 && <SummaryChips items={summary} />}
      </div>
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  initialData?: Partial<FormData>
  mode?: 'create' | 'edit'
}

export default function NovaNabidkaForm({ onClose, initialData, mode }: Props) {
  // If mode is provided, trust it. Otherwise infer from initialData (back-compat).
  const isEdit = mode ? mode === 'edit' : !!initialData
  const [sections, setSections] = useState<SectionStatus[]>(
    isEdit
      ? ['open', 'done', 'done', 'done', 'done']
      : ['open', 'locked', 'locked', 'locked', 'locked']
  )
  const [form, setForm] = useState<FormData>(() => ({ ...INIT, ...initialData }))
  const [klientModalOpen, setKlientModalOpen] = useState(false)
  const [showErrors, setShowErrors] = useState<boolean[]>([false, false, false, false, false])

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleArr(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
  }

  // Validace povinných polí — vrací seznam chybějících klíčů pro sekci
  function sectionErrors(idx: number, f: FormData): string[] {
    switch (idx) {
      case 0: {
        const errs: string[] = []
        if (!f.typNemovitosti) errs.push('typNemovitosti')
        if (f.pocetMistnosti.length === 0) errs.push('pocetMistnosti')
        if (f.podkategorie.length === 0) errs.push('podkategorie')
        if (!f.vlastnictvi) errs.push('vlastnictvi')
        if (f.stavObjektu.length === 0) errs.push('stavObjektu')
        if (f.typDomu.length === 0) errs.push('typDomu')
        if (f.polohaDomu.length === 0) errs.push('polohaDomu')
        if (!f.adresa.trim()) errs.push('adresa')
        return errs
      }
      case 1: {
        const errs: string[] = []
        if (!f.material) errs.push('material')
        if (!f.uzitnaPolocha.trim()) errs.push('uzitnaPolocha')
        if (!f.plochaPozemku.trim()) errs.push('plochaPozemku')
        if (!f.popis.trim()) errs.push('popis')
        return errs
      }
      case 2: {
        const errs: string[] = []
        if (!maCisloTelefonu(f.telefon)) errs.push('telefon')
        if (!f.jmeno.trim()) errs.push('jmeno')
        if (!f.prijmeni.trim()) errs.push('prijmeni')
        return errs
      }
      case 3: {
        const errs: string[] = []
        if (!f.cena.trim()) errs.push('cena')
        if (!f.provize.trim() || Number(f.provize) < 1) errs.push('provize')
        if (f.makleri.length === 0 || f.makleri.some(m => !m.jmeno.trim())) errs.push('makleri')
        return errs
      }
      case 4: {
        const errs: string[] = []
        if (f.fotografie.length === 0) errs.push('fotografie')
        return errs
      }
      default: return []
    }
  }

  function validateSection(idx: number, f: FormData): boolean {
    return sectionErrors(idx, f).length === 0
  }

  function confirm(idx: number) {
    const ok = validateSection(idx, form)
    setShowErrors(prev => {
      const next = [...prev]
      next[idx] = !ok
      return next
    })
    setSections(prev => {
      const next = prev.map((status, i) => {
        if (i === idx) return ok ? 'done' : 'warning'
        if (i === idx + 1) return 'open'
        if (status === 'open' && i !== idx) return validateSection(i, form) ? 'done' : 'warning'
        return status
      }) as SectionStatus[]
      return next
    })
  }

  const errs0 = showErrors[0] ? sectionErrors(0, form) : []
  const errs1 = showErrors[1] ? sectionErrors(1, form) : []
  const errs2 = showErrors[2] ? sectionErrors(2, form) : []
  const errs3 = showErrors[3] ? sectionErrors(3, form) : []
  const errs4 = showErrors[4] ? sectionErrors(4, form) : []
  const has = (k: string) => errs0.includes(k)
  const has1 = (k: string) => errs1.includes(k)
  const has2 = (k: string) => errs2.includes(k)
  const has3 = (k: string) => errs3.includes(k)
  const has4 = (k: string) => errs4.includes(k)

  function addVlastnik() {
    setField('dalsiVlastnici', [...form.dalsiVlastnici, { ...EMPTY_VLASTNIK }])
  }
  function removeVlastnik(idx: number) {
    setField('dalsiVlastnici', form.dalsiVlastnici.filter((_, i) => i !== idx))
  }
  function updateVlastnik<K extends keyof DalsiVlastnik>(idx: number, key: K, value: DalsiVlastnik[K]) {
    setField('dalsiVlastnici', form.dalsiVlastnici.map((v, i) => i === idx ? { ...v, [key]: value } : v))
  }

  /** Vybraná adresa přepíše celou kontaktní adresu vlastníka, ne jen ulici. */
  function updateVlastnikAdresu(idx: number, adresa: AdresniMisto) {
    setField('dalsiVlastnici', form.dalsiVlastnici.map((v, i) => (
      i === idx ? { ...v, ...adresaZRegistru(adresa) } : v
    )))
  }

  function addMakler() {
    setField('makleri', [...form.makleri, { ...EMPTY_MAKLER, procento: '0' }])
  }
  function removeMakler(idx: number) {
    setField('makleri', form.makleri.filter((_, i) => i !== idx))
  }
  function updateMakler<K extends keyof MaklerItem>(idx: number, key: K, value: MaklerItem[K]) {
    setField('makleri', form.makleri.map((m, i) => i === idx ? { ...m, [key]: value } : m))
  }

  // Accordion: jen jedna sekce může být otevřená. Otevření zavře ostatní (přepne na 'done'/'warning' podle validace).
  function edit(idx: number) {
    setSections(prev => {
      const next = prev.map((status, i) => {
        if (i === idx) return 'open'
        if (status === 'open') return validateSection(i, form) ? 'done' : 'warning'
        return status
      }) as SectionStatus[]
      return next
    })
  }

  // ── Summary builders ─────────────────────────────────────────────────────

  function summary1() {
    const typ = TYP_NEMOVITOSTI.find(t => t.value === form.typNemovitosti)?.label ?? ''
    const obchod = form.typObchodu === 'prodej' ? 'Prodej' : 'Pronájem'
    const mistnost = form.pocetMistnosti[0] ?? ''
    return [typ, obchod, mistnost, form.adresa].filter(Boolean)
  }

  function summary2() {
    const plocha = form.uzitnaPolocha ? `${form.uzitnaPolocha} m²` : ''
    const rok = form.rokVystavby ? `r. ${form.rokVystavby}` : ''
    return [plocha, rok].filter(Boolean)
  }

  function summary3() {
    const name = [form.jmeno, form.prijmeni].filter(Boolean).join(' ')
    const tel = maCisloTelefonu(form.telefon) ? form.telefon : ''
    return [name, tel].filter(Boolean)
  }

  function summary4() {
    if (!form.cena) return []
    const fmt = (n: number) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n)
    const cenaTxt = fmt(Number(form.cena))
    let provTxt = ''
    if (form.provize) {
      if (form.provizeJednotka === 'kc') {
        provTxt = `Provize ${fmt(Math.round(Number(form.provize) * 1.21))} s DPH`
      } else if (form.cena && Number(form.cena) > 0) {
        provTxt = `Provize ${form.provize} % (${fmt(Math.round(Number(form.cena) * Number(form.provize) / 100 * 1.21))} s DPH)`
      } else {
        provTxt = `Provize ${form.provize} %`
      }
    }
    return [cenaTxt, provTxt].filter(Boolean)
  }

  function summary5() {
    const items: string[] = []
    if (form.fotografie.length > 0) items.push(`${form.fotografie.length} fotografií`)
    if (form.video.length > 0) items.push(`${form.video.length} videí`)
    if (form.youtube) items.push('YouTube odkaz')
    if (form.matterport) items.push('Matterport')
    return items
  }

  const allDone = sections.every(s => s === 'done')

  // ── Section 1: Základní údaje ─────────────────────────────────────────────

  const sec1 = (
    <>
      <FieldGroup title="Typ nemovitosti">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TYP_NEMOVITOSTI.length}, minmax(0, 1fr))`, gap: 10 }}>
          {TYP_NEMOVITOSTI.map(({ value, label, Icon }) => (
            <PropTypeBtn
              key={value}
              icon={Icon}
              label={label}
              active={form.typNemovitosti === value}
              onClick={() => setField('typNemovitosti', value)}
            />
          ))}
        </div>
      </FieldGroup>

      <div style={G2}>
        <FieldGroup title="Nabídka se obchoduje">
          <div style={{ display: 'flex', gap: 8 }}>
            <ToggleBtn label="Nabídka je s DPH" active={form.sdph === 'sdph'} onClick={() => setField('sdph', 'sdph')} />
            <ToggleBtn label="Nabídka je bez DPH" active={form.sdph === 'bezdph'} onClick={() => setField('sdph', 'bezdph')} />
          </div>
        </FieldGroup>
        <FieldGroup title="Typ obchodu">
          <div style={{ display: 'flex', gap: 8 }}>
            <ToggleBtn label="Prodej" active={form.typObchodu === 'prodej'} onClick={() => setField('typObchodu', 'prodej')} />
            <ToggleBtn label="Pronájem" active={form.typObchodu === 'pronajem'} onClick={() => setField('typObchodu', 'pronajem')} />
          </div>
        </FieldGroup>
      </div>

      <div style={G2}>
        <FieldGroup title="Spoluvlastnický podíl">
          <div style={{ display: 'flex', gap: 8 }}>
            <ToggleBtn label="Ne" active={!form.spoluvlastnicky} onClick={() => setField('spoluvlastnicky', false)} />
            <ToggleBtn label="Ano" active={form.spoluvlastnicky} onClick={() => setField('spoluvlastnicky', true)} />
          </div>
        </FieldGroup>
        <FieldGroup title="Aukce">
          <div style={{ display: 'flex', gap: 8 }}>
            <ToggleBtn label="Ne" active={!form.aukce} onClick={() => setField('aukce', false)} />
            <ToggleBtn label="Ano" active={form.aukce} onClick={() => setField('aukce', true)} />
          </div>
        </FieldGroup>
      </div>

      <FieldGroup title="Počet místností *">
        <div style={G4}>
          {POCET_MISTNOSTI.map(m => (
            <CheckboxItem
              key={m}
              label={m}
              checked={form.pocetMistnosti.includes(m)}
              onChange={() => setField('pocetMistnosti', toggleArr(form.pocetMistnosti, m))}
            />
          ))}
        </div>
        {has('pocetMistnosti') && <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '18px', color: 'var(--t-textDangerPrimary)' }}>Tento údaj je povinný.</span>}
      </FieldGroup>

      <FieldGroup title="Podkategorie *">
        <div style={G4}>
          {PODKATEGORIE.map(p => (
            <CheckboxItem
              key={p}
              label={p}
              checked={form.podkategorie.includes(p)}
              onChange={() => setField('podkategorie', toggleArr(form.podkategorie, p))}
            />
          ))}
        </div>
        {has('podkategorie') && <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '18px', color: 'var(--t-textDangerPrimary)' }}>Tento údaj je povinný.</span>}
      </FieldGroup>

      <FieldGroup title="Zástava">
        <div style={G4}>
          {ZASTAVA.map(z => (
            <CheckboxItem
              key={z}
              label={z}
              checked={form.zastava.includes(z)}
              onChange={() => setField('zastava', toggleArr(form.zastava, z))}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Vlastnictví *">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VLASTNICTVI_OPT.map(({ value, label }) => (
            <ToggleBtn
              key={value}
              label={label}
              active={form.vlastnictvi === value}
              onClick={() => setField('vlastnictvi', value)}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Stav objektu *">
        <div style={G4}>
          {STAV_OBJEKTU.map(s => (
            <CheckboxItem
              key={s}
              label={s}
              checked={form.stavObjektu.includes(s)}
              onChange={() => setField('stavObjektu', toggleArr(form.stavObjektu, s))}
            />
          ))}
        </div>
        {has('stavObjektu') && <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '18px', color: 'var(--t-textDangerPrimary)' }}>Tento údaj je povinný.</span>}
      </FieldGroup>

      <FieldGroup title="Typ domu *">
        <div style={G4}>
          {TYP_DOMU.map(t => (
            <CheckboxItem
              key={t}
              label={t}
              checked={form.typDomu.includes(t)}
              onChange={() => setField('typDomu', toggleArr(form.typDomu, t))}
            />
          ))}
        </div>
        {has('typDomu') && <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '18px', color: 'var(--t-textDangerPrimary)' }}>Tento údaj je povinný.</span>}
      </FieldGroup>

      <FieldGroup title="Poloha domu *">
        <div style={G4}>
          {POLOHA_DOMU.map(p => (
            <CheckboxItem
              key={p}
              label={p}
              checked={form.polohaDomu.includes(p)}
              onChange={() => setField('polohaDomu', toggleArr(form.polohaDomu, p))}
            />
          ))}
        </div>
        {has('polohaDomu') && <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '18px', color: 'var(--t-textDangerPrimary)' }}>Tento údaj je povinný.</span>}
      </FieldGroup>

      <FieldGroup title="Název nabídky">
        <Input
          value={form.nazevNabidky}
          onChange={(v: string) => setField('nazevNabidky', v)}
          placeholder="Např. Slunný byt 3+kk v centru Prahy"
          width="100%"
        />
      </FieldGroup>

      <FieldGroup title="Adresa nemovitosti *">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {ADRESA_TYP_OPT.map(opt => (
            <CheckboxItem
              key={opt.v}
              label={opt.label}
              checked={form.adresaTyp === opt.v}
              onChange={() => setField('adresaTyp', opt.v)}
            />
          ))}
        </div>
        <Select
          label="Úroveň znepřesnění adresy"
          options={UROVEN_ZNEPRESNENIA_OPT}
          value={form.urovenZnepresnenia}
          onChange={(v: string) => setField('urovenZnepresnenia', v)}
          width="100%"
        />
        {/* Adresní místo nemovitosti je jedna hodnota, ne rozpad - z nabídky se
            do pole vyplní celá adresa včetně PSČ a města. */}
        <AdresaNaseptavac
          label="Adresa"
          value={form.adresa}
          onChange={(v: string) => setField('adresa', v)}
          onVybrat={a => setField('adresa', celaAdresa(a))}
          placeholder="Začněte psát adresu…"
          helperText="Vyberte adresu z nabídky - bez toho se adresní místo nenačte."
          error={has('adresa') ? 'Tento údaj je povinný.' : undefined}
        />
      </FieldGroup>
    </>
  )

  // ── Section 2: Parametry ──────────────────────────────────────────────────

  const sec2 = (
    <>
      <FieldGroup title="Informace o stavbě">
        <div style={G4}>
          <Select label="Materiál *" options={MATERIAL_OPT} value={form.material} onChange={v => setField('material', v)} width="100%" error={has1('material') ? 'Tento údaj je povinný.' : undefined} />
          <Select label="Lokace" options={LOKACE_OPT} value={form.lokace} onChange={v => setField('lokace', v)} width="100%" />
          <Input label="Rok kolaudace" value={form.rokKolaudace} onChange={v => setField('rokKolaudace', v)} placeholder="2015" width="100%" numeric />
          <Input label="Datum zahájení výstavby" value={form.datumZahajeni} onChange={v => setField('datumZahajeni', v)} placeholder="DD.MM.RRRR" width="100%" />
          <Input label="Datum ukončení výstavby" value={form.datumUkonceni} onChange={v => setField('datumUkonceni', v)} placeholder="DD.MM.RRRR" width="100%" />
          <Input label="Rok výstavby" value={form.rokVystavby} onChange={v => setField('rokVystavby', v)} placeholder="1990" width="100%" numeric />
          <Input label="Datum nastěhování" value={form.datumNastehovani} onChange={v => setField('datumNastehovani', v)} placeholder="DD.MM.RRRR" width="100%" />
          <Input label="Rok rekonstrukce" value={form.rokRekonstrukce} onChange={v => setField('rokRekonstrukce', v)} placeholder="2020" width="100%" numeric />
        </div>
      </FieldGroup>

      <FieldGroup title="Další zařízení">
        <div style={G4}>
          {DALSI_ZARIZENI.map(z => (
            <CheckboxItem key={z} label={z} checked={form.dalsiZarizeni.includes(z)} onChange={() => setField('dalsiZarizeni', toggleArr(form.dalsiZarizeni, z))} />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Plochy">
        <div style={G4}>
          <Input label="Užitná plocha *" value={form.uzitnaPolocha} onChange={v => setField('uzitnaPolocha', v)} placeholder="85" width="100%" suffix="m²" numeric textAlign="right" error={has1('uzitnaPolocha') ? 'Tento údaj je povinný.' : undefined} />
          <Input label="Plocha zastavená" value={form.plochaZastavena} onChange={v => setField('plochaZastavena', v)} placeholder="0" width="100%" suffix="m²" numeric textAlign="right" />
          <Input label="Zahrada" value={form.zahrada} onChange={v => setField('zahrada', v)} placeholder="0" width="100%" suffix="m²" numeric textAlign="right" />
          <Input label="Plocha pozemku *" value={form.plochaPozemku} onChange={v => setField('plochaPozemku', v)} placeholder="300" width="100%" suffix="m²" numeric textAlign="right" error={has1('plochaPozemku') ? 'Tento údaj je povinný.' : undefined} />
          <Input label="Celková plocha" value={form.celkovaPlocha} onChange={v => setField('celkovaPlocha', v)} placeholder="0" width="100%" suffix="m²" numeric textAlign="right" />
          <Input label="Užitná plocha přízemí" value={form.uzitnaPlochaPrizemi} onChange={v => setField('uzitnaPlochaPrizemi', v)} placeholder="0" width="100%" suffix="m²" numeric textAlign="right" />
          <Input label="Plocha dílen" value={form.plochaDilen} onChange={v => setField('plochaDilen', v)} placeholder="0" width="100%" suffix="m²" numeric textAlign="right" />
          <Input label="Plocha zahrady" value={form.plochaZahrady} onChange={v => setField('plochaZahrady', v)} placeholder="0" width="100%" suffix="m²" numeric textAlign="right" />
        </div>
      </FieldGroup>

      <FieldGroup title="Podlaží">
        <span style={{ fontSize: 13, color: 'var(--t-textSecondary)' }}>
          V případě vyplnění umístěním se musí vyplnit i počet nadzemních podlaží, které je rovno nebo větší než hodnota umístění.
        </span>
        <div style={G4}>
          <Input label="Nadzemních" value={form.nadzemnich} onChange={v => setField('nadzemnich', v)} placeholder="2" width="100%" numeric />
          <Input label="Podzemních" value={form.podzemnich} onChange={v => setField('podzemnich', v)} placeholder="1" width="100%" numeric />
        </div>
      </FieldGroup>

      <FieldGroup title="Popis">
        <span style={{ fontSize: 13, color: 'var(--t-textSecondary)', lineHeight: '20px' }}>
          Český popis je povinný. Anglickou variantu můžete doplnit volitelně.
        </span>

        <TextArea
          label="Česky"
          required
          placeholder="Popisek musí být min. 10 znaků dlouhý a nesmí překročit více jak 3000 znaků."
          value={form.popis}
          onChange={v => setField('popis', v)}
          width="100%"
          minHeight={140}
          error={has1('popis') ? 'Český popis je povinný.' : undefined}
        />

        <TextArea
          label="Anglicky"
          placeholder="Volitelně doplňte anglickou variantu popisu (max. 3000 znaků)."
          value={form.popisEn}
          onChange={v => setField('popisEn', v)}
          width="100%"
          minHeight={140}
        />
      </FieldGroup>

      <FieldGroup title="Další informace">
        <div style={G4}>
          <Select label="Ochrana" options={OCHRANA_OPT} value={form.ochrana} onChange={v => setField('ochrana', v)} width="100%" />
          <Input label="Náklady na bydlení" value={form.nakladyBydleni} onChange={v => setField('nakladyBydleni', v)} placeholder="5 000" width="100%" suffix="Kč" numeric textAlign="right" />
          <Select label="Vybavení" options={VYBAVENI_OPT} value={form.vybaveni} onChange={v => setField('vybaveni', v)} width="100%" />
          <Input label="Počet garáží" value={form.pocetGarazi} onChange={v => setField('pocetGarazi', v)} placeholder="1" width="100%" numeric />
          <Input label="Míst k parkování" value={form.mistKParkovani} onChange={v => setField('mistKParkovani', v)} placeholder="2" width="100%" numeric />
        </div>
      </FieldGroup>

      <FieldGroup title="Energetická náročnost budovy">
        <div style={G3}>
          <Select label="En. náročnost" options={EN_NAROCNOST_OPT} value={form.enNarocnost} onChange={v => setField('enNarocnost', v)} width="100%" />
          <Select label="Vyhláška" options={VYHLASKA_OPT} value={form.vyhlaska} onChange={v => setField('vyhlaska', v)} width="100%" />
          <Input label="Uk. en. náročnosti" value={form.ukEnNarocnosti} onChange={v => setField('ukEnNarocnosti', v)} placeholder="120" width="100%" suffix="m²·K" numeric textAlign="right" />
        </div>
        <CheckboxItem label="Nízkoenergetický" checked={form.nizkoenergeticky} onChange={v => setField('nizkoenergeticky', v)} />
      </FieldGroup>
    </>
  )

  // ── Section 2 extra: Vybavení objektu ─────────────────────────────────────

  const sec2Vybaveni = (
    <>
      <FieldGroup title="Zdroj vody">
        <div style={G4}>
          {ZDROJ_VODY.map(o => <CheckboxItem key={o} label={o} checked={form.zdrojVody.includes(o)} onChange={() => setField('zdrojVody', toggleArr(form.zdrojVody, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Typ studny">
        <div style={G4}>
          {TYP_STUDNY.map(o => <CheckboxItem key={o} label={o} checked={form.typStudny.includes(o)} onChange={() => setField('typStudny', toggleArr(form.typStudny, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Rozvod plynu">
        <div style={G4}>
          {ROZVOD_PLYNU.map(o => <CheckboxItem key={o} label={o} checked={form.rozvodPlynu.includes(o)} onChange={() => setField('rozvodPlynu', toggleArr(form.rozvodPlynu, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Rozvod topení">
        <div style={G4}>
          {ROZVOD_TOPENI.map(o => <CheckboxItem key={o} label={o} checked={form.rozvodTopeni.includes(o)} onChange={() => setField('rozvodTopeni', toggleArr(form.rozvodTopeni, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Topné těleso">
        <div style={G4}>
          {TOPNE_TELESO.map(o => <CheckboxItem key={o} label={o} checked={form.topneTeleso.includes(o)} onChange={() => setField('topneTeleso', toggleArr(form.topneTeleso, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Zdroj topení">
        <div style={G4}>
          {ZDROJ_TOPENI.map(o => <CheckboxItem key={o} label={o} checked={form.zdrojTopeni.includes(o)} onChange={() => setField('zdrojTopeni', toggleArr(form.zdrojTopeni, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Zdroj teplé vody">
        <div style={G4}>
          {ZDROJ_TEPLE_VODY.map(o => <CheckboxItem key={o} label={o} checked={form.zdrojTepleVody.includes(o)} onChange={() => setField('zdrojTepleVody', toggleArr(form.zdrojTepleVody, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Typ odpadu">
        <div style={G4}>
          {TYP_ODPADU.map(o => <CheckboxItem key={o} label={o} checked={form.typOdpadu.includes(o)} onChange={() => setField('typOdpadu', toggleArr(form.typOdpadu, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Komunikace">
        <div style={G4}>
          {KOMUNIKACE.map(o => <CheckboxItem key={o} label={o} checked={form.komunikace.includes(o)} onChange={() => setField('komunikace', toggleArr(form.komunikace, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Doprava">
        <div style={G4}>
          {DOPRAVA.map(o => <CheckboxItem key={o} label={o} checked={form.doprava.includes(o)} onChange={() => setField('doprava', toggleArr(form.doprava, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Elektřina">
        <div style={G4}>
          {ELEKTRINA.map(o => <CheckboxItem key={o} label={o} checked={form.elektrina.includes(o)} onChange={() => setField('elektrina', toggleArr(form.elektrina, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Počet fází">
        <div style={G4}>
          {POCET_FAZI.map(o => <CheckboxItem key={o} label={o} checked={form.pocetFazi.includes(o)} onChange={() => setField('pocetFazi', toggleArr(form.pocetFazi, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Jističe">
        <div style={G4}>
          {JISTICE.map(o => <CheckboxItem key={o} label={o} checked={form.jistice.includes(o)} onChange={() => setField('jistice', toggleArr(form.jistice, o))} />)}
        </div>
      </FieldGroup>
      <FieldGroup title="Fotovoltaika">
        <div style={{ display: 'flex', gap: 24 }}>
          <CheckboxItem label="Ano" checked={form.fotovoltaika === 'ano'} onChange={() => setField('fotovoltaika', 'ano')} />
          <CheckboxItem label="Ne" checked={form.fotovoltaika === 'ne'} onChange={() => setField('fotovoltaika', 'ne')} />
        </div>
      </FieldGroup>
      <FieldGroup title="Solární panely">
        <div style={{ display: 'flex', gap: 24 }}>
          <CheckboxItem label="Ano" checked={form.solarniPanely === 'ano'} onChange={() => setField('solarniPanely', 'ano')} />
          <CheckboxItem label="Ne" checked={form.solarniPanely === 'ne'} onChange={() => setField('solarniPanely', 'ne')} />
        </div>
      </FieldGroup>
      <FieldGroup title="Bezbariérový">
        <div style={{ display: 'flex', gap: 24 }}>
          <CheckboxItem label="Ano" checked={form.bezbarierovy === 'ano'} onChange={() => setField('bezbarierovy', 'ano')} />
          <CheckboxItem label="Ne" checked={form.bezbarierovy === 'ne'} onChange={() => setField('bezbarierovy', 'ne')} />
        </div>
      </FieldGroup>
    </>
  )

  // ── Section 3: Klient ─────────────────────────────────────────────────────

  const sec3 = (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* typography.body16Semibold */}
          <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>
            Hlavní vlastník <span style={{ color: 'var(--t-textDangerPrimary)' }}>*</span>
          </span>
          <TextButton label="Vyhledat klienta" variant="brand" leadIcon={SearchIcon} onClick={() => setKlientModalOpen(true)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={G2}>
            <TelefonInput label="Telefon *" value={form.telefon} onChange={v => setField('telefon', v)} error={has2('telefon') ? 'Tento údaj je povinný.' : undefined} />
            <Input label="E-mail" value={form.email} onChange={v => setField('email', v)} placeholder="jmeno@email.cz" width="100%" />
          </div>

          <FieldGroup title="Základní údaje">
            <div style={G4}>
              <Input label="Jméno *" value={form.jmeno} onChange={v => setField('jmeno', v)} placeholder="Jan" width="100%" error={has2('jmeno') ? 'Tento údaj je povinný.' : undefined} />
              <Input label="Příjmení *" value={form.prijmeni} onChange={v => setField('prijmeni', v)} placeholder="Novák" width="100%" error={has2('prijmeni') ? 'Tento údaj je povinný.' : undefined} />
              <Input label="Titul před jménem" value={form.titulPred} onChange={v => setField('titulPred', v)} placeholder="Ing." width="100%" />
              <Input label="Titul za jménem" value={form.titulZa} onChange={v => setField('titulZa', v)} placeholder="MBA" width="100%" />
            </div>
            <div style={G3}>
              <Input label="Název společnosti" value={form.nazevSpolecnosti} onChange={v => setField('nazevSpolecnosti', v)} placeholder="Název s.r.o." width="100%" />
              <Input label="IČ společnosti" value={form.ic} onChange={v => setField('ic', v)} placeholder="12345678" width="100%" numeric />
              <Input label="Pozice zastupující osoby" value={form.pozice} onChange={v => setField('pozice', v)} placeholder="Jednatel" width="100%" />
            </div>
          </FieldGroup>

          <FieldGroup title="Kontaktní adresa">
            <div style={G4}>
              <AdresaNaseptavac
                value={form.ulice}
                onChange={v => setField('ulice', v)}
                onVybrat={a => setForm(prev => ({ ...prev, ...adresaZRegistru(a) }))}
              />
              <Input label="Č.p." value={form.cp} onChange={v => setField('cp', v)} placeholder="12" width="100%" />
              <Input label="Č.o." value={form.co} onChange={v => setField('co', v)} placeholder="3" width="100%" />
              <Input label="Město" value={form.mesto} onChange={v => setField('mesto', v)} placeholder="Praha" width="100%" />
            </div>
            <div style={G4}>
              <Input label="PSČ" value={form.psc} onChange={v => setField('psc', v)} placeholder="110 00" width="100%" />
            </div>
          </FieldGroup>
        </div>
      </div>

      {form.dalsiVlastnici.map((v, idx) => (
        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>
              Vlastník č. {idx + 2}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <TextButton label="Vyhledat klienta" variant="brand" leadIcon={SearchIcon} onClick={() => setKlientModalOpen(true)} />
              <TextButton label="Smazat" variant="danger" leadIcon={Trash2} onClick={() => removeVlastnik(idx)} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={G2}>
              <TelefonInput label="Telefon *" value={v.telefon} onChange={val => updateVlastnik(idx, 'telefon', val)} />
              <Input label="E-mail" value={v.email} onChange={val => updateVlastnik(idx, 'email', val)} placeholder="jmeno@email.cz" width="100%" />
            </div>
            <FieldGroup title="Základní údaje">
              <div style={G4}>
                <Input label="Jméno" value={v.jmeno} onChange={val => updateVlastnik(idx, 'jmeno', val)} placeholder="Jan" width="100%" />
                <Input label="Příjmení" value={v.prijmeni} onChange={val => updateVlastnik(idx, 'prijmeni', val)} placeholder="Novák" width="100%" />
                <Input label="Titul před jménem" value={v.titulPred} onChange={val => updateVlastnik(idx, 'titulPred', val)} placeholder="Ing." width="100%" />
                <Input label="Titul za jménem" value={v.titulZa} onChange={val => updateVlastnik(idx, 'titulZa', val)} placeholder="MBA" width="100%" />
              </div>
            </FieldGroup>
            <FieldGroup title="Kontaktní adresa">
              <div style={G4}>
                <AdresaNaseptavac
                  value={v.ulice}
                  onChange={val => updateVlastnik(idx, 'ulice', val)}
                  onVybrat={a => updateVlastnikAdresu(idx, a)}
                />
                <Input label="Č.p." value={v.cp} onChange={val => updateVlastnik(idx, 'cp', val)} placeholder="12" width="100%" />
                <Input label="Č.o." value={v.co} onChange={val => updateVlastnik(idx, 'co', val)} placeholder="3" width="100%" />
                <Input label="Město" value={v.mesto} onChange={val => updateVlastnik(idx, 'mesto', val)} placeholder="Praha" width="100%" />
              </div>
              <div style={G4}>
                <Input label="PSČ" value={v.psc} onChange={val => updateVlastnik(idx, 'psc', val)} placeholder="110 00" width="100%" />
              </div>
            </FieldGroup>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <TextButton label="Přidat vlastníka" variant="brand" leadIcon={Plus} onClick={addVlastnik} />
      </div>
    </>
  )

  // ── Section 4: Cena a ostatní ─────────────────────────────────────────────

  const sec4 = (
    <>
      <FieldGroup title="Cena nemovitosti *">
        <div style={G3}>
          <Input
            label="Cena"
            required
            value={form.cena}
            onChange={(v: string) => setField('cena', v)}
            placeholder="0"
            width="100%"
            suffix="Kč"
            numeric
            textAlign="right"
            error={has3('cena') ? 'Tento údaj je povinný.' : undefined}
          />
          <Select
            label="Cena za"
            options={CENA_ZA_OPT}
            value={form.cenaZa}
            onChange={(v: string) => setField('cenaZa', v)}
            width="100%"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <TextButton label="Rychlé nacenění přes CEMAP" variant="brand" leadIcon={Calculator} />
        </div>
        <CheckboxItem
          label="Inzerovat bez ceny"
          checked={form.inzerovatBezCeny}
          onChange={v => setField('inzerovatBezCeny', v)}
        />
        <TextArea
          label="Poznámka k ceně"
          value={form.poznamkaKCene}
          onChange={(v: string) => setField('poznamkaKCene', v.slice(0, 150))}
          placeholder="Volitelná poznámka k ceně (max 150 znaků)"
          width="100%"
          minHeight={72}
        />
      </FieldGroup>

      <FieldGroup title="Další podmínky">
        <div style={G3}>
          <CheckboxItem label="Včetně provize" checked={form.vcetneProvize} onChange={v => setField('vcetneProvize', v)} />
          <CheckboxItem label="+ provize RK" checked={form.plusProvizeRK} onChange={v => setField('plusProvizeRK', v)} />
          <CheckboxItem label="Výhradní spolupráce" checked={form.vyhradniSpoluprace} onChange={v => setField('vyhradniSpoluprace', v)} />
          <CheckboxItem label="Možnost odpočtu DPH" checked={form.moznostOdpoctuDPH} onChange={v => setField('moznostOdpoctuDPH', v)} />
          <CheckboxItem label="Cena včetně poplatků" checked={form.cenaVcetnePoplatku} onChange={v => setField('cenaVcetnePoplatku', v)} />
          <CheckboxItem label="Cena vč. práv. servisu" checked={form.cenaVcPravnihoServisu} onChange={v => setField('cenaVcPravnihoServisu', v)} />
        </div>
        <CheckboxItem
          label="Nájemce neplatí provizi"
          checked={form.najemceNeplaitProvizi}
          onChange={v => setField('najemceNeplaitProvizi', v)}
        />
        <div style={G3}>
          <Input
            label="Výše vratné kauce"
            value={form.vyseVratneKauce}
            onChange={(v: string) => setField('vyseVratneKauce', v)}
            placeholder="0"
            width="100%"
            suffix="Kč"
            numeric
            textAlign="right"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Provize *">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 12, alignItems: 'end' }}>
          <Input
            label="Výše provize bez DPH"
            value={form.provize}
            onChange={(v: string) => setField('provize', v)}
            placeholder="0"
            width="100%"
            numeric
            textAlign="right"
            error={has3('provize') ? 'Číslo musí být větší rovno 1.' : undefined}
          />
          <Select
            label="Jednotka"
            options={PROVIZE_JEDNOTKA_OPT}
            value={form.provizeJednotka}
            onChange={(v: string) => setField('provizeJednotka', v as 'kc' | 'procento')}
            width="100%"
          />
        </div>
        {form.provize && Number(form.provize) >= 1 && form.provizeJednotka === 'kc' && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--t-bgMyDOCKTertiary)',
            border: '1px solid var(--t-borderMyDOCK)',
            borderRadius: 8,
            color: 'var(--t-textMyDOCKPrimary)',
            fontSize: 14, fontWeight: 600, lineHeight: '20px',
            alignSelf: 'flex-start',
          }}>
            Provize činí: {new Intl.NumberFormat('cs-CZ').format(Math.round(Number(form.provize) * 1.21))} Kč s DPH
          </div>
        )}
        {form.provize && Number(form.provize) >= 1 && form.provizeJednotka === 'procento' && form.cena && Number(form.cena) > 0 && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--t-bgMyDOCKTertiary)',
            border: '1px solid var(--t-borderMyDOCK)',
            borderRadius: 8,
            color: 'var(--t-textMyDOCKPrimary)',
            fontSize: 14, fontWeight: 600, lineHeight: '20px',
            alignSelf: 'flex-start',
          }}>
            Provize činí: {new Intl.NumberFormat('cs-CZ').format(Math.round(Number(form.cena) * Number(form.provize) / 100 * 1.21))} Kč s DPH
          </div>
        )}
      </FieldGroup>

      <FieldGroup title="Makléř spravující zakázku *">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {form.makleri.map((m, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 40px', gap: 12, alignItems: 'end' }}>
              <SelectSearch
                label={idx === 0 ? 'Makléř' : ''}
                options={MAKLERI_OPT}
                value={m.jmeno}
                onChange={val => updateMakler(idx, 'jmeno', val)}
                placeholder="Vyberte makléře"
                width="100%"
              />
              <Input
                label={idx === 0 ? 'Procento z provize' : ''}
                value={m.procento}
                onChange={val => updateMakler(idx, 'procento', val)}
                placeholder="0"
                width="100%"
                suffix="%"
                numeric
                textAlign="right"
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32 }}>
                {form.makleri.length > 1 && (
                  <IconButton
                    icon={Trash2}
                    variant="ghost"
                    size="md"
                    tooltip="Odebrat makléře"
                    onClick={() => removeMakler(idx)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        {has3('makleri') && <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '18px', color: 'var(--t-textDangerPrimary)' }}>Vyberte alespoň jednoho makléře.</span>}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <TextButton label="Přidat makléře k zakázce" variant="brand" leadIcon={Plus} onClick={addMakler} />
        </div>
      </FieldGroup>
    </>
  )

  // ── Section 5: Fotografie ─────────────────────────────────────────────────

  const UploadZone = ({
    title, hint, hasError,
  }: { title: string; hint: React.ReactNode; hasError?: boolean }) => (
    <div style={{
      border: `1px solid ${hasError ? 'var(--t-borderDanger, #DC2626)' : 'var(--t-borderMyDOCK)'}`,
      borderRadius: 12,
      padding: '36px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      background: 'var(--t-bgPrimary)',
      cursor: 'pointer',
    }}>
      <Upload size={28} color="var(--t-textTertiary)" />
      <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)', textAlign: 'center' }}>
        {title}
      </span>
      <span style={{ fontSize: 13, color: 'var(--t-textSecondary)', textAlign: 'center', lineHeight: '20px' }}>
        {hint}
      </span>
    </div>
  )

  const sec5 = (
    <>
      <FieldGroup title="Fotografie nemovitosti *">
        <UploadZone
          title="Přetažením nebo kliknutím nahrajete soubory."
          hint={<>(Podporované formáty <b>jpg</b>.) <b>Nahrávejte maximálně 30ks fotografií</b></>}
          hasError={has4('fotografie')}
        />
        {has4('fotografie') && <span style={{ fontSize: 12, fontWeight: 600, lineHeight: '18px', color: 'var(--t-textDangerPrimary)' }}>Nahrajte alespoň jednu fotografii.</span>}
      </FieldGroup>

      <FieldGroup title="Videa">
        <span style={{ fontSize: 13, color: 'var(--t-textSecondary)', lineHeight: '20px' }}>
          Pro export videa na portály sreality.cz a reality.idnes.cz je nutné nahrát video jako soubor. Pro export na realitymix.cz vložte odkaz na youtube.com.
        </span>
        <UploadZone
          title="Přetažením nebo kliknutím nahrajete soubory."
          hint={<>(Podporované formáty <b>mp4, mov, flv, avi, mkv</b> o max. velikosti <b>1000 MB</b>.)</>}
        />
      </FieldGroup>

      <FieldGroup title="Odkaz na YouTube">
        <div style={{ maxWidth: 400 }}>
          <Input
            label="YouTube"
            value={form.youtube}
            onChange={(v: string) => setField('youtube', v)}
            placeholder="https://youtube.com/..."
            width="100%"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Virtuální prohlídka Matterport">
        <div style={{ maxWidth: 400 }}>
          <Input
            label="Matterport"
            value={form.matterport}
            onChange={(v: string) => setField('matterport', v)}
            placeholder="https://my.matterport.com/..."
            width="100%"
          />
        </div>
        <FieldGroup title="Exportovat matterport">
          <div style={{ display: 'flex', gap: 24 }}>
            <CheckboxItem label="Ano" checked={form.exportovatMatterport === 'ano'} onChange={() => setField('exportovatMatterport', 'ano')} />
            <CheckboxItem label="Ne" checked={form.exportovatMatterport === 'ne'} onChange={() => setField('exportovatMatterport', 'ne')} />
          </div>
        </FieldGroup>
        <div style={{ maxWidth: 400 }}>
          <Input
            label="Url na panoramu z Mapy.cz"
            value={form.mapyPanorama}
            onChange={(v: string) => setField('mapyPanorama', v)}
            placeholder="https://mapy.cz/..."
            width="100%"
          />
        </div>
      </FieldGroup>
    </>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  const STEP_DEFS: {
    title: string
    content: React.ReactNode
    summary: string[]
    extras?: { title: string; content: React.ReactNode }[]
  }[] = [
    { title: 'Základní údaje', content: sec1, summary: summary1() },
    {
      title: 'Parametry', content: sec2, summary: summary2(),
      extras: [{ title: 'Vybavení objektu', content: sec2Vybaveni }],
    },
    { title: 'Klient', content: sec3, summary: summary3() },
    { title: 'Cena a ostatní', content: sec4, summary: summary4() },
    { title: 'Fotografie', content: sec5, summary: summary5() },
  ]

  const activeIdx = sections.findIndex(s => s === 'open')
  const active = activeIdx >= 0 ? STEP_DEFS[activeIdx] : null
  const isLastStep = activeIdx === STEP_DEFS.length - 1 || activeIdx === -1
  const canGoBack = activeIdx > 0 || activeIdx === -1

  function goBack() {
    if (activeIdx === -1) edit(STEP_DEFS.length - 1)
    else if (activeIdx > 0) edit(activeIdx - 1)
  }

  function goNext() {
    if (activeIdx === -1) { onClose(); return }
    if (activeIdx === STEP_DEFS.length - 1) {
      confirm(activeIdx)
      onClose()
      return
    }
    confirm(activeIdx)
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--t-bgSecondary)',
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--t-bgSecondary)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <h1 style={{
            fontSize: 24, fontWeight: 600, lineHeight: '32px',
            color: 'var(--t-textPrimary)', margin: 0,
          }}>
            {isEdit ? 'Upravit nabídku' : 'Nová nabídka'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button label={isEdit ? 'Uložit změny' : 'Uložit jako draft'} variant="outlined" onClick={onClose} />
            <IconButton icon={X} variant="ghost" size="lg" tooltip="Zavřít" onClick={onClose} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto', padding: '0 24px 24px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'flex-start' }}>
          {/* Step rail */}
          <div style={{
            position: 'sticky', top: 88,
            background: 'var(--t-bgPrimary)',
            border: '1px solid var(--t-borderPrimary)',
            borderRadius: 12,
            padding: 8,
            display: 'flex', flexDirection: 'column', gap: 0,
          }}>
            {STEP_DEFS.map((step, idx) => (
              <RailItem
                key={idx}
                title={step.title}
                status={sections[idx]}
                summary={step.summary}
                onClick={() => edit(idx)}
                isLast={idx === STEP_DEFS.length - 1}
              />
            ))}
          </div>

          {/* Content card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {active && (
              <>
                <div style={{
                  background: 'var(--t-bgPrimary)',
                  border: '1px solid var(--t-borderPrimary)',
                  borderRadius: 12,
                  padding: 24,
                }}>
                  <h2 style={{
                    fontSize: 20, fontWeight: 600, lineHeight: '28px',
                    color: 'var(--t-textPrimary)',
                    margin: '0 0 20px',
                  }}>
                    {active.title}
                  </h2>
                  <div className="form-section-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {active.content}
                  </div>
                </div>
                {active.extras?.map((w, i) => (
                  <div key={i} style={{
                    background: 'var(--t-bgPrimary)',
                    border: '1px solid var(--t-borderPrimary)',
                    borderRadius: 12,
                    padding: 24,
                  }}>
                    <h2 style={{
                      fontSize: 20, fontWeight: 600, lineHeight: '28px',
                      color: 'var(--t-textPrimary)',
                      margin: '0 0 20px',
                    }}>
                      {w.title}
                    </h2>
                    <div className="form-section-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {w.content}
                    </div>
                  </div>
                ))}
              </>
            )}

            {allDone && (
              <div style={{
                background: 'var(--t-bgPrimary)',
                border: '1px solid var(--t-borderPrimary)',
                borderRadius: 12,
                padding: 24,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--t-bgSuccessTertiary)',
                  border: '1px solid var(--t-borderSuccess)',
                  color: 'var(--t-textSuccessPrimary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={22} strokeWidth={3} />
                </div>
                <span style={{ fontSize: 20, fontWeight: 600, lineHeight: '28px', color: 'var(--t-textPrimary)' }}>
                  Vše vyplněno
                </span>
                <span style={{ fontSize: 14, color: 'var(--t-textSecondary)', textAlign: 'center', maxWidth: 480 }}>
                  Zkontrolujte vyplněné kroky v panelu nalevo a uložte nabídku kliknutím na akci v patičce.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 10,
        background: 'var(--t-bgSecondary)',
        borderTop: '1px solid var(--t-borderPrimary)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
        }}>
          <Button label="Zrušit" variant="ghost" onClick={onClose} />
          <Button label="Zpět" variant="outlined" disabled={!canGoBack} onClick={goBack} />
          <Button label={isLastStep ? 'Uložit' : 'Pokračovat'} variant="primary" onClick={goNext} />
        </div>
      </div>

      {klientModalOpen && (
        <KlientSearchModal
          onSelect={(k: KlientData) => {
            setField('telefon', k.telefon)
            setField('email', k.email)
            setField('jmeno', k.jmeno)
            setField('prijmeni', k.prijmeni)
            setField('nazevSpolecnosti', k.nazevSpolecnosti)
            setField('ic', k.icSpolecnosti)
            setKlientModalOpen(false)
          }}
          onClose={() => setKlientModalOpen(false)}
        />
      )}
    </div>,
    document.body,
  )
}
