import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
} from 'lightweight-charts'
import type { IChartApi, IPriceLine, ISeriesApi, MouseEventParams, Time } from 'lightweight-charts'
import type { Stock } from '@/lib/types'
import { cn } from '@/lib/utils'

const UP = '#F0506E'
const DOWN = '#2EBD85'
const GOLD = '#E8B64C'
const CYAN = '#4CC3E8'
const MUTED = '#5B6B7F'

type RangeDays = 80 | 40 | 20
const RANGES: RangeDays[] = [80, 40, 20]

/** 簡單移動平均（對齊原序列，前 period-1 日為 null） */
function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = []
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    out.push(i >= period - 1 ? sum / period : null)
  }
  return out
}

interface HoverInfo {
  date: string
  close: number | null
  volume: number | null
}

interface PriceChartProps {
  stock: Stock
}

/** Section 3 — 價量走勢圖：lightweight-charts 雙 pane（收盤面積圖 + 成交量），MA20/MA60 疊線、52W 高價線 */
export default function PriceChart({ stock }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const areaRef = useRef<ISeriesApi<'Area'> | null>(null)
  const ma20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ma60Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const volMaRef = useRef<ISeriesApi<'Line'> | null>(null)
  const priceLineRef = useRef<IPriceLine | null>(null)

  const [range, setRange] = useState<RangeDays>(80)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  const history = stock.history

  /* ---------- 完整序列預先計算（MA 對齊用） ---------- */
  const series = useMemo(() => {
    if (!history || history.close.length === 0) return null
    const { dates, close, volume } = history
    const n = Math.min(dates.length, close.length, volume.length)
    const d = dates.slice(0, n)
    const c = close.slice(0, n)
    const v = volume.slice(0, n)
    return {
      dates: d,
      close: c,
      volume: v,
      ma20: sma(c, 20),
      ma60: sma(c, 60),
      volMa20: sma(v, 20),
    }
  }, [history])

  /** 依 range 切片後的圖表資料 */
  const chartData = useMemo(() => {
    if (!series) return null
    const n = series.close.length
    const start = Math.max(0, n - range)
    const sliceFrom = (arr: readonly (number | null)[]) => arr.slice(start)
    const closes = sliceFrom(series.close) as number[]
    const vols = sliceFrom(series.volume) as number[]
    const dates = series.dates.slice(start)
    const upTrend = closes[closes.length - 1] >= closes[0]
    const lineColor = upTrend ? UP : DOWN
    return {
      dates,
      area: closes.map((value, i) => ({ time: dates[i] as Time, value })),
      ma20: (sliceFrom(series.ma20) as (number | null)[])
        .map((v, i) => (v == null ? null : { time: dates[i] as Time, value: v }))
        .filter((p): p is { time: Time; value: number } => p !== null),
      ma60: (sliceFrom(series.ma60) as (number | null)[])
        .map((v, i) => (v == null ? null : { time: dates[i] as Time, value: v }))
        .filter((p): p is { time: Time; value: number } => p !== null),
      volume: vols.map((value, i) => {
        const idx = start + i
        const prev = idx > 0 ? series.close[idx - 1] : value
        const up = series.close[idx] >= prev
        return {
          time: dates[i] as Time,
          value,
          color: up ? 'rgba(240,80,110,0.45)' : 'rgba(46,189,133,0.45)',
        }
      }),
      volMa20: (sliceFrom(series.volMa20) as (number | null)[])
        .map((v, i) => (v == null ? null : { time: dates[i] as Time, value: v }))
        .filter((p): p is { time: Time; value: number } => p !== null),
      lineColor,
      last: {
        date: dates[dates.length - 1],
        close: closes[closes.length - 1],
        volume: vols[vols.length - 1],
      },
    }
  }, [series, range])

  /* ---------- 建圖（僅一次 / 換股時） ---------- */
  useEffect(() => {
    const el = containerRef.current
    if (!el || !series) return

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: MUTED,
        fontSize: 11,
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(35,43,56,0.5)' },
        horzLines: { color: 'rgba(35,43,56,0.5)' },
      },
      rightPriceScale: { borderColor: '#232B38' },
      timeScale: { borderColor: '#232B38', rightOffset: 2 },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#334052', labelBackgroundColor: '#1A2029' },
        horzLine: { color: '#334052', labelBackgroundColor: '#1A2029' },
      },
      localization: { locale: 'zh-TW' },
    })
    chartRef.current = chart

    // 主圖（pane 0，70%）：收盤價面積圖
    const area = chart.addSeries(
      AreaSeries,
      {
        lineColor: UP,
        lineWidth: 2,
        topColor: 'rgba(240,80,110,0.20)',
        bottomColor: 'rgba(240,80,110,0)',
        priceLineVisible: false,
        crosshairMarkerRadius: 3,
      },
      0,
    )
    areaRef.current = area

    const ma20 = chart.addSeries(
      LineSeries,
      { color: GOLD, lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, crosshairMarkerVisible: false },
      0,
    )
    ma20Ref.current = ma20
    const ma60 = chart.addSeries(
      LineSeries,
      { color: CYAN, lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, crosshairMarkerVisible: false },
      0,
    )
    ma60Ref.current = ma60

    // 副圖（pane 1，30%）：成交量
    const vol = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: 'volume' }, priceLineVisible: false },
      1,
    )
    volRef.current = vol
    const volMa = chart.addSeries(
      LineSeries,
      { color: 'rgba(232,236,241,0.7)', lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false },
      1,
    )
    volMaRef.current = volMa

    chart.panes()[0].setStretchFactor(0.7)
    chart.panes()[1].setStretchFactor(0.3)
    // 注意：不可對 pane 1 的 right scale 設 visible:false —
    // lightweight-charts v5 在 chart 層級右軸可見時，會對每個 pane 索取右軸 widget，
    // 隱藏會導致 _adjustSizeImpl 拋「Value is null」使整張圖無法渲染。
    // 改以縮小刻度文字呈現成交量軸。
    chart.priceScale('right', 1).applyOptions({
      borderVisible: false,
      scaleMargins: { top: 0.1, bottom: 0 },
    })

    // 十字線資訊 → 圖例列
    const onMove = (param: MouseEventParams) => {
      if (!param.time) {
        setHover(null)
        return
      }
      const a = param.seriesData.get(area) as { value?: number } | undefined
      const vv = param.seriesData.get(vol) as { value?: number } | undefined
      setHover({
        date: String(param.time),
        close: a?.value ?? null,
        volume: vv?.value ?? null,
      })
    }
    chart.subscribeCrosshairMove(onMove)

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      chart.applyOptions({ width: Math.floor(width), height: Math.floor(height) })
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.unsubscribeCrosshairMove(onMove)
      chart.remove()
      chartRef.current = null
    }
  }, [stock.code, series])

  /* ---------- 資料更新（初次 + 切換時間範圍） ---------- */
  useEffect(() => {
    if (!chartData || !chartRef.current) return
    const { area, ma20, ma60, volume, volMa20, lineColor } = chartData
    areaRef.current?.applyOptions({
      lineColor,
      topColor: `${lineColor}33`,
      bottomColor: `${lineColor}00`,
    })
    areaRef.current?.setData(area)
    ma20Ref.current?.setData(ma20)
    ma60Ref.current?.setData(ma60)
    volRef.current?.setData(volume)
    volMaRef.current?.setData(volMa20)

    // 52 週高點水平虛線（重建前先清掉舊的）
    if (priceLineRef.current && areaRef.current) {
      areaRef.current.removePriceLine(priceLineRef.current)
      priceLineRef.current = null
    }
    if (stock.high_52w != null && areaRef.current) {
      priceLineRef.current = areaRef.current.createPriceLine({
        price: stock.high_52w,
        color: MUTED,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '52W高',
      })
    }
    chartRef.current.timeScale().fitContent()
  }, [chartData, stock.high_52w])

  if (!series || !chartData) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-5">
        <p className="py-24 text-center text-sm text-text-muted">此標的無歷史價量資料</p>
      </div>
    )
  }

  const info = hover ?? chartData.last

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5">
      {/* 圖例列 + 時間範圍切換 */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <LegendDot color={chartData.lineColor} label="收盤價" />
          <LegendDot color={GOLD} label="MA20" dashed />
          <LegendDot color={CYAN} label="MA60" dashed />
          {stock.high_52w != null && <LegendDot color={MUTED} label="52W高" dashed />}
          <span className="num hidden text-xs text-text-muted sm:inline">
            {info.date}
            {info.close != null && ` · 收 ${info.close.toFixed(2)}`}
            {info.volume != null && ` · 量 ${Math.round(info.volume).toLocaleString('zh-TW')} 張`}
          </span>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-border-subtle">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r)
                setHover(null)
              }}
              className={cn(
                'num px-3 py-1.5 text-xs transition-colors',
                range === r ? 'bg-elevated text-accent-gold' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {r}日
            </button>
          ))}
        </div>
      </div>

      {/* 圖表本體：掛載時由左向右揭示（1200ms）；手機 240px / 桌機 480px。
          注意：不可用 whileInView — 與 Lenis 平滑捲動並存時 IntersectionObserver
          可能不觸發，clip-path 會卡住把整張圖裁掉。 */}
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div ref={containerRef} className="h-[240px] w-full lg:h-[480px]" />
      </motion.div>

      <p className="num mt-2 text-xs text-text-muted sm:hidden">
        {info.date}
        {info.close != null && ` · 收 ${info.close.toFixed(2)}`}
        {info.volume != null && ` · 量 ${Math.round(info.volume).toLocaleString('zh-TW')} 張`}
      </p>
    </div>
  )
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
      {dashed ? (
        <span className="inline-block h-0 w-3.5 border-t border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
    </span>
  )
}
