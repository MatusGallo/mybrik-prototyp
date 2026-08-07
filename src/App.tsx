import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './pages/DashboardPage'
import NabidkyListPage from './pages/nabidky/NabidkyListPage'
import NabidkyKAutorizaciPage from './pages/nabidky/NabidkyKAutorizaciPage'
import MojeNabidkyPage from './pages/nabidky/MojeNabidkyPage'
import NabidkaDetailPage from './pages/nabidky/NabidkaDetailPage'
import StatistikyRezervacePage from './pages/statistiky/StatistikyRezervacePage'
import StatistikyPlatebPage from './pages/statistiky/StatistikyPlatebPage'
import ObchodPage from './pages/obchod/ObchodPage'
import NabidkaNemovitostiPage from './pages/obchod/NabidkaNemovitostiPage'
import NabidkaNemovitostiDetailPage from './pages/obchod/NabidkaNemovitostiDetailPage'
import ZajemOVykupPage from './pages/obchod/ZajemOVykupPage'
import LeadHypoPage from './pages/obchod/LeadHypoPage'
import PoptavkyPage from './pages/obchod/PoptavkyPage'
import PoptavkaDetailPage from './pages/obchod/PoptavkaDetailPage'
import PrilezitostiPage from './pages/obchod/PrilezitostiPage'
import PrilezitostDetailPage from './pages/obchod/PrilezitostDetailPage'
import KlientiPage from './pages/KlientiPage'
import DokumentyPage from './pages/DokumentyPage'
import PobockyPage from './pages/PobockyPage'
import PobockaFormPage from './pages/PobockaFormPage'
import HspPage from './pages/HspPage'
import HspFormPage from './pages/HspFormPage'
import UzivatelePage from './pages/UzivatelePage'
import UzivatelFormPage from './pages/UzivatelFormPage'
import RoleAPravaPage from './pages/RoleAPravaPage'
import KalendarPage from './pages/KalendarPage'
import VyuctovaniPage from './pages/vyuctovani/VyuctovaniPage'
import PlaceholderPage from './pages/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Fullscreen formuláře — bez topbaru a sidebaru, stejně jako vytvoření nabídky */}
        <Route path="/hsp/nove" element={<HspFormPage mode="create" />} />
        <Route path="/hsp/:id/upravit" element={<HspFormPage mode="edit" />} />
        <Route path="/uzivatele/novy" element={<UzivatelFormPage mode="create" />} />
        <Route path="/uzivatele/:id/upravit" element={<UzivatelFormPage mode="edit" />} />
        <Route path="/pobocky/nova" element={<PobockaFormPage mode="create" />} />
        <Route path="/pobocky/:id/upravit" element={<PobockaFormPage mode="edit" />} />

        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/nastanka" replace />} />
          <Route path="/nastanka" element={<DashboardPage />} />

          <Route path="/nabidky" element={<NabidkyListPage />} />
          <Route path="/nabidky/k-autorizaci" element={<NabidkyKAutorizaciPage />} />
          <Route path="/nabidky/moje" element={<MojeNabidkyPage />} />
          <Route path="/nabidky/:id" element={<NabidkaDetailPage />} />

          <Route path="/statistiky/rezervace" element={<StatistikyRezervacePage />} />
          <Route path="/statistiky/platby" element={<StatistikyPlatebPage />} />

          <Route path="/obchod" element={<ObchodPage />} />
          <Route path="/obchod/nabidka-nemovitosti" element={<NabidkaNemovitostiPage />} />
          <Route path="/obchod/nabidka-nemovitosti/:id" element={<NabidkaNemovitostiDetailPage />} />
          <Route path="/obchod/zajem-o-vykup" element={<ZajemOVykupPage />} />
          <Route path="/obchod/lead-hypo" element={<LeadHypoPage />} />
          <Route path="/obchod/poptavky" element={<PoptavkyPage />} />
          <Route path="/obchod/poptavky/:id" element={<PoptavkaDetailPage />} />
          <Route path="/obchod/prilezitosti" element={<PrilezitostiPage />} />
          <Route path="/obchod/prilezitosti/:id" element={<PrilezitostDetailPage />} />

          <Route path="/klienti" element={<KlientiPage />} />
          <Route path="/dokumenty" element={<DokumentyPage />} />
          <Route path="/pobocky" element={<PobockyPage />} />
          <Route path="/hsp" element={<HspPage />} />
          <Route path="/uzivatele" element={<UzivatelePage />} />
          <Route path="/kalendar" element={<KalendarPage />} />
          <Route path="/role-a-prava" element={<RoleAPravaPage />} />

          <Route path="/vyuctovani/naklady"    element={<VyuctovaniPage />} />
          <Route path="/vyuctovani/storno"     element={<VyuctovaniPage />} />
          <Route path="/vyuctovani/provize"    element={<VyuctovaniPage />} />
          <Route path="/vyuctovani/vyplaty"    element={<VyuctovaniPage />} />
          <Route path="/vyuctovani/vyuctovani" element={<VyuctovaniPage />} />
          <Route path="/vyuctovani/faktury"    element={<VyuctovaniPage />} />

          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
