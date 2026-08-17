import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Modal, Input, TextArea } from '@matusgallo/mysabds'
import useEscapeClose from '../shared/useEscapeClose'

/* ──────────────────────────────────────────────────────────────────────────────
   Odeslat e-mail — samostatný formulář, ne varianta zápisu komunikace. Odchozí
   e-mail potřebuje adresu, předmět a zprávu; navazující úkol ani prohlídka do
   něj nepatří, ty se plánují z pravého panelu detailu.

   Stejné okno obsluhuje i odpověď na zprávu klienta - přijde s předvyplněným
   předmětem („Re: …"), takže se odpověď neposílá jiným formulářem než e-mail.
────────────────────────────────────────────────────────────────────────────── */

interface Props {
  /** E-mail klienta - předvyplní se, uživatel ho může přepsat. */
  email: string
  klient: string
  /** Předvyplněný předmět, typicky „Re: …" u odpovědi na zprávu klienta. */
  defaultPredmet?: string
  /** Titulek okna - odpověď na zprávu se pojmenuje jinak než nový e-mail. */
  title?: string
  onClose: () => void
  onSend?: (email: string, predmet: string, zprava: string) => void
}

export default function OdeslatEmailModal({
  email, klient, defaultPredmet = '', title = 'Odeslat e-mail', onClose, onSend,
}: Props) {
  const [prijemce, setPrijemce] = useState(email)
  const [predmet, setPredmet] = useState(defaultPredmet)
  const [zprava, setZprava] = useState('')
  const [errors, setErrors] = useState<{ prijemce?: string; predmet?: string; zprava?: string }>({})

  useEscapeClose(onClose)

  function handleSend() {
    const next: typeof errors = {}
    if (!prijemce.trim()) next.prijemce = 'Zadejte e-mailovou adresu příjemce.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(prijemce.trim())) {
      next.prijemce = 'Zadejte platnou e-mailovou adresu (např. jmeno@domena.cz).'
    }
    if (!predmet.trim()) next.predmet = 'Zadejte předmět e-mailu.'
    if (!zprava.trim()) next.zprava = 'Zadejte text zprávy.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSend?.(prijemce, predmet, zprava)
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
            title={title}
            onClose={onClose}
            width={640}
            maxHeight={720}
            actions={[
              { label: 'Zrušit', variant: 'secondary', onClick: onClose },
              { label: 'Odeslat e-mail', variant: 'primary', onClick: handleSend },
            ]}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="E-mail příjemce"
                required
                type="email"
                value={prijemce}
                onChange={v => { setPrijemce(v); setErrors(e => ({ ...e, prijemce: undefined })) }}
                placeholder="Zadejte e-mailovou adresu"
                helperText={`Zpráva odejde klientovi ${klient}.`}
                error={errors.prijemce}
                width="100%"
              />
              <Input
                label="Předmět"
                required
                value={predmet}
                onChange={v => { setPredmet(v); setErrors(e => ({ ...e, predmet: undefined })) }}
                placeholder="Zadejte předmět e-mailu"
                error={errors.predmet}
                width="100%"
              />
              <TextArea
                label="Zpráva"
                required
                value={zprava}
                onChange={v => { setZprava(v); setErrors(e => ({ ...e, zprava: undefined })) }}
                placeholder="Zadejte text zprávy"
                error={errors.zprava}
                width="100%"
                minHeight={200}
              />
            </div>
          </Modal>
        </div>
      </div>
    </>,
    document.body,
  )
}
