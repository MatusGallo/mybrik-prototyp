import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Search as SearchIcon, X } from 'lucide-react'
import { Form, TextButton, Input, Select, TextArea, IconButton } from '@matusgallo/mysabds'
import SelectSearch from '../shared/SelectSearch'
import ConfirmDialog from '../shared/ConfirmDialog'
import KlientSearchModal from '../klienti/KlientSearchModal'
import TelefonInput from '../shared/TelefonInput'
import { VYCHOZI_PREDVOLBA } from '../../data/telefonPredvolby'
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

const G2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const G3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const G4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }

// ── Panel ──────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export default function NovyKlientPoptavkyPanel({ onClose }: Props) {
  const [showDiscard, setShowDiscard] = useState(false)
  const [klientModalOpen, setKlientModalOpen] = useState(false)

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
              { label: 'Vytvořit klienta', variant: 'primary', onClick: onClose },
            ],
          }}
        >
          <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: 24, background: 'var(--t-bgSecondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)', fontFamily: 'Inter' }}>Nový klient</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={handleClose} />
          </div>
          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={WIDGET}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <span style={HEADING}>Údaje o klientovi</span>
                <TextButton label="Vyhledat klienta" variant="brand" leadIcon={SearchIcon} onClick={() => setKlientModalOpen(true)} />
              </div>
              <div style={G4}>
                <TelefonInput value={telefon} onChange={setTelefon} />
                <Input label="E-mail" required value={email} onChange={setEmail} width="100%" />
                <Input label="Jméno" required value={jmeno} onChange={setJmeno} width="100%" />
                <Input label="Příjmení" required value={prijmeni} onChange={setPrijmeni} width="100%" />
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
                <Select label="Zdroj" required options={ZDROJ_OPT} value={zdroj} onChange={setZdroj} width="100%" />
                <Select label="Typ komunikace" required options={KOMUNIKACE_OPT} value={typKomunikace} onChange={setTypKomunikace} width="100%" />
              </div>
            </div>

            <div style={WIDGET}>
              <span style={HEADING}>Interní poznámka</span>
              <TextArea placeholder="Zadejte doplňující informace ke klientovi" value={poznamka} onChange={setPoznamka} width="100%" minHeight={120} />
            </div>

            <div style={WIDGET}>
              <span style={HEADING}>Přidělit záznam</span>
              <div style={G2}>
                <SelectSearch label="Pobočka" required options={POBOCKY_OPT} value={pobocka} onChange={setPobocka} width="100%" />
                <SelectSearch label="Makléř" required options={MAKLERI_OPT} value={makler} onChange={setMakler} width="100%" />
              </div>
            </div>

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
