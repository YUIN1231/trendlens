import type { RawReview } from './types'

interface OWNBusiness {
  name?: string
  full_address?: string
  rating?: number
  review_count?: number
  reviews?: number
  place_id?: string
  google_id?: string
  latitude?: number
  longitude?: number
}

interface OWNReview {
  review_text?: string
  rating?: number
  review_datetime_utc?: string
  author_name?: string
  like_count?: number
}

export async function searchWithOpenWebNinja(area: string, category: string): Promise<RawReview[]> {
  const apiKey = process.env.OPENWEBNINJA_API_KEY
  if (!apiKey) throw new Error('OPENWEBNINJA_API_KEY not set')

  const query = `${category} ${area}`.trim()
  const headers = { 'x-api-key': apiKey }

  // Step 1: Search for businesses
  const searchParams = new URLSearchParams({ query, limit: '12', language: 'en' })
  const searchRes = await fetch(
    `https://api.openwebninja.com/local-business-data/search?${searchParams}`,
    { headers }
  )
  if (!searchRes.ok) {
    const text = await searchRes.text()
    throw new Error(`OpenWeb Ninja search error ${searchRes.status}: ${text.slice(0, 200)}`)
  }

  const searchBody = await searchRes.json() as { status?: string; data?: OWNBusiness[] }
  const businesses: OWNBusiness[] = searchBody.data ?? []
  if (!businesses.length) return []

  // Step 2: Fetch reviews for each business (parallel, limit 6 at a time)
  const reviews: RawReview[] = []
  const batch = businesses.slice(0, 10)

  await Promise.all(batch.map(async (biz) => {
    const placeId = biz.place_id
    if (!placeId) return

    try {
      const revParams = new URLSearchParams({
        business_id: placeId,
        limit: '30',
        sort_by: 'newest',
        language: 'en',
      })
      const revRes = await fetch(
        `https://api.openwebninja.com/local-business-data/business-reviews?${revParams}`,
        { headers }
      )
      if (!revRes.ok) return

      const revBody = await revRes.json() as { data?: OWNReview[] }
      const revData = revBody.data ?? []

      for (const r of revData) {
        if (!r.review_text?.trim()) continue
        reviews.push({
          reviewText: r.review_text,
          stars: r.rating ?? 0,
          publishedAtDate: r.review_datetime_utc,
          title: biz.name ?? 'Unknown',
          address: biz.full_address ?? '',
          totalScore: biz.rating ?? 0,
          reviewsCount: biz.review_count ?? biz.reviews ?? 0,
          lat: biz.latitude,
          lng: biz.longitude,
        })
      }
    } catch { /* skip individual business if it fails */ }
  }))

  return reviews
}
