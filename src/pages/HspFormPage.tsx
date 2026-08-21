import { Fragment, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, Building2, UserRound,
} from 'lucide-react'
import {
  Button, Divider, IconButton, Input, Select,
  SwitchGroup, Tag, Toggle, TooltipIcon, typography,
} from '@matusgallo/mysabds'
import AdresaNaseptavac from '../components/shared/AdresaNaseptavac'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import TelefonInput from '../components/shared/TelefonInput'
import type { AdresniMisto } from '../data/adresyRegistr'
import {
  BANKY, EMPTY_SUBJEKT, OSOBY, SUBJEKT_DEFS, SUBJEKT_KEYS,
  emptyHspForm, hspFormFromRow,
  type HspForm, type OsobaOption, type Stav, type Subjekt, type SubjektKey, type TypOsoby,
} from '../data/hspForm'
import { hspData } from '../data/mockOstatni'
import { chybaTelefonu } from '../data/telefonPredvolby'

// ── Volby ────────────────────────────────────────────────────────────────────

const STAV_OPTIONS = [
  { value: 'aktivni', label: 'Aktivní' },
  { value: 'neaktivni', label: 'Neaktivní' },
]

const TYP_OSOBY_OPTIONS = [
  { value: 'fo', label: 'Fyzická osoba', icon: UserRound },
  { value: 'po', label: 'Právnická osoba', icon: Building2 },
]

/**
 * Adresa z našeptávače do polí subjektu. Část obce se nepřenáší - formulář pro
 * ni pole nemá a do města nepatří, protože to je jméno obce, ne její části.
 */
function adresaZRegistru(a: AdresniMisto): Partial<Subjekt> {
  return {
    ulice: a.ulice,
    cisloPopisne: a.cisloPopisne,
    cisloOrientacni: a.cisloOrientacni,
    psc: a.psc,
    mesto: a.mesto,
  }
}

// ── Layout helpers ────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
}

function Card({ title, description, tooltip, badge, children }: {
  title: string
  description: string
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
        className="toggle-card-head"
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
      {checked && (
        <>
          <Divider />
          {children}
        </>
      )}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HspFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate()
  const { id } = useParams()

  const isEdit = mode === 'edit'
  const row = isEdit ? hspData.find(h => String(h.id) === id) : undefined
  // Výchozí hodnoty se spočítají jednou — u editace z existujícího záznamu.
  const [init] = useState<HspForm>(() => (row ? hspFormFromRow(row) : emptyHspForm()))

  const [nazev, setNazev] = useState(init.nazev)
  const [stav, setStav] = useState<Stav>(init.stav)
  const [osobaId, setOsobaId] = useState(init.osoba?.value ?? '')
  const [email, setEmail] = useState(init.email)
  const [predvolba, setPredvolba] = useState(init.predvolba)
  const [telefon, setTelefon] = useState(init.telefon)
  const [subjekty, setSubjekty] = useState<Record<SubjektKey, Subjekt>>(init.subjekty)
  const [provize, setProvize] = useState(init.provize)
  const [mydockId, setMydockId] = useState(init.mydockId)
  const [mydockOvereno, setMydockOvereno] = useState(init.mydockOvereno)
  const [showErrors, setShowErrors] = useState(false)
  const [zavritOpen, setZavritOpen] = useState(false)

  // Starší HSP odkazují na lidi, které mock uživatelů nemá — takovou osobu
  // přidáme do voleb, aby select ukázal skutečnou hodnotu záznamu.
  const osobyOptions: OsobaOption[] = init.osoba && !OSOBY.some(o => o.value === init.osoba?.value)
    ? [init.osoba, ...OSOBY]
    : OSOBY

  const osoba = osobyOptions.find(o => o.value === osobaId)
  const zapnuteKlice = SUBJEKT_KEYS.filter(k => subjekty[k].zapnuto)

  function setSubjekt(key: SubjektKey, patch: Partial<Subjekt>) {
    setSubjekty(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  function selectOsoba(value: string) {
    setOsobaId(value)
    const o = osobyOptions.find(x => x.value === value)
    if (o) {
      setEmail(o.email)
      setPredvolba(o.predvolba)
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
  const chybaTel = chybaTelefonu(predvolba, telefon)
  if (chybaTel) errors.telefon = chybaTel

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
    errors.provize = 'Zadejte 0 až 100 %.'
  }

  if (!mydockId.trim()) errors.mydock = 'Zadejte ID záznamu v Mydocku.'
  else if (mydockId.trim() !== mydockOvereno) errors.mydock = 'Ověřte ID v Mydocku.'

  const err = (key: string) => (showErrors ? errors[key] : undefined)

  // Rozpracovaný formulář = cokoli jiného, než s čím se stránka otevřela.
  const dirty =
    nazev !== init.nazev ||
    stav !== init.stav ||
    osobaId !== (init.osoba?.value ?? '') ||
    email !== init.email ||
    predvolba !== init.predvolba ||
    telefon !== init.telefon ||
    provize !== init.provize ||
    mydockId !== init.mydockId ||
    JSON.stringify(subjekty) !== JSON.stringify(init.subjekty)

  function ulozit() {
    if (Object.keys(errors).length > 0) {
      setShowErrors(true)
      return
    }
    // Prototyp bez API - změny se neukládají, vracíme se na seznam.
    navigate('/hsp')
  }

  function zavrit() {
    if (dirty) setZavritOpen(true)
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
      <div style={{
        background: 'var(--t-bgSecondary)', padding: 16,
        borderRadius: '0 0 11px 11px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <Block label="Typ osoby" first>
          <div>
            <SwitchGroup
              options={TYP_OSOBY_OPTIONS}
              value={s.typOsoby}
              onChange={v => set({ typOsoby: v as TypOsoby })}
              size="compact"
            />
          </div>
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
            <Cols cols="110px minmax(0, 1fr) minmax(0, 1fr)">
              <Input
                label="Titul" placeholder="Např. Ing."
                value={s.titul} onChange={v => set({ titul: v })}
                width="100%"
              />
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

          {!jePo && (
            <Input
              label="Dodatek k názvu" placeholder="Např. Reality Ondrák"
              value={s.dodatek} onChange={v => set({ dodatek: v })}
              helperText="Vyplňte, jen pokud fyzická osoba podniká pod odlišujícím dodatkem."
              width="100%"
            />
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

        <Block label={jePo ? 'Sídlo' : 'Místo podnikání'}>
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
          {/* PSČ + město na vlastním řádku; město končí na stejné hraně jako
              číslo popisné v řádku nad ním. */}
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
      <ToggleCard
        key={def.key}
        checked={s.zapnuto}
        onChange={v => toggleSubjekt(def.key, v)}
        label={def.nazev}
        supportText={s.zapnuto ? typLabel : undefined}
        description={def.popis}
      >
        {subjektBody(def)}
      </ToggleCard>
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

  const souhrnRows: { label: string; text: string }[] = [
    { label: 'Odpovědná osoba', text: osoba?.label ?? '–' },
    { label: 'Plátce DPH', text: souhrnSubjekt('platce') },
    { label: 'Neplátce DPH', text: souhrnSubjekt('neplatce') },
    { label: 'Provize', text: provize ? `${provize} %` : '–' },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────

  const pocetSubjektu = zapnuteKlice.length

  // Kontrola až za hooky — jinak by se při přechodu mezi režimy rozešlo jejich pořadí.
  if (isEdit && !row) {
    return (
      <div style={{ padding: 24, ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>
        HSP nenalezeno.
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
              {isEdit ? 'Upravit HSP' : 'Vytvořit HSP'}
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
              title="Odpovědná osoba"
              description="Kontaktní osoba pro smluvní a fakturační komunikaci"
            >
              <Cols cols="1fr 1fr 1fr">
                <Select
                  label="Odpovědná osoba" required
                  placeholder="Vyberte osobu"
                  value={osobaId} onChange={selectOsoba}
                  options={osobyOptions} searchable
                  error={err('osoba')} width="100%"
                />
                <Input
                  label="E-mail" required type="email"
                  placeholder="jmeno@firma.cz"
                  value={email} onChange={setEmail}
                  error={err('email')} width="100%"
                />
                <TelefonInput
                  required
                  value={telefon} onChange={setTelefon}
                  predvolba={predvolba} onPredvolbaChange={setPredvolba}
                  error={err('telefon')}
                />
              </Cols>
            </Card>

            <Card
              title="Fakturační subjekty"
              description="Zapněte ty subjekty, které HSP má - alespoň jeden je povinný"
              tooltip="Nejde o přepínač. HSP může fakturovat pod plátcovským subjektem, pod neplátcovským, nebo pod oběma současně. Typ osoby (FO / PO) se volí zvlášť u každého subjektu."
              badge={
                <Tag
                  label={`${pocetSubjektu} ze 2 nastaveno`}
                  size="sm"
                  variant={pocetSubjektu === 0 ? 'neutral' : 'success'}
                />
              }
            >
              {SUBJEKT_DEFS.map(subjektKarta)}
              {err('subjekty') && (
                <span style={{ ...typography.body12Semibold, color: 'var(--t-textDangerPrimary)' }}>
                  {errors.subjekty}
                </span>
              )}
            </Card>

            <Card
              title="Provize"
              description="Podíl HSP z provize realizované na jeho pobočkách - 100 % je celá provize"
            >
              {/* Maximum je 100 %, pole tedy stačí na tři číslice a procento. */}
              <Input
                label="Provize" required suffix="%" numeric textAlign="left"
                placeholder="100"
                value={provize} onChange={setProvize}
                error={err('provize')}
                width={140}
              />
            </Card>

            <Card
              title="Napojení na Mydock"
              description="Párování HSP se záznamem v Mydocku"
              badge={
                <Tag
                  label={mydockOvereno ? 'Spárováno' : 'Nespárováno'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 89 }}>
            <SidebarCard title="Souhrn">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SouhrnRow label="Stav">
                  <Tag
                    label={stav === 'aktivni' ? 'Aktivní' : 'Neaktivní'}
                    size="sm"
                    lead="indicator"
                    variant={stav === 'aktivni' ? 'success' : 'danger'}
                  />
                </SouhrnRow>
                {souhrnRows.map(row => (
                  <Fragment key={row.label}>
                    <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                    <SouhrnRow label={row.label}>
                      <SouhrnHodnota text={row.text} />
                    </SouhrnRow>
                  </Fragment>
                ))}
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SouhrnRow label="Mydock">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag
                      label={mydockOvereno ? 'Spárováno' : 'Nespárováno'}
                      size="sm"
                      variant={mydockOvereno ? 'success' : 'neutral'}
                    />
                    {mydockOvereno && (
                      <span style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)' }}>
                        ID {mydockOvereno}
                      </span>
                    )}
                  </div>
                </SouhrnRow>
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
            <Button label={isEdit ? 'Uložit změny' : 'Vytvořit HSP'} variant="primary" size="md" onClick={ulozit} />
          </div>
        </div>
      </div>

      {zavritOpen && (
        <ConfirmDialog
          title={isEdit ? 'Zavřít bez uložení změn?' : 'Zavřít bez vytvoření HSP?'}
          description={isEdit ? 'Provedené změny se neuloží.' : 'Vyplněné údaje se neuloží.'}
          primaryLabel="Zavřít"
          secondaryLabel="Pokračovat v úpravách"
          destructive
          onPrimary={() => navigate('/hsp')}
          onSecondary={() => setZavritOpen(false)}
        />
      )}
    </div>
  )
}
