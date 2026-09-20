/** Screener 頁共用：型別、常數、篩選與排序邏輯 */
import type { Rating, ScoreWeights } from '@/lib/scoring'
import type { ScoredStock } from '@/lib/stats'

export const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number]
export const EASE_STD = [0.4, 0, 0.2, 1] as [number, number, number, number]
/** 表格列重排 spring（全站招牌互動） */
export const ROW_SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

export type MarketFilter = 'all' | 'TW' | 'TPEx'
export type RatingFilter = 'all' | Rating
export type SortKey = 'name' | 'price' | 'value' | 'theme' | 'vp' | 'total'

export interface SortState {
  key: SortKey | null
  dir: 'asc' | 'desc'
}

export const DEFAULT_SORT: SortState = { key: null, dir: 'desc' }

export interface Filters {
  themes: string[]
  market: MarketFilter
  rating: RatingFilter
  excludeOverheat: boolean
  onlyVpStrong: boolean
  onlyHighPurity: boolean
  /** PER 區間輸入框原始字串（空 = 不設限） */
  perMin: string
  perMax: string
  search: string
}

export const DEFAULT_FILTERS: Filters = {
  themes: [],
  market: 'all',
  rating: 'all',
  excludeOverheat: true,
  onlyVpStrong: false,
  onlyHighPurity: false,
  perMin: '',
  perMax: '',
  search: '',
}

export const RATING_OPTIONS: { value: RatingFilter; label: string; color: string }[] = [
  { value: 'all', label: '全部評級', color: '#9AA7B8' },
  { value: '強力關注', label: '強力關注', color: '#2EBD85' },
  { value: '值得追蹤', label: '值得追蹤', color: '#E8B64C' },
  { value: '中性觀察', label: '中性觀察', color: '#F08C3C' },
  { value: '暫不考慮', label: '暫不考慮', color: '#E5484D' },
]

/** 量價轉強門檻：量價分 ≥ 60 */
export const VP_STRONG_MIN = 60

const numOrNull = (s: string): number | null => {
  if (s.trim() === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** 過熱開關以外的所有篩選條件（用於計算「已過熱剔除」數） */
export function passesBaseFilters(s: ScoredStock, f: Filters, query: string): boolean {
  const { stock, scores } = s
  if (f.themes.length > 0 && !stock.themes.some((t) => f.themes.includes(t.id))) return false
  if (f.market !== 'all' && stock.market !== f.market) return false
  if (f.rating !== 'all' && scores.rating !== f.rating) return false
  if (f.onlyVpStrong && scores.volume_price_score < VP_STRONG_MIN) return false
  if (f.onlyHighPurity && !stock.themes.some((t) => t.purity === 'high')) return false
  const lo = numOrNull(f.perMin)
  const hi = numOrNull(f.perMax)
  if (lo != null || hi != null) {
    if (stock.per == null || stock.per <= 0) return false
    if (lo != null && stock.per < lo) return false
    if (hi != null && stock.per > hi) return false
  }
  if (query) {
    const q = query.toLowerCase()
    if (!stock.code.toLowerCase().includes(q) && !stock.name.toLowerCase().includes(q)) return false
  }
  return true
}

/** 非預設條件數（過熱開關關閉也算一個非預設狀態） */
export function activeFilterCount(f: Filters, query: string): number {
  let n = 0
  if (f.themes.length > 0) n++
  if (f.market !== 'all') n++
  if (f.rating !== 'all') n++
  if (!f.excludeOverheat) n++
  if (f.onlyVpStrong) n++
  if (f.onlyHighPurity) n++
  if (numOrNull(f.perMin) != null || numOrNull(f.perMax) != null) n++
  if (query.trim() !== '') n++
  return n
}

/** 排序比較器；key 為 null 時回歸預設（綜合分降冪） */
export function compareBy(sort: SortState): (a: ScoredStock, b: ScoredStock) => number {
  const key = sort.key ?? 'total'
  const dir = sort.key == null ? 'desc' : sort.dir
  const sign = dir === 'asc' ? 1 : -1
  const val = (s: ScoredStock): number | string => {
    switch (key) {
      case 'name':
        return s.stock.name
      case 'price':
        return s.stock.price ?? Number.NEGATIVE_INFINITY
      case 'value':
        return s.scores.value_score
      case 'theme':
        return s.scores.theme_score
      case 'vp':
        return s.scores.volume_price_score
      default:
        return s.scores.total_score
    }
  }
  return (a, b) => {
    const va = val(a)
    const vb = val(b)
    let c =
      typeof va === 'string' || typeof vb === 'string'
        ? String(va).localeCompare(String(vb), 'zh-Hant')
        : va - vb
    if (c === 0) c = b.scores.total_score - a.scores.total_score
    return c * sign
  }
}

/** 正規化後的權重百分比（四捨五入，合計 100） */
export function normalizedWeights(w: ScoreWeights): ScoreWeights {
  const sum = w.value + w.theme + w.volumePrice
  if (sum <= 0) return { value: 0, theme: 0, volumePrice: 0 }
  const v = Math.round((w.value / sum) * 100)
  const t = Math.round((w.theme / sum) * 100)
  return { value: v, theme: t, volumePrice: 100 - v - t }
}

