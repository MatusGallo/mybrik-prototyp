import { useState, type CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Building2, Home, LandPlot, Handshake, LayoutGrid,
  Maximize2, MapPin, Wallet, Plus, type LucideIcon,
} from 'lucide-react'
import {
  IconButton, LineTabGroup, TextButton, Tag, SummaryListItem, typography, iconSize,
} from '@matusgallo/mysabds'
import DataTable from '../../components/shared/DataTable'
import { poptavkyData, prilezitostiData, stavPrilezitostiVariant, typNemovitostiLabel, typNemovitostiVariant, typObchoduVariant } from '../../data/mockObchod'
import { renderAvatarName, renderKlientKontakt } from '../../utils/renderAvatarName'
import { renderDatum } from '../../utils/tableRenders'
import DetailParuModal, { type ParRow } from '../../components/obchod/DetailParuModal'
import NovyKlientPoptavkyPanel from '../../components/obchod/NovyKlientPoptavkyPanel'

const TABS = [
  { value: 'klienti',      label: 'Klienti' },
  { value: 'prilezitosti', label: 'Příležitosti' },
  { value: 'pary',         label: 'Páry' },
]

// Poptávka zatím stav v datech nenese - detail ho drží na jedné hodnotě, ať se
// nečte jako údaj ze záznamu.
const STAV_POPTAVKY = 'Aktivní'

// ── Formátování ─────────────────────────────────────────────────────────────────

const cislo = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 })
const mena = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 })

const fmtCena = (v: number) => mena.format(v)

/** Rozpětí ceny - měna jen jednou, ať se hodnota vejde na řádek. */
function rozsahCeny(od: number, do_: number) {
  if (!od && !do_) return ''
  if (!od || od === do_) return fmtCena(do_ || od)
  return `${cislo.format(od)} - ${fmtCena(do_)}`
}

function rozsahPlochy(od: number, do_: number) {
  if (!od && !do_) return ''
  if (!od || od === do_) return `${cislo.format(do_ || od)} m²`
  return `${cislo.format(od)} - ${cislo.format(do_)} m²`
}

// Typ nemovitosti v nadpisu stojí ve 2. pádu („Poptávka - Prodej domu“).
const TYP_2_PAD: Record<string, string> = {
  byt: 'bytu',
  dům: 'domu',
  pozemek: 'pozemku',
  chata: 'chaty',
  komerční: 'komerční nemovitosti',
}

const TYP_IKONA: Record<string, LucideIcon> = {
  byt: Building2,
  dům: Home,
  pozemek: LandPlot,
}

// ── Mock data k poptávce ────────────────────────────────────────────────────────

interface KlientRow {
  id: number
  klient: string
  makler: string
  vytvoren: string
  posledniAktivita: string
  prilezitosti: number
  platnostDo: string
  stav: string
}

const KLIENTI_MOCK: KlientRow[] = [
  {
    id: 1, klient: 'Tomáš Čáp', makler: 'Michaela Flachsová',
    vytvoren: '16.05.2023 16:26:48', posledniAktivita: '01.06.2026 20:24:51',
    prilezitosti: 1, platnostDo: '18.05.2023 16:26', stav: 'Expirovaný',
  },
]

const PARY_MOCK: ParRow[] = [
  {
    klient: 'Tomáš Čáp', idNabidky: 20, nazev: 'Prodej bytu 2+1 se zahradou - 54.3m²',
    typ: 'byt', podtyp: '2 + 1', plocha: 54, cena: 4498000,
    vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' },
    adresa: 'Kraj Vysočina, Žďár nad Sázavou, Světnov, 166, 59102',
    tagy: ['Velmi dobrý', 'Osobní', 'Cihlová'],
    historie: [
      { nemovitost: 'Prodej bytu 2 + kk, Praha 5', posledniAktivita: '17.05.2023 13:45', vytvoreno: '16.05.2023 16:26', vytvorilUzivatel: 'Tomáš Čáp', stav: 'Aktivní' },
      { nemovitost: 'Prodej rodinného domu, Beroun', posledniAktivita: '21.07.2023 15:05', vytvoreno: '21.07.2023 15:04', vytvorilUzivatel: 'Tomáš Čáp', stav: 'Aktivní' },
    ],
    klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' },
  },
  { klient: 'Tomáš Čáp', idNabidky: 205, nazev: 'Byt 1+1, Mladá Boleslav',                              typ: 'byt', podtyp: '1 + 1',  plocha: 60, cena: 5000000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Středočeský kraj, Mladá Boleslav', tagy: ['Dobrý', 'Cihlová'], historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 639, nazev: 'Krásné Malšovice 2+1',                                 typ: 'byt', podtyp: '2 + 1',  plocha: 66, cena: 5343000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Hradec Králové, Malšovice',     tagy: ['Velmi dobrý'],         historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 753, nazev: 'náměstí Republiky 915',                                typ: 'byt', podtyp: '2 + 1',  plocha: 60, cena: 5090000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Praha, náměstí Republiky 915', tagy: ['Dobrý'],                historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 989, nazev: 'Moderní apartmán 2+KK s balkónem v Korzo Lipno',       typ: 'byt', podtyp: '2 + kk', plocha: 66, cena: 6290000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Lipno nad Vltavou',             tagy: ['Velmi dobrý'],         historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1279, nazev: '3+kk Rybářská 124, UH',                               typ: 'byt', podtyp: '3 + kk', plocha: 62, cena: 4990000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Uherské Hradiště, Rybářská 124', tagy: ['Dobrý'],                historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1354, nazev: 'Prodej bytu 3+1, Liberec, Na Skřivanech',             typ: 'byt', podtyp: '3 + 1',  plocha: 60, cena: 4490000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Liberec, Na Skřivanech',         tagy: ['Dobrý'],                historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1376, nazev: 'Prodej bytu 2+kk 48,5m2, Jaurisova 19, Praha 4 – Nusle', typ: 'byt', podtyp: '2 + kk', plocha: 48, cena: 5990000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Praha 4, Nusle, Jaurisova 19',   tagy: ['Velmi dobrý'],         historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1469, nazev: 'Prodej, Byt 2+kk, ulice Pražská třída, Kukleny - Hradec Králové', typ: 'byt', podtyp: '2 + kk', plocha: 48, cena: 7000000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Hradec Králové, Kukleny',     tagy: ['Dobrý'],                historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
  { klient: 'Tomáš Čáp', idNabidky: 1493, nazev: 'Prodej novostavby 1,5+kk Kamechy',                    typ: 'byt', podtyp: '2 + kk', plocha: 49, cena: 6100000, vlastnik: { jmeno: 'Veronika Šmardová', firma: 'Vaše finance a reality s.r.o.' }, adresa: 'Brno, Kamechy',                  tagy: ['Velmi dobrý'],         historie: [], klientInfo: { prirazenKPoptavce: '16.05.2023 16:26', posledniKomunikace: '' } },
]

// ── Styly ───────────────────────────────────────────────────────────────────────

const CARD: CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
}

// Nadpis karty i panelu — subheadline18Semibold, ne headline20.
const WIDGET_TITLE: CSSProperties = {
  ...typography.subheadline18Semibold, color: 'var(--t-textPrimary)',
}

// ── Sub-komponenty ──────────────────────────────────────────────────────────────

function Widget({ title, action, children }: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column' }}>
      {(title || action) && (
        <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {title && <span style={{ ...WIDGET_TITLE, minWidth: 0 }}>{title}</span>}
          {action}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

/** Řádkový fakt v hero kartě — ikona + popisek + hodnota. */
function FactLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  const hodnota = value || '-'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, padding: '6px 0' }}>
      <Icon size={iconSize.sm} style={{ color: 'var(--t-textSecondary)', flexShrink: 0 }} />
      <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--t-textSecondary)', flexShrink: 0, width: 124 }}>
        {label}
      </span>
      <span
        title={hodnota}
        style={{
          fontSize: 13, fontWeight: 600, lineHeight: '18px',
          color: value ? 'var(--t-textPrimary)' : 'var(--t-textTertiary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
        }}
      >
        {hodnota}
      </span>
    </div>
  )
}

function stavKlientaVariant(stav: string) {
  if (stav === 'Aktivní') return 'success' as const
  if (stav === 'Expirovaný') return 'danger' as const
  return 'neutral' as const
}

// ── Stránka ─────────────────────────────────────────────────────────────────────

export default function PoptavkaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState('klienti')
  const [novyKlientOpen, setNovyKlientOpen] = useState(false)
  const [detailParOpen, setDetailParOpen] = useState<ParRow | null>(null)

  const poptavka = poptavkyData.find(l => String(l.id) === id)
  if (!poptavka) {
    return <div style={{ padding: 24, color: 'var(--t-textSecondary)' }}>Poptávka nenalezena.</div>
  }

  const poptavkaKod = `L${poptavka.id}`
  const prilezitostiZPoptavky = prilezitostiData.filter(p => p.idPoptavky === poptavkaKod)
  const nazev = `${poptavka.typPoptavky} ${TYP_2_PAD[poptavka.typNemovitosti] ?? poptavka.typNemovitosti}`
  const TypIkona = TYP_IKONA[poptavka.typNemovitosti] ?? Home

  return (
    <>
      <div style={{ margin: -24, background: 'var(--t-bgSecondary)', minHeight: 'calc(100vh - 56px)' }}>

        {/* Hlavička — bílý pás přes celou šířku, stejně jako v detailu nabídky */}
        <div style={{ background: 'var(--t-bgPrimary)' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0, padding: '24px 0 8px' }}>
              <div style={{ marginTop: 2 }}>
                <IconButton icon={ArrowLeft} variant="ghost" size="md" tooltip="Zpět na seznam" onClick={() => navigate('/obchod/poptavky')} />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, lineHeight: '32px', color: 'var(--t-textPrimary)', minWidth: 0 }}>
                Poptávka - {nazev}
                <span style={{ fontWeight: 500, color: 'var(--t-textTertiary)' }}> · {poptavkaKod}</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Záložky — drží se pod horní lištou, zatímco nadpis odjíždí */}
        <div style={{ position: 'sticky', top: 56, zIndex: 10, background: 'var(--t-bgPrimary)', borderBottom: '1px solid var(--t-borderPrimary)' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px' }}>
            <LineTabGroup tabs={TABS} value={tab} onChange={setTab} />
          </div>
        </div>

        <div style={{ maxWidth: 1440, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>

            {/* ── Obsah ───────────────────────────────────────────────── */}
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Poptávaná nemovitost — hero karta */}
              <div style={CARD}>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                    <span style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--t-bgMyDOCKTertiary)', color: 'var(--t-textMyDOCKPrimary)',
                    }}>
                      <TypIkona size={iconSize.md} />
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>
                        {nazev}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Tag label={STAV_POPTAVKY} variant="success" size="sm" lead="indicator" />
                        <Tag label={poptavkaKod} variant="neutral" size="sm" />
                        <Tag label={typNemovitostiLabel(poptavka.typNemovitosti)} variant={typNemovitostiVariant(poptavka.typNemovitosti)} size="sm" />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--t-borderPrimary)' }} />

                  {/* Zadání poptávky — kompaktní řádky ve dvou sloupcích */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    columnGap: 32, rowGap: 0,
                  }}>
                    <FactLine icon={Handshake} label="Typ obchodu" value={poptavka.typPoptavky} />
                    <FactLine icon={TypIkona} label="Typ nemovitosti" value={poptavka.typNemovitosti} />
                    <FactLine icon={LayoutGrid} label="Podtyp" value={poptavka.podtyp} />
                    <FactLine icon={Maximize2} label="Užitná plocha" value={rozsahPlochy(poptavka.plochaOd, poptavka.plochaDo)} />
                    <FactLine icon={Wallet} label="Cena" value={rozsahCeny(poptavka.cenaOd, poptavka.cenaDo)} />
                    <FactLine icon={MapPin} label="Lokalita" value="" />
                  </div>
                </div>
              </div>

              {/* Klienti */}
              {tab === 'klienti' && (
                <Widget
                  title="Klienti"
                  action={<TextButton label="Přidat klienta" variant="brand" leadIcon={Plus} onClick={() => setNovyKlientOpen(true)} />}
                >
                  <DataTable
                    cols={[
                      { key: 'id', label: 'ID', width: 56 },
                      { key: 'klient', label: 'Klient', width: 190, flex: true, render: renderAvatarName('klient') },
                      { key: 'makler', label: 'Makléř', width: 190, render: renderAvatarName('makler') },
                      { key: 'vytvoren', label: 'Vytvořen', width: 110, render: renderDatum('vytvoren') },
                      { key: 'posledniAktivita', label: 'Poslední aktivita', width: 130, render: renderDatum('posledniAktivita') },
                      { key: 'prilezitosti', label: 'Příležitostí', width: 100, align: 'right' },
                      { key: 'platnostDo', label: 'Platnost do', width: 110, render: renderDatum('platnostDo') },
                      { key: 'stav', label: 'Stav', width: 130, render: r => (
                        <Tag label={String(r.stav)} variant={stavKlientaVariant(String(r.stav))} size="sm" lead="indicator" />
                      ) },
                    ]}
                    rows={KLIENTI_MOCK as unknown as Record<string, unknown>[]}
                    actions={[]}
                    emptyTitle="K poptávce zatím není přiřazen žádný klient"
                    emptyDescription="Přiřaďte klienta a poptávka se mu začne párovat s nabídkami."
                    emptyCta={{ label: 'Přidat klienta', onClick: () => setNovyKlientOpen(true) }}
                  />
                </Widget>
              )}

              {/* Příležitosti */}
              {tab === 'prilezitosti' && (
                <Widget title="Příležitosti">
                  <DataTable
                    cols={[
                      { key: 'id', label: 'ID', width: 80 },
                      { key: 'klient', label: 'Klient', width: 220, render: renderKlientKontakt('klient') },
                      { key: 'idNabidky', label: 'ID nabídky', width: 100 },
                      { key: 'nazevNabidky', label: 'Název nabídky', width: 240, flex: true },
                      { key: 'typNabidky', label: 'Typ obchodu', width: 120, render: r => (
                        <Tag label={String(r.typNabidky)} variant={typObchoduVariant(String(r.typNabidky))} size="sm" />
                      ) },
                      { key: 'makler', label: 'Makléř', width: 180, render: renderAvatarName('makler') },
                      { key: 'datumPosledniZmeny', label: 'Poslední aktivita', width: 130, render: renderDatum('datumPosledniZmeny') },
                      { key: 'stavPrilezitosti', label: 'Stav', width: 170, render: r => (
                        <Tag label={String(r.stavPrilezitosti)} variant={stavPrilezitostiVariant(String(r.stavPrilezitosti))} size="sm" lead="indicator" />
                      ) },
                    ]}
                    rows={prilezitostiZPoptavky as unknown as Record<string, unknown>[]}
                    actions={[]}
                    onRowClick={row => navigate(`/obchod/prilezitosti/${row.id}`)}
                    emptyTitle="K poptávce zatím nejsou žádné příležitosti"
                    emptyDescription="Příležitost vznikne, jakmile klient zareaguje na některou z nabídek."
                  />
                </Widget>
              )}

              {/* Páry */}
              {tab === 'pary' && (
                <Widget title="Páry">
                  <DataTable
                    cols={[
                      { key: 'klient',    label: 'Klient',     width: 170, render: renderAvatarName('klient') },
                      { key: 'idNabidky', label: 'ID nabídky', width: 100 },
                      { key: 'nazev',     label: 'Název nabídky', width: 260, flex: true },
                      { key: 'typ',       label: 'Typ',        width: 90 },
                      { key: 'podtyp',    label: 'Podtyp',     width: 90 },
                      { key: 'plocha',    label: 'Plocha',     width: 100, align: 'right', format: v => `${cislo.format(v as number)} m²` },
                      { key: 'cena',      label: 'Cena',       width: 140, align: 'right', format: v => fmtCena(v as number) },
                    ]}
                    rows={PARY_MOCK as unknown as Record<string, unknown>[]}
                    actions={[]}
                    onRowClick={row => setDetailParOpen(row as unknown as ParRow)}
                    emptyTitle="K poptávce zatím nejsou žádné páry"
                    emptyDescription="Pár vznikne, jakmile poptávce odpoví některá z nabídek."
                  />
                </Widget>
              )}
            </div>

            {/* ── Pravý panel ─────────────────────────────────────────── */}
            <div style={{ position: 'sticky', top: 72, display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ ...CARD, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={WIDGET_TITLE}>Stav poptávky</span>
                <SummaryListItem
                  label="Stav"
                  length="short"
                  align="right"
                  value={{ kind: 'badges', items: [{ label: STAV_POPTAVKY, variant: 'success', lead: 'indicator' }] }}
                />
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SummaryListItem
                  label="Vytvořeno"
                  length="short"
                  align="right"
                  value={{ kind: 'text', text: poptavka.datumVytvoreni }}
                />
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SummaryListItem
                  label="Poslední aktivita"
                  length="short"
                  align="right"
                  value={{ kind: 'text', text: poptavka.datumVytvoreni }}
                />
              </div>

              {/* Souhrn — propojené záznamy jako rekapitulace, oddělená karta */}
              <div style={{ ...CARD, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={WIDGET_TITLE}>Propojené záznamy</span>
                <SummaryListItem
                  label="Klientů"
                  length="short"
                  align="right"
                  value={{ kind: 'action', label: poptavka.klientu, onClick: () => setTab('klienti') }}
                />
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SummaryListItem
                  label="Příležitostí"
                  length="short"
                  align="right"
                  value={{ kind: 'action', label: String(poptavka.prilezitosti), onClick: () => setTab('prilezitosti') }}
                />
                <div style={{ borderTop: '1px dashed var(--t-borderPrimary)' }} />
                <SummaryListItem
                  label="Spolupráce"
                  length="short"
                  align="right"
                  value={{ kind: 'text', text: poptavka.spoluprace }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {novyKlientOpen && <NovyKlientPoptavkyPanel onClose={() => setNovyKlientOpen(false)} />}
      {detailParOpen && <DetailParuModal par={detailParOpen} onClose={() => setDetailParOpen(null)} />}
    </>
  )
}
