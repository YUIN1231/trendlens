import type { SearchResult } from './types'

const TTL_HOURS = 24

function cacheKey(area: string, category: string): string {
  const slug = `${area}-${category}`.toLowerCase().replace(/[^a-z0-9぀-鿿]+/g, '-')
  return `trendlens/${slug}.json`
}

export async function getCached(area: string, category: string): Promise<SearchResult | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null
  try {
    const { list } = await import('@vercel/blob')
    const key = cacheKey(area, category)
    const { blobs } = await list({ prefix: key })
    if (!blobs.length) return null
    const res = await fetch(blobs[0].url)
    if (!res.ok) return null
    const data = await res.json() as SearchResult
    const age = (Date.now() - new Date(data.cached_at).getTime()) / 3600000
    if (age > TTL_HOURS) return null
    return data
  } catch {
    return null
  }
}

export async function setCached(result: SearchResult): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return
  try {
    const { put } = await import('@vercel/blob')
    const key = cacheKey(result.area, result.category)
    await put(key, JSON.stringify(result), { access: 'public', contentType: 'application/json' })
  } catch {
    // cache failure is non-fatal
  }
}
