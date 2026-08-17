import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleAlert, Search } from 'lucide-react'
import { Input, SelectItem, SelectMenu, typography } from '@matusgallo/mysabds'
import { najdiAdresy, popisAdresy, popisObce, type AdresniMisto } from '../../data/adresyRegistr'

/**
 * Pole „Ulice" s našeptávačem adresních míst - vybraná adresa se rozpadne do
 * ostatních polí (číslo popisné, orientační, PSČ, město).
 *
 * Design system typeahead nemá, takže je složený z `Input` a rozbaleného seznamu
 * `SelectMenu` + `SelectItem`, aby nabídka vypadala jako u `Selectu`. Klávesnice
 * je proto obsluhovaná tady: šipky vedou po nabídce, Enter vybírá, Escape zavírá.
 * Aktivní řádek nese `variant="selected"`, protože jiný stav položka nemá.
 *
 * Ruční psaní zůstává - kdo v registru adresu nenajde, vyplní pole sám.
 */

/** Kratší dotaz vrací půl registru, nabídka by nic neupřesnila. */
const MIN_ZNAKU = 2

/** Panel seznamu ukazuje 8,8 položky jako `SelectMenu`. */
const PANEL_MAX_H = 285.6
const PANEL_GAP = 4

interface Props {
  label?: string
  required?: boolean
  /** Hodnota pole Ulice. */
  value: string
  onChange: (ulice: string) => void
  /** Vybraná adresa z registru - volající si ji rozpadne do svých polí. */
  onVybrat: (adresa: AdresniMisto) => void
  error?: string
  placeholder?: string
  /**
   * Nápověda pod polem, dokud uživatel adresu nevybral. Výchozí text mluví
   * o rozpadu do dalších polí - formulář s adresou v jednom poli si ho přepíše.
   */
  helperText?: string
}

function NicNenalezeno() {
  return (
    <div style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <CircleAlert style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: 'var(--t-textSecondary)' }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ ...typography.body14Regular, color: 'var(--t-textPrimary)' }}>Nic nenalezeno</div>
        <div style={{ ...typography.body12Regular, color: 'var(--t-textSecondary)' }}>
          Vašemu hledání neodpovídá žádná adresa. Vyplňte ji ručně.
        </div>
      </div>
    </div>
  )
}

export default function AdresaNaseptavac({
  label = 'Ulice', required, value, onChange, onVybrat, error,
  placeholder = 'Začněte psát ulici',
  helperText = 'Začněte psát a vyberte adresu z nabídky - ostatní pole se doplní.',
}: Props) {
  const [open, setOpen] = useState(false)
  const [aktivni, setAktivni] = useState(-1)
  // Potvrzení, že hodnoty v ostatních polích nepřišly od uživatele, ale z registru.
  const [doplneno, setDoplneno] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})

  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const vysledky = open ? najdiAdresy(value) : []

  // Panel visí v portálu, takže se k poli musí dopočítat sám - i při rolování.
  useLayoutEffect(() => {
    if (!open) return

    function umistit() {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect) return
      const podPolem = window.innerHeight - rect.bottom - PANEL_GAP
      const nadPolem = rect.top - PANEL_GAP
      const zaklad: React.CSSProperties = { position: 'fixed', left: rect.left, width: rect.width, zIndex: 9999 }
      setPanelStyle(podPolem >= PANEL_MAX_H || podPolem >= nadPolem
        ? { ...zaklad, top: rect.bottom + PANEL_GAP }
        : { ...zaklad, bottom: window.innerHeight - rect.top + PANEL_GAP })
    }

    umistit()
    window.addEventListener('scroll', umistit, true)
    window.addEventListener('resize', umistit)
    return () => {
      window.removeEventListener('scroll', umistit, true)
      window.removeEventListener('resize', umistit)
    }
  }, [open])

  // Klik mimo pole i mimo panel nabídku zavře. Panel je v portálu, takže ho
  // `contains` na poli nezahrne a klik do nabídky by ji zavřel před vybráním.
  useEffect(() => {
    if (!open) return
    function naKlik(e: MouseEvent) {
      const cil = e.target as Node
      if (anchorRef.current?.contains(cil) || panelRef.current?.contains(cil)) return
      setOpen(false)
      setAktivni(-1)
    }
    document.addEventListener('mousedown', naKlik)
    return () => document.removeEventListener('mousedown', naKlik)
  }, [open])

  function zmenit(nova: string) {
    onChange(nova)
    setDoplneno(false)
    setAktivni(-1)
    setOpen(nova.trim().length >= MIN_ZNAKU)
  }

  function vybrat(adresa: AdresniMisto) {
    onVybrat(adresa)
    setDoplneno(true)
    setOpen(false)
    setAktivni(-1)
  }

  function naKlavesu(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (!open) return
      e.stopPropagation()
      setOpen(false)
      setAktivni(-1)
      return
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Šipka dolů nabídku i otevře, když ji uživatel mezitím zavřel.
      if (!open) {
        if (value.trim().length < MIN_ZNAKU) return
        e.preventDefault()
        setOpen(true)
        setAktivni(0)
        return
      }
      if (vysledky.length === 0) return
      e.preventDefault()
      const posun = e.key === 'ArrowDown' ? 1 : -1
      setAktivni(i => (i + posun + vysledky.length) % vysledky.length)
      return
    }

    if (e.key === 'Enter' && open && aktivni >= 0) {
      e.preventDefault()
      vybrat(vysledky[aktivni])
    }
  }

  return (
    // Popisek pro odečítač a stav rozbalení nese `Input` sám; ten je zvenčí
    // nenastavitelný, takže přístupnost je omezená stejně jako u `Selectu` v DS.
    <div ref={anchorRef} onKeyDown={naKlavesu}>
      <Input
        label={label}
        required={required}
        placeholder={placeholder}
        leadIcon={Search}
        value={value}
        onChange={zmenit}
        error={error}
        helperText={doplneno ? 'Adresa byla doplněna z registru adres.' : helperText}
        width="100%"
      />

      {open && createPortal(
        <div ref={panelRef} style={panelStyle}>
          <SelectMenu role="listbox" width="100%">
            {vysledky.length === 0 ? <NicNenalezeno /> : vysledky.map((adresa, i) => (
              <SelectItem
                key={`${adresa.ulice}-${adresa.psc}-${adresa.cisloPopisne}`}
                label={popisAdresy(adresa)}
                sub={popisObce(adresa)}
                role="option"
                wrap
                variant={i === aktivni ? 'selected' : 'default'}
                onClick={() => vybrat(adresa)}
              />
            ))}
          </SelectMenu>
        </div>,
        document.body,
      )}
    </div>
  )
}
