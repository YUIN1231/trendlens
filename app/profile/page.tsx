'use client'
import Link from 'next/link'

export default function ProfilePage() {
  return (
    <div className="page-wrap" style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '72px 24px 24px', maxWidth: '460px', margin: '0 auto' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: '40px' }}>
          Profile
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '12px' }}>About TrendLens</div>
          <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.65 }}>
            TrendLens scans Google Maps reviews to surface places getting hot — or losing momentum — before everyone notices.
          </p>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '12px' }}>How scoring works</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8 }}>
            <div>• <strong>TrendLens Score</strong> (0–100) = base rating + trend momentum</div>
            <div>• <strong>Velocity</strong>: how fast reviews are increasing</div>
            <div>• <strong>Rising</strong>: composite score +0.28 or higher</div>
            <div>• <strong>Falling</strong>: composite score −0.28 or lower</div>
            <div>• <strong>AI Analysis</strong>: Claude Haiku for top businesses</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '12px' }}>Data source</div>
          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.65 }}>
            Reviews via OpenWebNinja (Google Maps). Results cached for 24 hours.
          </p>
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <Link href="/" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--teal)', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            ← Back to Discover
          </Link>
        </div>
      </div>
    </div>
  )
}
