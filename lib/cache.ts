import type { SearchResult } from './types'

const TTL_MS = 24 * 3600 * 1000

// In-memory cache — persists across requests within the same warm Vercel instance
interface CacheEntry { data: SearchResult; expiry: number }
const g = globalThis as Record<string, unknown>
if (!g.__tl_cache) g.__tl_cache = new Map<string, CacheEntry>()
const MEM = g.__tl_cache as Map<string, CacheEntry>

function key(area: string, category: string) {
  return `${area}::${category}`.toLowerCase()
}

function blobKey(area: string, category: string) {
  return `trendlens/${area}-${category}`.toLowerCase().replace(/[^a-z0-9　-鿿:]+/g, '-') + '.json'
}

export async function getCached(area: string, category: string): Promise<SearchResult | null> {
  // 1. Check in-memory cache
  const memEntry = MEM.get(key(area, category))
  if (memEntry && Date.now() < memEntry.expiry) return memEntry.data

  // 2. Check Vercel Blob (if configured)
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null
  try {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: blobKey(area, category) })
    if (!blobs.length) return null
    const res = await fetch(blobs[0].url)
    if (!res.ok) return null
    const data = await res.json() as SearchResult
    const age = Date.now() - new Date(data.cached_at).getTime()
    if (age > TTL_MS) return null
    // Warm the in-memory cache too
    MEM.set(key(area, category), { data, expiry: Date.now() + TTL_MS - age })
    return data
  } catch { return null }
}

export async function setCached(result: SearchResult): Promise<void> {
  const k = key(result.area, result.category)
  MEM.set(k, { data: result, expiry: Date.now() + TTL_MS })

  if (!process.env.BLOB_READ_WRITE_TOKEN) return
  try {
    const { put } = await import('@vercel/blob')
    await put(blobKey(result.area, result.category), JSON.stringify(result), {
      access: 'public', contentType: 'application/json',
    })
  } catch { /* non-fatal */ }
}
