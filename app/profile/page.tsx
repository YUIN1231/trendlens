'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SavedBiz { name: string; status: string; trendScore: number; address?: string }

export default function ProfilePage() {
  const [searches, setSearches] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [installable, setInstallable] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Stats from localStorage
    try {
      const raw = localStorage.getItem('tl-saved')
      const saved = JSON.parse(raw ?? '[]') as string[]
      setSavedCount(saved.length)

      const count = parseInt(localStorage.getItem('tl-search-count') ?? '0', 10)
      setSearches(count)
    } catch { /* ignore */ }

    // PWA install prompt
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setInstallable(true) }
    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function installApp() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setInstalled(true); setInstallable(false) }
    setDeferredPrompt(null)
  }

  const Row = ({ label, value }: { label: string; value: string | number }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </div>
  )

  return (
    <div className="page-wrap" style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '52px 24px 24px', maxWidth: '460px', margin: '0 auto' }}>

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 40 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.22em', color: 'var(--text3)', textTransform: 'uppercase' }}>TrendLens</span>
        </div>

        {/* Install CTA */}
        {installable && !installed && (
          <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal)', padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 8 }}>Add to home screen</div>
            <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
              Install TrendLens as an app for instant access — no App Store needed.
            </p>
            <button onClick={installApp} style={{
              background: 'var(--teal)', color: '#fff', border: 'none', padding: '10px 20px',
              fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.08em',
              textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600,
            }}>
              Install app
            </button>
          </div>
        )}
        {installed && (
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: '12px 16px', marginBottom: 24, fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--teal)', letterSpacing: '0.06em' }}>
            ✓ Installed as app
          </div>
        )}

        {/* Stats */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>Your stats</div>
          <Row label="Searches" value={searches} />
          <Row label="Saved places" value={savedCount} />
        </div>

        {/* Quick links */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>Navigate</div>
          {[
            { href: '/', label: 'Discover' },
            { href: '/library', label: 'Library (saved places)' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0', borderBottom: '1px solid var(--border)',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: '14px', color: 'var(--text)' }}>{label}</span>
              <span style={{ color: 'var(--text3)', fontSize: '12px' }}>→</span>
            </Link>
          ))}
        </div>

        {/* How scoring works */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '20px', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>How scoring works</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8 }}>
            <div>• <strong>TrendLens Score (0–100)</strong>: base rating + trend momentum</div>
            <div>• <strong>Blowing Up</strong>: sudden surge in reviews and rating</div>
            <div>• <strong>Losing Steam</strong>: fewer recent reviews, rating dropping</div>
            <div>• <strong>AI Analysis</strong>: Claude Haiku reads real reviews to explain why</div>
            <div>• Results cached 24h · Worldwide coverage · 100% free</div>
          </div>
        </div>

        <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 2 }}>
          Data: HasData (Google Maps) · AI: Claude Haiku
          <br />
          <a href="https://github.com/YUIN1231/trendlens" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--text3)', textDecoration: 'none' }}>
            github.com/YUIN1231/trendlens
          </a>
        </div>
      </div>
    </div>
  )
}
