import { useState, useEffect, useRef, forwardRef } from 'react'
import { Calendar, SlidersHorizontal, Check, Columns3Cog, Eye, EyeOff } from 'lucide-react'
import type { LucideProps, LucideIcon } from 'lucide-react'

const BrandCheck = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Check ref={ref} {...props} color="var(--t-textMyDOCKPrimary)" />
)) as LucideIcon
import { FilterButton, FilterSelect, FilterIconButton, Chip, TextButton, Menu, MenuItem, MenuDivider, Search } from '@matusgallo/mysabds'
import { DateField, TextInputField } from './FilterDropdown'

export interface FilterGroupConfig {
  label: string
  options: string[]
  values: Set<string>
  onChange: (v: string) => void
  searchable?: boolean
}

export interface FilterFieldConfig {
  label: string
  type?: 'text' | 'date' | 'number'
  value: string
  onChange: (v: string) => void
}

export interface FilterSearchConfig {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

/** Sloupec, který uživatel může v tabulce zapnout a vypnout. */
export interface FilterColumnConfig {
  key: string
  label: string
}

interface PageFilterBarProps {
  search?: FilterSearchConfig
  groups?: FilterGroupConfig[]
  fields?: FilterFieldConfig[]
  /** Přepínatelné sloupce - bez nich se ikona nastavení sloupců nezobrazí. */
  columns?: FilterColumnConfig[]
  hiddenCols?: Set<string>
  onToggleCol?: (key: string) => void
  onHideAllCols?: () => void
  onShowAllCols?: () => void
  onClear: () => void
}

export default function PageFilterBar({
  search, groups = [], fields = [], columns = [],
  hiddenCols, onToggleCol, onHideAllCols, onShowAllCols, onClear,
}: PageFilterBarProps) {
  const [open, setOpen] = useState<string | null>(null)
  const [leavingTags, setLeavingTags] = useState<Set<string>>(new Set())
  const [dropdownSearch, setDropdownSearch] = useState<Record<string, string>>({})
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(id: string) {
    setOpen(prev => {
      if (prev === id) {
        setDropdownSearch(s => { const n = { ...s }; delete n[id]; return n })
        return null
      }
      return id
    })
  }

  const tags: Array<{ key: string; label: string; onRemove: () => void }> = []
  groups.forEach(g => {
    Array.from(g.values).forEach(v => {
      tags.push({ key: `g:${g.label}:${v}`, label: `${g.label}: ${v}`, onRemove: () => g.onChange(v) })
    })
  })
  fields.forEach(f => {
    if (f.value) tags.push({ key: `f:${f.label}`, label: `${f.label}: ${f.value}`, onRemove: () => f.onChange('') })
  })

  function dismiss(key: string, onRemove: () => void) {
    setLeavingTags(prev => new Set([...prev, key]))
    setTimeout(() => {
      setLeavingTags(prev => { const n = new Set(prev); n.delete(key); return n })
      onRemove()
    }, 150)
  }

  function clearAll() {
    const keys = tags.map(t => t.key)
    setLeavingTags(new Set(keys))
    setTimeout(() => {
      setLeavingTags(new Set())
      onClear()
    }, 150)
  }

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>

        {search && (
          <Search
            placeholder={search.placeholder ?? 'Hledat...'}
            value={search.value}
            onChange={search.onChange}
            size="sm"
            width={280}
          />
        )}

        {groups.map((g, gi) => {
          const key = `g:${gi}`
          const q = dropdownSearch[key] ?? ''
          const visibleOptions = g.searchable && q
            ? g.options.filter(o => o.toLowerCase().includes(q.toLowerCase()))
            : g.options
          return (
            <div key={gi} style={{ position: 'relative' }}>
              <div className="filter-btn-wrap">
                <FilterButton
                  label={g.label}
                  active={g.values.size > 0}
                  onClick={() => toggle(key)}
                />
              </div>
              {open === key && (
                <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both', maxHeight: 340, overflowY: 'auto' }} width={320}>
                  {g.searchable && (
                    <div style={{ padding: '6px 8px 4px', position: 'sticky', top: 0, background: 'var(--t-bgPrimary)', zIndex: 1 }} className="dropdown-search">
                      <Search
                        placeholder="Hledat..."
                        value={q}
                        onChange={v => setDropdownSearch(prev => ({ ...prev, [key]: v }))}
                        variant="ghost"
                        size="sm"
                        width="100%"
                      />
                    </div>
                  )}
                  {visibleOptions.map(opt => (
                    <MenuItem
                      key={opt}
                      label={opt}
                      trailIcon={g.values.has(opt) ? BrandCheck : undefined}
                      onClick={() => g.onChange(opt)}
                    />
                  ))}
                </Menu>
              )}
            </div>
          )
        })}

        {fields.map((f, fi) => {
          const key = `f:${fi}`
          const isDate = f.type === 'date'
          return (
            <div key={fi} style={{ position: 'relative' }}>
              <FilterSelect
                label={f.label}
                leadIcon={isDate ? Calendar : SlidersHorizontal}
                selected={!!f.value}
                onClick={() => toggle(key)}
              />
              {open === key && (
                <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both' }} width={320}>
                  <div style={{ padding: '8px 12px' }}>
                    {isDate
                      ? <DateField label={f.label} value={f.value} onChange={f.onChange} />
                      : <TextInputField label={f.label} value={f.value} onChange={f.onChange} type={f.type} />
                    }
                  </div>
                </Menu>
              )}
            </div>
          )
        })}

        {columns.length > 0 && (
          <>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative' }}>
              <FilterIconButton
                icon={Columns3Cog}
                tooltip="Nastavit sloupce"
                active={open === 'columns'}
                onClick={() => toggle('columns')}
              />
              {open === 'columns' && (() => {
                const visible = columns.filter(c => !hiddenCols?.has(c.key))
                const hidden  = columns.filter(c =>  hiddenCols?.has(c.key))
                return (
                  <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both', maxHeight: 340, overflowY: 'auto' }} width={320}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 2px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-textTertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Zobrazené v tabulce</span>
                      {visible.length > 0 && <TextButton label="Skrýt vše" size="sm" onClick={onHideAllCols} />}
                    </div>
                    {visible.map(col => (
                      <MenuItem key={col.key} label={col.label} trailIcon={Eye} variant="default" onClick={() => onToggleCol?.(col.key)} />
                    ))}
                    {hidden.length > 0 && (
                      <>
                        <MenuDivider />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 2px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-textTertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skryté v tabulce</span>
                          <TextButton label="Zobrazit vše" size="sm" onClick={onShowAllCols} />
                        </div>
                        {hidden.map(col => (
                          <MenuItem key={col.key} label={col.label} trailIcon={EyeOff} variant="default" onClick={() => onToggleCol?.(col.key)} />
                        ))}
                      </>
                    )}
                  </Menu>
                )
              })()}
            </div>
          </>
        )}

      </div>

      <div
        style={{
          maxHeight: tags.length > 0 ? '200px' : '0',
          opacity: tags.length > 0 ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', paddingTop: 4 }}>
          {tags.map(tag => (
            <div
              key={tag.key}
              style={{
                animation: leavingTags.has(tag.key)
                  ? 'tagExit 0.18s cubic-bezier(0.4, 0, 1, 1) forwards'
                  : 'tagEnter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              }}
            >
              <Chip label={tag.label} size="sm" onDismiss={() => dismiss(tag.key, tag.onRemove)} />
            </div>
          ))}
          <div style={{ marginLeft: 4 }}>
            <TextButton label="Zrušit filtry" variant="brand" size="sm" onClick={clearAll} />
          </div>
        </div>
      </div>
    </div>
  )
}
