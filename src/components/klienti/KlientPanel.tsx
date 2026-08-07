import { useState, useEffect } from 'react'
import { Copy, ArrowUpRight, Pencil, X } from 'lucide-react'
import { Form, Input, IconButton, Tag } from '@matusgallo/mysabds'
import TelefonInput from '../shared/TelefonInput'
import { VYCHOZI_PREDVOLBA } from '../../data/telefonPredvolby'

export type KlientPanelMode = 'detail' | 'edit' | 'create'

export interface KlientData {
  id: number
  telefon: string
  email: string
  jmeno: string
  prijmeni: string
  titulPred: string
  titulZa: string
  nazevSpolecnosti: string
  icSpolecnosti: string
  poziceZastupujiciOsoby: string
  ulice: string
  cisloPopisne: string
  cisloOrientacni: string
  psc: string
  mesto: string
  naparovaneNabidky: { id: number; label: string }[]
}

interface KlientPanelProps {
  mode: KlientPanelMode
  klient?: KlientData
  onClose: () => void
  onEdit?: () => void
  onSave?: (data: Partial<KlientData>) => void
}

const EMPTY: Partial<KlientData> = {
  telefon: VYCHOZI_PREDVOLBA, email: '', jmeno: '', prijmeni: '',
  titulPred: '', titulZa: '', nazevSpolecnosti: '', icSpolecnosti: '',
  poziceZastupujiciOsoby: '', ulice: '', cisloPopisne: '',
  cisloOrientacni: '', psc: '', mesto: '',
}

function Row({ label, value, copy }: { label: string; value?: string; copy?: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: 24, gap: 12,
    }}>
      <span style={{ fontSize: 14, color: 'var(--t-textSecondary)', flexShrink: 0, width: 180 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 14, color: value ? 'var(--t-textPrimary)' : 'var(--t-textTertiary)' }}>
          {value || '–'}
        </span>
        {copy && value && (
          <IconButton icon={Copy} variant="ghost" size="sm" tooltip="Kopírovat" onClick={copy} />
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)', margin: '16px 0 4px' }}>
      {children}
    </p>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)',
      borderRadius: 12, padding: 16, marginBottom: 12,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {children}
    </div>
  )
}

function CardTitle({ title, badge, copy }: { title: string; badge?: number; copy?: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 32,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>{title}</span>
        {badge !== undefined && <Tag label={String(badge)} size="sm" />}
      </div>
      {copy && <IconButton icon={Copy} variant="ghost" size="md" tooltip="Kopírovat" onClick={copy} />}
    </div>
  )
}

export default function KlientPanel({ mode, klient, onClose, onEdit, onSave }: KlientPanelProps) {
  const [form, setForm] = useState<Partial<KlientData>>(klient ?? EMPTY)

  useEffect(() => {
    setForm(klient ?? EMPTY)
  }, [klient])

  function setField(field: keyof KlientData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const isDetail = mode === 'detail'
  const isEdit = mode === 'edit'
  const isCreate = mode === 'create'
  const fullName = [klient?.jmeno, klient?.prijmeni].filter(Boolean).join(' ') || '–'

  const detailBody = (
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
      <Card>
        <CardTitle title="Kontaktní osoba" />
        <Row
          label="Telefonní číslo"
          value={klient?.telefon}
          copy={() => navigator.clipboard.writeText(klient?.telefon ?? '')}
        />
      </Card>

      <Card>
        <CardTitle title={`Údaje vázané na uvedené tel. číslo ${klient?.telefon ?? ''}`} />
        <Row
          label="E-mail"
          value={klient?.email}
          copy={() => navigator.clipboard.writeText(klient?.email ?? '')}
        />
        <SectionLabel>Základní údaje</SectionLabel>
        <Row label="Jméno" value={klient?.jmeno} />
        <Row label="Příjmení" value={klient?.prijmeni} />
        <Row label="Titul před" value={klient?.titulPred} />
        <Row label="Titul za" value={klient?.titulZa} />
        <Row label="Název společnosti" value={klient?.nazevSpolecnosti} />
        <Row label="IČ společnosti" value={klient?.icSpolecnosti} />
        <Row label="Pozice zastupující osoby" value={klient?.poziceZastupujiciOsoby} />
      </Card>

      <Card>
        <CardTitle
          title="Kontaktní adresa"
          copy={() => {
            const addr = [klient?.ulice, klient?.cisloPopisne, klient?.psc, klient?.mesto]
              .filter(Boolean).join(', ')
            navigator.clipboard.writeText(addr)
          }}
        />
        <Row label="Ulice" value={klient?.ulice} />
        <Row label="Číslo popisné" value={klient?.cisloPopisne} />
        <Row label="Číslo orientační" value={klient?.cisloOrientacni} />
        <Row label="PSČ" value={klient?.psc} />
        <Row label="Město" value={klient?.mesto} />
      </Card>

      {klient && klient.naparovaneNabidky.length > 0 && (
        <Card>
          <CardTitle title="Napárované nabídky" badge={klient.naparovaneNabidky.length} />
          {klient.naparovaneNabidky.map(n => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', height: 24, gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--t-textSecondary)', flexShrink: 0, width: 180 }}>
                ID {n.id}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>{n.label}</span>
                <IconButton icon={ArrowUpRight} variant="ghost" size="sm" tooltip="Otevřít" />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )

  const formBody = (
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card>
        <CardTitle title="Kontaktní osoba" />
        <div style={{ padding: '12px 0' }}>
          <TelefonInput
            label="Telefonní číslo"
            required
            value={String(form.telefon ?? '')}
            onChange={v => setField('telefon', v)}
          />
        </div>
      </Card>

      <Card>
        <CardTitle title={`Údaje vázané na uvedené tel. číslo ${form.telefon ?? ''}`} />
        <div style={{ padding: '12px 0 4px' }}>
          <Input
            label="E-mail"
            required
            value={String(form.email ?? '')}
            onChange={v => setField('email', v)}
            width="100%"
          />
        </div>
        <SectionLabel>Základní údaje</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input label="Jméno" required value={String(form.jmeno ?? '')} onChange={v => setField('jmeno', v)} width="100%" />
            <Input label="Příjmení" required value={String(form.prijmeni ?? '')} onChange={v => setField('prijmeni', v)} width="100%" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input label="Titul před" value={String(form.titulPred ?? '')} onChange={v => setField('titulPred', v)} width="100%" />
            <Input label="Titul za" value={String(form.titulZa ?? '')} onChange={v => setField('titulZa', v)} width="100%" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input label="Název společnosti" value={String(form.nazevSpolecnosti ?? '')} onChange={v => setField('nazevSpolecnosti', v)} width="100%" />
            <Input label="IČ společnosti" value={String(form.icSpolecnosti ?? '')} onChange={v => setField('icSpolecnosti', v)} width="100%" />
          </div>
          <Input label="Pozice zastupující osoby" value={String(form.poziceZastupujiciOsoby ?? '')} onChange={v => setField('poziceZastupujiciOsoby', v)} width="100%" />
        </div>
      </Card>

      <Card>
        <CardTitle title="Kontaktní adresa" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input label="Ulice" value={String(form.ulice ?? '')} onChange={v => setField('ulice', v)} width="100%" />
            <Input label="Č. p." value={String(form.cisloPopisne ?? '')} onChange={v => setField('cisloPopisne', v)} width={96} />
            <Input label="Č. o." value={String(form.cisloOrientacni ?? '')} onChange={v => setField('cisloOrientacni', v)} width={80} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input label="PSČ" value={String(form.psc ?? '')} onChange={v => setField('psc', v)} width={120} />
            <Input label="Město" value={String(form.mesto ?? '')} onChange={v => setField('mesto', v)} width="100%" />
          </div>
        </div>
      </Card>
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 56,
        bottom: 0,
        width: 720,
        zIndex: 100,
        boxShadow: '-2px 0 4px -2px #0a0d120f, -4px 0 6px -1px #0a0d121a',
        clipPath: 'inset(0 0 0 -20px)',
      }}
    >
      <Form
        width={720}
        minHeight={0}
        footer={{
          actions: isDetail
            ? [
                { label: 'Zavřít', variant: 'outlined', onClick: onClose },
                { label: 'Upravit klienta', variant: 'outlined', leadIcon: Pencil, onClick: onEdit },
              ]
            : [
                { label: 'Zrušit', variant: 'outlined', onClick: onClose },
                {
                  label: isCreate ? 'Vytvořit klienta' : 'Uložit změny',
                  variant: 'primary',
                  onClick: () => { onSave?.(form); onClose() },
                },
              ],
        }}
      >
        <>
          <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: 24, background: 'var(--t-bgSecondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(!isCreate && klient) && <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textSecondary)', fontFamily: 'Inter' }}>ID {klient.id}</span>}
              <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)', fontFamily: 'Inter' }}>
                {isCreate ? 'Vytvořit klienta' : isEdit ? 'Upravit klienta' : fullName}
              </span>
            </div>
            <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
          </div>
          {isDetail ? detailBody : formBody}
        </>
      </Form>
    </div>
  )
}
