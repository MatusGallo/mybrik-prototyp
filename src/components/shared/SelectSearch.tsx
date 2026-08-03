import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Search as SearchIcon } from 'lucide-react'

export interface SelectSearchOption {
  value: string
  label: string
}

interface Props {
  label?: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  options: SelectSearchOption[]
  placeholder?: string
  width?: number | string
}

// 4px padding panelu + 8,8 × 32px položka - jako SelectMenu v design systému.
// Rozříznutý řádek na konci je záměrný, aby bylo poznat, že seznam pokračuje.
const DROP_MAX_H = 285.6
const DROP_GAP   = 4

function OptionItem({ option, isSelected, onSelect }: {
  option: SelectSearchOption
  isSelected: boolean
  onSelect: (v: string) => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ paddingLeft: 8, paddingRight: 8 }}>
      <div
        role="option"
        aria-selected={isSelected}
        onClick={() => onSelect(option.value)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          minHeight: 32, paddingLeft: 8, paddingRight: 8, borderRadius: 4,
          background: hov ? 'var(--t-bgHover)' : 'transparent',
          display: 'flex', alignItems: 'center', cursor: 'pointer',
          transition: 'background 0.1s',
        }}
      >
        <div style={{ flex: 1, paddingLeft: 4, paddingRight: 4 }}>
          <span style={{
            color: 'var(--t-textPrimary)', fontFamily: 'Inter', fontSize: 14,
            fontWeight: 500, lineHeight: '20px',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            display: 'block',
          }}>
            {option.label}
          </span>
        </div>
        {isSelected && (
          <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check style={{ width: 16, height: 16, color: 'var(--t-textMyDOCKPrimary)' }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function SelectSearch({
  label, required, value, onChange,
  options, placeholder = 'Vybrat', width = '100%',
}: Props) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const [hov, setHov]         = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})

  const triggerRef  = useRef<HTMLDivElement>(null)
  const dropRef     = useRef<HTMLDivElement>(null)
  const searchRef   = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  // close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(t) &&
        dropRef.current   && !dropRef.current.contains(t)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // focus search on open
  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  function calcPosition() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - DROP_GAP
    const spaceAbove = rect.top - DROP_GAP
    const base: React.CSSProperties = {
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      maxHeight: DROP_MAX_H,
      background: 'var(--t-bgPrimary)',
      boxShadow: '0px 2px 4px -2px rgba(10,13,18,0.06), 0px 4px 6px -1px rgba(10,13,18,0.10)',
      borderRadius: 8,
      border: '1px solid var(--t-borderPrimary)',
      zIndex: 9999,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }
    if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
      setDropStyle({ ...base, top: rect.bottom + DROP_GAP })
    } else {
      setDropStyle({ ...base, bottom: window.innerHeight - rect.top + DROP_GAP })
    }
  }

  function handleToggle() {
    if (!open) {
      calcPosition()
      setSearch('')
    }
    setOpen(o => !o)
  }

  const borderColor = open || hov ? 'var(--t-borderPrimaryHover)' : 'var(--t-borderPrimary)'
  const textColor   = selected || open || hov ? 'var(--t-textPrimary)' : 'var(--t-textSecondary)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>
            {label}
          </span>
          {required && (
            <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textDangerPrimary)' }}>*</span>
          )}
        </div>
      )}

      <div ref={triggerRef}>
        <button
          type="button"
          onClick={handleToggle}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            width: '100%', height: 32,
            paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 4,
            background: 'var(--t-bgPrimary)',
            borderRadius: 8,
            border: `1px solid ${borderColor}`,
            display: 'flex', alignItems: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        >
          <div style={{ flex: 1, paddingLeft: 4, paddingRight: 4, display: 'flex', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: '24px',
              color: textColor, textAlign: 'left',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1,
            }}>
              {selected ? selected.label : placeholder}
            </span>
          </div>
          <div style={{ width: 32, height: 32, padding: 8, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ChevronDown style={{ width: 16, height: 16, color: 'var(--t-textSecondary)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </div>
        </button>
      </div>

      {open && createPortal(
        <div ref={dropRef} style={dropStyle}>
          {/* Search input */}
          <div style={{ padding: '8px 8px 4px', flexShrink: 0 }}>
            <div style={{
              height: 36, display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 10px',
              background: 'var(--t-bgSecondary)',
              borderRadius: 6,
              border: '1px solid var(--t-borderPrimary)',
            }}>
              <SearchIcon style={{ width: 14, height: 14, color: 'var(--t-textSecondary)', flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Hledat..."
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none',
                  fontFamily: 'Inter', fontSize: 14, fontWeight: 400,
                  color: 'var(--t-textPrimary)', lineHeight: '20px',
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div style={{ overflowY: 'auto', paddingTop: 4, paddingBottom: 8 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '8px 16px', fontFamily: 'Inter', fontSize: 14, color: 'var(--t-textSecondary)' }}>
                Žádné výsledky
              </div>
            ) : filtered.map(opt => (
              <OptionItem
                key={opt.value}
                option={opt}
                isSelected={opt.value === value}
                onSelect={v => { onChange(v); setOpen(false); setSearch('') }}
              />
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
