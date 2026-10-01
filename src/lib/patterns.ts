/**
 * N 字放量突破型態偵測（純函數，client-side 以 history 計算）
 *
 * 三段式結構：
 *   ① 放量上攻：上攻段內至少一根「量 ≥ 1.8×20日均量 且 單日漲 ≥ 2%」的長紅，
 *      整段自起點漲幅 ≥ 5%
 *   ② 量縮盤整：3–12 天，均量降至上攻段均量的 75% 以下，
 *      收盤回檔不破前高 −8%（守住漲幅），區間振幅 ≤ 10%
 *   ③ 放量突破：最近 3 個交易日內，收盤創段高（突破前高），
 *      成交量 ≥ 盤整均量 1.5 倍，且當日收漲
 */
import type { Stock } from './types'

export interface VolumeBreakout {
  /** ① 放量上攻日（段內最大量長紅日，YYYY-MM-DD） */
  surgeDate: string
  /** ① 上攻段漲幅 %（起漲前收盤 → 段高點） */
  leg1GainPct: number
  /** ② 盤整天數 */
  consolDays: number
  /** ② 盤整振幅 %（(高−低)/低） */
  consolRangePct: number
  /** ② 盤整均量 ÷ 上攻均量（<1 代表量縮） */
  consolVolRatio: number
  /** ③ 突破日（YYYY-MM-DD） */
  breakoutDate: string
  /** ③ 突破日量 ÷ 盤整均量 */
  breakoutVolRatio: number
  /** ③ 突破收盤價 */
  breakoutClose: number
  /** 前高（上攻+盤整期最高收盤） */
  prevHigh: number
  /** 突破日距資料最後一日的交易日數（0 = 最後一天就是突破日） */
  daysAgo: number
}

const WINDOW = 45 // 只掃最近 45 根 K 棒
const BREAKOUT_WITHIN = 3 // 突破日須落在最後 3 個交易日內
const CONSOL_MIN = 3
const CONSOL_MAX = 12
const LEG1_MIN = 3
const LEG1_MAX = 15

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

export function detectVolumeBreakout(stock: Stock): VolumeBreakout | null {
  const h = stock.history
  if (!h?.close || !h.volume || !h.dates) return null
  const n = Math.min(h.close.length, h.volume.length, h.dates.length)
  if (n < 45) return null

  const close = h.close.slice(n - WINDOW)
  const volume = h.volume.slice(n - WINDOW)
  const dates = h.dates.slice(n - WINDOW)
  const m = close.length // = WINDOW

  // 20 日均量（資料前段不足時用可得部分）
  const volMA = (i: number) => avg(volume.slice(Math.max(0, i - 19), i + 1))

  // 突破日 B：由最近一天往回找（0 = 最新交易日）
  for (let ago = 0; ago < BREAKOUT_WITHIN; ago++) {
    const B = m - 1 - ago

    for (let C = CONSOL_MIN; C <= CONSOL_MAX; C++) {
      const cs = B - C // 盤整段起點 [cs, B-1]
      if (cs < 0) break
      const consolClose = close.slice(cs, B)
      const consolVol = volume.slice(cs, B)

      for (let L = LEG1_MIN; L <= LEG1_MAX; L++) {
        const s1 = cs - L // 上攻段起點 [s1, cs-1]
        if (s1 < 1) break // 需要 s1-1 作為起漲前收盤

        const leg1Vol = volume.slice(s1, cs)
        const baseClose = close[s1 - 1]

        // ① 放量上攻：段內至少一根放量長紅
        let surgeIdx = -1
        let surgeVol = 0
        for (let i = 0; i < L; i++) {
          const gi = s1 + i
          if (
            volume[gi] >= 1.8 * volMA(gi) &&
            close[gi] >= close[gi - 1] * 1.02 &&
            volume[gi] > surgeVol
          ) {
            surgeIdx = gi
            surgeVol = volume[gi]
          }
        }
        if (surgeIdx < 0) continue

        const prevHigh = Math.max(...close.slice(s1, B)) // 上攻+盤整最高收盤
        const leg1Gain = prevHigh / baseClose - 1
        if (leg1Gain < 0.05) continue // 上攻段漲幅 ≥ 5%

        // ③ 放量突破（先驗，不符就不必細算盤整）
        if (close[B] <= prevHigh || close[B] <= close[B - 1]) continue
        const consolAvgVol = avg(consolVol)
        const breakoutVolRatio = volume[B] / consolAvgVol
        if (breakoutVolRatio < 1.5) continue

        // ② 量縮盤整
        const leg1AvgVol = avg(leg1Vol)
        const consolVolRatio = consolAvgVol / leg1AvgVol
        if (consolVolRatio > 0.75) continue
        const cMin = Math.min(...consolClose)
        const cMax = Math.max(...consolClose)
        if (cMin < prevHigh * 0.92) continue // 回檔守前高 −8% 內
        if (cMin < baseClose * 1.02) continue // 不把漲幅回吐光
        if ((cMax - cMin) / cMin > 0.1) continue // 振幅 ≤ 10%

        return {
          surgeDate: dates[surgeIdx],
          leg1GainPct: leg1Gain * 100,
          consolDays: C,
          consolRangePct: ((cMax - cMin) / cMin) * 100,
          consolVolRatio,
          breakoutDate: dates[B],
          breakoutVolRatio,
          breakoutClose: close[B],
          prevHigh,
          daysAgo: ago,
        }
      }
    }
  }
  return null
}
