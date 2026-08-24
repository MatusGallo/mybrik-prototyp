import { useEffect, useRef, useState } from 'react'
import { User, Shield, Sun, Moon, Network, HelpCircle, LogOut } from 'lucide-react'
import { Menu, MenuItem, MenuDivider, Avatar, SwitchGroup } from '@matusgallo/mysabds'
import { useAuth } from '../../auth'

interface AvatarMenuProps {
  open: boolean
  onClose: () => void
  onOpenProfil: () => void
  onOpenZmenaHesla: () => void
}

export default function AvatarMenu({ open, onClose, onOpenProfil, onOpenZmenaHesla }: AvatarMenuProps) {
  const { logout } = useAuth()
  const [theme, setTheme] = useState('light')

  function handleThemeChange(value: string) {
    setTheme(value)
    document.documentElement.classList.toggle('dark', value === 'dark')
  }
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])

  if (!open) return null

  return (
    <div ref={ref} style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 100 }}>
      <Menu width={280}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size="md" initials="MG" color="orange" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>
              Matúš Gallo
            </div>
            <div style={{ fontSize: 12, lineHeight: '16px', color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              matus.gallo@blogic.cz
            </div>
          </div>
        </div>
        <MenuDivider />
        <MenuItem label="Profil" leadIcon={User} onClick={() => { onClose(); onOpenProfil() }} />
        <MenuItem label="Změna hesla" leadIcon={Shield} onClick={() => { onClose(); onOpenZmenaHesla() }} />
        <MenuDivider />
        <div style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sun size={16} color="var(--t-textSecondary)" />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-textPrimary)' }}>Téma</span>
          </div>
          <SwitchGroup
            options={[
              { label: '', value: 'light', icon: Sun },
              { label: '', value: 'dark', icon: Moon },
            ]}
            value={theme}
            onChange={handleThemeChange}
          />
        </div>
        <MenuDivider />
        <MenuItem label="Moje struktura" leadIcon={Network} onClick={onClose} />
        <MenuItem label="Podpora" leadIcon={HelpCircle} onClick={onClose} />
        <MenuDivider />
        <MenuItem label="Odhlásit" leadIcon={LogOut} variant="danger" onClick={() => { onClose(); logout() }} />
      </Menu>
    </div>
  )
}
