import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp, FileCheck,
} from 'lucide-react'
import {
  Button, IconButton, TextButton, Tag, Tooltip, TooltipIcon, TableCell, TableHeaderCell, Dialog, Alert,
  typography, type TagVariant,
} from '@matusgallo/mysabds'
import NovyNakladModal, { type NakladFormData } from './NovyNakladModal'
import ZpracovaniPlatebModal, {
  type PlatbaDraft, FORMA_OPT, UCEL_OPT, UCEL_NA_PROVIZI, UCEL_Z_REZERVACE,
} from './ZpracovaniPlatebModal'

/* ──────────────────────────────────────────────────────────────────────────────
   Vypořádání plateb — nový návrh finanční části nabídky.

   Peníze putují ve třech krocích: rezervační záloha → provize za zprostředkování
   → vyúčtování zakázky. Každý krok je samostatná sklopná karta se stejnou
   anatomií (stav → čtyři klíčová čísla → kolik zbývá → detail v podpanelech),
   takže se čtou jako jedna cesta a ne jako tři nesouvisející tabulky.

   Kroky jsou na sebe navázané: provize se řeší až z vyřešené zálohy, vyúčtování až
   z uhrazené provize. Krok, na který ještě nepřišla řada, je sbalený a jeho akce
   jsou zamčené s důvodem v tooltipu. Krok v řešení nese info štítek — barvu drží
   štítek stavu, karta zůstává neutrální. Zavřená karta si nechává v hlavičce
   shrnutí, aby se dala číst i sklopená.
────────────────────────────────────────────────────────────────────────────── */

// ── Mock data ─────────────────────────────────────────────────────────────────

const DPH_SAZBA = 21

const PROVIZE = {
  bezDph: 150000,
  dph: 31500,
  sDph: 181500,
}

const ZALOHA_SPLATKY = [
  { id: 1, label: 'Splátka 1', splatnost: '02.07.2026', castka: 50000 },
  { id: 2, label: 'Splátka 2', splatnost: '09.07.2026', castka: 50000 },
]

/* Peníze na zakázce vedeme jako jeden seznam plateb. Kolik je uhrazené na záloze,
   kolik z rezervace odteklo a kolik doteklo na provizi, se z něj počítá — proto se
   oprava i smazání jedné platby propíše do všech tří kroků a nikde nezůstane
   osiřelé číslo. */
interface PlatbaRow {
  id: number
  datum: string
  /** Účel z UCEL_OPT — říká, na kterou stranu zakázky platba působí */
  ucel: string
  forma: string
  castka: number
}

/** Účely, které navyšují uhrazenou rezervační zálohu. */
const UCEL_NA_ZALOHU = ['rezervacni-poplatek']

/* Výchozí stav zakázky: klient poslal první splátku zálohy, druhá ještě čeká.
   Všechny tři kroky tak mají co dělat a dají se projít v pořadí, v jakém na sebe
   navazují — doplatit zálohu → vypořádat ji na provizi → doplatit provizi →
   vyúčtovat zakázku. Prázdné pole `[]` rozjede flow od úplné nuly. */
const PLATBY: PlatbaRow[] = [
  { id: 1, datum: '02.07.2026', ucel: 'rezervacni-poplatek', forma: 'prevodem', castka: 50000 },
]

interface ZdrojProvize {
  id: number
  nazev: string
  popis: string
  castka: number
  /** Účel, se kterým se ze řádku otevře zadání úhrady */
  ucel: string
  /** Stav řádku, dokud na něj nedošly peníze */
  cekaLabel: string
}

const PROVIZE_ZDROJE: ZdrojProvize[] = [
  {
    id: 1,
    nazev: 'Započtení rezervační zálohy',
    popis: 'po vypořádání zálohy',
    castka: 100000,
    ucel: 'prevod-rp-na-provizi',
    cekaLabel: 'K vypořádání',
  },
  {
    id: 2,
    nazev: 'Doplatek z kupní ceny',
    popis: 'splatný při zobchodování zakázky',
    castka: 81500,
    ucel: 'uhrada-nekryte-provize',
    cekaLabel: 'Čeká',
  },
]

// Náklady drží součty vyúčtování: 15 690 Kč bez DPH, 2 310 Kč vstupní DPH,
// 18 000 Kč s DPH. Poslední dodavatel je neplátce, proto u něj DPH chybí.
interface NakladRow {
  id: number
  datum: string
  nazev: string
  dodavatel: string
  kategorie: string
  kategorieKey: string
  bezDph: number
  sDph: number
}

const NAKLADY: NakladRow[] = [
  { id: 1, datum: '12.06.2026', nazev: 'Fotografie a video', dodavatel: 'Foto Studio Brno', kategorie: 'Fotografické práce, video', kategorieKey: 'foto', bezDph: 5000, sDph: 6050 },
  { id: 2, datum: '18.06.2026', nazev: 'Home staging', dodavatel: 'Staging Praha', kategorie: 'Staging', kategorieKey: 'staging', bezDph: 4000, sDph: 4840 },
  { id: 3, datum: '24.06.2026', nazev: 'Inzerce na Sreality', dodavatel: 'Seznam.cz', kategorie: 'Inzerce vč. sociálních sítí', kategorieKey: 'inzerce', bezDph: 2000, sDph: 2420 },
  { id: 4, datum: '30.06.2026', nazev: 'Právní služby', dodavatel: 'AK Dvořák (neplátce DPH)', kategorie: 'Právní služby', kategorieKey: 'pravni-sluzby', bezDph: 4690, sDph: 4690 },
]

function nakladToForm(r: NakladRow): NakladFormData {
  return {
    nazev: r.nazev,
    dodavatel: r.dodavatel,
    kategorie: r.kategorieKey,
    platba: 'provize',
    datum: r.datum,
    platceDPH: r.sDph !== r.bezDph,
    dph: '21',
    castka: String(r.bezDph),
  }
}

// Podíly na provizi jsou dané strukturou; náklady nese makléř zakázky, proto
// se celá jejich částka odečítá z jeho podílu.
const ROZPAD_PODILY = [
  { jmeno: 'Dominik Bránka', pozice: 'Expert I', provize: 105000, nosiNaklady: true },
  { jmeno: 'Jana Marková', pozice: 'Manažer kanceláře', provize: 15000, nosiNaklady: false },
  { jmeno: 'SAB servis s.r.o.', pozice: 'HSP', provize: 30000, nosiNaklady: false },
]

// ── Odvozené součty ───────────────────────────────────────────────────────────

const ZALOHA_PREDEPSANO = ZALOHA_SPLATKY.reduce((s, r) => s + r.castka, 0)

// Náklady se dají editovat, proto se součty počítají ze živých řádků.
function nakladySoucty(rows: NakladRow[]) {
  const bezDph = rows.reduce((s, r) => s + r.bezDph, 0)
  const sDph = rows.reduce((s, r) => s + r.sDph, 0)
  return { bezDph, sDph, dph: sDph - bezDph }
}

/** Součet plateb, které mají některý z uvedených účelů. */
function soucetPlateb(rows: PlatbaRow[], ucely: string[]) {
  return rows.filter(p => ucely.includes(p.ucel)).reduce((s, p) => s + p.castka, 0)
}

function rozpadRows(nakladyBezDph: number) {
  return ROZPAD_PODILY.map(p => {
    const naklady = p.nosiNaklady ? nakladyBezDph : 0
    return { ...p, naklady, kVyplate: p.provize - naklady }
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCena(cena: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(cena)
}

function formatDatum(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

// Datum držíme v řádku jako text, editační okno pracuje s Date — tohle je most
// mezi nimi. Nerozluštěné datum vrací null, aby okno vynutilo nový výběr.
function parseDatum(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  return Number.isNaN(d.getTime()) ? null : d
}

function parseCastka(s: string): number {
  const n = Number(s.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function ucelLabel(value: string) {
  return UCEL_OPT.find(o => o.value === value)?.label ?? value
}

function formaLabel(value: string) {
  return FORMA_OPT.find(o => o.value === value)?.label ?? value
}

// Počty v metadatech se mění podle toho, co uživatel zapíše, takže tvar slova
// nejde napsat natvrdo: 1 platba, 2-4 platby, 5 a víc plateb.
function pocet(n: number, [jedna, dve, pet]: [string, string, string]) {
  return `${n} ${n === 1 ? jedna : n >= 2 && n <= 4 ? dve : pet}`
}

function pctOf(part: number, whole: number) {
  return whole <= 0 ? 0 : Math.min(100, Math.round((part / whole) * 100))
}

// ── Stavební prvky ────────────────────────────────────────────────────────────

// Sklopení karty i podpanelu — jedno ovládání, ať je hierarchie kdekoli.
// Chevron míří tam, kam obsah po kliknutí zmizí, resp. odkud se vysune.
function CollapseToggle({ open, onToggle, title }: { open: boolean; onToggle: () => void; title: string }) {
  return (
    <IconButton
      icon={open ? ChevronUp : ChevronDown}
      variant="ghost"
      size="md"
      tooltip={open ? `Sbalit ${title}` : `Rozbalit ${title}`}
      onClick={onToggle}
    />
  )
}

type StatItem = {
  label: string
  value: string
  valueColor?: string
  note?: string
  tag?: { label: string; variant: TagVariant }
}

// Čtyři klíčová čísla kroku, každé ve vlastním boxíku — stejné pořadí ve všech
// krocích, takže se dají porovnávat pohledem dolů po stránce.
function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
      gap: 12,
    }}>
      {items.map(it => (
        <div key={it.label} style={{
          padding: '12px 14px', minWidth: 0,
          display: 'flex', flexDirection: 'column', gap: 4,
          border: '1px solid var(--borderPrimary)', borderRadius: 8,
        }}>
          <span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{it.label}</span>
          {it.tag ? (
            <span style={{ display: 'flex', alignItems: 'center', minHeight: 26 }}>
              <Tag label={it.tag.label} variant={it.tag.variant} size="sm" lead="indicator" />
            </span>
          ) : (
            <span style={{ ...typography.headline20, color: it.valueColor ?? 'var(--textPrimary)', whiteSpace: 'nowrap' }}>
              {it.value}
            </span>
          )}
          {it.note && (
            <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>{it.note}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// Postup úhrady — jen popisek, procento a pruh. Dominantní číslo „zbývá"
// nesou boxíky nad ním, tady by se opakovalo.
function ProgressRow({ caption, pct, tone }: {
  caption: React.ReactNode
  pct: number
  tone: 'success' | 'brand' | 'neutral'
}) {
  const barColor = {
    success: 'var(--bgSuccessPrimary)',
    brand: 'var(--bgMyDOCKPrimary)',
    neutral: 'var(--textTertiary)',
  }[tone]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>{caption}</span>
        <span style={{ ...typography.body12Semibold, color: 'var(--textPrimary)' }}>{pct} %</span>
      </div>
      <div style={{
        height: 8, borderRadius: 999, overflow: 'hidden',
        background: 'var(--bgSecondary)', border: '1px solid var(--borderPrimary)',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 250ms ease' }} />
      </div>
    </div>
  )
}

// Karta jednoho kroku vypořádání. Sklápěcí přepínač je až na konci hlavičky —
// vlevo začíná název, aby se karty daly čtením po levé hraně přeskakovat.
function StepCard({
  title, tooltip, status, actions, summary, open, onToggle, children,
}: {
  title: string
  tooltip: string
  status?: { label: string; variant: TagVariant }
  actions?: React.ReactNode
  summary?: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section style={{
      background: 'var(--bgPrimary)',
      border: '1px solid var(--borderPrimary)',
      borderRadius: 12,
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: open ? 16 : 0,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ ...typography.subheadline18Semibold, color: 'var(--textPrimary)' }}>
            {title}
          </span>
          <TooltipIcon placement="top" content={tooltip} />
        </span>

        {/* Stav patří k názvu — čte se jako „Rezervační záloha: vyřešeno" */}
        {status && <Tag label={status.label} variant={status.variant} size="sm" lead="indicator" />}

        {!open && summary && (
          <>
            <span style={{ width: 1, height: 16, background: 'var(--borderPrimary)', flexShrink: 0 }} />
            <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)', minWidth: 0 }}>{summary}</span>
          </>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', columnGap: 8, rowGap: 8, flexWrap: 'wrap' }}>
          {actions}
          {/* Svislá linka odděluje akce nad obsahem od ovládání karty samotné */}
          {actions && <span style={{ width: 1, height: 20, background: 'var(--borderPrimary)', flexShrink: 0 }} />}
          <CollapseToggle open={open} onToggle={onToggle} title={title.toLowerCase()} />
        </div>
      </header>

      {open && children}
    </section>
  )
}

// Vrstvení potvrzovacích dialogů — Dialog nese jen obsah, šedou plochu pod ním
// a stacking kreslí aplikace. Tři dialogy na obrazovce sdílí jeden obal, aby se
// neposunul jeden z nich zvlášť.
function ConfirmPortal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bgOverlay)' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ pointerEvents: 'auto' }}>{children}</div>
      </div>
    </>,
    document.body,
  )
}

// Podpanel s detailem — hlavička se souhrnem a rozpis pod ní. Nesklápí se:
// detail kroku je součást jeho obsahu, sklápí se až celá karta kroku.
function SubPanel({
  title, meta, note, padded = true, children,
}: {
  title: string
  meta?: React.ReactNode
  /** Sdělení mezi nadpisem a tabulkou — patří k celému rozpisu, ne k řádku */
  note?: React.ReactNode
  padded?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Nadpis nad tabulkou, ne pruh v jejím rámečku — tabulka má vlastní záhlaví */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ ...typography.body16Semibold, color: 'var(--textPrimary)' }}>{title}</span>
        {meta && (
          <span style={{ marginLeft: 'auto', ...typography.body12Regular, color: 'var(--textSecondary)' }}>{meta}</span>
        )}
      </div>
      {note}
      <div style={{
        border: '1px solid var(--borderPrimary)', borderRadius: 10, overflow: 'hidden',
        padding: padded ? 12 : 0,
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Tabulky v podpanelech ─────────────────────────────────────────────────────

type Col = { label: string; width?: number; flex?: number; align?: 'left' | 'right' }

function TableHead({ cols }: { cols: Col[] }) {
  return (
    <div style={{ display: 'flex', background: 'var(--bgSecondary)' }}>
      {cols.map(c => (
        <div
          key={c.label}
          className={c.align === 'right' ? 'th-right' : undefined}
          style={{
            width: c.width, flex: c.flex, minWidth: 0, flexShrink: c.width ? 0 : 1,
            pointerEvents: 'none',
          }}
        >
          {c.label
            ? <TableHeaderCell size="dense" label={c.label} width="100%" />
            : <TableHeaderCell size="dense" empty width="100%" />}
        </div>
      ))}
    </div>
  )
}

// Předpis a úhrady v jedné tabulce: každá splátka drží na svém řádku i to, čím
// byla pokrytá. Dva samostatné sloupce vedle sebe tuhle vazbu neukázaly —
// nešlo z nich přečíst, která splátka ještě čeká na peníze.
// Úhrady se rozpouštějí do splátek podle splatnosti (nejstarší nezaplacená první).
function parujPredpisAUhrady(splatky: typeof ZALOHA_SPLATKY, uhrady: PlatbaRow[]) {
  const zbytky = uhrady.map(u => ({ ...u, zbytek: u.castka }))
  const rows = splatky.map(s => {
    let uhrazeno = 0
    const zdroje: Array<{ datum: string; forma: string; castka: number }> = []
    for (const u of zbytky) {
      const chybi = s.castka - uhrazeno
      if (chybi <= 0) break
      if (u.zbytek <= 0) continue
      const pouzito = Math.min(chybi, u.zbytek)
      u.zbytek -= pouzito
      uhrazeno += pouzito
      zdroje.push({ datum: u.datum, forma: formaLabel(u.forma), castka: pouzito })
    }
    return { ...s, uhrazeno, zdroje }
  })
  const nadPredpis = zbytky.reduce((sum, u) => sum + Math.max(0, u.zbytek), 0)
  return { rows, nadPredpis }
}

// Řádek tabulky — linka patří řádku, ne buňkám. Kdyby ji kreslila každá buňka
// zvlášť, u různě vysokých buněk by se čára lámala do schodů.
function Row({ children, tone = 'data', last }: {
  children: React.ReactNode
  tone?: 'data' | 'total'
  /** Poslední řádek tabulky nekreslí linku — ta by visela na okraji panelu. */
  last?: boolean
}) {
  return (
    <div
      className="table-row"
      style={{
        display: 'flex', alignItems: 'stretch',
        background: tone === 'total' ? 'var(--bgSecondary)' : 'transparent',
        borderBottom: tone === 'total' || last ? 'none' : '1px solid var(--borderPrimary)',
      }}
    >
      {children}
    </div>
  )
}

function PredpisTable({
  uhrady, onZadatUhradu,
}: {
  uhrady: PlatbaRow[]
  onZadatUhradu: (zbyva: number) => void
}) {
  const { rows, nadPredpis } = parujPredpisAUhrady(ZALOHA_SPLATKY, uhrady)

  // Jediný pružný sloupec je úhrada — zbytek má pevnou šířku, aby čísla stála
  // hned vedle svého popisku a nevznikla mezi nimi prázdná plocha.
  const W = { splatka: 110, splatnost: 120, penize: 130, stav: 120, akce: 150 }
  const cols: Col[] = [
    { label: 'Splátka', width: W.splatka },
    { label: 'Splatnost', width: W.splatnost },
    { label: 'Předepsáno', width: W.penize, align: 'right' },
    { label: 'Uhrazeno', width: W.penize, align: 'right' },
    { label: 'Úhrada', flex: 1 },
    { label: 'Stav', width: W.stav },
    { label: '', width: W.akce },
  ]

  function stav(predepsano: number, uhrazeno: number) {
    if (uhrazeno >= predepsano) return { label: 'Uhrazeno', variant: 'success' as TagVariant }
    if (uhrazeno > 0) return { label: 'Částečně', variant: 'warning' as TagVariant }
    return { label: 'Čeká', variant: 'neutral' as TagVariant }
  }

  // Jeden zdroj se vypíše celý, víc zdrojů se zkrátí na první + počet zbylých,
  // ať řádek zůstane jednořádkový a tabulka čitelná.
  function zdrojLabel(zdroje: Array<{ datum: string; forma: string; castka: number }>) {
    if (zdroje.length === 0) return '—'
    const first = `${zdroje[0].datum} · ${zdroje[0].forma}`
    return zdroje.length === 1 ? first : `${first} + ${zdroje.length - 1} další`
  }

  const cell = { size: 'dense' as const, width: '100%', hovered: false, borderBottom: false }
  const posledni = nadPredpis <= 0

  return (
    <div style={{ overflowX: 'auto' }}>
      <TableHead cols={cols} />

      {rows.map((r, i) => {
        const st = stav(r.castka, r.uhrazeno)
        return (
          <Row key={r.id} last={posledni && i === rows.length - 1}>
            <div style={{ width: W.splatka, flexShrink: 0 }}>
              <TableCell {...cell} label={r.label} />
            </div>
            <div style={{ width: W.splatnost, flexShrink: 0 }}>
              <TableCell {...cell} label={r.splatnost} />
            </div>
            <div style={{ width: W.penize, flexShrink: 0 }}>
              <TableCell {...cell} align="right" label={formatCena(r.castka)} />
            </div>
            <div style={{ width: W.penize, flexShrink: 0 }}>
              <TableCell
                {...cell} align="right"
                content={
                  <span style={{
                    ...typography.body14Semibold,
                    color: r.uhrazeno > 0 ? 'var(--textSuccessPrimary)' : 'var(--textSecondary)',
                  }}>
                    {formatCena(r.uhrazeno)}
                  </span>
                }
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TableCell {...cell} label={zdrojLabel(r.zdroje)} />
            </div>
            <div style={{ width: W.stav, flexShrink: 0 }}>
              <TableCell {...cell} content={<Tag label={st.label} variant={st.variant} size="sm" lead="indicator" />} />
            </div>
            <div style={{ width: W.akce, flexShrink: 0 }}>
              <TableCell
                {...cell}
                content={
                  r.uhrazeno >= r.castka ? null : (
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <TextButton
                        label="Zadat úhradu"
                        variant="brand"
                        size="sm"
                        leadIcon={Plus}
                        onClick={() => onZadatUhradu(r.castka - r.uhrazeno)}
                      />
                    </span>
                  )
                }
              />
            </div>
          </Row>
        )
      })}

      {/* Peníze nad rámec předpisu — jinak by se v tabulce ztratily */}
      {nadPredpis > 0 && (
        <Row last>
          <div style={{ width: W.splatka + W.splatnost, flexShrink: 0 }}>
            <TableCell {...cell} label="Nad předpis" />
          </div>
          <div style={{ width: W.penize, flexShrink: 0 }}>
            <TableCell {...cell} align="right" label="—" />
          </div>
          <div style={{ width: W.penize, flexShrink: 0 }}>
            <TableCell
              {...cell} align="right"
              content={
                <span style={{ ...typography.body14Semibold, color: 'var(--textSuccessPrimary)' }}>
                  {formatCena(nadPredpis)}
                </span>
              }
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TableCell {...cell} label="přijato víc, než je předepsané" />
          </div>
          <div style={{ width: W.stav, flexShrink: 0 }}>
            <TableCell {...cell} content={<Tag label="K vypořádání" variant="neutral" size="sm" lead="indicator" />} />
          </div>
          <div style={{ width: W.akce, flexShrink: 0 }}>
            <TableCell {...cell} label="" />
          </div>
        </Row>
      )}
    </div>
  )
}

// Zaznamenané platby kroku — jediné místo, kde se dá zapsaná platba opravit nebo
// odebrat. Řádek je záznam platby, ne splátka předpisu, takže se čte i tehdy, když
// jedna platba pokryla víc splátek.
function PlatbyTable({
  rows, onEdit, onDelete, soucetLabel,
}: {
  rows: PlatbaRow[]
  onEdit: (p: PlatbaRow) => void
  onDelete: (p: PlatbaRow) => void
  /** Když je uvedený, tabulku uzavře součtový řádek s tímto popiskem. */
  soucetLabel?: string
}) {
  const W = { datum: 110, forma: 140, penize: 130, akce: 92 }
  const cols: Col[] = [
    { label: 'Datum', width: W.datum },
    { label: 'Účel platby', flex: 1 },
    { label: 'Forma', width: W.forma },
    { label: 'Částka', width: W.penize, align: 'right' },
    { label: '', width: W.akce },
  ]
  const cell = { size: 'dense' as const, width: '100%', hovered: false, borderBottom: false }
  const celkem = rows.reduce((s, p) => s + p.castka, 0)

  return (
    <div style={{ overflowX: 'auto' }}>
      <TableHead cols={cols} />

      {rows.map((p, i) => (
        <Row key={p.id} last={!soucetLabel && i === rows.length - 1}>
          <div style={{ width: W.datum, flexShrink: 0 }}>
            <TableCell {...cell} label={p.datum} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TableCell {...cell} label={ucelLabel(p.ucel)} />
          </div>
          <div style={{ width: W.forma, flexShrink: 0 }}>
            <TableCell {...cell} label={formaLabel(p.forma)} />
          </div>
          <div style={{ width: W.penize, flexShrink: 0 }}>
            <TableCell {...cell} align="right" label={formatCena(p.castka)} />
          </div>
          <div style={{ width: W.akce, flexShrink: 0 }}>
            <TableCell
              {...cell}
              content={
                <span style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <IconButton icon={Pencil} variant="ghost" size="md" tooltip="Upravit platbu" onClick={() => onEdit(p)} />
                  <span className="icon-trash-primary">
                    <IconButton icon={Trash2} variant="ghost" size="md" tooltip="Smazat platbu" onClick={() => onDelete(p)} />
                  </span>
                </span>
              }
            />
          </div>
        </Row>
      ))}

      {soucetLabel && (
        <Row tone="total">
          <div style={{ width: W.datum, flexShrink: 0 }}>
            <TableCell {...cell} label="" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TableCell
              {...cell} align="right"
              content={<span style={{ ...typography.body12Medium, color: 'var(--textSecondary)' }}>{soucetLabel}</span>}
            />
          </div>
          <div style={{ width: W.forma, flexShrink: 0 }}>
            <TableCell {...cell} label="" />
          </div>
          <div style={{ width: W.penize, flexShrink: 0 }}>
            <TableCell
              {...cell} align="right"
              content={<span style={{ ...typography.body14Semibold, color: 'var(--textSuccessPrimary)' }}>{formatCena(celkem)}</span>}
            />
          </div>
          <div style={{ width: W.akce, flexShrink: 0 }}>
            <TableCell {...cell} label="" />
          </div>
        </Row>
      )}
    </div>
  )
}

// Zdroje úhrady provize. Uhrazená provize se rozpouští do zdrojů v jejich
// pořadí, takže je z řádku vidět, co už doteklo a co ještě čeká — a rovnou
// odsud se dá úhrada zadat, bez skoku na tlačítko v hlavičce karty.
function ZdrojeProvizeTable({
  provizeUhrazeno, onZadatUhradu, locked,
}: {
  provizeUhrazeno: number
  onZadatUhradu: (z: ZdrojProvize, zbyva: number) => void
  /** Důvod, proč se úhrada zadat nedá. Bez něj jsou řádky plně ovladatelné. */
  locked?: string
}) {
  const W = { penize: 130, stav: 130, akce: 150 }
  const cols: Col[] = [
    { label: 'Zdroj', flex: 1 },
    { label: 'Částka', width: W.penize, align: 'right' },
    { label: 'Uhrazeno', width: W.penize, align: 'right' },
    { label: 'Stav', width: W.stav },
    { label: '', width: W.akce },
  ]

  let zbytek = provizeUhrazeno
  const rows = PROVIZE_ZDROJE.map(z => {
    const uhrazeno = Math.min(z.castka, Math.max(0, zbytek))
    zbytek -= uhrazeno
    return { ...z, uhrazeno, zbyva: z.castka - uhrazeno }
  })

  const cell = { size: 'dense' as const, width: '100%', hovered: false, borderBottom: false }

  return (
    <div style={{ overflowX: 'auto' }}>
      <TableHead cols={cols} />

      {rows.map(z => {
        const plne = z.zbyva <= 0
        const stav: { label: string; variant: TagVariant } = plne
          ? { label: 'Uhrazeno', variant: 'success' }
          : z.uhrazeno > 0
            ? { label: 'Částečně', variant: 'warning' }
            : { label: z.cekaLabel, variant: 'neutral' }
        return (
          <Row key={z.id}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TableCell
                {...cell}
                content={
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ ...typography.body14Medium, color: 'var(--textPrimary)' }}>{z.nazev}</span>
                    <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>{z.popis}</span>
                  </span>
                }
              />
            </div>
            <div style={{ width: W.penize, flexShrink: 0 }}>
              <TableCell {...cell} align="right" label={formatCena(z.castka)} />
            </div>
            <div style={{ width: W.penize, flexShrink: 0 }}>
              <TableCell
                {...cell} align="right"
                content={
                  <span style={{
                    ...typography.body14Semibold,
                    color: z.uhrazeno > 0 ? 'var(--textSuccessPrimary)' : 'var(--textSecondary)',
                  }}>
                    {formatCena(z.uhrazeno)}
                  </span>
                }
              />
            </div>
            <div style={{ width: W.stav, flexShrink: 0 }}>
              <TableCell {...cell} content={<Tag label={stav.label} variant={stav.variant} size="sm" lead="indicator" />} />
            </div>
            <div style={{ width: W.akce, flexShrink: 0 }}>
              <TableCell
                {...cell}
                content={
                  plne ? null : (
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {locked ? (
                        <Tooltip content={locked} placement="top">
                          <span>
                            <TextButton label="Zadat úhradu" variant="brand" size="sm" leadIcon={Plus} disabled />
                          </span>
                        </Tooltip>
                      ) : (
                        <TextButton
                          label="Zadat úhradu"
                          variant="brand"
                          size="sm"
                          leadIcon={Plus}
                          onClick={() => onZadatUhradu(z, z.zbyva)}
                        />
                      )}
                    </span>
                  )
                }
              />
            </div>
          </Row>
        )
      })}

      <Row tone="total">
        <div style={{ flex: 1, minWidth: 0 }}>
          <TableCell
            {...cell}
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>Provize celkem s DPH</span>}
          />
        </div>
        <div style={{ width: W.penize, flexShrink: 0 }}>
          <TableCell
            {...cell} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(PROVIZE.sDph)}</span>}
          />
        </div>
        <div style={{ width: W.penize, flexShrink: 0 }}>
          <TableCell
            {...cell} align="right"
            content={
              <span style={{
                ...typography.body14Semibold,
                color: provizeUhrazeno > 0 ? 'var(--textSuccessPrimary)' : 'var(--textSecondary)',
              }}>
                {formatCena(provizeUhrazeno)}
              </span>
            }
          />
        </div>
        <div style={{ width: W.stav, flexShrink: 0 }}>
          <TableCell {...cell} label="" />
        </div>
        <div style={{ width: W.akce, flexShrink: 0 }}>
          <TableCell {...cell} label="" />
        </div>
      </Row>
    </div>
  )
}

function NakladyTable({
  rows, onEdit, onDelete,
}: {
  rows: NakladRow[]
  onEdit: (r: NakladRow) => void
  onDelete: (r: NakladRow) => void
}) {
  const cols: Col[] = [
    { label: 'Datum', width: 110 },
    { label: 'Náklad', flex: 1 },
    { label: 'Kategorie', flex: 1 },
    { label: 'Bez DPH', width: 130, align: 'right' },
    { label: 'DPH', width: 110, align: 'right' },
    { label: 'S DPH', width: 130, align: 'right' },
    { label: '', width: 92 },
  ]
  const soucty = nakladySoucty(rows)
  return (
    <div style={{ overflowX: 'auto' }}>
      <TableHead cols={cols} />
      {rows.map(r => {
        const dph = r.sDph - r.bezDph
        return (
          <Row key={r.id}>
            <div style={{ width: 110, flexShrink: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} label={r.datum} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TableCell
                size="dense" width="100%" hovered={false}
                content={
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ ...typography.body14Medium, color: 'var(--textPrimary)' }}>{r.nazev}</span>
                    <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>{r.dodavatel}</span>
                  </span>
                }
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} label={r.kategorie} />
            </div>
            <div style={{ width: 130, flexShrink: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} align="right" label={formatCena(r.bezDph)} />
            </div>
            <div style={{ width: 110, flexShrink: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} align="right" label={dph === 0 ? '—' : formatCena(dph)} />
            </div>
            <div style={{ width: 130, flexShrink: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} align="right" label={formatCena(r.sDph)} />
            </div>
            <div style={{ width: 92, flexShrink: 0 }}>
              <TableCell
                size="dense" width="100%" hovered={false}
                content={
                  <span style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <IconButton icon={Pencil} variant="ghost" size="md" tooltip="Upravit náklad" onClick={() => onEdit(r)} />
                    <span className="icon-trash-primary">
                      <IconButton icon={Trash2} variant="ghost" size="md" tooltip="Smazat náklad" onClick={() => onDelete(r)} />
                    </span>
                  </span>
                }
              />
            </div>
          </Row>
        )
      })}
      <Row tone="total">
        <div style={{ width: 110, flexShrink: 0 }}>
          <TableCell size="dense" width="100%" hovered={false} label="" />
        </div>
        <div style={{ flex: 2, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} align="right"
            content={<span style={{ ...typography.body12Medium, color: 'var(--textSecondary)' }}>Náklady celkem:</span>}
          />
        </div>
        <div style={{ width: 130, flexShrink: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(soucty.bezDph)}</span>}
          />
        </div>
        <div style={{ width: 110, flexShrink: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(soucty.dph)}</span>}
          />
        </div>
        <div style={{ width: 130, flexShrink: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(soucty.sDph)}</span>}
          />
        </div>
        <div style={{ width: 92, flexShrink: 0 }}>
          <TableCell size="dense" width="100%" hovered={false} label="" />
        </div>
      </Row>
    </div>
  )
}

function RozpadTable({ nakladyBezDph, vyuctovano }: { nakladyBezDph: number; vyuctovano: boolean }) {
  const cols: Col[] = [
    { label: 'Jméno', flex: 3 },
    { label: 'Pozice', flex: 2 },
    { label: 'Provize', flex: 2, align: 'right' },
    { label: 'Náklady', flex: 2, align: 'right' },
    { label: 'K výplatě', flex: 2, align: 'right' },
    { label: 'Stav', width: 140 },
  ]
  const rows = rozpadRows(nakladyBezDph)
  const kVyplateCelkem = rows.reduce((s, r) => s + r.kVyplate, 0)
  return (
    <div>
      <TableHead cols={cols} />
      {rows.map(r => (
        <Row key={r.jmeno}>
          <div style={{ flex: 3, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} label={r.jmeno} />
          </div>
          <div style={{ flex: 2, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} label={r.pozice} />
          </div>
          <div style={{ flex: 2, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} align="right" label={formatCena(r.provize)} />
          </div>
          <div style={{ flex: 2, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} align="right" label={r.naklady === 0 ? '—' : formatCena(r.naklady)} />
          </div>
          <div style={{ flex: 2, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} align="right" label={formatCena(r.kVyplate)} />
          </div>
          <div style={{ width: 140, flexShrink: 0 }}>
            <TableCell
              size="dense" width="100%" hovered={false}
              content={
                <Tag
                  label={vyuctovano ? 'K výplatě' : 'K fakturaci'}
                  variant={vyuctovano ? 'success' : 'warning'}
                  size="sm"
                  lead="indicator"
                />
              }
            />
          </div>
        </Row>
      ))}
      <Row tone="total">
        <div style={{ flex: 5, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} align="right"
            content={<span style={{ ...typography.body12Medium, color: 'var(--textSecondary)' }}>K výplatě celkem:</span>}
          />
        </div>
        <div style={{ flex: 2, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(PROVIZE.bezDph)}</span>}
          />
        </div>
        <div style={{ flex: 2, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(nakladyBezDph)}</span>}
          />
        </div>
        <div style={{ flex: 2, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textSuccessPrimary)' }}>{formatCena(kVyplateCelkem)}</span>}
          />
        </div>
        <div style={{ width: 140, flexShrink: 0 }}>
          <TableCell size="dense" width="100%" hovered={false} label="" />
        </div>
      </Row>
    </div>
  )
}

// ── Hero karta provize ────────────────────────────────────────────────────────

function ProvizeHero() {
  return (
    <div style={{
      background: 'var(--bgPrimary)', border: '1px solid var(--borderPrimary)', borderRadius: 12,
      padding: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ ...typography.body16Semibold, color: 'var(--textPrimary)' }}>Provize zakázky</span>
        <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>
          Odměna kanceláře za zprostředkování
        </span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <span style={{ ...typography.overline11, color: 'var(--textTertiary)' }}>Bez DPH</span>
          <span style={{ ...typography.headline20, color: 'var(--textPrimary)', whiteSpace: 'nowrap' }}>
            {formatCena(PROVIZE.bezDph)}
          </span>
        </div>
        <span style={{ width: 1, height: 40, background: 'var(--borderPrimary)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <span style={{ ...typography.overline11, color: 'var(--textTertiary)' }}>
            S DPH · DPH {DPH_SAZBA} % = {formatCena(PROVIZE.dph)}
          </span>
          <span style={{ ...typography.headline20, color: 'var(--textPrimary)', whiteSpace: 'nowrap' }}>
            {formatCena(PROVIZE.sDph)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Hlavní komponenta ─────────────────────────────────────────────────────────

export default function VyporadaniPlateb() {
  const [naklady, setNaklady] = useState<NakladRow[]>(NAKLADY)
  const [novyNakladOpen, setNovyNakladOpen] = useState(false)
  const [editNaklad, setEditNaklad] = useState<NakladRow | null>(null)
  const [deleteNaklad, setDeleteNaklad] = useState<NakladRow | null>(null)

  // Platby, které uživatel zpracoval v okně Zpracování plateb, posouvají čísla
  // ve všech třech krocích — proto sedí ve stavu jako jeden seznam, ne jako tři
  // nezávislé součty. Oprava jedné platby se tak dopočítá všude.
  const [platby, setPlatby] = useState<PlatbaRow[]>(PLATBY)
  const [platbyModal, setPlatbyModal] = useState<{ ucel: string; castka?: string } | null>(null)
  const [editPlatba, setEditPlatba] = useState<PlatbaRow | null>(null)
  const [deletePlatba, setDeletePlatba] = useState<PlatbaRow | null>(null)

  // Vyúčtování je poslední krok cesty — odemkne se, až je provize celá uhrazená.
  const [vyuctovaniOpen, setVyuctovaniOpen] = useState(false)
  const [vyuctovano, setVyuctovano] = useState(false)

  const zalohaUhrady = platby.filter(p => UCEL_NA_ZALOHU.includes(p.ucel))
  const zalohaUhrazeno = soucetPlateb(platby, UCEL_NA_ZALOHU)
  const rezervaceVyporadano = soucetPlateb(platby, UCEL_Z_REZERVACE)
  const provizeUhrazeno = soucetPlateb(platby, UCEL_NA_PROVIZI)

  // Převod zálohy na provizi je jedna platba, která z rezervace ubírá a na provizi
  // přičítá — proto stojí v seznamu obou kroků a upravuje se z obou míst tatáž.
  const rezervacePlatby = platby.filter(
    p => UCEL_NA_ZALOHU.includes(p.ucel) || UCEL_Z_REZERVACE.includes(p.ucel),
  )
  const provizePlatby = platby.filter(p => UCEL_NA_PROVIZI.includes(p.ucel))

  const zalohaZbyva = Math.max(0, ZALOHA_PREDEPSANO - zalohaUhrazeno)
  const zalohaPct = pctOf(zalohaUhrazeno, ZALOHA_PREDEPSANO)
  const zalohaUhrazena = zalohaZbyva === 0
  const penizeVRezervaci = zalohaUhrazeno - rezervaceVyporadano

  const provizeZbyva = PROVIZE.sDph - provizeUhrazeno
  const provizePct = pctOf(provizeUhrazeno, PROVIZE.sDph)
  const provizeVyresena = provizeZbyva <= 0

  const soucty = nakladySoucty(naklady)
  const kVyplate = PROVIZE.bezDph - soucty.bezDph
  const dphOdvod = PROVIZE.dph - soucty.dph

  // Kroky na sebe navazují: provize se řeší až z vyřešené zálohy, vyúčtování až
  // z uhrazené provize. Krok, na který ještě nepřišla řada, je proto zamčený.
  const provizeZamcena = !zalohaUhrazena
  const vyuctovaniZamcene = !provizeVyresena

  // Otevřený je jen krok, na kterém se pracuje — čekající i vyřešený se sbalí, aby
  // pohled držel na jednom místě a shrnutí v hlavičce stačilo. Výjimka je poslední
  // krok: vyúčtováním zakázka končí, takže rozpad do struktury zůstává vidět.
  // Ruční sklopení chevronem drží do další změny stavu.
  const zalohaAktivni = !zalohaUhrazena
  const provizeAktivni = !provizeZamcena && !provizeVyresena
  const vyuctovaniAktivni = !vyuctovaniZamcene

  const [openZaloha, setOpenZaloha] = useState(zalohaAktivni)
  const [openProvize, setOpenProvize] = useState(provizeAktivni)
  const [openVyuctovani, setOpenVyuctovani] = useState(vyuctovaniAktivni)

  useEffect(() => { setOpenZaloha(zalohaAktivni) }, [zalohaAktivni])
  useEffect(() => { setOpenProvize(provizeAktivni) }, [provizeAktivni])
  useEffect(() => { setOpenVyuctovani(vyuctovaniAktivni) }, [vyuctovaniAktivni])

  function confirmDelete() {
    if (deleteNaklad) setNaklady(rows => rows.filter(r => r.id !== deleteNaklad.id))
    setDeleteNaklad(null)
  }

  // Rekapitulace v okně počítá „zbývá“ ze stavu před zpracováním. Při úpravě
  // platby se proto její vlastní částka do vstupních čísel nezapočítává — jinak by
  // se upravovaná platba počítala dvakrát.
  function souhrnBez(id?: number) {
    const rows = id === undefined ? platby : platby.filter(p => p.id !== id)
    return {
      rezervaceSlozeno: soucetPlateb(rows, UCEL_NA_ZALOHU),
      rezervaceVyporadano: soucetPlateb(rows, UCEL_Z_REZERVACE),
      provizeCelkem: PROVIZE.sDph,
      provizeUhrazeno: soucetPlateb(rows, UCEL_NA_PROVIZI),
      poplatekVCene: false,
    }
  }

  // Zpracované platby se zapíšou do seznamu, jejich dopad na zálohu, rezervaci
  // a provizi si každý krok spočítá sám z účelu.
  function handleZpracovatPlatby(drafts: PlatbaDraft[]) {
    let nextId = Math.max(0, ...platby.map(p => p.id))
    const nove: PlatbaRow[] = []

    for (const d of drafts) {
      const castka = parseCastka(d.castka)
      if (castka <= 0 || !d.ucel) continue
      nextId += 1
      nove.push({
        id: nextId,
        datum: d.splatnost ? formatDatum(d.splatnost) : '—',
        ucel: d.ucel,
        forma: d.forma,
        castka,
      })
    }

    if (nove.length > 0) setPlatby(rows => [...rows, ...nove])
  }

  function handleUpravitPlatbu(drafts: PlatbaDraft[]) {
    const d = drafts[0]
    if (!d || !editPlatba) return
    setPlatby(rows => rows.map(r => (r.id === editPlatba.id
      ? {
        ...r,
        ucel: d.ucel,
        forma: d.forma,
        castka: parseCastka(d.castka),
        datum: d.splatnost ? formatDatum(d.splatnost) : r.datum,
      }
      : r)))
  }

  function confirmDeletePlatba() {
    if (deletePlatba) setPlatby(rows => rows.filter(r => r.id !== deletePlatba.id))
    setDeletePlatba(null)
  }

  return (
    // Karta provize je samostatné sdělení nad sekcí — 24px k ní, 16px mezi kartami kroků
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ProvizeHero />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ ...typography.headline20, color: 'var(--textPrimary)' }}>Vypořádání plateb</span>
          <div style={{ marginLeft: 'auto' }}>
            <Button label="Nový náklad" variant="outlined" size="md" leadIcon={Plus} onClick={() => setNovyNakladOpen(true)} />
          </div>
        </div>

        {/* ── Krok 1 — rezervační záloha ─────────────────────────────────────── */}
        <StepCard
          title="Rezervační záloha"
          tooltip="Rezervační zálohu může klient uhradit ve více splátkách. Po vypořádání se započítá do provize za zprostředkování."
          status={{ label: zalohaUhrazena ? 'Vyřešeno' : 'V řešení', variant: zalohaUhrazena ? 'success' : 'info' }}
          summary={<>uhrazeno <strong style={{ color: 'var(--textSuccessPrimary)' }}>{formatCena(zalohaUhrazeno)}</strong> · {zalohaPct} %</>}
          open={openZaloha}
          onToggle={() => setOpenZaloha(o => !o)}
          actions={
            penizeVRezervaci > 0 ? (
              <Button
                label="Vypořádat rezervační zálohu" variant="primary" size="md"
                onClick={() => setPlatbyModal({
                  ucel: 'prevod-rp-na-provizi',
                  castka: String(penizeVRezervaci),
                })}
              />
            ) : (
              <Tooltip content="V rezervaci nezbývají peníze k vypořádání." placement="top">
                <span>
                  <Button label="Vypořádat rezervační zálohu" variant="outlined" size="md" disabled />
                </span>
              </Tooltip>
            )
          }
        >
          <StatStrip
            items={[
              { label: 'Předepsáno', value: formatCena(ZALOHA_PREDEPSANO) },
              { label: 'Uhrazeno', value: formatCena(zalohaUhrazeno), valueColor: 'var(--textSuccessPrimary)' },
              {
                label: 'Stav úhrady',
                value: '',
                // Tři stavy, ne dva: dokud nedošla první koruna, není záloha
                // „částečně uhrazená“ — stejné odstupňování má i karta provize.
                tag: zalohaUhrazena
                  ? { label: 'Plně uhrazena', variant: 'success' }
                  : zalohaUhrazeno > 0
                    ? { label: 'Částečně uhrazena', variant: 'warning' }
                    : { label: 'Neuhrazena', variant: 'neutral' },
                // Kolik ještě chybí, se v této kartě nikde jinde neukáže — bez grafu
                // to nese poznámka u stavu úhrady.
                note: zalohaUhrazena ? undefined : `zbývá doplatit ${formatCena(zalohaZbyva)}`,
              },
              {
                label: 'Peníze v rezervaci',
                value: `${penizeVRezervaci > 0 ? '+ ' : ''}${formatCena(penizeVRezervaci)}`,
                valueColor: penizeVRezervaci > 0 ? 'var(--textSuccessPrimary)' : 'var(--textSecondary)',
                note: penizeVRezervaci > 0 ? 'k vypořádání' : 'vypořádáno',
              },
            ]}
          />

          <SubPanel
            title="Předpis a úhrady"
            meta={`${pocet(ZALOHA_SPLATKY.length, ['splátka předepsaná', 'splátky předepsané', 'splátek předepsaných'])} · ${pocet(zalohaUhrady.length, ['úhrada', 'úhrady', 'úhrad'])}`}
            padded={false}
          >
            <PredpisTable
              uhrady={zalohaUhrady}
              onZadatUhradu={zbyva => setPlatbyModal({
                ucel: 'rezervacni-poplatek',
                castka: zbyva > 0 ? String(zbyva) : undefined,
              })}
            />
          </SubPanel>

          {/* Zapsané platby stojí vedle předpisu: předpis říká, co je pokryté,
              tenhle seznam drží samotné záznamy — a jen tady se dají opravit.
              Dokud žádná platba není, panel se nezobrazuje: akci nese tlačítko
              v hlavičce karty, prázdná tabulka by tu jen zabírala místo. */}
          {rezervacePlatby.length > 0 && (
            <SubPanel
              title="Zaznamenané platby"
              meta={`${pocet(rezervacePlatby.length, ['platba', 'platby', 'plateb'])} k rezervační záloze`}
              padded={false}
            >
              <PlatbyTable
                rows={rezervacePlatby}
                onEdit={setEditPlatba}
                onDelete={setDeletePlatba}
              />
            </SubPanel>
          )}
        </StepCard>

        {/* ── Krok 2 — provize za zprostředkování ────────────────────────────── */}
        <StepCard
          title="Provize za zprostředkování"
          tooltip="Provize se hradí ze dvou zdrojů: započtením rezervační zálohy a doplatkem z kupní ceny při zobchodování zakázky. Řeší se, až je rezervační záloha vyřešená."
          status={
            provizeVyresena
              ? { label: 'Vyřešeno', variant: 'success' }
              : provizeZamcena
                ? { label: 'Čeká', variant: 'neutral' }
                : { label: 'V řešení', variant: 'info' }
          }
          summary={<>uhrazeno <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(provizeUhrazeno)}</strong> · {provizePct} %</>}
          open={openProvize}
          onToggle={() => setOpenProvize(o => !o)}
          actions={
            // Dokud není záloha vyřešená, nemá se provize čím uhradit — tlačítko to
            // řekne v tooltipu, místo aby otevřelo okno, které nemá co uložit.
            provizeZamcena ? (
              <Tooltip content="Nejprve vyřešte rezervační zálohu." placement="top">
                <span>
                  <Button label="Zadat úhradu provize" variant="outlined" size="md" disabled />
                </span>
              </Tooltip>
            ) : provizeVyresena ? (
              <Tooltip content="Provize je celá uhrazená." placement="top">
                <span>
                  <Button label="Zadat úhradu provize" variant="outlined" size="md" disabled />
                </span>
              </Tooltip>
            ) : (
              <Button
                label="Zadat úhradu provize" variant="primary" size="md"
                onClick={() => setPlatbyModal({
                  ucel: 'uhrada-nekryte-provize',
                  castka: String(provizeZbyva),
                })}
              />
            )
          }
        >
          <StatStrip
            items={[
              { label: 'Výše provize', value: formatCena(PROVIZE.sDph), note: 's DPH' },
              { label: 'Uhrazeno', value: formatCena(provizeUhrazeno), valueColor: provizeUhrazeno > 0 ? 'var(--textSuccessPrimary)' : undefined },
              {
                label: 'Stav úhrady',
                value: '',
                tag: provizeZbyva === 0
                  ? { label: 'Plně uhrazena', variant: 'success' }
                  : provizeUhrazeno > 0
                    ? { label: 'Částečně uhrazena', variant: 'warning' }
                    : { label: 'Neuhrazeno', variant: 'neutral' },
              },
              { label: 'Peníze na provizi', value: formatCena(provizeUhrazeno), note: 'k vypořádání' },
            ]}
          />

          <ProgressRow
            caption={<>Uhrazeno <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(provizeUhrazeno)}</strong> z {formatCena(PROVIZE.sDph)}</>}
            pct={provizePct}
            tone="brand"
          />

          <SubPanel
            title="Zdroj úhrady provize"
            meta={`${pocet(PROVIZE_ZDROJE.length, ['zdroj', 'zdroje', 'zdrojů'])} · celkem ${formatCena(PROVIZE.sDph)}`}
            padded={false}
          >
            <ZdrojeProvizeTable
              provizeUhrazeno={provizeUhrazeno}
              locked={provizeZamcena ? 'Nejprve vyřešte rezervační zálohu.' : undefined}
              onZadatUhradu={(z, zbyva) => setPlatbyModal({
                ucel: z.ucel,
                castka: zbyva > 0 ? String(zbyva) : undefined,
              })}
            />
          </SubPanel>

          {/* Vypořádání zálohy se na provizi propíše samo. Bez tohohle seznamu by
              provize skočila na „uhrazeno“, aniž by šlo dohlédnout na platbu za tím
              — a hlavně by se nedala opravit. Než první platba doteče, panel tu
              není: zdroje úhrady nad ním už říkají, co se čeká. */}
          {provizePlatby.length > 0 && (
            <SubPanel
              title="Zaznamenané platby"
              meta={`${pocet(provizePlatby.length, ['platba', 'platby', 'plateb'])} na provizi`}
              padded={false}
            >
              <PlatbyTable
                rows={provizePlatby}
                onEdit={setEditPlatba}
                onDelete={setDeletePlatba}
                soucetLabel="Uhrazeno celkem:"
              />
            </SubPanel>
          )}
        </StepCard>

        {/* ── Krok 3 — vyúčtování zakázky ────────────────────────────────────── */}
        <StepCard
          title="Vyúčtování zakázky"
          tooltip="Vyúčtování rozdělí provizi do struktury a odečte náklady. Otevře se, až je provize za zprostředkování celá uhrazená."
          status={
            vyuctovano
              ? { label: 'Vyúčtováno', variant: 'success' }
              : vyuctovaniZamcene
                ? { label: 'Čeká', variant: 'neutral' }
                : { label: 'V řešení', variant: 'info' }
          }
          summary={
            vyuctovano
              ? <>vyúčtováno · k výplatě <strong style={{ color: 'var(--textSuccessPrimary)' }}>{formatCena(kVyplate)}</strong></>
              : <>nevyfakturováno · náklady <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(soucty.sDph)}</strong></>
          }
          open={openVyuctovani}
          onToggle={() => setOpenVyuctovani(o => !o)}
          actions={
            // Vyúčtování drží jen jedna podmínka: uhrazená provize. Dokud chybí,
            // tlačítko říká v tooltipu kolik — ne obecné „dokončete nastavení“.
            vyuctovano ? undefined : provizeVyresena ? (
              <Button
                label="Vyúčtovat zakázku" variant="primary" size="md"
                onClick={() => setVyuctovaniOpen(true)}
              />
            ) : (
              <Tooltip content={`Nejprve uhraďte celou provizi. Zbývá ${formatCena(provizeZbyva)}.`} placement="top">
                <span>
                  <Button label="Vyúčtovat zakázku" variant="outlined" size="md" disabled />
                </span>
              </Tooltip>
            )
          }
        >
          <StatStrip
            items={[
              { label: 'Provize', value: formatCena(PROVIZE.bezDph), note: `bez DPH · ${formatCena(PROVIZE.sDph)} s DPH` },
              { label: 'Náklady', value: `− ${formatCena(soucty.bezDph)}`, valueColor: 'var(--textDangerPrimary)', note: `bez DPH · ${formatCena(soucty.sDph)} s DPH` },
              { label: 'Výplaty', value: formatCena(kVyplate), valueColor: 'var(--textSuccessPrimary)', note: 'bez DPH · DPH dle příjemce' },
              { label: 'DPH - odvod', value: formatCena(dphOdvod), note: `výstup ${formatCena(PROVIZE.dph)} - vstup ${formatCena(soucty.dph)}` },
            ]}
          />

          <SubPanel
            title="Náklady na zakázku"
            meta={`${pocet(naklady.length, ['položka', 'položky', 'položek'])} · ${formatCena(soucty.sDph)}`}
            padded={false}
          >
            <NakladyTable rows={naklady} onEdit={setEditNaklad} onDelete={setDeleteNaklad} />
          </SubPanel>

          <SubPanel
            title="Rozpad provize do struktury"
            meta={<>k výplatě <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(kVyplate)}</strong></>}
            padded={false}
            note={vyuctovano ? undefined : (
              <Alert
                variant="warning"
                label="Dokud není zakázka ve stavu Zobchodováno, jsou uvedené údaje pouze orientační."
              />
            )}
          >
            <RozpadTable nakladyBezDph={soucty.bezDph} vyuctovano={vyuctovano} />
          </SubPanel>
        </StepCard>
      </div>

      {platbyModal && (
        <ZpracovaniPlatebModal
          onClose={() => setPlatbyModal(null)}
          onSave={handleZpracovatPlatby}
          defaultUcel={platbyModal.ucel}
          defaultCastka={platbyModal.castka}
          souhrn={souhrnBez()}
        />
      )}

      {/* Úprava jedné zapsané platby — stejné okno, jen o jednom řádku */}
      {editPlatba && (
        <ZpracovaniPlatebModal
          onClose={() => setEditPlatba(null)}
          onSave={handleUpravitPlatbu}
          editPlatba={{
            id: editPlatba.id,
            ucel: editPlatba.ucel,
            castka: String(editPlatba.castka),
            forma: editPlatba.forma,
            splatnost: parseDatum(editPlatba.datum),
          }}
          souhrn={souhrnBez(editPlatba.id)}
        />
      )}

      {novyNakladOpen && <NovyNakladModal onClose={() => setNovyNakladOpen(false)} />}

      {editNaklad && (
        <NovyNakladModal initialData={nakladToForm(editNaklad)} onClose={() => setEditNaklad(null)} />
      )}

      {deleteNaklad && (
        <ConfirmPortal>
          <Dialog
            icon={Trash2}
            title="Smazat náklad?"
            description={`Náklad ${deleteNaklad.nazev} za ${formatCena(deleteNaklad.sDph)} bude odebraný. Tuto akci nelze vrátit.`}
            primaryLabel="Smazat"
            secondaryLabel="Zrušit"
            destructive
            onPrimary={confirmDelete}
            onSecondary={() => setDeleteNaklad(null)}
          />
        </ConfirmPortal>
      )}

      {deletePlatba && (
        <ConfirmPortal>
          <Dialog
            icon={Trash2}
            title="Smazat platbu?"
            description={`Platba „${ucelLabel(deletePlatba.ucel)}“ za ${formatCena(deletePlatba.castka)} z ${deletePlatba.datum} bude odebraná a čísla ve všech krocích se přepočítají. Tuto akci nelze vrátit.`}
            primaryLabel="Smazat"
            secondaryLabel="Zrušit"
            destructive
            onPrimary={confirmDeletePlatba}
            onSecondary={() => setDeletePlatba(null)}
          />
        </ConfirmPortal>
      )}

      {vyuctovaniOpen && (
        <ConfirmPortal>
          <Dialog
            icon={FileCheck}
            title="Vyúčtovat zakázku?"
            description={`Provize ${formatCena(PROVIZE.bezDph)} bez DPH se rozdělí do struktury a odečtou se náklady ${formatCena(soucty.bezDph)}. K výplatě půjde ${formatCena(kVyplate)}.`}
            primaryLabel="Vyúčtovat"
            secondaryLabel="Zrušit"
            onPrimary={() => { setVyuctovano(true); setVyuctovaniOpen(false) }}
            onSecondary={() => setVyuctovaniOpen(false)}
          />
        </ConfirmPortal>
      )}
    </div>
  )
}
