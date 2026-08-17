import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Building2, UserRound } from 'lucide-react'
import { Modal, Input, TextArea, RadioGroupItem } from '@matusgallo/mysabds'
import SelectSearch from '../shared/SelectSearch'
import useEscapeClose from '../shared/useEscapeClose'
import { uzivateleData } from '../../data/mockOstatni'

/* ──────────────────────────────────────────────────────────────────────────────
   Odeslat lead na hypotéku — okno mezi otázkou „má klient zájem o hypotéku?"
   a odesláním leadu. Makléř v něm doplní, s jakou částkou poradce počítá, a komu
   lead patří. Bez tohoto kroku by poradce dostal jen jméno klienta.

   Výše úvěru se nezadává, dopočítává se jako rozdíl kupní ceny a vlastních
   zdrojů - dvě ručně psaná čísla by se rozešla.
────────────────────────────────────────────────────────────────────────────── */

export type PrirazeniLeadu = 'hsp' | 'poradce'

export interface LeadHypoData {
  kupniCena: number
  vlastniZdroje: number
  vyseUveru: number
  poznamka: string
  prirazeni: PrirazeniLeadu
  /** Jméno poradce z HSP, nebo číslo poradce zadané ručně. */
  prijemce: string
}

const cislo = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 })

/** Číselný Input drží hodnotu jako text s oddělovači tisíců. */
function parseCastka(hodnota: string) {
  const cistá = hodnota.replace(/[^\d]/g, '')
  return cistá ? Number(cistá) : 0
}

function poradciNaHsp(hsp: string) {
  const poradci = uzivateleData.filter(u => u.role === 'Hypoteční poradce')
  // Poradci vlastního HSP jsou první volba. Když na HSP žádný není, nabídneme
  // všechny - jinak by seznam zůstal prázdný a lead by neměl kam jít.
  const vlastni = poradci.filter(u => u.hsp === hsp)
  return (vlastni.length > 0 ? vlastni : poradci)
    .map(u => {
      const titul = u.titulPred ? `${u.titulPred} ` : ''
      return {
        value: `${titul}${u.jmeno} ${u.prijmeni}`,
        label: `${titul}${u.jmeno} ${u.prijmeni} · č. ${u.id} · ${u.pobocka}`,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'cs'))
}

interface Props {
  /** Cena nemovitosti z nabídky - předvyplní kupní cenu u nového leadu. */
  cenaNemovitosti: number
  /** HSP záznamu - určuje, ze kterých poradců se vybírá. */
  hsp: string
  klient: string
  /** Už odeslaný lead - okno se otevře s jeho hodnotami jako úprava. */
  initial?: LeadHypoData
  onClose: () => void
  onSend: (lead: LeadHypoData) => void
}

export default function OdeslatLeadHypoModal({
  cenaNemovitosti, hsp, klient, initial, onClose, onSend,
}: Props) {
  const uprava = !!initial
  const [kupniCena, setKupniCena] = useState(String(initial?.kupniCena ?? cenaNemovitosti))
  const [vlastniZdroje, setVlastniZdroje] = useState(
    initial?.vlastniZdroje ? String(initial.vlastniZdroje) : ''
  )
  const [poznamka, setPoznamka] = useState(initial?.poznamka ?? '')
  const [prirazeni, setPrirazeni] = useState<PrirazeniLeadu>(initial?.prirazeni ?? 'hsp')
  const [poradce, setPoradce] = useState(initial?.prirazeni === 'hsp' ? initial.prijemce : '')
  const [cisloPoradce, setCisloPoradce] = useState(
    initial?.prirazeni === 'poradce' ? initial.prijemce.replace(/\D/g, '') : ''
  )
  const [errors, setErrors] = useState<{
    kupniCena?: string; vlastniZdroje?: string; poradce?: string; cisloPoradce?: string
  }>({})

  useEscapeClose(onClose)

  const PORADCI_OPT = poradciNaHsp(hsp)

  const cena = parseCastka(kupniCena)
  const zdroje = parseCastka(vlastniZdroje)
  const uver = Math.max(cena - zdroje, 0)
  // Podíl úvěru na kupní ceně (LTV) rozhoduje o tom, jestli je žádost vůbec
  // průchodná, takže ho poradce potřebuje vidět dřív než po odeslání.
  const ltv = cena > 0 ? Math.round((uver / cena) * 100) : 0

  function handleSend() {
    const next: typeof errors = {}
    if (cena <= 0) next.kupniCena = 'Zadejte kupní cenu nemovitosti.'
    else if (zdroje > cena) next.vlastniZdroje = 'Vlastní zdroje nesmí být vyšší než kupní cena.'
    if (prirazeni === 'hsp' && !poradce) next.poradce = 'Vyberte poradce, kterému lead patří.'
    if (prirazeni === 'poradce' && !cisloPoradce.trim()) next.cisloPoradce = 'Zadejte číslo poradce.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSend({
      kupniCena: cena,
      vlastniZdroje: zdroje,
      vyseUveru: uver,
      poznamka,
      prirazeni,
      prijemce: prirazeni === 'hsp' ? poradce : `Poradce č. ${cisloPoradce.trim()}`,
    })
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
            title={uprava ? 'Upravit lead na hypotéku' : 'Odeslat lead na hypotéku'}
            onClose={onClose}
            width={640}
            maxHeight={760}
            actions={[
              { label: 'Zrušit', variant: 'secondary', onClick: onClose },
              { label: uprava ? 'Uložit lead' : 'Odeslat lead', variant: 'primary', onClick: handleSend },
            ]}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--t-textSecondary)' }}>
                Lead na hypotéku pro klienta{' '}
                <span style={{ fontWeight: 600, color: 'var(--t-textPrimary)' }}>{klient}</span>.
                Poradce dostane rovnou částky, se kterými má počítat.
              </span>

              {/* Financování — kupní cena a vlastní zdroje, úvěr se dopočítá */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>
                  Financování
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input
                    label="Kupní cena"
                    required
                    value={kupniCena}
                    onChange={v => { setKupniCena(v); setErrors(e => ({ ...e, kupniCena: undefined })) }}
                    placeholder="0"
                    helperText={uprava ? 'Cena, se kterou poradce počítá' : 'Načteno z ceny nabídky'}
                    error={errors.kupniCena}
                    suffix="Kč"
                    numeric
                    textAlign="right"
                    width="100%"
                  />
                  <Input
                    label="Vlastní zdroje"
                    value={vlastniZdroje}
                    onChange={v => { setVlastniZdroje(v); setErrors(e => ({ ...e, vlastniZdroje: undefined })) }}
                    placeholder="0"
                    helperText="Kolik klient zaplatí ze svého"
                    error={errors.vlastniZdroje}
                    suffix="Kč"
                    numeric
                    textAlign="right"
                    width="100%"
                  />
                </div>

                {/* Dopočítaná výše úvěru — hodnota, ne pole k vyplnění */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  padding: '12px 16px', background: 'var(--t-bgSecondary)',
                  border: '1px solid var(--t-borderPrimary)', borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
                      Výše úvěru
                    </span>
                    <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--t-textSecondary)' }}>
                      Rozdíl kupní ceny a vlastních zdrojů{cena > 0 ? ` · LTV ${ltv} %` : ''}
                    </span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-textPrimary)', whiteSpace: 'nowrap' }}>
                    {cislo.format(uver)} Kč
                  </span>
                </div>
              </div>

              <TextArea
                label="Poznámka pro poradce"
                value={poznamka}
                onChange={setPoznamka}
                placeholder="Například kdy klientovi volat nebo v jaké fázi financování je"
                width="100%"
                minHeight={100}
              />

              {/* Přiřazení leadu — z vlastního HSP, nebo konkrétnímu poradci */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>
                  Komu lead patří
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <RadioGroupItem
                    label="Poradce z HSP"
                    description="Vyberte ze seznamu poradců"
                    leadIcon={Building2}
                    checked={prirazeni === 'hsp'}
                    onChange={() => { setPrirazeni('hsp'); setErrors(e => ({ ...e, cisloPoradce: undefined })) }}
                    width="100%"
                  />
                  <RadioGroupItem
                    label="Konkrétní poradce"
                    description="Zadejte číslo poradce"
                    leadIcon={UserRound}
                    checked={prirazeni === 'poradce'}
                    onChange={() => { setPrirazeni('poradce'); setErrors(e => ({ ...e, poradce: undefined })) }}
                    width="100%"
                  />
                </div>

                {prirazeni === 'hsp' ? (
                  <>
                    <SelectSearch
                      label="Finanční poradce"
                      required
                      options={PORADCI_OPT}
                      value={poradce}
                      onChange={v => { setPoradce(v); setErrors(e => ({ ...e, poradce: undefined })) }}
                      placeholder="Vyberte poradce"
                      width="100%"
                    />
                    {errors.poradce && (
                      <span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--t-textDangerPrimary)' }}>
                        {errors.poradce}
                      </span>
                    )}
                  </>
                ) : (
                  <Input
                    label="Číslo poradce"
                    required
                    value={cisloPoradce}
                    onChange={v => { setCisloPoradce(v); setErrors(e => ({ ...e, cisloPoradce: undefined })) }}
                    placeholder="Např. 4192"
                    helperText="Pro poradce mimo vaše HSP"
                    error={errors.cisloPoradce}
                    width="100%"
                  />
                )}
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </>,
    document.body,
  )
}
