'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/',        label: 'Discover', icon: DiscoverIcon },
  { href: '/map',     label: 'Map',      icon: MapIcon },
  { href: '/library', label: 'Library',  icon: LibraryIcon },
  { href: '/profile', label: 'Profile',  icon: ProfileIcon },
]

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
    </svg>
  )
}
function MapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  )
}
function LibraryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function BottomNav() {
  const path = usePathname()
  const active = (href: string) =>
    href === '/' ? (path === '/' || path.startsWith('/results')) : path.startsWith(href)

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => {
        const isActive = active(tab.href)
        const Icon = tab.icon
        return (
          <Link key={tab.href} href={tab.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 0 8px', textDecoration: 'none',
            color: isActive ? 'var(--teal)' : 'var(--text3)',
            transition: 'color 0.15s',
          }}>
            <Icon active={isActive} />
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '10px', marginTop: '3px',
              letterSpacing: '0.04em', fontWeight: isActive ? 600 : 400,
            }}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
