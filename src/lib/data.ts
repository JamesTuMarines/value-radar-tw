/** 資料層：fetch /data/stocks.json 與 /data/themes.json，含 loading/error 狀態 */
import { useEffect, useState } from 'react'
import type { Stock, StocksPayload, Theme } from './types'
import { mergeIndustryMedians } from './scoring'

export interface StocksData {
  asOf: string
  sources: string[]
  stocks: Stock[]
  /** 產業 PER 中位數（全市場優先，缺時 fallback 池內中位數） */
  industryMedians: Record<string, number>
}

export interface DataState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`載入 ${url} 失敗（HTTP ${res.status}）`)
  return (await res.json()) as T
}

export function useStocks(): DataState<StocksData> {
  const [state, setState] = useState<DataState<StocksData>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    fetchJson<StocksPayload>('/data/stocks.json')
      .then((payload) => {
        if (cancelled) return
        setState({
          data: {
            asOf: payload.as_of,
            sources: payload.sources ?? [],
            stocks: payload.stocks ?? [],
            industryMedians: mergeIndustryMedians(payload.industry_per_median, payload.stocks ?? []),
          },
          loading: false,
          error: null,
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({ data: null, loading: false, error: err instanceof Error ? err.message : '資料載入失敗' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

export function useThemes(): DataState<Theme[]> {
  const [state, setState] = useState<DataState<Theme[]>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    fetchJson<Theme[]>('/data/themes.json')
      .then((themes) => {
        if (cancelled) return
        setState({ data: themes, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({ data: null, loading: false, error: err instanceof Error ? err.message : '資料載入失敗' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

/** 題材 id → 設計色票 */
export const THEME_COLORS: Record<string, string> = {
  siphotonics: '#8B7CF6',
  ai_server: '#4CC3E8',
  memory: '#F0506E',
  advanced_packaging: '#E8B64C',
  thermal: '#3DD6C6',
  power: '#F08C3C',
  satellite: '#6E9BFF',
  robot: '#A3D65C',
}

/** 題材 id → 英文小代號 */
export const THEME_TICKER: Record<string, string> = {
  siphotonics: 'SiPh · CPO',
  ai_server: 'AI SERVER',
  memory: 'MEM · HBM',
  advanced_packaging: 'ADV PKG',
  thermal: 'COOLING',
  power: 'POWER',
  satellite: 'LEO SAT',
  robot: 'ROBOTICS',
}

export function themeColor(id: string): string {
  return THEME_COLORS[id] ?? '#9AA7B8'
}
