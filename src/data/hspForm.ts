import { hspData, uzivateleData } from './mockOstatni'
import { VYCHOZI_PREDVOLBA, rozdelTelefon } from './telefonPredvolby'

// ── Model formuláře HSP ───────────────────────────────────────────────────────

export type Stav = 'aktivni' | 'neaktivni'
export type TypOsoby = 'po' | 'fo'
export type SubjektKey = 'platce' | 'neplatce'

export interface Subjekt {
  zapnuto: boolean
  typOsoby: TypOsoby
  obchodniNazev: string
  /** FO: titul před jménem */
  titul: string
  jmeno: string
  prijmeni: string
  /** FO: odlišující dodatek, pod kterým podniká (nepovinný) */
  dodatek: string
  ic: string
  dic: string
  ulice: string
  cisloPopisne: string
  cisloOrientacni: string
  mesto: string
  psc: string
  predcisli: string
  cisloUctu: string
  kodBanky: string
}

export interface OsobaOption {
  value: string
  label: string
  sub?: string
  email: string
  predvolba: string
  telefon: string
}

export interface HspForm {
  nazev: string
  stav: Stav
  osoba: OsobaOption | null
  email: string
  /** Předvolba státu, číslo je v `telefon` bez ní. */
  predvolba: string
  telefon: string
  subjekty: Record<SubjektKey, Subjekt>
  provize: string
  mydockId: string
  /** Ověřené ID v Mydocku — u uloženého HSP je párování hotové. */
  mydockOvereno: string
}

export const EMPTY_SUBJEKT: Subjekt = {
  zapnuto: false, typOsoby: 'po',
  obchodniNazev: '', titul: '', jmeno: '', prijmeni: '', dodatek: '', ic: '', dic: '',
  ulice: '', cisloPopisne: '', cisloOrientacni: '', mesto: '', psc: '',
  predcisli: '', cisloUctu: '', kodBanky: '',
}

export const SUBJEKT_DEFS: {
  key: SubjektKey; nazev: string; popis: string; jePlatce: boolean
}[] = [
  { key: 'platce', nazev: 'Plátcovský subjekt', popis: 'Fakturace včetně DPH', jePlatce: true },
  { key: 'neplatce', nazev: 'Neplátcovský subjekt', popis: 'Fakturace bez DPH', jePlatce: false },
]

export const SUBJEKT_KEYS = SUBJEKT_DEFS.map(d => d.key)

export const BANKY = [
  { value: '0100', label: '0100 - Komerční banka' },
  { value: '0300', label: '0300 - ČSOB' },
  { value: '0600', label: '0600 - MONETA Money Bank' },
  { value: '0710', label: '0710 - Česká národní banka' },
  { value: '0800', label: '0800 - Česká spořitelna' },
  { value: '2010', label: '2010 - Fio banka' },
  { value: '2250', label: '2250 - Banka CREDITAS' },
  { value: '2700', label: '2700 - UniCredit Bank' },
  { value: '3030', label: '3030 - Air Bank' },
  { value: '5500', label: '5500 - Raiffeisenbank' },
  { value: '6210', label: '6210 - mBank' },
  { value: '6800', label: '6800 - Max banka' },
]

// ── Odpovědné osoby ───────────────────────────────────────────────────────────

const bezDiakritiky = (v: string) =>
  v.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Odřízne titul před jménem, ať se dá jméno porovnat se seznamem uživatelů. */
const bezTitulu = (v: string) =>
  v.replace(/\b(Ing|Mgr|Bc|MUDr|JUDr|Ph\.?D|MBA|DiS)\.?/g, '').replace(/\s+/g, ' ').trim()

export const OSOBY: OsobaOption[] = [...uzivateleData]
  .sort((a, b) => `${a.prijmeni} ${a.jmeno}`.localeCompare(`${b.prijmeni} ${b.jmeno}`, 'cs'))
  .map(u => {
    const { predvolba, cislo } = rozdelTelefon(u.telefon)
    return {
      value: String(u.id),
      label: `${u.titulPred ? `${u.titulPred} ` : ''}${u.jmeno} ${u.prijmeni}`,
      sub: u.role,
      email: u.firemnEmail,
      predvolba,
      telefon: cislo,
    }
  })

/**
 * Osoba ze seznamu HSP. Starší záznamy odkazují na lidi, které mock uživatelů
 * nemá — pro ty se vyrobí volba navíc, aby formulář ukázal skutečnou hodnotu
 * záznamu a ne prázdný select.
 */
function osobaPodleJmena(jmeno: string, id: number): OsobaOption {
  const hledane = bezDiakritiky(bezTitulu(jmeno)).toLowerCase()
  const nalezena = OSOBY.find(o => bezDiakritiky(bezTitulu(o.label)).toLowerCase() === hledane)
  if (nalezena) return nalezena

  const casti = bezTitulu(jmeno).split(' ')
  const slug = bezDiakritiky(casti.join('.')).toLowerCase().replace(/[^a-z.]/g, '')
  return {
    value: `externi-${id}`,
    label: jmeno,
    email: `${slug || 'kontakt'}@sabservis.cz`,
    predvolba: VYCHOZI_PREDVOLBA,
    telefon: telefonZId(id),
  }
}

// ── Dopočítaná mock data detailu ──────────────────────────────────────────────
// Seznam HSP nese jen základní údaje. Detail (fakturační subjekty, adresa,
// účet, Mydock) mock nemá, tak se dopočítá z ID — deterministicky, aby byl
// stejný záznam po každém otevření stejný.

const ADRESY = [
  { ulice: 'Vinohradská', cisloPopisne: '1511', cisloOrientacni: '20', mesto: 'Praha 2', psc: '120 00' },
  { ulice: 'Veveří', cisloPopisne: '456', cisloOrientacni: '9', mesto: 'Brno', psc: '602 00' },
  { ulice: 'Masarykova', cisloPopisne: '318', cisloOrientacni: '12a', mesto: 'Ostrava', psc: '702 00' },
  { ulice: 'Sokolovská', cisloPopisne: '694', cisloOrientacni: '102', mesto: 'Praha 9', psc: '190 00' },
  { ulice: 'Havlíčkova', cisloPopisne: '87', cisloOrientacni: '', mesto: 'Plzeň', psc: '301 00' },
]

const telefonZId = (id: number) => {
  const cislo = String(700000000 + (id * 1234567) % 99999999).slice(0, 9)
  return `${cislo.slice(0, 3)} ${cislo.slice(3, 6)} ${cislo.slice(6)}`
}

const icZId = (id: number) => String(10000000 + (id * 8765431) % 89999999)

const uctoZId = (id: number) => String(1000000000 + (id * 76543219) % 8999999999).slice(0, 10)

/** Doplní právní formu, když ji název HSP nemá. */
function obchodniNazev(nazev: string) {
  return /s\.r\.o\.|a\.s\.|spol\.|group|s\. r\. o\./i.test(nazev) ? nazev : `${nazev} s.r.o.`
}

export function emptyHspForm(): HspForm {
  return {
    nazev: '',
    stav: 'neaktivni',
    osoba: null,
    email: '',
    predvolba: VYCHOZI_PREDVOLBA,
    telefon: '',
    subjekty: { platce: { ...EMPTY_SUBJEKT }, neplatce: { ...EMPTY_SUBJEKT } },
    provize: '100',
    mydockId: '',
    mydockOvereno: '',
  }
}

export type HspRow = typeof hspData[number]

export function hspFormFromRow(row: HspRow): HspForm {
  const osoba = osobaPodleJmena(row.odpovednáOsoba, row.id)
  const adresa = ADRESY[row.id % ADRESY.length]
  const ic = icZId(row.id)

  const platce: Subjekt = {
    ...EMPTY_SUBJEKT,
    zapnuto: true,
    typOsoby: 'po',
    obchodniNazev: obchodniNazev(row.nazev),
    ic,
    dic: ic,
    ...adresa,
    cisloUctu: uctoZId(row.id),
    kodBanky: BANKY[row.id % BANKY.length].value,
  }

  // Druhý subjekt má jen část HSP — jinak by editace vypadala, že ho má každé.
  const maNeplatce = row.id % 3 === 0
  const titul = osoba.label.match(/^(Ing\.|Mgr\.|Bc\.|MUDr\.|JUDr\.)/)?.[0] ?? ''
  const [jmeno = '', prijmeni = ''] = bezTitulu(osoba.label).split(' ')
  const neplatce: Subjekt = maNeplatce
    ? {
        ...EMPTY_SUBJEKT,
        zapnuto: true,
        typOsoby: 'fo',
        titul,
        jmeno,
        prijmeni,
        ic: icZId(row.id + 7),
        ...ADRESY[(row.id + 2) % ADRESY.length],
        cisloUctu: uctoZId(row.id + 7),
        kodBanky: BANKY[(row.id + 3) % BANKY.length].value,
      }
    : { ...EMPTY_SUBJEKT }

  return {
    nazev: row.nazev,
    stav: row.stav === 'Aktivní' ? 'aktivni' : 'neaktivni',
    osoba,
    email: osoba.email,
    predvolba: osoba.predvolba,
    telefon: osoba.telefon,
    subjekty: { platce, neplatce },
    provize: '100',
    mydockId: String(30000 + row.id),
    mydockOvereno: String(30000 + row.id),
  }
}
