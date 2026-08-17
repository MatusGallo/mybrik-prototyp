// ── Mock registru adres (RÚIAN) ───────────────────────────────────────────────
//
// Prototyp bez API - našeptávač adres hledá v tomhle seznamu adresních míst.
// Skladba je jako v registru: ulice patří k obci a části obce a nese vlastní
// čísla popisná, takže stejná ulice existuje ve víc městech (Nádražní v Brně
// i v Ostravě) a uživatel musí vybrat konkrétní místo.

/** Jedno adresní místo - to, co se po vybrání rozpadne do polí formuláře. */
export interface AdresniMisto {
  ulice: string
  cisloPopisne: string
  cisloOrientacni: string
  psc: string
  mesto: string
  /** Část obce - v nabídce upřesňuje město, do formuláře se nepřenáší. */
  cast?: string
}

interface UliceRegistru {
  ulice: string
  psc: string
  mesto: string
  cast?: string
  /** Čísla popisná; za lomítkem číslo orientační, když ho adresa má. */
  cisla: string[]
}

const ULICE: UliceRegistru[] = [
  // Praha
  { ulice: 'Vinohradská', psc: '130 00', mesto: 'Praha 3', cast: 'Vinohrady', cisla: ['1511/230', '1420/174', '1200/48', '2165/22'] },
  { ulice: 'Korunní', psc: '120 00', mesto: 'Praha 2', cast: 'Vinohrady', cisla: ['812/14', '984/64', '2569/108', '1740/126'] },
  { ulice: 'Mánesova', psc: '120 00', mesto: 'Praha 2', cast: 'Vinohrady', cisla: ['882/17', '1645/49', '2620/78'] },
  { ulice: 'Havlíčkova', psc: '110 00', mesto: 'Praha 1', cast: 'Nové Město', cisla: ['1682/15', '1030/1', '1043/11'] },
  { ulice: 'Na Poříčí', psc: '110 00', mesto: 'Praha 1', cast: 'Nové Město', cisla: ['1041/25', '1067/12', '1933/36'] },
  { ulice: 'Sokolovská', psc: '186 00', mesto: 'Praha 8', cast: 'Karlín', cisla: ['394/88', '651/136', '1802/24'] },
  { ulice: 'Opatovská', psc: '149 00', mesto: 'Praha 4', cast: 'Chodov', cisla: ['1754/16', '1763/22', '874/6'] },
  { ulice: 'Vyšehradská', psc: '128 00', mesto: 'Praha 2', cast: 'Nové Město', cisla: ['1349/2', '423/27', '320/49'] },

  // Brno
  { ulice: 'Nádražní', psc: '602 00', mesto: 'Brno', cast: 'Brno-střed', cisla: ['418/12', '1201/6', '654/2'] },
  { ulice: 'Masarykova', psc: '602 00', mesto: 'Brno', cast: 'Brno-střed', cisla: ['427/31', '118/8', '625/19'] },
  { ulice: 'Údolní', psc: '602 00', mesto: 'Brno', cast: 'Brno-střed', cisla: ['244/33', '567/53', '390/17'] },
  { ulice: 'Purkyňova', psc: '612 00', mesto: 'Brno', cast: 'Medlánky', cisla: ['2842/4', '1904/99', '3050/125'] },
  { ulice: 'Moravská', psc: '602 00', mesto: 'Brno', cast: 'Brno-střed', cisla: ['945/45', '380/7', '1207/60'] },

  // Ostrava
  { ulice: 'Nádražní', psc: '702 00', mesto: 'Ostrava', cast: 'Moravská Ostrava', cisla: ['118/16', '923/47', '2967/166'] },
  { ulice: 'Sokolská třída', psc: '702 00', mesto: 'Ostrava', cast: 'Moravská Ostrava', cisla: ['1263/24', '2801/98', '966/45'] },

  // Plzeň
  { ulice: 'Masarykova', psc: '312 00', mesto: 'Plzeň', cast: 'Lobzy', cisla: ['214/48', '1091/23', '760/12'] },
  { ulice: 'Klatovská třída', psc: '301 00', mesto: 'Plzeň', cast: 'Jižní Předměstí', cisla: ['1234/78', '2891/200', '446/19'] },

  // Ostatní krajská a okresní města
  { ulice: 'Horní náměstí', psc: '779 00', mesto: 'Olomouc', cisla: ['583/5', '367/18', '410/31'] },
  { ulice: 'Žižkova', psc: '500 02', mesto: 'Hradec Králové', cisla: ['1023/6', '478/22', '1266/40'] },
  { ulice: 'Školní', psc: '500 02', mesto: 'Hradec Králové', cisla: ['622/22', '1058/9', '304/3'] },
  { ulice: 'Lipová', psc: '460 01', mesto: 'Liberec', cast: 'Liberec I-Staré Město', cisla: ['533/33', '218/11', '941/62'] },
  { ulice: 'Kostelní', psc: '460 01', mesto: 'Liberec', cast: 'Liberec I-Staré Město', cisla: ['620/62', '145/7', '288/15'] },
  { ulice: 'Smetanova', psc: '370 01', mesto: 'České Budějovice', cisla: ['288/8', '1284/19', '603/32'] },
  { ulice: 'Lidická', psc: '370 01', mesto: 'České Budějovice', cisla: ['1109/40', '780/12', '2036/74'] },
  { ulice: 'Palackého', psc: '760 01', mesto: 'Zlín', cisla: ['1141/2', '3048/141', '873/26'] },
  { ulice: 'Zahradní', psc: '741 01', mesto: 'Nový Jičín', cisla: ['205/5', '1146/23', '640/14'] },
  { ulice: 'Univerzitní', psc: '532 10', mesto: 'Pardubice', cisla: ['2820/20', '1668/8', '3179/32'] },
  { ulice: 'Wilsonova', psc: '750 02', mesto: 'Přerov', cisla: ['1120/12', '2461/28', '806/4'] },
  { ulice: 'Karlovarská', psc: '360 06', mesto: 'Karlovy Vary', cisla: ['1187/56', '442/18', '2103/90'] },
]

/** Adresní místa v pořadí, v jakém je vrací registr. */
export const adresniMista: AdresniMisto[] = ULICE.flatMap(u =>
  u.cisla.map(cislo => {
    const [cisloPopisne, cisloOrientacni = ''] = cislo.split('/')
    return { ulice: u.ulice, cisloPopisne, cisloOrientacni, psc: u.psc, mesto: u.mesto, cast: u.cast }
  }),
)

/** „Vinohradská 1511/230" - popisek nabídky. */
export function popisAdresy(a: AdresniMisto): string {
  const cislo = a.cisloOrientacni ? `${a.cisloPopisne}/${a.cisloOrientacni}` : a.cisloPopisne
  return `${a.ulice} ${cislo}`
}

/** „130 00 Praha 3 - Vinohrady" - doplňující text nabídky. */
export function popisObce(a: AdresniMisto): string {
  // PSČ nesmí zůstat zalomené mezi pěticí číslic - drží ho nezlomitelná mezera.
  const psc = a.psc.replace(' ', '\u00A0')
  return [`${psc} ${a.mesto}`, a.cast].filter(Boolean).join(' - ')
}

/**
 * „Korunní 812/14, 120 00 Praha 2" - pro formuláře, které adresu drží v jednom
 * poli, ne v rozpadu.
 */
export function celaAdresa(a: AdresniMisto): string {
  return `${popisAdresy(a)}, ${a.psc.replace(' ', '\u00A0')} ${a.mesto}`
}

const bezDiakritiky = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Odpovídá slovo dotazu tomuhle adresnímu místu? */
function sedi(a: AdresniMisto, slovo: string) {
  if (bezDiakritiky(a.ulice).includes(slovo)) return true
  if (bezDiakritiky(a.mesto).includes(slovo)) return true
  if (a.cast && bezDiakritiky(a.cast).includes(slovo)) return true
  // Číslice hledá zvlášť v čísle domu a v PSČ - „Korunní 14" i „120 00".
  if (/^\d/.test(slovo)) {
    if (a.cisloPopisne.startsWith(slovo)) return true
    if (a.cisloOrientacni.startsWith(slovo)) return true
    if (a.psc.replace(/\s/g, '').startsWith(slovo)) return true
  }
  return false
}

/**
 * Adresy odpovídající dotazu. Slova se hledají nezávisle na diakritice, velikosti
 * písmen a pořadí, ale platit musí všechna - „vinohradska praha 230" najde jedno
 * místo, „nadrazni" celou ulici ve dvou městech.
 */
export function najdiAdresy(dotaz: string, limit = 8): AdresniMisto[] {
  // PSČ se píše s mezerou uprostřed, ale je to jedna hodnota - „130 00" nesmí
  // spadnout na dvě slova, z nichž druhé nesedí nikam.
  const normalizovany = bezDiakritiky(dotaz).replace(/(\d{3})\s+(\d{2})(?!\d)/g, '$1$2')
  const slova = normalizovany.split(/[\s,./]+/).filter(Boolean)
  if (slova.length === 0) return []

  const nalezene = adresniMista.filter(a => slova.every(slovo => sedi(a, slovo)))
  const prvni = slova[0]

  return nalezene
    .sort((a, b) => {
      // Ulice, která dotazem začíná, je blíž tomu, co uživatel psal, než ta,
      // která ho má někde uprostřed.
      const zacatek = (m: AdresniMisto) => (bezDiakritiky(m.ulice).startsWith(prvni) ? 0 : 1)
      return zacatek(a) - zacatek(b)
        || a.ulice.localeCompare(b.ulice, 'cs')
        || a.mesto.localeCompare(b.mesto, 'cs')
        || Number(a.cisloPopisne) - Number(b.cisloPopisne)
    })
    .slice(0, limit)
}
