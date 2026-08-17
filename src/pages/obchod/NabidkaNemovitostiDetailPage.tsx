import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Handshake, Pencil, MessageCircle, Ban, ArrowUpRight, Copy,
} from 'lucide-react'
import {
  IconButton, LineTabGroup, TextButton, TableHeaderCell, TableCell, TextArea,
} from '@matusgallo/mysabds'
import { nabidkaNemovitostiData, typNemovitostiLabel } from '../../data/mockObchod'
import CallcentrumKomunikaceModal from '../../components/obchod/CallcentrumKomunikaceModal'
import PredatZaznamModal from '../../components/obchod/PredatZaznamModal'
import ZrusitZaznamModal from '../../components/obchod/ZrusitZaznamModal'
import NabidkaNemovitostiPanel from '../../components/obchod/NabidkaNemovitostiPanel'

// ── Mock detail data ────────────────────────────────────────────────────────────

const KOMUNIKACE_ITEMS = [
  { id: 1, datumZapisu: '02.06.2026 08:01', typ: 'Telefon', poznamka: '', vysledek: 'Nesprávný kontaktní údaj' },
  { id: 2, datumZapisu: '02.06.2026 08:01', typ: 'Telefon', poznamka: 'Test', vysledek: 'Nesprávný kontaktní údaj' },
]

const HISTORIE_KOMUNIKACE = [
  { id: 1, typ: 'Vytvoření záznamu', datum: '14.09.2023 10:44' },
]

const HISTORIE_KLIENTA = [
  { id: 'N185', typ: 'Nabídka', label: 'N185' },
  { id: 'N646', typ: 'Nabídka', label: 'N646' },
  { id: 'N973', typ: 'Nabídka', label: 'N973' },
  { id: 'N1042', typ: 'Nabídka', label: 'N1042' },
  { id: 'N1673', typ: 'Nabídka', label: 'N1673' },
  { id: 'CC22', typ: 'Callcentrum', label: '22' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────────

function fmtCena(v: number): string {
  if (!v) return '0 Kč'
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(v)
}

// ── Sub-components ──────────────────────────────────────────────────────────────

const WIDGET: React.CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12, padding: 16,
}

// typography.subheadline18Semibold
const WIDGET_HEADING: React.CSSProperties = {
  fontSize: 18, fontWeight: 600, lineHeight: '26px', letterSpacing: '-0.36px',
  color: 'var(--t-textPrimary)',
  marginBottom: 12,
}

const KV_ROW: React.CSSProperties = {
  display: 'flex', gap: 12, fontSize: 13,
  minHeight: 24, alignItems: 'center',
}
const KV_LABEL: React.CSSProperties = { color: 'var(--t-textSecondary)', width: 110, flexShrink: 0 }
const KV_VALUE: React.CSSProperties = { color: 'var(--t-textPrimary)', fontWeight: 500, flex: 1, wordBreak: 'break-word' }

function KVRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={KV_ROW}>
      <span style={KV_LABEL}>{label}</span>
      <span style={{ ...KV_VALUE, display: 'flex', alignItems: 'center', gap: 4 }}>
        {value}
        {copyable && (
          <div style={{ borderRadius: 6, background: copied ? 'var(--t-bgHover)' : 'transparent', flexShrink: 0 }}>
            <IconButton
              icon={Copy}
              variant="ghost"
              size="sm"
              tooltip={copied ? 'Zkopírováno' : 'Zkopírovat'}
              onClick={handleCopy}
            />
          </div>
        )}
      </span>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'cela', label: 'Celá komunikace' },
  { value: 'historie-komunikace', label: 'Historie komunikace' },
  { value: 'historie-klienta', label: 'Historie klienta' },
]

export default function NabidkaNemovitostiDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState('cela')
  const [komunikaceOpen, setKomunikaceOpen] = useState(false)
  const [predatOpen, setPredatOpen] = useState(false)
  const [zrusitOpen, setZrusitOpen] = useState(false)
  const [editPanelOpen, setEditPanelOpen] = useState(false)
  const [interniPoznamka, setInterniPoznamka] = useState('')

  const n = nabidkaNemovitostiData.find(r => String(r.id) === id)
  if (!n) {
    return (
      <div style={{ padding: 24, color: 'var(--t-textSecondary)' }}>
        Záznam nenalezen.
      </div>
    )
  }

  const maklerEmail = `beta_info@${n.makler.toLowerCase().replace(/[^a-z]/g, '')}.cz`
  const maklerTelefon = '+420 733 641 689'

  return (
    <>
    <div style={{ margin: -24, background: 'var(--t-bgSecondary)', minHeight: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div style={{ background: 'var(--t-bgSecondary)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 16px' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <IconButton
                icon={ArrowLeft}
                variant="ghost"
                size="md"
                onClick={() => navigate('/obchod/nabidka-nemovitosti')}
              />
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: '28px', color: 'var(--t-textPrimary)' }}>
                Callcentrum – Nabídka nemovitosti
              </h1>
            </div>

            {/* Rychlé akce */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
              <IconButton icon={Pencil} variant="soft" size="lg" tooltip="Editovat callcentrum" onClick={() => setEditPanelOpen(true)} />
              <IconButton icon={Handshake} variant="soft" size="lg" tooltip="Předat" onClick={() => setPredatOpen(true)} />
              <IconButton icon={MessageCircle} variant="soft" size="lg" tooltip="Zapsat komunikaci" onClick={() => setKomunikaceOpen(true)} />
              <IconButton icon={Ban} variant="soft" size="lg" tooltip="Zrušit záznam" onClick={() => setZrusitOpen(true)} />
            </div>
          </div>

        </div>
      </div>

      {/* Sticky tabs */}
      <div style={{ position: 'sticky', top: 56, zIndex: 10, background: 'var(--t-bgSecondary)', borderBottom: '1px solid var(--t-borderPrimary)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <LineTabGroup tabs={TABS} value={tab} onChange={setTab} />
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'flex-start' }}>

        {/* Left — content */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Celá komunikace */}
          {tab === 'cela' && (
            <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16 }}>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', background: 'var(--t-bgSecondary)' }}>
                  <div style={{ pointerEvents: 'none' }}>
                    <TableHeaderCell label="Datum zápisu" size="dense" width={170} />
                  </div>
                  <div style={{ pointerEvents: 'none' }}>
                    <TableHeaderCell label="Typ komunikace" size="dense" width={160} />
                  </div>
                  <div style={{ flex: 1, pointerEvents: 'none' }}>
                    <TableHeaderCell label="Poznámka" size="dense" width="100%" />
                  </div>
                  <div style={{ pointerEvents: 'none' }}>
                    <TableHeaderCell label="Výsledek" size="dense" width={240} />
                  </div>
                </div>
                {KOMUNIKACE_ITEMS.map((k, i) => {
                  const isLast = i === KOMUNIKACE_ITEMS.length - 1
                  return (
                    <div key={k.id} style={{ display: 'flex' }}>
                      <TableCell size="dense" width={170} hovered={false} borderBottom={!isLast} label={k.datumZapisu} />
                      <TableCell size="dense" width={160} hovered={false} borderBottom={!isLast} label={k.typ} />
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        paddingLeft: 12, paddingRight: 12,
                        borderBottom: !isLast ? '1px solid var(--t-borderPrimary)' : undefined,
                      }}>
                        <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{k.poznamka || '—'}</span>
                      </div>
                      <TableCell size="dense" width={240} hovered={false} borderBottom={!isLast} label={k.vysledek} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Historie komunikace */}
          {tab === 'historie-komunikace' && (
            <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16 }}>
              <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', background: 'var(--t-bgSecondary)' }}>
                  <div style={{ flex: 1, pointerEvents: 'none' }}>
                    <TableHeaderCell label="Typ záznamu" size="dense" width="100%" />
                  </div>
                  <div style={{ pointerEvents: 'none' }}>
                    <TableHeaderCell label="Datum záznamu" size="dense" width={200} />
                  </div>
                </div>
                {HISTORIE_KOMUNIKACE.map((h, i) => {
                  const isLast = i === HISTORIE_KOMUNIKACE.length - 1
                  return (
                    <div key={h.id} style={{ display: 'flex' }}>
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        paddingLeft: 12, paddingRight: 12, minHeight: 40,
                        borderBottom: !isLast ? '1px solid var(--t-borderPrimary)' : undefined,
                      }}>
                        <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>{h.typ}</span>
                      </div>
                      <TableCell size="dense" width={200} hovered={false} borderBottom={!isLast} label={h.datum} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Historie klienta */}
          {tab === 'historie-klienta' && (
            <div style={{ background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {HISTORIE_KLIENTA.map(h => (
                  <a
                    key={h.id}
                    onClick={() => {
                      if (h.typ === 'Nabídka') window.open(`/nabidky/${h.label.replace('N', '')}`, '_blank')
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 14, lineHeight: '24px',
                      color: 'var(--t-textMyDOCKPrimary)', cursor: 'pointer',
                      width: 'fit-content',
                    }}
                  >
                    {h.typ} ({h.label})
                    {h.typ === 'Nabídka' && <ArrowUpRight size={14} style={{ flexShrink: 0 }} />}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Klient */}
          <div style={WIDGET}>
            <div style={WIDGET_HEADING}>Klient</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)' }}>{n.klient}</span>
              <KVRow label="Telefon" value="733 641 689" copyable />
              <KVRow label="E-mail" value="z.stumpa@gmail.com" copyable />
            </div>
          </div>

          {/* Poptávku vyřizuje */}
          <div style={WIDGET}>
            <div style={WIDGET_HEADING}>Poptávku vyřizuje</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <KVRow label="Jméno" value={n.makler} />
              <KVRow label="Telefon" value={maklerTelefon} copyable />
              <KVRow label="E-mail" value={maklerEmail} copyable />
              <TextButton label="Předat" variant="brand" size="sm" leadIcon={Handshake} onClick={() => setPredatOpen(true)} />
            </div>
          </div>

          {/* Informace o záznamu */}
          <div style={WIDGET}>
            <div style={WIDGET_HEADING}>Informace o záznamu callcentra</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <KVRow label="Vytvořeno" value={n.datumVytvoreni} />
              <KVRow label="Zdroj" value={n.pobocka} />
              <KVRow label="Poslední změna" value={n.datumPosledniZmeny} />
              <KVRow label="Financování" value="—" />
              <KVRow label="ID ticketu" value={n.idTicketu || '—'} />
            </div>
          </div>

          {/* Naplánované schůzky */}
          <div style={WIDGET}>
            <div style={WIDGET_HEADING}>Naplánované schůzky</div>
            <span style={{ fontSize: 13, color: 'var(--t-textSecondary)' }}>
              Zatím nejsou naplánované žádné schůzky.
            </span>
          </div>

          {/* Detail nabídky */}
          {n.cena > 0 && (
            <div style={WIDGET}>
              <div style={WIDGET_HEADING}>Detail nabídky</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <KVRow label="Typ objektu" value={typNemovitostiLabel(n.typObjektu)} />
                <KVRow label="Typ nabídky" value={n.typNemovitosti} />
                <KVRow label="Cena" value={fmtCena(n.cena)} />
                <KVRow label="Pobočka" value={n.pobocka} />
              </div>
            </div>
          )}

          {/* Interní poznámka */}
          <div style={WIDGET}>
            <div style={WIDGET_HEADING}>Interní poznámka</div>
            <TextArea
              value={interniPoznamka}
              onChange={setInterniPoznamka}
              placeholder="Napište interní poznámku..."
              width="100%"
              minHeight={100}
            />
          </div>
        </div>

      </div>
      </div>
    </div>

    {komunikaceOpen && <CallcentrumKomunikaceModal onClose={() => setKomunikaceOpen(false)} />}
    {predatOpen && <PredatZaznamModal currentMakler={n.makler} onClose={() => setPredatOpen(false)} />}
    {zrusitOpen && <ZrusitZaznamModal onClose={() => setZrusitOpen(false)} />}
    {editPanelOpen && <NabidkaNemovitostiPanel onClose={() => setEditPanelOpen(false)} />}
  </>
  )
}
