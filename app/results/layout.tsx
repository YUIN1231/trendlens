import type { Metadata } from 'next'

const BASE_URL = 'https://trendlens-nu.vercel.app'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; category?: string }>
}): Promise<Metadata> {
  const sp       = await searchParams
  const area     = sp.area     ?? 'your city'
  const category = sp.category ?? 'places'
  const month    = new Date().toLocaleString('en', { month: 'long', year: 'numeric' })
  const ogUrl    = `${BASE_URL}/api/og?area=${encodeURIComponent(area)}&category=${encodeURIComponent(category)}`

  return {
    title: `${category} trending in ${area} — TrendLens`,
    description: `AI finds what's rising and falling on Google Maps. ${category} in ${area}, ${month}.`,
    openGraph: {
      title: `${category} in ${area} · ${month}`,
      description: "Find what's trending before everyone else — TrendLens",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${category} trends in ${area}` }],
      type: 'website',
      url: `${BASE_URL}/results?area=${encodeURIComponent(area)}&category=${encodeURIComponent(category)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category} in ${area} · TrendLens`,
      description: 'AI-detected trends on Google Maps',
      images: [ogUrl],
    },
  }
}

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
