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

export interface CategoryScores {
  food: number
  service: number
  atmosphere: number
  price: number
  cleanliness: number
}

export interface TrendBusiness {
  name: string
  address: string
  mapsUrl: string
  rating: number
  totalReviews: number
  recentAvg: number
  olderAvg: number
  trendDelta: number
  recentCount: number
  olderCount: number
  velocity: number
  composite: number
  trendScore: number          // 0-100 single number
  displayPrimary: string      // "3× more reviews" or "↑ +0.5★"
  status: 'rising' | 'falling' | 'stable' | 'new'
  sampleQuote: string
  why: string[]
  whySource: 'claude' | 'algo'
  summary?: string            // AI paragraph
  categories?: CategoryScores // Food/Service/Atmosphere/Price/Cleanliness
  positivePct?: number        // % of 4-5 star recent reviews
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
