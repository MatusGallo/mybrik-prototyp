import { useEffect, useRef } from 'react'
import { User, Shield, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavItem, IconButton, isFloatingPanelOpen } from '@matusgallo/mysabds'
import ProfilPage from './ProfilPage'
import ZmenaHeslaPage from './ZmenaHeslaPage'

export type NastaveniSection = 'profil' | 'zmena-hesla'

interface NastaveniModalProps {
  open: boolean
  section: NastaveniSection
  onSectionChange: (s: NastaveniSection) => void
  onClose: () => void
}

const navItems: { label: string; icon: LucideIcon; section: NastaveniSection }[] = [
  { label: 'Profil', icon: User, section: 'profil' },
  { label: 'Změna hesla', icon: Shield, section: 'zmena-hesla' },
]

export default function NastaveniModal({ open, section, onSectionChange, onClose }: NastaveniModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      // Nad rozbaleným seznamem nebo kalendářem patří Escape jemu, ne modálu -
      // jinak jeden stisk zavře obojí a rozepsaný formulář je pryč.
      if (isFloatingPanelOpen()) return
      onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(16, 26, 35, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 960,
          maxWidth: 'calc(100vw - 48px)',
          background: 'var(--t-bgSecondary)',
          borderRadius: 16,
          border: '1px solid var(--t-borderPrimary)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex',
          overflow: 'hidden',
          height: 720,
        }}
      >
        {/* Close button */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <IconButton icon={X} variant="outlined" size="lg" onClick={onClose} />
        </div>

        {/* Left sidebar */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: '1px solid var(--t-borderPrimary)',
          }}
        >
          <div
            style={{
              padding: '24px 16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                lineHeight: '20px',
                color: 'var(--t-textSecondary)',
              }}
            >
              Nastavení
            </span>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {navItems.map(item => (
                <NavItem
                  key={item.section}
                  label={item.label}
                  icon={item.icon}
                  active={section === item.section}
                  onClick={() => onSectionChange(item.section)}
                />
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--t-bgPrimary)', display: 'flex', flexDirection: 'column' }}>
          {section === 'profil' && <ProfilPage />}
          {section === 'zmena-hesla' && <ZmenaHeslaPage />}
        </div>
      </div>
    </div>
  )
}
