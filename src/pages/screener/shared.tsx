/** Screener 頁共用元件：動畫數字、綜合分徽章、市場別 chip */
import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { ratingColor } from '@/lib/scoring'
import { EASE_STD } from './utils'
import { cn } from '@/lib/utils'

/** 250ms 數字過渡（權重改變時綜合分平滑跳到新值） */
export function AnimatedNumber({
  value,
  decimals = 1,
  className,
}: {
  value: number
  decimals?: number
  className?: string
}) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = value
    if (from === value) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const raf = requestAnimationFrame(() => setDisplay(value))
      return () => cancelAnimationFrame(raf)
    }
    const controls = animate(from, value, {
      duration: 0.25,
      ease: EASE_STD,
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display.toFixed(decimals)}
    </span>
  )
}

/** 綜合分徽章（放大版）：數字 250ms 過渡 + 色階即時漸變 + 名次升降箭頭 */
export function TotalBadge({
  score,
  delta,
  faded = false,
}: {
  score: number
  /** 對比上次權重計算的名次變化（正 = 上升）；null 不顯示 */
  delta: number | null
  faded?: boolean
}) {
  const color = ratingColor(score)
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="num inline-flex h-8 w-16 items-center justify-center rounded-lg text-[15px] font-semibold transition-colors duration-200"
        style={{ backgroundColor: `${color}2E`, color, opacity: faded ? 0.65 : 1 }}
      >
        <AnimatedNumber value={score} />
      </span>
      {delta != null && delta !== 0 && (
        <span
          className={cn('num text-[10px] leading-none', delta > 0 ? 'text-up-red' : 'text-down-green')}
          title={`名次${delta > 0 ? '上升' : '下降'} ${Math.abs(delta)}`}
        >
          {delta > 0 ? '▲' : '▼'}
        </span>
      )}
    </span>
  )
}

/** 市場別小 chip：上市=青邊 / 上櫃=紫邊 */
export function MarketChip({ market }: { market: 'TW' | 'TPEx' }) {
  const isTW = market === 'TW'
  return (
    <span
      className="inline-flex items-center rounded border px-1 py-px text-[10px] leading-tight"
      style={{
        color: isTW ? '#4CC3E8' : '#8B7CF6',
        borderColor: isTW ? '#4CC3E866' : '#8B7CF666',
      }}
    >
      {isTW ? '上市' : '上櫃'}
    </span>
  )
}
