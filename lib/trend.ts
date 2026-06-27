import type { RawReview, TrendBusiness } from './types'

// ── Themes for algorithmic Why fallback ──────────────────────
const THEMES = [
  { name: 'service & staff',      keywords: ['service', 'staff', 'friendly', 'rude', 'waiter', 'barista', 'server', 'attitude', 'helpful'] },
  { name: 'food & drink quality', keywords: ['food', 'taste', 'delicious', 'fresh', 'quality', 'cold', 'coffee', 'ramen', 'flavour', 'flavor', 'dish', 'menu'] },
  { name: 'waiting time',         keywords: ['wait', 'slow', 'queue', 'line', 'minutes', 'quick', 'rush', 'busy'] },
  { name: 'value for money',      keywords: ['price', 'expensive', 'cheap', 'worth', 'value', 'overpriced', 'affordable'] },
  { name: 'atmosphere',           keywords: ['atmosphere', 'vibe', 'cozy', 'noisy', 'loud', 'ambiance', 'clean', 'dirty', 'interior'] },
  { name: 'new items',            keywords: ['new menu', 'new item', 'seasonal', 'special', 'new dish', 'limited'] },
]

function themeDelta(recent: RawReview[], older: RawReview[], theme: typeof THEMES[0]): number {
  const score = (reviews: RawReview[]) => {
    let pos = 0, neg = 0
    for (const r of reviews) {
      const text = (r.reviewText ?? '').toLowerCase()
      if (!theme.keywords.some(k => text.includes(k))) continue
      const rating = r.stars ?? r.rating ?? 3
      if (rating >= 4) pos++
      else if (rating <= 2) neg++
    }
    return pos - neg
  }
  return score(recent) - score(older)
}

function algoWhy(
  recent: RawReview[], older: RawReview[],
  status: TrendBusiness['status'],
  recentAvg: number, olderAvg: number,
  velocity: number,
): string[] {
  if (status === 'stable' || status === 'new') return []
  const reasons: string[] = []

  // Velocity reason (most human-readable)
  if (status === 'rising' && velocity >= 2) {
    reasons.push(`Review activity increased ${Math.round((velocity + 1) * 10) / 10}× compared to last period`)
  } else if (status === 'falling' && older.length > 0 && recent.length < older.length * 0.5) {
    reasons.push(`Fewer people leaving reviews this month`)
  }

  // Rating reason
  if (recentAvg > 0 && olderAvg > 0) {
    if (status === 'rising') reasons.push(`Rating improved from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)} ★`)
    else reasons.push(`Rating dropped from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)} ★`)
  }

  // Theme reasons
  for (const theme of THEMES) {
    const d = themeDelta(recent, older, theme)
    if (status === 'rising' && d >= 2) reasons.push(`More positive mentions of ${theme.name}`)
    else if (status === 'falling' && d <= -2) reasons.push(`Complaints about ${theme.name} increasing`)
    if (reasons.length >= 3) break
  }

  // Low-star spike
  if (status === 'falling') {
    const lowRecent = recent.filter(r => (r.stars ?? r.rating ?? 5) <= 2).length
    if (lowRecent >= 3) reasons.push(`${lowRecent} one/two-star reviews appeared recently`)
  }

  return reasons.slice(0, 3)
}

// ── Velocity display text ─────────────────────────────────────
function velocityDisplay(velocity: number, rating_delta: number, status: TrendBusiness['status']): string {
  if (status === 'new') return 'NEW'
  if (status === 'stable') return '→'

  if (status === 'rising') {
    if (velocity >= 3) return `↑ ${Math.round((velocity + 1) * 10) / 10}×`
    if (velocity >= 0.5) return `↑ ${Math.round((velocity + 1) * 10) / 10}× reviews`
    return `↑ +${rating_delta.toFixed(1)}★`
  }

  if (status === 'falling') {
    if (rating_delta <= -0.3) return `↓ ${rating_delta.toFixed(1)}★`
    if (velocity <= -0.4) return `↓ quiet`
    return `↓ ${rating_delta.toFixed(2)}`
  }

  return '→'
}

// ── Main ─────────────────────────────────────────────────────
const DAY = 24 * 60 * 60 * 1000
const NOW = Date.now()

function daysAgo(dateStr: string | null | undefined): number {
  if (!dateStr) return 999
  const d = new Date(dateStr).getTime()
  return isNaN(d) ? 999 : (NOW - d) / DAY
}

export function groupAndScore(raw: RawReview[]): TrendBusiness[] {
  const map = new Map<string, { reviews: RawReview[]; meta: RawReview }>()

  for (const r of raw) {
    const name = (r.title as string | undefined) ?? (r.placeName as string | undefined) ?? (r.placeTitle as string | undefined) ?? 'Unknown'
    if (name === 'Unknown') continue
    if (!map.has(name)) map.set(name, { reviews: [], meta: r })
    map.get(name)!.reviews.push(r)
  }

  const results: TrendBusiness[] = []

  for (const [name, { reviews, meta }] of map) {
    const textReviews = reviews.filter(
      r => typeof r.reviewText === 'string' && r.reviewText.trim().length > 5
    )
    if (textReviews.length < 1) continue

    // Time-based windows (ideal)
    let recent = textReviews.filter(r => daysAgo(r.publishedAtDate ?? r.publishedAt) <= 30)
    let older  = textReviews.filter(r => { const d = daysAgo(r.publishedAtDate ?? r.publishedAt); return d > 30 && d <= 90 })

    // Fallback: if older window is empty (limited API data), split by position
    if (older.length < 2 && textReviews.length >= 3) {
      const sorted = [...textReviews].sort((a, b) => {
        const da = new Date(a.publishedAtDate ?? a.publishedAt ?? 0).getTime()
        const db = new Date(b.publishedAtDate ?? b.publishedAt ?? 0).getTime()
        return db - da
      })
      const half = Math.ceil(sorted.length / 2)
      recent = sorted.slice(0, half)
      older  = sorted.slice(half)
    }

    const avg = (arr: RawReview[]) =>
      arr.length === 0 ? 0 : arr.reduce((s, r) => s + (r.stars ?? r.rating ?? 0), 0) / arr.length

    const recentAvg = avg(recent)
    const olderAvg  = avg(older)
    const ratingDelta = older.length >= 2 ? recentAvg - olderAvg : 0

    // Velocity: how much faster/slower are reviews coming?
    const velocity = older.length >= 1 ? (recent.length / older.length) - 1 : 0

    // Normalise both signals to [-1, 1] range
    const velNorm = Math.tanh(velocity / 2)                        // velocity ÷ 2 then tanh
    const ratingNorm = Math.max(-1, Math.min(1, ratingDelta / 2))  // clamp ±1

    const composite = 0.6 * velNorm + 0.4 * ratingNorm

    let status: TrendBusiness['status'] = 'stable'
    if (older.length < 3)        status = 'new'
    else if (composite >= 0.28)  status = 'rising'
    else if (composite <= -0.28) status = 'falling'

    // Sample quote: pick recent positive for rising, negative for falling
    const quotePool = status === 'falling'
      ? recent.filter(r => (r.stars ?? r.rating ?? 5) <= 2)
      : recent.filter(r => (r.stars ?? r.rating ?? 0) >= 4)
    const quoteSrc = (quotePool[0] ?? recent[0])?.reviewText ?? ''
    const sampleQuote = quoteSrc.slice(0, 120) + (quoteSrc.length > 120 ? '…' : '')

    const anyMeta = meta as Record<string, unknown>
    const locObj = anyMeta.location as { lat?: number; lng?: number } | undefined
    const lat = locObj?.lat ?? (anyMeta.latitude as number | undefined) ?? (anyMeta.lat as number | undefined)
    const lng = locObj?.lng ?? (anyMeta.longitude as number | undefined) ?? (anyMeta.lng as number | undefined)

    const why = algoWhy(recent, older, status, recentAvg, olderAvg, velocity)

    const baseRating = typeof anyMeta.totalScore === 'number' ? anyMeta.totalScore : avg(textReviews)
    const trendScore = Math.round(Math.min(100, Math.max(20, baseRating * 18.5 + composite * 12)))
    const positivePct = recent.length > 0
      ? Math.round(recent.filter(r => (r.stars ?? r.rating ?? 0) >= 4).length / recent.length * 100)
      : undefined

    results.push({
      name,
      address: (anyMeta.address as string | undefined) ?? (anyMeta.street as string | undefined) ?? '',
      mapsUrl: (anyMeta.url as string | undefined) ?? `https://www.google.com/maps/search/${encodeURIComponent(name)}`,
      rating: baseRating,
      totalReviews: typeof anyMeta.reviewsCount === 'number' ? anyMeta.reviewsCount : textReviews.length,
      recentAvg: Math.round(recentAvg * 10) / 10,
      olderAvg:  Math.round(olderAvg * 10) / 10,
      trendDelta: Math.round(ratingDelta * 100) / 100,
      recentCount: recent.length,
      olderCount:  older.length,
      velocity: Math.round(velocity * 100) / 100,
      composite: Math.round(composite * 100) / 100,
      trendScore,
      displayPrimary: velocityDisplay(velocity, ratingDelta, status),
      status,
      sampleQuote,
      why,
      whySource: 'algo',
      positivePct,
      lat,
      lng,
    })
  }

  // Sort: composite desc (most interesting first)
  return results.sort((a, b) => {
    if (a.status === 'rising'  && b.status !== 'rising')  return -1
    if (b.status === 'rising'  && a.status !== 'rising')  return 1
    if (a.status === 'falling' && b.status !== 'falling') return 1
    if (b.status === 'falling' && a.status !== 'falling') return -1
    return b.composite - a.composite
  })
}
