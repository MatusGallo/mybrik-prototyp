# Návrh změny mysabds: select doplněk u `Input`u

**Stav:** návrh k projednání
**Cílová verze:** mysabds 1.7.0 (rozšíření API, zpětně kompatibilní)
**Vychází z:** myBRIK, pole telefonu (`TelefonInput`) - výběr předvolby státu
**Testováno proti:** mysabds 1.6.36

> **Vlajky už řešit nemusí.** Původně tenhle návrh vznikl proto, že emoji vlajky
> u předvoleb nefungují na Windows. To je vyřešené v myBRIKu bez zásahu do DS -
> viz [Jak jsou vlajky vyřešené](#jak-jsou-vlajky-vyřešené) na konci. Zbývají dvě
> věci, které se v produktu obejít nedají.

---

## 1. Seznam se nedá prohledávat

`InputSelectAddon` nemá `searchable`. Pole telefonu v myBRIKu nabízí **51
evropských předvoleb** a v řádku je vidět jen číslo, takže seznam musí být řazený
podle předvolby - podle názvu státu se v něm hledat nedá ani očima. Uživatel, který
chce Rakousko, musí vědět, že je to `+43`, a najít ho mezi `+41` a `+44`.

`Select` `searchable` má a chová se přesně, jak je potřeba („Hledá se v popisku
i doplňujícím textu, bez ohledu na diakritiku a velikost písmen"). Doplněk
u `Input`u by měl mít totéž.

```ts
export interface InputSelectAddon {
  // ...stávající pole...
  /** Nad seznam přidá pole pro hledání. Hledá v popisku i doplňujícím textu,
   *  bez ohledu na diakritiku a velikost písmen - jako `Select`. */
  searchable?: boolean
  searchPlaceholder?: string
}
```

## 2. `onChange` vrací popisek, ne hodnotu

`options` je `string[]`, takže hodnota a popisek jsou tentýž řetězec a `onChange`
vrací to, co je vidět v seznamu. Jakmile popisek nese cokoli navíc, musí produkt
mapovat zpátky - v myBRIKu na to existuje
[`kodZPopisu()`](../src/data/telefonPredvolby.ts), funkce, která by neměla muset
existovat:

```ts
export const kodZPopisu = (popis: string): string =>
  PREDVOLBY.find(p => popisPredvolby(p.kod) === popis)?.kod ?? popis
```

Navrhuju přijímat i strukturované položky:

```ts
export interface InputSelectOption {
  /** Hodnota, která jde do `onChange`. */
  value: string
  /** Popisek v řádku i v chipu po výběru. */
  label: string
  /** Doplňující text - u předvoleb název státu. Řádek naroste na 44 px. */
  sub?: string
  disabled?: boolean
}

options?: Array<string | InputSelectOption>
```

**Zpětná kompatibilita.** `string[]` zůstává a chová se přesně jako dnes, včetně
`onChange` s vybraným řetězcem. U strukturovaných položek vrací `onChange` `value`.
Do chipu jde `label`, `sub` je jen v seznamu - název státu se do pole nevejde.

## 3. Volitelně: `lead` slot u položky

Tohle je nice-to-have, ne blocker - vlajky se dají udělat fontem (viz níže).
Stojí za zmínku, protože v DS je slot rozdělaný.

Řádek seznamu 16px slot **má** a je veřejný na `SelectItem` (`leadIcon`), přesně
jak popisuje `select.mdx` („Na začátku řádku může být ikona (16px slot), nebo
avatar (24 px)"). Ale nikam se nepropisuje:

| Úroveň | 16px slot u položky |
| --- | --- |
| `SelectItem` (řádek) | ano, `leadIcon` |
| `SelectOption` (`Select`) | **ne** |
| `InputSelectAddon` (`Input`) | **ne** |

Kdo si seznam skládá z `SelectItem`ů ručně, doplněk má. Kdo použije `Select` nebo
`Input`, tedy prakticky každý, nemá. Kdyby se slot propsal, hodil by se `lead?:
ReactNode` místo `LucideIcon` - do jednobarevné stroke ikony se vícebarevný obrázek
(vlajka, logo banky) nevejde jinak než přetypováním.

---

## Jak jsou vlajky vyřešené

Bez zásahu do DS, v myBRIKu:

- Emoji vlajka zůstává v popisku, jak byla. DS nic neví.
- [`main.tsx`](../src/main.tsx) volá `polyfillCountryFlagEmojis()`
  z `country-flag-emoji-polyfill` - doplní `@font-face` s Twemoji subsetem, který
  glyfy vlajek má. Font je **self-hostovaný** (76 kB woff2, Vite ho zabundluje),
  ne z CDN.
- `unicode-range` toho fontu je omezený na kódy vlajek, takže na ostatní text nemá
  vliv a rodina může stát první v `--fontFamilyBase`.
- Polyfill si sám ověří, že emoji fungují a vlajky ne. Na macOS a Androidu se
  neaktivuje a nic se nestahuje - nativní vlajky zůstanou.

**Pravidlo, které z toho plyne a mělo by být v docs** (`input.mdx`, `select.mdx`):

> Vlajku nikdy nedávejte jako emoji bez fontu, který ji umí. Windows pro vlajky
> nemá glyfy a vykreslí místo nich kapitálky kódu státu, takže výsledek se liší
> podle operačního systému.
>
> Vlajka nikdy nestojí sama za popiskem. Vlajka není jazyk ani měna a u řady území
> je sporná; význam vždy nese text, vlajka ho jen doplňuje. Do přístupného názvu
> položky se nepočítá - je dekorativní.

Sadu vlajek by DS shipovat neměl - je to 250 souborů, které se mění s politikou.
Font subset v produktu je na to lepší místo.
