import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  Button, IconButton, TextButton, Tag, Tooltip, TooltipIcon, TableCell, TableHeaderCell, Dialog, Alert,
  typography, type TagVariant,
} from '@matusgallo/mysabds'
import NovyNakladModal, { type NakladFormData } from './NovyNakladModal'
import ZpracovaniPlatebModal, {
  type PlatbaDraft, FORMA_OPT, UCEL_NA_PROVIZI, UCEL_Z_REZERVACE,
} from './ZpracovaniPlatebModal'

/* ──────────────────────────────────────────────────────────────────────────────
   Vypořádání plateb — nový návrh finanční části nabídky.

   Peníze putují ve třech krocích: rezervační záloha → provize za zprostředkování
   → vyúčtování zakázky. Každý krok je samostatná sklopná karta se stejnou
   anatomií (stav → čtyři klíčová čísla → kolik zbývá → detail v podpanelech),
   takže se čtou jako jedna cesta a ne jako tři nesouvisející tabulky.
   Aktivní krok má brand rámeček — uživatel hned vidí, kde je práce.
   Zavřená karta si nechává v hlavičce shrnutí, aby se dala číst i sklopená.
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

interface UhradaRow {
  id: number
  datum: string
  forma: string
  castka: number
}

const ZALOHA_UHRADY: UhradaRow[] = [
  { id: 1, datum: '02.07.2026', forma: 'Bankovní převod', castka: 50000 },
  { id: 2, datum: '09.07.2026', forma: 'Bankovní převod', castka: 50000 },
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
function parujPredpisAUhrady(splatky: typeof ZALOHA_SPLATKY, uhrady: UhradaRow[]) {
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
      zdroje.push({ datum: u.datum, forma: u.forma, castka: pouzito })
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
  uhrady: UhradaRow[]
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

// Zdroje úhrady provize. Uhrazená provize se rozpouští do zdrojů v jejich
// pořadí, takže je z řádku vidět, co už doteklo a co ještě čeká — a rovnou
// odsud se dá úhrada zadat, bez skoku na tlačítko v hlavičce karty.
function ZdrojeProvizeTable({
  provizeUhrazeno, onZadatUhradu,
}: {
  provizeUhrazeno: number
  onZadatUhradu: (z: ZdrojProvize, zbyva: number) => void
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
                      <TextButton
                        label="Zadat úhradu"
                        variant="brand"
                        size="sm"
                        leadIcon={Plus}
                        onClick={() => onZadatUhradu(z, z.zbyva)}
                      />
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

function RozpadTable({ nakladyBezDph }: { nakladyBezDph: number }) {
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
              content={<Tag label="K fakturaci" variant="warning" size="sm" lead="indicator" />}
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
  const [openZaloha, setOpenZaloha] = useState(true)
  const [openProvize, setOpenProvize] = useState(true)
  const [openVyuctovani, setOpenVyuctovani] = useState(true)

  const [naklady, setNaklady] = useState<NakladRow[]>(NAKLADY)
  const [novyNakladOpen, setNovyNakladOpen] = useState(false)
  const [editNaklad, setEditNaklad] = useState<NakladRow | null>(null)
  const [deleteNaklad, setDeleteNaklad] = useState<NakladRow | null>(null)

  // Platby, které uživatel zpracoval v okně Zpracování plateb, posouvají čísla
  // ve všech třech krocích — proto sedí ve stavu, ne v konstantách.
  const [uhrady, setUhrady] = useState<UhradaRow[]>(ZALOHA_UHRADY)
  const [rezervaceVyporadano, setRezervaceVyporadano] = useState(0)
  const [provizeUhrazeno, setProvizeUhrazeno] = useState(0)
  const [platbyModal, setPlatbyModal] = useState<{ ucel: string; castka?: string } | null>(null)

  const zalohaUhrazeno = uhrady.reduce((s, u) => s + u.castka, 0)
  const zalohaZbyva = Math.max(0, ZALOHA_PREDEPSANO - zalohaUhrazeno)
  const zalohaPct = pctOf(zalohaUhrazeno, ZALOHA_PREDEPSANO)
  const zalohaUhrazena = zalohaZbyva === 0
  const penizeVRezervaci = zalohaUhrazeno - rezervaceVyporadano

  const provizeZbyva = PROVIZE.sDph - provizeUhrazeno
  const provizePct = pctOf(provizeUhrazeno, PROVIZE.sDph)

  const soucty = nakladySoucty(naklady)
  const kVyplate = PROVIZE.bezDph - soucty.bezDph
  const dphOdvod = PROVIZE.dph - soucty.dph

  function confirmDelete() {
    if (deleteNaklad) setNaklady(rows => rows.filter(r => r.id !== deleteNaklad.id))
    setDeleteNaklad(null)
  }

  // Zpracované platby se rozdělí podle účelu: co doteče na provizi, co ubere
  // z peněz v rezervaci a co přibude jako další úhrada rezervačního poplatku.
  function handleZpracovatPlatby(platby: PlatbaDraft[]) {
    let naProvizi = 0
    let zRezervace = 0
    const noveUhrady: UhradaRow[] = []
    let nextId = Math.max(0, ...uhrady.map(u => u.id))

    for (const p of platby) {
      const castka = Number(p.castka.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0
      if (castka <= 0) continue
      if (UCEL_NA_PROVIZI.includes(p.ucel)) naProvizi += castka
      if (UCEL_Z_REZERVACE.includes(p.ucel)) zRezervace += castka
      if (p.ucel === 'rezervacni-poplatek') {
        nextId += 1
        noveUhrady.push({
          id: nextId,
          datum: p.splatnost ? formatDatum(p.splatnost) : '—',
          forma: FORMA_OPT.find(f => f.value === p.forma)?.label ?? 'Převodem',
          castka,
        })
      }
    }

    if (noveUhrady.length > 0) setUhrady(rows => [...rows, ...noveUhrady])
    if (naProvizi > 0) setProvizeUhrazeno(v => v + naProvizi)
    if (zRezervace > 0) setRezervaceVyporadano(v => v + zRezervace)
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
          status={{ label: zalohaUhrazena ? 'Vyřešeno' : 'V řešení', variant: zalohaUhrazena ? 'success' : 'brand' }}
          summary={<>uhrazeno <strong style={{ color: 'var(--textSuccessPrimary)' }}>{formatCena(zalohaUhrazeno)}</strong> · {zalohaPct} %</>}
          open={openZaloha}
          onToggle={() => setOpenZaloha(o => !o)}
          actions={
            <Button
              label="Vypořádat rezervační zálohu" variant="primary" size="md"
              onClick={() => setPlatbyModal({
                ucel: 'prevod-rp-na-provizi',
                castka: penizeVRezervaci > 0 ? String(penizeVRezervaci) : undefined,
              })}
            />
          }
        >
          <StatStrip
            items={[
              { label: 'Předepsáno', value: formatCena(ZALOHA_PREDEPSANO) },
              { label: 'Uhrazeno', value: formatCena(zalohaUhrazeno), valueColor: 'var(--textSuccessPrimary)' },
              {
                label: 'Stav úhrady',
                value: '',
                tag: { label: zalohaUhrazena ? 'Plně uhrazena' : 'Částečně uhrazena', variant: zalohaUhrazena ? 'success' : 'warning' },
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
            meta={`${ZALOHA_SPLATKY.length} splátky předepsané · ${uhrady.length} úhrady`}
            padded={false}
          >
            <PredpisTable
              uhrady={uhrady}
              onZadatUhradu={zbyva => setPlatbyModal({
                ucel: 'rezervacni-poplatek',
                castka: zbyva > 0 ? String(zbyva) : undefined,
              })}
            />
          </SubPanel>
        </StepCard>

        {/* ── Krok 2 — provize za zprostředkování ────────────────────────────── */}
        <StepCard
          title="Provize za zprostředkování"
          tooltip="Provize se hradí ze dvou zdrojů: započtením rezervační zálohy a doplatkem z kupní ceny při zobchodování zakázky."
          status={{ label: provizeZbyva === 0 ? 'Vyřešeno' : 'V řešení', variant: provizeZbyva === 0 ? 'success' : 'brand' }}
          summary={<>uhrazeno <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(provizeUhrazeno)}</strong> · {provizePct} %</>}
          open={openProvize}
          onToggle={() => setOpenProvize(o => !o)}
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
            meta={`${PROVIZE_ZDROJE.length} zdroje · celkem ${formatCena(PROVIZE.sDph)}`}
            padded={false}
          >
            <ZdrojeProvizeTable
              provizeUhrazeno={provizeUhrazeno}
              onZadatUhradu={(z, zbyva) => setPlatbyModal({
                ucel: z.ucel,
                castka: zbyva > 0 ? String(zbyva) : undefined,
              })}
            />
          </SubPanel>
        </StepCard>

        {/* ── Krok 3 — vyúčtování zakázky ────────────────────────────────────── */}
        <StepCard
          title="Vyúčtování zakázky"
          tooltip="Vyúčtování rozdělí provizi do struktury a odečte náklady. Otevře se, až bude nastavení provize dokončené."
          status={{ label: 'Čeká', variant: 'neutral' }}
          summary={<>nevyfakturováno · náklady <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(soucty.sDph)}</strong></>}
          open={openVyuctovani}
          onToggle={() => setOpenVyuctovani(o => !o)}
          actions={
            <Tooltip content="Nejprve dokončete nastavení provize." placement="top">
              <span>
                <Button label="Vyúčtovat zakázku" variant="outlined" size="md" disabled />
              </span>
            </Tooltip>
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
            meta={`${naklady.length} položky · ${formatCena(soucty.sDph)}`}
            padded={false}
          >
            <NakladyTable rows={naklady} onEdit={setEditNaklad} onDelete={setDeleteNaklad} />
          </SubPanel>

          <SubPanel
            title="Rozpad provize do struktury"
            meta={<>k výplatě <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(kVyplate)}</strong></>}
            padded={false}
            note={
              <Alert
                variant="warning"
                label="Dokud není zakázka ve stavu Zobchodováno, jsou uvedené údaje pouze orientační."
              />
            }
          >
            <RozpadTable nakladyBezDph={soucty.bezDph} />
          </SubPanel>
        </StepCard>
      </div>

      {platbyModal && (
        <ZpracovaniPlatebModal
          onClose={() => setPlatbyModal(null)}
          onSave={handleZpracovatPlatby}
          defaultUcel={platbyModal.ucel}
          defaultCastka={platbyModal.castka}
          souhrn={{
            rezervaceSlozeno: zalohaUhrazeno,
            rezervaceVyporadano,
            provizeCelkem: PROVIZE.sDph,
            provizeUhrazeno,
            poplatekVCene: false,
          }}
        />
      )}

      {novyNakladOpen && <NovyNakladModal onClose={() => setNovyNakladOpen(false)} />}

      {editNaklad && (
        <NovyNakladModal initialData={nakladToForm(editNaklad)} onClose={() => setEditNaklad(null)} />
      )}

      {deleteNaklad && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,13,18,0.4)' }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 201, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ pointerEvents: 'auto' }}>
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
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}
