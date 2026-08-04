import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import {
  IconButton, Button, Select, Input, Tooltip, FileUploadArea, FileUploadItem,
  type FileUploadStatus, type FileUploadItemProps,
} from '@matusgallo/mysabds'

const KATEGORIE_OPT = [
  { value: 'naberovy-list', label: 'Náběrový list' },
  { value: 'zprostredkovatelska', label: 'Zprostředkovatelská smlouva' },
  { value: 'dodatek-zprostredkovatelska', label: 'Dodatek ke zprostředkovatelské smlouvě' },
  { value: 'list-vlastnictvi', label: 'List vlastnictví' },
  { value: 'gdpr', label: 'GDPR' },
  { value: 'aml', label: 'AML' },
  { value: 'vypis-or', label: 'Výpis z OR' },
  { value: 'plna-moc', label: 'Plná moc' },
  { value: 'kopie-op', label: 'Kopie OP' },
  { value: 'dohoda-narovnani', label: 'Dohoda o narovnání' },
  { value: 'cenova-mapa', label: 'Cenová mapa' },
]

const FORMATY = '.png,.jpg,.jpeg,.pdf,.xlsx,.docx'
const LIMIT = 'PDF, JPG, PNG, DOCX nebo XLSX · nejvýš 20 MB na soubor'

/** Typ souboru pro ikonu ve `FileUploadItem` - DS ho jako typ nevyváží. */
type TypSouboru = NonNullable<FileUploadItemProps['fileType']>

interface Soubor {
  id: number
  nazev: string
  velikost: string
  typ: TypSouboru
  status: FileUploadStatus
  progress: number
}

function typZNazvu(nazev: string): TypSouboru {
  const ext = nazev.toLowerCase().split('.').pop() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (ext === 'doc' || ext === 'docx') return 'doc'
  if (ext === 'xls' || ext === 'xlsx') return 'xls'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'img'
  return 'generic'
}

/** Velikost s desetinnou čárkou a nezlomitelnou mezerou před jednotkou. */
function formatVelikost(bytes: number): string {
  const NBSP = '\u00A0'
  if (bytes < 1024) return `${bytes}${NBSP}B`
  const cislo = (n: number) => n.toFixed(1).replace('.', ',')
  if (bytes < 1024 * 1024) return `${cislo(bytes / 1024)}${NBSP}kB`
  return `${cislo(bytes / (1024 * 1024))}${NBSP}MB`
}

function pocetSouboru(n: number): string {
  if (n === 1) return '1 soubor'
  if (n < 5) return `${n} soubory`
  return `${n} souborů`
}

interface Props {
  onClose: () => void
  defaultKategorie?: string
}

export default function NahratDokumentyModal({ onClose, defaultKategorie }: Props) {
  const [kategorie, setKategorie] = useState(defaultKategorie ?? 'zprostredkovatelska')
  const [platnostOd, setPlatnostOd] = useState('')
  const [platnostDo, setPlatnostDo] = useState('')
  const [soubory, setSoubory] = useState<Soubor[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const idRef = useRef(0)

  const probiha = soubory.some(s => s.status === 'uploading')
  const nahrano = soubory.filter(s => s.status === 'uploaded').length

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  /* Prototyp nemá kam soubory poslat - průběh je odsimulovaný, aby byl
     vidět stav nahrávání i jeho dokončení. */
  useEffect(() => {
    if (!probiha) return
    const id = window.setInterval(() => {
      setSoubory(prev => prev.map(s => {
        if (s.status !== 'uploading') return s
        const dalsi = s.progress + 12
        return dalsi >= 100
          ? { ...s, progress: 100, status: 'uploaded' as FileUploadStatus }
          : { ...s, progress: dalsi }
      }))
    }, 140)
    return () => window.clearInterval(id)
  }, [probiha])

  const handleFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return
    const nove = Array.from(list).map<Soubor>(f => ({
      id: idRef.current++,
      nazev: f.name,
      velikost: formatVelikost(f.size),
      typ: typZNazvu(f.name),
      status: 'uploading',
      progress: 0,
    }))
    setSoubory(prev => [...prev, ...nove])
  }, [])

  const vybratSoubory = useCallback(() => inputRef.current?.click(), [])

  function odebrat(id: number) {
    setSoubory(prev => prev.filter(s => s.id !== id))
  }

  function zkusitZnovu(id: number) {
    setSoubory(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'uploading', progress: 0 } : s
    ))
  }

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
          width: 720, maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(10,13,18,0.2)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 600, lineHeight: '26px', color: 'var(--t-textPrimary)' }}>
              Nahrát dokumenty
            </span>
            <IconButton icon={X} variant="ghost" size="md" tooltip="Zavřít" onClick={onClose} />
          </div>

          {/* Body */}
          <div style={{ padding: '0 24px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Select
              label="Kategorie"
              options={KATEGORIE_OPT}
              value={kategorie}
              onChange={setKategorie}
              width="100%"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input
                label="Platnost od"
                value={platnostOd}
                onChange={setPlatnostOd}
                placeholder="DD.MM.RRRR"
                width="100%"
              />
              <Input
                label="Platnost do"
                value={platnostDo}
                onChange={setPlatnostDo}
                placeholder="DD.MM.RRRR"
                width="100%"
              />
            </div>

            {/* Plocha pro nahrání - přetažení drží rodič, tlačítka i vzhled DS */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false)
              }}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                handleFiles(e.dataTransfer.files)
              }}
            >
              <FileUploadArea
                variant="advanced"
                subtitle={LIMIT}
                isDragOver={dragOver}
                onSelect={vybratSoubory}
                onUpload={vybratSoubory}
              />
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={FORMATY}
                style={{ display: 'none' }}
                onChange={e => {
                  handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </div>

            {/* Seznam nahrávaných souborů */}
            {soubory.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {soubory.map(s => (
                  <FileUploadItem
                    key={s.id}
                    fileName={s.nazev}
                    fileSize={s.velikost}
                    fileType={s.typ}
                    status={s.status}
                    progress={s.progress}
                    onRemove={() => odebrat(s.id)}
                    onRetry={() => zkusitZnovu(s.id)}
                  />
                ))}
              </div>
            )}

            {/* Průběh nahrávání pro odečítač obrazovky */}
            <div role="status" aria-live="polite" className="sr-only">
              {soubory.length === 0
                ? ''
                : probiha
                  ? `Probíhá nahrávání. Hotovo ${nahrano} z ${soubory.length}.`
                  : `Nahrávání dokončeno - ${pocetSouboru(nahrano)}.`}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', gap: 8, flexShrink: 0,
            borderTop: '1px solid var(--t-borderPrimary)',
          }}>
            <Button label="Zrušit" variant="outlined" onClick={onClose} />
            {probiha ? (
              <Tooltip content="Vyčkejte na dokončení nahrávání." placement="top">
                <Button label="Uložit" variant="primary" disabled />
              </Tooltip>
            ) : (
              <Button label="Uložit" variant="primary" disabled={nahrano === 0} onClick={onClose} />
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
