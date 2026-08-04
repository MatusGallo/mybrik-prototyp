import { useEffect, useRef, useState } from 'react'
import { typography } from '@matusgallo/mysabds'

/**
 * Výběr barvy v podobě, jakou má zbytek rozhraní - nativní `input[type=color]`
 * otevírá dialog operačního systému, který se s design systemem rozchází.
 * Panel drží HSV: odstín zvlášť, sytost a jas v ploše.
 */

// ── Převody ───────────────────────────────────────────────────────────────────

interface Hsv { h: number; s: number; v: number }

export function normalizovatHex(hex: string) {
  const znaky = hex.trim().replace(/^#/, '')
  const plny = znaky.length === 3 ? znaky.split('').map(z => z + z).join('') : znaky
  return /^[0-9a-fA-F]{6}$/.test(plny) ? `#${plny.toUpperCase()}` : null
}

function hexToRgb(hex: string): [number, number, number] {
  const platny = normalizovatHex(hex) ?? '#000000'
  return [
    parseInt(platny.slice(1, 3), 16),
    parseInt(platny.slice(3, 5), 16),
    parseInt(platny.slice(5, 7), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number) {
  const cast = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return `#${cast(r)}${cast(g)}${cast(b)}`.toUpperCase()
}

function rgbToHsv(r: number, g: number, b: number): Hsv {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360
  return { h, s: max === 0 ? 0 : d / max, v: max / 255 }
}

function hsvToHex({ h, s, v }: Hsv) {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const [r, g, b] =
    h < 60 ? [c, x, 0] :
      h < 120 ? [x, c, 0] :
        h < 180 ? [0, c, x] :
          h < 240 ? [0, x, c] :
            h < 300 ? [x, 0, c] : [c, 0, x]
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

function hexToHsv(hex: string) {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHsv(r, g, b)
}

// ── Tažení ────────────────────────────────────────────────────────────────────

/** Poměrná pozice ukazatele v prvku, oříznutá na 0-1. */
function pomer(e: React.PointerEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect()
  return {
    x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
  }
}

// ── Vzorek ────────────────────────────────────────────────────────────────────

/** Zaoblený čtvereček s barvou - otevírá panel. */
export function BarvaVzorek({ barva, size = 32, label, expanded, onClick }: {
  barva: string
  size?: number
  label: string
  expanded?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      style={{
        width: size, height: size, flexShrink: 0, padding: 0, border: 'none',
        borderRadius: 8, background: barva, cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'inset 0 0 0 1px rgba(16, 26, 35, .16)',
      }}
    />
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function BarvaPicker({ value, presety, onChange, onClose }: {
  value: string
  presety?: string[]
  onChange: (hex: string) => void
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value))
  const [tahne, setTahne] = useState<'plocha' | 'odstin' | null>(null)

  // Změna zvenčí (vzorník, přepsané pole) musí panel dorovnat. Vlastní tažení
  // se přeskakuje - jinak by se čerstvě zvolený odstín zaokrouhlil zpátky.
  useEffect(() => {
    if (tahne) return
    const platny = normalizovatHex(value)
    if (platny && platny !== hsvToHex(hsv)) setHsv(hexToHsv(platny))
  }, [value, tahne, hsv])

  useEffect(() => {
    function klikMimo(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) onClose()
    }
    function klavesa(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    // `mousedown` až v další smyčce, ať panel nezavře klik, který ho otevřel.
    const id = window.setTimeout(() => document.addEventListener('mousedown', klikMimo))
    document.addEventListener('keydown', klavesa)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', klikMimo)
      document.removeEventListener('keydown', klavesa)
    }
  }, [onClose])

  function nastavit(next: Hsv) {
    setHsv(next)
    onChange(hsvToHex(next))
  }

  const odstinBarva = hsvToHex({ h: hsv.h, s: 1, v: 1 })

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Výběr barvy"
      style={{
        position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 40, width: 232,
        background: 'var(--t-bgPrimary)', borderRadius: 12, padding: 12,
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: '0 4px 6px -2px #10182808, 0 12px 16px -4px #10182814',
        outline: '1px solid var(--t-borderPrimary)', outlineOffset: -0.5,
      }}
    >
      {/* Sytost (osa X) a jas (osa Y) */}
      <div
        role="application"
        aria-label="Sytost a jas"
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setTahne('plocha')
          const { x, y } = pomer(e)
          nastavit({ ...hsv, s: x, v: 1 - y })
        }}
        onPointerMove={e => {
          if (tahne !== 'plocha') return
          const { x, y } = pomer(e)
          nastavit({ ...hsv, s: x, v: 1 - y })
        }}
        onPointerUp={() => setTahne(null)}
        style={{
          position: 'relative', height: 132, borderRadius: 8, cursor: 'crosshair',
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #FFF, ${odstinBarva})`,
          boxShadow: 'inset 0 0 0 1px rgba(16, 26, 35, .12)',
          touchAction: 'none',
        }}
      >
        <div style={{
          position: 'absolute',
          left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`,
          width: 14, height: 14, marginLeft: -7, marginTop: -7,
          borderRadius: '50%', border: '2px solid #FFF', background: hsvToHex(hsv),
          boxShadow: '0 1px 3px rgba(16, 26, 35, .4)', pointerEvents: 'none',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BarvaVzorek barva={hsvToHex(hsv)} size={28} label="Zvolená barva" />
        {/* Odstín */}
        <div
          role="application"
          aria-label="Odstín"
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId)
            setTahne('odstin')
            nastavit({ ...hsv, h: pomer(e).x * 360 })
          }}
          onPointerMove={e => {
            if (tahne !== 'odstin') return
            nastavit({ ...hsv, h: pomer(e).x * 360 })
          }}
          onPointerUp={() => setTahne(null)}
          style={{
            position: 'relative', flex: 1, height: 12, borderRadius: 6, cursor: 'pointer',
            background: 'linear-gradient(to right, #F00 0%, #FF0 17%, #0F0 33%, #0FF 50%, #00F 67%, #F0F 83%, #F00 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(16, 26, 35, .12)',
            touchAction: 'none',
          }}
        >
          <div style={{
            position: 'absolute', left: `${(hsv.h / 360) * 100}%`, top: '50%',
            width: 16, height: 16, marginLeft: -8, marginTop: -8,
            borderRadius: '50%', border: '2px solid #FFF', background: odstinBarva,
            boxShadow: '0 1px 3px rgba(16, 26, 35, .4)', pointerEvents: 'none',
          }} />
        </div>
      </div>

      {presety && presety.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>Vzorník</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {presety.map(barva => (
              <BarvaVzorek
                key={barva}
                barva={barva}
                size={24}
                label={`Nastavit barvu ${barva}`}
                onClick={() => {
                  const platny = normalizovatHex(barva)
                  if (!platny) return
                  setHsv(hexToHsv(platny))
                  onChange(platny)
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
