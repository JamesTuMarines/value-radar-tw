/** Section 2 — 權重控制台（桌面 sticky 面板與 mobile drawer 共用內容） */
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import WeightSlider from '@/components/WeightSlider'
import Tooltip from '@/components/Tooltip'
import type { ScoreWeights } from '@/lib/scoring'
import { normalizedWeights } from './utils'
import { cn } from '@/lib/utils'

const SLIDERS = [
  { key: 'value', label: '低估權重', color: '#E8B64C' },
  { key: 'theme', label: '題材權重', color: '#4CC3E8' },
  { key: 'volumePrice', label: '量價權重', color: '#8B7CF6' },
] as const

export interface WeightSummary {
  matched: number
  overheatExcluded: number
  avgScore: number | null
}

interface WeightPanelInnerProps {
  weights: ScoreWeights
  onChange: (w: ScoreWeights) => void
  summary: WeightSummary
}

/** 面板內容：標題列 + 三支滑桿 + 結果摘要（ drawer 內也重用） */
export function WeightPanelBody({ weights, onChange, summary }: WeightPanelInnerProps) {
  const sum = weights.value + weights.theme + weights.volumePrice
  const norm = normalizedWeights(weights)

  return (
    <div>
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <Tooltip content="拖曳滑桿，排行榜即時重算">
          <span className="cursor-help text-[13px] font-bold text-text-primary">評分權重</span>
        </Tooltip>
        <span className="num text-xs text-text-muted">
          權重總和 <span className="text-text-secondary">{sum}%</span>
          {sum !== 100 && sum > 0 && (
            <span className="ml-2 text-accent-gold">
              正規化 {norm.value}/{norm.theme}/{norm.volumePrice}
            </span>
          )}
        </span>
      </div>

      {/* 滑桿 + 摘要 */}
      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
        {SLIDERS.map((s) => (
          <div key={s.key} className="flex-1">
            <WeightSlider
              label={s.label}
              value={weights[s.key]}
              color={s.color}
              onChange={(v) => onChange({ ...weights, [s.key]: v })}
            />
            <div className="mt-1 flex justify-between text-[10px] text-text-muted">
              <span className="num">0</span>
              <span className="num">100</span>
            </div>
          </div>
        ))}

        {/* 結果摘要 */}
        <div className="flex shrink-0 flex-col justify-center gap-1 rounded-lg bg-inset px-4 py-3 lg:w-40">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-text-muted">符合條件</span>
            <span className="num text-[28px] font-semibold leading-none text-text-primary">{summary.matched}</span>
            <span className="text-xs text-text-muted">檔</span>
          </div>
          <span className="num text-xs text-warn-amber">已過熱剔除 {summary.overheatExcluded} 檔</span>
          <span className="num text-xs text-text-muted">
            平均分 {summary.avgScore == null ? '—' : summary.avgScore.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  )
}

interface WeightPanelProps extends WeightPanelInnerProps {
  /** 頁面已捲動（面板浮起加邊框與陰影） */
  scrolled: boolean
}

/** 桌面版 sticky 權重面板（含金邊微光脈衝） */
export default function WeightPanel({ weights, onChange, summary, scrolled }: WeightPanelProps) {
  const glowRef = useRef<HTMLDivElement>(null)
  const firstRun = useRef(true)
  const timerRef = useRef<{ on?: number; off?: number }>({})

  // 放開滑桿（停止變動 350ms）→ 300ms 金色微光脈衝，暗示「已重算」
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const el = glowRef.current
    const timers = timerRef.current
    timers.on = window.setTimeout(() => {
      if (!el) return
      el.style.boxShadow = '0 0 0 1px rgba(232,182,76,0.55), 0 0 24px rgba(232,182,76,0.22)'
      timers.off = window.setTimeout(() => {
        if (el) el.style.boxShadow = '0 0 0 0px rgba(232,182,76,0), 0 0 0 rgba(232,182,76,0)'
      }, 300)
    }, 350)
    return () => {
      window.clearTimeout(timers.on)
      window.clearTimeout(timers.off)
    }
  }, [weights])

  return (
    <motion.div
      ref={glowRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-surface p-6 transition-[border-color] duration-200',
        scrolled ? 'border-border-strong shadow-card' : 'border-border-subtle',
      )}
      style={{ transition: 'box-shadow 300ms ease, border-color 200ms ease' }}
    >
      {/* 極淡網格紋理疊層 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{ backgroundImage: 'url(/grid-texture.svg)', backgroundRepeat: 'repeat' }}
        aria-hidden
      />
      <div className="relative">
        <WeightPanelBody weights={weights} onChange={onChange} summary={summary} />
      </div>
    </motion.div>
  )
}
