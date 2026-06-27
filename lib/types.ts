export interface RawReview {
  reviewText?: string
  text?: string
  stars?: number
  rating?: number
  publishedAtDate?: string
  publishedAt?: string
  title?: string
  placeName?: string
  placeTitle?: string
  address?: string
  street?: string
  url?: string
  totalScore?: number
  reviewsCount?: number
  location?: { lat: number; lng: number }
  latitude?: number
  longitude?: number
  lat?: number
  lng?: number
  [key: string]: unknown
}

export interface TrendBusiness {
  name: string
  address: string
  mapsUrl: string
  rating: number
  totalReviews: number
  recentAvg: number       // avg rating last 30 days
  olderAvg: number        // avg rating 31-90 days ago
  trendDelta: number      // recentAvg - olderAvg
  recentCount: number     // review count last 30 days
  olderCount: number      // review count 31-90 days ago
  status: 'rising' | 'falling' | 'stable' | 'new'
  sampleQuote: string
  why: string[]
  lat?: number
  lng?: number
}

export interface SearchResult {
  area: string
  category: string
  businesses: TrendBusiness[]
  cached_at: string
  total_scraped: number
  isDemo?: boolean
}
