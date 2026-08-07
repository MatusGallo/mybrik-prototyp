import React, { useState, useEffect } from 'react'
import { Form, LineTabGroup, Input, Divider, CheckboxItem, Tag } from '@matusgallo/mysabds'
import { TableHeaderCell, TableCell, IconButton } from '@matusgallo/mysabds'
import { Pencil, UserCog, X } from 'lucide-react'
import { uzivateleData } from '../../data/mockOstatni'
import UzivatelPanel from '../uzivatele/UzivatelPanel'
import type { UzivatelData } from '../uzivatele/UzivatelPanel'
import UzivatelPravaPanel from '../uzivatele/UzivatelPravaPanel'

export type RolePanelMode = 'detail' | 'edit'

export interface RoleData {
  id: number
  nazev: string
  pocetUzivatelu: number
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type Perms = Record<string, boolean>
interface PermItem { key: string; label: string }
interface PermGroup { title?: string; description?: string; items: PermItem[] }
interface PermModule { id: string; title: string; groups: PermGroup[] }

// ── Permission modules ────────────────────────────────────────────────────────

const SD = 'Uživateli nejdříve musíte vybrat v Zobrazení podle struktury nějaký specifický typ (např. "Struktura pobočky"), který je provázán s možnostmi v podsekci "Ostatní", které uživatel může poté provádět (např. "Editace" umožňuje editace všech nabídek na dané pobočce).'
const RD = 'Pokud má uživatel nastaveno "Celá struktura", tak ve formuláři, kde se přiřazuje makléř se uživateli zobrazí celá struktura, "Moje struktura", tak uživatel uvidí všechny jeho přímé podřízené napříč strukturou, "Struktura pobočky" uživatel uvidí všechny na dané pobočce. "Vlastní", tak uvidí jen sám sebe a nemůže vybrat nikoho jiného.'

function si(p: string): PermItem[] {
  return [
    { key: `${p}_cela`, label: 'Celá struktura' },
    { key: `${p}_moje`, label: 'Moje struktura' },
    { key: `${p}_fr`, label: 'Struktura franchízy' },
    { key: `${p}_pob`, label: 'Struktura pobočky' },
    { key: `${p}_vl`, label: 'Vlastní' },
  ]
}

export const PERM_MODULES: PermModule[] = [
  {
    id: 'nabidky', title: 'Nabídky',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('nb_z') },
      {
        title: 'Ostatní',
        items: [
          { key: 'nb_ost_vyt', label: 'Vytvořit' }, { key: 'nb_ost_edi', label: 'Editovat' },
          { key: 'nb_ost_dup', label: 'Duplikace' }, { key: 'nb_ost_sma', label: 'Smazat' },
          { key: 'nb_ost_exp', label: 'Exportovat' }, { key: 'nb_ost_his', label: 'Historie' },
          { key: 'nb_ost_fil', label: 'Filtrování' }, { key: 'nb_ost_lea', label: 'Poptávky' },
          { key: 'nb_ost_cem', label: 'Cemap' },
        ],
      },
      {
        title: 'Exportní můstky',
        items: [
          { key: 'nb_ex_glo', label: 'Globální' }, { key: 'nb_ex_sre', label: 'Sreality' },
          { key: 'nb_ex_rmx', label: 'Reality MIX' }, { key: 'nb_ex_baz', label: 'Bazoš' },
          { key: 'nb_ex_rel', label: 'Realingo' }, { key: 'nb_ex_idn', label: 'Idnes' },
          { key: 'nb_ex_cre', label: 'České reality' }, { key: 'nb_ex_eur', label: 'Eurobydlení' },
          { key: 'nb_ex_b3', label: 'B3 technology' }, { key: 'nb_ex_web', label: 'Osobní web' },
        ],
      },
      { title: 'Zobrazení hodnot v rozbalovacích nabídkách podle struktury', description: RD, items: si('nb_r') },
      {
        title: 'Možnost změnit na stav',
        items: [
          { key: 'nb_st_zru', label: 'Zrušeno' }, { key: 'nb_st_akt', label: 'Aktivní' },
          { key: 'nb_st_rez', label: 'Rezervace' }, { key: 'nb_st_pod', label: 'Podepsaná smlouva' },
          { key: 'nb_st_zob', label: 'Zobchodováno' }, { key: 'nb_st_arc', label: 'Archív' },
          { key: 'nb_st_spo', label: 'Spor' }, { key: 'nb_st_rzr', label: 'Rezervace zrušeno' },
          { key: 'nb_st_nev', label: 'Neveřejná' }, { key: 'nb_st_sak', label: 'Storno (Aktivní)' },
          { key: 'nb_st_sre', label: 'Storno (Rezervace)' }, { key: 'nb_st_spo2', label: 'Storno (Podepsaná smlouva)' },
        ],
      },
      {
        title: 'Je třeba autorizace (určeno pro nižší úroveň oprávnění jako je senior makléř …)',
        description: 'Nejde do stavu v převodu a automaticky autorizuje nabídku. Umožňuje autorizovat jen vlastní nabídky (zaškrtnutý stav nabídky je potřeba autorizovat).',
        items: [
          { key: 'nb_ja_akt', label: 'Aktivní' }, { key: 'nb_ja_rez', label: 'Rezervace' },
          { key: 'nb_ja_pod', label: 'Podepsaná smlouva' }, { key: 'nb_ja_zob', label: 'Zobchodováno' },
          { key: 'nb_ja_sak', label: 'Storno (Aktivní)' }, { key: 'nb_ja_sre', label: 'Storno (Rezervace)' },
          { key: 'nb_ja_spo', label: 'Storno (Podepsaná smlouva)' },
        ],
      },
      {
        title: 'Možnost autorizovat stav (určeno pro vyšší úroveň oprávnění jako je vedoucí, administrátor …)',
        description: 'Nejde do stavu v převodu a automaticky autorizuje nabídku. Umožňuje autorizovat nejen svoje nabídky, ale i ostatních. Možnost autorizovat stav je nadřazena vůči "Není třeba autorizace" a "Možnost změnit na stav".',
        items: [
          { key: 'nb_ma_rez', label: 'Rezervace' }, { key: 'nb_ma_pod', label: 'Podepsaná smlouva' },
          { key: 'nb_ma_akt', label: 'Aktivní' }, { key: 'nb_ma_spo', label: 'Spor' },
          { key: 'nb_ma_zob', label: 'Zobchodováno' }, { key: 'nb_ma_sak', label: 'Storno (Aktivní)' },
          { key: 'nb_ma_sre', label: 'Storno (Rezervace)' }, { key: 'nb_ma_sp2', label: 'Storno (Podepsaná smlouva)' },
          { key: 'nb_ma_sfk', label: 'Storno (K fakturaci)' },
        ],
      },
      {
        title: 'Detail nabídky dokumenty',
        description: 'Volba umožňuje práci s dokumenty v detailu nabídky. Toto nastavení neovlivňuje práva v aktivačních a autorizačních pop-up oknech.',
        items: [{ key: 'nb_dd_nah', label: 'Nahrát' }, { key: 'nb_dd_sma', label: 'Smazat' }],
      },
      {
        title: 'Detail nabídky',
        items: [
          { key: 'nb_det_pop', label: 'Poptávky' }, { key: 'nb_det_kli', label: 'Klienti' },
          { key: 'nb_det_exp', label: 'Exporty' }, { key: 'nb_det_fin', label: 'Finance' },
          { key: 'nb_det_ofi', label: 'Ostatní finanční toky' }, { key: 'nb_det_rzk', label: 'Rozpad zakázky celé struktury' },
          { key: 'nb_det_cos', label: 'Časová osa' }, { key: 'nb_det_nnk', label: 'Nový náklad' },
          { key: 'nb_det_enk', label: 'Editace nákladu' }, { key: 'nb_det_snk', label: 'Smazání nákladu' },
          { key: 'nb_det_urz', label: 'Úhrada rezervace' }, { key: 'nb_det_upr', label: 'Úhrada předpisu' },
          { key: 'nb_det_epl', label: 'Editace platby' }, { key: 'nb_det_spl', label: 'Smazání platby' },
          { key: 'nb_det_zpl', label: 'Zpracovat platby' }, { key: 'nb_det_glv', label: 'Generování LV' },
          { key: 'nb_det_vdo', label: 'Viditelnost dokumentů' }, { key: 'nb_det_ohy', label: 'Odeslání hypotéky do Mydock' },
        ],
      },
    ],
  },
  {
    id: 'nabidkyaut', title: 'Nabídky k autorizaci',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('na_z') },
      {
        title: 'Ostatní',
        items: [
          { key: 'na_ost_edi', label: 'Editovat' }, { key: 'na_ost_sma', label: 'Smazat' },
          { key: 'na_ost_aut', label: 'Autorizovat' }, { key: 'na_ost_his', label: 'Historie' },
          { key: 'na_ost_fil', label: 'Filtrování' },
        ],
      },
    ],
  },
  {
    id: 'elpodpis', title: 'Elektronický podpis',
    groups: [{ items: [{ key: 'ep_vid', label: 'Viditelnost' }] }],
  },
  {
    id: 'statrez', title: 'Statistiky rezervací',
    groups: [
      { title: 'Zobrazení statistik', items: [{ key: 'sr_cela', label: 'Celá struktura' }] },
      { title: 'Ostatní', items: [{ key: 'sr_exp', label: 'Exportovat' }, { key: 'sr_fil', label: 'Filtrování' }] },
    ],
  },
  {
    id: 'statplat', title: 'Statistiky plateb',
    groups: [
      { title: 'Zobrazení statistik', items: [{ key: 'sp_cela', label: 'Celá struktura' }] },
      { title: 'Ostatní', items: [{ key: 'sp_exp', label: 'Exportovat' }, { key: 'sp_fil', label: 'Filtrování' }] },
    ],
  },
  {
    id: 'naklady', title: 'Náklady',
    groups: [{ items: [{ key: 'nk_glob', label: 'Možnost nastavovat globálně náklady' }] }],
  },
  {
    id: 'poptavky', title: 'Poptávky',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('ld_z') },
      { title: 'Ostatní', items: [{ key: 'ld_exp', label: 'Exportovat' }, { key: 'ld_fil', label: 'Filtrování' }] },
    ],
  },
  {
    id: 'prile', title: 'Příležitosti',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('pr_z') },
      { title: 'Ostatní', items: [{ key: 'pr_exp', label: 'Exportovat' }] },
    ],
  },
  {
    id: 'poptavky', title: 'Poptávky',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('po_z') },
      {
        title: 'Ostatní',
        items: [
          { key: 'po_vyt', label: 'Vytvořit' }, { key: 'po_edi', label: 'Editovat' },
          { key: 'po_sma', label: 'Smazat' }, { key: 'po_his', label: 'Historie' },
          { key: 'po_fil', label: 'Filtrování' }, { key: 'po_exp', label: 'Exportovat' },
          { key: 'po_apr', label: 'Automaticky přiřadit' },
        ],
      },
      {
        title: 'Možnost předat jinému makléři z',
        description: 'Pokud má uživatel nastaveno "Celá struktura", tak se v poptávce u přiřazení makléře uživateli zobrazí celá struktura, "Moje struktura", tak uživatel uvidí všechny jeho přímé podřízené napříč strukturou, "Struktura pobočky", tak uživatel uvidí všechny na dané pobočce. "Vlastní", tak uvidí jen sám sebe a nemůže vybrat nikoho jiného.',
        items: [
          { key: 'po_pr_cel', label: 'Celá struktura' }, { key: 'po_pr_fr', label: 'Struktura franchízy' },
          { key: 'po_pr_pob', label: 'Struktura pobočky' },
        ],
      },
    ],
  },
  {
    id: 'cc', title: 'Callcentrum',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('cc_z') },
      {
        title: 'Ostatní',
        items: [
          { key: 'cc_vyt', label: 'Vytvořit' }, { key: 'cc_edi', label: 'Editovat' },
          { key: 'cc_sma', label: 'Smazat' }, { key: 'cc_his', label: 'Historie' },
          { key: 'cc_fil', label: 'Filtrování' }, { key: 'cc_pre', label: 'Předat' },
          { key: 'cc_zko', label: 'Zapsat komunikaci' }, { key: 'cc_inp', label: 'Interní poznámka' },
          { key: 'cc_zrz', label: 'Zrušit záznam' },
        ],
      },
    ],
  },
  {
    id: 'cc_zajem', title: 'Callcentrum - Zájem o nemovitost',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('cz_z') },
      {
        title: 'Ostatní',
        items: [
          { key: 'cz_vyt', label: 'Vytvořit' }, { key: 'cz_edi', label: 'Editovat' },
          { key: 'cz_sma', label: 'Smazat' }, { key: 'cz_his', label: 'Historie' }, { key: 'cz_fil', label: 'Filtrování' },
        ],
      },
    ],
  },
  {
    id: 'cc_nabidka', title: 'Callcentrum - Nabídka nemovitostí',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('cn_z') },
      {
        title: 'Ostatní',
        items: [
          { key: 'cn_vyt', label: 'Vytvořit' }, { key: 'cn_edi', label: 'Editovat' },
          { key: 'cn_sma', label: 'Smazat' }, { key: 'cn_his', label: 'Historie' }, { key: 'cn_fil', label: 'Filtrování' },
        ],
      },
    ],
  },
  {
    id: 'cc_lead', title: 'Callcentrum - Poptávky',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('cl_z') },
      {
        title: 'Ostatní',
        items: [
          { key: 'cl_vyt', label: 'Vytvořit' }, { key: 'cl_edi', label: 'Editovat' },
          { key: 'cl_sma', label: 'Smazat' }, { key: 'cl_his', label: 'Historie' }, { key: 'cl_fil', label: 'Filtrování' },
        ],
      },
    ],
  },
  {
    id: 'cc_vykup', title: 'Callcentrum - Zájem o výkup',
    groups: [
      {
        title: 'Zobrazení podle struktury', description: SD,
        items: [
          { key: 'cv_z_cel', label: 'Celá struktura' }, { key: 'cv_z_moj', label: 'Moje struktura' },
          { key: 'cv_z_fr', label: 'Franchise' }, { key: 'cv_z_pob', label: 'Struktura pobočky' }, { key: 'cv_z_vl', label: 'Vlastní' },
        ],
      },
      {
        title: 'Ostatní',
        items: [
          { key: 'cv_vyt', label: 'Vytvořit' }, { key: 'cv_edi', label: 'Editovat' },
          { key: 'cv_sma', label: 'Smazat' }, { key: 'cv_his', label: 'Historie' }, { key: 'cv_fil', label: 'Filtrování' },
        ],
      },
    ],
  },
  {
    id: 'pobocky', title: 'Pobočky',
    groups: [
      {
        title: 'Zobrazení podle struktury', description: SD,
        items: [
          { key: 'pb_z_cel', label: 'Celá struktura' }, { key: 'pb_z_fr', label: 'Struktura franchízy' }, { key: 'pb_z_vl', label: 'Vlastní' },
        ],
      },
      {
        title: 'Ostatní',
        items: [
          { key: 'pb_vyt', label: 'Vytvořit' }, { key: 'pb_edi', label: 'Editovat' },
          { key: 'pb_sma', label: 'Smazat' }, { key: 'pb_his', label: 'Historie' }, { key: 'pb_fil', label: 'Filtrování' },
        ],
      },
      {
        title: 'Zobrazení hodnot v rozbalovacích nabídkách podle struktury',
        description: 'Pokud má uživatel nastaveno "Celá struktura", tak ve formuláři, kde se přiřazuje pobočka se uživateli zobrazí všechny pobočky. "Vlastní" tak uvidí jen svojí a nemůže vybrat jinou.',
        items: [
          { key: 'pb_r_cel', label: 'Celá struktura' }, { key: 'pb_r_fr', label: 'Struktura franchízy' }, { key: 'pb_r_vl', label: 'Vlastní' },
        ],
      },
    ],
  },
  {
    id: 'franchizy', title: 'Franchízy',
    groups: [{ title: 'Zobrazení podle struktury', items: [{ key: 'fr_z_cel', label: 'Celá struktura' }] }],
  },
  {
    id: 'uzivatele', title: 'Uživatelé',
    groups: [
      { title: 'Zobrazení podle struktury', description: SD, items: si('uz_z') },
      {
        title: 'Ostatní',
        items: [
          { key: 'uz_vyt', label: 'Vytvořit' }, { key: 'uz_edi', label: 'Editovat' },
          { key: 'uz_sma', label: 'Smazat' }, { key: 'uz_his', label: 'Historie' },
          { key: 'uz_fil', label: 'Filtrování' }, { key: 'uz_zpr', label: 'Změna práv' }, { key: 'uz_vyp', label: 'Výplata' },
        ],
      },
      { title: 'Zobrazení hodnot v rozbalovacích nabídkách podle struktury', description: RD, items: si('uz_r') },
    ],
  },
  {
    id: 'struktura', title: 'Struktura',
    groups: [{ items: [{ key: 'st_strom', label: 'Struktura (strom)' }] }],
  },
  {
    id: 'klient', title: 'Klient',
    groups: [{ title: 'Zobrazení podle struktury', description: SD, items: si('kl_z') }],
  },
  {
    id: 'roleaprava', title: 'Role a práva',
    groups: [{ items: [{ key: 'rp_glob', label: 'Zobrazit (Globální)' }] }],
  },
  {
    id: 'nastud', title: 'Nástěnka (naplánované události)',
    groups: [{ title: 'Zobrazení podle struktury', items: si('nu_z') }],
  },
  {
    id: 'dokumenty', title: 'Dokumenty',
    groups: [
      {
        title: 'Práce s dokumenty (nahrání, editace, mazání, kategorie)',
        items: [
          { key: 'dk_cel', label: 'Celá struktura' }, { key: 'dk_fr', label: 'Moje franchiza' }, { key: 'dk_pob', label: 'Moje pobočka' },
        ],
      },
      { title: 'Ostatní', items: [{ key: 'dk_vid', label: 'Dokumenty (viditelnost)' }] },
    ],
  },
  {
    id: 'sms', title: 'SMS',
    groups: [{ items: [{ key: 'sm_vyt', label: 'Vytvoření SMS' }] }],
  },
  {
    id: 'fin_nak', title: 'Finance - Náklady',
    groups: [{
      items: [
        { key: 'fk_cel', label: 'Celá struktura' }, { key: 'fk_fr', label: 'Struktura franchízy' },
        { key: 'fk_pob', label: 'Struktura pobočky' }, { key: 'fk_moj', label: 'Moje struktura' }, { key: 'fk_vl', label: 'Vlastní' },
      ],
    }],
  },
  {
    id: 'fin_sto', title: 'Finance - Storno',
    groups: [{
      items: [
        { key: 'fs_cel', label: 'Celá struktura' }, { key: 'fs_fr', label: 'Struktura franchízy' },
        { key: 'fs_pob', label: 'Struktura pobočky' }, { key: 'fs_moj', label: 'Moje struktura' }, { key: 'fs_vl', label: 'Vlastní' },
      ],
    }],
  },
  {
    id: 'fin_pro', title: 'Finance - Provize',
    groups: [{
      items: [
        { key: 'fp_cel', label: 'Celá struktura' }, { key: 'fp_fr', label: 'Struktura franchízy' },
        { key: 'fp_pob', label: 'Struktura pobočky' }, { key: 'fp_moj', label: 'Moje struktura' }, { key: 'fp_vl', label: 'Vlastní' },
      ],
    }],
  },
  {
    id: 'fin_vyp', title: 'Finance - Výplaty',
    groups: [{
      items: [
        { key: 'fv_cel', label: 'Celá struktura' }, { key: 'fv_fr', label: 'Struktura franchízy' },
        { key: 'fv_pob', label: 'Struktura pobočky' }, { key: 'fv_moj', label: 'Moje struktura' }, { key: 'fv_vl', label: 'Vlastní' },
      ],
    }],
  },
  {
    id: 'fin_vyu', title: 'Finance - Vyúčtování',
    groups: [{
      items: [
        { key: 'fu_cel', label: 'Celá struktura' }, { key: 'fu_fr', label: 'Struktura franchízy' },
        { key: 'fu_pob', label: 'Struktura pobočky' }, { key: 'fu_moj', label: 'Moje struktura' }, { key: 'fu_vl', label: 'Vlastní' },
      ],
    }],
  },
  {
    id: 'fin_pen', title: 'Finance - Pěněžní toky nabídky',
    groups: [{ items: [{ key: 'ft_vid', label: 'Viditelné – veškeré finanční toky u nabídka na kterou má uživatel právo' }] }],
  },
  {
    id: 'fin_fak', title: 'Finance - Faktury',
    groups: [{
      items: [
        { key: 'ff_vid', label: 'Viditelnost faktur uživatelů na které má uživatel práva' },
        { key: 'ff_fr', label: 'Struktura franchízy' }, { key: 'ff_pob', label: 'Struktura pobočky' },
        { key: 'ff_moj', label: 'Moje struktura' }, { key: 'ff_vl', label: 'Vlastní' },
      ],
    }],
  },
  {
    id: 'stary', title: 'Starý systém',
    groups: [{ items: [{ key: 'sy_fin', label: 'Finance' }] }],
  },
  {
    id: 'moznost_role', title: 'Možnost vytvářet uživatele s rolí',
    groups: [{
      items: [
        { key: 'mr_adm', label: 'Administrátor' }, { key: 'mr_adv', label: 'Advokát' },
        { key: 'mr_ahsp', label: 'Asistentka HSP' }, { key: 'mr_amak', label: 'Asistentka makléře' },
        { key: 'mr_apob', label: 'Asistentka pobočky' }, { key: 'mr_hyp', label: 'Hypotékář' },
        { key: 'mr_mhsp', label: 'Majitel HSP' }, { key: 'mr_mpob', label: 'Majitel pobočky' },
        { key: 'mr_mak', label: 'Makléř' }, { key: 'mr_mroz', label: 'Makléř s rozšírenými právy' },
        { key: 'mr_occ', label: 'Operátor CC' }, { key: 'mr_tip', label: 'Tipař' }, { key: 'mr_uct', label: 'Účetní' },
      ],
    }],
  },
]

// ── Default perms for Makléř (matches screenshots) ────────────────────────────

const MAKLER_PERMS: Perms = {
  nb_z_moje: true,
  nb_ost_vyt: true, nb_ost_edi: true, nb_ost_dup: true, nb_ost_exp: true,
  nb_ost_fil: true, nb_ost_lea: true, nb_ost_cem: true,
  nb_ex_glo: true, nb_ex_sre: true, nb_ex_rmx: true, nb_ex_baz: true,
  nb_ex_rel: true, nb_ex_idn: true, nb_ex_cre: true, nb_ex_eur: true, nb_ex_b3: true,
  nb_r_pob: true,
  nb_st_zru: true, nb_st_akt: true, nb_st_rez: true, nb_st_pod: true,
  nb_st_zob: true, nb_st_arc: true, nb_st_rzr: true, nb_st_nev: true,
  nb_st_sak: true, nb_st_sre: true, nb_st_spo2: true,
  nb_dd_nah: true, nb_dd_sma: true,
  nb_det_pop: true, nb_det_kli: true, nb_det_exp: true, nb_det_fin: true,
  nb_det_nnk: true, nb_det_enk: true, nb_det_urz: true,
  nb_det_glv: true, nb_det_vdo: true, nb_det_ohy: true,
  ep_vid: true,
  ld_z_moje: true,
  pr_z_moje: true,
  po_z_pob: true,
  po_vyt: true, po_edi: true, po_his: true, po_fil: true, po_apr: true,
  po_pr_fr: true,
  cc_z_moje: true,
  cc_vyt: true, cc_edi: true, cc_his: true, cc_fil: true,
  cc_pre: true, cc_zko: true, cc_inp: true,
  cz_z_moje: true, cz_vyt: true, cz_edi: true, cz_his: true, cz_fil: true,
  cn_z_moje: true, cn_vyt: true, cn_edi: true, cn_his: true, cn_fil: true,
  cv_z_moj: true, cv_vyt: true, cv_edi: true, cv_his: true, cv_fil: true,
  pb_z_vl: true, pb_fil: true, pb_r_vl: true,
  uz_z_moje: true, uz_edi: true, uz_fil: true, uz_r_pob: true,
  st_strom: true,
  kl_z_moje: true,
  nu_z_moje: true,
  dk_fr: true, dk_pob: true, dk_vid: true,
  sm_vyt: true,
  fk_moj: true, fs_moj: true, fp_moj: true, fv_moj: true, fu_moj: true, ff_moj: true,
}

// ── Helper sub-components ─────────────────────────────────────────────────────

export function PermRow({ label, pKey, perms, onChange, disabled }: {
  label: string; pKey: string; perms: Perms; onChange: (k: string, v: boolean) => void; disabled?: boolean
}) {
  return (
    <CheckboxItem
      label={label}
      checked={!!perms[pKey]}
      disabled={disabled}
      onChange={v => onChange(pKey, v)}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface RolePanelProps {
  mode: RolePanelMode
  role?: RoleData
  onClose: () => void
  onEdit?: () => void
}

const PANEL_TABS = [
  { value: 'role', label: 'Nastavení' },
  { value: 'uzivatele', label: 'Uživatelé' },
]

const USERS_HEADER_H = 40
const USERS_ACTIONS_W = 114

export default function RolePanel({ mode, role, onClose, onEdit }: RolePanelProps) {
  const [activeTab, setActiveTab] = useState('role')
  const [roleName, setRoleName] = useState(role?.nazev ?? '')
  const [updateAll, setUpdateAll] = useState(false)
  const [perms, setPerms] = useState<Perms>(role?.id === 2 ? MAKLER_PERMS : {})
  const [hoveredUser, setHoveredUser] = useState<number | null>(null)
  const [editingUser, setEditingUser] = useState<UzivatelData | null>(null)
  const [pravaUser, setPravaUser] = useState<UzivatelData | null>(null)

  useEffect(() => {
    setRoleName(role?.nazev ?? '')
    setPerms(role?.id === 2 ? MAKLER_PERMS : {})
    setUpdateAll(false)
    setActiveTab('role')
  }, [role])

  const isDetail = mode === 'detail'
  const setPerm = (k: string, v: boolean) => setPerms(prev => ({ ...prev, [k]: v }))

  const roleUsers = uzivateleData.filter(u => u.role === role?.nazev)

  // ── Settings tab ────────────────────────────────────────────────────────────

  const settingsContent = (
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Role name */}
      <div style={{
        background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)',
        borderRadius: 12, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)', lineHeight: '32px', height: 32 }}>Role</span>
        {isDetail ? (
          <div style={{ display: 'flex', alignItems: 'center', height: 24, gap: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--t-textSecondary)', width: 120, flexShrink: 0 }}>Název role</span>
            <span style={{ fontSize: 14, color: 'var(--t-textPrimary)' }}>{roleName || '–'}</span>
          </div>
        ) : (
          <Input label="Název role" required value={roleName} onChange={setRoleName} width="100%" />
        )}
        <CheckboxItem
          label="Aktualizovat práva pro všechny uživatele s touto rolí"
          description="Změna práv této role neovlivní uživatele, kteří jsou k této roli přiřazení."
          checked={updateAll}
          disabled={isDetail}
          onChange={setUpdateAll}
        />
      </div>

      {/* Permission modules */}
      {PERM_MODULES.map(mod => (
        <div key={mod.id} style={{
          background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)',
          borderRadius: 12, padding: 16,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-textPrimary)', lineHeight: '32px', height: 32 }}>{mod.title}</span>
          {mod.groups.map((grp, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <Divider />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grp.title && (
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)', margin: 0, lineHeight: '20px' }}>{grp.title}</p>
                )}
                {grp.description && (
                  <p style={{ fontSize: 13, color: 'var(--t-textSecondary)', lineHeight: '18px', margin: 0 }}>{grp.description}</p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 12px' }}>
                  {grp.items.map(item => (
                    <PermRow key={item.key} label={item.label} pKey={item.key} perms={perms} onChange={setPerm} disabled={isDetail} />
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  )

  // ── Users tab ────────────────────────────────────────────────────────────────

  const stavVariant = (stav: string) => stav === 'Aktivní' ? 'success' : 'neutral' as const

  const usersContent = (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{
        background: 'var(--t-bgPrimary)', border: '1px solid var(--t-borderPrimary)',
        borderRadius: 12, overflow: 'clip',
      }}>
        {/* Header */}
        {roleUsers.length > 0 && (
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flex: 1, height: USERS_HEADER_H, background: 'var(--t-bgSecondary)' }}>
              <div style={{ pointerEvents: 'none' }}><TableHeaderCell label="ID" width={60} /></div>
              <div style={{ flex: 1, minWidth: 100, pointerEvents: 'none' }}><TableHeaderCell label="Jméno" width="100%" /></div>
              <div style={{ flex: 1, minWidth: 100, pointerEvents: 'none' }}><TableHeaderCell label="Příjmení" width="100%" /></div>
              <div style={{ pointerEvents: 'none' }}><TableHeaderCell label="Stav" width={110} /></div>
              <div style={{ pointerEvents: 'none' }}><TableHeaderCell label="Změna práv" width={120} /></div>
            </div>
            <div style={{ position: 'sticky', right: 0, width: USERS_ACTIONS_W, height: USERS_HEADER_H, background: 'var(--t-bgSecondary)', flexShrink: 0 }} />
          </div>
        )}
        {/* Rows */}
        {roleUsers.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--t-textSecondary)', fontSize: 14 }}>
            Žádní uživatelé s touto rolí
          </div>
        ) : roleUsers.map((u, i) => {
          const hovered = hoveredUser === i
          const isLast = i === roleUsers.length - 1
          return (
            <div
              key={u.id}
              style={{ display: 'flex', alignItems: 'stretch', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredUser(i)}
              onMouseLeave={() => setHoveredUser(null)}
            >
              <TableCell size="spacious" width={60} hovered={hovered} borderBottom={!isLast} label={String(u.id)} />
              <div style={{ flex: 1, minWidth: 100 }}>
                <TableCell size="spacious" width="100%" hovered={hovered} borderBottom={!isLast} label={u.jmeno} />
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <TableCell size="spacious" width="100%" hovered={hovered} borderBottom={!isLast} label={u.prijmeni} />
              </div>
              <TableCell size="spacious" width={110} hovered={hovered} borderBottom={!isLast} content={<Tag label={u.stav} variant={stavVariant(u.stav)} size="sm" lead="indicator" />} />
              <TableCell size="spacious" width={120} hovered={hovered} borderBottom={!isLast} label="Ne" />
              <div style={{ position: 'sticky', right: 0, flexShrink: 0, background: 'var(--t-bgPrimary)' }}>
                <TableCell
                  size="spacious"
                  width={USERS_ACTIONS_W}
                  hovered={hovered}
                  borderBottom={!isLast}
                  content={
                    <div style={{ display: 'flex', gap: 2 }}>
                      <div onClick={e => { e.stopPropagation(); setEditingUser(u as unknown as UzivatelData) }}>
                        <IconButton icon={Pencil} variant="ghost" size="lg" tooltip="Upravit uživatele" />
                      </div>
                      <div onClick={e => { e.stopPropagation(); setPravaUser(u as unknown as UzivatelData) }}>
                        <IconButton icon={UserCog} variant="ghost" size="lg" tooltip="Upravit práva" />
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
    <div style={{
      position: 'fixed', right: 0, top: 56, bottom: 0, width: 800, zIndex: 100,
      boxShadow: '-2px 0 4px -2px #0a0d120f, -4px 0 6px -1px #0a0d121a',
      clipPath: 'inset(0 0 0 -20px)',
    }}>
      <Form
        width={720}
        minHeight={0}
        footer={{
          actions: isDetail
            ? [
                { label: 'Zavřít', variant: 'outlined', onClick: onClose },
                { label: 'Upravit roli', variant: 'outlined', onClick: onEdit },
              ]
            : [
                { label: 'Zrušit', variant: 'outlined', onClick: onClose },
                { label: 'Uložit změny', variant: 'primary', onClick: onClose },
              ],
        }}
      >
        <div style={{ padding: 24, background: 'var(--t-bgSecondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {role && <span style={{ fontSize: 14, fontWeight: 600, lineHeight: '20px', color: 'var(--t-textSecondary)', fontFamily: 'Inter' }}>ID {role.id}</span>}
            <span style={{ fontSize: 24, fontWeight: 600, lineHeight: '32px', color: 'var(--t-textPrimary)', fontFamily: 'Inter' }}>
              {isDetail ? (role?.nazev ?? '–') : 'Editace role'}
            </span>
          </div>
          <IconButton icon={X} variant="ghost" size="md" onClick={onClose} />
        </div>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--t-bgSecondary)', marginBottom: 24 }}>
          <div style={{ position: 'relative', paddingLeft: 24, paddingRight: 24 }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'var(--t-borderPrimary)' }} />
            <LineTabGroup tabs={PANEL_TABS} value={activeTab} onChange={setActiveTab} />
          </div>
        </div>
        {activeTab === 'role' ? settingsContent : usersContent}
      </Form>
    </div>

    {editingUser && (
      <UzivatelPanel
        mode="edit"
        uzivatel={editingUser}
        onClose={() => setEditingUser(null)}
      />
    )}

    {pravaUser && (
      <UzivatelPravaPanel
        uzivatel={pravaUser}
        onClose={() => setPravaUser(null)}
      />
    )}
    </>
  )
}
