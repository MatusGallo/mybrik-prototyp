import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Search as SearchIcon, Pencil, Home, X } from 'lucide-react'
import { Form, TextButton, Input, Select, TextArea, Checkbox, Button, IconButton, SwitchGroup, typography } from '@matusgallo/mysabds'
import SelectSearch from '../shared/SelectSearch'
import ConfirmDialog from '../shared/ConfirmDialog'
import KlientSearchModal from '../klienti/KlientSearchModal'
import TelefonInput from '../shared/TelefonInput'
import { VYCHOZI_PREDVOLBA } from '../../data/telefonPredvolby'
import TypNemovitostiSelector, { TYP_NEMOVITOSTI_OPTS } from './TypNemovitostiSelector'
import { pobockyData, uzivateleData } from '../../data/mockOstatni'
import type { KlientData } from '../klienti/KlientPanel'

// ── Constants ──────────────────────────────────────────────────────────────────

const POBOCKY_OPT = pobockyData.map(p => ({ value: p.nazev, label: p.nazev }))
const MAKLERI_OPT = uzivateleData
  .filter(u => u.role === 'Makléř' || u.role === 'Administrátor')
  .map(u => ({ value: `${u.jmeno} ${u.prijmeni}`, label: `${u.jmeno} ${u.prijmeni}` }))

const ZDROJ_OPT = [
  { value: 'Web', label: 'Web' },
  { value: 'Doporučení', label: 'Doporučení' },
  { value: 'Inzerce', label: 'Inzerce' },
  { value: 'Sociální sítě', label: 'Sociální sítě' },
  { value: 'Osobní kontakt', label: 'Osobní kontakt' },
]
const KOMUNIKACE_OPT = [
  { value: 'Telefon', label: 'Telefon' },
  { value: 'E-mail', label: 'E-mail' },
  { value: 'Osobně', label: 'Osobně' },
  { value: 'SMS', label: 'SMS' },
]
const UVER_OPT = [
  { value: 'Ne', label: 'Ne' },
  { value: 'Ano', label: 'Ano' },
]

const KRAJE_OPT = [
  { value: 'Praha', label: 'Praha' },
  { value: 'Středočeský', label: 'Středočeský' },
  { value: 'Jihočeský', label: 'Jihočeský' },
  { value: 'Plzeňský', label: 'Plzeňský' },
  { value: 'Karlovarský', label: 'Karlovarský' },
  { value: 'Ústecký', label: 'Ústecký' },
  { value: 'Liberecký', label: 'Liberecký' },
  { value: 'Královéhradecký', label: 'Královéhradecký' },
  { value: 'Pardubický', label: 'Pardubický' },
  { value: 'Kraj Vysočina', label: 'Kraj Vysočina' },
  { value: 'Jihomoravský', label: 'Jihomoravský' },
  { value: 'Olomoucký', label: 'Olomoucký' },
  { value: 'Zlínský', label: 'Zlínský' },
  { value: 'Moravskoslezský', label: 'Moravskoslezský' },
]

const OKRESY_OPT: Record<string, { value: string; label: string }[]> = {
  Praha: [{ value: 'Praha 1', label: 'Praha 1' }, { value: 'Praha 2', label: 'Praha 2' }, { value: 'Praha 3', label: 'Praha 3' }, { value: 'Praha 4', label: 'Praha 4' }, { value: 'Praha 5', label: 'Praha 5' }],
  Středočeský: [{ value: 'Beroun', label: 'Beroun' }, { value: 'Kladno', label: 'Kladno' }, { value: 'Mladá Boleslav', label: 'Mladá Boleslav' }, { value: 'Nymburk', label: 'Nymburk' }, { value: 'Praha-západ', label: 'Praha-západ' }, { value: 'Praha-východ', label: 'Praha-východ' }],
  Jihomoravský: [{ value: 'Brno-město', label: 'Brno-město' }, { value: 'Brno-venkov', label: 'Brno-venkov' }, { value: 'Hodonín', label: 'Hodonín' }, { value: 'Znojmo', label: 'Znojmo' }],
}

const POCET_POKOJU = ['1 pokoj', '2 pokoje', '3 pokoje', '4 pokoje', '5 a více pokojů', 'Atypický']

const SUBTYPES: Record<string, string[]> = {
  dum: ['Chata', 'Památka/jiné', 'Rodinný dům', 'Vila', 'Dům na klíč', 'Chalupa', 'Zemědělská usedlost'],
  byt: ['Garsoniéra', '1+kk', '1+1', '2+kk', '2+1', '3+kk', '3+1', '4+kk', '4+1', '5+kk a více', 'Mezonet', 'Atypický'],
  pozemek: ['Stavební', 'Zemědělský', 'Lesní', 'Komerční', 'Průmyslový', 'Ostatní'],
  komercni: ['Kancelář', 'Obchod', 'Sklad', 'Výroba', 'Restaurace', 'Hotel', 'Ostatní'],
  ostatni: ['Garáž', 'Parkovací místo', 'Ostatní'],
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const WIDGET: React.CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const HEADING: React.CSSProperties = {
  fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)', lineHeight: '32px', height: 32, margin: 0,
}

const REQ: React.CSSProperties = { color: 'var(--t-textDangerPrimary)' }

const SUBHEADING: React.CSSProperties = { ...typography.body16Semibold, color: 'var(--t-textPrimary)', margin: 0 }

function Req() {
  return <span style={REQ}>*</span>
}

const G2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const G3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const G4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }

// ── Sub-components ─────────────────────────────────────────────────────────────

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onChange(!checked)}
    >
      <Checkbox checked={checked} />
      <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>{label}</span>
    </div>
  )
}

function formatPrice(p: string): string {
  if (!p) return ''
  const num = parseInt(p.replace(/\s/g, ''), 10)
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('cs-CZ').format(num)
}

// ── Poptávka summary ───────────────────────────────────────────────────────────────

function PoptavkaSummary({ typNemovitosti, typPoptavky, kraj, okres, obec, cenaOd, cenaDo, onEdit }: {
  typNemovitosti: string; typPoptavky: string
  kraj: string; okres: string; obec: string
  cenaOd: string; cenaDo: string
  onEdit: () => void
}) {
  const tile = TYP_NEMOVITOSTI_OPTS.find(t => t.value === typNemovitosti)
  const Icon = tile?.Icon ?? Home
  const lokalita = [kraj, okres, obec].filter(Boolean).join(' · ')
  const cenaText = cenaOd || cenaDo
    ? `${formatPrice(cenaOd) || '0'} – ${formatPrice(cenaDo) || '∞'} Kč`
    : ''
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 16px',
      background: 'var(--t-bgSecondary)',
      borderRadius: 8,
      border: '1px solid var(--t-borderPrimary)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8,
        background: 'var(--t-bgMyDOCKTertiary, #fff5f0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} style={{ color: 'var(--t-textMyDOCKPrimary)' }} strokeWidth={1.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)', textTransform: 'capitalize' }}>
            {tile?.label ?? typNemovitosti}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 500, color: 'var(--t-textMyDOCKPrimary)',
            background: 'var(--t-bgMyDOCKTertiary, #fff5f0)',
            padding: '1px 8px', borderRadius: 12,
          }}>
            {typPoptavky}
          </span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {lokalita || '—'}
          {cenaText ? ` · ${cenaText}` : ''}
        </span>
      </div>
      <TextButton label="Upravit" variant="brand" leadIcon={Pencil} onClick={onEdit} />
    </div>
  )
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export default function NovaPoptavkaPanel({ onClose }: Props) {
  const [showDiscard, setShowDiscard] = useState(false)
  const [klientModalOpen, setKlientModalOpen] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  // Step tracking
  const [criteriaConfirmed, setCriteriaConfirmed] = useState(false)
  const [editingCriteria, setEditingCriteria] = useState(false)

  // Property criteria
  const [typNemovitosti, setTypNemovitosti] = useState<string>('')
  const [typPoptavky, setTypPoptavky] = useState<'Prodej' | 'Pronájem'>('Prodej')
  const [kraj, setKraj] = useState('')
  const [okres, setOkres] = useState('')
  const [obec, setObec] = useState('')
  const [castObce, setCastObce] = useState('')
  const [ulice, setUlice] = useState('')
  const [pocetPokoju, setPocetPokoju] = useState<Set<string>>(new Set())
  const [plochaOd, setPlochaOd] = useState('')
  const [plochaDo, setPlochaDo] = useState('')
  const [podtypy, setPodtypy] = useState<Set<string>>(new Set())
  const [cenaOd, setCenaOd] = useState('')
  const [cenaDo, setCenaDo] = useState('')

  // Client
  const [telefon, setTelefon] = useState(VYCHOZI_PREDVOLBA)
  const [email, setEmail] = useState('')
  const [jmeno, setJmeno] = useState('')
  const [prijmeni, setPrijmeni] = useState('')
  const [nazevSpolecnosti, setNazevSpolecnosti] = useState('')
  const [icSpolecnosti, setIcSpolecnosti] = useState('')
  const [pozice, setPozice] = useState('')
  const [uver, setUver] = useState('Ne')
  const [zdroj, setZdroj] = useState('')
  const [typKomunikace, setTypKomunikace] = useState('Telefon')
  const [poznamka, setPoznamka] = useState('')
  const [pobocka, setPobocka] = useState(POBOCKY_OPT[0]?.value ?? '')
  const [makler, setMakler] = useState(MAKLERI_OPT[0]?.value ?? '')

  const okresOpt = kraj && OKRESY_OPT[kraj] ? OKRESY_OPT[kraj] : []

  const subtypes = SUBTYPES[typNemovitosti] ?? []

  const step2Done = criteriaConfirmed && !editingCriteria

  function selectTyp(val: string) {
    setTypNemovitosti(val)
    setPodtypy(new Set())
  }

  function togglePokoje(val: string) {
    setPocetPokoju(prev => {
      const next = new Set(prev)
      next.has(val) ? next.delete(val) : next.add(val)
      return next
    })
  }

  function togglePodtyp(val: string) {
    setPodtypy(prev => {
      const next = new Set(prev)
      next.has(val) ? next.delete(val) : next.add(val)
      return next
    })
  }

  function handleClose() {
    setShowDiscard(true)
  }

  function handleKlientSelect(k: KlientData) {
    setTelefon(k.telefon)
    setEmail(k.email)
    setJmeno(k.jmeno)
    setPrijmeni(k.prijmeni)
    setNazevSpolecnosti(k.nazevSpolecnosti)
    setIcSpolecnosti(k.icSpolecnosti)
    setPozice(k.poziceZastupujiciOsoby)
  }

  const criteriaErrors = {
    typNemovitosti: !typNemovitosti,
    kraj: !kraj,
    pocetPokoju: typNemovitosti === 'dum' && pocetPokoju.size === 0,
    podtyp: subtypes.length > 0 && podtypy.size === 0,
  }

  const errors = {
    ...criteriaErrors,
    email: !email,
    jmeno: !jmeno,
    prijmeni: !prijmeni,
    zdroj: !zdroj,
    typKomunikace: !typKomunikace,
    pobocka: !pobocka,
    makler: !makler,
  }

  function showError(key: keyof typeof errors): string | undefined {
    return submitAttempted && errors[key] ? 'Povinné pole' : undefined
  }

  function handleConfirmCriteria() {
    setSubmitAttempted(true)
    const hasError = Object.values(criteriaErrors).some(Boolean)
    if (!hasError) {
      setCriteriaConfirmed(true)
      setEditingCriteria(false)
      setSubmitAttempted(false)
    }
  }

  function handleEditCriteria() {
    setEditingCriteria(true)
  }

  function handleSubmit() {
    setSubmitAttempted(true)
    const hasError = Object.values(errors).some(Boolean)
    if (!hasError) onClose()
  }

  const footerActions = [
    { label: 'Zrušit', variant: 'outlined' as const, onClick: handleClose },
    { label: 'Vytvořit poptávku', variant: 'primary' as const, disabled: !step2Done, onClick: handleSubmit },
  ]

  return (
    <>
      {createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={handleClose} />,
        document.body
      )}

      <div style={{
        position: 'fixed', right: 0, top: 56, bottom: 0, width: 1080, zIndex: 100,
        boxShadow: '-2px 0 4px -2px #0a0d120f, -4px 0 6px -1px #0a0d121a',
        clipPath: 'inset(0 0 0 -20px)',
      }}>
        <Form
          width={1080}
          minHeight={0}
          footer={{ actions: footerActions }}
        >
          <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: 24, background: 'var(--t-bgSecondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)', fontFamily: 'Inter' }}>Vytvořit poptávku</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={handleClose} />
          </div>
          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Kritéria — summary nebo formulář */}
            {step2Done ? (
              <div style={WIDGET}>
                <span style={HEADING}>Kritéria</span>
                <PoptavkaSummary
                  typNemovitosti={typNemovitosti}
                  typPoptavky={typPoptavky}
                  kraj={kraj}
                  okres={okres}
                  obec={obec}
                  cenaOd={cenaOd}
                  cenaDo={cenaDo}
                  onEdit={handleEditCriteria}
                />
              </div>
            ) : (
              <>
                {/* Typ poptávky */}
                <div style={WIDGET}>
                  <span style={HEADING}>Typ poptávky <Req /></span>
                  <SwitchGroup
                    fullWidth
                    options={[
                      { value: 'Prodej', label: 'Prodej' },
                      { value: 'Pronájem', label: 'Pronájem' },
                    ]}
                    value={typPoptavky}
                    onChange={v => setTypPoptavky(v as 'Prodej' | 'Pronájem')}
                  />
                </div>

                {/* Typ nemovitosti + Podtyp + Počet pokojů */}
                <div style={WIDGET}>
                  <span style={HEADING}>Typ nemovitosti <Req /></span>
                  <TypNemovitostiSelector
                    value={typNemovitosti}
                    onChange={selectTyp}
                    error={submitAttempted && criteriaErrors.typNemovitosti}
                  />
                  {showError('typNemovitosti') && (
                    <span style={{ fontSize: 12, color: 'var(--t-textDangerPrimary)', marginTop: -8 }}>Povinné pole</span>
                  )}

                  {typNemovitosti === 'dum' && (
                    <>
                      <div style={{ height: 1, background: 'var(--t-borderPrimary)', margin: '4px 0' }} />
                      <span style={SUBHEADING}>Počet pokojů <Req /></span>
                      <div style={G4}>
                        {POCET_POKOJU.map(p => (
                          <CheckboxRow
                            key={p}
                            label={p}
                            checked={pocetPokoju.has(p)}
                            onChange={() => togglePokoje(p)}
                          />
                        ))}
                      </div>
                      {showError('pocetPokoju') && (
                        <span style={{ fontSize: 12, color: 'var(--t-textDangerPrimary)', marginTop: -8 }}>Vyberte alespoň jednu možnost</span>
                      )}
                    </>
                  )}

                  {subtypes.length > 0 && (
                    <>
                      <div style={{ height: 1, background: 'var(--t-borderPrimary)', margin: '4px 0' }} />
                      <span style={SUBHEADING}>Podtyp <Req /></span>
                      <div style={G4}>
                        {subtypes.map(s => (
                          <CheckboxRow
                            key={s}
                            label={s}
                            checked={podtypy.has(s)}
                            onChange={() => togglePodtyp(s)}
                          />
                        ))}
                      </div>
                      {showError('podtyp') && (
                        <span style={{ fontSize: 12, color: 'var(--t-textDangerPrimary)', marginTop: -8 }}>Vyberte alespoň jednu možnost</span>
                      )}
                    </>
                  )}
                </div>

                {/* Lokalita */}
                <div style={WIDGET}>
                  <span style={HEADING}>Vyberte lokalitu <Req /></span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12 }}>
                    <Select
                      label="Kraj"
                      required
                      placeholder="Kraj"
                      options={KRAJE_OPT}
                      value={kraj}
                      onChange={v => { setKraj(v); setOkres(''); setObec('') }}
                      error={showError('kraj')}
                      width="100%"
                    />
                    <Select
                      label="Okres"
                      placeholder="Okres"
                      options={okresOpt}
                      value={okres}
                      onChange={v => { setOkres(v); setObec('') }}
                      disabled={!kraj}
                      width="100%"
                    />
                    <Input label="Obec" placeholder="Obec" value={obec} onChange={setObec} disabled={!okres} width="100%" />
                    <Input label="Část obce" placeholder="Část obce" value={castObce} onChange={setCastObce} disabled={!obec} width="100%" />
                    <Input label="Ulice" placeholder="Ulice" value={ulice} onChange={setUlice} disabled={!castObce} width="100%" />
                  </div>
                </div>

                {/* Plocha */}
                <div style={WIDGET}>
                  <span style={HEADING}>Plocha</span>
                  <div style={G4}>
                    <Input label="Užitná plocha od" placeholder="50" suffix="m²" numeric textAlign="right" value={plochaOd} onChange={setPlochaOd} width="100%" />
                    <Input label="Užitná plocha do" placeholder="120" suffix="m²" numeric textAlign="right" value={plochaDo} onChange={setPlochaDo} width="100%" />
                  </div>
                </div>

                {/* Cena */}
                <div style={WIDGET}>
                  <span style={HEADING}>Cena</span>
                  <div style={G4}>
                    <Input label="Cena od" placeholder="3 000 000" suffix="Kč" numeric textAlign="right" value={cenaOd} onChange={setCenaOd} width="100%" />
                    <Input label="Cena do" placeholder="8 000 000" suffix="Kč" numeric textAlign="right" value={cenaDo} onChange={setCenaDo} width="100%" />
                  </div>
                </div>

                {/* Potvrdit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    label="Potvrdit"
                    variant="primary"
                    onClick={handleConfirmCriteria}
                  />
                </div>
              </>
            )}

            {/* Klient + další sekce — jen po potvrzení kritérií */}
            {step2Done && (
              <>
                <div style={WIDGET}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <span style={HEADING}>Údaje o klientovi</span>
                    <TextButton label="Vyhledat klienta" variant="brand" leadIcon={SearchIcon} onClick={() => setKlientModalOpen(true)} />
                  </div>
                  <div style={G4}>
                    <TelefonInput value={telefon} onChange={setTelefon} />
                    <Input label="E-mail" required value={email} onChange={setEmail} error={showError('email')} width="100%" />
                    <Input label="Jméno" required value={jmeno} onChange={setJmeno} error={showError('jmeno')} width="100%" />
                    <Input label="Příjmení" required value={prijmeni} onChange={setPrijmeni} error={showError('prijmeni')} width="100%" />
                  </div>
                  <div style={G3}>
                    <Input label="Název společnosti" value={nazevSpolecnosti} onChange={setNazevSpolecnosti} width="100%" />
                    <Input label="IČ společnosti" value={icSpolecnosti} onChange={setIcSpolecnosti} width="100%" />
                    <Input label="Pozice zastupující osoby" value={pozice} onChange={setPozice} width="100%" />
                  </div>
                  <div style={G4}>
                    <Select label="Úvěr" options={UVER_OPT} value={uver} onChange={setUver} width="100%" />
                  </div>
                </div>

                <div style={WIDGET}>
                  <span style={HEADING}>Další údaje</span>
                  <div style={G2}>
                    <Select label="Zdroj" required options={ZDROJ_OPT} value={zdroj} onChange={setZdroj} error={showError('zdroj')} width="100%" />
                    <Select label="Typ komunikace" required options={KOMUNIKACE_OPT} value={typKomunikace} onChange={setTypKomunikace} error={showError('typKomunikace')} width="100%" />
                  </div>
                </div>

                <div style={WIDGET}>
                  <span style={HEADING}>Interní poznámka</span>
                  <TextArea placeholder="Zadejte doplňující informace k poptávce" value={poznamka} onChange={setPoznamka} width="100%" minHeight={120} />
                </div>

                <div style={WIDGET}>
                  <span style={HEADING}>Přidělit záznam</span>
                  <div style={G2}>
                    <SelectSearch label="Pobočka" required options={POBOCKY_OPT} value={pobocka} onChange={setPobocka} width="100%" />
                    <SelectSearch label="Makléř" required options={MAKLERI_OPT} value={makler} onChange={setMakler} width="100%" />
                  </div>
                </div>
              </>
            )}

          </div>
        </Form>
      </div>

      {klientModalOpen && (
        <KlientSearchModal
          onSelect={handleKlientSelect}
          onClose={() => setKlientModalOpen(false)}
        />
      )}

      {showDiscard && (
        <ConfirmDialog
          title="Zahodit změny?"
          description="Máte neuložené změny. Chcete je zahodit, nebo pokračovat v úpravách?"
          primaryLabel="Zrušit"
          secondaryLabel="Pokračovat v úpravách"
          destructive
          onPrimary={onClose}
          onSecondary={() => setShowDiscard(false)}
        />
      )}
    </>
  )
}
