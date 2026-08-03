import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, CloudUpload, FileText, Trash2 } from 'lucide-react'
import { IconButton, Button, Select, Input } from '@matusgallo/mysabds'

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

interface Props {
  onClose: () => void
  defaultKategorie?: string
}

export default function NahratDokumentyModal({ onClose, defaultKategorie }: Props) {
  const [kategorie, setKategorie] = useState(defaultKategorie ?? 'zprostredkovatelska')
  const [platnostOd, setPlatnostOd] = useState('')
  const [platnostDo, setPlatnostDo] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleFiles = useCallback((list: FileList | null) => {
    if (!list) return
    setFiles(prev => [...prev, ...Array.from(list)])
  }, [])

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
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

            {/* Drop zone */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                handleFiles(e.dataTransfer.files)
              }}
              style={{
                border: `2px dashed ${dragOver ? 'var(--t-borderMyDOCK)' : 'var(--t-borderPrimary)'}`,
                background: dragOver ? 'var(--t-bgMyDOCKTertiary)' : 'var(--t-bgSecondary)',
                borderRadius: 12, padding: '32px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer', transition: 'background 120ms, border-color 120ms',
                textAlign: 'center',
              }}
            >
              <CloudUpload size={36} style={{ color: 'var(--t-textSecondary)' }} />
              <span style={{ fontSize: 16, fontWeight: 600, lineHeight: '24px', color: 'var(--t-textPrimary)' }}>
                Přetažením nebo kliknutím nahrajete soubory.
              </span>
              <span style={{ fontSize: 13, color: 'var(--t-textSecondary)' }}>
                Podporované formáty <strong>png</strong>, <strong>jpg</strong>, <strong>pdf</strong>, <strong>xlsx</strong>, <strong>docx</strong>.
              </span>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.pdf,.xlsx,.docx"
                style={{ display: 'none' }}
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {files.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 12px',
                    background: 'var(--t-bgSecondary)', borderRadius: 8,
                  }}>
                    <FileText size={16} style={{ color: 'var(--t-textSecondary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>
                        {formatSize(f.size)}
                      </div>
                    </div>
                    <IconButton icon={Trash2} variant="ghost" size="sm" tooltip="Odstranit soubor" onClick={() => removeFile(i)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', gap: 8, flexShrink: 0,
            borderTop: '1px solid var(--t-borderPrimary)',
          }}>
            <Button label="Zrušit" variant="outlined" onClick={onClose} />
            <Button label="Nahrát" variant="primary" disabled={files.length === 0} onClick={onClose} />
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
