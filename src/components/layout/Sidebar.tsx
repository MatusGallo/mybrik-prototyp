import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Home,
  BarChart2,
  Briefcase,
  Users,
  FileText,
  Building2,
  Trophy,
  UserCog,
  Calendar,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react'
import { Sidebar as DSSidebar, NavItem, NavDivider } from '@matusgallo/mysabds'
const CemapIcon = ((_props: { size?: number | string }) => (
  <svg width={16} height={16} viewBox="184.5 13 68 68" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" fill="#d53827" d="m234.14 49.79q-4.29 4.26-9.98 5.4l-0.23-0.4-5.09-8.81q0.48 0.04 0.98 0.04 4.42 0 7.39-2.97 2.97-2.97 2.97-7.54 0-4.57-2.97-7.54-2.97-2.97-7.39-2.97-4.41 0-7.34 2.97-2.94 2.97-2.94 7.54c0 3.73 2.48 7.53 4.36 10.69l5.11 8.85 6.6 11.42-5.28 10.11-6.6-11.42-7.87-13.65c-3.25-5.63-6.14-8.93-6.14-16q0-8.44 5.83-14.28 5.82-5.82 14.27-5.82 8.46 0 14.32 5.82 5.86 5.83 5.86 14.28 0 8.45-5.86 14.28z" />
  </svg>
)) as unknown as LucideIcon

type NavNode =
  | { type: 'item'; label: string; icon?: LucideIcon; path?: string; external?: boolean }
  | { type: 'group'; label: string; icon: LucideIcon; children: NavNode[] }
  | { type: 'headline'; label: string }
  | { type: 'divider' }

const nav: NavNode[] = [
  { type: 'item', label: 'Přehled', icon: LayoutDashboard, path: '/nastanka' },
  {
    type: 'group', label: 'Nabídky', icon: Home,
    children: [
      { type: 'item', label: 'Seznam nabídek', path: '/nabidky' },
      { type: 'item', label: 'K autorizaci', path: '/nabidky/k-autorizaci' },
      { type: 'item', label: 'Moje nabídky', path: '/nabidky/moje' },
    ],
  },
  {
    type: 'group', label: 'Statistiky', icon: BarChart2,
    children: [
      { type: 'item', label: 'Rezervace', path: '/statistiky/rezervace' },
      { type: 'item', label: 'Platby', path: '/statistiky/platby' },
    ],
  },
  {
    type: 'group', label: 'Obchod', icon: Briefcase,
    children: [
      { type: 'item', label: 'Nabídka nemovitostí', path: '/obchod/nabidka-nemovitosti' },
      { type: 'item', label: 'Zájem o výkup', path: '/obchod/zajem-o-vykup' },
      { type: 'item', label: 'Lead Hypo', path: '/obchod/lead-hypo' },
      { type: 'item', label: 'Lead', path: '/obchod/lead' },
      { type: 'item', label: 'Poptávky', path: '/obchod/poptavky' },
    ],
  },
  { type: 'item', label: 'Klienti', icon: Users, path: '/klienti' },
  { type: 'item', label: 'Cemap', icon: CemapIcon, path: 'https://www.cemap.cz', external: true },
  { type: 'divider' },
  { type: 'item', label: 'Dokumenty', icon: FileText, path: '/dokumenty' },
  { type: 'item', label: 'Pobočky', icon: Building2, path: '/pobocky' },
  { type: 'item', label: 'HSP', icon: Trophy, path: '/hsp' },
  { type: 'item', label: 'Uživatelé', icon: UserCog, path: '/uzivatele' },
  { type: 'item', label: 'Kalendář', icon: Calendar, path: '/kalendar' },
  { type: 'item', label: 'Role a práva', icon: ShieldCheck, path: '/role-a-prava' },
  {
    type: 'group', label: 'Vyúčtování', icon: CreditCard,
    children: [
      { type: 'item', label: 'Náklady', path: '/vyuctovani/naklady' },
      { type: 'item', label: 'Storno', path: '/vyuctovani/storno' },
      { type: 'item', label: 'Provize', path: '/vyuctovani/provize' },
      { type: 'item', label: 'Výplaty', path: '/vyuctovani/vyplaty' },
      { type: 'item', label: 'Vyúčtování', path: '/vyuctovani/vyuctovani' },
      { type: 'item', label: 'Faktury', path: '/vyuctovani/faktury' },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(function Sidebar({ collapsed }, ref) {
  const navigate = useNavigate()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<string[]>(['Nabídky'])

  function toggleGroup(label: string) {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  function isActive(path?: string) {
    if (!path || path.startsWith('http')) return false
    return location.pathname === path
  }

  function isGroupActive(children: NavNode[]): boolean {
    return children.some(child => {
      if (child.type === 'item') return isActive(child.path)
      if (child.type === 'group') return isGroupActive(child.children)
      return false
    })
  }

  // DS <Sidebar> staví strom z plochého seznamu dětí: depth=0 zakládá skupinu,
  // následné depth>0 se k ní přilepí jako potomci (rail, gap:0). Mezery, padding,
  // pozadí, border-right i icon-only rail (přes SidebarContext) řeší sám.
  function buildItems(): React.ReactNode[] {
    const out: React.ReactNode[] = []

    for (let i = 0; i < nav.length; i++) {
      const node = nav[i]

      if (node.type === 'divider') {
        out.push(<NavDivider key={`divider-${i}`} />)
        continue
      }

      if (node.type === 'item') {
        if (node.external) {
          out.push(
            <NavItem
              key={node.label}
              label={node.label}
              icon={node.icon}
              depth={0}
              tail={{ type: 'tail-icon', icon: ArrowUpRight }}
              onClick={() => window.open(node.path, '_blank')}
            />
          )
        } else {
          out.push(
            <NavItem
              key={node.label}
              label={node.label}
              icon={node.icon}
              depth={0}
              active={isActive(node.path)}
              onClick={() => node.path && navigate(node.path)}
            />
          )
        }
        continue
      }

      if (node.type === 'group') {
        const open = openGroups.includes(node.label)
        const groupActive = isGroupActive(node.children)

        out.push(
          <NavItem
            key={node.label}
            label={node.label}
            icon={node.icon}
            depth={0}
            active={groupActive && !open}
            tail={{ type: 'chevron', open }}
            onClick={() => toggleGroup(node.label)}
          />
        )

        // Sbalený rail: děti posíláme vždy (DS z nich udělá hover flyout).
        // Rozbalený panel: děti jen když je skupina otevřená.
        if (collapsed || open) {
          node.children.forEach((child, ci) => {
            if (child.type !== 'item') return
            out.push(
              <NavItem
                key={child.label}
                label={child.label}
                depth={1}
                active={isActive(child.path)}
                isLast={ci === node.children.length - 1}
                onClick={() => child.path && navigate(child.path)}
              />
            )
          })
        }
      }
    }

    return out
  }

  return (
    <aside ref={ref} className="fixed top-[56px] left-0 bottom-0 z-40">
      <DSSidebar collapsed={collapsed} width={300} ariaLabel="Hlavní navigace">
        {buildItems()}
      </DSSidebar>
    </aside>
  )
})

export default Sidebar

