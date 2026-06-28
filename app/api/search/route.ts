import { NextRequest, NextResponse } from 'next/server'
import { searchWithHasData } from '@/lib/hasdata'
import { searchWithOpenWebNinja } from '@/lib/openwebninja'
import { searchWithOutscraper } from '@/lib/outscraper'
import { searchTrending } from '@/lib/apify'
import { groupAndScore } from '@/lib/trend'
import { enrichWithClaude } from '@/lib/claude-analysis'
import { getCached, setCached } from '@/lib/cache'
import { getDemoData } from '@/lib/demo-data'
import type { SearchResult, RawReview } from '@/lib/types'

export const maxDuration = 300

// ── In-memory rate limiter (10 searches / IP / hour) ──────────
const g = globalThis as Record<string, unknown>
if (!g.__tl_rl) g.__tl_rl = new Map<string, { count: number; resetAt: number }>()
const RL = g.__tl_rl as Map<string, { count: number; resetAt: number }>
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 60 * 1000

function checkRate(ip: string): boolean {
  const now = Date.now()
  const e = RL.get(ip)
  if (!e || now > e.resetAt) { RL.set(ip, { count: 1, resetAt: now + RATE_WINDOW }); return true }
  if (e.count >= RATE_LIMIT) return false
  e.count++; return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!checkRate(ip)) {
      return NextResponse.json({ error: 'Too many searches. Please wait an hour and try again.' }, { status: 429 })
    }

    const { area, category, language = 'en' } = await req.json() as {
      area: string; category: string; language?: 'en' | 'ja'
    }
    if (!area?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'area and category required' }, { status: 400 })
    }

    const a = area.trim()
    const c = category.trim()

    const cached = await getCached(a, c)
    if (cached) return NextResponse.json({ ...cached, fromCache: true })

    let raw: RawReview[] = []
    let isDemo = false
    let dataSource = 'none'

    // 1. HasData (primary — coordinate-based, best accuracy)
    if (process.env.HASDATA_API_KEY) {
      try {
        raw = await searchWithHasData(a, c)
        if (raw.length) dataSource = 'hasdata'
      } catch (err) {
        console.log('[search] hasdata failed:', err instanceof Error ? err.message : err)
      }
    }

    // 2. OpenWeb Ninja (fallback)
    if (!raw.length && process.env.OPENWEBNINJA_API_KEY) {
      try {
        raw = await searchWithOpenWebNinja(a, c)
        if (raw.length) dataSource = 'openwebninja'
      } catch (err) {
        console.log('[search] openwebninja failed:', err instanceof Error ? err.message : err)
      }
    }

    // 2. Outscraper
    if (!raw.length && process.env.OUTSCRAPER_API_KEY) {
      try {
        raw = await searchWithOutscraper(a, c)
        if (raw.length) dataSource = 'outscraper'
      } catch (err) {
        console.log('[search] outscraper failed:', err instanceof Error ? err.message : err)
      }
    }

    // 3. Apify
    if (!raw.length && process.env.APIFY_API_TOKEN) {
      try {
        raw = await searchTrending(a, c)
        if (raw.length) dataSource = 'apify'
      } catch (err) {
        console.log('[search] apify failed:', err instanceof Error ? err.message : err)
      }
    }

    let businesses = raw.length ? groupAndScore(raw) : []

    // 4. Demo data fallback
    if (!businesses.length) {
      const demo = getDemoData(a, c)
      if (demo?.length) { businesses = demo; isDemo = true; dataSource = 'demo' }
    }

    if (!businesses.length) {
      return NextResponse.json({
        error: `No trend data found for "${a}". Try a larger city — Melbourne, Tokyo, New York, or Paris.`,
      }, { status: 404 })
    }

    // 5. Claude enrichment for top Rising/Falling businesses
    if (!isDemo && raw.length > 0 && process.env.ANTHROPIC_API_KEY) {
      // Build review text map per business
      const reviewMap = new Map<string, { recent: string[]; older: string[] }>()
      const DAY = 24 * 60 * 60 * 1000
      const NOW = Date.now()

      for (const r of raw) {
        const name = (r.title ?? r.placeName ?? r.placeTitle ?? 'Unknown') as string
        if (name === 'Unknown' || !r.reviewText?.trim()) continue
        const date = r.publishedAtDate ?? r.publishedAt
        const daysAgo = date ? (NOW - new Date(date).getTime()) / DAY : 999

        if (!reviewMap.has(name)) reviewMap.set(name, { recent: [], older: [] })
        const entry = reviewMap.get(name)!
        if (daysAgo <= 30) entry.recent.push(r.reviewText)
        else if (daysAgo <= 90) entry.older.push(r.reviewText)
      }

      try {
        await enrichWithClaude(businesses, language as 'en' | 'ja', reviewMap)
      } catch (err) {
        console.log('[search] claude enrichment failed:', err instanceof Error ? err.message : err)
      }
    }

    const result: SearchResult = {
      area: a, category: c, businesses,
      cached_at: new Date().toISOString(),
      total_scraped: raw.length || businesses.length * 20,
      isDemo,
    }

    await setCached(result)
    return NextResponse.json({ ...result, dataSource })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
