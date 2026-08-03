import { useState } from 'react'
import {
  Percent, Plus, Minus, FileText, CircleCheck, Coins, Receipt,
  type LucideIcon,
} from 'lucide-react'
import {
  Button, IconButton, Tag, Tooltip, TooltipIcon, TableCell, TableHeaderCell,
  typography, iconSize, type TagVariant,
} from '@matusgallo/mysabds'

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

const ZALOHA_UHRADY = [
  { id: 1, datum: '02.07.2026', forma: 'Bankovní převod', castka: 50000 },
  { id: 2, datum: '09.07.2026', forma: 'Bankovní převod', castka: 50000 },
]

const PROVIZE_ZDROJE: Array<{
  nazev: string
  popis: string
  castka: number
  stav: string
  stavVariant: TagVariant
}> = [
  {
    nazev: 'Započtení rezervační zálohy',
    popis: 'po vypořádání zálohy',
    castka: 100000,
    stav: 'K vypořádání',
    stavVariant: 'neutral',
  },
  {
    nazev: 'Doplatek z kupní ceny',
    popis: 'splatný při zobchodování zakázky',
    castka: 81500,
    stav: 'Čeká',
    stavVariant: 'neutral',
  },
]

// Náklady drží součty vyúčtování: 15 690 Kč bez DPH, 2 310 Kč vstupní DPH,
// 18 000 Kč s DPH. Poslední dodavatel je neplátce, proto u něj DPH chybí.
const NAKLADY = [
  { datum: '12.06.2026', nazev: 'Fotografie a video', dodavatel: 'Foto Studio Brno', kategorie: 'Fotografické práce, video', bezDph: 5000, sDph: 6050 },
  { datum: '18.06.2026', nazev: 'Home staging', dodavatel: 'Staging Praha', kategorie: 'Staging', bezDph: 4000, sDph: 4840 },
  { datum: '24.06.2026', nazev: 'Inzerce na Sreality', dodavatel: 'Seznam.cz', kategorie: 'Inzerce vč. sociálních sítí', bezDph: 2000, sDph: 2420 },
  { datum: '30.06.2026', nazev: 'Právní služby', dodavatel: 'AK Dvořák (neplátce DPH)', kategorie: 'Právní služby', bezDph: 4690, sDph: 4690 },
]

const ROZPAD = [
  { jmeno: 'Dominik Bránka', pozice: 'Expert I', provize: 105000, naklady: 15690, kVyplate: 89310 },
  { jmeno: 'Jana Marková', pozice: 'Manažer kanceláře', provize: 15000, naklady: 0, kVyplate: 15000 },
  { jmeno: 'SAB servis s.r.o.', pozice: 'HSP', provize: 30000, naklady: 0, kVyplate: 30000 },
]

// ── Odvozené součty ───────────────────────────────────────────────────────────

const ZALOHA_PREDEPSANO = ZALOHA_SPLATKY.reduce((s, r) => s + r.castka, 0)
const ZALOHA_UHRAZENO = ZALOHA_UHRADY.reduce((s, r) => s + r.castka, 0)

const NAKLADY_BEZ_DPH = NAKLADY.reduce((s, r) => s + r.bezDph, 0)
const NAKLADY_S_DPH = NAKLADY.reduce((s, r) => s + r.sDph, 0)
const NAKLADY_DPH = NAKLADY_S_DPH - NAKLADY_BEZ_DPH

const K_VYPLATE = ROZPAD.reduce((s, r) => s + r.kVyplate, 0)
const DPH_ODVOD = PROVIZE.dph - NAKLADY_DPH

const PROVIZE_UHRAZENO = 0

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCena(cena: number) {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(cena)
}

function pctOf(part: number, whole: number) {
  return whole <= 0 ? 0 : Math.min(100, Math.round((part / whole) * 100))
}

// ── Stavební prvky ────────────────────────────────────────────────────────────

// Sklopení karty i podpanelu — jedno ovládání, ať je hierarchie kdekoli.
function CollapseToggle({ open, onToggle, title }: { open: boolean; onToggle: () => void; title: string }) {
  return (
    <IconButton
      icon={open ? Minus : Plus}
      variant="outlined"
      size="sm"
      tooltip={open ? `Sbalit ${title}` : `Rozbalit ${title}`}
      onClick={onToggle}
    />
  )
}

// Ikona kroku — barevný čtverec, aby se karty daly odlišit i periferním viděním.
function StepIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: 'brand' | 'info' | 'success' }) {
  const map = {
    brand: { bg: 'var(--bgMyDOCKTertiary)', fg: 'var(--textMyDOCKPrimary)' },
    info: { bg: 'var(--bgInfoTertiary)', fg: 'var(--textInfoPrimary)' },
    success: { bg: 'var(--bgSuccessTertiary)', fg: 'var(--textSuccessPrimary)' },
  }[tone]
  return (
    <span style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: map.bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={iconSize.md} style={{ color: map.fg }} />
    </span>
  )
}

type StatItem = {
  label: string
  value: string
  valueColor?: string
  note?: string
  tag?: { label: string; variant: TagVariant }
}

// Čtyři klíčová čísla kroku v jednom pásu — stejné pořadí ve všech krocích,
// takže se dají porovnávat pohledem dolů po stránce.
function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
      border: '1px solid var(--borderPrimary)', borderRadius: 8, overflow: 'hidden',
    }}>
      {items.map((it, i) => (
        <div key={it.label} style={{
          padding: '12px 14px', minWidth: 0,
          display: 'flex', flexDirection: 'column', gap: 4,
          borderLeft: i === 0 ? 'none' : '1px solid var(--borderPrimary)',
        }}>
          <span style={{ ...typography.overline11, color: 'var(--textTertiary)' }}>{it.label}</span>
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

// Kolik zbývá — dominantní číslo vlevo, postup vpravo. Stejný vzorec jako
// u salda rezervační zálohy, jen obecněji: každý krok má svůj zbytek.
function RemainderRow({
  label, amount, amountColor, caption, pct, tone,
}: {
  label: string
  amount: string
  amountColor: string
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 150 }}>
        <span style={{ ...typography.body12Medium, color: 'var(--textSecondary)' }}>{label}</span>
        <span style={{ ...typography.headline28, color: amountColor }}>{amount}</span>
      </div>
      <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
    </div>
  )
}

// Karta jednoho kroku vypořádání.
function StepCard({
  icon, tone, title, tooltip, status, hint, actions, summary, active, open, onToggle, children,
}: {
  icon: LucideIcon
  tone: 'brand' | 'info' | 'success'
  title: string
  tooltip: string
  status?: { label: string; variant: TagVariant }
  hint?: string
  actions?: React.ReactNode
  summary?: React.ReactNode
  active?: boolean
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section style={{
      background: 'var(--bgPrimary)',
      border: `1px solid ${active ? 'var(--borderMyDOCK)' : 'var(--borderPrimary)'}`,
      borderRadius: 12,
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: open ? 16 : 0,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <CollapseToggle open={open} onToggle={onToggle} title={title.toLowerCase()} />
        <StepIcon icon={icon} tone={tone} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ ...typography.body16Semibold, color: open ? 'var(--textPrimary)' : 'var(--textSecondary)' }}>
            {title}
          </span>
          <TooltipIcon placement="top" content={tooltip} />
        </span>

        {!open && summary && (
          <>
            <span style={{ width: 1, height: 16, background: 'var(--borderPrimary)', flexShrink: 0 }} />
            <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)', minWidth: 0 }}>{summary}</span>
          </>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {status && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Tag label={status.label} variant={status.variant} size="sm" lead="indicator" />
              {hint && <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>{hint}</span>}
            </span>
          )}
          {actions}
        </div>
      </header>

      {open && children}
    </section>
  )
}

// Podpanel s detailem — tabulky a rozpisy, které se hodí zabalit.
function SubPanel({
  title, meta, tone = 'neutral', open, onToggle, padded = true, children,
}: {
  title: string
  meta?: React.ReactNode
  tone?: 'neutral' | 'info'
  open: boolean
  onToggle: () => void
  padded?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{ border: '1px solid var(--borderPrimary)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
        background: tone === 'info' ? 'var(--bgInfoTertiary)' : 'var(--bgSecondary)',
      }}>
        <CollapseToggle open={open} onToggle={onToggle} title={title.toLowerCase()} />
        <span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{title}</span>
        {meta && (
          <span style={{ marginLeft: 'auto', ...typography.body12Regular, color: 'var(--textSecondary)' }}>{meta}</span>
        )}
      </div>
      {open && <div style={{ padding: padded ? 12 : 0 }}>{children}</div>}
    </div>
  )
}

type LedgerRow = { key: string; label: string; note?: string; castka: number }

// Sloupec rozpisu — předpis vs. úhrady vedle sebe. Barva sloupce nese význam:
// info = co má klient poslat, success = co už poslal.
function LedgerColumn({
  title, icon: Icon, tone, rows, totalLabel, total, divider,
}: {
  title: string
  icon: LucideIcon
  tone: 'info' | 'success'
  rows: LedgerRow[]
  totalLabel: string
  total: number
  divider?: boolean
}) {
  const map = {
    info: { bg: 'var(--bgInfoTertiary)', fg: 'var(--textInfoPrimary)', dot: 'var(--textInfoPrimary)', total: 'var(--textPrimary)' },
    success: { bg: 'var(--bgSuccessTertiary)', fg: 'var(--textSuccessPrimary)', dot: 'var(--textSuccessPrimary)', total: 'var(--textSuccessPrimary)' },
  }[tone]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      borderLeft: divider ? '1px solid var(--borderPrimary)' : 'none',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px' }}>
        <span style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: map.bg,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={iconSize.xs} style={{ color: map.fg }} />
        </span>
        <span style={{ ...typography.overline11, color: 'var(--textSecondary)' }}>{title}</span>
      </div>

      <div style={{ padding: '0 14px' }}>
        {rows.map(r => (
          <div key={r.key} style={{
            display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0',
            borderBottom: '1px dashed var(--borderPrimary)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: map.dot, flexShrink: 0 }} />
            <span style={{ ...typography.body14Regular, color: 'var(--textPrimary)', minWidth: 0, flex: 1 }}>
              {r.label}
              {r.note && <span style={{ color: 'var(--textSecondary)' }}> · {r.note}</span>}
            </span>
            <span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)', whiteSpace: 'nowrap' }}>
              {formatCena(r.castka)}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 12,
        padding: '12px 14px', background: map.bg,
      }}>
        <span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)', flex: 1 }}>{totalLabel}</span>
        <span style={{ ...typography.body16Semibold, color: map.total, whiteSpace: 'nowrap' }}>{formatCena(total)}</span>
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
          <TableHeaderCell size="dense" label={c.label} width="100%" />
        </div>
      ))}
    </div>
  )
}

function ZdrojeProvizeTable() {
  const cols: Col[] = [
    { label: 'Zdroj úhrady provize', flex: 1 },
    { label: 'Částka', width: 160, align: 'right' },
    { label: 'Stav', width: 150 },
  ]
  return (
    <div>
      <TableHead cols={cols} />
      {PROVIZE_ZDROJE.map(z => (
        <div key={z.nazev} style={{ display: 'flex' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TableCell
              size="dense" width="100%" hovered={false} borderBottom
              content={
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{z.nazev}</span>
                  <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>{z.popis}</span>
                </span>
              }
            />
          </div>
          <div style={{ width: 160, flexShrink: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} borderBottom align="right" label={formatCena(z.castka)} />
          </div>
          <div style={{ width: 150, flexShrink: 0 }}>
            <TableCell
              size="dense" width="100%" hovered={false} borderBottom
              content={<Tag label={z.stav} variant={z.stavVariant} size="sm" lead="indicator" />}
            />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', background: 'var(--bgSecondary)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false}
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>Provize celkem s DPH</span>}
          />
        </div>
        <div style={{ width: 160, flexShrink: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(PROVIZE.sDph)}</span>}
          />
        </div>
        <div style={{ width: 150, flexShrink: 0 }}>
          <TableCell size="dense" width="100%" hovered={false} borderBottom={false} label="" />
        </div>
      </div>
    </div>
  )
}

function NakladyTable() {
  const cols: Col[] = [
    { label: 'Datum', width: 110 },
    { label: 'Náklad', flex: 1 },
    { label: 'Kategorie', flex: 1 },
    { label: 'Bez DPH', width: 130, align: 'right' },
    { label: 'DPH', width: 110, align: 'right' },
    { label: 'S DPH', width: 130, align: 'right' },
  ]
  return (
    <div style={{ overflowX: 'auto' }}>
      <TableHead cols={cols} />
      {NAKLADY.map(r => {
        const dph = r.sDph - r.bezDph
        return (
          <div key={r.nazev} style={{ display: 'flex' }}>
            <div style={{ width: 110, flexShrink: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} borderBottom label={r.datum} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TableCell
                size="dense" width="100%" hovered={false} borderBottom
                content={
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ ...typography.body14Medium, color: 'var(--textPrimary)' }}>{r.nazev}</span>
                    <span style={{ ...typography.body12Regular, color: 'var(--textSecondary)' }}>{r.dodavatel}</span>
                  </span>
                }
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} borderBottom label={r.kategorie} />
            </div>
            <div style={{ width: 130, flexShrink: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} borderBottom align="right" label={formatCena(r.bezDph)} />
            </div>
            <div style={{ width: 110, flexShrink: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} borderBottom align="right" label={dph === 0 ? '—' : formatCena(dph)} />
            </div>
            <div style={{ width: 130, flexShrink: 0 }}>
              <TableCell size="dense" width="100%" hovered={false} borderBottom align="right" label={formatCena(r.sDph)} />
            </div>
          </div>
        )
      })}
      <div style={{ display: 'flex', background: 'var(--bgSecondary)' }}>
        <div style={{ width: 110, flexShrink: 0 }}>
          <TableCell size="dense" width="100%" hovered={false} borderBottom={false} label="" />
        </div>
        <div style={{ flex: 2, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false} align="right"
            content={<span style={{ ...typography.body12Medium, color: 'var(--textSecondary)' }}>Náklady celkem:</span>}
          />
        </div>
        <div style={{ width: 130, flexShrink: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(NAKLADY_BEZ_DPH)}</span>}
          />
        </div>
        <div style={{ width: 110, flexShrink: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(NAKLADY_DPH)}</span>}
          />
        </div>
        <div style={{ width: 130, flexShrink: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(NAKLADY_S_DPH)}</span>}
          />
        </div>
      </div>
    </div>
  )
}

function RozpadTable() {
  const cols: Col[] = [
    { label: 'Jméno', flex: 3 },
    { label: 'Pozice', flex: 2 },
    { label: 'Provize', flex: 2, align: 'right' },
    { label: 'Náklady', flex: 2, align: 'right' },
    { label: 'K výplatě', flex: 2, align: 'right' },
    { label: 'Stav', width: 140 },
  ]
  return (
    <div>
      <TableHead cols={cols} />
      {ROZPAD.map(r => (
        <div key={r.jmeno} style={{ display: 'flex' }}>
          <div style={{ flex: 3, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} borderBottom label={r.jmeno} />
          </div>
          <div style={{ flex: 2, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} borderBottom label={r.pozice} />
          </div>
          <div style={{ flex: 2, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} borderBottom align="right" label={formatCena(r.provize)} />
          </div>
          <div style={{ flex: 2, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} borderBottom align="right" label={r.naklady === 0 ? '—' : formatCena(r.naklady)} />
          </div>
          <div style={{ flex: 2, minWidth: 0 }}>
            <TableCell size="dense" width="100%" hovered={false} borderBottom align="right" label={formatCena(r.kVyplate)} />
          </div>
          <div style={{ width: 140, flexShrink: 0 }}>
            <TableCell
              size="dense" width="100%" hovered={false} borderBottom
              content={<Tag label="K fakturaci" variant="warning" size="sm" lead="indicator" />}
            />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', background: 'var(--bgSecondary)' }}>
        <div style={{ flex: 5, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false} align="right"
            content={<span style={{ ...typography.body12Medium, color: 'var(--textSecondary)' }}>K výplatě celkem:</span>}
          />
        </div>
        <div style={{ flex: 2, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(PROVIZE.bezDph)}</span>}
          />
        </div>
        <div style={{ flex: 2, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textPrimary)' }}>{formatCena(NAKLADY_BEZ_DPH)}</span>}
          />
        </div>
        <div style={{ flex: 2, minWidth: 0 }}>
          <TableCell
            size="dense" width="100%" hovered={false} borderBottom={false} align="right"
            content={<span style={{ ...typography.body14Semibold, color: 'var(--textSuccessPrimary)' }}>{formatCena(K_VYPLATE)}</span>}
          />
        </div>
        <div style={{ width: 140, flexShrink: 0 }}>
          <TableCell size="dense" width="100%" hovered={false} borderBottom={false} label="" />
        </div>
      </div>
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
      <StepIcon icon={Percent} tone="brand" />
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

export default function VyporadaniPlateb({ onNovyNaklad }: { onNovyNaklad?: () => void }) {
  const [openZaloha, setOpenZaloha] = useState(true)
  const [openProvize, setOpenProvize] = useState(true)
  const [openVyuctovani, setOpenVyuctovani] = useState(true)

  const [openPredpis, setOpenPredpis] = useState(true)
  const [openZdroje, setOpenZdroje] = useState(true)
  const [openNaklady, setOpenNaklady] = useState(false)
  const [openRozpad, setOpenRozpad] = useState(false)

  const zalohaZbyva = Math.max(0, ZALOHA_PREDEPSANO - ZALOHA_UHRAZENO)
  const zalohaPct = pctOf(ZALOHA_UHRAZENO, ZALOHA_PREDEPSANO)
  const zalohaUhrazena = zalohaZbyva === 0

  const provizeZbyva = PROVIZE.sDph - PROVIZE_UHRAZENO
  const provizePct = pctOf(PROVIZE_UHRAZENO, PROVIZE.sDph)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ProvizeHero />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ ...typography.subheadline18Semibold, color: 'var(--textPrimary)' }}>Vypořádání plateb</span>
        <div style={{ marginLeft: 'auto' }}>
          <Button label="Nový náklad" variant="outlined" size="md" leadIcon={Plus} onClick={onNovyNaklad} />
        </div>
      </div>

      {/* ── Krok 1 — rezervační záloha ─────────────────────────────────────── */}
      <StepCard
        icon={Coins}
        tone="success"
        title="Rezervační záloha"
        tooltip="Rezervační zálohu může klient uhradit ve více splátkách. Po vypořádání se započítá do provize za zprostředkování."
        status={{ label: zalohaUhrazena ? 'Vyřešeno' : 'V řešení', variant: zalohaUhrazena ? 'success' : 'brand' }}
        hint={zalohaUhrazena ? 'Pokračujte do provize' : undefined}
        summary={<>uhrazeno <strong style={{ color: 'var(--textSuccessPrimary)' }}>{formatCena(ZALOHA_UHRAZENO)}</strong> · {zalohaPct} %</>}
        open={openZaloha}
        onToggle={() => setOpenZaloha(o => !o)}
        actions={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button label="Zadat úhradu" variant="outlined" size="md" leadIcon={Plus} />
            <Button label="Vypořádat rezervační zálohu" variant="primary" size="md" />
          </span>
        }
      >
        <StatStrip
          items={[
            { label: 'Předepsáno', value: formatCena(ZALOHA_PREDEPSANO) },
            { label: 'Uhrazeno', value: formatCena(ZALOHA_UHRAZENO), valueColor: 'var(--textSuccessPrimary)' },
            { label: 'Stav úhrady', value: '', tag: { label: zalohaUhrazena ? 'Plně uhrazena' : 'Částečně uhrazena', variant: zalohaUhrazena ? 'success' : 'warning' } },
            {
              label: 'Peníze v rezervaci',
              value: `+ ${formatCena(ZALOHA_UHRAZENO)}`,
              valueColor: 'var(--textSuccessPrimary)',
              note: 'k vypořádání',
            },
          ]}
        />

        <RemainderRow
          label="Zbývá doplatit"
          amount={formatCena(zalohaZbyva)}
          amountColor={zalohaUhrazena ? 'var(--textSuccessPrimary)' : 'var(--textMyDOCKPrimary)'}
          caption={<>Uhrazeno <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(ZALOHA_UHRAZENO)}</strong> z {formatCena(ZALOHA_PREDEPSANO)}</>}
          pct={zalohaPct}
          tone={zalohaUhrazena ? 'success' : 'brand'}
        />

        <SubPanel
          title="Předpis a úhrady"
          tone="info"
          meta={`${ZALOHA_SPLATKY.length} splátky předepsané · ${ZALOHA_UHRADY.length} úhrady`}
          open={openPredpis}
          onToggle={() => setOpenPredpis(o => !o)}
          padded={false}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
            <LedgerColumn
              title="Předpis"
              icon={FileText}
              tone="info"
              rows={ZALOHA_SPLATKY.map(s => ({
                key: `s${s.id}`, label: s.label, note: `splatnost ${s.splatnost}`, castka: s.castka,
              }))}
              totalLabel="Předepsáno"
              total={ZALOHA_PREDEPSANO}
            />
            <LedgerColumn
              title="Úhrady"
              icon={CircleCheck}
              tone="success"
              divider
              rows={ZALOHA_UHRADY.map(u => ({
                key: `u${u.id}`, label: u.datum, note: u.forma, castka: u.castka,
              }))}
              totalLabel="Uhrazeno"
              total={ZALOHA_UHRAZENO}
            />
          </div>
        </SubPanel>
      </StepCard>

      {/* ── Krok 2 — provize za zprostředkování ────────────────────────────── */}
      <StepCard
        icon={Percent}
        tone="brand"
        title="Provize za zprostředkování"
        tooltip="Provize se hradí ze dvou zdrojů: započtením rezervační zálohy a doplatkem z kupní ceny při zobchodování zakázky."
        status={{ label: 'V řešení', variant: 'brand' }}
        summary={<>uhrazeno <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(PROVIZE_UHRAZENO)}</strong> · {provizePct} %</>}
        active
        open={openProvize}
        onToggle={() => setOpenProvize(o => !o)}
        actions={<Button label="Zadat úhradu" variant="outlined" size="md" leadIcon={Plus} />}
      >
        <StatStrip
          items={[
            { label: 'Výše provize', value: formatCena(PROVIZE.sDph), note: 's DPH' },
            { label: 'Uhrazeno', value: formatCena(PROVIZE_UHRAZENO) },
            { label: 'Stav úhrady', value: '', tag: { label: 'Neuhrazeno', variant: 'neutral' } },
            { label: 'Peníze na provizi', value: formatCena(PROVIZE_UHRAZENO), note: 'k vypořádání' },
          ]}
        />

        <RemainderRow
          label="Zbývá doplatit"
          amount={formatCena(-provizeZbyva)}
          amountColor="var(--textMyDOCKPrimary)"
          caption={<>Uhrazeno <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(PROVIZE_UHRAZENO)}</strong> z {formatCena(PROVIZE.sDph)}</>}
          pct={provizePct}
          tone="brand"
        />

        <SubPanel
          title="Zdroj úhrady provize"
          tone="info"
          meta={`${PROVIZE_ZDROJE.length} zdroje · celkem ${formatCena(PROVIZE.sDph)}`}
          open={openZdroje}
          onToggle={() => setOpenZdroje(o => !o)}
          padded={false}
        >
          <ZdrojeProvizeTable />
        </SubPanel>
      </StepCard>

      {/* ── Krok 3 — vyúčtování zakázky ────────────────────────────────────── */}
      <StepCard
        icon={Receipt}
        tone="info"
        title="Vyúčtování zakázky"
        tooltip="Vyúčtování rozdělí provizi do struktury a odečte náklady. Otevře se, až bude nastavení provize dokončené."
        status={{ label: 'Čeká', variant: 'neutral' }}
        summary={<>nevyfakturováno · náklady <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(NAKLADY_S_DPH)}</strong></>}
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
            { label: 'Náklady', value: `− ${formatCena(NAKLADY_BEZ_DPH)}`, valueColor: 'var(--textDangerPrimary)', note: `bez DPH · ${formatCena(NAKLADY_S_DPH)} s DPH` },
            { label: 'Výplaty', value: formatCena(K_VYPLATE), valueColor: 'var(--textSuccessPrimary)', note: 'bez DPH · DPH dle příjemce' },
            { label: 'DPH - odvod', value: formatCena(DPH_ODVOD), note: `výstup ${formatCena(PROVIZE.dph)} - vstup ${formatCena(NAKLADY_DPH)}` },
          ]}
        />

        <RemainderRow
          label="Stav zakázky"
          amount={formatCena(-NAKLADY_BEZ_DPH)}
          amountColor="var(--textMyDOCKPrimary)"
          caption="Vyrovnání zakázky · po úhradě provize a výplatě všech podílů skončí na 0 Kč"
          pct={0}
          tone="neutral"
        />

        <SubPanel
          title="Náklady na zakázku"
          meta={`${NAKLADY.length} položky · ${formatCena(NAKLADY_S_DPH)}`}
          open={openNaklady}
          onToggle={() => setOpenNaklady(o => !o)}
          padded={false}
        >
          <NakladyTable />
        </SubPanel>

        <SubPanel
          title="Rozpad provize do struktury"
          meta={<>k výplatě <strong style={{ color: 'var(--textPrimary)' }}>{formatCena(K_VYPLATE)}</strong></>}
          open={openRozpad}
          onToggle={() => setOpenRozpad(o => !o)}
          padded={false}
        >
          <RozpadTable />
        </SubPanel>
      </StepCard>
    </div>
  )
}
