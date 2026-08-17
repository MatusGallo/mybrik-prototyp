import { pobockyData } from './mockOstatni'
import { VYCHOZI_PREDVOLBA, rozdelTelefon } from './telefonPredvolby'

// ── Exportní můstky ───────────────────────────────────────────────────────────

export interface MustekPole {
  key: string
  label: string
  placeholder: string
  /** Údaj se v poli maskuje a odkrývá se tlačítkem */
  tajny?: boolean
}

export interface MustekDef {
  key: string
  nazev: string
  /** Logo portálu ze `public/portal-logos`; bez souboru se vykreslí iniciála */
  logo?: string
  pole: MustekPole[]
}

export const MUSTKY: MustekDef[] = [
  {
    key: 'sreality', nazev: 'Sreality.cz',
    logo: '/portal-logos/sreality.ico',
    pole: [
      { key: 'idPobocky', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'hash', label: 'Hash pro přihlášení', placeholder: 'Zadejte hash', tajny: true },
      { key: 'klic', label: 'Klíč pro přihlášení', placeholder: 'Zadejte klíč', tajny: true },
      { key: 'idMaklere', label: 'ID makléře pro callcentrum', placeholder: 'Např. 1042' },
    ],
  },
  {
    key: 'realitymix', nazev: 'Reality MIX',
    logo: '/portal-logos/realitymix.png',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'klic', label: 'Klíč', placeholder: 'Zadejte klíč', tajny: true },
    ],
  },
  {
    key: 'bazos', nazev: 'Bazoš.cz',
    logo: '/portal-logos/bazos.png',
    pole: [
      { key: 'jmeno', label: 'Přihlašovací jméno', placeholder: 'Zadejte jméno' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'realingo', nazev: 'Realingo',
    logo: '/portal-logos/realingo.ico',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'klic', label: 'Klíč', placeholder: 'Zadejte klíč', tajny: true },
    ],
  },
  {
    key: 'idnes', nazev: 'Reality iDNES.cz',
    logo: '/portal-logos/reality-idnes.ico',
    pole: [
      { key: 'jmenoApi', label: 'Přihlašovací jméno k API', placeholder: 'Zadejte jméno' },
      { key: 'hesloApi', label: 'Heslo k API', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'jmenoFtp', label: 'Přihlašovací jméno k FTP', placeholder: 'Zadejte jméno' },
      { key: 'hesloFtp', label: 'Heslo k FTP', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'ceskereality', nazev: 'České reality',
    logo: '/portal-logos/ceske-reality.ico',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'idFirmy', label: 'ID firmy', placeholder: 'Např. 3120' },
    ],
  },
  {
    key: 'ulovdomov', nazev: 'UlovDomov',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'eurobydleni', nazev: 'Eurobydlení',
    logo: '/portal-logos/eurobydleni.png',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
      { key: 'klic', label: 'Klíč', placeholder: 'Zadejte klíč', tajny: true },
    ],
  },
  {
    key: 'b3', nazev: 'B3 Technology',
    logo: '/portal-logos/b3-technology.png',
    pole: [
      { key: 'idPobocky', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'hash', label: 'Hash pro přihlášení', placeholder: 'Zadejte hash', tajny: true },
      { key: 'klic', label: 'Klíč pro přihlášení', placeholder: 'Zadejte klíč', tajny: true },
      { key: 'idMaklere', label: 'ID makléře pro callcentrum', placeholder: 'Např. 1042' },
    ],
  },
  {
    key: 'avizo', nazev: 'Avízo',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'realitycechy', nazev: 'Reality Čechy',
    pole: [
      { key: 'id', label: 'ID pobočky', placeholder: 'Např. 48210' },
      { key: 'heslo', label: 'Přihlašovací heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
  {
    key: 'osobniweb', nazev: 'Osobní web',
    pole: [
      { key: 'jmeno', label: 'Přihlašovací jméno', placeholder: 'Zadejte jméno' },
      { key: 'heslo', label: 'Heslo', placeholder: 'Zadejte heslo', tajny: true },
    ],
  },
]

// ── Model formuláře pobočky ───────────────────────────────────────────────────

/** Nahraný obrázek - logo nebo watermark. */
export interface Obrazek {
  nazev: string
  velikost: string
  url: string
  sirka: number
  vyska: number
}

/** Hodnoty všech zapnutých můstků: klíč portálu → pole → hodnota. */
export type MustkyStav = Record<string, Record<string, string>>

export interface PobockaForm {
  nazev: string
  /** Předvolba státu, číslo je v `telefon` bez ní. */
  predvolba: string
  telefon: string
  email: string
  hsp: string
  zobrazitNaWebu: boolean
  adresa: string
  logo: Obrazek | null
  hlavniBarva: string
  doplnkovaBarva: string
  watermark: boolean
  watermarkObrazek: Obrazek | null
  umisteni: string
  kryti: number
  mustky: MustkyStav
  knJmeno: string
  knHeslo: string
}

export const VYCHOZI_HLAVNI = '#E8542A'
export const VYCHOZI_DOPLNKOVA = '#1B1D21'
export const VYCHOZI_KRYTI = 75

export function emptyPobockaForm(): PobockaForm {
  return {
    nazev: '', predvolba: VYCHOZI_PREDVOLBA, telefon: '', email: '', hsp: '', zobrazitNaWebu: false,
    adresa: '',
    logo: null, hlavniBarva: VYCHOZI_HLAVNI, doplnkovaBarva: VYCHOZI_DOPLNKOVA,
    watermark: true, watermarkObrazek: null, umisteni: 'stred', kryti: VYCHOZI_KRYTI,
    mustky: {},
    knJmeno: '', knHeslo: '',
  }
}

export type PobockaRow = typeof pobockyData[number]

/**
 * Přístupové údaje mock poboček neobsahuje - pro editaci se dopočítají z ID,
 * aby obrazovka ukázala vyplněný stav a hodnoty držely mezi načteními.
 */
function mustkyZRow(id: number): MustkyStav {
  const stav: MustkyStav = {}
  MUSTKY.forEach((def, i) => {
    if ((id + i) % 3 !== 0) return
    stav[def.key] = Object.fromEntries(def.pole.map(pole => [
      pole.key,
      pole.tajny ? `${pole.key}-${(id * 7919).toString(36)}` : String(40000 + id * 13 + i),
    ]))
  })
  return stav
}

export function pobockaFormFromRow(row: PobockaRow): PobockaForm {
  return {
    ...emptyPobockaForm(),
    nazev: row.nazev,
    ...rozdelTelefonProFormular(row.telefon),
    email: row.email,
    hsp: row.hsp,
    zobrazitNaWebu: row.stav === 'Aktivní',
    adresa: row.adresa,
    mustky: mustkyZRow(row.id),
    knJmeno: `pobocka${row.id}@kn.cz`,
    knHeslo: `Kn-${row.id}-2026`,
  }
}

/** Rozdělí uložené číslo na pole formuláře. */
function rozdelTelefonProFormular(hodnota: string): { predvolba: string; telefon: string } {
  const { predvolba, cislo } = rozdelTelefon(hodnota)
  return { predvolba, telefon: cislo }
}
