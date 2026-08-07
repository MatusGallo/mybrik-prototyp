// Telefonní předvolby evropských států pro pole telefonu (TelefonInput).
//
// Select doplněk u Inputu umí jen prosté řetězce, takže se v seznamu i v chipu
// vykresluje „vlajka + předvolba“ (POPISKY_PREDVOLEB). Do dat jde vždy samotná
// předvolba, vlajka je jen popisek. Název státu si vedeme kvůli hledání
// v datech a pro chvíli, kdy doplněk v design systému rozliší hodnotu a popisek.
// Řazeno vzestupně podle předvolby - vedle vlajky je v seznamu vidět jen číslo,
// takže jiné pořadí by v něm nešlo najít.

export interface Predvolba {
  kod: string
  zeme: string
  /** Vlajka státu jako emoji - nese ji popisek, ne uložená hodnota. */
  vlajka: string
}

export const PREDVOLBY: Predvolba[] = [
  { kod: '+7', zeme: 'Rusko', vlajka: '🇷🇺' },
  { kod: '+30', zeme: 'Řecko', vlajka: '🇬🇷' },
  { kod: '+31', zeme: 'Nizozemsko', vlajka: '🇳🇱' },
  { kod: '+32', zeme: 'Belgie', vlajka: '🇧🇪' },
  { kod: '+33', zeme: 'Francie', vlajka: '🇫🇷' },
  { kod: '+34', zeme: 'Španělsko', vlajka: '🇪🇸' },
  { kod: '+36', zeme: 'Maďarsko', vlajka: '🇭🇺' },
  { kod: '+39', zeme: 'Itálie', vlajka: '🇮🇹' },
  { kod: '+40', zeme: 'Rumunsko', vlajka: '🇷🇴' },
  { kod: '+41', zeme: 'Švýcarsko', vlajka: '🇨🇭' },
  { kod: '+43', zeme: 'Rakousko', vlajka: '🇦🇹' },
  { kod: '+44', zeme: 'Spojené království', vlajka: '🇬🇧' },
  { kod: '+45', zeme: 'Dánsko', vlajka: '🇩🇰' },
  { kod: '+46', zeme: 'Švédsko', vlajka: '🇸🇪' },
  { kod: '+47', zeme: 'Norsko', vlajka: '🇳🇴' },
  { kod: '+48', zeme: 'Polsko', vlajka: '🇵🇱' },
  { kod: '+49', zeme: 'Německo', vlajka: '🇩🇪' },
  { kod: '+90', zeme: 'Turecko', vlajka: '🇹🇷' },
  { kod: '+298', zeme: 'Faerské ostrovy', vlajka: '🇫🇴' },
  { kod: '+350', zeme: 'Gibraltar', vlajka: '🇬🇮' },
  { kod: '+351', zeme: 'Portugalsko', vlajka: '🇵🇹' },
  { kod: '+352', zeme: 'Lucembursko', vlajka: '🇱🇺' },
  { kod: '+353', zeme: 'Irsko', vlajka: '🇮🇪' },
  { kod: '+354', zeme: 'Island', vlajka: '🇮🇸' },
  { kod: '+355', zeme: 'Albánie', vlajka: '🇦🇱' },
  { kod: '+356', zeme: 'Malta', vlajka: '🇲🇹' },
  { kod: '+357', zeme: 'Kypr', vlajka: '🇨🇾' },
  { kod: '+358', zeme: 'Finsko', vlajka: '🇫🇮' },
  { kod: '+359', zeme: 'Bulharsko', vlajka: '🇧🇬' },
  { kod: '+370', zeme: 'Litva', vlajka: '🇱🇹' },
  { kod: '+371', zeme: 'Lotyšsko', vlajka: '🇱🇻' },
  { kod: '+372', zeme: 'Estonsko', vlajka: '🇪🇪' },
  { kod: '+373', zeme: 'Moldavsko', vlajka: '🇲🇩' },
  { kod: '+374', zeme: 'Arménie', vlajka: '🇦🇲' },
  { kod: '+375', zeme: 'Bělorusko', vlajka: '🇧🇾' },
  { kod: '+376', zeme: 'Andorra', vlajka: '🇦🇩' },
  { kod: '+377', zeme: 'Monako', vlajka: '🇲🇨' },
  { kod: '+378', zeme: 'San Marino', vlajka: '🇸🇲' },
  { kod: '+379', zeme: 'Vatikán', vlajka: '🇻🇦' },
  { kod: '+380', zeme: 'Ukrajina', vlajka: '🇺🇦' },
  { kod: '+381', zeme: 'Srbsko', vlajka: '🇷🇸' },
  { kod: '+382', zeme: 'Černá Hora', vlajka: '🇲🇪' },
  { kod: '+383', zeme: 'Kosovo', vlajka: '🇽🇰' },
  { kod: '+385', zeme: 'Chorvatsko', vlajka: '🇭🇷' },
  { kod: '+386', zeme: 'Slovinsko', vlajka: '🇸🇮' },
  { kod: '+387', zeme: 'Bosna a Hercegovina', vlajka: '🇧🇦' },
  { kod: '+389', zeme: 'Severní Makedonie', vlajka: '🇲🇰' },
  { kod: '+420', zeme: 'Česko', vlajka: '🇨🇿' },
  { kod: '+421', zeme: 'Slovensko', vlajka: '🇸🇰' },
  { kod: '+423', zeme: 'Lichtenštejnsko', vlajka: '🇱🇮' },
  { kod: '+994', zeme: 'Ázerbájdžán', vlajka: '🇦🇿' },
  { kod: '+995', zeme: 'Gruzie', vlajka: '🇬🇪' },
]

/** Výchozí předvolba v celé aplikaci. */
export const VYCHOZI_PREDVOLBA = '+420'

export const KODY_PREDVOLEB = PREDVOLBY.map(p => p.kod)

/** Popisek předvolby v poli i v seznamu - vlajka a číslo. */
export const popisPredvolby = (kod: string): string => {
  const predvolba = PREDVOLBY.find(p => p.kod === kod)
  return predvolba ? `${predvolba.vlajka} ${predvolba.kod}` : kod
}

export const POPISKY_PREDVOLEB = PREDVOLBY.map(p => popisPredvolby(p.kod))

/** Zpátky z popisku na předvolbu, kterou ukládáme. */
export const kodZPopisu = (popis: string): string =>
  PREDVOLBY.find(p => popisPredvolby(p.kod) === popis)?.kod ?? popis

// Delší předvolby napřed, aby „+420“ nesebralo „+42“ a podobně.
const KODY_DLE_DELKY = [...KODY_PREDVOLEB].sort((a, b) => b.length - a.length)

/** Rozdělí uložené číslo na předvolbu a zbytek. Bez známé předvolby vrací výchozí. */
export function rozdelTelefon(hodnota: string | null | undefined): { predvolba: string; cislo: string } {
  const text = String(hodnota ?? '').trim()
  const kod = KODY_DLE_DELKY.find(k => text.startsWith(k))
  if (!kod) return { predvolba: VYCHOZI_PREDVOLBA, cislo: text }
  return { predvolba: kod, cislo: text.slice(kod.length).trim() }
}

/** Složí předvolbu a číslo do jedné hodnoty. U prázdného čísla zůstane samotná předvolba. */
export function spojTelefon(predvolba: string, cislo: string): string {
  const zbytek = cislo.trim()
  return zbytek ? `${predvolba} ${zbytek}` : predvolba
}

/**
 * Chybová hláška k telefonnímu číslu, nebo `undefined`, když je v pořádku.
 * Česká a slovenská čísla mají devět číslic, u ostatních států se délka liší.
 */
export function chybaTelefonu(predvolba: string, cislo: string): string | undefined {
  if (!cislo.trim()) return 'Zadejte telefonní číslo.'
  const pocet = cislo.replace(/\D/g, '').length
  if (predvolba === '+420' || predvolba === '+421') {
    return pocet === 9 ? undefined : 'Telefonní číslo má 9 číslic.'
  }
  return pocet >= 6 && pocet <= 15 ? undefined : 'Telefonní číslo má 6 až 15 číslic.'
}

/** Je v hodnotě i číslo, nebo jen předvolba? */
export function maCisloTelefonu(hodnota: string | null | undefined): boolean {
  return rozdelTelefon(hodnota).cislo.length > 0
}
