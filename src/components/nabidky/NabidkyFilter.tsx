import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { CheckboxItem, Chip } from '@matusgallo/mysabds'
import { stavyNabidky } from '../../data/mockData'

export interface NabidkyFilterValues {
  stavy: string[]
  vyhradniAno: boolean
  vyhradniNe: boolean
  typProdej: boolean
  typPronajem: boolean
  pobocka: string
  makler: string
  nemovitost: string
  datumVytvoreni: string
  datumPosledniZmeny: string
  nazevNabidky: string
  cenaVetsiNez: string
  cenaMensiNez: string
}

interface NabidkyFilterProps {
  onFilter: (values: NabidkyFilterValues) => void
  onClear: () => void
}

export default function NabidkyFilter({ onFilter, onClear }: NabidkyFilterProps) {
  const [checkedStavy, setCheckedStavy] = useState<Set<string>>(new Set())
  const [vyhradniAno, setVyhradniAno] = useState(false)
  const [vyhradniNe, setVyhradniNe] = useState(false)
  const [typProdej, setTypProdej] = useState(false)
  const [typPronajem, setTypPronajem] = useState(false)
  const [pobocka, setPobocka] = useState('4Brokers KOFAREAL')
  const [makler, setMakler] = useState('')
  const [nemovitost, setNemovitost] = useState('')
  const [datumVytvoreni, setDatumVytvoreni] = useState('')
  const [datumPosledniZmeny, setDatumPosledniZmeny] = useState('')
  const [nazevNabidky, setNazevNabidky] = useState('')
  const [cenaVetsiNez, setCenaVetsiNez] = useState('')
  const [cenaMensiNez, setCenaMensiNez] = useState('')

  function toggleStav(stav: string) {
    setCheckedStavy(prev => {
      const next = new Set(prev)
      if (next.has(stav)) next.delete(stav)
      else next.add(stav)
      return next
    })
  }

  const columns = [
    stavyNabidky.slice(0, 6),
    stavyNabidky.slice(6, 12),
    stavyNabidky.slice(12, 18),
    stavyNabidky.slice(18),
  ]

  return (
    <div className="bg-[var(--t-bgPrimary)] border border-[var(--t-borderPrimary)] rounded-lg mb-4 overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-6">
          {/* Stav nabídky */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--t-textTertiary)] uppercase tracking-wide mb-2">Stav nabídky</p>
            <div className="grid grid-cols-4 gap-x-6 gap-y-0.5">
              {columns.map((col, ci) => (
                <div key={ci} className="space-y-0.5">
                  {col.map(stav => (
                    <CheckboxItem
                      key={stav}
                      label={stav}
                      checked={checkedStavy.has(stav)}
                      onChange={() => toggleStav(stav)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Výhradní spolupráce */}
          <div className="min-w-[140px]">
            <p className="text-[11px] font-semibold text-[var(--t-textTertiary)] uppercase tracking-wide mb-2">Výhradní spolupráce</p>
            <div className="space-y-0.5">
              <CheckboxItem label="Ano" checked={vyhradniAno} onChange={setVyhradniAno} />
              <CheckboxItem label="Ne" checked={vyhradniNe} onChange={setVyhradniNe} />
            </div>
          </div>

          {/* Typ nabídky */}
          <div className="min-w-[120px]">
            <p className="text-[11px] font-semibold text-[var(--t-textTertiary)] uppercase tracking-wide mb-2">Typ nabídky</p>
            <div className="space-y-0.5">
              <CheckboxItem label="Prodej" checked={typProdej} onChange={setTypProdej} />
              <CheckboxItem label="Pronájem" checked={typPronajem} onChange={setTypPronajem} />
            </div>
          </div>
        </div>

        {/* Row 2 — text inputs */}
        <div className="grid grid-cols-6 gap-3">
          <FilterInput
            label="Pobočka"
            value={pobocka}
            onChange={setPobocka}
            tagValue={pobocka}
            onClearTag={() => setPobocka('')}
          />
          <FilterInput label="Makléř" value={makler} onChange={setMakler} />
          <FilterInput label="Nemovitost" value={nemovitost} onChange={setNemovitost} />
          <FilterInput label="Datum vytvoření" value={datumVytvoreni} onChange={setDatumVytvoreni} type="date" />
          <FilterInput label="Datum poslední změny" value={datumPosledniZmeny} onChange={setDatumPosledniZmeny} type="date" />
          <FilterInput label="Název nabídky" value={nazevNabidky} onChange={setNazevNabidky} />
        </div>

        {/* Row 3 — price */}
        <div className="grid grid-cols-6 gap-3">
          <FilterInput label="Cena větší než" value={cenaVetsiNez} onChange={setCenaVetsiNez} type="number" />
          <FilterInput label="Cena menší než" value={cenaMensiNez} onChange={setCenaMensiNez} type="number" />
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 border-t border-[var(--t-borderPrimary)]">
        <button
          onClick={() => onFilter({
            stavy: [...checkedStavy],
            vyhradniAno,
            vyhradniNe,
            typProdej,
            typPronajem,
            pobocka,
            makler,
            nemovitost,
            datumVytvoreni,
            datumPosledniZmeny,
            nazevNabidky,
            cenaVetsiNez,
            cenaMensiNez,
          })}
          className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition-colors"
        >
          <Search size={15} />
          FILTROVAT
        </button>
        <button
          onClick={onClear}
          className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
        >
          <X size={15} />
          SMAZAT FILTR
        </button>
      </div>
    </div>
  )
}

interface FilterInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  tagValue?: string
  onClearTag?: () => void
}

function FilterInput({ label, value, onChange, type = 'text', tagValue, onClearTag }: FilterInputProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[var(--t-textTertiary)] uppercase tracking-wide mb-1">{label}</p>
      {tagValue && onClearTag ? (
        <div className="min-h-[36px] flex flex-wrap gap-1 p-1.5 rounded-md border border-[var(--t-borderPrimary)] bg-[var(--t-bgPrimary)]">
          <Chip label={tagValue} onDismiss={onClearTag} size="sm" />
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-9 px-3 rounded-md border border-[var(--t-borderPrimary)] text-sm text-[var(--t-textPrimary)] placeholder-[var(--t-textTertiary)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      )}
    </div>
  )
}

