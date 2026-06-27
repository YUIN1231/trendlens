'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation, LANG_OPTIONS } from '@/lib/i18n'

const POPULAR = [
  { area: 'Melbourne', category: 'café' },
  { area: 'Tokyo', category: 'ramen' },
  { area: 'New York', category: 'bar' },
  { area: 'Paris', category: 'restaurant' },
  { area: 'Sydney', category: 'café' },
  { area: 'London', category: 'pub' },
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
      const r = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: a.trim(), category: c.trim() }),
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

      {/* Loading */}
      {loading && (
        <div className="overlay">
          <div className="spinner" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {LOAD_STEPS.map((k, i) => (
              <div key={k} className="loading-step" style={{
                color: i < step ? 'var(--green)' : i === step ? 'var(--text)' : 'var(--text3)',
              }}>
                {i < step ? '✓ ' : i === step ? '→ ' : '  '}{t(k)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 500 }}
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
            position: 'absolute', right: 0, top: '24px', background: 'var(--bg2)',
            border: '1px solid var(--border)', minWidth: '130px', zIndex: 600,
          }}>
            {LANG_OPTIONS.map(opt => (
              <button key={opt.code} onClick={() => { setLang(opt.code); setLangOpen(false) }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: '11px',
                cursor: 'pointer', border: 'none', letterSpacing: '0.04em',
                background: opt.code === lang ? 'var(--bg3)' : 'var(--bg2)',
                color: opt.code === lang ? 'var(--text)' : 'var(--text2)',
                borderBottom: '1px solid var(--border)',
              }}>{opt.label}</button>
            ))}
          </div>
        )}
      </div>

      <main className="landing">
        <div className="wordmark">Trend<span style={{ color: 'var(--accent)' }}>Lens</span></div>

        <h1 className="headline">{t('hero.headline')}</h1>
        <p className="subline">{t('hero.subheadline')}</p>

        <form className="search-form" onSubmit={e => { e.preventDefault(); doSearch(area, category) }}>
          <div className="field-wrap">
            <div className="field-label">{t('search.area.label')}</div>
            <input className="text-input" type="text" autoFocus
              placeholder={t('search.area.placeholder')}
              value={area} onChange={e => setArea(e.target.value)} disabled={loading} />
            <button type="button" className={`location-btn${gpsLoading ? ' active' : ''}`}
              onClick={gps} disabled={gpsLoading || loading}>
              {gpsLoading ? t('search.location.detecting') : t('search.location.btn')}
            </button>
          </div>

          <div className="field-wrap">
            <div className="field-label">{t('search.category.label')}</div>
            <input className="text-input" type="text"
              placeholder={t('search.category.placeholder')}
              value={category} onChange={e => setCategory(e.target.value)} disabled={loading} />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="search-btn" type="submit"
            disabled={loading || !area.trim() || !category.trim()}>
            {loading ? t('search.cta.loading') : t('search.cta')}
          </button>
        </form>

        {/* Popular */}
        <div style={{ marginTop: '28px', width: '100%', maxWidth: '460px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '12px', textAlign: 'center' }}>
            or try
          </div>
          <div className="popular-row" style={{ justifyContent: 'center' }}>
            {POPULAR.map(p => (
              <button key={`${p.area}-${p.category}`} type="button" className="popular-tag"
                onClick={() => { setArea(p.area); setCategory(p.category); doSearch(p.area, p.category) }}
                disabled={loading}>
                {p.area} {p.category}
              </button>
            ))}
          </div>
        </div>

        {/* Sample — iPod list style */}
        <div style={{ width: '100%', maxWidth: '460px', marginTop: '64px' }}>
          <div className="section-label" style={{ marginBottom: '16px', textAlign: 'center' }}>
            {t('sample.title')}
          </div>

          {/* Rising sample */}
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="biz-name">OKO Cafe</div>
                <div className="biz-meta">Melbourne CBD · ★ 4.9</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="delta-num rising">↑ +1.95</span>
                <span className="delta-label rising">{t('results.rising').replace('🔥 ', '')}</span>
              </div>
            </div>
            <div style={{ padding: '12px 20px 16px', borderBottom: '1px solid var(--border)' }}>
              <div className="why-label rising" style={{ marginBottom: '6px' }}>{t('results.why.rising')}</div>
              <div className="why-item" style={{ marginBottom: 0 }}>
                <span style={{ color: 'var(--green)' }}>•</span>
                <span>Rating improved 4.1 → 4.9 · More positive service mentions</span>
              </div>
            </div>
          </div>

          {/* Falling sample */}
          <div style={{ background: 'var(--bg2)', pointerEvents: 'none', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="biz-name">Blue Cup Cafe</div>
                <div className="biz-meta">Fitzroy · ★ 3.4</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="delta-num falling">↓ -0.67</span>
                <span className="delta-label falling">{t('results.falling').replace('💀 ', '')}</span>
              </div>
            </div>
            <div style={{ padding: '12px 20px 16px' }}>
              <div className="why-label falling" style={{ marginBottom: '6px' }}>{t('results.why.falling')}</div>
              <div className="why-item" style={{ marginBottom: 0 }}>
                <span style={{ color: 'var(--red)' }}>•</span>
                <span>Rating dropped 4.3 → 3.4 · Wait time complaints increasing</span>
              </div>
            </div>
          </div>
        </div>

        {/* How */}
        <div style={{ width: '100%', maxWidth: '460px', marginTop: '60px' }}>
          <div className="section-label" style={{ marginBottom: '20px', textAlign: 'center' }}>{t('how.title')}</div>
          {(['how.step1', 'how.step2', 'how.step3', 'how.step4.share'] as const).map((k, i) => (
            <div key={k} style={{
              display: 'flex', gap: '20px', alignItems: 'flex-start',
              padding: '14px 0', borderBottom: '1px solid var(--border)',
              background: 'transparent',
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)', minWidth: '28px', paddingTop: '2px', letterSpacing: '0.04em' }}>
                0{i + 1}
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6, letterSpacing: '0.01em' }}>{t(k)}</span>
            </div>
          ))}
        </div>

        <div className="tagline" style={{ marginTop: '48px' }}>
          {t('meta.tagline').split(' · ').map(s => <span key={s}>{s}</span>)}
        </div>
      </main>
    </div>
  )
}
