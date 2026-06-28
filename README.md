# TrendLens

**AI-powered Google Maps trend detector. Find what's blowing up — or losing steam — before everyone else.**

→ **Live demo:** https://trendlens-nu.vercel.app

---

## What it does

TrendLens reads thousands of Google Maps reviews in real time and surfaces:
- **Blowing Up** — places seeing a sudden surge in reviews and ratings
- **Losing Steam** — places where buzz is fading
- **Just Opened** — new venues gaining early traction

Search any city, any category. Results in under 60 seconds.

---

## How it works

```
User enters city + category
  ↓
HasData API → scrapes Google Maps search results + reviews (sorted newest first)
  ↓
Velocity scoring: composite = 0.6 × tanh(velocity/2) + 0.4 × normalize(ratingDelta)
TrendLens Score = round(min(100, max(20, rating × 18.5 + composite × 12)))
  ↓
Claude Haiku (claude-haiku-4-5-20251001) enriches top Rising/Falling businesses:
  - AI summary paragraph
  - "Why it's trending" bullet points
  - Category scores (Food / Service / Atmosphere / Price / Cleanliness)
  ↓
Results rendered as mobile-first app with map, library, and share
```

---

## Claude integration

Claude Haiku is called via the Anthropic API for the top 3 Rising and top 3 Falling businesses. It receives raw review snippets and returns structured JSON:

```typescript
{
  summary: string         // one-paragraph narrative
  why: string[]           // 2-3 specific reasons
  categories: {
    food: number          // 0–5 score
    service: number
    atmosphere: number
    price: number
    cleanliness: number
  }
  positivePct: number     // % of recent reviews that are positive
}
```

This transforms raw data signals into human-readable insight — the core value of the product.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router |
| AI | Claude Haiku (claude-haiku-4-5-20251001) |
| Data | HasData API (Google Maps scraper) |
| Map | Leaflet + OpenStreetMap |
| Geocoding | Nominatim |
| Cache | In-memory (globalThis, 24h TTL) |
| Deploy | Vercel |
| UI | Custom CSS (iPod Classic design language) |

---

## Hackathon submission

| Field | Value |
|-------|-------|
| Event | AI Builders Hackathon |
| Period | Aug 1–25, 2026 |
| Demo | https://trendlens-nu.vercel.app |
| Repo | https://github.com/YUIN1231/trendlens |

---

## Local development

```bash
git clone https://github.com/YUIN1231/trendlens
cd trendlens
npm install

# .env.local
ANTHROPIC_API_KEY=your_key
HASDATA_API_KEY=your_key

npm run dev
# → http://localhost:3000
```

---

## Design principles

- **iPod Classic 2026**: warm white (#F5F4F0), single accent color, zero noise
- **Mobile-first**: full bottom-nav app experience, thumb-friendly tap targets
- **Discovery moment**: #1 trending result shown open — no tap required
- **Worldwide**: Nominatim geocodes any city on earth; HasData covers global Google Maps
- **100% free** for end users
