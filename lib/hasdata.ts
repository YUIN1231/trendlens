import type { RawReview } from './types'

interface HasDataBusiness {
  title?: string
  placeId?: string
  dataId?: string
  address?: string
  rating?: number
  reviews?: number
  thumbnail?: string
  gpsCoordinates?: { latitude: number; longitude: number }
}

interface HasDataReview {
  rating?: number
  isoDate?: string
  date?: string
  snippet?: string
  text?: string
}

interface HasDataReviewsResponse {
  placeInfo?: {
    title?: string
    address?: string
    rating?: number
    reviews?: number
    gpsCoordinates?: { latitude: number; longitude: number }
  }
  reviews?: HasDataReview[]
  nextPageToken?: string
}

async function geocodeArea(area: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(area)}&format=json&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'TrendLens/1.0 (trendlens-nu.vercel.app)' } })
    const data = await res.json() as Array<{ lat: string; lon: string }>
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { return null }
}

export async function searchWithHasData(area: string, category: string): Promise<RawReview[]> {
  const apiKey = process.env.HASDATA_API_KEY
  if (!apiKey) throw new Error('HASDATA_API_KEY not set')

  const headers = { 'x-api-key': apiKey }

  // Step 1: Geocode area to coordinates
  const coords = await geocodeArea(area)
  const llParam = coords ? `&ll=@${coords.lat},${coords.lng},13z` : ''
  const query = coords ? category : `${category} ${area}`

  // Step 2: Search businesses
  const searchUrl = `https://api.hasdata.com/scrape/google-maps/search?q=${encodeURIComponent(query)}&hl=en${llParam}`
  const searchRes = await fetch(searchUrl, { headers })

  if (searchRes.status === 429) throw new Error('HasData rate limit')
  if (!searchRes.ok) {
    const t = await searchRes.text()
    throw new Error(`HasData search error ${searchRes.status}: ${t.slice(0, 200)}`)
  }

  const searchBody = await searchRes.json() as { localResults?: HasDataBusiness[] }
  const businesses = (searchBody.localResults ?? []).slice(0, 15)
  if (!businesses.length) return []

  // Step 3: Fetch reviews in small batches (avoid rate limits)
  const reviews: RawReview[] = []

  for (let i = 0; i < businesses.length; i += 3) {
    const batch = businesses.slice(i, i + 3)
    await Promise.all(batch.map(async (biz) => {
    const placeId = biz.placeId
    if (!placeId) return

    try {
      const revUrl = `https://api.hasdata.com/scrape/google-maps/reviews?placeId=${placeId}&hl=en&sortBy=newestFirst`
      const revRes = await fetch(revUrl, { headers })
      if (!revRes.ok) return

      const revBody = await revRes.json() as HasDataReviewsResponse
      const info = revBody.placeInfo ?? {}

      const pushReviews = (list: HasDataReview[]) => {
        for (const r of list) {
          const text = r.snippet ?? r.text ?? ''
          if (!text.trim()) continue
          reviews.push({
            reviewText: text,
            stars: r.rating ?? 0,
            publishedAtDate: r.isoDate ?? undefined,
            title: info.title ?? biz.title ?? 'Unknown',
            address: info.address ?? biz.address ?? '',
            totalScore: info.rating ?? biz.rating ?? 0,
            reviewsCount: info.reviews ?? biz.reviews ?? 0,
            lat: info.gpsCoordinates?.latitude ?? biz.gpsCoordinates?.latitude,
            lng: info.gpsCoordinates?.longitude ?? biz.gpsCoordinates?.longitude,
          })
        }
      }

      pushReviews(revBody.reviews ?? [])

      // Fetch page 2 for historical reviews (better trend detection)
      if (revBody.nextPageToken) {
        try {
          const rev2Res = await fetch(
            `https://api.hasdata.com/scrape/google-maps/reviews?placeId=${placeId}&hl=en&sortBy=newestFirst&nextPageToken=${encodeURIComponent(revBody.nextPageToken)}`,
            { headers }
          )
          if (rev2Res.ok) {
            const rev2Body = await rev2Res.json() as HasDataReviewsResponse
            pushReviews(rev2Body.reviews ?? [])
          }
        } catch { /* ignore page 2 failure */ }
      }
    } catch { /* skip individual business */ }
    }))
  }

  return reviews
}
