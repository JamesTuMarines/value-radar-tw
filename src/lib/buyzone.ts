/**
 * 建議買進區間 — 以技術支撐 + 估值錨計算，供個股頁與篩選器顯示。
 * 設計原則：分批買進區間 + 參考停損，皆為機械式規則，非投資建議。
 */
import type { Stock } from './types'

export interface BuyZone {
  /** 建議買進區間下緣 */
  low: number
  /** 建議買進區間上緣 */
  high: number
  /** 參考停損價（跌破區間結構即失效） */
  stop: number
  /** 現價相對區間位置 */
  position: 'below' | 'inside' | 'above'
  /** 策略說明（依趨勢狀態給不同文案） */
  note: string
  /** 趨勢狀態：強勢 / 盤整 / 弱勢 */
  trend: 'strong' | 'range' | 'weak'
}

const r2 = (v: number) => Math.round(v * 100) / 100

/** 近 n 日最低收盤 */
function lowOf(arr: number[], n: number): number | null {
  const seg = arr.slice(-n)
  return seg.length ? Math.min(...seg) : null
}

/**
 * 規則：
 *  - 強勢（價 > MA20 且 MA20 > MA60）：回測月線分批 → [MA20×0.97, MA20×1.02]，停損 MA60×0.95
 *  - 盤整（價在 MA20~MA60 之間 或 MA20≤MA60 但價>MA60）：[max(MA60, 60日低)×0.99, MA20×1.02]，停損 60日低×0.95
 *  - 弱勢（價 < MA60）：左側區間 [60日低×0.98, MA60]，停損 60日低×0.94，文案警示風險
 *  - 資料不足 → null
 */
export function computeBuyZone(stock: Stock, overheat = false): BuyZone | null {
  const { price, ma20, ma60 } = stock
  if (price == null || ma20 == null || ma60 == null) return null
  const closes = stock.history?.close ?? []
  const low20 = lowOf(closes, 20)
  const low60 = lowOf(closes, 60)
  if (low20 == null || low60 == null) return null

  let low: number, high: number, stop: number, trend: BuyZone['trend'], note: string

  if (price > ma20 && ma20 > ma60) {
    trend = 'strong'
    low = ma20 * 0.97
    high = ma20 * 1.02
    stop = ma60 * 0.95
    note = '多頭排列，建議等待回測月線（MA20）附近分批佈局，跌破季線結構出場'
  } else if (price > ma60) {
    trend = 'range'
    low = Math.max(ma60, low60) * 0.99
    high = ma20 * 1.02
    stop = low60 * 0.95
    note = '區間整理，建議靠近季線與前低支撐分批，突破月線可加碼'
  } else {
    trend = 'weak'
    low = low60 * 0.98
    high = ma60
    stop = low60 * 0.94
    note = '股價位於季線之下，屬左側交易，僅適合小量試單並嚴設停損'
  }

  if (overheat) {
    note = '近期漲幅過大已觸發過熱降評，強烈建議等待回測至區間內再分批，勿追高'
  }
  if (high < low) high = low * 1.04

  const position: BuyZone['position'] =
    price < low ? 'below' : price > high ? 'above' : 'inside'

  return { low: r2(low), high: r2(high), stop: r2(stop), position, note, trend }
}
