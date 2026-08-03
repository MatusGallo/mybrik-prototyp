import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Search as SearchIcon, Pencil, MapPin, X } from 'lucide-react'
import { Form, TextButton, Input, Select, TextArea, Button, IconButton } from '@matusgallo/mysabds'
import SelectSearch from '../shared/SelectSearch'
import ConfirmDialog from '../shared/ConfirmDialog'
import KlientSearchModal from '../klienti/KlientSearchModal'
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
const UCEL_UVERU_OPT = [
  { value: 'Koupě nemovitosti', label: 'Koupě nemovitosti' },
  { value: 'Refinancování', label: 'Refinancování' },
  { value: 'Výstavba', label: 'Výstavba' },
  { value: 'Rekonstrukce', label: 'Rekonstrukce' },
  { value: 'Jiné', label: 'Jiné' },
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
function Req() { return <span style={REQ}>*</span> }

const G2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const G3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const G4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }

// ── Lokalita summary ───────────────────────────────────────────────────────────

function LokalitaSummary({ kraj, okres, mesto, ucelUveru, onEdit }: {
  kraj: string; okres: string; mesto: string; ucelUveru: string; onEdit: () => void
}) {
  const lokalitaParts = [kraj, okres, mesto].filter(Boolean)
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
        <MapPin size={20} style={{ color: 'var(--t-textMyDOCKPrimary)' }} strokeWidth={1.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
          {lokalitaParts.join(' · ') || '—'}
        </span>
        <span style={{ fontSize: 13, color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {ucelUveru || '—'}
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

export default function LeadHypoPanel({ onClose }: Props) {
  const [showDiscard, setShowDiscard] = useState(false)
  const [klientModalOpen, setKlientModalOpen] = useState(false)

  // Step tracking
  const [stepConfirmed, setStepConfirmed] = useState(false)
  const [editingStep, setEditingStep] = useState(false)

  // Lokalita
  const [kraj, setKraj] = useState('')
  const [okres, setOkres] = useState('')
  const [mesto, setMesto] = useState('')
  const [mestskyObvod, setMestskyObvod] = useState('')
  const [mestskaCast, setMestskaCast] = useState('')
  const [ulice, setUlice] = useState('')

  // Parametry hypotéky
  const [ucelUveru, setUcelUveru] = useState('')

  // Klient
  const [telefon, setTelefon] = useState('+420')
  const [email, setEmail] = useState('')
  const [jmeno, setJmeno] = useState('')
  const [prijmeni, setPrijmeni] = useState('')
  const [nazevSpolecnosti, setNazevSpolecnosti] = useState('')
  const [icSpolecnosti, setIcSpolecnosti] = useState('')
  const [pozice, setPozice] = useState('')
  const [zdroj, setZdroj] = useState('')
  const [typKomunikace, setTypKomunikace] = useState('Telefon')
  const [poznamka, setPoznamka] = useState('')
  const [pobocka, setPobocka] = useState(POBOCKY_OPT[0]?.value ?? '')
  const [makler, setMakler] = useState(MAKLERI_OPT[0]?.value ?? '')

  const okresOpt = kraj && OKRESY_OPT[kraj] ? OKRESY_OPT[kraj] : []

  const showStepForm = !stepConfirmed || editingStep
  const step2Done = stepConfirmed && !editingStep
  const canConfirmStep = kraj !== '' && ucelUveru !== ''

  function handleClose() {
    setShowDiscard(true)
  }

  function handleConfirmStep() {
    setStepConfirmed(true)
    setEditingStep(false)
  }

  function handleEditStep() {
    setEditingStep(true)
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
          footer={{
            actions: [
              { label: 'Zrušit', variant: 'outlined', onClick: handleClose },
              { label: 'Vytvořit lead Hypo', variant: 'primary', disabled: !step2Done, onClick: onClose },
            ],
          }}
        >
          <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: 24, background: 'var(--t-bgSecondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)', fontFamily: 'Inter' }}>Vytvořit lead Hypo</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={handleClose} />
          </div>
          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Lokalita + Parametry hypotéky */}
            <div style={WIDGET}>
              <span style={HEADING}>Parametry hypotéky</span>

              {/* Summary after confirming */}
              {step2Done && (
                <LokalitaSummary
                  kraj={kraj}
                  okres={okres}
                  mesto={mesto}
                  ucelUveru={ucelUveru}
                  onEdit={handleEditStep}
                />
              )}

              {/* Form */}
              {showStepForm && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={HEADING}>Vyberte lokalitu <Req /></span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 12 }}>
                      <Select
                        label="Kraj"
                        required
                        placeholder="Kraj"
                        options={KRAJE_OPT}
                        value={kraj}
                        onChange={v => { setKraj(v); setOkres(''); setMesto('') }}
                        width="100%"
                      />
                      <Select
                        label="Okres"
                        placeholder="Okres"
                        options={okresOpt}
                        value={okres}
                        onChange={v => { setOkres(v); setMesto('') }}
                        disabled={!kraj}
                        width="100%"
                      />
                      <Input label="Město" placeholder="Město" value={mesto} onChange={setMesto} disabled={!okres} width="100%" />
                      <Input label="Městský obvod" placeholder="Městský obvod" value={mestskyObvod} onChange={setMestskyObvod} disabled={!mesto} width="100%" />
                      <Input label="Městská část" placeholder="Městská část" value={mestskaCast} onChange={setMestskaCast} disabled={!mesto} width="100%" />
                      <Input label="Ulice" placeholder="Ulice" value={ulice} onChange={setUlice} disabled={!mesto} width="100%" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={HEADING}>Účel úvěru <Req /></span>
                    <div style={G2}>
                      <Select label="Účel úvěru" required options={UCEL_UVERU_OPT} value={ucelUveru} onChange={setUcelUveru} width="100%" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      label="Potvrdit"
                      variant="primary"
                      disabled={!canConfirmStep}
                      onClick={handleConfirmStep}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Klient + další sekce — jen po potvrzení */}
            {step2Done && (
              <>
                <div style={WIDGET}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <span style={HEADING}>Údaje o klientovi</span>
                    <TextButton label="Vyhledat klienta" variant="brand" leadIcon={SearchIcon} onClick={() => setKlientModalOpen(true)} />
                  </div>
                  <div style={G4}>
                    <Input label="Telefon" value={telefon} onChange={setTelefon} width="100%" />
                    <Input label="E-mail" required value={email} onChange={setEmail} width="100%" />
                    <Input label="Jméno" required value={jmeno} onChange={setJmeno} width="100%" />
                    <Input label="Příjmení" required value={prijmeni} onChange={setPrijmeni} width="100%" />
                  </div>
                  <div style={G3}>
                    <Input label="Název společnosti" value={nazevSpolecnosti} onChange={setNazevSpolecnosti} width="100%" />
                    <Input label="IČ společnosti" value={icSpolecnosti} onChange={setIcSpolecnosti} width="100%" />
                    <Input label="Pozice zastupující osoby" value={pozice} onChange={setPozice} width="100%" />
                  </div>
                </div>

                <div style={WIDGET}>
                  <span style={HEADING}>Další údaje</span>
                  <div style={G2}>
                    <Select label="Zdroj" required options={ZDROJ_OPT} value={zdroj} onChange={setZdroj} width="100%" />
                    <Select label="Typ komunikace" required options={KOMUNIKACE_OPT} value={typKomunikace} onChange={setTypKomunikace} width="100%" />
                  </div>
                </div>

                <div style={WIDGET}>
                  <span style={HEADING}>Interní poznámka</span>
                  <TextArea placeholder="Zadejte doplňující informace k leadu" value={poznamka} onChange={setPoznamka} width="100%" minHeight={120} />
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
