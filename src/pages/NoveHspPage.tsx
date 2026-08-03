import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, UserRound, FileText, Percent, Share2, Check,
  ClipboardCheck, Star, CircleCheck, type LucideIcon,
} from 'lucide-react'
import {
  Alert, Button, IconButton, Input, Select, SummaryListItem, SwitchGroup,
  Tag, Toggle, iconSize, typography,
} from '@matusgallo/mysabds'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { uzivateleData } from '../data/mockOstatni'

// ── Data ──────────────────────────────────────────────────────────────────────

const OSOBY = [...uzivateleData]
  .sort((a, b) => `${a.prijmeni} ${a.jmeno}`.localeCompare(`${b.prijmeni} ${b.jmeno}`, 'cs'))
  .map(u => ({
    value: String(u.id),
    label: `${u.titulPred ? `${u.titulPred} ` : ''}${u.jmeno} ${u.prijmeni}`,
    sub: u.role,
    initials: `${u.jmeno[0] ?? ''}${u.prijmeni[0] ?? ''}`,
    email: u.firemnEmail,
    telefon: u.telefon.replace(/^\+420\s*/, ''),
  }))

const OSOBA_OPTIONS = OSOBY.map(({ value, label, sub }) => ({ value, label, sub }))

const BANKY = [
  { value: '0100', label: '0100 - Komerční banka' },
  { value: '0300', label: '0300 - ČSOB' },
  { value: '0600', label: '0600 - MONETA Money Bank' },
  { value: '0710', label: '0710 - Česká národní banka' },
  { value: '0800', label: '0800 - Česká spořitelna' },
  { value: '2010', label: '2010 - Fio banka' },
  { value: '2250', label: '2250 - Banka CREDITAS' },
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
  { value: 'po', label: 'Právnická osoba', icon: Building2 },
  { value: 'fo', label: 'Fyzická osoba', icon: UserRound },
]

// ── Model ─────────────────────────────────────────────────────────────────────

type Stav = 'aktivni' | 'neaktivni'
type TypOsoby = 'po' | 'fo'
type SubjektKey = 'platce' | 'neplatce'

interface Subjekt {
  zapnuto: boolean
  typOsoby: TypOsoby
  obchodniNazev: string
  jmeno: string
  prijmeni: string
  ic: string
  dic: string
  ulice: string
  cisloPopisne: string
  cisloOrientacni: string
  mesto: string
  psc: string
  predcisli: string
  cisloUctu: string
  kodBanky: string
}

const EMPTY_SUBJEKT: Subjekt = {
  zapnuto: false, typOsoby: 'po',
  obchodniNazev: '', jmeno: '', prijmeni: '', ic: '', dic: '',
  ulice: '', cisloPopisne: '', cisloOrientacni: '', mesto: '', psc: '',
  predcisli: '', cisloUctu: '', kodBanky: '',
}

const SUBJEKT_DEFS: { key: SubjektKey; kod: string; nazev: string; popis: string; jePlatce: boolean }[] = [
  {
    key: 'platce', kod: 'DPH', nazev: 'Plátcovský subjekt',
    popis: 'Firma registrovaná k DPH - fakturace včetně DPH', jePlatce: true,
  },
  {
    key: 'neplatce', kod: 'BEZ', nazev: 'Neplátcovský subjekt',
    popis: 'Firma neregistrovaná k DPH - fakturace bez DPH', jePlatce: false,
  },
]

const SUBJEKT_KEYS = SUBJEKT_DEFS.map(d => d.key)

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
  children: React.ReactNode
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

/** Odrážka v kartě pravidel - text s tučně vyznačenými výrazy. */
function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)', marginBottom: 8 }}>
      {children}
    </li>
  )
}

const B = ({ children }: { children: string }) => (
  <strong style={{ fontWeight: 600, color: 'var(--t-textPrimary)' }}>{children}</strong>
)

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NoveHspPage() {
  const navigate = useNavigate()

  const [nazev, setNazev] = useState('')
  const [stav, setStav] = useState<Stav>('neaktivni')
  const [osobaId, setOsobaId] = useState('')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')
  const [subjekty, setSubjekty] = useState<Record<SubjektKey, Subjekt>>({
    platce: EMPTY_SUBJEKT,
    neplatce: EMPTY_SUBJEKT,
  })
  const [provize, setProvize] = useState('100')
  const [mydockId, setMydockId] = useState('')
  const [mydockOvereno, setMydockOvereno] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [zahoditOpen, setZahoditOpen] = useState(false)

  const osoba = OSOBY.find(o => o.value === osobaId)
  const zapnuteKlice = SUBJEKT_KEYS.filter(k => subjekty[k].zapnuto)

  function setSubjekt(key: SubjektKey, patch: Partial<Subjekt>) {
    setSubjekty(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  function selectOsoba(id: string) {
    setOsobaId(id)
    const o = OSOBY.find(x => x.value === id)
    if (o) {
      setEmail(o.email)
      setTelefon(o.telefon)
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

  // ── Validace ────────────────────────────────────────────────────────────────

  const errors: Record<string, string> = {}
  const digits = (v: string) => v.replace(/\D/g, '')

  if (!nazev.trim()) errors.nazev = 'Zadejte název HSP.'
  if (!osobaId) errors.osoba = 'Vyberte odpovědnou osobu.'
  if (!email.trim()) errors.email = 'Zadejte e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = 'Zadejte e-mail ve formátu jmeno@firma.cz.'
  if (!telefon.trim()) errors.telefon = 'Zadejte telefonní číslo.'
  else if (digits(telefon).length !== 9) errors.telefon = 'Telefonní číslo má 9 číslic.'

  if (zapnuteKlice.length === 0) errors.subjekty = 'Zapněte alespoň jeden fakturační subjekt.'

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
    if (!s.mesto.trim()) errors[`${p}mesto`] = 'Zadejte město.'
    if (!s.psc.trim()) errors[`${p}psc`] = 'Zadejte PSČ.'
    else if (digits(s.psc).length !== 5) errors[`${p}psc`] = 'PSČ má 5 číslic.'
    if (!s.cisloUctu.trim()) errors[`${p}cisloUctu`] = 'Zadejte číslo účtu.'
    if (!s.kodBanky) errors[`${p}kodBanky`] = 'Vyberte banku.'
  }

  if (!provize.trim()) errors.provize = 'Zadejte podíl z provize.'
  else if (Number(provize) < 0 || Number(provize) > 100 || Number.isNaN(Number(provize))) {
    errors.provize = 'Podíl zadejte mezi 0 a 100 %.'
  }

  if (!mydockId.trim()) errors.mydock = 'Zadejte ID záznamu v Mydocku.'
  else if (mydockId.trim() !== mydockOvereno) errors.mydock = 'Ověřte ID v Mydocku.'

  const err = (key: string) => (showErrors ? errors[key] : undefined)

  const dirty = Boolean(
    nazev || osobaId || email || telefon || mydockId ||
    provize !== '100' || stav !== 'neaktivni' || zapnuteKlice.length > 0
  )

  function vytvorit() {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }
    // Prototyp bez API - HSP se po vytvoření neukládá, vracíme se na seznam.
    navigate('/hsp')
  }

  function zahodit() {
    if (dirty) setZahoditOpen(true)
    else navigate('/hsp')
  }

  function overitMydock() {
    if (!mydockId.trim()) {
      setShowErrors(true)
      return
    }
    setMydockOvereno(mydockId.trim())
  }

  // ── Fakturační subjekt ──────────────────────────────────────────────────────

  function subjektBody(def: typeof SUBJEKT_DEFS[number]) {
    const s = subjekty[def.key]
    const p = `${def.key}.`
    const jePo = s.typOsoby === 'po'
    const set = (patch: Partial<Subjekt>) => setSubjekt(def.key, patch)

    return (
      <div style={{ borderTop: '1px solid var(--t-borderPrimary)', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Block label="Typ osoby" first>
          <div>
            <SwitchGroup
              options={TYP_OSOBY_OPTIONS}
              value={s.typOsoby}
              onChange={v => set({ typOsoby: v as TypOsoby })}
              size="compact"
            />
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
              label="Obchodní název" required
              placeholder="Např. Realsoft group s.r.o."
              value={s.obchodniNazev}
              onChange={v => set({ obchodniNazev: v })}
              error={err(`${p}obchodniNazev`)}
              width="100%"
            />
          ) : (
            <Cols cols="1fr 1fr">
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
              value={s.predcisli} onChange={v => set({ predcisli: v })}
              width="100%"
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

  function subjektKarta(def: typeof SUBJEKT_DEFS[number]) {
    const s = subjekty[def.key]
    const typLabel = s.typOsoby === 'po' ? 'Právnická osoba' : 'Fyzická osoba'

    return (
      <div key={def.key} style={{
        border: '1px solid var(--t-borderPrimary)',
        borderRadius: 10,
        background: s.zapnuto ? 'var(--t-bgPrimary)' : 'var(--t-bgSecondary)',
      }}>
        <div
          role="switch"
          aria-checked={s.zapnuto}
          tabIndex={0}
          onClick={() => toggleSubjekt(def.key, !s.zapnuto)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleSubjekt(def.key, !s.zapnuto)
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
            {def.kod}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ ...typography.body14Semibold, color: 'var(--t-textPrimary)' }}>{def.nazev}</div>
            <div style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>{def.popis}</div>
          </div>
          <Tag
            label={s.zapnuto ? typLabel : 'Vypnuto'}
            size="sm"
            variant={s.zapnuto ? 'success' : 'neutral'}
          />
          <Toggle checked={s.zapnuto} decorative />
        </div>
        {s.zapnuto && subjektBody(def)}
      </div>
    )
  }

  // ── Souhrn ──────────────────────────────────────────────────────────────────

  function souhrnSubjekt(key: SubjektKey) {
    const s = subjekty[key]
    if (!s.zapnuto) return 'Nenastaveno'
    const typ = s.typOsoby === 'po' ? 'PO' : 'FO'
    const nazevSubjektu = s.typOsoby === 'po'
      ? s.obchodniNazev.trim()
      : `${s.jmeno} ${s.prijmeni}`.trim()
    return `${typ} - ${nazevSubjektu || 'bez názvu'}`
  }

  const souhrnRows: { label: string; value: React.ComponentProps<typeof SummaryListItem>['value'] }[] = [
    {
      label: 'Odpovědná osoba',
      value: osoba
        ? { kind: 'avatar', initials: osoba.initials, text: osoba.label }
        : { kind: 'text', text: '–' },
    },
    { label: 'Plátce DPH', value: { kind: 'text', text: souhrnSubjekt('platce') } },
    { label: 'Neplátce DPH', value: { kind: 'text', text: souhrnSubjekt('neplatce') } },
    { label: 'Provize', value: { kind: 'text', text: provize ? `${provize} %` : '–' } },
    { label: 'Stav', value: { kind: 'text', text: stav === 'aktivni' ? 'Aktivní' : 'Neaktivní' } },
    { label: 'Mydock', value: { kind: 'text', text: mydockOvereno || '–' } },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────

  const pocetSubjektu = zapnuteKlice.length

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
                Vytvořit HSP
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Tag
                  label={stav === 'aktivni' ? 'Aktivní' : 'Neaktivní'}
                  size="sm"
                  lead="indicator"
                  variant={stav === 'aktivni' ? 'success' : 'danger'}
                />
                <Tag
                  label={
                    pocetSubjektu === 0
                      ? 'Bez fakturačních údajů'
                      : pocetSubjektu === 1 ? '1 fakturační subjekt' : '2 fakturační subjekty'
                  }
                  size="sm"
                  variant={pocetSubjektu === 0 ? 'neutral' : 'success'}
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
              description="Interní označení HSP a jeho aktuální stav"
            >
              <Cols cols="1fr 1fr">
                <Input
                  label="Název HSP" required
                  placeholder="Např. Realsoft group"
                  value={nazev} onChange={setNazev}
                  error={err('nazev')}
                  helperText="Interní název, pod kterým HSP vystupuje v systému."
                  width="100%"
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ ...typography.body14Semibold, color: 'var(--t-textSecondary)' }}>
                    Stav <span style={{ color: 'var(--t-textDangerPrimary)' }}>*</span>
                  </span>
                  <div>
                    <SwitchGroup
                      options={STAV_OPTIONS}
                      value={stav}
                      onChange={v => setStav(v as Stav)}
                      size="compact"
                    />
                  </div>
                  <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                    Neaktivní HSP nelze přiřadit k novým pobočkám.
                  </span>
                </div>
              </Cols>
            </Card>

            <Card
              icon={UserRound}
              title="Odpovědná osoba"
              description="Kontaktní osoba pro smluvní a fakturační komunikaci"
            >
              <Cols cols="1fr 1fr 1fr">
                <Select
                  label="Odpovědná osoba" required
                  placeholder="Vyberte osobu"
                  value={osobaId} onChange={selectOsoba}
                  options={OSOBA_OPTIONS} searchable
                  error={err('osoba')} width="100%"
                />
                <Input
                  label="E-mail" required type="email"
                  placeholder="jmeno@firma.cz"
                  value={email} onChange={setEmail}
                  error={err('email')} width="100%"
                />
                <Input
                  label="Telefon" required leadBadge="+420"
                  placeholder="777 123 456"
                  value={telefon} onChange={setTelefon}
                  error={err('telefon')} width="100%"
                />
              </Cols>
              <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
                Po výběru osoby se e-mail a telefon předplní z jejího profilu - můžete je přepsat.
              </span>
            </Card>

            <Card
              icon={FileText}
              title="Fakturační subjekty"
              description="Nastavte plátcovské údaje, neplátcovské údaje, nebo obojí"
              badge={
                <Tag
                  label={`${pocetSubjektu} ze 2 nastaveno`}
                  size="sm"
                  variant={pocetSubjektu === 0 ? 'neutral' : 'success'}
                />
              }
            >
              <Alert
                variant="info"
                rich
                label="Nejde o přepínač"
                description="HSP může fakturovat pod plátcovským subjektem, pod neplátcovským subjektem, nebo pod oběma současně. Zapněte ty, které HSP skutečně má - alespoň jeden je povinný. Typ osoby (FO / PO) se volí zvlášť u každého subjektu."
              />
              {SUBJEKT_DEFS.map(subjektKarta)}
              {err('subjekty') && (
                <span style={{ ...typography.body12Semibold, color: 'var(--t-textDangerPrimary)' }}>
                  {errors.subjekty}
                </span>
              )}
            </Card>

            <Card
              icon={Percent}
              title="Provize"
              description="Podíl HSP z provize realizované na jeho pobočkách"
            >
              <div style={{ maxWidth: 280 }}>
                <Input
                  label="Provize" required suffix="%" numeric textAlign="left"
                  placeholder="100"
                  value={provize} onChange={setProvize}
                  error={err('provize')}
                  helperText="Výchozí hodnota 100 % znamená, že HSP obdrží celou provizi."
                  width="100%"
                />
              </div>
            </Card>

            <Card
              icon={Share2}
              title="Napojení na Mydock"
              description="Párování HSP se záznamem v Mydocku"
              badge={
                <Tag
                  label={mydockOvereno ? `ID ${mydockOvereno}` : 'Nespárováno'}
                  size="sm"
                  variant={mydockOvereno ? 'success' : 'neutral'}
                />
              }
            >
              <div style={{ maxWidth: 320 }}>
                <FieldWithAction
                  field={
                    <Input
                      label="ID v Mydocku" required numeric
                      placeholder="Např. 48210"
                      value={mydockId}
                      onChange={v => { setMydockId(v); setMydockOvereno('') }}
                      error={err('mydock')}
                      width="100%"
                    />
                  }
                  action={<Button label="Ověřit" variant="outlined" size="md" onClick={overitMydock} />}
                />
              </div>
            </Card>
          </div>

          {/* Souhrn + pravidla */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 115 }}>
            <SidebarCard icon={ClipboardCheck} title="Souhrn nastavení">
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

            <SidebarCard icon={Star} title="Pravidla fakturace">
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                <Rule>HSP musí mít <B>alespoň jeden</B> fakturační subjekt.</Rule>
                <Rule>Může mít <B>oba</B> - plátcovský i neplátcovský - každý jako samostatná firma.</Rule>
                <Rule><B>DIČ</B> se zadává pouze u plátce DPH.</Rule>
                <Rule><B>Fyzická osoba</B> nemá obchodní název - uvádí jméno a příjmení a místo podnikání.</Rule>
                <Rule><B>Právnická osoba</B> uvádí obchodní název a sídlo dle obchodního registru.</Rule>
              </ul>
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
            <Button label="Vytvořit HSP" variant="primary" size="md" leadIcon={Check} onClick={vytvorit} />
          </div>
        </div>
      </div>

      {zahoditOpen && (
        <ConfirmDialog
          title="Zahodit nové HSP?"
          description="Vyplněné údaje se neuloží."
          primaryLabel="Zahodit"
          secondaryLabel="Pokračovat v úpravách"
          destructive
          onPrimary={() => navigate('/hsp')}
          onSecondary={() => setZahoditOpen(false)}
        />
      )}
    </div>
  )
}
