import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton, Button, TextArea, Select, isFloatingPanelOpen,
} from '@matusgallo/mysabds'

const ZPUSOB_OPT = [
  { value: 'Úspěšně uzavřeno', label: 'Úspěšně uzavřeno' },
  { value: 'Neúspěšně uzavřeno', label: 'Neúspěšně uzavřeno' },
]

const VYSLEDEK_OPT = [
  { value: 'Klient má zájem o jinou nabídku SAB servis s.r.o.', label: 'Klient má zájem o jinou nabídku SAB servis s.r.o.' },
  { value: 'Nabídka je finančně nad limit', label: 'Nabídka je finančně nad limit' },
  { value: 'Duplicitní záznam', label: 'Duplicitní záznam' },
  { value: 'Nabídka není aktuální', label: 'Nabídka není aktuální' },
  { value: 'Klient nekomunikuje', label: 'Klient nekomunikuje' },
  { value: 'Klient se nedostavil k rezervaci', label: 'Klient se nedostavil k rezervaci' },
  { value: 'Klient ukončil hledání', label: 'Klient ukončil hledání' },
  { value: 'Ostatní', label: 'Ostatní' },
]

interface Props {
  onClose: () => void
}

export default function ZrusitZaznamModal({ onClose }: Props) {
  const [zpusob, setZpusob] = useState('Neúspěšně uzavřeno')
  const [vysledek, setVysledek] = useState(VYSLEDEK_OPT[0].value)
  const [poznamka, setPoznamka] = useState('')

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

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,13,18,0.4)' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'var(--t-bgPrimary)',
          borderRadius: 16,
          width: 640,
          maxWidth: '96vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>

          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>Zavřít záznam</span>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>

          <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Select label="Způsob uzavření" options={ZPUSOB_OPT} value={zpusob} onChange={setZpusob} width="100%" />
            <Select label="Výsledek záznamu" options={VYSLEDEK_OPT} value={vysledek} onChange={setVysledek} width="100%" />
            <TextArea label="Poznámka" value={poznamka} onChange={setPoznamka} width="100%" minHeight={120} />
          </div>

          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0, borderTop: '1px solid var(--t-borderPrimary)' }}>
            <Button label="Zrušit" variant="outlined" onClick={onClose} />
            <Button label="Uložit" variant="primary" onClick={onClose} />
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
