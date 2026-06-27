import type { RawReview } from './types'

const ACTOR = 'solidcode~google-maps-reviews-scraper'

export async function searchTrending(area: string, category: string): Promise<RawReview[]> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN not set')

  const apiUrl = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${token}&timeout=70&memory=1024`

  // Strategy 1: Google Maps search URL (most reliable for multi-place)
  const mapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${category} ${area}`)}`

  async function callApify(body: Record<string, unknown>): Promise<RawReview[]> {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Apify error ${res.status}: ${text.slice(0, 200)}`)
    }
    return res.json() as Promise<RawReview[]>
  }

  // Try URL-based search first (returns multiple places from search results)
  let raw = await callApify({
    startUrls: [{ url: mapsSearchUrl }],
    maxReviewsPerPlace: 30,
    maxPlaces: 12,
    sortBy: 'newest',
  })

  // Fallback: text query search
  if (!raw.length) {
    raw = await callApify({
      searchQueries: [`${category} ${area}`],
      maxReviewsPerPlace: 30,
      maxPlaces: 12,
      sortBy: 'newest',
    })
  }

  return raw
}
