/**
 * 評分引擎 — 依據 design/scoring-spec.md 實作。
 * 所有評分在瀏覽器端即時計算；權重可由使用者調整。
 */
import type { Purity, Stock } from './types'

export interface ScoreWeights {
  value: number
  theme: number
  volumePrice: number
}

export const DEFAULT_WEIGHTS: ScoreWeights = { value: 50, theme: 20, volumePrice: 30 }

export type Rating = '強力關注' | '值得追蹤' | '中性觀察' | '暫不考慮'

export interface ScoreBreakdown {
  /** 低估分 0–100 */
  value_score: number
  /** 題材分 0–100 */
  theme_score: number
  /** 量價分 0–100 */
  volume_price_score: number
  /** 綜合分 0–100（含過熱懲罰） */
  total_score: number
  /** 綜合分（未含過熱懲罰） */
  total_score_raw: number
  rating: Rating
  overheat: boolean
  /** 價漲量縮背離警示（不扣分，僅顯示徽章） */
  divergence: boolean
  /** PER 為 null 或 ≤0（虧損）→ per_score=0 且標記 */
  per_loss: boolean
  /** 過熱觸發原因說明 */
  overheat_reason: string | null
  detail: {
    per_score: number
    pbr_score: number
    yield_score: number
    rev_score: number
    vol_score: number
    ma_score: number
    pattern_score: number
    /** 本股採用的產業 PER 中位數（fallback 為池內中位數） */
    industry_per_median: number | null
    /** 近 20 日價漲量增天數占比（0–1），history 缺時為 null */
    up_vol_ratio: number | null
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** x 從 lo→hi 線性映射到 0→100 */
const lerpScore = (x: number, lo: number, hi: number) => clamp01((x - lo) / (hi - lo)) * 100
const r1 = (v: number) => Math.round(v * 10) / 10

/* ---------------- 低估分 ---------------- */

function perScore(per: number | null, median: number | null): { score: number; loss: boolean } {
  if (per == null || per <= 0) return { score: 0, loss: true }
  if (median == null || median <= 0) return { score: 50, loss: false }
  const lo = median * 0.6
  const hi = median * 1.5
  if (per <= lo) return { score: 100, loss: false }
  if (per >= hi) return { score: 0, loss: false }
  // per 越高分越低：per=lo→100, per=hi→0
  return { score: (1 - (per - lo) / (hi - lo)) * 100, loss: false }
}

function pbrScore(pbr: number | null): number {
  if (pbr == null) return 50
  if (pbr <= 1) return 100
  if (pbr >= 5) return 0
  return (1 - (pbr - 1) / 4) * 100
}

function yieldScore(divYield: number | null): number {
  if (divYield == null) return 0
  if (divYield >= 5) return 100
  if (divYield <= 0) return 0
  return (divYield / 5) * 100
}

function revScore(revYoy: number | null): number {
  if (revYoy == null) return 50
  if (revYoy >= 50) return 100
  if (revYoy <= -20) return 0
  return lerpScore(revYoy, -20, 50)
}

/* ---------------- 題材分 ---------------- */

const PURITY_SCORE: Record<Purity, number> = { high: 100, mid: 70, low: 40 }

function themeScore(stock: Stock): number {
  if (!stock.themes || stock.themes.length === 0) return 0
  const max = Math.max(...stock.themes.map((t) => PURITY_SCORE[t.purity] ?? 40))
  const hasHigh = stock.themes.some((t) => t.purity === 'high')
  const bonus = stock.themes.length >= 2 && hasHigh ? 10 : 0
  return Math.min(100, max + bonus)
}

/* ---------------- 量價分 ---------------- */

function volScore(volRatio: number | null): number {
  if (volRatio == null) return 50
  if (volRatio >= 1.5 && volRatio <= 3) return 100
  if (volRatio < 0.5 || volRatio > 6) return 20
  if (volRatio < 1.5) return 20 + lerpScore(volRatio, 0.5, 1.5) * 0.8
  // 3 < volRatio <= 6：100 → 20 線性遞減
  return 100 - lerpScore(volRatio, 3, 6) * 0.8
}

function maScore(stock: Stock): number {
  const { price, ma20, ma60 } = stock
  if (price == null || ma20 == null || ma60 == null) return 50
  const above20 = price >= ma20
  const above60 = price >= ma60
  if (above20 && above60) return 100
  if (above20) return 70
  if (above60) return 50
  return 20
}

/** 近 20 日「收盤漲且量 > 前 5 日均量」天數占比（0–1）；history 不足 → null */
function upVolumeRatio(stock: Stock): number | null {
  const h = stock.history
  if (!h || !h.close || !h.volume) return null
  const n = Math.min(h.close.length, h.volume.length)
  const days = 20
  const need = days + 5 // 額外需要前 5 日均量
  if (n < need + 1) return null
  const close = h.close.slice(n - need - 1)
  const volume = h.volume.slice(n - need - 1)
  let hit = 0
  for (let i = 0; i < days; i++) {
    const idx = need - days + i // 目標日相對索引（>= 5）
    const prevAvgVol =
      (volume[idx - 5] + volume[idx - 4] + volume[idx - 3] + volume[idx - 2] + volume[idx - 1]) / 5
    if (close[idx] > close[idx - 1] && volume[idx] > prevAvgVol) hit++
  }
  return hit / days
}

function patternScore(ratio: number | null): number {
  if (ratio == null) return 50
  const pct = ratio * 100
  if (pct >= 40) return 100
  if (pct <= 10) return 20
  return 20 + lerpScore(pct, 10, 40) * 0.8
}

/** 價漲量縮背離：近 10 日價漲 >5% 但均量 < 前 10 日均量 × 0.7 */
function detectDivergence(stock: Stock): boolean {
  const h = stock.history
  if (!h || !h.close || !h.volume) return false
  const n = Math.min(h.close.length, h.volume.length)
  if (n < 20) return false
  const closeNow = h.close[n - 1]
  const close10Ago = h.close[n - 11]
  if (close10Ago <= 0) return false
  const priceChange = (closeNow - close10Ago) / close10Ago
  if (priceChange <= 0.05) return false
  const last10 = h.volume.slice(n - 10)
  const prev10 = h.volume.slice(n - 20, n - 10)
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  return avg(last10) < avg(prev10) * 0.7
}

/* ---------------- 過熱 ---------------- */

function detectOverheat(stock: Stock): { hit: boolean; reason: string | null } {
  const { ret20, ret60, pct_from_high } = stock
  if (ret20 != null && ret20 > 40) {
    return { hit: true, reason: `近 20 日漲幅 ${r1(ret20)}% > 40%` }
  }
  if (pct_from_high != null && ret60 != null && pct_from_high > -3 && ret60 > 30) {
    return { hit: true, reason: `貼近 52 週新高（${r1(pct_from_high)}%）且近 60 日漲幅 ${r1(ret60)}% > 30%` }
  }
  return { hit: false, reason: null }
}

/* ---------------- 主入口 ---------------- */

export function computeScores(
  stock: Stock,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  industryMedians: Record<string, number> = {},
): ScoreBreakdown {
  const median = industryMedians[stock.industry] ?? null
  const per = perScore(stock.per, median)
  const pbr = pbrScore(stock.pbr)
  const yld = yieldScore(stock.div_yield)
  const rev = revScore(stock.rev_yoy)
  const value_score = 0.4 * per.score + 0.25 * pbr + 0.15 * yld + 0.2 * rev

  const theme_score = themeScore(stock)

  const vol = volScore(stock.vol_ratio)
  const ma = maScore(stock)
  const upRatio = upVolumeRatio(stock)
  const pattern = patternScore(upRatio)
  const volume_price_score = 0.35 * vol + 0.35 * ma + 0.3 * pattern

  const wSum = weights.value + weights.theme + weights.volumePrice
  const raw =
    wSum > 0
      ? (weights.value * value_score + weights.theme * theme_score + weights.volumePrice * volume_price_score) / wSum
      : 0

  const over = detectOverheat(stock)
  const total = raw * (over.hit ? 0.6 : 1)

  return {
    value_score: r1(value_score),
    theme_score: r1(theme_score),
    volume_price_score: r1(volume_price_score),
    total_score: r1(total),
    total_score_raw: r1(raw),
    rating: ratingOf(total),
    overheat: over.hit,
    divergence: detectDivergence(stock),
    per_loss: per.loss,
    overheat_reason: over.reason,
    detail: {
      per_score: r1(per.score),
      pbr_score: r1(pbr),
      yield_score: r1(yld),
      rev_score: r1(rev),
      vol_score: r1(vol),
      ma_score: r1(ma),
      pattern_score: r1(pattern),
      industry_per_median: median,
      up_vol_ratio: upRatio == null ? null : Math.round(upRatio * 1000) / 1000,
    },
  }
}

export function ratingOf(score: number): Rating {
  if (score >= 75) return '強力關注'
  if (score >= 60) return '值得追蹤'
  if (score >= 45) return '中性觀察'
  return '暫不考慮'
}

/** 評級對應的設計色票 hex */
export function ratingColor(score: number): string {
  if (score >= 75) return '#2EBD85'
  if (score >= 60) return '#E8B64C'
  if (score >= 45) return '#F08C3C'
  return '#E5484D'
}

/** 池內產業 PER 中位數 fallback：stocks.json meta 缺該產業時使用 */
export function poolIndustryMedians(stocks: Stock[]): Record<string, number> {
  const groups: Record<string, number[]> = {}
  for (const s of stocks) {
    if (s.per != null && s.per > 0) {
      ;(groups[s.industry] ??= []).push(s.per)
    }
  }
  const out: Record<string, number> = {}
  for (const [ind, arr] of Object.entries(groups)) {
    arr.sort((a, b) => a - b)
    const mid = Math.floor(arr.length / 2)
    out[ind] = arr.length % 2 === 1 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
  }
  return out
}

/** 合併全市場中位數（優先）與池內 fallback */
export function mergeIndustryMedians(
  market: Record<string, number> | undefined,
  stocks: Stock[],
): Record<string, number> {
  const pool = poolIndustryMedians(stocks)
  return { ...pool, ...(market ?? {}) }
}
