import { useState, useEffect, useCallback } from 'react'

type Dict = Record<string, string>

const EN: Dict = {
  'hero.headline': 'Find what\'s about to blow up in your city.',
  'hero.subheadline': 'AI reads thousands of Google reviews to spot the hottest places before everyone else. Made for TikTok and Reels content.',
  'hero.supplement': 'Search any city and category. We analyze recent review signals, rating movement, and review language to find what is changing.',
  'search.area.label': 'City or Area',
  'search.area.placeholder': 'e.g. "Tokyo" or "Melbourne CBD"',
  'search.category.label': 'What are you looking for?',
  'search.category.placeholder': '"cafe" "ramen" "rooftop bar" "brunch" …',
  'search.location.btn': '📍 Use my location',
  'search.location.detecting': '📍 Detecting…',
  'search.cta': "Find what's hot →",
  'search.cta.loading': 'Scanning…',
  'loading.step1': 'Scanning Google Maps...',
  'loading.step2': 'Reading thousands of reviews...',
  'loading.step3': 'AI finding the trends...',
  'loading.step4': 'Almost ready...',
  'loading.note': 'Checking for cached results, then scanning live…',
  'how.title': 'How it works',
  'how.step1': 'Pick a city and what you\'re looking for',
  'how.step2': 'AI reads thousands of Google reviews',
  'how.step3': 'Spots what\'s getting hot or losing steam',
  'how.step4': 'See rising and falling places',
  'how.step4.share': 'Go there first — then share it with your audience',
  'sample.title': 'Example results',
  'share.btn': 'Share',
  'score.explain': 'vs last month',
  'results.rising': '🔥 Blowing Up',
  'results.falling': '📉 Losing Steam',
  'results.new': '✨ Just Opened',
  'results.stable': '→ Steady',
  'results.why.rising': 'Why it\'s blowing up',
  'results.why.falling': 'Why it\'s losing steam',
  'results.reviews.30d': 'reviews / 30d',
  'results.open.maps': 'Open in Google Maps',
  'results.navigate': 'Get directions',
  'results.write.review': 'Write a review',
  'results.analyzed': 'reviews analyzed',
  'results.just.now': 'just now',
  'results.hours.ago': 'h ago',
  'results.cached': 'cached',
  'results.no.results': 'No trend data found. Try a different area or category.',
  'meta.tagline': 'worldwide · 100% free · made for creators',
  'back': '← back',
  'map.me': '📍 Me',
  'map.no.coords': 'No locations with map data found.',
}

const JA: Dict = {
  'hero.headline': '今月バズる前の店を、先に見つける。',
  'hero.subheadline': 'AIがGoogleマップのレビューを分析し、急上昇・急落下しているスポットをいち早く発見。TikTok・Reels コンテンツに最適。',
  'hero.supplement': 'エリアとジャンルを入力するだけ。最新レビューの傾向、評価の変化を分析して「今変化している場所」を探し出します。',
  'search.area.label': 'エリア・都市',
  'search.area.placeholder': '例:「渋谷 東京」「大阪」「Melbourne」',
  'search.category.label': 'ジャンル',
  'search.category.placeholder': '自由入力も可 — 「ラーメン」「カフェ」「居酒屋」…',
  'search.location.btn': '📍 現在地を使う',
  'search.location.detecting': '📍 現在地を取得中…',
  'search.cta': 'トレンドを探す →',
  'search.cta.loading': 'スキャン中…',
  'loading.step1': 'Googleマップをスキャン中...',
  'loading.step2': '最新レビューを読み込み中...',
  'loading.step3': 'トレンドスコアを計算中...',
  'loading.step4': '急上昇・急落下の場所を探しています...',
  'loading.note': 'キャッシュを確認後、ライブスキャンします…',
  'how.title': '使い方',
  'how.step1': '都市とジャンルを選ぶ',
  'how.step2': 'Googleマップのレビューをスキャン',
  'how.step3': 'AIがトレンドシグナルを計算',
  'how.step4': '急上昇・急落下している場所を確認',
  'how.step4.share': '実際に行って体験をシェア',
  'sample.title': '表示例',
  'share.btn': 'この結果をシェア',
  'score.explain': '先月比',
  'results.rising': '🔥 急上昇中',
  'results.falling': '📉 下降中',
  'results.new': '✨ 新規オープン',
  'results.stable': '→ 安定',
  'results.why.rising': 'バズっている理由',
  'results.why.falling': '落ちている理由',
  'results.reviews.30d': '件のレビュー / 30日',
  'results.open.maps': 'Googleマップで開く',
  'results.navigate': 'ナビを開く',
  'results.write.review': '✍ 行った？レビューを書く',
  'results.analyzed': '件のレビューを分析',
  'results.just.now': 'たった今',
  'results.hours.ago': '時間前',
  'results.cached': 'キャッシュ',
  'results.no.results': 'データが見つかりませんでした。別のエリアかジャンルで試してください。',
  'meta.tagline': '世界中のエリアに対応 · 完全無料 · 24時間キャッシュ',
  'back': '← 戻る',
  'map.me': '📍 現在地',
  'map.no.coords': 'マップデータのある場所が見つかりませんでした。',
}

const ES: Dict = { 'hero.headline': 'Encuentra los lugares que suben o bajan en Google Maps.', 'hero.subheadline': 'TrendLens analiza reseñas de Google Maps y detecta lugares que se vuelven populares antes que nadie.', 'hero.supplement': 'Busca cualquier ciudad y categoría.', 'search.area.label': 'Área / Ciudad', 'search.area.placeholder': 'ej. "Madrid" o "Buenos Aires"', 'search.category.label': 'Categoría', 'search.category.placeholder': 'o escribe cualquier cosa…', 'search.location.btn': '📍 Usar mi ubicación', 'search.location.detecting': '📍 Detectando…', 'search.cta': 'Encontrar tendencias →', 'search.cta.loading': 'Escaneando…', 'loading.step1': 'Escaneando Google Maps...', 'loading.step2': 'Leyendo reseñas...', 'loading.step3': 'Calculando tendencias...', 'loading.step4': 'Encontrando lugares...', 'loading.note': 'Esto tarda unos 60 segundos.', 'how.title': 'Cómo funciona', 'how.step1': 'Elige ciudad y categoría', 'how.step2': 'Escanear reseñas de Google Maps', 'how.step3': 'IA calcula señales de tendencia', 'how.step4': 'Ver lugares en mapa', 'sample.title': 'Ejemplo', 'results.rising': '🔥 Subiendo', 'results.falling': '💀 Bajando', 'results.new': '✨ Nuevo', 'results.stable': '→ Estable', 'results.why.rising': 'Por qué sube', 'results.why.falling': 'Por qué baja', 'results.reviews.30d': 'reseñas / 30d', 'results.open.maps': 'Abrir en Google Maps', 'results.navigate': 'Navegar', 'results.write.review': '✍ ¿Lo visitaste? Deja una reseña', 'results.analyzed': 'reseñas analizadas', 'results.just.now': 'ahora mismo', 'results.hours.ago': 'h', 'results.cached': 'caché', 'results.no.results': 'No se encontraron datos.', 'meta.tagline': 'cualquier ciudad · gratis · semanal', 'back': '← volver', 'map.me': '📍 Yo', 'map.no.coords': 'Sin datos de mapa.' }
const FR: Dict = { 'hero.headline': 'Trouvez les lieux en hausse ou en baisse sur Google Maps.', 'hero.subheadline': 'TrendLens détecte les lieux qui montent ou perdent de la vitesse avant tout le monde.', 'hero.supplement': 'Recherchez n\'importe quelle ville et catégorie.', 'search.area.label': 'Zone / Ville', 'search.area.placeholder': 'ex. "Paris" ou "Lyon"', 'search.category.label': 'Catégorie', 'search.category.placeholder': 'ou tapez n\'importe quoi…', 'search.location.btn': '📍 Utiliser ma position', 'search.location.detecting': '📍 Détection…', 'search.cta': 'Trouver les tendances →', 'search.cta.loading': 'Analyse…', 'loading.step1': 'Analyse de Google Maps...', 'loading.step2': 'Lecture des avis...', 'loading.step3': 'Calcul des tendances...', 'loading.step4': 'Recherche des lieux...', 'loading.note': 'Cela prend environ 60 secondes.', 'how.title': 'Comment ça marche', 'how.step1': 'Choisissez une ville', 'how.step2': 'Analyser les avis Google Maps', 'how.step3': 'L\'IA calcule les tendances', 'how.step4': 'Voir les lieux sur la carte', 'sample.title': 'Exemple', 'results.rising': '🔥 En hausse', 'results.falling': '💀 En baisse', 'results.new': '✨ Nouveau', 'results.stable': '→ Stable', 'results.why.rising': 'Pourquoi en hausse', 'results.why.falling': 'Pourquoi en baisse', 'results.reviews.30d': 'avis / 30j', 'results.open.maps': 'Ouvrir dans Google Maps', 'results.navigate': 'Naviguer', 'results.write.review': '✍ Visité ? Laisser un avis', 'results.analyzed': 'avis analysés', 'results.just.now': 'à l\'instant', 'results.hours.ago': 'h', 'results.cached': 'cache', 'results.no.results': 'Aucune donnée trouvée.', 'meta.tagline': 'toutes les villes · gratuit · hebdomadaire', 'back': '← retour', 'map.me': '📍 Moi', 'map.no.coords': 'Aucun lieu trouvé.' }
const DE: Dict = { 'hero.headline': 'Finde Orte, die auf Google Maps steigen oder fallen.', 'hero.subheadline': 'TrendLens erkennt Orte, die im Kommen sind oder an Fahrt verlieren.', 'hero.supplement': 'Suche in jeder Stadt und Kategorie.', 'search.area.label': 'Gebiet / Stadt', 'search.area.placeholder': 'z.B. "Berlin" oder "München"', 'search.category.label': 'Kategorie', 'search.category.placeholder': 'oder tippe etwas ein…', 'search.location.btn': '📍 Meinen Standort verwenden', 'search.location.detecting': '📍 Erkenne Standort…', 'search.cta': 'Trends finden →', 'search.cta.loading': 'Scanne…', 'loading.step1': 'Scanne Google Maps...', 'loading.step2': 'Lese Bewertungen...', 'loading.step3': 'Berechne Trends...', 'loading.step4': 'Finde Orte...', 'loading.note': 'Dies dauert ca. 60 Sekunden.', 'how.title': 'So funktioniert es', 'how.step1': 'Stadt und Kategorie wählen', 'how.step2': 'Google Maps Bewertungen scannen', 'how.step3': 'KI berechnet Trend-Signale', 'how.step4': 'Orte auf der Karte sehen', 'sample.title': 'Beispiel', 'results.rising': '🔥 Steigend', 'results.falling': '💀 Fallend', 'results.new': '✨ Neu', 'results.stable': '→ Stabil', 'results.why.rising': 'Warum steigend', 'results.why.falling': 'Warum fallend', 'results.reviews.30d': 'Bewertungen / 30T', 'results.open.maps': 'In Google Maps öffnen', 'results.navigate': 'Navigation', 'results.write.review': '✍ Besucht? Bewertung schreiben', 'results.analyzed': 'Bewertungen analysiert', 'results.just.now': 'gerade eben', 'results.hours.ago': 'Std.', 'results.cached': 'Cache', 'results.no.results': 'Keine Daten gefunden.', 'meta.tagline': 'jede Stadt · kostenlos · wöchentlich', 'back': '← zurück', 'map.me': '📍 Ich', 'map.no.coords': 'Keine Orte gefunden.' }
const KO: Dict = { 'hero.headline': 'Google 지도에서 뜨는 곳과 지는 곳을 찾아보세요.', 'hero.subheadline': 'TrendLens는 Google 지도 리뷰를 분석해 인기가 오르거나 떨어지는 장소를 먼저 발견합니다.', 'hero.supplement': '원하는 도시와 카테고리를 검색하세요.', 'search.area.label': '지역 / 도시', 'search.area.placeholder': '예: "강남, 서울" 또는 "Melbourne"', 'search.category.label': '카테고리', 'search.category.placeholder': '자유 입력 — 「라멘」「카페」…', 'search.location.btn': '📍 현재 위치 사용', 'search.location.detecting': '📍 위치 감지 중…', 'search.cta': '트렌드 찾기 →', 'search.cta.loading': '스캔 중…', 'loading.step1': 'Google 지도 스캔 중...', 'loading.step2': '최근 리뷰 읽는 중...', 'loading.step3': '트렌드 점수 계산 중...', 'loading.step4': '뜨는 곳과 지는 곳 찾는 중...', 'loading.note': '보통 60초 정도 걸립니다.', 'how.title': '사용 방법', 'how.step1': '도시와 카테고리 선택', 'how.step2': 'Google 지도 리뷰 스캔', 'how.step3': 'AI가 트렌드 신호 계산', 'how.step4': '지도에서 확인', 'sample.title': '표시 예시', 'results.rising': '🔥 급상승', 'results.falling': '💀 급하락', 'results.new': '✨ 신규', 'results.stable': '→ 안정', 'results.why.rising': '상승 이유', 'results.why.falling': '하락 이유', 'results.reviews.30d': '리뷰 / 30일', 'results.open.maps': 'Google 지도에서 열기', 'results.navigate': '길 찾기', 'results.write.review': '✍ 방문했나요? 리뷰 작성', 'results.analyzed': '개 리뷰 분석', 'results.just.now': '방금', 'results.hours.ago': '시간 전', 'results.cached': '캐시', 'results.no.results': '데이터를 찾을 수 없습니다.', 'meta.tagline': '전 세계 모든 도시 · 완전 무료 · 매주 업데이트', 'back': '← 뒤로', 'map.me': '📍 내 위치', 'map.no.coords': '지도 데이터가 없습니다.' }
const ZH_CN: Dict = { 'hero.headline': '发现 Google 地图上正在上升或下降的地方。', 'hero.subheadline': 'TrendLens 检测正在走红或失去人气的地方。', 'hero.supplement': '搜索任何城市和类别。', 'search.area.label': '地区 / 城市', 'search.area.placeholder': '例如："上海" 或 "东京"', 'search.category.label': '类别', 'search.category.placeholder': '或输入任何内容…', 'search.location.btn': '📍 使用我的位置', 'search.location.detecting': '📍 正在定位…', 'search.cta': '发现趋势 →', 'search.cta.loading': '扫描中…', 'loading.step1': '正在扫描 Google 地图...', 'loading.step2': '正在读取评论...', 'loading.step3': '正在计算趋势...', 'loading.step4': '正在寻找地点...', 'loading.note': '通常需要约 60 秒。', 'how.title': '使用方法', 'how.step1': '选择城市和类别', 'how.step2': '扫描 Google 地图评论', 'how.step3': 'AI 计算趋势信号', 'how.step4': '在地图上查看', 'sample.title': '示例', 'results.rising': '🔥 上升中', 'results.falling': '💀 下降中', 'results.new': '✨ 新开', 'results.stable': '→ 稳定', 'results.why.rising': '上升原因', 'results.why.falling': '下降原因', 'results.reviews.30d': '条评论 / 30天', 'results.open.maps': '在 Google 地图中打开', 'results.navigate': '导航', 'results.write.review': '✍ 去过？写评论', 'results.analyzed': '条评论已分析', 'results.just.now': '刚刚', 'results.hours.ago': '小时前', 'results.cached': '已缓存', 'results.no.results': '未找到数据。', 'meta.tagline': '全球城市 · 免费 · 每周更新', 'back': '← 返回', 'map.me': '📍 我的位置', 'map.no.coords': '未找到位置。' }
const PT: Dict = { 'hero.headline': 'Encontre lugares em alta ou em queda no Google Maps.', 'hero.subheadline': 'TrendLens detecta lugares que estão bombando antes de todo mundo.', 'hero.supplement': 'Pesquise qualquer cidade e categoria.', 'search.area.label': 'Área / Cidade', 'search.area.placeholder': 'ex. "São Paulo" ou "Lisboa"', 'search.category.label': 'Categoria', 'search.category.placeholder': 'ou digite qualquer coisa…', 'search.location.btn': '📍 Usar minha localização', 'search.location.detecting': '📍 Detectando…', 'search.cta': 'Encontrar tendências →', 'search.cta.loading': 'Escaneando…', 'loading.step1': 'Escaneando Google Maps...', 'loading.step2': 'Lendo avaliações...', 'loading.step3': 'Calculando tendências...', 'loading.step4': 'Encontrando lugares...', 'loading.note': 'Geralmente leva 60 segundos.', 'how.title': 'Como funciona', 'how.step1': 'Escolha uma cidade', 'how.step2': 'Escanear avaliações do Google Maps', 'how.step3': 'IA calcula sinais de tendência', 'how.step4': 'Ver lugares no mapa', 'sample.title': 'Exemplo', 'results.rising': '🔥 Em alta', 'results.falling': '💀 Em queda', 'results.new': '✨ Novo', 'results.stable': '→ Estável', 'results.why.rising': 'Por que está em alta', 'results.why.falling': 'Por que está em queda', 'results.reviews.30d': 'avaliações / 30d', 'results.open.maps': 'Abrir no Google Maps', 'results.navigate': 'Navegar', 'results.write.review': '✍ Visitou? Avalie', 'results.analyzed': 'avaliações analisadas', 'results.just.now': 'agora', 'results.hours.ago': 'h atrás', 'results.cached': 'cache', 'results.no.results': 'Nenhum dado encontrado.', 'meta.tagline': 'qualquer cidade · grátis · semanal', 'back': '← voltar', 'map.me': '📍 Eu', 'map.no.coords': 'Sem dados de mapa.' }

export const MESSAGES: Record<string, Dict> = {
  en: EN, ja: JA, es: ES, fr: FR, de: DE, ko: KO,
  'zh-CN': ZH_CN, 'zh-TW': ZH_CN, pt: PT,
}

export const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ko', label: '한국어' },
  { code: 'zh-CN', label: '中文' },
  { code: 'pt', label: 'Português' },
]

const STORAGE_KEY = 'tl-lang'

function detectLang(): string {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && MESSAGES[saved]) return saved
  const nav = navigator.language ?? 'en'
  if (nav.startsWith('zh')) return 'zh-CN'
  const short = nav.split('-')[0]
  return MESSAGES[short] ? short : 'en'
}

export function useTranslation() {
  const [lang, setLangState] = useState('en')

  useEffect(() => {
    setLangState(detectLang())
  }, [])

  const setLang = useCallback((l: string) => {
    setLangState(l)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const t = useCallback((key: string): string => {
    return (MESSAGES[lang] ?? EN)[key] ?? EN[key] ?? key
  }, [lang])

  return { t, lang, setLang }
}
