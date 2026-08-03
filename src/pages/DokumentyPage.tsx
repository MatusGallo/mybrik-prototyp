import { useState, useEffect, useRef } from 'react'
import { Folder, FolderOpen, File, Search, Plus, CloudUpload, CloudDownload, Upload, SlidersHorizontal, MoreHorizontal, Pencil, Trash, ChevronRight, X } from 'lucide-react'
import { Button, IconButton, Menu, MenuItem, Breadcrumbs, Form, Input, Select } from '@matusgallo/mysabds'
import { dokumentySoubory } from '../data/mockOstatni'

interface FolderNode {
  id: string
  name: string
  count: number
  children?: FolderNode[]
}

const TREE: FolderNode[] = [
  { id: '1', name: 'Dokumenty AJ', count: 45 },
  { id: '2', name: 'Videa pro prezentaci makléřů', count: 11 },
  {
    id: '3', name: 'Ceník', count: 13, children: [
      { id: '3-1', name: 'Ceníky advokáti', count: 0 },
      { id: '3-2', name: 'Ostatní', count: 3 },
      { id: '3-3', name: 'Ceníky marketing', count: 8 },
      { id: '3-4', name: 'Ceníky ostatní služby', count: 2 },
    ],
  },
  { id: '4', name: 'Návody a objednávky', count: 18 },
  { id: '5', name: 'Obchod', count: 1 },
  { id: '6', name: 'Makléři', count: 0 },
  { id: '7', name: 'Ostatní', count: 107 },
]

function findFolder(nodes: FolderNode[], id: string): FolderNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findFolder(n.children, id)
      if (found) return found
    }
  }
}

function getAncestors(nodes: FolderNode[], id: string, path: FolderNode[] = []): FolderNode[] {
  for (const n of nodes) {
    if (n.id === id) return [...path, n]
    if (n.children) {
      const result = getAncestors(n.children, id, [...path, n])
      if (result.length) return result
    }
  }
  return []
}

const DEPTH_INDENT: Record<number, number> = { 0: 0, 1: 20, 2: 48 }

function CountBadge({ count }: { count: number }) {
  return (
    <div style={{
      height: 20, padding: '0 6px', flexShrink: 0,
      background: 'var(--t-bgPrimary)', borderRadius: 9999,
      outline: '1px solid var(--t-borderPrimary)', outlineOffset: -1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        fontSize: 11, fontFamily: 'Inter', fontWeight: 600,
        lineHeight: '12px', letterSpacing: '0.11px',
        color: 'var(--t-textPrimary)',
      }}>{count}</span>
    </div>
  )
}

function FolderTreeItem({
  folder, depth = 0, selected, expanded, onSelect, onToggle,
}: {
  folder: FolderNode
  depth?: number
  selected: string | null
  expanded: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const isActive = selected === folder.id
  const isExpanded = expanded.has(folder.id)
  const hasChildren = (folder.children?.length ?? 0) > 0
  const Icon = hasChildren && isExpanded ? FolderOpen : Folder
  const indent = DEPTH_INDENT[Math.min(depth, 2)] ?? 48

  const bg = isActive ? 'var(--t-bgMyDOCKTertiary)' : hovered ? 'var(--t-bgHover)' : 'transparent'
  const iconColor = isActive ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textSecondary)'
  const textColor = isActive ? 'var(--t-textMyDOCKPrimary)' : 'var(--t-textPrimary)'

  return (
    <div>
      <button
        onClick={() => { onSelect(folder.id); if (hasChildren) onToggle(folder.id) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%', height: 32,
          paddingLeft: 12 + indent, paddingRight: 8,
          display: 'flex', alignItems: 'center', gap: 8,
          borderRadius: isActive || hovered ? 8 : 0,
          background: bg, border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        <Icon size={16} style={{ flexShrink: 0, color: iconColor }} />
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 500, lineHeight: '20px',
          color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {folder.name}
        </span>
        {hasChildren ? (
          <ChevronRight size={16} style={{
            flexShrink: 0, color: 'var(--t-textSecondary)',
            transform: isExpanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s',
          }} />
        ) : (
          <CountBadge count={folder.count} />
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map(child => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selected={selected}
              expanded={expanded}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}


export default function DokumentyPage() {
  const [selected, setSelected] = useState<string | null>('3')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['3']))
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderKategorie, setNewFolderKategorie] = useState('')
  const [newFolderPrava, setNewFolderPrava] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedFolder = selected ? findFolder(TREE, selected) : null
  const ancestors = selected ? getAncestors(TREE, selected) : []
  const subFolders = selectedFolder?.children ?? []

  const breadcrumbItems = [
    { label: 'Dokumenty', onClick: () => setSelected(null) },
    ...ancestors.map(crumb => ({
      label: crumb.name,
      onClick: () => setSelected(crumb.id),
    })),
  ]

  return (
    <>
    <div style={{ margin: -24, display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

      {/* Left sidebar */}
      <div style={{
        width: 320, flexShrink: 0, alignSelf: 'stretch',
        background: 'var(--t-bgPrimary)',
        borderRight: '1px solid var(--t-borderPrimary)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 600, lineHeight: '28px', color: 'var(--t-textPrimary)', flex: 1 }}>Dokumenty</span>
          <IconButton icon={Plus} variant="ghost" size="md" tooltip="Nová složka" onClick={() => setNewFolderOpen(true)} />
          <IconButton icon={CloudUpload} variant="ghost" size="md" tooltip="Nahrát dokument" />
        </div>
        <div style={{ height: 1, background: 'var(--t-borderPrimary)' }} />

        {/* Search row */}
        <div style={{ height: 48, padding: 16, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, padding: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Search size={16} style={{ color: 'var(--t-textSecondary)' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>Vyhledat</span>
        </div>
        <div style={{ height: 1, background: 'var(--t-borderPrimary)' }} />

        {/* Folder tree */}
        <div style={{ padding: 8, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {TREE.map(folder => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              selected={selected}
              expanded={expanded}
              onSelect={setSelected}
              onToggle={toggleExpand}
            />
          ))}
        </div>
      </div>

      {/* Right content */}
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

        {/* Breadcrumb + Title row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Breadcrumbs items={breadcrumbItems} />

          {/* Title + toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)' }}>
              {selectedFolder?.name ?? 'Dokumenty'}
            </span>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
              {/* Search pill */}
              <div style={{
                width: 240, height: 32, paddingTop: 4, paddingBottom: 4, paddingLeft: 4, paddingRight: 12,
                background: 'var(--t-bgPrimary)', borderRadius: 9999,
                outline: '1px solid var(--t-borderPrimary)', outlineOffset: -1,
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'text',
              }}>
                <div style={{ width: 24, height: 24, padding: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Search size={16} style={{ color: 'var(--t-textSecondary)' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>Vyhledat</span>
              </div>
              {/* Filter button */}
              <div style={{
                width: 32, height: 32, padding: 8,
                background: 'var(--t-bgPrimary)', borderRadius: 9999,
                outline: '1px solid var(--t-borderPrimary)', outlineOffset: -1,
                display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
              }}>
                <SlidersHorizontal size={16} style={{ color: 'var(--t-textPrimary)' }} />
              </div>
              {/* Upload button */}
              <Button label="Nahrát" variant="primary" size="md" leadIcon={Upload} />
            </div>
          </div>
        </div>

        {/* Složky section */}
        {subFolders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>Složky</span>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {subFolders.map(child => (
                <div key={child.id} style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: 237, height: 56, paddingLeft: 12, paddingRight: 12,
                      background: 'var(--t-bgSecondary)', borderRadius: 8,
                      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    }}
                    onClick={() => { setSelected(child.id); setExpanded(prev => new Set([...prev, child.id])) }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <Folder size={16} style={{ flexShrink: 0, color: 'var(--t-textSecondary)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {child.name}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 400, lineHeight: '16px', letterSpacing: '0.12px', color: 'var(--t-textSecondary)' }}>
                          {child.count} {child.count === 1 ? 'Soubor' : 'Souborů'}
                        </div>
                      </div>
                    </div>
                    <div onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === child.id ? null : child.id) }}>
                      <IconButton icon={MoreHorizontal} variant="ghost" size="md" />
                    </div>
                  </div>
                  {menuOpen === child.id && (
                    <div ref={menuRef} style={{ position: 'absolute', top: 60, right: 0, zIndex: 50 }}>
                      <Menu>
                        <MenuItem label="Přejmenovat" leadIcon={Pencil} onClick={() => setMenuOpen(null)} />
                        <MenuItem label="Smazat" leadIcon={Trash} variant="danger" onClick={() => setMenuOpen(null)} />
                      </Menu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Soubory section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>Soubory</span>

          <div>
            {/* Table header */}
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <div style={{
                flex: 1, height: 40, background: 'var(--t-bgSecondary)',
                borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
                padding: '0 16px', display: 'flex', alignItems: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>Název</span>
              </div>
              <div style={{ width: 160, height: 40, background: 'var(--t-bgSecondary)', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>Velikost</span>
              </div>
              <div style={{ flex: 1, height: 40, background: 'var(--t-bgSecondary)', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>Kategorie</span>
              </div>
              <div style={{ width: 120, height: 40, background: 'var(--t-bgSecondary)', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>Práva</span>
              </div>
              <div style={{
                width: 52, height: 40, background: 'var(--t-bgSecondary)',
                borderTopRightRadius: 8, borderBottomRightRadius: 8,
              }} />
            </div>

            {/* Table rows */}
            {dokumentySoubory.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 14, color: 'var(--t-textTertiary)' }}>
                Žádný soubor
              </div>
            ) : (
              dokumentySoubory.map((file, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', height: 48,
                    borderBottom: '1px solid var(--t-borderPrimary)',
                    background: 'var(--t-bgPrimary)', cursor: 'pointer',
                  }}
                >
                  <div style={{ flex: 1, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <File size={16} style={{ flexShrink: 0, color: 'var(--t-textSecondary)' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.jmeno}
                    </span>
                  </div>
                  <div style={{ width: 160, padding: '0 16px', fontSize: 14, fontWeight: 400, lineHeight: '20px', color: 'var(--t-textPrimary)', flexShrink: 0 }}>
                    {file.velikost}
                  </div>
                  <div style={{ flex: 1, padding: '0 16px', fontSize: 14, fontWeight: 400, lineHeight: '20px', color: 'var(--t-textPrimary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.kategorie}
                  </div>
                  <div style={{ width: 120, padding: '0 16px', fontSize: 14, fontWeight: 400, lineHeight: '20px', color: 'var(--t-textPrimary)', flexShrink: 0 }}>
                    {file.prava}
                  </div>
                  <div style={{ width: 52, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <IconButton icon={CloudDownload} variant="ghost" size="md" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

    {/* New folder modal */}
    {newFolderOpen && (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(16, 26, 35, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={() => setNewFolderOpen(false)}
      >
        <div onClick={e => e.stopPropagation()}>
          <Form
            width={720}
            minHeight={0}
            footer={{
              actions: [
                { label: 'Vytvořit', variant: 'primary', onClick: () => setNewFolderOpen(false) },
              ],
            }}
          >
            <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: 24, background: 'var(--t-bgSecondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)', fontFamily: 'Inter' }}>Nová kategorie</span>
              <IconButton icon={X} variant="ghost" size="md" onClick={() => setNewFolderOpen(false)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
              <Input
                label="Název"
                value={newFolderName}
                onChange={setNewFolderName}
                width="100%"
              />
              <Select
                label="Kategorie"
                placeholder="Vyberte kategorii"
                value={newFolderKategorie}
                onChange={setNewFolderKategorie}
                options={TREE.map(f => ({ value: f.id, label: f.name }))}
                width="100%"
              />
              <Select
                label="Práva"
                placeholder="Vyberte práva"
                value={newFolderPrava}
                onChange={setNewFolderPrava}
                options={[
                  { value: 'makleri', label: 'Makléři' },
                  { value: 'fransizy', label: 'Franšízy' },
                  { value: 'vsichni', label: 'Všichni' },
                ]}
                width="100%"
              />
            </div>
          </Form>
        </div>
      </div>
    )}
    </>
  )
}
