import type { TrendBusiness } from './types'

type DemoInput = Omit<TrendBusiness, 'velocity' | 'composite' | 'trendScore' | 'displayPrimary' | 'whySource'>

function d(b: DemoInput): TrendBusiness {
  const vel = b.olderCount > 0 ? b.recentCount / b.olderCount - 1 : 0
  const vn = Math.tanh(vel / 2)
  const rn = Math.max(-1, Math.min(1, b.trendDelta / 2))
  const comp = 0.6 * vn + 0.4 * rn
  const score = Math.round(Math.min(100, Math.max(20, b.rating * 18.5 + comp * 12)))
  const disp = b.status === 'new' ? 'NEW'
    : b.status === 'stable' ? '→'
    : b.trendDelta > 0 ? `↑ +${b.trendDelta.toFixed(1)}★`
    : `↓ ${b.trendDelta.toFixed(1)}★`
  return { ...b, velocity: Math.round(vel * 100) / 100, composite: Math.round(comp * 100) / 100, trendScore: score, displayPrimary: disp, whySource: 'algo' }
}

const DEMO_SETS: Record<string, Record<string, TrendBusiness[]>> = {
  melbourne: {
    café: [
      d({
        name: 'Axil Coffee Roasters',
        address: '322 Burwood Rd, Hawthorn VIC 3122',
        mapsUrl: 'https://www.google.com/maps/place/Axil+Coffee+Roasters',
        rating: 4.7,
        totalReviews: 1842,
        recentAvg: 4.8,
        olderAvg: 4.3,
        trendDelta: 0.52,
        recentCount: 47,
        olderCount: 18,
        status: 'rising',
        sampleQuote: 'Hands down the best flat white in Melbourne. New batch of single origin is incredible.',
        why: ['Rating improved from 4.3 to 4.8 ★', 'More positive mentions of food & drink quality', 'Review activity increased significantly this month'],
      }),
      d({
        name: 'Proud Mary Coffee',
        address: '172 Oxford St, Collingwood VIC 3066',
        mapsUrl: 'https://www.google.com/maps/place/Proud+Mary+Coffee',
        rating: 4.6,
        totalReviews: 2103,
        recentAvg: 4.7,
        olderAvg: 4.2,
        trendDelta: 0.44,
        recentCount: 39,
        olderCount: 21,
        status: 'rising',
        sampleQuote: "The new seasonal menu is a game changer. Worth every cent.",
        why: ['Rating improved from 4.2 to 4.7 ★', 'More positive mentions of new menu / items', 'More positive mentions of atmosphere'],
      }),
      d({
        name: 'Market Lane Coffee',
        address: '109 Franklin St, Melbourne VIC 3000',
        mapsUrl: 'https://www.google.com/maps/place/Market+Lane+Coffee',
        rating: 4.5,
        totalReviews: 987,
        recentAvg: 4.5,
        olderAvg: 4.5,
        trendDelta: 0,
        recentCount: 22,
        olderCount: 19,
        status: 'stable',
        sampleQuote: 'Consistent quality, always reliable.',
        why: [],
      }),
      d({
        name: 'Seven Seeds',
        address: '114 Berkeley St, Carlton VIC 3053',
        mapsUrl: 'https://www.google.com/maps/place/Seven+Seeds+Coffee+Roasters',
        rating: 4.3,
        totalReviews: 1654,
        recentAvg: 3.8,
        olderAvg: 4.4,
        trendDelta: -0.61,
        recentCount: 31,
        olderCount: 24,
        status: 'falling',
        sampleQuote: 'Used to be my go-to but service has slipped badly. Waited 25 mins for a latte.',
        why: ['Rating dropped from 4.4 to 3.8 ★', 'Complaints about waiting time increasing', 'Complaints about service & staff increasing'],
      }),
      d({
        name: 'Brunetti Classico',
        address: 'Shop 1/380 Lygon St, Carlton VIC 3053',
        mapsUrl: 'https://www.google.com/maps/place/Brunetti+Classico',
        rating: 3.9,
        totalReviews: 3241,
        recentAvg: 3.5,
        olderAvg: 4.2,
        trendDelta: -0.71,
        recentCount: 58,
        olderCount: 31,
        status: 'falling',
        sampleQuote: 'Overpriced and quality has dropped since they changed ownership. Disappointing.',
        why: ['Rating dropped from 4.2 to 3.5 ★', 'Complaints about value for money increasing', '5 low-rated reviews appeared recently'],
      }),
    ],
    ramen: [
      d({
        name: 'Hakata Gensuke',
        address: '168 Russell St, Melbourne VIC 3000',
        mapsUrl: 'https://www.google.com/maps/place/Hakata+Gensuke',
        rating: 4.6,
        totalReviews: 2891,
        recentAvg: 4.8,
        olderAvg: 4.3,
        trendDelta: 0.48,
        recentCount: 63,
        olderCount: 29,
        status: 'rising',
        sampleQuote: 'The tonkotsu here is on another level. New chef has elevated everything.',
        why: ['Rating improved from 4.3 to 4.8 ★', 'More positive mentions of food & drink quality', 'Review activity increased significantly this month'],
      }),
      d({
        name: 'Ippudo Melbourne',
        address: '19 Artemis Ln, Melbourne VIC 3000',
        mapsUrl: 'https://www.google.com/maps/place/Ippudo+Melbourne',
        rating: 4.2,
        totalReviews: 1876,
        recentAvg: 3.7,
        olderAvg: 4.4,
        trendDelta: -0.68,
        recentCount: 44,
        olderCount: 22,
        status: 'falling',
        sampleQuote: 'Quality has declined. Portion sizes are smaller and broth is watery.',
        why: ['Rating dropped from 4.4 to 3.7 ★', 'Complaints about food & drink quality increasing', '6 low-rated reviews appeared recently'],
      }),
    ],
  },
  tokyo: {
    ramen: [
      d({
        name: '麺屋一燈',
        address: '東京都新宿区新宿3-17-3',
        mapsUrl: 'https://www.google.com/maps/place/麺屋一燈',
        rating: 4.7,
        totalReviews: 3201,
        recentAvg: 4.9,
        olderAvg: 4.4,
        trendDelta: 0.51,
        recentCount: 89,
        olderCount: 34,
        status: 'rising',
        sampleQuote: '今月は特に出汁の深みが増している。並んでも食べる価値あり。',
        why: ['Rating improved from 4.4 to 4.9 ★', 'More positive mentions of food & drink quality', 'Review activity increased significantly this month'],
      }),
      d({
        name: 'らーめん山頭火',
        address: '東京都渋谷区道玄坂1-3-2',
        mapsUrl: 'https://www.google.com/maps/place/ラーメン山頭火',
        rating: 4.1,
        totalReviews: 892,
        recentAvg: 3.6,
        olderAvg: 4.3,
        trendDelta: -0.73,
        recentCount: 28,
        olderCount: 15,
        status: 'falling',
        sampleQuote: 'スープが薄くなった気がする。以前の濃厚さがない。',
        why: ['Rating dropped from 4.3 to 3.6 ★', 'Complaints about food & drink quality increasing', 'Complaints about value for money increasing'],
      }),
      d({
        name: '新宿 彩華ラーメン',
        address: '東京都新宿区歌舞伎町1-8-1',
        mapsUrl: 'https://www.google.com/maps/place/彩華ラーメン+新宿店',
        rating: 4.4,
        totalReviews: 321,
        recentAvg: 4.4,
        olderAvg: 0,
        trendDelta: 0,
        recentCount: 21,
        olderCount: 0,
        status: 'new',
        sampleQuote: '先月オープンしたばかりだけど、すでに行列。スープが本格的。',
        why: [],
      }),
    ],
    café: [
      d({
        name: 'Blue Bottle Coffee 青山カフェ',
        address: '東京都港区南青山3-13-14',
        mapsUrl: 'https://www.google.com/maps/place/Blue+Bottle+Coffee+青山カフェ',
        rating: 4.6,
        totalReviews: 4102,
        recentAvg: 4.8,
        olderAvg: 4.3,
        trendDelta: 0.46,
        recentCount: 71,
        olderCount: 28,
        status: 'rising',
        sampleQuote: '新しいシングルオリジンが素晴らしい。スタッフの知識も豊富。',
        why: ['Rating improved from 4.3 to 4.8 ★', 'More positive mentions of food & drink quality', 'More positive mentions of service & staff'],
      }),
    ],
  },
  'new york': {
    bar: [
      d({
        name: 'Death & Co',
        address: '433 E 6th St, New York, NY 10009',
        mapsUrl: 'https://www.google.com/maps/place/Death+and+Company',
        rating: 4.7,
        totalReviews: 3892,
        recentAvg: 4.9,
        olderAvg: 4.4,
        trendDelta: 0.49,
        recentCount: 84,
        olderCount: 31,
        status: 'rising',
        sampleQuote: "New bartender is a genius. The seasonal cocktail menu is absolutely stunning.",
        why: ['Rating improved from 4.4 to 4.9 ★', 'More positive mentions of service & staff', 'More positive mentions of new menu / items'],
      }),
      d({
        name: 'The Dead Rabbit',
        address: '30 Water St, New York, NY 10004',
        mapsUrl: 'https://www.google.com/maps/place/The+Dead+Rabbit',
        rating: 4.3,
        totalReviews: 5012,
        recentAvg: 3.8,
        olderAvg: 4.6,
        trendDelta: -0.82,
        recentCount: 93,
        olderCount: 47,
        status: 'falling',
        sampleQuote: 'Prices doubled but quality halved. Management change has ruined this place.',
        why: ['Rating dropped from 4.6 to 3.8 ★', 'Complaints about value for money increasing', 'Complaints about service & staff increasing'],
      }),
    ],
    café: [
      d({
        name: 'Bluestone Lane',
        address: '55 Greenwich Ave, New York, NY 10014',
        mapsUrl: 'https://www.google.com/maps/place/Bluestone+Lane',
        rating: 4.5,
        totalReviews: 1243,
        recentAvg: 4.7,
        olderAvg: 4.2,
        trendDelta: 0.53,
        recentCount: 58,
        olderCount: 19,
        status: 'rising',
        sampleQuote: "Best flat white in the city, hands down. The avocado toast is a masterpiece.",
        why: ['Rating improved from 4.2 to 4.7 ★', 'More positive mentions of food & drink quality', 'Review activity increased significantly this month'],
      }),
    ],
  },
  paris: {
    restaurant: [
      d({
        name: 'Le Comptoir du Relais',
        address: '9 Carrefour de l\'Odéon, 75006 Paris',
        mapsUrl: 'https://www.google.com/maps/place/Le+Comptoir+du+Relais',
        rating: 4.5,
        totalReviews: 6203,
        recentAvg: 4.7,
        olderAvg: 4.1,
        trendDelta: 0.58,
        recentCount: 112,
        olderCount: 44,
        status: 'rising',
        sampleQuote: "Nouveau chef, nouvelle énergie. Le tartare est exceptionnel ce mois-ci.",
        why: ['Rating improved from 4.1 to 4.7 ★', 'More positive mentions of food & drink quality', 'More positive mentions of service & staff'],
      }),
      d({
        name: 'Café de Flore',
        address: '172 Bd Saint-Germain, 75006 Paris',
        mapsUrl: 'https://www.google.com/maps/place/Café+de+Flore',
        rating: 3.8,
        totalReviews: 12041,
        recentAvg: 3.4,
        olderAvg: 4.1,
        trendDelta: -0.64,
        recentCount: 198,
        olderCount: 87,
        status: 'falling',
        sampleQuote: "Tourist trap now. €8 for a mediocre espresso and rude service.",
        why: ['Rating dropped from 4.1 to 3.4 ★', 'Complaints about value for money increasing', 'Complaints about service & staff increasing'],
      }),
    ],
  },
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^\w\s]/g, '').trim()
}

export function getDemoData(area: string, category: string): TrendBusiness[] | null {
  const areaN = normalize(area)
  const catN = normalize(category)

  // If normalized area is empty (e.g. pure CJK input), no demo data
  if (!areaN || areaN.length < 2) return null

  // Find matching area
  const areaKey = Object.keys(DEMO_SETS).find((k) => areaN.includes(k) || k.includes(areaN.split(' ')[0]))
  if (!areaKey) return null

  const areaData = DEMO_SETS[areaKey]

  // Find matching category
  const catKey = Object.keys(areaData).find((k) => catN.includes(k) || k.includes(catN))
  if (!catKey) {
    // Return first available category for this area
    const firstKey = Object.keys(areaData)[0]
    return firstKey ? areaData[firstKey] : null
  }

  return areaData[catKey]
}

export const DEMO_CITIES = ['Melbourne', 'Tokyo', 'New York', 'Paris']
