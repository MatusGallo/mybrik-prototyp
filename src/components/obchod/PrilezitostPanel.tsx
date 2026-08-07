import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Search as SearchIcon, X, Pencil } from 'lucide-react'
import { Form, TextButton, Input, Select, TextArea, Search, TableHeaderCell, TableHeaderCellContent, TableCell, IconButton } from '@matusgallo/mysabds'
import SelectSearch from '../shared/SelectSearch'
import ConfirmDialog from '../shared/ConfirmDialog'
import KlientSearchModal from '../klienti/KlientSearchModal'
import TelefonInput from '../shared/TelefonInput'
import { VYCHOZI_PREDVOLBA } from '../../data/telefonPredvolby'
import { nabidkyData } from '../../data/mockData'
import type { Nabidka } from '../../data/mockData'
import { pobockyData, uzivateleData } from '../../data/mockOstatni'
import type { KlientData } from '../klienti/KlientPanel'

// ── Constants ──────────────────────────────────────────────────────────────────

const PHOTO_SEEDS = [
  'house1', 'realestate2', 'property3', 'villa4', 'apartment5',
  'home6', 'building7', 'residence8', 'estate9', 'flat10',
  'house11', 'condo12', 'mansion13', 'cottage14', 'loft15',
  'penthouse16', 'duplex17', 'townhouse18', 'bungalow19', 'studio20',
]

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

function formatCena(cena: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(cena)
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

const G2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const G3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const G4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }

// ── Property table ─────────────────────────────────────────────────────────────

const NABIDKA_MIN_WIDTH = 320
const CENA_WIDTH = 160
const AKCE_WIDTH = 110

function PropertyTableHeader({ showAction }: { showAction?: boolean }) {
  return (
    <div style={{ display: 'flex', height: 40 }}>
      <div style={{ display: 'flex', flex: 1, height: 40, background: 'var(--t-bgSecondary)' }}>
        <div style={{ pointerEvents: 'none' }}><TableHeaderCell label="ID" width={72} /></div>
        <div style={{ flex: 1, minWidth: NABIDKA_MIN_WIDTH, pointerEvents: 'none' }}>
          <TableHeaderCell label="Nabídka" width="100%" />
        </div>
        <div style={{ height: 40, width: CENA_WIDTH, background: 'var(--t-bgSecondary)', display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', flexShrink: 0, boxSizing: 'border-box', pointerEvents: 'none' }}>
          <div style={{ height: 24, paddingLeft: 16, paddingRight: 16, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <TableHeaderCellContent label="Cena" />
          </div>
        </div>
      </div>
      {showAction && <div style={{ width: AKCE_WIDTH, height: 40, background: 'var(--t-bgSecondary)', flexShrink: 0 }} />}
    </div>
  )
}

function PropertyRow({ row, idx, onSelect, isLast, showAction }: {
  row: Nabidka; idx: number; onSelect?: () => void; isLast?: boolean; showAction?: boolean
}) {
  const photoSeed = PHOTO_SEEDS[idx % PHOTO_SEEDS.length]
  const border = isLast ? undefined : '1px solid var(--t-borderPrimary)'
  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      {/* ID — no hover */}
      <div style={{ pointerEvents: 'none' }}>
        <TableCell size="spacious" width={72} borderBottom={!isLast} label={String(row.id)} />
      </div>

      {/* Nabídka */}
      <div style={{ flex: 1, minWidth: NABIDKA_MIN_WIDTH, background: 'var(--t-bgPrimary)', borderBottom: border, display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 16, gap: 12, boxSizing: 'border-box', overflow: 'hidden' }}>
        <img src={`https://picsum.photos/seed/${photoSeed}/52/36`} alt="" style={{ width: 52, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.nazev}
          </span>
          <span style={{ fontSize: 13, color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.adresa}
          </span>
        </div>
      </div>

      {/* Cena — no hover */}
      <div style={{ pointerEvents: 'none' }}>
        <TableCell size="spacious" width={CENA_WIDTH} borderBottom={!isLast} label={formatCena(row.cena)} align="right" />
      </div>

      {/* Akce */}
      {showAction && (
        <div style={{ width: AKCE_WIDTH, flexShrink: 0, background: 'var(--t-bgPrimary)', borderBottom: border, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
          <TextButton label="Vybrat" variant="brand" onClick={onSelect} />
        </div>
      )}
    </div>
  )
}

// ── Panel ──────────────────────────────────────────────────────────────────────

/** Výchozí hodnoty pro úpravu existující příležitosti. */
export interface PrilezitostInitial {
  telefon?: string
  email?: string
  jmeno?: string
  prijmeni?: string
  pobocka?: string
  makler?: string
}

interface Props {
  onClose: () => void
  /** Předvybraná nemovitost - příležitost zakládaná z detailu nabídky. */
  nabidka?: Nabidka
  /** S výchozími hodnotami panel příležitost upravuje, bez nich zakládá novou. */
  initial?: PrilezitostInitial
}

export default function PrilezitostPanel({ onClose, nabidka, initial }: Props) {
  const jeUprava = !!initial

  const [showDiscard, setShowDiscard] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Nabidka | null>(nabidka ?? null)
  const [isChanging, setIsChanging] = useState(false)
  const [klientModalOpen, setKlientModalOpen] = useState(false)

  const [telefon, setTelefon] = useState(initial?.telefon || VYCHOZI_PREDVOLBA)
  const [email, setEmail] = useState(initial?.email ?? '')
  const [jmeno, setJmeno] = useState(initial?.jmeno ?? '')
  const [prijmeni, setPrijmeni] = useState(initial?.prijmeni ?? '')
  const [nazevSpolecnosti, setNazevSpolecnosti] = useState('')
  const [icSpolecnosti, setIcSpolecnosti] = useState('')
  const [pozice, setPozice] = useState('')
  const [uver, setUver] = useState('Ne')
  const [zdroj, setZdroj] = useState('')
  const [typKomunikace, setTypKomunikace] = useState('Telefon')
  const [poznamka, setPoznamka] = useState('')
  // Pobočku a makléře předvyplníme jen tehdy, když hodnota ze záznamu existuje
  // v nabídce možností - jinak by Select zůstal prázdný.
  const [pobocka, setPobocka] = useState(
    POBOCKY_OPT.some(o => o.value === initial?.pobocka) ? initial!.pobocka! : POBOCKY_OPT[0]?.value ?? ''
  )
  const [makler, setMakler] = useState(
    MAKLERI_OPT.some(o => o.value === initial?.makler) ? initial!.makler! : MAKLERI_OPT[0]?.value ?? ''
  )

  const step1Done = selected !== null

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

  const filtered = nabidkyData
    .filter(n =>
      !search ||
      n.nazev.toLowerCase().includes(search.toLowerCase()) ||
      n.adresa.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 15)

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
              {
                label: jeUprava ? 'Uložit změny' : 'Vytvořit příležitost',
                variant: 'primary', disabled: !step1Done, onClick: onClose,
              },
            ],
          }}
        >
          <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: 24, background: 'var(--t-bgSecondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)', fontFamily: 'Inter' }}>
              {jeUprava ? 'Upravit příležitost' : 'Vytvořit příležitost'}
            </span>
            <IconButton icon={X} variant="ghost" size="md" onClick={handleClose} />
          </div>
          <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Najít nemovitost */}
            <div style={{ ...WIDGET, paddingBottom: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <span style={HEADING}>Výběr nemovitosti</span>
                {selected && !isChanging ? (
                  <TextButton label="Změnit" variant="brand" leadIcon={Pencil} onClick={() => setIsChanging(true)} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Search value={search} onChange={setSearch} placeholder="Hledat nemovitost..." size="sm" width={300} />
                    {isChanging && (
                      <>
                        <div style={{ width: 1, height: 14, background: 'var(--t-borderPrimary)', flexShrink: 0 }} />
                        <TextButton label="Zrušit" variant="neutral" leadIcon={X} onClick={() => setIsChanging(false)} />
                      </>
                    )}
                  </div>
                )}
              </div>
              {selected && !isChanging ? (
                <div style={{ overflowX: 'auto', margin: '0 -16px' }}>
                  <div style={{ minWidth: 72 + NABIDKA_MIN_WIDTH + CENA_WIDTH }}>
                    <PropertyTableHeader />
                    <PropertyRow row={selected} idx={0} isLast />
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', margin: '0 -16px' }}>
                  <div style={{ minWidth: 72 + NABIDKA_MIN_WIDTH + CENA_WIDTH + AKCE_WIDTH }}>
                    <PropertyTableHeader showAction />
                    {filtered.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--t-textSecondary)', padding: '20px 0', fontSize: 14, margin: 0 }}>
                        Žádné nemovitosti neodpovídají hledání
                      </p>
                    ) : filtered.map((row, idx) => (
                      <PropertyRow key={row.id} row={row} idx={idx} onSelect={() => { setSelected(row); setIsChanging(false) }} isLast={idx === filtered.length - 1} showAction />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Client & form — only after property selected */}
            {step1Done && (
              <>
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
                  <TextArea placeholder="Zadejte doplňující informace k příležitosti" value={poznamka} onChange={setPoznamka} width="100%" minHeight={120} />
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
