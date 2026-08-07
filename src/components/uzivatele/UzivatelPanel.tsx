import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Form, Input, TextArea, Select, CheckboxItem, Radio, Tag, Toggle, IconButton,
} from '@matusgallo/mysabds'
import { X } from 'lucide-react'
import ConfirmDialog from '../shared/ConfirmDialog'
import TelefonInput from '../shared/TelefonInput'
import { VYCHOZI_PREDVOLBA } from '../../data/telefonPredvolby'

export type UzivatelPanelMode = 'detail' | 'edit'

export interface UzivatelData {
  id: number
  titulPred: string
  jmeno: string
  prijmeni: string
  telefon: string
  osobniEmail: string
  firemnEmail: string
  hsp: string
  pobocka: string
  role: string
  stav: string
  pripravnyKurz: string
  zkouskaRZ: string
  datumSplneniZkousky: string
  pojisteni: string
  pojisteniExpirace: string
  datumVytvoreni: string
  datumPosledniZmeny: string
}

interface Props {
  mode: UzivatelPanelMode
  uzivatel?: UzivatelData
  onClose: () => void
  onEdit?: () => void
}

// ── Styles ────────────────────────────────────────────────────────────────────

const WIDGET: React.CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const HEADING: React.CSSProperties = {
  fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)', lineHeight: '32px', height: 32,
}

const G2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }
const G3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
const G4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }

const STAV_OPT: { value: string; label: string }[] = [
  { value: 'Aktivní', label: 'Aktivní' },
  { value: 'Pozvánka odeslána', label: 'Pozvánka odeslána' },
  { value: 'Neaktivní', label: 'Neaktivní' },
  { value: 'Blokován', label: 'Blokován' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: 28 }}>
      <span style={{ width: 200, flexShrink: 0, fontSize: 14, color: 'var(--t-textSecondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-textPrimary)' }}>{value || '–'}</span>
    </div>
  )
}

function BadgeRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: 28 }}>
      <span style={{ width: 200, flexShrink: 0, fontSize: 14, color: 'var(--t-textSecondary)' }}>{label}</span>
      <Tag
        label={value || '–'}
        variant={value === 'Aktivní' || value === 'Ano' ? 'success' : 'neutral'}
        size="sm"
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UzivatelPanel({ mode, uzivatel, onClose, onEdit }: Props) {
  const isDetail = mode === 'detail'

  const [showDiscard, setShowDiscard] = useState(false)

  function handleClose() {
    if (!isDetail) {
      setShowDiscard(true)
    } else {
      onClose()
    }
  }

  const [typOsoby, setTypOsoby] = useState<'fyzicka' | 'pravnicka'>('fyzicka')
  const [hpp, setHpp] = useState(false)
  const [neplatkeDph, setNeplatkeDph] = useState(true)
  const [platkeDph, setPlatkeDph] = useState(false)
  const [zobrazovat, setZobrazovat] = useState(false)

  const [jmeno, setJmeno] = useState(uzivatel?.jmeno ?? '')
  const [prijmeni, setPrijmeni] = useState(uzivatel?.prijmeni ?? '')
  const [osobniEmail, setOsobniEmail] = useState(uzivatel?.osobniEmail ?? '')
  const [telefon, setTelefon] = useState(uzivatel?.telefon ?? VYCHOZI_PREDVOLBA)
  const [firemnEmail, setFiremnEmail] = useState(uzivatel?.firemnEmail ?? '')
  const [stav, setStav] = useState(uzivatel?.stav ?? 'Aktivní')
  const [pripravnyKurz, setPripravnyKurz] = useState(uzivatel?.pripravnyKurz === 'Ano')
  const [zkouskaRZ, setZkouskaRZ] = useState(uzivatel?.zkouskaRZ === 'Ano')
  const [pojisteni, setPojisteni] = useState(uzivatel?.pojisteni === 'Ano')

  const [nSrealityEmail, setNSrealityEmail] = useState(true)
  const [nSrealitySms, setNSrealitySms] = useState(true)
  const [nIdnesEmail, setNIdnesEmail] = useState(true)
  const [nIdnesSms, setNIdnesSms] = useState(true)
  const [nWebEmail, setNWebEmail] = useState(true)
  const [nWebSms, setNWebSms] = useState(true)

  useEffect(() => {
    setJmeno(uzivatel?.jmeno ?? '')
    setPrijmeni(uzivatel?.prijmeni ?? '')
    setOsobniEmail(uzivatel?.osobniEmail ?? '')
    setTelefon(uzivatel?.telefon ?? VYCHOZI_PREDVOLBA)
    setFiremnEmail(uzivatel?.firemnEmail ?? '')
    setStav(uzivatel?.stav ?? 'Aktivní')
    setPripravnyKurz(uzivatel?.pripravnyKurz === 'Ano')
    setZkouskaRZ(uzivatel?.zkouskaRZ === 'Ano')
    setPojisteni(uzivatel?.pojisteni === 'Ano')
  }, [uzivatel])

  // ── Detail content ──────────────────────────────────────────────────────────

  const detailContent = (
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
      <div style={WIDGET}>
        <span style={HEADING}>Základní údaje</span>
        <InfoRow label="Titul před jménem" value={uzivatel?.titulPred} />
        <InfoRow label="Jméno" value={uzivatel?.jmeno} />
        <InfoRow label="Příjmení" value={uzivatel?.prijmeni} />
        <InfoRow label="Telefon" value={uzivatel?.telefon} />
        <InfoRow label="Osobní e-mail" value={uzivatel?.osobniEmail} />
        <InfoRow label="Firemní e-mail" value={uzivatel?.firemnEmail} />
      </div>

      <div style={WIDGET}>
        <span style={HEADING}>Pozice</span>
        <InfoRow label="Pobočka" value={uzivatel?.pobocka} />
        <InfoRow label="Role" value={uzivatel?.role} />
        <InfoRow label="HSP" value={uzivatel?.hsp} />
      </div>

      <div style={WIDGET}>
        <span style={HEADING}>Certifikace</span>
        <BadgeRow label="Přípravný kurz" value={uzivatel?.pripravnyKurz} />
        <BadgeRow label="Zkouška RŽ" value={uzivatel?.zkouskaRZ} />
        <InfoRow label="Datum splnění zkoušky" value={uzivatel?.datumSplneniZkousky} />
        <BadgeRow label="Pojištění" value={uzivatel?.pojisteni} />
        <InfoRow label="Expirace pojištění" value={uzivatel?.pojisteniExpirace} />
      </div>

      <div style={WIDGET}>
        <span style={HEADING}>Stav</span>
        <BadgeRow label="Stav" value={uzivatel?.stav} />
      </div>

      <div style={WIDGET}>
        <span style={HEADING}>Systém</span>
        <InfoRow label="Datum vytvoření" value={uzivatel?.datumVytvoreni} />
        <InfoRow label="Datum poslední změny" value={uzivatel?.datumPosledniZmeny} />
      </div>
    </div>
  )

  // ── Edit content ────────────────────────────────────────────────────────────

  const editContent = (
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>

      {/* Typ osoby */}
      <div style={WIDGET}>
        <span style={HEADING}>Typ osoby *</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: typOsoby === 'fyzicka' ? 600 : 400, color: typOsoby === 'fyzicka' ? 'var(--t-textPrimary)' : 'var(--t-textSecondary)' }}>
            Fyzická osoba
          </span>
          <Toggle
            checked={typOsoby === 'pravnicka'}
            onChange={(v: boolean) => setTypOsoby(v ? 'pravnicka' : 'fyzicka')}
          />
          <span style={{ fontSize: 14, fontWeight: typOsoby === 'pravnicka' ? 600 : 400, color: typOsoby === 'pravnicka' ? 'var(--t-textPrimary)' : 'var(--t-textSecondary)' }}>
            Právnická osoba
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <CheckboxItem label="Uživatel má HPP" checked={hpp} onChange={setHpp} />
          <CheckboxItem label="Neplátce DPH" checked={neplatkeDph} onChange={setNeplatkeDph} />
          <CheckboxItem label="Plátce DPH" checked={platkeDph} onChange={setPlatkeDph} />
        </div>
      </div>

      {/* Přihlašovací údaje */}
      <div style={WIDGET}>
        <span style={HEADING}>Přihlašovací údaje *</span>
        <div style={{ width: '50%' }}>
          <Input label="Firemní e-mail" required value={firemnEmail} onChange={setFiremnEmail} width="100%" />
        </div>
        <div style={G2}>
          <Input label="Heslo" placeholder="Heslo" width="100%" />
          <Input label="Heslo znova" placeholder="Heslo znova" width="100%" />
        </div>
      </div>

      {/* Základní údaje */}
      <div style={WIDGET}>
        <span style={HEADING}>Základní údaje *</span>
        <div style={G4}>
          <Input label="Jméno" required value={jmeno} onChange={setJmeno} width="100%" />
          <Input label="Příjmení" required value={prijmeni} onChange={setPrijmeni} width="100%" />
          <Input label="Titul před jménem" placeholder="Titul před jménem" width="100%" />
          <Input label="Titul za jménem" placeholder="Titul za jménem" width="100%" />
        </div>
        <div style={G2}>
          <Input label="Osobní e-mail" required value={osobniEmail} onChange={setOsobniEmail} width="100%" />
          <TelefonInput required value={telefon} onChange={setTelefon} />
        </div>
        <div style={G3}>
          <Input label="Datum narození" required placeholder="DD/MM/RRRR" width="100%" />
          <Input label="Rodné číslo" required placeholder="XXXXXX/XXXX" width="100%" />
          <Input label="Číslo občanského průkazu" required width="100%" />
        </div>
      </div>

      {/* Trvalé bydliště */}
      <div style={WIDGET}>
        <span style={HEADING}>Trvalé bydliště *</span>
        <div style={G3}>
          <Input label="Ulice" required width="100%" />
          <Input label="Č.p." required width="100%" />
          <Input label="Č.o." width="100%" />
        </div>
        <div style={G2}>
          <Input label="Město" required width="100%" />
          <Input label="PSČ" required width="100%" />
        </div>
      </div>

      {/* Fakturační údaje neplátce DPH */}
      {neplatkeDph && (
        <div style={WIDGET}>
          <span style={HEADING}>Fakturační údaje neplátce DPH *</span>
          <div style={G3}>
            <Input label="Obchodní název" required width="100%" />
            <Input label="IČ" required width="100%" />
            <Input label="DIČ" width="100%" />
          </div>
          <div style={G3}>
            <Input label="Ulice" required width="100%" />
            <Input label="Č.p." required width="100%" />
            <Input label="Č.o." width="100%" />
          </div>
          <div style={G2}>
            <Input label="Město" required width="100%" />
            <Input label="PSČ" required width="100%" />
          </div>
          <div style={G3}>
            <Input label="Předčíslí účtu" width="100%" />
            <Input label="Číslo účtu" width="100%" />
            <Input label="Kód banky" width="100%" />
          </div>
        </div>
      )}

      {/* Pozice */}
      <div style={WIDGET}>
        <span style={HEADING}>Pozice *</span>
        <div style={G2}>
          <Select label="Nadřízený" required options={[]} width="100%" />
          <Input label="Provize" placeholder="0" width="100%" />
        </div>
        <CheckboxItem label="Zobrazovat na webu" checked={zobrazovat} onChange={setZobrazovat} />
      </div>

      {/* Hlavní pozice */}
      <div style={WIDGET}>
        <span style={HEADING}>Hlavní pozice</span>
        <div style={G3}>
          <Select
            label="Pobočka"
            required
            options={uzivatel?.pobocka ? [{ value: uzivatel.pobocka, label: uzivatel.pobocka }] : []}
            value={uzivatel?.pobocka}
            width="100%"
          />
          <Select label="Pozice" required options={[{ value: 'Expert I', label: 'Expert I' }]} width="100%" />
          <Select
            label="Role"
            required
            options={uzivatel?.role ? [{ value: uzivatel.role, label: uzivatel.role }] : []}
            value={uzivatel?.role}
            width="100%"
          />
        </div>
      </div>

      {/* Medailonek */}
      <div style={WIDGET}>
        <span style={HEADING}>Medailonek</span>
        <TextArea placeholder="" minHeight={120} width="100%" />
      </div>

      {/* Ostatní údaje */}
      <div style={WIDGET}>
        <span style={HEADING}>Ostatní údaje</span>
        <CheckboxItem label="Přípravný kurz" checked={pripravnyKurz} onChange={setPripravnyKurz} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          <div style={{ minWidth: 220 }}>
            <CheckboxItem label="Zkouška Realitní zprost." checked={zkouskaRZ} onChange={setZkouskaRZ} />
          </div>
          {zkouskaRZ && <Input label="Datum splnění zkoušky" required placeholder="DD/MM/RRRR" width="100%" />}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          <div style={{ minWidth: 220 }}>
            <CheckboxItem label="Pojištění" checked={pojisteni} onChange={setPojisteni} />
          </div>
          {pojisteni && <Input label="Pojištění expirace" required placeholder="DD/MM/RRRR" width="100%" />}
        </div>
      </div>

      {/* Nastavení exportu */}
      <div style={WIDGET}>
        <span style={HEADING}>Nastavení exportu</span>
        <p style={{ fontSize: 13, color: 'var(--t-textSecondary)', margin: 0, lineHeight: '18px' }}>
          Pokud je top nastaven na 0 nebo je prázdný, tak nelze topovat.
        </p>
        <div style={{ width: '25%' }}>
          <Input label="Počet topování" placeholder="1" width="100%" />
        </div>
      </div>

      {/* Notifikace */}
      <div style={WIDGET}>
        <span style={HEADING}>Notifikace</span>
        <div style={{ ...G2, gap: 16 }}>
          {([
            ['Sreality na e-mail',         nSrealityEmail, setNSrealityEmail],
            ['Sreality pomocí SMS',         nSrealitySms,   setNSrealitySms],
            ['Reality IDNES.cz na e-mail',  nIdnesEmail,    setNIdnesEmail],
            ['Reality IDNES.cz pomocí SMS', nIdnesSms,      setNIdnesSms],
            ['Osobního webu na e-mail',     nWebEmail,      setNWebEmail],
            ['Osobního webu pomocí SMS',    nWebSms,        setNWebSms],
          ] as [string, boolean, (v: boolean) => void][]).map(([label, val, set]) => (
            <div key={label}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)', marginBottom: 8 }}>{label}</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }} onClick={() => set(true)}>
                  <Radio checked={val}  onChange={() => set(true)} />
                  <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>Ano</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }} onClick={() => set(false)}>
                  <Radio checked={!val} onChange={() => set(false)} />
                  <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>Ne</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stav */}
      <div style={WIDGET}>
        <span style={HEADING}>Stav</span>
        <div style={{ width: '25%' }}>
          <Select label="Stav" options={STAV_OPT} value={stav} onChange={setStav} width="100%" />
        </div>
      </div>

    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {!isDetail && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={handleClose}
        />,
        document.body
      )}

      <div style={{
        position: 'fixed', right: 0, top: 56, bottom: 0, width: 800, zIndex: 100,
        boxShadow: '-2px 0 4px -2px #0a0d120f, -4px 0 6px -1px #0a0d121a',
        clipPath: 'inset(0 0 0 -20px)',
      }}>
        <Form
          width={800 as never}
          minHeight={0}
          footer={{
            actions: isDetail
              ? [
                  { label: 'Zavřít', variant: 'outlined', onClick: onClose },
                  { label: 'Upravit uživatele', variant: 'outlined', onClick: onEdit },
                ]
              : [
                  { label: 'Zrušit', variant: 'outlined', onClick: handleClose },
                  { label: 'Uložit', variant: 'primary', onClick: onClose },
                ],
          }}
        >
          <>
            <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: 24, background: 'var(--t-bgSecondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {uzivatel && <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textSecondary)', fontFamily: 'Inter' }}>ID {uzivatel.id}</span>}
                <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)', fontFamily: 'Inter' }}>
                  {isDetail
                    ? `${uzivatel?.jmeno ?? ''} ${uzivatel?.prijmeni ?? ''}`.trim() || '–'
                    : `Editace uživatele (ID ${uzivatel?.id ?? ''})`}
                </span>
              </div>
              <IconButton icon={X} variant="ghost" size="md" onClick={handleClose} />
            </div>
            {isDetail ? detailContent : editContent}
          </>
        </Form>
      </div>

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
