import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Modal, Input, TextArea } from '@matusgallo/mysabds'
import useEscapeClose from '../shared/useEscapeClose'

/* ──────────────────────────────────────────────────────────────────────────────
   Odeslat SMS — samostatný formulář, ne varianta zápisu komunikace. Odchozí
   zpráva potřebuje jen telefon a text; datum, způsob komunikace ani navazující
   úkol do ní nepatří - zápis do historie si aplikace udělá sama z odeslání.
────────────────────────────────────────────────────────────────────────────── */

// Diakritika posílá SMS do UCS-2, kde se do jedné zprávy vejde 70 znaků místo
// 160. Delší text se dělí na navazující zprávy (67, resp. 153 znaků na díl).
const GSM_ZNAKY = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/

function smsDelka(text: string) {
  const jednoduche = GSM_ZNAKY.test(text)
  const limit = jednoduche ? 160 : 70
  const dil = jednoduche ? 153 : 67
  const pocet = text.length <= limit ? 1 : Math.ceil(text.length / dil)
  return { znaky: text.length, limit, pocet }
}

interface Props {
  /** Telefon klienta - předvyplní se, uživatel ho může přepsat. */
  telefon: string
  klient: string
  onClose: () => void
  onSend?: (telefon: string, text: string) => void
}

export default function OdeslatSmsModal({ telefon, klient, onClose, onSend }: Props) {
  const [prijemce, setPrijemce] = useState(telefon)
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<{ prijemce?: string; text?: string }>({})

  useEscapeClose(onClose)

  const { znaky, limit, pocet } = smsDelka(text)

  function handleSend() {
    const next: typeof errors = {}
    if (!prijemce.trim()) next.prijemce = 'Zadejte telefonní číslo příjemce.'
    if (!text.trim()) next.text = 'Zadejte text zprávy.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSend?.(prijemce, text)
    onClose()
  }

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,13,18,0.4)' }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 201, padding: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Modal
            title="Odeslat SMS"
            onClose={onClose}
            width={560}
            actions={[
              { label: 'Zrušit', variant: 'secondary', onClick: onClose },
              { label: 'Odeslat SMS', variant: 'primary', onClick: handleSend },
            ]}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Telefon příjemce"
                required
                type="tel"
                value={prijemce}
                onChange={v => { setPrijemce(v); setErrors(e => ({ ...e, prijemce: undefined })) }}
                placeholder="Např. +420 776 312 845"
                helperText={`Zpráva odejde klientovi ${klient}.`}
                error={errors.prijemce}
                width="100%"
              />
              <TextArea
                label="Text zprávy"
                required
                value={text}
                onChange={v => { setText(v); setErrors(e => ({ ...e, text: undefined })) }}
                placeholder="Zadejte text zprávy"
                helperText={`${znaky} z ${limit} znaků · ${pocet === 1 ? '1 SMS' : `${pocet} SMS`}`}
                error={errors.text}
                width="100%"
                minHeight={140}
              />
            </div>
          </Modal>
        </div>
      </div>
    </>,
    document.body,
  )
}
