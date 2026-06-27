'use client'
import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { SearchResult, TrendBusiness } from '@/lib/types'
import { useTranslation, LANG_OPTIONS } from '@/lib/i18n'

function mapsUrl(b: TrendBusiness) {
  return b.mapsUrl?.startsWith('http')
    ? b.mapsUrl
    : `https://www.google.com/maps/search/${encodeURIComponent(b.name + ' ' + b.address)}`
}
function reviewUrl(b: TrendBusiness) {
  return `https://search.google.com/local/writereview?query=${encodeURIComponent(b.name + ' ' + b.address)}`
}
function deltaLabel(b: TrendBusiness) {
  if (b.status === 'new') return 'NEW'
  if (b.trendDelta === 0) return '—'
  return b.trendDelta > 0 ? `↑ +${b.trendDelta.toFixed(2)}` : `↓ ${b.trendDelta.toFixed(2)}`
}

function BizRow({ b, rank, t }: { b: TrendBusiness; rank: number; t: (k: string) => string }) {
  const [open, setOpen] = useState(false)
  const rising = b.status === 'rising'
  const falling = b.status === 'falling'

  return (
    <div className="biz-row" onClick={() => setOpen(o => !o)}>
      <div className="biz-row-top">
        <div className="biz-row-left">
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.06em', marginBottom: '4px' }}>
            #{rank}
          </div>
          <div className="biz-name">{b.name}</div>
          <div className="biz-meta">
            {b.address ? `${b.address} · ` : ''}{b.rating.toFixed(1)} ★
          </div>
        </div>
        <div className="biz-row-delta">
          <span className={`delta-num ${b.status}`}>{deltaLabel(b)}</span>
          <span className={`delta-label ${b.status}`}>
            {rising ? t('results.rising').replace('🔥 ', '') :
             falling ? t('results.falling').replace('💀 ', '') :
             b.status === 'new' ? t('results.new').replace('✨ ', '') : t('results.stable').replace('→ ', '')}
          </span>
        </div>
      </div>

      {open && (
        <div className="biz-detail">
          <div className="detail-stats">
            <span className="stat-tag">{b.recentCount} {t('results.reviews.30d')}</span>
            {b.status !== 'new' && b.olderCount > 0 && (
              <span className="stat-tag">{b.olderAvg.toFixed(1)} → {b.recentAvg.toFixed(1)} {t('score.explain')}</span>
            )}
            {b.totalReviews > 0 && (
              <span className="stat-tag">{b.totalReviews.toLocaleString()} total</span>
            )}
          </div>

          {(rising || falling) && b.why.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div className={`why-label ${b.status}`}>
                {rising ? t('results.why.rising') : t('results.why.falling')}
              </div>
              {b.why.map((r, i) => (
                <div key={i} className="why-item">
                  <span style={{ color: rising ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {b.sampleQuote && (
            <div className="quote-block">&ldquo;{b.sampleQuote}&rdquo;</div>
          )}

          <div className="detail-actions" onClick={e => e.stopPropagation()}>
            <a href={mapsUrl(b)} target="_blank" rel="noopener noreferrer" className="action-link primary">
              {t('results.navigate')}
            </a>
            <a href={reviewUrl(b)} target="_blank" rel="noopener noreferrer" className="action-link">
              {t('results.write.review')}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHead({ label, count }: { label: string; count: number }) {
  return (
    <div className="section-sep">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="section-label">{label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.06em' }}>{count}</span>
      </div>
    </div>
  )
}

function ShareButton({ area, category, t }: { area: string; category: string; t: (k: string) => string }) {
  const [copied, setCopied] = useState(false)
  const share = useCallback(async () => {
    const url = `${window.location.origin}/results?area=${encodeURIComponent(area)}&category=${encodeURIComponent(category)}`
    const text = `${category} trends in ${area} — see what's rising & falling right now`
    if (navigator.share) {
      try { await navigator.share({ title: 'TrendLens', text, url }); return } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [area, category])
  return (
    <button onClick={share} className="share-btn">
      {copied ? '✓ Copied' : `↑ ${t('share.btn')}`}
    </button>
  )
}

function Inner() {
  const params = useSearchParams()
  const area = params.get('area') ?? ''
  const category = params.get('category') ?? ''
  const { t, lang, setLang } = useTranslation()
  const [data, setData] = useState<(SearchResult & { isDemo?: boolean; dataSource?: string }) | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    if (!area || !category) { setError('Missing params'); setLoading(false); return }
    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area, category }),
    })
      .then(r => r.json())
      .then((d: SearchResult & { isDemo?: boolean; dataSource?: string; error?: string }) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [area, category])

  if (loading) return (
    <div className="overlay">
      <div className="spinner" />
      <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text2)', letterSpacing: '0.04em' }}>
        {t('loading.step2')}
      </div>
    </div>
  )

  const rising  = data?.businesses.filter(b => b.status === 'rising') ?? []
  const falling = data?.businesses.filter(b => b.status === 'falling') ?? []
  const newB    = data?.businesses.filter(b => b.status === 'new') ?? []
  const stable  = data?.businesses.filter(b => b.status === 'stable') ?? []
  const age     = data?.cached_at ? Math.round((Date.now() - new Date(data.cached_at).getTime()) / 3600000) : 0

  return (
    <div className="results-page" onClick={() => setLangOpen(false)}>
      {/* Sticky header */}
      <div className="results-header">
        <Link href="/" className="back-btn">← {t('back').replace('← ', '')}</Link>
        <div className="results-title">
          {category} in {area}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Lang */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLangOpen(o => !o)} style={{
              background: 'none', border: 'none', color: 'var(--text3)',
              fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer',
              letterSpacing: '0.06em', padding: '2px 4px',
            }}>
              {LANG_OPTIONS.find(l => l.code === lang)?.label ?? 'EN'}
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '28px', background: 'var(--bg2)',
                border: '1px solid var(--border)', minWidth: '130px', zIndex: 600,
              }}>
                {LANG_OPTIONS.map(opt => (
                  <button key={opt.code} onClick={() => { setLang(opt.code); setLangOpen(false) }} style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '9px 14px', fontFamily: 'var(--mono)', fontSize: '11px',
                    cursor: 'pointer', border: 'none', letterSpacing: '0.04em',
                    background: opt.code === lang ? 'var(--bg3)' : 'var(--bg2)',
                    color: opt.code === lang ? 'var(--text)' : 'var(--text2)',
                    borderBottom: '1px solid var(--border)',
                  }}>{opt.label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Map link */}
          {data?.businesses.some(b => b.lat && b.lng) && (
            <Link
              href={`/map?area=${encodeURIComponent(area)}&category=${encodeURIComponent(category)}`}
              style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)', textDecoration: 'none', letterSpacing: '0.04em' }}>
              Map
            </Link>
          )}
        </div>
      </div>

      {/* Demo notice */}
      {data?.isDemo && (
        <div className="demo-banner">
          Sample data · Live real-time scraping available for major cities
        </div>
      )}

      {error && <div className="no-results">{error}</div>}

      {/* Results in iPod list style */}
      {rising.length > 0 && (
        <>
          <SectionHead label={t('results.rising')} count={rising.length} />
          {rising.map((b, i) => <BizRow key={b.name} b={b} rank={i + 1} t={t} />)}
        </>
      )}

      {falling.length > 0 && (
        <>
          <SectionHead label={t('results.falling')} count={falling.length} />
          {falling.map((b, i) => <BizRow key={b.name} b={b} rank={i + 1} t={t} />)}
        </>
      )}

      {newB.length > 0 && (
        <>
          <SectionHead label={t('results.new')} count={newB.length} />
          {newB.slice(0, 6).map((b, i) => <BizRow key={b.name} b={b} rank={i + 1} t={t} />)}
        </>
      )}

      {stable.length > 0 && (
        <>
          <SectionHead label={t('results.stable')} count={stable.length} />
          {stable.slice(0, 3).map((b, i) => <BizRow key={b.name} b={b} rank={i + 1} t={t} />)}
        </>
      )}

      {!loading && !error && !data?.businesses.length && (
        <div className="no-results">{t('results.no.results')}</div>
      )}

      {data && (
        <div className="cache-note">
          <ShareButton area={area} category={category} t={t} />
          <span>
            {data.total_scraped} {t('results.analyzed')} ·{' '}
            {age < 1 ? t('results.just.now') : `${age}${t('results.hours.ago')}`}
          </span>
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="overlay"><div className="spinner" /></div>}>
      <Inner />
    </Suspense>
  )
}
