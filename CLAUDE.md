# CLAUDE.md — myBRIK

> Tento soubor říká Claude Code jak pracovat v tomto projektu.

---

## O projektu

**myBRIK** je CRM platforma od SAB servis, která propojuje finanční a realitní byznys do jednoho prostředí.

### Cílová skupina
- Finanční poradci a vedoucí makléřských kanceláří
- Realitní makléři
- Asistenti pobočky
- Majitelé poboček a vedoucí týmů

### Účel
Umožňuje zpracovat celý životní cyklus obchodu — akvizici klienta, obsluhu i průběžný servis — v jedné aplikaci. Propojuje realitní a finanční agendu (hypotéky, pojištění, provize) s CRM funkcemi.

### Klíčové moduly
- **Nabídky** — tvorba a správa realitních nabídek, přiřazení více makléřů, sdílení provizí, publikace na realitní servery
- **Obchod** — leady, příležitosti, zájem o výkup, nabídka nemovitostí
- **Klienti** — evidence klientů, poptávky (obecné i specifické), automatické párování s nabídkami
- **Kalendář** — plánování schůzek a událostí (měsíc/týden/den)
- **Statistiky** — přehled rezervací, plateb a měsíčního výkonu
- **Vyúčtování** — náklady, storno, provize, výplaty, faktury
- **Lidé** — správa uživatelů, pobočky, HSP, role a práva
- **Dokumenty** — firemní dokumenty

### Technologie
- Vite + React 18 + TypeScript
- Tailwind CSS
- Design system: `@matusgallo/mysabds`
- React Router v6
- Recharts (grafy)

---

## Design System

Tento projekt používá sdílený design system `@matusgallo/mysabds`.

### POVINNÉ PRAVIDLO

Před jakoukoli prací na UI komponentách nebo obrazovkách:

1. Načti `node_modules/@matusgallo/mysabds/docs/design-system.md`
2. Importuj komponenty výhradně z `@matusgallo/mysabds`
3. Na začátku entry pointu importuj tokeny **i styly** (od 1.4.0 jsou komponenty
   na CSS Modules, bez `styles.css` ztratí vzhled):
   ```ts
   import '@matusgallo/mysabds/tokens.css'
   import '@matusgallo/mysabds/styles.css'
   ```
4. Než sáhneš po konkrétní komponentě, načti její stránku
   `node_modules/@matusgallo/mysabds/docs-app/content/components/<nazev>.mdx`.
   Sekce **„Kdy použít"** a **„Kdy nepoužít"** jsou závazná pravidla, ne popis pro
   čtenáře - „Kdy nepoužít" vždy říká, co použít místo toho. Když ti pravidlo pro
   daný případ nesedí, řekni to a navrhni úpravu stránky v design systému;
   neobcházej ho tichem.

### Dostupné komponenty

```tsx
import {
  Button, IconButton, TextButton,
  Input, TextArea, Select, DatePicker, Checkbox, Radio, Switch, Toggle,
  Avatar, Tag, Chip, ChipGroup, NotificationBadge, Alert, Tooltip,
  Dialog, Menu, Filter,
  LineTab, PillTab,
  Form, FormHeader, FormBody, FormFooter, FormTitleHeader,
  NavItem, NavAppItem, NavGroupHeadline, NavDivider, FloatingNav,
  TableCell, TableHeaderCell,
  Divider, Breadcrumbs, Pagination,
  CheckboxItem, CheckboxGroupItem,
} from '@matusgallo/mysabds'
```

### Pozor na názvy štítků

Od verze 1.5.0 znamená `Tag` něco jiného než dřív. Nesahej po něm z paměti:

| Co potřebuješ | Komponenta | Dřívější název |
| --- | --- | --- |
| Statický štítek stavu, bez křížku | `Tag` | `Badge` |
| Odstranitelný štítek s křížkem | `Chip` | `Tag` |
| Počitadlo nových událostí | `NotificationBadge` | - |

`Badge`, `TextField` a `DropdownItem` jsou `@deprecated` aliasy a v příští major
verzi zmizí - v myBRIKu už se nepoužívají, nezaváděj je zpátky. Alias `Tag` → `Chip`
schválně neexistuje, takže `<Tag label="…" />` se zkompiluje a jen vykreslí něco
jiného, než čekáš.

### UX Writing guidelines

Před psaním textů v UI načti všechny soubory ze složky `node_modules/@matusgallo/mysabds/IN/`:
- `IN/INFO_UXWRITTING.md` — obecná UX writing pravidla
- `IN/INFO_CTA.md` — pravidla pro výzvy k akci
- `IN/INFO_FORMATOVANI.md` — formátování textů
- `IN/INFO_Gramaticka-forma.md` — gramatická forma
- `IN/INFO_Popisky-zastupne-texty.md` — popisky a zástupné texty
- `IN/INFO_Typograficke-pravidla.md` — typografická pravidla
- `IN/INFO-Prazdne-stavy.md` — prázdné stavy
- `IN/Typography.md` — typografie

---

## Instalace závislostí

Projekt vyžaduje `.npmrc` s GitHub token pro stažení `@matusgallo/mysabds`.
Viz `.npmrc.example` pro formát.

```
@matusgallo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<GITHUB_PAT_read_packages>
```
