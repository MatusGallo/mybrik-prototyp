import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Modal, Select, TextArea, Chip, Alert, Divider, isFloatingPanelOpen,
} from '@matusgallo/mysabds'

// ── Nastavení automatického odesílání statistik klientovi ─────────────────────

export type StatsFrekvence = 'denne' | 'den-v-tydnu' | 'den-v-mesici'

export interface StatsAutoSettings {
  active: boolean
  frekvence: StatsFrekvence
  denVTydnu: string   // 'po'..'ne'
  denVMesici: string  // '1'..'28' | 'posledni'
  opakovani: string   // 'tyden' | '2tydny' | '3tydny' | 'mesic'
  prijemci: string[]
  kopie: string[]
  text: string
}

export const FREKVENCE_OPTIONS = [
  { value: 'denne',        label: 'Denně' },
  { value: 'den-v-tydnu',  label: 'Den v týdnu' },
  { value: 'den-v-mesici', label: 'Den v měsíci' },
]

export const DEN_V_TYDNU_OPTIONS = [
  { value: 'po', label: 'Pondělí' },
  { value: 'ut', label: 'Úterý' },
  { value: 'st', label: 'Středa' },
  { value: 'ct', label: 'Čtvrtek' },
  { value: 'pa', label: 'Pátek' },
  { value: 'so', label: 'Sobota' },
  { value: 'ne', label: 'Neděle' },
]

export const DEN_V_MESICI_OPTIONS = [
  ...Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}.` })),
  { value: 'posledni', label: 'Poslední den v měsíci' },
]

export const OPAKOVANI_OPTIONS = [
  { value: 'tyden',   label: 'Každý týden' },
  { value: '2tydny',  label: 'Každé dva týdny' },
  { value: '3tydny',  label: 'Každé tři týdny' },
  { value: 'mesic',   label: 'Každý měsíc' },
]

// Výchozí šablona e-mailu — hranaté závorky označují údaje doplněné při odeslání.
export function defaultStatsEmail(opts: {
  maklerJmeno?: string
  maklerTelefon?: string
  maklerEmail?: string
}): string {
  const podpis = [opts.maklerJmeno, opts.maklerTelefon, opts.maklerEmail]
    .filter(Boolean)
    .join('\n')
  return (
    'Vážený kliente,\n\n' +
    'v příloze zasílám statistiky návštěvnosti za období [rozsah dat] k Vaší nemovitosti [název nemovitosti].\n\n' +
    'Za uvedené období jsme zaznamenali:\n' +
    '- [počet] nových poptávek\n' +
    '- [počet] domluvených prohlídek\n\n' +
    'Podrobnější informace naleznete v přiloženém PDF souboru.\n\n' +
    'Pěkný den\n\n' +
    (podpis || '[jméno makléře]\n[telefon]\n[e-mail]')
  )
}

export function defaultStatsSettings(opts: {
  maklerJmeno?: string
  maklerTelefon?: string
  maklerEmail?: string
  maklerEmailKopie?: string
}): StatsAutoSettings {
  return {
    active: false,
    frekvence: 'den-v-tydnu',
    denVTydnu: '',
    denVMesici: '',
    opakovani: '',
    prijemci: [],
    kopie: opts.maklerEmailKopie ? [opts.maklerEmailKopie] : [],
    text: defaultStatsEmail(opts),
  }
}

// Lidsky čitelný souhrn nastavení pro widget na detailu nabídky.
export function statsSummaryLabel(s: StatsAutoSettings): string {
  if (!s.active) return 'Neposílat'
  if (s.frekvence === 'denne') return 'Denně'
  const opak = OPAKOVANI_OPTIONS.find(o => o.value === s.opakovani)?.label
  const den = s.frekvence === 'den-v-tydnu'
    ? DEN_V_TYDNU_OPTIONS.find(o => o.value === s.denVTydnu)?.label
    : DEN_V_MESICI_OPTIONS.find(o => o.value === s.denVMesici)?.label
  if (opak && den) return `${opak} · ${den}`
  return opak ?? den ?? 'Nastaveno'
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Vstup pro zadání více e-mailů (chip input) ────────────────────────────────

function EmailChipInput({
  label, helperText, emails, onChange, disabled, error,
}: {
  label: string
  helperText?: string
  emails: string[]
  onChange: (emails: string[]) => void
  disabled?: boolean
  error?: string
}) {
  const [draft, setDraft] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function commit(raw: string) {
    const value = raw.trim().replace(/,$/, '').trim()
    if (!value) return true
    if (!EMAIL_RE.test(value)) {
      setLocalError('Zadejte platnou e-mailovou adresu.')
      return false
    }
    if (emails.includes(value)) {
      setDraft('')
      return true
    }
    onChange([...emails, value])
    setDraft('')
    setLocalError(null)
    return true
  }

  const shownError = error ?? localError

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: disabled ? 0.5 : 1 }}>
      <label style={{ fontSize: 14, fontWeight: 500, lineHeight: '20px', color: 'var(--t-textPrimary)' }}>
        {label}
      </label>
      <div
        onClick={() => !disabled && inputRef.current?.focus()}
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6,
          minHeight: 32, padding: '4px 8px',
          borderRadius: 8,
          border: `1px solid ${shownError ? 'var(--t-borderDanger, #DC2626)' : 'var(--t-borderPrimary)'}`,
          background: disabled ? 'var(--t-bgSecondary)' : 'var(--t-bgPrimary)',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      >
        {emails.map(e => (
          <Chip
            key={e}
            label={e}
            size="sm"
            onDismiss={disabled ? undefined : () => onChange(emails.filter(x => x !== e))}
          />
        ))}
        <input
          ref={inputRef}
          type="email"
          disabled={disabled}
          value={draft}
          onChange={ev => { setDraft(ev.target.value); setLocalError(null) }}
          onKeyDown={ev => {
            if (ev.key === 'Enter' || ev.key === ',') {
              ev.preventDefault()
              commit(draft)
            } else if (ev.key === 'Backspace' && !draft && emails.length) {
              onChange(emails.slice(0, -1))
            }
          }}
          onBlur={() => commit(draft)}
          placeholder={emails.length ? '' : 'Zadejte e-mail a stiskněte Enter'}
          style={{
            flex: 1, minWidth: 160,
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14, lineHeight: '20px', color: 'var(--t-textPrimary)',
            padding: '2px 0',
          }}
        />
      </div>
      {shownError
        ? <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--t-textDanger, #DC2626)' }}>{shownError}</span>
        : helperText
          ? <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--t-textSecondary)' }}>{helperText}</span>
          : null}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface Props {
  initial: StatsAutoSettings
  onClose: () => void
  onSave: (s: StatsAutoSettings) => void
}

export default function AutomatickeStatistikyModal({ initial, onClose, onSave }: Props) {
  const [frekvence, setFrekvence] = useState<StatsFrekvence>(initial.frekvence)
  const [denVTydnu, setDenVTydnu] = useState(initial.denVTydnu)
  const [denVMesici, setDenVMesici] = useState(initial.denVMesici)
  const [opakovani, setOpakovani] = useState(initial.opakovani)
  const [prijemci, setPrijemci] = useState<string[]>(initial.prijemci)
  const [kopie, setKopie] = useState<string[]>(initial.kopie)
  const [text, setText] = useState(initial.text)
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Nad rozbaleným seznamem nebo kalendářem patří Escape jemu, ne modálu -
      // jinak jeden stisk zavře obojí a rozepsaný formulář je pryč.
      if (isFloatingPanelOpen()) return
      onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // „Denně" nepotřebuje výběr dne ani intervalu opakování.
  const needsSchedule = frekvence !== 'denne'
  const denValue = frekvence === 'den-v-tydnu' ? denVTydnu : denVMesici
  const errFrekvence = showErrors && !frekvence ? 'Vyberte frekvenci.' : undefined
  const errDen = showErrors && needsSchedule && !denValue ? 'Vyberte den.' : undefined
  const errOpakovani = showErrors && needsSchedule && !opakovani ? 'Vyberte interval.' : undefined
  const errPrijemci = showErrors && prijemci.length === 0 ? 'Zadejte alespoň jednoho příjemce.' : undefined

  // Uložení = zapnutí odesílání. Vyžaduje kompletní rozvrh a alespoň jednoho příjemce.
  function handleSave() {
    const scheduleOk = needsSchedule ? (!!denValue && !!opakovani) : true
    const valid = !!frekvence && scheduleOk && prijemci.length > 0
    if (!valid) { setShowErrors(true); return }
    onSave({ active: true, frekvence, denVTydnu, denVMesici, opakovani, prijemci, kopie, text })
    onClose()
  }

  // Vypnutí zachová nastavení, jen zastaví odesílání.
  function handleVypnout() {
    onSave({ active: false, frekvence, denVTydnu, denVMesici, opakovani, prijemci, kopie, text })
    onClose()
  }

  const footerActions = initial.active
    ? [
        { label: 'Vypnout', variant: 'secondary' as const, onClick: handleVypnout },
        { label: 'Uložit', variant: 'primary' as const, onClick: handleSave },
      ]
    : [
        { label: 'Zrušit', variant: 'secondary' as const, onClick: onClose },
        { label: 'Uložit', variant: 'primary' as const, onClick: handleSave },
      ]

  const maxH = Math.min(720, typeof window !== 'undefined' ? window.innerHeight - 32 : 720)

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,13,18,0.4)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', padding: 16,
      }}>
        <div style={{ pointerEvents: 'auto', maxWidth: '100%' }}>
          <Modal
            title="Automatické odesílání statistik klientovi"
            width={720}
            maxHeight={maxH}
            onClose={onClose}
            actions={footerActions}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <Alert
                variant="info"
                label="Nastavte, kdy a komu se má automaticky odesílat přehled návštěvnosti nemovitosti."
              />

            {/* Rozvrh odeslání */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                <Select
                  label="Frekvence odeslání"
                  options={FREKVENCE_OPTIONS}
                  value={frekvence}
                  onChange={v => setFrekvence(v as StatsFrekvence)}
                  placeholder="Vyberte frekvenci"
                  error={errFrekvence}
                  width="100%"
                />

                {frekvence === 'den-v-tydnu' && (
                  <Select
                    label="Den v týdnu"
                    options={DEN_V_TYDNU_OPTIONS}
                    value={denVTydnu}
                    onChange={setDenVTydnu}
                    placeholder="Vyberte den"
                    error={errDen}
                    width="100%"
                  />
                )}
                {frekvence === 'den-v-mesici' && (
                  <Select
                    label="Den v měsíci"
                    options={DEN_V_MESICI_OPTIONS}
                    value={denVMesici}
                    onChange={setDenVMesici}
                    placeholder="Vyberte den"
                    error={errDen}
                    width="100%"
                  />
                )}
              </div>

              {needsSchedule && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                <Select
                  label="Opakování"
                  options={OPAKOVANI_OPTIONS}
                  value={opakovani}
                  onChange={setOpakovani}
                  placeholder="Vyberte interval"
                  error={errOpakovani}
                  width="100%"
                />
              </div>
              )}
            </div>

            {/* Šablona e-mailu */}
            <Divider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, lineHeight: '22px', color: 'var(--t-textPrimary)' }}>
                Šablona e-mailu
              </span>

              <EmailChipInput
                label="Příjemci"
                helperText="Můžete zadat více e-mailů."
                emails={prijemci}
                onChange={setPrijemci}
                error={errPrijemci}
              />

              <EmailChipInput
                label="Kopie"
                helperText="Můžete zadat více e-mailů."
                emails={kopie}
                onChange={setKopie}
              />

              <TextArea
                label="Text e-mailu"
                value={text}
                onChange={setText}
                minHeight={200}
                width="100%"
              />
            </div>
            </div>
          </Modal>
        </div>
      </div>
    </>,
    document.body,
  )
}