import { NextRequest, NextResponse } from 'next/server'

// Nominatim geocoding proxy (avoids CORS + rate limit headers from client)
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 })

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TrendLens/1.0 (trendlens-nu.vercel.app)' },
    })
    const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>
    if (!data.length) return NextResponse.json({ lat: null, lng: null })
    return NextResponse.json({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
  } catch {
    return NextResponse.json({ lat: null, lng: null })
  }
}
