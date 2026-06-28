import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export function GET(req: NextRequest) {
  const area     = req.nextUrl.searchParams.get('area')     ?? 'your city'
  const category = req.nextUrl.searchParams.get('category') ?? 'places'
  const month    = new Date().toLocaleString('en', { month: 'long', year: 'numeric' })

  return new ImageResponse(
    (
      <div
        style={{
          background: '#F5F4F0',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: '#34B87A' }} />
          <span style={{ fontSize: 15, color: '#ABABAA', letterSpacing: '0.22em' }}>
            TRENDLENS
          </span>
        </div>

        {/* Category + location */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: Math.max(56, Math.min(88, Math.floor(1600 / Math.max(category.length, 1)))),
              fontWeight: 700,
              color: '#1A1A18',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              marginBottom: 14,
            }}
          >
            {category}
          </div>
          <div style={{ fontSize: 34, color: '#6B6B68' }}>
            in {area} · {month}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              background: '#E8F7EE',
              color: '#2A7A50',
              padding: '10px 24px',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            🔥 Find what&apos;s trending before everyone else
          </div>
          <span style={{ color: '#ABABAA', fontSize: 18 }}>trendlens-nu.vercel.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
