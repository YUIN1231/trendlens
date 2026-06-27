import Anthropic from '@anthropic-ai/sdk'
import type { TrendBusiness, CategoryScores } from './types'

const client = new Anthropic()

interface ClaudeResult {
  summary: string
  why: string[]
  categories: CategoryScores
  positivePct: number
}

export async function enrichWithClaude(
  businesses: TrendBusiness[],
  language: 'en' | 'ja' = 'en',
  rawReviewMap: Map<string, { recent: string[]; older: string[] }>,
): Promise<void> {
  // Only enrich Rising and Falling businesses (most interesting), max 3
  const targets = businesses
    .filter(b => b.status === 'rising' || b.status === 'falling')
    .slice(0, 3)

  await Promise.all(targets.map(async (biz) => {
    const reviews = rawReviewMap.get(biz.name)
    if (!reviews || reviews.recent.length < 2) return

    try {
      const result = await callClaude(biz.name, reviews.recent, reviews.older, language)
      if (!result) return
      biz.summary = result.summary
      biz.why = result.why
      biz.whySource = 'claude'
      biz.categories = result.categories
      biz.positivePct = result.positivePct
    } catch {
      // Claude failure is non-fatal — keep algo why
    }
  }))
}

async function callClaude(
  name: string,
  recent: string[],
  older: string[],
  language: 'en' | 'ja',
): Promise<ClaudeResult | null> {
  const langNote = language === 'ja'
    ? 'Respond in Japanese. Keep it natural and concise.'
    : 'Respond in English.'

  const recentText = recent.slice(0, 12).map((t, i) => `[${i + 1}] ${t}`).join('\n')
  const olderText  = older.slice(0, 8).map((t, i) => `[${i + 1}] ${t}`).join('\n')

  const prompt = `You are analyzing Google Maps reviews for "${name}".

${langNote}

RECENT REVIEWS (last 30 days):
${recentText || '(none)'}

OLDER REVIEWS (31-90 days ago):
${olderText || '(none)'}

Return ONLY valid JSON, no markdown:
{
  "summary": "2 sentences: what this place is, what changed recently",
  "why": ["specific reason 1 with data", "specific reason 2", "specific reason 3"],
  "categories": {"food": 4.5, "service": 4.3, "atmosphere": 4.7, "price": 3.8, "cleanliness": 4.6},
  "positivePct": 87
}

Rules:
- summary: be specific, name what changed (new menu, new staff, ownership, etc.)
- why: each item must reference something from the reviews with a count if possible
- categories: infer from review language; if not mentioned, estimate from overall tone
- positivePct: percentage of recent reviews that are clearly positive`

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null

  const parsed = JSON.parse(match[0]) as ClaudeResult
  if (!parsed.summary || !Array.isArray(parsed.why)) return null
  parsed.why = parsed.why.slice(0, 4)
  return parsed
}
