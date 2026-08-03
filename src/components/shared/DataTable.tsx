import { useState } from 'react'
import type { ReactNode } from 'react'
import { TableHeaderCell, TableCell, IconButton } from '@matusgallo/mysabds'
import { Eye, Pencil, Trash, RotateCcw, UserCog, History, Ban } from 'lucide-react'
import EmptyState from './EmptyState'
import TruncatedText from './TruncatedText'

export interface ColDef {
  key: string
  label: string
  width?: number
  flex?: boolean
  hugged?: boolean
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  render?: (row: Record<string, unknown>) => ReactNode
  format?: (value: unknown, row: Record<string, unknown>) => string
}

export type TableAction = 'view' | 'restore' | 'edit' | 'delete' | 'rights' | 'history' | 'deactivate'

interface DataTableProps {
  cols: ColDef[]
  rows: Record<string, unknown>[]
  actions?: TableAction[]
  onRowClick?: (row: Record<string, unknown>) => void
  onAction?: (action: TableAction, row: Record<string, unknown>) => void
  emptyVariant?: 'default' | 'search'
  emptyTitle?: string
  emptyDescription?: string
  emptyCta?: { label: string; onClick: () => void }
}

const HEADER_HEIGHT = 40

export default function DataTable({ cols, rows, actions = ['view', 'restore', 'edit', 'delete'], onRowClick, onAction, emptyVariant = 'default', emptyTitle, emptyDescription, emptyCta }: DataTableProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const actionsWidth = actions.length * 40 + (actions.length - 1) * 2 + 32
  const totalColsWidth = cols.reduce((sum, c) => sum + (c.width ?? 0), 0)
  const tableMinWidth = totalColsWidth + (actions.length > 0 ? actionsWidth : 0)
  const hasFlex = cols.some(c => c.flex)

  if (rows.length === 0) {
    return <EmptyState variant={emptyVariant} title={emptyTitle} description={emptyDescription} cta={emptyCta} />
  }

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <div style={{ width: '100%', minWidth: tableMinWidth, background: 'var(--t-bgPrimary)' }}>

        {/* Header */}
        <div style={{ display: 'flex', width: '100%' }}>
          <div style={{
            borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
            borderTopRightRadius: actions.length === 0 ? 8 : 0, borderBottomRightRadius: actions.length === 0 ? 8 : 0,
            display: 'flex', flex: hasFlex ? 1 : undefined, overflow: 'hidden',
            height: HEADER_HEIGHT, background: 'var(--t-bgSecondary)',
          }}>
            {cols.map(c => {
              const rightCls = c.align === 'right' ? 'th-right' : undefined
              return c.flex ? (
                <div key={c.key} className={rightCls} style={{ flex: 1, minWidth: c.width, pointerEvents: 'none' }}>
                  <TableHeaderCell label={c.label} width="100%" />
                </div>
              ) : c.hugged ? (
                <div key={c.key} className={rightCls} style={{ flexShrink: 0, pointerEvents: 'none' }}>
                  <TableHeaderCell label={c.label} />
                </div>
              ) : c.sortable ? (
                <div key={c.key} className={rightCls} style={{ pointerEvents: 'none' }}>
                  <TableHeaderCell label={c.label} width={c.width} sortable />
                </div>
              ) : (
                <div key={c.key} className={rightCls} style={{ pointerEvents: 'none' }}>
                  <TableHeaderCell label={c.label} width={c.width} />
                </div>
              )
            })}
          </div>
          {actions.length > 0 && (
            <div style={{
              position: 'sticky', right: 0, zIndex: 2, flexShrink: 0,
              width: actionsWidth, height: HEADER_HEIGHT,
              background: 'var(--t-bgSecondary)',
              borderTopRightRadius: 8, borderBottomRightRadius: 8,
              overflow: 'hidden',
            }} />
          )}
        </div>

        {/* Rows */}
        {rows.map((row, ri) => {
          const hovered = hoveredRow === ri
          const bg = hovered ? 'var(--t-bgHover)' : 'var(--t-bgPrimary)'
          return (
            <div
              key={ri}
              style={{ display: 'flex', alignItems: 'stretch', cursor: onRowClick ? 'pointer' : 'default', width: hasFlex ? '100%' : undefined }}
              onMouseEnter={() => setHoveredRow(ri)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => onRowClick?.(row)}
            >
              {cols.map(c => {
                const formattedLabel = c.format ? c.format(row[c.key], row) : (c.render ? undefined : String(row[c.key] ?? '–'))
                const renderedContent = !c.format && c.render ? c.render(row) : undefined
                // prostý text jde přes TruncatedText, aby se zkrácená hodnota dala přečíst v tooltipu
                const textContent = renderedContent ?? (
                  <TruncatedText text={formattedLabel ?? '–'} align={c.align} />
                )
                return c.flex ? (
                  <div key={c.key} style={{ flex: 1, minWidth: c.width, background: bg, transition: 'background-color 150ms', borderBottom: '1px solid var(--t-borderPrimary)', display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 16, boxSizing: 'border-box', overflow: 'hidden' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>{textContent}</div>
                  </div>
                ) : c.hugged ? (
                  <TableCell
                    key={c.key}
                    size="spacious"
                    hovered={hovered}
                    borderBottom
                    content={<div style={{ minWidth: 0 }}>{textContent}</div>}
                    align={c.align === 'right' ? 'right' : 'left'}
                  />
                ) : (
                  <TableCell
                    key={c.key}
                    size="spacious"
                    width={c.width}
                    hovered={hovered}
                    borderBottom
                    content={<div style={{ overflow: 'hidden', minWidth: 0, width: (c.width ?? 0) - 32 }}>{textContent}</div>}
                    align={c.align === 'right' ? 'right' : 'left'}
                  />
                )
              })}
              {actions.length > 0 && (
                <div style={{ position: 'sticky', right: 0, zIndex: 1, flexShrink: 0, background: 'var(--t-bgPrimary)' }}>
                  <TableCell
                    size="spacious"
                    width={actionsWidth}
                    hovered={hovered}
                    borderBottom
                    content={
                      <div style={{ display: 'flex', gap: 2 }}>
                        {(() => {
                          const order: TableAction[] = ['view', 'delete', 'restore', 'history', 'deactivate', 'edit', 'rights']
                          return order.filter(a => actions.includes(a)).map(action => (
                            <div key={action} onClick={e => e.stopPropagation()}>
                              {action === 'view'       && <IconButton icon={Eye}       variant="ghost" size="lg" tooltip="Zobrazit"      onClick={() => onAction?.('view', row)} />}
                              {action === 'restore'    && <IconButton icon={RotateCcw} variant="ghost" size="lg" tooltip="Obnovit"       onClick={() => onAction?.('restore', row)} />}
                              {action === 'edit'       && <IconButton icon={Pencil}    variant="ghost" size="lg" tooltip="Upravit"       onClick={() => onAction?.('edit', row)} />}
                              {action === 'deactivate' && <IconButton icon={Ban}       variant="ghost" size="lg" tooltip="Deaktivovat"   onClick={() => onAction?.('deactivate', row)} />}
                              {action === 'rights'     && <IconButton icon={UserCog}   variant="ghost" size="lg" tooltip="Upravit práva" onClick={() => onAction?.('rights', row)} />}
                              {action === 'history'    && <IconButton icon={History}   variant="ghost" size="lg" tooltip="Historie"      onClick={() => onAction?.('history', row)} />}
                              {action === 'delete'  && <span className="icon-trash-primary"><IconButton icon={Trash} variant="ghost" size="lg" tooltip="Smazat" onClick={() => onAction?.('delete', row)} /></span>}
                            </div>
                          ))
                        })()}
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          )
        })}

      </div>
    </div>
  )
}
