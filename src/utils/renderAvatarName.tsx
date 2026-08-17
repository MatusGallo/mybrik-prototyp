import { Avatar } from '@matusgallo/mysabds'

type AvatarColor = 'dark' | 'purple' | 'blue' | 'orange' | 'green' | 'teal'

const AVATAR_COLORS: AvatarColor[] = ['blue', 'purple', 'green', 'teal', 'orange']

const TITLE_RE = /^(Ing\.|Bc\.|Mgr\.|JUDr\.|MUDr\.|MVDr\.|RNDr\.|PhDr\.|PaedDr\.|ThDr\.|Ph\.D\.|MBA|DiS\.|prof\.|doc\.)$/i

export function avatarColor(s: string): AvatarColor {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function initials(full: string): string {
  const parts = full.trim().split(/\s+/).filter(p => !TITLE_RE.test(p))
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (first + last).toUpperCase() || '?'
}

export function renderAvatarName(key: string) {
  return (r: Record<string, unknown>) => {
    const name = String(r[key] ?? '').trim()
    if (!name) return <span style={{ color: 'var(--t-textPrimary)', fontSize: 14 }}>–</span>
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Avatar size="sm" initials={initials(name)} color={avatarColor(name)} />
        <span style={{ fontSize: 14, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      </div>
    )
  }
}

/**
 * Klient uložený jako „jméno\nemail\ntelefon“ - avatar a jméno na prvním řádku,
 * kontakty na druhém. Stejná podoba na seznamu příležitostí i v detailu poptávky.
 */
export function renderKlientKontakt(key: string) {
  return (r: Record<string, unknown>) => {
    const [name, email, phone] = String(r[key] ?? '').split('\n')
    if (!name) return <span style={{ color: 'var(--t-textPrimary)', fontSize: 14 }}>–</span>
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', width: '100%' }}>
        <Avatar size="sm" initials={initials(name)} color={avatarColor(name)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden', minWidth: 0 }}>
          <span style={{ fontSize: 14, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {(phone || email) && (
            <span style={{ fontSize: 12, color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[phone, email].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>
    )
  }
}

/** Avatar + celé jméno s titulem na prvním řádku, doplňkový údaj (např. role) na druhém. */
export function renderAvatarJmenoPodtitul(titulKey: string, firstKey: string, lastKey: string, subKey: string) {
  return (r: Record<string, unknown>) => {
    const titul = String(r[titulKey] ?? '').trim()
    const full = [String(r[firstKey] ?? '').trim(), String(r[lastKey] ?? '').trim()].filter(Boolean).join(' ')
    const podtitul = String(r[subKey] ?? '').trim()
    if (!full) return <span style={{ color: 'var(--t-textPrimary)', fontSize: 14 }}>–</span>
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <Avatar size="md" initials={initials(full)} color={avatarColor(full)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[titul, full].filter(Boolean).join(' ')}
          </span>
          {podtitul && <span style={{ fontSize: 12, color: 'var(--t-textSecondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{podtitul}</span>}
        </div>
      </div>
    )
  }
}

export function renderAvatarNameSplit(firstKey: string, lastKey: string) {
  return (r: Record<string, unknown>) => {
    const first = String(r[firstKey] ?? '').trim()
    const last = String(r[lastKey] ?? '').trim()
    const full = [first, last].filter(Boolean).join(' ')
    if (!full) return <span style={{ color: 'var(--t-textPrimary)', fontSize: 14 }}>–</span>
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Avatar size="sm" initials={initials(full)} color={avatarColor(full)} />
        <span style={{ fontSize: 14, color: 'var(--t-textPrimary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(r[firstKey] ?? '–')}</span>
      </div>
    )
  }
}
