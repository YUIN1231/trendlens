import { NextRequest, NextResponse } from 'next/server'
import { searchTrending } from '@/lib/apify'
import { searchWithOutscraper } from '@/lib/outscraper'
import { searchWithOpenWebNinja } from '@/lib/openwebninja'
import { groupAndScore } from '@/lib/trend'
import { getCached, setCached } from '@/lib/cache'
import { getDemoData } from '@/lib/demo-data'
import type { SearchResult } from '@/lib/types'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { area, category } = await req.json() as { area: string; category: string }
    if (!area?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'area and category required' }, { status: 400 })
    }

    const a = area.trim()
    const c = category.trim()

    // Cache check
    const cached = await getCached(a, c)
    if (cached) return NextResponse.json({ ...cached, fromCache: true })

    let businesses = null
    let isDemo = false
    let rawCount = 0
    let dataSource = 'none'

    // 1. Try OpenWeb Ninja (free tier, no credit card)
    if (process.env.OPENWEBNINJA_API_KEY) {
      try {
        const raw = await searchWithOpenWebNinja(a, c)
        rawCount = raw.length
        if (raw.length > 0) {
          businesses = groupAndScore(raw)
          dataSource = 'openwebninja'
          console.log(`[search] openwebninja: ${raw.length} reviews → ${businesses.length} businesses`)
        }
      } catch (err) {
        console.log('[search] openwebninja failed:', err instanceof Error ? err.message : err)
      }
    }

    // 2. Try Outscraper
    if (!businesses?.length && process.env.OUTSCRAPER_API_KEY) {
      try {
        const raw = await searchWithOutscraper(a, c)
        rawCount = raw.length
        if (raw.length > 0) {
          businesses = groupAndScore(raw)
          dataSource = 'outscraper'
          console.log(`[search] outscraper: ${raw.length} reviews → ${businesses.length} businesses`)
        }
      } catch (err) {
        console.log('[search] outscraper failed:', err instanceof Error ? err.message : err)
      }
    }

    // 3. Fallback to Apify
    if (!businesses?.length && process.env.APIFY_API_TOKEN) {
      try {
        const raw = await searchTrending(a, c)
        rawCount = raw.length
        if (raw.length > 0) {
          businesses = groupAndScore(raw)
          dataSource = 'apify'
          console.log(`[search] apify: ${raw.length} reviews → ${businesses.length} businesses`)
        }
      } catch (err) {
        console.log('[search] apify failed:', err instanceof Error ? err.message : err)
      }
    }

    // 3. Fallback to demo data
    if (!businesses?.length) {
      const demoBusinesses = getDemoData(a, c)
      if (demoBusinesses?.length) {
        businesses = demoBusinesses
        isDemo = true
        dataSource = 'demo'
        console.log(`[search] demo data for: ${a} ${c}`)
      }
    }

    if (!businesses?.length) {
      return NextResponse.json({
        error: `No trend data found for "${a}". This area may be too small or have too few reviews. Try a larger city — Melbourne, Tokyo, New York, or Paris work well.`,
      }, { status: 404 })
    }

    const result: SearchResult = {
      area: a,
      category: c,
      businesses,
      cached_at: new Date().toISOString(),
      total_scraped: rawCount || businesses.length * 30,
      isDemo,
    }

    await setCached(result)
    return NextResponse.json({ ...result, dataSource })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
