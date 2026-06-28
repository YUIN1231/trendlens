'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation, LANG_OPTIONS } from '@/lib/i18n'

const POPULAR = [
  { area: 'Melbourne', category: 'brunch' },
  { area: 'Tokyo', category: 'ramen' },
  { area: 'New York', category: 'rooftop bar' },
  { area: 'London', category: 'café' },
  { area: 'Paris', category: 'wine bar' },
  { area: 'Bangkok', category: 'street food' },
]

const LOAD_STEPS = ['loading.step1', 'loading.step2', 'loading.step3', 'loading.step4'] as const

export default function Home() {
  const { t, lang, setLang } = useTranslation()
  const [area, setArea] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError] = useState('')
  const [langOpen, setLangOpen] = useState(false)
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (loading) {
      setStep(0)
      timer.current = setInterval(() => setStep(s => Math.min(s + 1, 3)), 14000)
    } else {
      if (timer.current) clearInterval(timer.current)
    }
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [loading])

  async function gps() {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const d = await r.json() as { address?: { suburb?: string; city?: string; town?: string; country?: string } }
        const a = d.address ?? {}
        setArea(`${a.suburb ?? a.city ?? a.town ?? ''}, ${a.country ?? ''}`.replace(/^, /, ''))
      } finally { setGpsLoading(false) }
    }, () => setGpsLoading(false))
  }

  async function doSearch(a: string, c: string) {
    if (!a.trim() || !c.trim()) return
    setError(''); setLoading(true)
    try {
      // Track search count for Profile stats
      try {
        const count = parseInt(localStorage.getItem('tl-search-count') ?? '0', 10)
        localStorage.setItem('tl-search-count', String(count + 1))
      } catch { /* ignore */ }

      const r = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: a.trim(), category: c.trim(), language: lang }),
      })
      const d = await r.json() as { error?: string }
      if (!r.ok) throw new Error(d.error ?? 'Search failed')
      router.push(`/results?area=${encodeURIComponent(a.trim())}&category=${encodeURIComponent(c.trim())}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} onClick={() => setLangOpen(false)}>
      {loading && (
        <div className="overlay">
          <div className="spinner" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {LOAD_STEPS.map((k, i) => (
              <div key={k} className="loading-step" style={{
                color: i < step ? 'var(--teal)' : i === step ? 'var(--text)' : 'var(--text3)',
              }}>
                {i < step ? '✓ ' : i === step ? '→ ' : '  '}{t(k)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language picker */}
      <div style={{ position: 'fixed', top: '18px', right: '18px', zIndex: 500 }}
        onClick={e => e.stopPropagation()}>
        <button onClick={() => setLangOpen(o => !o)} style={{
          background: 'none', border: 'none', color: 'var(--text3)',
          fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer',
          letterSpacing: '0.06em', padding: '4px',
        }}>
          {LANG_OPTIONS.find(l => l.code === lang)?.label ?? 'EN'}
        </button>
        {langOpen && (
          <div style={{
            position: 'absolute', right: 0, top: '26px', background: 'var(--bg2)',
            border: '1px solid var(--border)', minWidth: '132px', zIndex: 600,
          }}>
            {LANG_OPTIONS.map(opt => (
              <button key={opt.code} onClick={() => { setLang(opt.code); setLangOpen(false) }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: '11px',
                cursor: 'pointer', border: 'none', letterSpacing: '0.04em',
                background: opt.code === lang ? 'var(--bg3)' : 'var(--bg2)',
                color: opt.code === lang ? 'var(--teal)' : 'var(--text2)',
                borderBottom: '1px solid var(--border)',
              }}>{opt.label}</button>
            ))}
          </div>
        )}
      </div>

      <main className="home-wrap page-wrap">
        <div className="wordmark">
          TrendLens <span className="wordmark-dot" />
        </div>

        <h1 className="headline">{t('hero.headline')}</h1>
        <p className="subline">{t('hero.subheadline')}</p>

        <form className="search-form" onSubmit={e => { e.preventDefault(); doSearch(area, category) }}>
          <div className="field-wrap">
            <div className="field-label">{t('search.area.label')}</div>
            <input
              className="text-input"
              type="text"
              autoFocus
              placeholder={t('search.area.placeholder')}
              value={area}
              onChange={e => setArea(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className={`location-btn${gpsLoading ? ' active' : ''}`}
              onClick={gps}
              disabled={gpsLoading || loading}
            >
              {gpsLoading ? t('search.location.detecting') : t('search.location.btn')}
            </button>
          </div>

          <div className="field-wrap">
            <div className="field-label">{t('search.category.label')}</div>
            <input
              className="text-input"
              type="text"
              placeholder={t('search.category.placeholder')}
              value={category}
              onChange={e => setCategory(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className="search-btn"
            type="submit"
            disabled={loading || !area.trim() || !category.trim()}
          >
            {loading ? t('search.cta.loading') : t('search.cta')}
          </button>
        </form>

        <div className="popular-section">
          <div className="popular-label">Try</div>
          <div className="popular-row">
            {POPULAR.map(p => (
              <button
                key={`${p.area}-${p.category}`}
                type="button"
                className="popular-tag"
                onClick={() => { setArea(p.area); setCategory(p.category); doSearch(p.area, p.category) }}
                disabled={loading}
              >
                {p.area} {p.category}
              </button>
            ))}
          </div>
        </div>

        <div className="home-footer">{t('meta.tagline')}</div>
      </main>
    </div>
  )
}
