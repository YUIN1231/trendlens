'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { TrendBusiness } from '@/lib/types'

type Tab = 'saved' | 'visited'

function StatusPill({ status }: { status: TrendBusiness['status'] }) {
  const labels = { rising: '↑ Rising', falling: '↓ Falling', stable: 'Stable', new: 'New' }
  return <span className={`status-pill ${status}`}>{labels[status]}</span>
}

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>('saved')
  const [saved, setSaved] = useState<TrendBusiness[]>([])
  const [visited, setVisited] = useState<TrendBusiness[]>([])

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('tl-saved-data') ?? '{}') as Record<string, TrendBusiness>
      setSaved(Object.values(data))
    } catch { setSaved([]) }

    try {
      const data = JSON.parse(localStorage.getItem('tl-visited-data') ?? '{}') as Record<string, TrendBusiness>
      setVisited(Object.values(data))
    } catch { setVisited([]) }
  }, [])

  function removeSaved(name: string) {
    try {
      const all = JSON.parse(localStorage.getItem('tl-saved-data') ?? '{}') as Record<string, TrendBusiness>
      delete all[name]
      localStorage.setItem('tl-saved-data', JSON.stringify(all))
      const names = Object.keys(all)
      localStorage.setItem('tl-saved', JSON.stringify(names))
      setSaved(Object.values(all))
    } catch { /* ignore */ }
  }

  const items = tab === 'saved' ? saved : visited

  return (
    <div className="page-wrap" style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div className="lib-header">
        <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 0 }}>
          Library
        </div>
        <div style={{ display: 'flex', gap: 0, marginTop: '12px' }}>
          {(['saved', 'visited'] as Tab[]).map(t => (
            <button key={t} className={`lib-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
              {t === 'saved' ? `Saved${saved.length ? ` (${saved.length})` : ''}` : `Visited${visited.length ? ` (${visited.length})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="lib-empty">
          {tab === 'saved'
            ? 'No saved places yet.\nTap ☆ Save on any business to save it here.'
            : 'No visited places yet.\nMark places as visited from the results page.'}
          <div style={{ marginTop: '20px' }}>
            <Link href="/" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--teal)', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid var(--teal)', padding: '8px 16px' }}>
              Discover places →
            </Link>
          </div>
        </div>
      ) : (
        items.map(b => (
          <div key={b.name} style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="biz-name" style={{ fontSize: '15px' }}>{b.name}</div>
              <div className="biz-meta">{b.address || '—'} · ★ {b.rating.toFixed(1)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <StatusPill status={b.status} />
              <div className={`score-badge ${b.status}`}>{b.trendScore}</div>
              {tab === 'saved' && (
                <button onClick={() => removeSaved(b.name)} style={{
                  background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.04em', padding: '4px',
                }} title="Remove">×</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
