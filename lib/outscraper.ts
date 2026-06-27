import type { RawReview } from './types'

interface OutscraperReview {
  review_text?: string
  review_rating?: number
  review_datetime_utc?: string
  author_title?: string
  review_likes?: number
}

interface OutscraperPlace {
  name?: string
  full_address?: string
  address?: string
  rating?: number
  reviews?: number
  reviews_data?: OutscraperReview[]
  url?: string
  place_id?: string
}

// Convert "03/17/2021 17:08:18" → ISO string
function parseDate(d: string | undefined): string | null {
  if (!d) return null
  try {
    // MM/DD/YYYY HH:mm:ss → Date
    const [datePart, timePart] = d.split(' ')
    const [mm, dd, yyyy] = datePart.split('/')
    return new Date(`${yyyy}-${mm}-${dd}T${timePart ?? '00:00:00'}Z`).toISOString()
  } catch {
    return null
  }
}

export async function searchWithOutscraper(area: string, category: string): Promise<RawReview[]> {
  const apiKey = process.env.OUTSCRAPER_API_KEY
  if (!apiKey) throw new Error('OUTSCRAPER_API_KEY not set')

  const query = `${category} ${area}`.trim()
  const params = new URLSearchParams({
    query,
    limit: '15',           // up to 15 businesses per search
    reviewsLimit: '40',    // up to 40 reviews per business
    sort: 'newest',
    async: 'false',        // synchronous — wait for results
    language: 'en',
    ignoreEmpty: 'true',   // skip reviews with no text
  })

  const res = await fetch(`https://api.outscraper.com/google-maps-reviews?${params}`, {
    headers: { 'X-API-KEY': apiKey },
  })

  if (res.status === 401) throw new Error('Outscraper API key invalid')
  if (res.status === 402) throw new Error('Outscraper account balance insufficient')
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Outscraper error ${res.status}: ${text.slice(0, 200)}`)
  }

  const body = await res.json() as { data?: OutscraperPlace[]; status?: string }

  if (!body.data?.length) return []

  // Flatten all places into the RawReview format (tagged with business name)
  const reviews: RawReview[] = []
  for (const place of body.data) {
    if (!place.reviews_data?.length) continue
    for (const r of place.reviews_data) {
      if (!r.review_text?.trim()) continue
      reviews.push({
        reviewText: r.review_text,
        stars: r.review_rating ?? 0,
        publishedAtDate: parseDate(r.review_datetime_utc) ?? undefined,
        title: place.name ?? 'Unknown',
        address: place.full_address ?? place.address ?? '',
        totalScore: place.rating ?? 0,
        reviewsCount: place.reviews ?? 0,
        url: place.url ?? `https://www.google.com/maps/search/${encodeURIComponent(place.name ?? '')}`,
      })
    }
  }

  return reviews
}
