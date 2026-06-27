import type { RawReview, TrendBusiness } from './types'

const THEMES = [
  { name: 'service & staff',    keywords: ['service', 'staff', 'friendly', 'helpful', 'rude', 'attitude', 'waiter', 'barista', 'server', 'host'] },
  { name: 'food & drink quality', keywords: ['food', 'taste', 'delicious', 'fresh', 'quality', 'cold', 'menu', 'coffee', 'ramen', 'flavour', 'flavor', 'dish'] },
  { name: 'waiting time',       keywords: ['wait', 'slow', 'fast', 'queue', 'line', 'minutes', 'quick', 'long wait', 'rushed'] },
  { name: 'value for money',    keywords: ['price', 'expensive', 'cheap', 'worth', 'value', 'overpriced', 'affordable', 'pricey'] },
  { name: 'atmosphere',         keywords: ['atmosphere', 'vibe', 'cozy', 'noisy', 'loud', 'ambiance', 'clean', 'dirty', 'interior', 'music'] },
  { name: 'new menu / items',   keywords: ['new menu', 'new item', 'new dish', 'seasonal', 'special', 'limited'] },
]

function themeSentimentDelta(recent: RawReview[], older: RawReview[], theme: typeof THEMES[0]): number {
  const score = (reviews: RawReview[]) => {
    let pos = 0, neg = 0
    for (const r of reviews) {
      const text = (r.reviewText ?? '').toLowerCase()
      if (!theme.keywords.some((k) => text.includes(k))) continue
      const rating = r.stars ?? r.rating ?? 3
      if (rating >= 4) pos++
      else if (rating <= 2) neg++
    }
    return pos - neg
  }
  return score(recent) - score(older)
}

function extractWhy(
  recent: RawReview[],
  older: RawReview[],
  status: TrendBusiness['status'],
  recentAvg: number,
  olderAvg: number,
): string[] {
  if (status === 'stable' || status === 'new') return []
  const reasons: string[] = []

  // Rating delta
  if (recentAvg > 0 && olderAvg > 0) {
    if (status === 'rising')
      reasons.push(`Rating improved from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)} ★`)
    else
      reasons.push(`Rating dropped from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)} ★`)
  }

  // Theme signals
  for (const theme of THEMES) {
    const delta = themeSentimentDelta(recent, older, theme)
    if (status === 'rising' && delta >= 2)
      reasons.push(`More positive mentions of ${theme.name}`)
    else if (status === 'falling' && delta <= -2)
      reasons.push(`Complaints about ${theme.name} are increasing`)
    if (reasons.length >= 3) break
  }

  // Review velocity
  if (status === 'rising' && older.length > 0 && recent.length >= older.length * 1.5)
    reasons.push(`Review activity increased significantly this month`)
  else if (status === 'falling') {
    const lowRecent = recent.filter((r) => (r.stars ?? r.rating ?? 5) <= 2).length
    if (lowRecent >= 3) reasons.push(`${lowRecent} low-rated reviews appeared recently`)
  }

  return reasons.slice(0, 3)
}

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.now()

function daysAgo(dateStr: string | null | undefined): number {
  if (!dateStr) return 999
  const d = new Date(dateStr).getTime()
  return isNaN(d) ? 999 : (NOW - d) / DAY
}

export function groupAndScore(raw: RawReview[]): TrendBusiness[] {
  // Group reviews by business name
  const map = new Map<string, { reviews: RawReview[]; meta: RawReview }>()

  for (const r of raw) {
    const name =
      (r.title as string | undefined) ??
      (r.placeName as string | undefined) ??
      (r.placeTitle as string | undefined) ??
      'Unknown'
    if (name === 'Unknown') continue

    if (!map.has(name)) map.set(name, { reviews: [], meta: r })
    map.get(name)!.reviews.push(r)
  }

  const results: TrendBusiness[] = []

  for (const [name, { reviews, meta }] of map) {
    const textReviews = reviews.filter(
      (r) => typeof r.reviewText === 'string' && r.reviewText.trim().length > 5
    )
    if (textReviews.length < 1) continue

    const recent = textReviews.filter((r) => daysAgo(r.publishedAtDate ?? r.publishedAt) <= 30)
    const older  = textReviews.filter((r) => {
      const d = daysAgo(r.publishedAtDate ?? r.publishedAt)
      return d > 30 && d <= 90
    })

    const avg = (arr: RawReview[]) =>
      arr.length === 0
        ? 0
        : arr.reduce((s, r) => s + (r.stars ?? r.rating ?? 0), 0) / arr.length

    const recentAvg = avg(recent)
    const olderAvg  = avg(older)
    const trendDelta = older.length >= 2 ? recentAvg - olderAvg : 0

    let status: TrendBusiness['status'] = 'stable'
    if (older.length < 2) status = 'new'
    else if (trendDelta >= 0.25) status = 'rising'
    else if (trendDelta <= -0.25) status = 'falling'

    // Pick a recent positive quote for rising, negative for falling
    const quotePool = status === 'falling'
      ? recent.filter((r) => (r.stars ?? r.rating ?? 5) <= 2)
      : recent.filter((r) => (r.stars ?? r.rating ?? 0) >= 4)
    const quoteSrc = (quotePool[0] ?? recent[0])?.reviewText ?? ''
    const sampleQuote = quoteSrc.slice(0, 100) + (quoteSrc.length > 100 ? '…' : '')

    const anyMeta = meta as Record<string, unknown>
    // Extract coordinates (Apify returns them in various fields)
    const locObj = anyMeta.location as { lat?: number; lng?: number } | undefined
    const lat = locObj?.lat ?? (anyMeta.latitude as number | undefined) ?? (anyMeta.lat as number | undefined)
    const lng = locObj?.lng ?? (anyMeta.longitude as number | undefined) ?? (anyMeta.lng as number | undefined)

    const why = extractWhy(recent, older, status, recentAvg, olderAvg)

    results.push({
      name,
      address: (anyMeta.address as string | undefined) ?? (anyMeta.street as string | undefined) ?? '',
      mapsUrl: (anyMeta.url as string | undefined) ?? `https://www.google.com/maps/search/${encodeURIComponent(name)}`,
      rating: typeof anyMeta.totalScore === 'number' ? anyMeta.totalScore : avg(textReviews),
      totalReviews: typeof anyMeta.reviewsCount === 'number' ? anyMeta.reviewsCount : textReviews.length,
      recentAvg: Math.round(recentAvg * 10) / 10,
      olderAvg:  Math.round(olderAvg * 10) / 10,
      trendDelta: Math.round(trendDelta * 100) / 100,
      recentCount: recent.length,
      olderCount:  older.length,
      status,
      sampleQuote,
      why,
      lat,
      lng,
    })
  }

  // Sort: rising first by delta desc, then falling by delta asc
  return results.sort((a, b) => {
    if (a.status === 'rising' && b.status !== 'rising') return -1
    if (b.status === 'rising' && a.status !== 'rising') return 1
    if (a.status === 'falling' && b.status !== 'falling') return 1
    if (b.status === 'falling' && a.status !== 'falling') return -1
    return b.trendDelta - a.trendDelta
  })
}
