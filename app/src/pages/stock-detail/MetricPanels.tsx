import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Check, X } from 'lucide-react'
import ChangeText from '@/components/ChangeText'
import ScoreBadge from '@/components/ScoreBadge'
import Tooltip from '@/components/Tooltip'
import type { ScoreBreakdown } from '@/lib/scoring'
import type { Stock } from '@/lib/types'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]
const GOLD = '#E8B64C'
const PURPLE = '#8B7CF6'

/* ---------------- 通用列骨架 ---------------- */
function MetricRow({
  label,
  tip,
  children,
  delay,
}: {
  label: string
  tip: string
  children: ReactNode
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
      className="border-b border-border-subtle/50 py-4 last:border-b-0"
    >
      <Tooltip content={tip}>
        <p className="cursor-help text-[13px] font-medium text-text-secondary underline decoration-dotted decoration-text-muted/50 underline-offset-4">
          {label}
        </p>
      </Tooltip>
      <div className="mt-2">{children}</div>
    </motion.div>
  )
}

/* ---------------- PER 相對位置條：灰條 + 產業中位白刻度 + 本股金點 ---------------- */
function PerPositionBar({ per, median }: { per: number; median: number }) {
  const max = Math.max(per, median * 1.5) * 1.15
  const perPct = Math.min(100, (per / max) * 100)
  const medPct = Math.min(100, (median / max) * 100)
  return (
    <div className="relative mt-1 h-2 w-full rounded-full bg-inset">
      {/* 產業中位數白色刻度線 */}
      <span
        className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 bg-text-primary/80"
        style={{ left: `${medPct}%` }}
        title={`產業中位數 ${median.toFixed(1)}`}
      />
      {/* 本股金色圓點（進場自左端滑入） */}
      <motion.span
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas"
        style={{ backgroundColor: GOLD }}
        initial={{ left: '0%' }}
        whileInView={{ left: `${perPct}%` }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
      />
    </div>
  )
}

/* ---------------- 52 週位置條：左=近120日低，右=52W高 ---------------- */
function YearRangeBar({ low, high, current }: { low: number; high: number; current: number }) {
  const span = high - low || 1
  const pct = Math.min(100, Math.max(0, ((current - low) / span) * 100))
  return (
    <div>
      <div className="relative mt-1 h-2 w-full rounded-full bg-inset">
        <motion.span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas"
          style={{ backgroundColor: PURPLE }}
          initial={{ left: '0%' }}
          whileInView={{ left: `${pct}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
        />
      </div>
      <div className="num mt-1.5 flex justify-between text-[11px] text-text-muted">
        <span>120日低 {low.toFixed(1)}</span>
        <span>52W高 {high.toFixed(1)}</span>
      </div>
    </div>
  )
}

/* ---------------- 20 格價漲量增方塊陣列 ---------------- */
function UpVolSquares({ flags }: { flags: boolean[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((hit, i) => (
        <motion.span
          key={i}
          className="h-3.5 w-3.5 rounded-[3px]"
          style={{
            backgroundColor: hit ? GOLD : '#0E1219',
            border: hit ? 'none' : '1px solid #232B38',
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.25, delay: 0.3 + i * 0.02 }}
        />
      ))}
    </div>
  )
}

/* ---------------- 量比解讀 chip ---------------- */
function VolChip({ ratio }: { ratio: number }) {
  let text = '量能平穩'
  let cls = 'text-text-secondary'
  let bg = 'rgba(154,167,184,0.12)'
  if (ratio >= 1.5 && ratio <= 3) {
    text = '溫和放量'
    cls = 'text-accent-cyan'
    bg = 'rgba(76,195,232,0.12)'
  } else if (ratio > 6) {
    text = '異常爆量'
    cls = 'text-warn-amber'
    bg = 'rgba(240,140,60,0.15)'
  } else if (ratio < 0.5) {
    text = '明顯量縮'
    cls = 'text-text-muted'
    bg = 'rgba(91,107,127,0.12)'
  } else if (ratio > 3) {
    text = '放量偏熱'
    cls = 'text-warn-amber'
    bg = 'rgba(240,140,60,0.10)'
  }
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', cls)} style={{ backgroundColor: bg }}>
      {text}
    </span>
  )
}

/* ---------------- 均線位階徽章 ---------------- */
function MaBadge({ label, above }: { label: string; above: boolean | null }) {
  if (above == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-text-muted/10 px-2 py-0.5 text-xs text-text-muted">
        {label} —
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        above ? 'bg-up-red/15 text-up-red' : 'bg-down-green/15 text-down-green',
      )}
    >
      {above ? <Check size={11} /> : <X size={11} />}
      {label} {above ? '站上' : '跌破'}
    </span>
  )
}

/* ---------------- 主元件 ---------------- */
interface MetricPanelsProps {
  stock: Stock
  scores: ScoreBreakdown
}

/** Section 4 — 評分明細雙欄：估值與基本面（金）＋ 量價結構（紫） */
export default function MetricPanels({ stock, scores }: MetricPanelsProps) {
  const median = scores.detail.industry_per_median

  // 近 20 日「價漲量增」逐日旗標（與 scoring.ts pattern 口徑一致，真實資料計算）
  const upVolFlags = useMemo(() => {
    const h = stock.history
    if (!h) return null
    const n = Math.min(h.close.length, h.volume.length)
    const days = 20
    const need = days + 5
    if (n < need + 1) return null
    const close = h.close.slice(n - need - 1)
    const volume = h.volume.slice(n - need - 1)
    const flags: boolean[] = []
    for (let i = 0; i < days; i++) {
      const idx = need - days + i
      const prevAvg = (volume[idx - 5] + volume[idx - 4] + volume[idx - 3] + volume[idx - 2] + volume[idx - 1]) / 5
      flags.push(close[idx] > close[idx - 1] && volume[idx] > prevAvg)
    }
    return flags
  }, [stock.history])

  // 近 120 日低點（history 真實資料）
  const low120 = useMemo(() => {
    if (!stock.history || stock.history.close.length === 0) return null
    return Math.min(...stock.history.close)
  }, [stock.history])

  const aboveMa20 = stock.price != null && stock.ma20 != null ? stock.price >= stock.ma20 : null
  const aboveMa60 = stock.price != null && stock.ma60 != null ? stock.price >= stock.ma60 : null

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {/* 左卡：估值與基本面 */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="overflow-hidden rounded-xl border border-border-subtle bg-surface"
      >
        <div className="h-[3px] w-full" style={{ backgroundColor: GOLD }} />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">低估維度 · 估值與基本面</h3>
            <ScoreBadge score={scores.value_score} />
          </div>

          <MetricRow
            label="本益比 PER"
            tip="PER ≤ 產業中位數×0.6 → 滿分 100；≥ 中位數×1.5 → 0 分；之間線性內插。佔低估分 40%。"
            delay={0.06}
          >
            {scores.per_loss ? (
              <span className="text-sm text-text-muted">虧損或 PER 缺失（此項 0 分）</span>
            ) : stock.per != null ? (
              <>
                <div className="num flex items-baseline gap-2">
                  <span className="text-lg font-medium text-text-primary">{stock.per.toFixed(2)}</span>
                  {median != null && (
                    <span className="text-xs text-text-muted">vs 產業中位 {median.toFixed(1)}</span>
                  )}
                </div>
                {median != null && <PerPositionBar per={stock.per} median={median} />}
              </>
            ) : (
              <span className="text-sm text-text-muted">—</span>
            )}
          </MetricRow>

          <MetricRow
            label="股價淨值比 PBR"
            tip="PBR ≤ 1 → 滿分 100；≥ 5 → 0 分；之間線性內插。佔低估分 25%。"
            delay={0.12}
          >
            <div className="num flex items-baseline gap-2">
              <span className="text-lg font-medium text-text-primary">
                {stock.pbr != null ? stock.pbr.toFixed(2) : '—'}
              </span>
              <span className="text-xs text-text-muted">分項得分 {scores.detail.pbr_score.toFixed(0)}</span>
            </div>
          </MetricRow>

          <MetricRow
            label="殖利率"
            tip="近四季股利 ÷ 現價。≥ 5% → 滿分 100；0% → 0 分；線性內插。佔低估分 15%。"
            delay={0.18}
          >
            <div className="num flex items-baseline gap-2">
              <span className="text-lg font-medium text-text-primary">
                {stock.div_yield != null ? `${stock.div_yield.toFixed(2)}%` : '—'}
              </span>
              <span className="text-xs text-text-muted">分項得分 {scores.detail.yield_score.toFixed(0)}</span>
            </div>
          </MetricRow>

          <MetricRow
            label="月營收年增率"
            tip="最新公告月營收對去年同期增減。≥ +50% → 滿分 100；≤ −20% → 0 分；線性內插。佔低估分 20%。"
            delay={0.24}
          >
            <div className="num flex items-baseline gap-2">
              <ChangeText value={stock.rev_yoy} marker="sign" className="text-lg font-medium" />
              <span className="text-xs text-text-muted">分項得分 {scores.detail.rev_score.toFixed(0)}</span>
            </div>
          </MetricRow>
        </div>
      </motion.div>

      {/* 右卡：量價結構 */}
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="overflow-hidden rounded-xl border border-border-subtle bg-surface"
      >
        <div className="h-[3px] w-full" style={{ backgroundColor: PURPLE }} />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">量價維度 · 量價結構</h3>
            <ScoreBadge score={scores.volume_price_score} />
          </div>

          <MetricRow
            label="量比（20 日均量 / 60 日均量）"
            tip="量比 1.5–3 → 滿分 100（溫和放量）；<0.5 或 >6 → 20 分；其餘線性。佔量價分 35%。"
            delay={0.06}
          >
            <div className="num flex items-center gap-2">
              <span className="text-lg font-medium text-text-primary">
                {stock.vol_ratio != null ? stock.vol_ratio.toFixed(2) : '—'}
              </span>
              {stock.vol_ratio != null && <VolChip ratio={stock.vol_ratio} />}
            </div>
          </MetricRow>

          <MetricRow
            label="均線位階"
            tip="現價站上 MA20 + MA60 → 滿分 100；僅 MA20 → 70；僅 MA60 → 50；皆跌破 → 20。佔量價分 35%。"
            delay={0.12}
          >
            <div className="flex flex-wrap items-center gap-2">
              <MaBadge label="MA20" above={aboveMa20} />
              <MaBadge label="MA60" above={aboveMa60} />
              <span className="num text-xs text-text-muted">
                現價 {stock.price?.toFixed(2) ?? '—'} / MA20 {stock.ma20?.toFixed(2) ?? '—'} / MA60{' '}
                {stock.ma60?.toFixed(2) ?? '—'}
              </span>
            </div>
          </MetricRow>

          <MetricRow
            label="價漲量增天數占比（近 20 日）"
            tip="近 20 日中「收盤上漲且成交量 > 前 5 日均量」的天數占比。≥ 40% → 滿分 100；≤ 10% → 20 分。佔量價分 30%。"
            delay={0.18}
          >
            {upVolFlags ? (
              <>
                <div className="num flex items-baseline gap-2">
                  <span className="text-lg font-medium text-text-primary">
                    {scores.detail.up_vol_ratio != null ? `${Math.round(scores.detail.up_vol_ratio * 100)}%` : '—'}
                  </span>
                  <span className="text-xs text-text-muted">
                    {upVolFlags.filter(Boolean).length} / {upVolFlags.length} 日
                  </span>
                </div>
                <div className="mt-2">
                  <UpVolSquares flags={upVolFlags} />
                </div>
              </>
            ) : (
              <span className="text-sm text-text-muted">歷史資料不足</span>
            )}
          </MetricRow>

          <MetricRow
            label="距 52 週高點"
            tip="現價相對 52 週最高價的距離。貼近新高（>-3%）且近 60 日漲幅 >30% 會觸發過熱降評。"
            delay={0.24}
          >
            <div className="num flex items-baseline gap-2">
              <ChangeText value={stock.pct_from_high} marker="sign" className="text-lg font-medium" />
              {stock.ret20 != null && (
                <span className="text-xs text-text-muted">
                  20 日 <ChangeText value={stock.ret20} marker="sign" className="text-xs" />
                </span>
              )}
              {stock.ret60 != null && (
                <span className="text-xs text-text-muted">
                  60 日 <ChangeText value={stock.ret60} marker="sign" className="text-xs" />
                </span>
              )}
            </div>
            {stock.high_52w != null && low120 != null && stock.price != null && (
              <YearRangeBar low={low120} high={stock.high_52w} current={stock.price} />
            )}
          </MetricRow>

          <MetricRow
            label="量價背離偵測"
            tip="近 10 日價漲 >5% 但均量低於前 10 日均量 ×0.7 → 價漲量縮背離。僅警示，不扣分。"
            delay={0.3}
          >
            {scores.divergence ? (
              <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs leading-relaxed text-danger">
                <span className="mb-1 flex items-center gap-1.5 font-medium">
                  <AlertTriangle size={13} />
                  價漲量縮背離
                </span>
                近 10 日價漲超過 5%，但均量低於前 10 日均量 ×0.7，注意動能續航。
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-down-green">
                <Check size={14} />
                未偵測到背離
              </span>
            )}
          </MetricRow>
        </div>
      </motion.div>
    </div>
  )
}
