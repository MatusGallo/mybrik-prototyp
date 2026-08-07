import { Input } from '@matusgallo/mysabds'
import {
  POPISKY_PREDVOLEB,
  VYCHOZI_PREDVOLBA,
  kodZPopisu,
  popisPredvolby,
  rozdelTelefon,
  spojTelefon,
} from '../../data/telefonPredvolby'

interface TelefonInputProps {
  label?: string
  required?: boolean
  placeholder?: string
  helperText?: string
  error?: string
  disabled?: boolean
  width?: number | string
  /**
   * Číslo i s předvolbou („+420 777 123 456“). Když si předvolbu drží obrazovka
   * sama (prop `predvolba`), je tady jen číslo bez ní.
   */
  value: string
  onChange: (value: string) => void
  /** Předvolba držená mimo komponentu - použijte spolu s `onPredvolbaChange`. */
  predvolba?: string
  onPredvolbaChange?: (predvolba: string) => void
}

/**
 * Pole pro telefonní číslo s výběrem předvolby uvnitř pole. Nabízí předvolby
 * evropských států, výchozí je česká.
 */
export default function TelefonInput({
  label = 'Telefon',
  required,
  placeholder = '777 123 456',
  helperText,
  error,
  disabled,
  width = '100%',
  value,
  onChange,
  predvolba,
  onPredvolbaChange,
}: TelefonInputProps) {
  const rizenaPredvolba = predvolba !== undefined && onPredvolbaChange !== undefined
  const aktualni = rizenaPredvolba
    ? { predvolba: predvolba || VYCHOZI_PREDVOLBA, cislo: value }
    : rozdelTelefon(value)

  function zmenitPredvolbu(kod: string) {
    if (rizenaPredvolba) onPredvolbaChange!(kod)
    else onChange(spojTelefon(kod, aktualni.cislo))
  }

  function zmenitCislo(cislo: string) {
    onChange(rizenaPredvolba ? cislo : spojTelefon(aktualni.predvolba, cislo))
  }

  return (
    <Input
      label={label}
      required={required}
      type="tel"
      placeholder={placeholder}
      helperText={helperText}
      error={error}
      disabled={disabled}
      width={width}
      value={aktualni.cislo}
      onChange={zmenitCislo}
      leadSelect={{
        // Vlajka je jen v popisku - ven jde a ukládá se samotná předvolba.
        value: popisPredvolby(aktualni.predvolba),
        options: POPISKY_PREDVOLEB,
        onChange: popis => zmenitPredvolbu(kodZPopisu(popis)),
        ariaLabel: 'Předvolba státu',
      }}
    />
  )
}
