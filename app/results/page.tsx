'use client'
import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { SearchResult, TrendBusiness, CategoryScores } from '@/lib/types'
import { useTranslation, LANG_OPTIONS } from '@/lib/i18n'

function mapsUrl(b: TrendBusiness) {
  return b.mapsUrl?.startsWith('http')
    ? b.mapsUrl
    : `https://www.google.com/maps/search/${encodeURIComponent(b.name + ' ' + b.address)}`
}
function reviewUrl(b: TrendBusiness) {
  return `https://search.google.com/local/writereview?query=${encodeURIComponent(b.name + ' ' + b.address)}`
}

function useSaved() {
  const [saved, setSaved] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem('tl-saved')
      return new Set(raw ? JSON.parse(raw) as string[] : [])
    } catch { return new Set() }
  })

  const toggle = useCallback((name: string, biz: TrendBusiness) => {
    setSaved(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
        try {
          const all = JSON.parse(localStorage.getItem('tl-saved-data') ?? '{}') as Record<string, unknown>
          delete all[name]
          localStorage.setItem('tl-saved-data', JSON.stringify(all))
        } catch { /* ignore */ }
      } else {
        next.add(name)
        try {
          const all = JSON.parse(localStorage.getItem('tl-saved-data') ?? '{}') as Record<string, TrendBusiness>
          all[name] = biz
          localStorage.setItem('tl-saved-data', JSON.stringify(all))
        } catch { /* ignore */ }
      }
      localStorage.setItem('tl-saved', JSON.stringify([...next]))
      return next
    })
  }, [])

  return { saved, toggle }
}

function ScoreBadge({ score, status }: { score: number; status: TrendBusiness['status'] }) {
  return (
    <div className={`score-badge ${status}`} title="TrendLens Score">{score}</div>
  )
}

function CategoryBars({ cats }: { cats: CategoryScores }) {
  const entries: [string, number][] = [
    ['Food', cats.food], ['Service', cats.service],
    ['Atmos.', cats.atmosphere], ['Price', cats.price], ['Clean.', cats.cleanliness],
  ]
  return (
    <div style={{ marginBottom: '12px' }}>
      {entries.map(([name, val]) => val > 0 && (
        <div key={name} className="cat-row">
          <span className="cat-name">{name}</span>
          <div className="cat-bar-bg"><div className="cat-bar-fill" style={{ width: `${(val / 5) * 100}%` }} /></div>
          <span className="cat-val">{val.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

function BizRow({ b, t, saved, onToggleSave, area }: {
  b: TrendBusiness
  t: (k: string) => string
  saved: boolean
  onToggleSave: () => void
  area: string
}) {
  const [open, setOpen] = useState(false)
  const rising = b.status === 'rising'
  const falling = b.status === 'falling'

  return (
    <div className="biz-row">
      <div className="biz-row-top" onClick={() => setOpen(o => !o)}>
        <div className="biz-row-left">
          <div className="biz-name">{b.name}</div>
          <div className="biz-meta">
            {b.address ? `${b.address} · ` : ''}★ {b.rating.toFixed(1)}
            {b.totalReviews > 0 ? ` (${b.totalReviews.toLocaleString()})` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span className={`status-pill ${b.status}`}>
            {rising ? `↑ ${b.displayPrimary.replace('↑ ', '')}` :
             falling ? `↓ ${b.displayPrimary.replace('↓ ', '')}` :
             b.status === 'new' ? 'New' : 'Stable'}
          </span>
          <ScoreBadge score={b.trendScore} status={b.status} />
          <span style={{ color: 'var(--text3)', fontSize: '12px', marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="biz-detail">
          {/* AI Summary */}
          {b.summary && (
            <div className="ai-summary">
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: '6px' }}>
                AI Summary {b.whySource === 'claude' ? '· claude' : '· algo'}
              </div>
              {b.summary}
            </div>
          )}

          {/* Why */}
          {b.why.length > 0 && (rising || falling) && (
            <div style={{ marginBottom: '12px' }}>
              <div className={`why-label ${b.status}`}>
                {rising ? t('results.why.rising') : t('results.why.falling')}
              </div>
              {b.why.map((r, i) => (
                <div key={i} className="why-item">
                  <span style={{ color: rising ? 'var(--teal)' : 'var(--red)', flexShrink: 0 }}>•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Category bars */}
          {b.categories && <CategoryBars cats={b.categories} />}

          {/* Stats */}
          <div className="detail-stats">
            <span className="stat-tag">{b.recentCount} reviews / 30d</span>
            {b.olderCount > 0 && b.status !== 'new' && (
              <span className="stat-tag">{b.olderAvg.toFixed(1)} → {b.recentAvg.toFixed(1)} ★ {t('score.explain')}</span>
            )}
            {b.positivePct !== undefined && (
              <span className="stat-tag">{b.positivePct}% positive</span>
            )}
          </div>

          {/* Quote */}
          {b.sampleQuote && <div className="quote-block">&ldquo;{b.sampleQuote}&rdquo;</div>}

          {/* Actions */}
          <div className="detail-actions" onClick={e => e.stopPropagation()}>
            <a href={mapsUrl(b)} target="_blank" rel="noopener noreferrer" className="action-link primary">
              {t('results.navigate')}
            </a>
            <a href={reviewUrl(b)} target="_blank" rel="noopener noreferrer" className="action-link">
              {t('results.write.review')}
            </a>
            <button className={`action-link save-btn${saved ? ' saved' : ''}`} onClick={onToggleSave}>
              {saved ? '★ Saved' : '☆ Save'}
            </button>
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

function ShareBtn({ area, category, t }: { area: string; category: string; t: (k: string) => string }) {
  const [copied, setCopied] = useState(false)
  const share = useCallback(async () => {
    const url = `${window.location.origin}/results?area=${encodeURIComponent(area)}&category=${encodeURIComponent(category)}`
    if (navigator.share) {
      try { await navigator.share({ title: 'TrendLens', text: `${category} trends in ${area}`, url }); return } catch { /* */ }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }, [area, category])
  return <button onClick={share} className="share-btn">{copied ? '✓ Copied' : t('share.btn')}</button>
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
  const { saved, toggle } = useSaved()

  useEffect(() => {
    if (!area || !category) { setError('Missing params'); setLoading(false); return }
    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area, category, language: lang }),
    })
      .then(r => r.json())
      .then((d: SearchResult & { isDemo?: boolean; dataSource?: string; error?: string }) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="results-header">
        <Link href="/" className="back-btn">←</Link>
        <div className="results-title">
          {category} in {area}
          <span className="results-month"> · {new Date().toLocaleString('en', { month: 'long' })}</span>
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setLangOpen(o => !o)} style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer', letterSpacing: '0.06em', padding: '2px 4px',
          }}>
            {LANG_OPTIONS.find(l => l.code === lang)?.label ?? 'EN'}
          </button>
          {langOpen && (
            <div style={{ position: 'absolute', right: 0, top: '28px', background: 'var(--bg2)', border: '1px solid var(--border)', minWidth: '130px', zIndex: 600 }}>
              {LANG_OPTIONS.map(opt => (
                <button key={opt.code} onClick={() => { setLang(opt.code); setLangOpen(false) }} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
                  fontFamily: 'var(--mono)', fontSize: '11px', cursor: 'pointer', border: 'none',
                  background: opt.code === lang ? 'var(--bg3)' : 'var(--bg2)',
                  color: opt.code === lang ? 'var(--teal)' : 'var(--text2)',
                  borderBottom: '1px solid var(--border)',
                }}>{opt.label}</button>
              ))}
            </div>
          )}
        </div>

        {data?.businesses.some(b => b.lat && b.lng) && (
          <Link href={`/map?area=${encodeURIComponent(area)}&category=${encodeURIComponent(category)}`}
            style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)', textDecoration: 'none', letterSpacing: '0.04em', flexShrink: 0 }}>
            Map
          </Link>
        )}
      </div>

      {data?.isDemo && <div className="demo-banner">Sample data · Live real-time scraping available for major cities</div>}
      {error && <div className="no-results">{error}</div>}

      {rising.length > 0 && (<><SectionHead label={t('results.rising')} count={rising.length} />{rising.map(b => <BizRow key={b.name} b={b} t={t} saved={saved.has(b.name)} onToggleSave={() => toggle(b.name, b)} area={area} />)}</>)}
      {falling.length > 0 && (<><SectionHead label={t('results.falling')} count={falling.length} />{falling.map(b => <BizRow key={b.name} b={b} t={t} saved={saved.has(b.name)} onToggleSave={() => toggle(b.name, b)} area={area} />)}</>)}
      {newB.length > 0 && (<><SectionHead label={t('results.new')} count={newB.length} />{newB.slice(0, 6).map(b => <BizRow key={b.name} b={b} t={t} saved={saved.has(b.name)} onToggleSave={() => toggle(b.name, b)} area={area} />)}</>)}
      {stable.length > 0 && (<><SectionHead label={t('results.stable')} count={stable.length} />{stable.slice(0, 3).map(b => <BizRow key={b.name} b={b} t={t} saved={saved.has(b.name)} onToggleSave={() => toggle(b.name, b)} area={area} />)}</>)}

      {!loading && !error && !data?.businesses.length && <div className="no-results">{t('results.no.results')}</div>}

      {data && (
        <div className="cache-note">
          <div className="share-row">
            <ShareBtn area={area} category={category} t={t} />
          </div>
          <span>{data.total_scraped} {t('results.analyzed')} · {age < 1 ? t('results.just.now') : `${age}${t('results.hours.ago')}`}</span>
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  return <Suspense fallback={<div className="overlay"><div className="spinner" /></div>}><Inner /></Suspense>
}
