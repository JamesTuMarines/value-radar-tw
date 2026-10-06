/** 台股選股工具 — 資料型別定義（對應 /data/stocks.json 與 /data/themes.json） */

export type Market = 'TW' | 'TPEx'
export type Purity = 'high' | 'mid' | 'low'

export interface StockThemeRef {
  id: string
  purity: Purity
}

export interface StockHistory {
  dates: string[]
  close: number[]
  volume: number[]
}

/** 三大法人籌碼（單位：張，正值=淨買超、負值=淨賣超） */
export interface StockChips {
  foreign_5d: number
  foreign_20d: number
  trust_5d: number
  trust_20d: number
  dealer_20d: number
  total_20d: number
  /** 統計涵蓋交易日數 */
  days: number
  /** 外資持股比例（%，主力動向） */
  foreign_ratio?: number
  /** 外資持股比例近 20 交易日變化（百分點，正=主力加碼） */
  foreign_ratio_chg_20d?: number
}

export interface Stock {
  code: string
  name: string
  market: Market
  industry: string
  themes: StockThemeRef[]
  price: number | null
  change_pct: number | null
  per: number | null
  pbr: number | null
  div_yield: number | null
  rev_yoy: number | null
  ma20: number | null
  ma60: number | null
  vol_ratio: number | null
  ret20: number | null
  ret60: number | null
  high_52w: number | null
  pct_from_high: number | null
  avg_vol_20: number | null
  avg_vol_60: number | null
  chips: StockChips | null
  history: StockHistory | null
}

export interface StocksPayload {
  as_of: string
  generated_at: string
  sources: string[]
  /** 全市場各產業 PER 中位數 */
  industry_per_median: Record<string, number>
  stocks: Stock[]
}

export interface ThemeStockRef {
  code: string
  purity: Purity
  note: string
}

export interface Theme {
  id: string
  name: string
  icon: string
  outlook: string
  stocks: ThemeStockRef[]
}
