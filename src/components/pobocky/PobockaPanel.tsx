import { useState, useEffect } from 'react'
import { CloudUpload, X } from 'lucide-react'
import { Form, Input, TextArea, Select, ToggleItem, IconButton } from '@matusgallo/mysabds'
import { hspData, pobockyData } from '../../data/mockOstatni'
import TelefonInput from '../shared/TelefonInput'
import { VYCHOZI_PREDVOLBA } from '../../data/telefonPredvolby'

export type PobockaPanelMode = 'detail' | 'edit' | 'create'

export interface PobockaData {
  id: number
  nazev: string
  oficialniNazev: string
  adresa: string
  oteviraci: string
  telefon: string
  email: string
  hsp: string
  odpovednaOsoba: string
  stav: string
  zobrazitNaWebu: boolean
  popis: string
  sreality_id: string; sreality_hash: string; sreality_klic: string; sreality_idMaklere: string
  realityMix_id: string; realityMix_heslo: string; realityMix_klic: string
  bazos_jmeno: string; bazos_heslo: string
  realingo_id: string; realingo_heslo: string; realingo_klic: string
  idnes_jmenoApi: string; idnes_hesloApi: string; idnes_jmenoFtp: string; idnes_hesloFtp: string
  ceskeReality_id: string; ceskeReality_heslo: string; ceskeReality_idFirmy: string
  eurobydleni_id: string; eurobydleni_heslo: string; eurobydleni_klic: string
  b3_id: string; b3_hash: string; b3_klic: string; b3_idMaklere: string
  osobniWeb_jmeno: string; osobniWeb_heslo: string
}

interface PobockaPanelProps {
  mode: PobockaPanelMode
  pobocka?: PobockaData
  onClose: () => void
  onEdit?: () => void
  onSave?: (data: Partial<PobockaData>) => void
}

const EMPTY: Partial<PobockaData> = {
  nazev: '', oficialniNazev: '', adresa: '', oteviraci: '', telefon: VYCHOZI_PREDVOLBA, email: '', hsp: '',
  odpovednaOsoba: '', stav: 'Připravuje se', zobrazitNaWebu: false, popis: '',
  sreality_id: '', sreality_hash: '', sreality_klic: '', sreality_idMaklere: '',
  realityMix_id: '', realityMix_heslo: '', realityMix_klic: '',
  bazos_jmeno: '', bazos_heslo: '',
  realingo_id: '', realingo_heslo: '', realingo_klic: '',
  idnes_jmenoApi: '', idnes_hesloApi: '', idnes_jmenoFtp: '', idnes_hesloFtp: '',
  ceskeReality_id: '', ceskeReality_heslo: '', ceskeReality_idFirmy: '',
  eurobydleni_id: '', eurobydleni_heslo: '', eurobydleni_klic: '',
  b3_id: '', b3_hash: '', b3_klic: '', b3_idMaklere: '',
  osobniWeb_jmeno: '', osobniWeb_heslo: '',
}

const HSP_OPTIONS = hspData.map(h => ({ value: h.nazev, label: h.nazev }))

const STAV_OPTIONS = ['Aktivní', 'Připravuje se', 'Neaktivní', 'Zrušena'].map(s => ({ value: s, label: s }))

const OSOBA_OPTIONS = [...new Set(pobockyData.map(p => p.odpovednaOsoba))]
  .sort((a, b) => a.localeCompare(b, 'cs'))
  .map(o => ({ value: o, label: o }))

// ── helpers ──────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 24, gap: 12 }}>
      <span style={{ fontSize: 14, color: 'var(--t-textSecondary)', flexShrink: 0, width: 180 }}>{label}</span>
      <span style={{ fontSize: 14, color: value ? 'var(--t-textPrimary)' : 'var(--t-textTertiary)' }}>
        {value || '–'}
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)', margin: '4px 0 0' }}>
      {children}
    </p>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)',
      borderRadius: 12, padding: 16, marginBottom: 12,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {children}
    </div>
  )
}

function CardTitle({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 32 }}>
      <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)' }}>{title}</span>
    </div>
  )
}

function ExportDivider() {
  return <div style={{ height: 1, background: 'var(--t-borderPrimary)', margin: '4px 0' }} />
}

function ExportSectionTitle({ children }: { children: string }) {
  return (
    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)' }}>{children}</span>
  )
}

function ExportSectionHeader({ label, active, onToggle }: { label: string; active: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onToggle(!active)}
    >
      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--t-textPrimary)' }}>{label}</span>
      <ToggleItem label="" checked={active} onChange={onToggle} />
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 12 }}>{children}</div>
}

function Dropzone() {
  return (
    <div style={{
      border: '1px dashed var(--t-borderPrimary)', borderRadius: 8,
      padding: '32px 16px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 8,
    }}>
      <CloudUpload size={24} style={{ color: 'var(--t-textSecondary)' }} />
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-textPrimary)' }}>
        Nahrát nebo to přetáhněte sem
      </span>
      <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>
        SVG, PNG, JPG or GIF (max. 25 MB)
      </span>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

type ExportKey = 'sreality' | 'realityMix' | 'bazos' | 'realingo' | 'idnes' | 'ceskeReality' | 'eurobydleni' | 'b3' | 'osobniWeb'

const EXPORT_KEYS: ExportKey[] = ['sreality', 'realityMix', 'bazos', 'realingo', 'idnes', 'ceskeReality', 'eurobydleni', 'b3', 'osobniWeb']

export default function PobockaPanel({ mode, pobocka, onClose, onEdit, onSave }: PobockaPanelProps) {
  const [form, setForm] = useState<Partial<PobockaData>>(pobocka ?? EMPTY)
  const [exportToggles, setExportToggles] = useState<Record<ExportKey, boolean>>(
    Object.fromEntries(EXPORT_KEYS.map(k => [k, false])) as Record<ExportKey, boolean>
  )

  function toggleExport(key: ExportKey, val: boolean) {
    setExportToggles(prev => ({ ...prev, [key]: val }))
  }

  useEffect(() => { setForm(pobocka ?? EMPTY) }, [pobocka])

  function set(field: keyof PobockaData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const isDetail = mode === 'detail'
  const isEdit   = mode === 'edit'
  const isCreate = mode === 'create'

  // ── detail body ─────────────────────────────────────────────────────────────

  const detailBody = (
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
      <Card>
        <CardTitle title="Základní informace" />
        <Row label="Název pobočky"   value={pobocka?.nazev} />
        <Row label="Officiální název" value={pobocka?.oficialniNazev} />
        <Row label="Adresa"          value={pobocka?.adresa} />
        <Row label="Otevírací doba"  value={pobocka?.oteviraci} />
        <Row label="Telefonní číslo" value={pobocka?.telefon} />
        <Row label="E-mail"          value={pobocka?.email} />
        <Row label="HSP"             value={pobocka?.hsp} />
        <Row label="Odpovědná osoba" value={pobocka?.odpovednaOsoba} />
        <Row label="Stav"            value={pobocka?.stav} />
        <Row label="Zobrazit na webu" value={pobocka?.zobrazitNaWebu ? 'Ano' : 'Ne'} />
      </Card>

      {pobocka?.popis && (
        <Card>
          <CardTitle title="Pobočka" />
          <SectionLabel>Popis pobočky</SectionLabel>
          <p style={{ fontSize: 14, color: 'var(--t-textPrimary)', margin: 0, lineHeight: '20px' }}>
            {pobocka.popis}
          </p>
        </Card>
      )}

      <Card>
        <CardTitle title="Nastavení exportu" />

        <ExportSectionTitle>Sreality</ExportSectionTitle>
        <Row label="ID pobočky"               value={pobocka?.sreality_id} />
        <Row label="Hash pro přihlášení"       value={pobocka?.sreality_hash} />
        <Row label="Klíč pro přihlášení"       value={pobocka?.sreality_klic} />
        <Row label="ID makléře (Callcentrum)"  value={pobocka?.sreality_idMaklere} />

        <ExportDivider />
        <ExportSectionTitle>Reality MIX</ExportSectionTitle>
        <Row label="ID na realtymix"     value={pobocka?.realityMix_id} />
        <Row label="Přihlašovací heslo"  value={pobocka?.realityMix_heslo} />
        <Row label="Klíč"                value={pobocka?.realityMix_klic} />

        <ExportDivider />
        <ExportSectionTitle>Bazoš.cz</ExportSectionTitle>
        <Row label="Přihlašovací jméno" value={pobocka?.bazos_jmeno} />
        <Row label="Přihlašovací heslo" value={pobocka?.bazos_heslo} />

        <ExportDivider />
        <ExportSectionTitle>Realingo</ExportSectionTitle>
        <Row label="ID na realingo"      value={pobocka?.realingo_id} />
        <Row label="Přihlašovací heslo"  value={pobocka?.realingo_heslo} />
        <Row label="Klíč"                value={pobocka?.realingo_klic} />

        <ExportDivider />
        <ExportSectionTitle>Idnes</ExportSectionTitle>
        <Row label="Přihl. jméno k API"  value={pobocka?.idnes_jmenoApi} />
        <Row label="Přihl. heslo k API"  value={pobocka?.idnes_hesloApi} />
        <Row label="Přihl. jméno k FTP"  value={pobocka?.idnes_jmenoFtp} />
        <Row label="Přihl. heslo k FTP"  value={pobocka?.idnes_hesloFtp} />

        <ExportDivider />
        <ExportSectionTitle>České reality</ExportSectionTitle>
        <Row label="ID na ceskychrealtach" value={pobocka?.ceskeReality_id} />
        <Row label="Heslo"                 value={pobocka?.ceskeReality_heslo} />
        <Row label="ID firmy"              value={pobocka?.ceskeReality_idFirmy} />

        <ExportDivider />
        <ExportSectionTitle>Eurobydlení</ExportSectionTitle>
        <Row label="ID na eurobydlení"   value={pobocka?.eurobydleni_id} />
        <Row label="Přihlašovací heslo"  value={pobocka?.eurobydleni_heslo} />
        <Row label="Klíč"                value={pobocka?.eurobydleni_klic} />

        <ExportDivider />
        <ExportSectionTitle>B3 technology</ExportSectionTitle>
        <Row label="ID pobočky"               value={pobocka?.b3_id} />
        <Row label="Hash pro přihlášení"       value={pobocka?.b3_hash} />
        <Row label="Klíč pro přihlášení"       value={pobocka?.b3_klic} />
        <Row label="ID makléře (Callcentrum)"  value={pobocka?.b3_idMaklere} />

        <ExportDivider />
        <ExportSectionTitle>Osobní web</ExportSectionTitle>
        <Row label="Přihlašovací jméno" value={pobocka?.osobniWeb_jmeno} />
        <Row label="Heslo"              value={pobocka?.osobniWeb_heslo} />
      </Card>
    </div>
  )

  // ── form body ────────────────────────────────────────────────────────────────

  const formBody = (
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card>
        <CardTitle title="Základní informace" />
        <TwoCol>
          <Input label="Název pobočky" required value={String(form.nazev ?? '')} onChange={v => set('nazev', v)} width="100%" />
          <Input label="Officiální název" value={String(form.oficialniNazev ?? '')} onChange={v => set('oficialniNazev', v)} width="100%" />
        </TwoCol>
        <TwoCol>
          <Input label="Adresa" required value={String(form.adresa ?? '')} onChange={v => set('adresa', v)} width="100%" />
          <Input label="Otevírací doba" value={String(form.oteviraci ?? '')} onChange={v => set('oteviraci', v)} width="100%" />
        </TwoCol>
        <TwoCol>
          <TelefonInput label="Telefonní číslo" required value={String(form.telefon ?? '')} onChange={v => set('telefon', v)} />
          <Input label="E-mail" required value={String(form.email ?? '')} onChange={v => set('email', v)} width="100%" />
        </TwoCol>
        <TwoCol>
          <Select label="HSP" required placeholder="Vybrat HSP" value={String(form.hsp ?? '')} onChange={v => set('hsp', v)} options={HSP_OPTIONS} width="100%" />
          <Select label="Odpovědná osoba" required placeholder="Vybrat odpovědnou osobu" value={String(form.odpovednaOsoba ?? '')} onChange={v => set('odpovednaOsoba', v)} options={OSOBA_OPTIONS} width="100%" />
        </TwoCol>
        <Select label="Stav" required placeholder="Vybrat stav" value={String(form.stav ?? '')} onChange={v => set('stav', v)} options={STAV_OPTIONS} width="100%" />
        <ToggleItem
          label="Zobrazit na webu"
          checked={Boolean(form.zobrazitNaWebu)}
          onChange={v => set('zobrazitNaWebu', v)}
        />
      </Card>

      <Card>
        <CardTitle title="Pobočka" />
        <SectionLabel>Popis pobočky</SectionLabel>
        <TextArea
          placeholder="Zadejte popis pobočky..."
          value={String(form.popis ?? '')}
          onChange={v => set('popis', v)}
          width="100%"
          minHeight={120}
        />
        <SectionLabel>Fotografie pobočky</SectionLabel>
        <Dropzone />
      </Card>

      <Card>
        <CardTitle title="Nastavení exportu" />

        <ExportSectionHeader label="Sreality" active={exportToggles.sreality} onToggle={v => toggleExport('sreality', v)} />
        {exportToggles.sreality && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TwoCol>
              <Input label="ID pobočky na Sreality" value={String(form.sreality_id ?? '')} onChange={v => set('sreality_id', v)} width="100%" />
              <Input label="Hash pobočky pro přihlášení" value={String(form.sreality_hash ?? '')} onChange={v => set('sreality_hash', v)} width="100%" />
            </TwoCol>
            <TwoCol>
              <Input label="Klíč pobočky pro přihlášení" value={String(form.sreality_klic ?? '')} onChange={v => set('sreality_klic', v)} width="100%" />
              <Input label="ID makléře zastupujícího Callcentrum" value={String(form.sreality_idMaklere ?? '')} onChange={v => set('sreality_idMaklere', v)} width="100%" />
            </TwoCol>
          </div>
        )}

        <ExportDivider />
        <ExportSectionHeader label="Reality MIX" active={exportToggles.realityMix} onToggle={v => toggleExport('realityMix', v)} />
        {exportToggles.realityMix && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TwoCol>
              <Input label="ID na realtymix" value={String(form.realityMix_id ?? '')} onChange={v => set('realityMix_id', v)} width="100%" />
              <Input label="Přihlašovací heslo" value={String(form.realityMix_heslo ?? '')} onChange={v => set('realityMix_heslo', v)} width="100%" />
            </TwoCol>
            <Input label="Klíč" value={String(form.realityMix_klic ?? '')} onChange={v => set('realityMix_klic', v)} width="100%" />
          </div>
        )}

        <ExportDivider />
        <ExportSectionHeader label="Bazoš.cz" active={exportToggles.bazos} onToggle={v => toggleExport('bazos', v)} />
        {exportToggles.bazos && (
          <TwoCol>
            <Input label="Přihlašovací jméno" value={String(form.bazos_jmeno ?? '')} onChange={v => set('bazos_jmeno', v)} width="100%" />
            <Input label="Přihlašovací heslo" value={String(form.bazos_heslo ?? '')} onChange={v => set('bazos_heslo', v)} width="100%" />
          </TwoCol>
        )}

        <ExportDivider />
        <ExportSectionHeader label="Realingo" active={exportToggles.realingo} onToggle={v => toggleExport('realingo', v)} />
        {exportToggles.realingo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TwoCol>
              <Input label="ID na realingo" value={String(form.realingo_id ?? '')} onChange={v => set('realingo_id', v)} width="100%" />
              <Input label="Přihlašovací heslo" value={String(form.realingo_heslo ?? '')} onChange={v => set('realingo_heslo', v)} width="100%" />
            </TwoCol>
            <Input label="Klíč" value={String(form.realingo_klic ?? '')} onChange={v => set('realingo_klic', v)} width="100%" />
          </div>
        )}

        <ExportDivider />
        <ExportSectionHeader label="Idnes" active={exportToggles.idnes} onToggle={v => toggleExport('idnes', v)} />
        {exportToggles.idnes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TwoCol>
              <Input label="Přihl. jméno k API" value={String(form.idnes_jmenoApi ?? '')} onChange={v => set('idnes_jmenoApi', v)} width="100%" />
              <Input label="Přihl. heslo k API" value={String(form.idnes_hesloApi ?? '')} onChange={v => set('idnes_hesloApi', v)} width="100%" />
            </TwoCol>
            <TwoCol>
              <Input label="Přihl. jméno k FTP" value={String(form.idnes_jmenoFtp ?? '')} onChange={v => set('idnes_jmenoFtp', v)} width="100%" />
              <Input label="Přihl. heslo k FTP" value={String(form.idnes_hesloFtp ?? '')} onChange={v => set('idnes_hesloFtp', v)} width="100%" />
            </TwoCol>
          </div>
        )}

        <ExportDivider />
        <ExportSectionHeader label="České reality" active={exportToggles.ceskeReality} onToggle={v => toggleExport('ceskeReality', v)} />
        {exportToggles.ceskeReality && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TwoCol>
              <Input label="ID na ceskychrealtach" value={String(form.ceskeReality_id ?? '')} onChange={v => set('ceskeReality_id', v)} width="100%" />
              <Input label="Heslo" value={String(form.ceskeReality_heslo ?? '')} onChange={v => set('ceskeReality_heslo', v)} width="100%" />
            </TwoCol>
            <Input label="ID firmy" value={String(form.ceskeReality_idFirmy ?? '')} onChange={v => set('ceskeReality_idFirmy', v)} width="100%" />
          </div>
        )}

        <ExportDivider />
        <ExportSectionHeader label="Eurobydlení" active={exportToggles.eurobydleni} onToggle={v => toggleExport('eurobydleni', v)} />
        {exportToggles.eurobydleni && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TwoCol>
              <Input label="ID na eurobydlení" value={String(form.eurobydleni_id ?? '')} onChange={v => set('eurobydleni_id', v)} width="100%" />
              <Input label="Přihlašovací heslo" value={String(form.eurobydleni_heslo ?? '')} onChange={v => set('eurobydleni_heslo', v)} width="100%" />
            </TwoCol>
            <Input label="Klíč" value={String(form.eurobydleni_klic ?? '')} onChange={v => set('eurobydleni_klic', v)} width="100%" />
          </div>
        )}

        <ExportDivider />
        <ExportSectionHeader label="B3 technology" active={exportToggles.b3} onToggle={v => toggleExport('b3', v)} />
        {exportToggles.b3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TwoCol>
              <Input label="ID pobočky na B3 technology" value={String(form.b3_id ?? '')} onChange={v => set('b3_id', v)} width="100%" />
              <Input label="Hash pobočky pro přihlášení" value={String(form.b3_hash ?? '')} onChange={v => set('b3_hash', v)} width="100%" />
            </TwoCol>
            <TwoCol>
              <Input label="Klíč pobočky pro přihlášení" value={String(form.b3_klic ?? '')} onChange={v => set('b3_klic', v)} width="100%" />
              <Input label="ID makléře zastupujícího Callcentrum" value={String(form.b3_idMaklere ?? '')} onChange={v => set('b3_idMaklere', v)} width="100%" />
            </TwoCol>
          </div>
        )}

        <ExportDivider />
        <ExportSectionHeader label="Osobní web" active={exportToggles.osobniWeb} onToggle={v => toggleExport('osobniWeb', v)} />
        {exportToggles.osobniWeb && (
          <TwoCol>
            <Input label="Přihlašovací jméno" value={String(form.osobniWeb_jmeno ?? '')} onChange={v => set('osobniWeb_jmeno', v)} width="100%" />
            <Input label="Heslo" value={String(form.osobniWeb_heslo ?? '')} onChange={v => set('osobniWeb_heslo', v)} width="100%" />
          </TwoCol>
        )}
      </Card>
    </div>
  )

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed', right: 0, top: 56, bottom: 0, width: 720, zIndex: 100,
      boxShadow: '-2px 0 4px -2px #0a0d120f, -4px 0 6px -1px #0a0d121a',
      clipPath: 'inset(0 0 0 -20px)',
    }}>
      <Form
        width={720}
        minHeight={0}
        footer={{
          actions: isDetail
            ? [
                { label: 'Zavřít', variant: 'outlined', onClick: onClose },
                { label: 'Upravit pobočku', variant: 'outlined', onClick: onEdit },
              ]
            : [
                { label: 'Zrušit', variant: 'outlined', onClick: onClose },
                {
                  label: isCreate ? 'Vytvořit pobočku' : 'Uložit změny',
                  variant: 'primary',
                  onClick: () => { onSave?.(form); onClose() },
                },
              ],
        }}
      >
        <>
          <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: 24, background: 'var(--t-bgSecondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(!isCreate && pobocka) && <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textSecondary)', fontFamily: 'Inter' }}>ID {pobocka.id}</span>}
              <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)', fontFamily: 'Inter' }}>
                {isCreate ? 'Vytvořit pobočku' : isEdit ? 'Upravit pobočku' : String(pobocka?.nazev ?? '–')}
              </span>
            </div>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>
          {isDetail ? detailBody : formBody}
        </>
      </Form>
    </div>
  )
}
