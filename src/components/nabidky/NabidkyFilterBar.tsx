import { useState, useEffect, useRef, forwardRef } from 'react'
import { SlidersHorizontal, Columns3Cog, Eye, EyeOff, Check } from 'lucide-react'
import type { LucideProps, LucideIcon } from 'lucide-react'

const BrandCheck = forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
  <Check ref={ref} {...props} color="var(--t-textMyDOCKPrimary)" />
)) as LucideIcon
import {
  FilterButton, FilterSelect, FilterIconButton,
  Chip, TextButton, Search,
  Menu, MenuItem, MenuDivider,
} from '@matusgallo/mysabds'
import { DateField, TextInputField } from '../shared/FilterDropdown'
import { stavyNabidky } from '../../data/mockData'
import { NABIDKY_COLUMNS } from './NabidkyTable'

export interface NabidkyFilterValues {
  search: string
  stavy: string[]
  typy: string[]
  vyhradni: string[]
  typNabidky: string[]
  datumVytvoreniOd: string
  datumVytvoreniDo: string
  datumPosledniZmenyOd: string
  datumPosledniZmenyDo: string
  pobocka: string
  makler: string
  nazevNabidky: string
  cenaVetsiNez: string
  cenaMensiNez: string
}

export const emptyFilterValues: NabidkyFilterValues = {
  search: '',
  stavy: [],
  typy: [],
  vyhradni: [],
  typNabidky: [],
  datumVytvoreniOd: '',
  datumVytvoreniDo: '',
  datumPosledniZmenyOd: '',
  datumPosledniZmenyDo: '',
  pobocka: '',
  makler: '',
  nazevNabidky: '',
  cenaVetsiNez: '',
  cenaMensiNez: '',
}

const TYPY_OBJEKTU = ['dům', 'byt', 'pozemek', 'komerční']

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function buildTags(f: NabidkyFilterValues) {
  const tags: Array<{ label: string; key: string }> = []
  f.stavy.forEach(s => tags.push({ label: s, key: `stav:${s}` }))
  f.typy.forEach(t => tags.push({ label: capitalize(t), key: `typ:${t}` }))
  f.vyhradni.forEach(v => tags.push({ label: v === 'ano' ? 'Výhradní: Ano' : 'Výhradní: Ne', key: `vyhradni:${v}` }))
  f.typNabidky.forEach(t => tags.push({ label: t === 'prodej' ? 'Prodej' : 'Pronájem', key: `typNabidky:${t}` }))
  if (f.datumVytvoreniOd) tags.push({ label: `Vytvořeno od: ${f.datumVytvoreniOd}`, key: 'datumVytvoreniOd' })
  if (f.datumVytvoreniDo) tags.push({ label: `Vytvořeno do: ${f.datumVytvoreniDo}`, key: 'datumVytvoreniDo' })
  if (f.datumPosledniZmenyOd) tags.push({ label: `Upraveno od: ${f.datumPosledniZmenyOd}`, key: 'datumPosledniZmenyOd' })
  if (f.datumPosledniZmenyDo) tags.push({ label: `Upraveno do: ${f.datumPosledniZmenyDo}`, key: 'datumPosledniZmenyDo' })
  if (f.pobocka) tags.push({ label: `Pobočka: ${f.pobocka}`, key: 'pobocka' })
  if (f.makler) tags.push({ label: `Makléř: ${f.makler}`, key: 'makler' })
  if (f.nazevNabidky) tags.push({ label: `Název: ${f.nazevNabidky}`, key: 'nazevNabidky' })
  if (f.cenaVetsiNez) tags.push({ label: `Cena > ${f.cenaVetsiNez}`, key: 'cenaVetsiNez' })
  if (f.cenaMensiNez) tags.push({ label: `Cena < ${f.cenaMensiNez}`, key: 'cenaMensiNez' })
  return tags
}

function removeTag(key: string, f: NabidkyFilterValues): NabidkyFilterValues {
  if (key.startsWith('stav:')) return { ...f, stavy: f.stavy.filter(s => `stav:${s}` !== key) }
  if (key.startsWith('typ:')) return { ...f, typy: f.typy.filter(t => `typ:${t}` !== key) }
  if (key.startsWith('vyhradni:')) return { ...f, vyhradni: f.vyhradni.filter(v => `vyhradni:${v}` !== key) }
  if (key.startsWith('typNabidky:')) return { ...f, typNabidky: f.typNabidky.filter(t => `typNabidky:${t}` !== key) }
  return { ...f, [key]: '' }
}

interface Props {
  onChange: (values: NabidkyFilterValues) => void
  hasData?: boolean
  hiddenCols?: Set<string>
  onToggleCol?: (key: string) => void
  onHideAllCols?: () => void
  onShowAllCols?: () => void
}

const LOCKED_COLS = new Set(['id', 'nabidka'])
const TOGGLEABLE_COLS = NABIDKY_COLUMNS.filter(c => !LOCKED_COLS.has(c.key))

export default function NabidkyFilterBar({ onChange, hasData = true, hiddenCols, onToggleCol, onHideAllCols, onShowAllCols }: Props) {
  const [values, setValues] = useState<NabidkyFilterValues>(emptyFilterValues)
  const [open, setOpen] = useState<string | null>(null)
  const [leavingTags, setLeavingTags] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function update(next: NabidkyFilterValues) {
    setValues(next)
    onChange(next)
  }

  function handleDismiss(key: string) {
    setLeavingTags(prev => new Set([...prev, key]))
    setTimeout(() => {
      setLeavingTags(prev => { const n = new Set(prev); n.delete(key); return n })
      setValues(prev => { const n = removeTag(key, prev); onChange(n); return n })
    }, 150)
  }

  function handleClearAll() {
    const keys = buildTags(values).map(t => t.key)
    setLeavingTags(new Set(keys))
    setTimeout(() => {
      setLeavingTags(new Set())
      setValues(emptyFilterValues)
      onChange(emptyFilterValues)
    }, 150)
  }

  function toggleMulti(field: 'stavy' | 'typy' | 'vyhradni' | 'typNabidky', value: string) {
    const arr = values[field]
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    update({ ...values, [field]: next })
  }

  function toggleDropdown(id: string) {
    setOpen(prev => (prev === id ? null : id))
  }

  const tags = buildTags(values)
  const hasFiltr = !!(
    values.datumVytvoreniOd || values.datumVytvoreniDo ||
    values.datumPosledniZmenyOd || values.datumPosledniZmenyDo ||
    values.nazevNabidky || values.cenaVetsiNez || values.cenaMensiNez
  )

  return (
    <div ref={ref} className="mb-4" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <Search
          placeholder="Hledat dle názvu, pobočky, makléře"
          value={values.search}
          onChange={v => update({ ...values, search: v })}
          width={280}
          size="sm"
        />

        {/* Stav */}
        <div style={{ position: 'relative' }}>
          <div className="filter-btn-wrap"><FilterButton label="Stav" active={values.stavy.length > 0} onClick={() => toggleDropdown('stav')} /></div>
          {open === 'stav' && (
            <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, maxHeight: 300, overflowY: 'auto', animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both' }} width={320}>
              {stavyNabidky.map(stav => (
                <MenuItem key={stav} label={stav} trailIcon={values.stavy.includes(stav) ? BrandCheck : undefined} onClick={() => toggleMulti('stavy', stav)} />
              ))}
            </Menu>
          )}
        </div>

        {/* Typ nabídky */}
        <div style={{ position: 'relative' }}>
          <div className="filter-btn-wrap"><FilterButton label="Typ" active={values.typNabidky.length > 0} onClick={() => toggleDropdown('typNabidky')} /></div>
          {open === 'typNabidky' && (
            <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both' }} width={320}>
              <MenuItem label="Prodej" trailIcon={values.typNabidky.includes('prodej') ? BrandCheck : undefined} onClick={() => toggleMulti('typNabidky', 'prodej')} />
              <MenuItem label="Pronájem" trailIcon={values.typNabidky.includes('pronajem') ? BrandCheck : undefined} onClick={() => toggleMulti('typNabidky', 'pronajem')} />
            </Menu>
          )}
        </div>

        {/* Objekt */}
        <div style={{ position: 'relative' }}>
          <div className="filter-btn-wrap"><FilterButton label="Objekt" active={values.typy.length > 0} onClick={() => toggleDropdown('objekt')} /></div>
          {open === 'objekt' && (
            <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both' }} width={320}>
              {TYPY_OBJEKTU.map(typ => (
                <MenuItem key={typ} label={capitalize(typ)} trailIcon={values.typy.includes(typ) ? BrandCheck : undefined} onClick={() => toggleMulti('typy', typ)} />
              ))}
            </Menu>
          )}
        </div>

        {/* Makléř */}
        <div style={{ position: 'relative' }}>
          <div className="filter-btn-wrap"><FilterButton label="Makléř" active={!!values.makler} onClick={() => toggleDropdown('makler')} /></div>
          {open === 'makler' && (
            <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both' }} width={320}>
              <div style={{ padding: '8px 12px' }}>
                <TextInputField label="Makléř" value={values.makler} onChange={v => update({ ...values, makler: v })} />
              </div>
            </Menu>
          )}
        </div>

        {/* Pobočka */}
        <div style={{ position: 'relative' }}>
          <div className="filter-btn-wrap"><FilterButton label="Pobočka" active={!!values.pobocka} onClick={() => toggleDropdown('pobocka')} /></div>
          {open === 'pobocka' && (
            <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both' }} width={320}>
              <div style={{ padding: '8px 12px' }}>
                <TextInputField label="Pobočka" value={values.pobocka} onChange={v => update({ ...values, pobocka: v })} />
              </div>
            </Menu>
          )}
        </div>

        {/* Výhradní spolupráce */}
        <div style={{ position: 'relative' }}>
          <div className="filter-btn-wrap"><FilterButton label="Výhradní spolupráce" active={values.vyhradni.length > 0} onClick={() => toggleDropdown('vyhradni')} /></div>
          {open === 'vyhradni' && (
            <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both' }} width={320}>
              <MenuItem label="Ano" trailIcon={values.vyhradni.includes('ano') ? BrandCheck : undefined} onClick={() => toggleMulti('vyhradni', 'ano')} />
              <MenuItem label="Ne" trailIcon={values.vyhradni.includes('ne') ? BrandCheck : undefined} onClick={() => toggleMulti('vyhradni', 'ne')} />
            </Menu>
          )}
        </div>

        {/* Filtr (Vytvořeno, Upraveno, Název, Cena) */}
        <div style={{ position: 'relative' }}>
          <FilterSelect label="Filtr" leadIcon={SlidersHorizontal} selected={hasFiltr} onClick={() => toggleDropdown('filtr')} />
          {open === 'filtr' && (
            <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 'auto', right: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both' }} width={320}>
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DateField label="Vytvořeno od" value={values.datumVytvoreniOd} onChange={v => update({ ...values, datumVytvoreniOd: v })} />
                <DateField label="Vytvořeno do" value={values.datumVytvoreniDo} onChange={v => update({ ...values, datumVytvoreniDo: v })} />
                <DateField label="Upraveno od" value={values.datumPosledniZmenyOd} onChange={v => update({ ...values, datumPosledniZmenyOd: v })} />
                <DateField label="Upraveno do" value={values.datumPosledniZmenyDo} onChange={v => update({ ...values, datumPosledniZmenyDo: v })} />
                <TextInputField label="Název nabídky" value={values.nazevNabidky} onChange={v => update({ ...values, nazevNabidky: v })} />
                <TextInputField label="Cena větší než" value={values.cenaVetsiNez} onChange={v => update({ ...values, cenaVetsiNez: v })} type="number" />
                <TextInputField label="Cena menší než" value={values.cenaMensiNez} onChange={v => update({ ...values, cenaMensiNez: v })} type="number" />
              </div>
            </Menu>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {hasData && (
          <div style={{ position: 'relative' }}>
            <FilterIconButton
              icon={Columns3Cog}
              tooltip="Nastavit sloupce"
              active={open === 'columns'}
              onClick={() => toggleDropdown('columns')}
            />
            {open === 'columns' && (() => {
              const visible = TOGGLEABLE_COLS.filter(c => !hiddenCols?.has(c.key))
              const hidden  = TOGGLEABLE_COLS.filter(c =>  hiddenCols?.has(c.key))
              return (
                <Menu style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 100, animation: 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both' }} width={320}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {tags.map(tag => (
            <div
              key={tag.key}
              style={{
                animation: leavingTags.has(tag.key)
                  ? 'tagExit 0.18s cubic-bezier(0.4, 0, 1, 1) forwards'
                  : 'tagEnter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              }}
            >
              <Chip label={tag.label} size="sm" onDismiss={() => handleDismiss(tag.key)} />
            </div>
          ))}
          <div style={{ marginLeft: 4 }}>
            <TextButton label="Zrušit filtry" variant="brand" size="sm" onClick={handleClearAll} />
          </div>
        </div>
      </div>
    </div>
  )
}


