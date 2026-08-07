import { uzivateleData } from './mockOstatni'
import { VYCHOZI_PREDVOLBA, rozdelTelefon } from './telefonPredvolby'

// ── Model formuláře uživatele ─────────────────────────────────────────────────

export type Stav = 'aktivni' | 'neaktivni'
export type TypOsoby = 'po' | 'fo'
export type SubjektKey = 'platce' | 'neplatce'
/** Buď je makléř zaměstnanec, nebo kanceláři fakturuje - obojí současně ne. */
export type Zpusob = 'hpp' | 'fakturace'
export type NotifikaceKlic = 'sreality' | 'idnes' | 'web'

export interface Ucet {
  predcisli: string
  cisloUctu: string
  kodBanky: string
}

export const EMPTY_UCET: Ucet = { predcisli: '', cisloUctu: '', kodBanky: '' }

export interface Adresa {
  ulice: string
  cisloPopisne: string
  cisloOrientacni: string
  psc: string
  mesto: string
}

export const EMPTY_ADRESA: Adresa = { ulice: '', cisloPopisne: '', cisloOrientacni: '', psc: '', mesto: '' }

/** Fakturační subjekt - plátce i neplátce DPH mají stejnou sadu polí. */
export interface Subjekt extends Adresa, Ucet {
  zapnuto: boolean
  typOsoby: TypOsoby
  obchodniNazev: string
  jmeno: string
  prijmeni: string
  ic: string
  dic: string
}

export const EMPTY_SUBJEKT: Subjekt = {
  zapnuto: false, typOsoby: 'po',
  obchodniNazev: '', jmeno: '', prijmeni: '', ic: '', dic: '',
  ...EMPTY_ADRESA, ...EMPTY_UCET,
}

/** Nahraná profilová fotografie. */
export interface Foto {
  nazev: string
  velikost: string
  url: string
  sirka: number
  vyska: number
}

/** Nahraný dokument uživatele. */
export interface Dokument {
  id: number
  nazev: string
  velikost: string
  pripona: string
  typ: string
  pridano: string
}

export type Notifikace = Record<NotifikaceKlic, { email: boolean; sms: boolean }>

export interface UzivatelForm {
  stav: Stav
  titulPred: string
  jmeno: string
  prijmeni: string
  titulZa: string
  osobniEmail: string
  predvolba: string
  telefon: string
  datumNarozeni: Date | null
  rodneCislo: string
  cisloOp: string
  bydliste: Adresa
  foto: Foto | null
  firemniEmail: string
  zpusob: Zpusob | null
  hppUcet: Ucet
  subjekty: Record<SubjektKey, Subjekt>
  nadrizeny: string
  provize: string
  pobocka: string
  pozice: string
  role: string
  vlastniProfil: boolean
  exportovatJako: string
  pocetTopovani: string
  medailonek: string
  notifikace: Notifikace
  zkouska: boolean
  datumZkousky: Date | null
  pojisteni: boolean
  vyrociPojisteni: Date | null
  upozornitMaklere: boolean
  dokumenty: Dokument[]
}

export const VYCHOZI_PROVIZE = '50'

export function emptyUzivatelForm(): UzivatelForm {
  return {
    stav: 'aktivni',
    titulPred: '', jmeno: '', prijmeni: '', titulZa: '',
    osobniEmail: '', predvolba: VYCHOZI_PREDVOLBA, telefon: '',
    datumNarozeni: null, rodneCislo: '', cisloOp: '',
    bydliste: { ...EMPTY_ADRESA },
    foto: null,
    firemniEmail: '',
    zpusob: null,
    hppUcet: { ...EMPTY_UCET },
    subjekty: { platce: { ...EMPTY_SUBJEKT }, neplatce: { ...EMPTY_SUBJEKT } },
    nadrizeny: '', provize: VYCHOZI_PROVIZE, pobocka: '', pozice: '', role: '',
    vlastniProfil: true, exportovatJako: '', pocetTopovani: '', medailonek: '',
    notifikace: {
      sreality: { email: false, sms: false },
      idnes: { email: false, sms: false },
      web: { email: false, sms: false },
    },
    zkouska: false, datumZkousky: null,
    pojisteni: false, vyrociPojisteni: null, upozornitMaklere: false,
    dokumenty: [],
  }
}

export type UzivatelRow = typeof uzivateleData[number]

/** Datum ve mocku je „13.11.2025 10:31" - bere se jen datová část. */
function datumZTextu(text: string): Date | null {
  const [den, mesic, rok] = (text.split(' ')[0] ?? '').split('.').map(Number)
  if (!den || !mesic || !rok) return null
  return new Date(rok, mesic - 1, den)
}

/**
 * Mock uživatelů nezná fakturaci, bydliště ani provizi - pro editaci se části
 * dopočítají z ID, aby obrazovka ukázala vyplněný stav a držela mezi načteními.
 */
export function uzivatelFormFromRow(row: UzivatelRow): UzivatelForm {
  const zaklad = emptyUzivatelForm()
  const jeMakler = row.role === 'Makléř'

  return {
    ...zaklad,
    stav: row.stav === 'Aktivní' ? 'aktivni' : 'neaktivni',
    titulPred: row.titulPred,
    jmeno: row.jmeno,
    prijmeni: row.prijmeni,
    osobniEmail: row.osobniEmail,
    predvolba: rozdelTelefon(row.telefon).predvolba,
    telefon: rozdelTelefon(row.telefon).cislo,
    firemniEmail: row.firemnEmail,
    pobocka: row.pobocka,
    pozice: jeMakler ? 'Realitní makléř' : row.role,
    role: row.role,
    // Zaměstnance dělá z každého třetího ID, ostatní kanceláři fakturují.
    zpusob: row.id % 3 === 0 ? 'hpp' : 'fakturace',
    hppUcet: row.id % 3 === 0
      ? { predcisli: '', cisloUctu: String(1000000000 + row.id * 371), kodBanky: '0800' }
      : { ...EMPTY_UCET },
    subjekty: row.id % 3 === 0
      ? zaklad.subjekty
      : {
        platce: {
          ...EMPTY_SUBJEKT,
          zapnuto: true, typOsoby: 'fo',
          jmeno: row.jmeno, prijmeni: row.prijmeni,
          ic: String(10000000 + row.id * 913).slice(0, 8),
          dic: String(10000000 + row.id * 913).slice(0, 8),
          ulice: 'Korunní', cisloPopisne: String(100 + (row.id % 80)), cisloOrientacni: '',
          psc: '120 00', mesto: 'Praha',
          predcisli: '', cisloUctu: String(2000000000 + row.id * 517), kodBanky: '2010',
        },
        neplatce: { ...EMPTY_SUBJEKT },
      },
    provize: jeMakler ? '50' : '70',
    vlastniProfil: jeMakler,
    exportovatJako: '',
    pocetTopovani: jeMakler ? String(row.id % 5) : '',
    zkouska: row.zkouskaRZ === 'Ano',
    datumZkousky: datumZTextu(row.datumSplneniZkousky),
    pojisteni: row.pojisteni === 'Ano',
    vyrociPojisteni: datumZTextu(row.pojisteniExpirace),
  }
}
