import { useNavigate } from 'react-router-dom'
import {
  Home, MessageCircle, Users, TrendingUp, FileText, CreditCard, Calendar,
  CheckSquare, ArrowUpRight, TrendingDown, ArrowRight,
} from 'lucide-react'
import { Avatar, Tag, TextButton } from '@matusgallo/mysabds'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { prilezitostiData } from '../data/mockObchod'

// ── Mock data ──────────────────────────────────────────────────────────────────

const performanceData = [
  { month: 'Čer', poptavky: 12, nabidky: 8 },
  { month: 'Čvc', poptavky: 18, nabidky: 11 },
  { month: 'Srp', poptavky: 24, nabidky: 14 },
  { month: 'Zář', poptavky: 21, nabidky: 18 },
  { month: 'Říj', poptavky: 28, nabidky: 22 },
  { month: 'Lis', poptavky: 32, nabidky: 24 },
  { month: 'Pro', poptavky: 26, nabidky: 19 },
  { month: 'Led', poptavky: 30, nabidky: 23 },
  { month: 'Úno', poptavky: 35, nabidky: 27 },
  { month: 'Bře', poptavky: 38, nabidky: 28 },
  { month: 'Dub', poptavky: 42, nabidky: 31 },
  { month: 'Kvě', poptavky: 45, nabidky: 34 },
]

const kpiCards = [
  { label: 'Nabídky', value: '198', icon: Home, delta: 12, link: '/nabidky' },
  { label: 'Klienti', value: '2 625', icon: Users, delta: 8, link: '/klienti' },
  { label: 'Příležitosti', value: '1 186', icon: TrendingUp, delta: -3, link: '/obchod/prilezitosti' },
  { label: 'Poptávky', value: '128', icon: MessageCircle, delta: 24, link: '/obchod/lead' },
]

const SCHUZKY = [
  { id: 1, mesic: 'Čvc', den: '12', cas: '10:00', nazev: 'Prohlídka — Byt 2+kk, Praha 5', klient: 'Tomáš Čáp' },
  { id: 2, mesic: 'Čvc', den: '12', cas: '14:30', nazev: 'Schůzka s klientem', klient: 'Linda Kukačková' },
  { id: 3, mesic: 'Čvc', den: '13', cas: '09:00', nazev: 'Prohlídka — Rodinný dům, Beroun', klient: 'Jarmila Nováková' },
]

const UKOLY = [
  { id: 1, nazev: 'Zavolat klientovi Tomáš Čáp', termin: 'Dnes', priorita: 'Vysoká' as const },
  { id: 2, nazev: 'Připravit smlouvu pro Lindu Kukačkovou', termin: 'Zítra', priorita: 'Střední' as const },
  { id: 3, nazev: 'Zapsat výsledek prohlídky z 11.07.', termin: 'Po termínu', priorita: 'Vysoká' as const },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Dobré ráno'
  if (h < 17) return 'Dobrý den'
  return 'Dobrý večer'
}

function todayCz(): string {
  return new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const AVATAR_COLOR_KEYS = ['purple', 'blue', 'orange', 'green', 'teal', 'red', 'pink', 'dark'] as const
function avatarColor(name: string): typeof AVATAR_COLOR_KEYS[number] {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLOR_KEYS[hash % AVATAR_COLOR_KEYS.length]
}
function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const WIDGET: React.CSSProperties = {
  background: 'var(--t-bgPrimary)',
  border: '1px solid var(--t-borderPrimary)',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

// typography.subheadline18Semibold
const WIDGET_HEADING: React.CSSProperties = {
  fontSize: 18, fontWeight: 600, lineHeight: '26px', letterSpacing: '-0.36px',
  color: 'var(--t-textPrimary)',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DateBadge({ month, day }: { month: string; day: string }) {
  return (
    <div style={{
      borderRadius: 6,
      outline: '1px solid var(--t-borderPrimary)',
      outlineOffset: -1,
      display: 'inline-flex',
      flexDirection: 'column',
      flexShrink: 0,
      width: 48,
      overflow: 'hidden',
      background: 'var(--t-bgPrimary)',
    }}>
      <div style={{
        padding: '2px 6px',
        background: 'var(--t-bgTertiary, var(--t-bgSecondary))',
        display: 'flex', justifyContent: 'center',
      }}>
        <span style={{
          color: 'var(--t-textSecondary)',
          fontSize: 10, fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1px',
        }}>{month}</span>
      </div>
      <div style={{ padding: '4px 0', display: 'flex', justifyContent: 'center' }}>
        <span style={{ color: 'var(--t-textPrimary)', fontSize: 16, fontWeight: 600 }}>{day}</span>
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, delta, onClick }: {
  label: string; value: string; icon: typeof Home; delta: number; onClick: () => void
}) {
  const positive = delta >= 0
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: 'var(--t-bgPrimary)',
        border: '1px solid var(--t-borderPrimary)',
        borderRadius: 12,
        padding: 20,
        display: 'flex', flexDirection: 'column', gap: 12,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,13,18,0.06)'
        e.currentTarget.style.borderColor = 'var(--t-borderMyDOCK, var(--t-borderPrimary))'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = 'var(--t-borderPrimary)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t-textSecondary)' }}>{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--t-bgMyDOCKTertiary, #fff5f0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color: 'var(--t-textMyDOCKPrimary)' }} />
        </div>
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, lineHeight: '36px', color: 'var(--t-textPrimary)' }}>{value}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {positive
          ? <TrendingUp size={14} style={{ color: 'var(--t-textSuccessPrimary, #16A34A)' }} />
          : <TrendingDown size={14} style={{ color: 'var(--t-textDangerPrimary, #DC2626)' }} />}
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: positive ? 'var(--t-textSuccessPrimary, #16A34A)' : 'var(--t-textDangerPrimary, #DC2626)',
        }}>
          {positive ? '+' : ''}{delta} %
        </span>
        <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>vs. minulý měsíc</span>
      </div>
    </button>
  )
}

function SchuzkaRow({ s }: { s: typeof SCHUZKY[0] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8 }}>
      <DateBadge month={s.mesic} day={s.den} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.nazev}
          </span>
          <Tag label={s.cas} variant="outline" size="sm" />
        </div>
        <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>{s.klient}</span>
      </div>
    </div>
  )
}

function UkolRow({ u }: { u: typeof UKOLY[0] }) {
  const priorityVariant = u.priorita === 'Vysoká' ? 'danger' : u.priorita === 'Střední' ? 'warning' : 'neutral'
  const terminVariant = u.termin === 'Po termínu' ? 'danger' : u.termin === 'Dnes' ? 'info' : 'neutral'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--t-bgMyDOCKTertiary, #fff5f0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <CheckSquare size={16} style={{ color: 'var(--t-textMyDOCKPrimary)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {u.nazev}
        </span>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <Tag label={u.termin} variant={terminVariant} size="sm" />
          <Tag label={u.priorita} variant={priorityVariant} size="sm" />
        </div>
      </div>
    </div>
  )
}

function PrilezitostRow({ p, onClick }: { p: typeof prilezitostiData[0]; onClick: () => void }) {
  const [klientName] = p.klient.split('\n')
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 8, cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--t-bgSecondary)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <Avatar size="sm" initials={initials(klientName)} color={avatarColor(klientName)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {p.nazevNabidky}
        </span>
        <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>
          {klientName} · {p.makler}
        </span>
      </div>
      <Tag
        label={p.stavPrilezitosti}
        variant={p.stavPrilezitosti === 'Aktivní' ? 'success' : p.stavPrilezitosti === 'Prohlídka' ? 'info' : 'neutral'}
        size="sm"
      />
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()

  const topPrilezitosti = prilezitostiData.slice(0, 5)

  return (
    <div style={{ margin: -24, padding: 24, background: 'var(--t-bgSecondary)', minHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: '36px', color: 'var(--t-textPrimary)' }}>
            {greeting()}, Matúši
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--t-textSecondary)', textTransform: 'capitalize' }}>
            {todayCz()}
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {kpiCards.map(card => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            delta={card.delta}
            onClick={() => navigate(card.link)}
          />
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'flex-start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Výkon */}
          <div style={WIDGET}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={WIDGET_HEADING}>Výkon za posledních 12 měsíců</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--t-textMyDOCKPrimary)' }} />
                  <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>Poptávky</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#94a3b8' }} />
                  <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>Nabídky</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={performanceData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="poptavkyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--t-textMyDOCKPrimary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--t-textMyDOCKPrimary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="nabidkyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--t-borderPrimary)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--t-textTertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--t-textTertiary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--t-borderPrimary)', background: 'var(--t-bgPrimary)' }}
                  labelStyle={{ color: 'var(--t-textSecondary)' }}
                />
                <Area type="monotone" dataKey="poptavky" stroke="var(--t-textMyDOCKPrimary)" strokeWidth={2} fill="url(#poptavkyGrad)" name="Poptávky" />
                <Area type="monotone" dataKey="nabidky" stroke="#94a3b8" strokeWidth={2} fill="url(#nabidkyGrad)" name="Nabídky" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Aktivní příležitosti */}
          <div style={WIDGET}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={WIDGET_HEADING}>Aktivní příležitosti</span>
              <TextButton label="Zobrazit vše" variant="brand" tailIcon={ArrowRight} onClick={() => navigate('/obchod/prilezitosti')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {topPrilezitosti.map(p => (
                <PrilezitostRow key={p.id} p={p} onClick={() => navigate(`/obchod/prilezitosti/${p.id}`)} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Moje výplata */}
          <div style={WIDGET}>
            <span style={WIDGET_HEADING}>Moje výplata</span>
            <div>
              <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--t-textPrimary)', lineHeight: '40px' }}>284 500 Kč</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <ArrowUpRight size={14} style={{ color: 'var(--t-textSuccessPrimary, #16A34A)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-textSuccessPrimary, #16A34A)' }}>+18 %</span>
                <span style={{ fontSize: 12, color: 'var(--t-textSecondary)' }}>vs. minulý měsíc</span>
              </div>
            </div>
            <TextButton label="Detail výplaty" variant="brand" tailIcon={ArrowRight} onClick={() => navigate('/vyuctovani/vyplaty')} />
          </div>

          {/* Nadcházející schůzky */}
          <div style={WIDGET}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={WIDGET_HEADING}>Nadcházející schůzky</span>
              <TextButton label="Kalendář" variant="brand" tailIcon={Calendar} onClick={() => navigate('/kalendar')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SCHUZKY.map(s => <SchuzkaRow key={s.id} s={s} />)}
            </div>
          </div>

          {/* Aktuální úkoly */}
          <div style={WIDGET}>
            <span style={WIDGET_HEADING}>Aktuální úkoly</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {UKOLY.map(u => <UkolRow key={u.id} u={u} />)}
            </div>
          </div>

          {/* Rychlé volby */}
          <div style={WIDGET}>
            <span style={WIDGET_HEADING}>Rychlé volby</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Nabídky', icon: Home, link: '/nabidky' },
                { label: 'Klienti', icon: Users, link: '/klienti' },
                { label: 'Výplata', icon: CreditCard, link: '/vyuctovani/vyplaty' },
                { label: 'Kalendář', icon: Calendar, link: '/kalendar' },
                { label: 'Dokumenty', icon: FileText, link: '/dokumenty' },
                { label: 'Leady', icon: MessageCircle, link: '/obchod/lead' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.link)}
                    style={{
                      background: 'transparent', border: '1px solid var(--t-borderPrimary)',
                      borderRadius: 8, padding: '10px 4px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--t-bgSecondary)'
                      e.currentTarget.style.borderColor = 'var(--t-borderMyDOCK, var(--t-borderPrimary))'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'var(--t-borderPrimary)'
                    }}
                  >
                    <Icon size={18} style={{ color: 'var(--t-textMyDOCKPrimary)' }} />
                    <span style={{ fontSize: 11, color: 'var(--t-textSecondary)' }}>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
