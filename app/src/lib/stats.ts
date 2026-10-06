/** 首頁用的衍生統計（全部由 stocks.json 真實計算） */
import type { Stock, Theme } from './types'
import { computeScores, DEFAULT_WEIGHTS, type ScoreBreakdown, type ScoreWeights } from './scoring'

export interface ScoredStock {
  stock: Stock
  scores: ScoreBreakdown
}

export function scoreAll(
  stocks: Stock[],
  industryMedians: Record<string, number>,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): ScoredStock[] {
  return stocks.map((stock) => ({ stock, scores: computeScores(stock, weights, industryMedians) }))
}

export interface ThemeStat {
  theme: Theme
  /** 池內標的數（題材定義與追蹤池交集） */
  count: number
  /** 平均低估分 */
  avgValue: number
  /** 題材動能：成員平均量價分 0–100 */
  momentum: number
  /** 成員平均近 20 日漲跌幅（%），全缺則 null */
  avgRet20: number | null
  /** 成員平均綜合分 */
  avgTotal: number
}

export function themeStats(scored: ScoredStock[], themes: Theme[]): ThemeStat[] {
  const byCode = new Map(scored.map((s) => [s.stock.code, s]))
  return themes.map((theme) => {
    const members = theme.stocks
      .map((ref) => byCode.get(ref.code))
      .filter((s): s is ScoredStock => Boolean(s))
    const n = members.length
    const avg = (f: (s: ScoredStock) => number) => (n ? members.reduce((a, s) => a + f(s), 0) / n : 0)
    const rets = members.map((s) => s.stock.ret20).filter((v): v is number => v != null)
    return {
      theme,
      count: n,
      avgValue: avg((s) => s.scores.value_score),
      momentum: avg((s) => s.scores.volume_price_score),
      avgRet20: rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : null,
      avgTotal: avg((s) => s.scores.total_score),
    }
  })
}

/** 池內等權「大盤脈動」指數：各股收盤價以起始日正規化後平均（近 80 日） */
export function poolIndex(stocks: Stock[], days = 80): number[] {
  const series: number[][] = []
  for (const s of stocks) {
    const close = s.history?.close
    if (!close || close.length < 10) continue
    const slice = close.slice(-days)
    const base = slice[0]
    if (!base) continue
    series.push(slice.map((v) => (v / base) * 100))
  }
  if (!series.length) return []
  const len = Math.min(...series.map((a) => a.length))
  const out: number[] = []
  for (let i = 0; i < len; i++) {
    let sum = 0
    for (const a of series) sum += a[a.length - len + i]
    out.push(sum / series.length)
  }
  return out
}
