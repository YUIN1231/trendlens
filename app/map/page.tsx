'use client'
import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { SearchResult, TrendBusiness } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface BizWithCoords extends TrendBusiness { lat: number; lng: number }

const STATUS_COLOR: Record<string, string> = {
  rising: '#2E6B44',
  falling: '#B83232',
  new: '#8B7355',
  stable: '#ABABAA',
}

function MapInner() {
  const params = useSearchParams()
  const area = params.get('area') ?? ''
  const category = params.get('category') ?? ''
  const { t } = useTranslation()

  const [businesses, setBusinesses] = useState<BizWithCoords[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<BizWithCoords | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null)

  useEffect(() => {
    if (!area || !category) { setLoading(false); return }
    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area, category }),
    })
      .then(r => r.json())
      .then(async (data: SearchResult & { error?: string }) => {
        if (data.error || !data.businesses) return
        const withCoords = await Promise.all(
          data.businesses.map(async (b) => {
            if (b.lat && b.lng) return b as BizWithCoords
            try {
              const q = `${b.name} ${b.address || area}`
              const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
              const { lat, lng } = await r.json() as { lat: number | null; lng: number | null }
              if (lat && lng) return { ...b, lat, lng } as BizWithCoords
            } catch { /* skip */ }
            return null
          })
        )
        setBusinesses(withCoords.filter(Boolean) as BizWithCoords[])
      })
      .finally(() => setLoading(false))
  }, [area, category])

  useEffect(() => {
    if (!mapRef.current || businesses.length === 0) return
    import('leaflet').then((L) => {
      if (leafletRef.current) { leafletRef.current.remove() }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      const map = L.map(mapRef.current!, { zoomControl: false }).setView(
        [businesses[0].lat, businesses[0].lng], 14
      )
      leafletRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // Add zoom control top-right
      L.control.zoom({ position: 'topright' }).addTo(map)

      businesses.forEach((b) => {
        const color = STATUS_COLOR[b.status] ?? '#ABABAA'
        const size = b.status === 'rising' ? 14 : b.status === 'falling' ? 12 : 10
        const marker = L.circleMarker([b.lat, b.lng], {
          radius: size, color: 'white', weight: 2,
          fillColor: color, fillOpacity: 1,
        }).addTo(map)
        marker.on('click', () => setSelected(b))
      })
    })
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses])

  const deltaLabel = (b: TrendBusiness) => {
    if (b.status === 'new') return 'NEW'
    if (b.trendDelta === 0) return '—'
    return b.trendDelta > 0 ? `↑ +${b.trendDelta.toFixed(2)}` : `↓ ${b.trendDelta.toFixed(2)}`
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      {/* Header */}
      <div className="map-header">
        <Link href={`/results?area=${encodeURIComponent(area)}&category=${encodeURIComponent(category)}`}
          className="back-btn">← List</Link>
        <div style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {category} in {area}
        </div>
      </div>

      {/* Map */}
      {loading ? (
        <div className="overlay"><div className="spinner" /></div>
      ) : businesses.length === 0 ? (
        <div className="no-results">{t('map.no.coords')}</div>
      ) : (
        <>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <div ref={mapRef} style={{ flex: 1, marginTop: '56px' }} />
        </>
      )}

      {/* Uber-style bottom sheet */}
      {businesses.length > 0 && !loading && (
        <div className="bottom-sheet">
          <div className="bottom-sheet-handle" />

          {/* Legend */}
          <div className="map-legend">
            {(['rising', 'falling', 'new'] as const).map(s => (
              <span key={s} style={{ display: 'flex', alignItems: 'center', color: 'var(--text2)' }}>
                <span className="legend-dot" style={{ background: STATUS_COLOR[s] }} />
                {s === 'rising' ? t('results.rising').replace('🔥 ', '') :
                 s === 'falling' ? t('results.falling').replace('💀 ', '') :
                 t('results.new').replace('✨ ', '')}
              </span>
            ))}
          </div>

          {/* Selected business detail */}
          {selected ? (
            <div style={{ padding: '16px 20px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div className="biz-name" style={{ fontSize: '17px' }}>{selected.name}</div>
                  {selected.address && <div className="biz-meta">{selected.address}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                  <span className={`delta-num ${selected.status}`} style={{ fontSize: '22px' }}>{deltaLabel(selected)}</span>
                  <button onClick={() => setSelected(null)} style={{
                    background: 'none', border: 'none', color: 'var(--text3)',
                    cursor: 'pointer', fontSize: '18px', padding: '0 0 2px',
                  }}>×</button>
                </div>
              </div>
              {selected.sampleQuote && (
                <div className="quote-block" style={{ marginBottom: '14px' }}>&ldquo;{selected.sampleQuote}&rdquo;</div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={selected.mapsUrl ?? '#'} target="_blank" rel="noopener noreferrer" className="action-link primary">
                  {t('results.navigate')}
                </a>
                <a href={`https://search.google.com/local/writereview?query=${encodeURIComponent(selected.name + ' ' + selected.address)}`}
                  target="_blank" rel="noopener noreferrer" className="action-link">
                  {t('results.write.review')}
                </a>
              </div>
            </div>
          ) : (
            /* Business list in bottom sheet */
            businesses.slice(0, 5).map(b => (
              <div key={b.name} className="bs-row" onClick={() => {
                setSelected(b)
                if (leafletRef.current) leafletRef.current.setView([b.lat, b.lng], 16)
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="biz-name" style={{ fontSize: '14px', marginBottom: '2px' }}>{b.name}</div>
                  <div className="biz-meta">{b.address ? `${b.address} · ` : ''}★ {b.rating.toFixed(1)}</div>
                </div>
                <span className={`delta-num ${b.status}`} style={{ fontSize: '16px', marginLeft: '12px' }}>
                  {deltaLabel(b)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="overlay"><div className="spinner" /></div>}>
      <MapInner />
    </Suspense>
  )
}
