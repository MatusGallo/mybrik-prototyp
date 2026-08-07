import type { ReactNode } from 'react'
import { Download, MessageSquare, Plus } from 'lucide-react'
import { Button, Pagination } from '@matusgallo/mysabds'

export interface PageAction {
  label: string
  variant?: 'primary' | 'export' | 'dark'
  icon?: 'plus' | 'download' | 'message-square'
  onClick?: () => void
}

interface ListPageShellProps {
  title: string
  subtitle?: string
  actions?: PageAction[]
  filterBar?: ReactNode
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  totalCount: number
  pageSize?: number
  children: ReactNode
}

const variantMap = {
  primary: 'primary',
  export: 'outlined',
  dark: 'neutral',
} as const

const iconMap = {
  plus: Plus,
  download: Download,
  'message-square': MessageSquare,
} as const

function ActionButton({ action }: { action: PageAction }) {
  const variant = variantMap[action.variant ?? 'primary']
  const leadIcon = action.icon ? iconMap[action.icon] : undefined
  return (
    <Button
      label={action.label}
      variant={variant}
      size="md"
      leadIcon={leadIcon}
      onClick={action.onClick}
    />
  )
}

export default function ListPageShell({
  title, subtitle, actions = [], filterBar,
  page, totalPages, onPageChange,
  children,
}: ListPageShellProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-[var(--t-textPrimary)] leading-none">{title}</h1>
        <div className="flex items-center gap-2">
          {actions.map((a, i) => <ActionButton key={i} action={a} />)}
        </div>
      </div>
      {subtitle && <p className="text-xs text-[var(--t-textTertiary)] -mt-3 mb-4">{subtitle}</p>}

      {/* Filter bar */}
      {filterBar && <div className="mb-3">{filterBar}</div>}

      {/* Table */}
      <div>
        {children}
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  )
}
