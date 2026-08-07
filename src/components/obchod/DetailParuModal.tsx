import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowUpRight } from 'lucide-react'
import { IconButton, Button, TextButton, Tag, typography } from '@matusgallo/mysabds'

export interface ParRow {
  klient: string
  idNabidky: number
  nazev: string
  typ: string
  podtyp: string
  plocha: number
  cena: number
  vlastnik: { jmeno: string; firma: string }
  adresa: string
  tagy: string[]
  historie: { nemovitost: string; posledniAktivita: string; vytvoreno: string; vytvorilUzivatel: string; stav: string }[]
  klientInfo: { prirazenKPoptavce: string; posledniKomunikace: string }
}

interface Props {
  par: ParRow
  onClose: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...typography.body16Semibold, color: 'var(--t-textPrimary)', marginBottom: 12 }}>
      {children}
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 24 }}>
      <span style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)', width: 180, flexShrink: 0 }}>{label}</span>
      <span style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)', flex: 1 }}>{value || '—'}</span>
    </div>
  )
}

export default function DetailParuModal({ par, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
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
          width: 720,
          maxWidth: '96vw',
          maxHeight: 720,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)' }}>
              Detail páru
            </span>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>

          {/* Body */}
          <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

            {/* Informace o klientovi */}
            <div>
              <SectionLabel>Informace o klientovi</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <KV label="Jméno a příjmení" value={par.klient} />
                <KV label="Přiřazen k poptávce" value={par.klientInfo.prirazenKPoptavce} />
                <KV label="Poslední komunikace" value={par.klientInfo.posledniKomunikace || '—'} />
                <KV label="Vlastník" value={par.vlastnik.jmeno} />
              </div>
            </div>

            <div style={{ width: '100%', height: 1, background: 'var(--t-borderPrimary)', flexShrink: 0 }} />

            {/* Vlastník */}
            <div>
              <SectionLabel>Vlastník</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ ...typography.body14Medium, color: 'var(--t-textPrimary)' }}>{par.vlastnik.jmeno}</span>
                <span style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>{par.vlastnik.firma}</span>
                <div style={{ marginTop: 4 }}>
                  <TextButton label="Převzít" variant="brand" />
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: 1, background: 'var(--t-borderPrimary)', flexShrink: 0 }} />

            {/* Spárovaná nemovitost */}
            <div>
              <SectionLabel>Spárovaná nemovitost</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a style={{ ...typography.body14Medium, color: 'var(--t-textMyDOCKPrimary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {par.idNabidky} - {par.nazev}
                  <ArrowUpRight size={14} style={{ color: 'var(--t-textMyDOCKPrimary)', flexShrink: 0 }} />
                </a>
                <span style={{ ...typography.body14Regular, color: 'var(--t-textSecondary)' }}>{par.adresa}</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {par.tagy.map(t => <Tag key={t} label={t} variant="neutral" size="sm" />)}
                </div>
              </div>
            </div>

            {/* Historie klienta */}
            {par.historie.length > 0 && (
              <>
              <div style={{ width: '100%', height: 1, background: 'var(--t-borderPrimary)', flexShrink: 0 }} />
              <div>
                <SectionLabel>Historie klienta</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {par.historie.map((h, i) => (
                    <div key={i} style={{ background: 'var(--t-bgSecondary)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-textSecondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nemovitost</div>
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-textMyDOCKPrimary)' }}>{h.nemovitost}</span>
                          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: 'var(--t-textSecondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Poslední aktivita</div>
                          <span style={{ fontSize: 13, color: 'var(--t-textPrimary)' }}>{h.posledniAktivita}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                          <Tag label={h.stav} variant="info" size="sm" />
                          <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>
                            Vytvořeno uživatelem <strong style={{ color: 'var(--t-textPrimary)' }}>{h.vytvorilUzivatel}</strong> dne {h.vytvoreno}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}

          </div>

          {/* Footer */}
          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0, borderTop: '1px solid var(--t-borderPrimary)' }}>
            <Button label="Zavřít" variant="outlined" onClick={onClose} />
          </div>

        </div>
      </div>
    </>,
    document.body
  )
}
