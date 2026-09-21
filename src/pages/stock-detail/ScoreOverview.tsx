import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import CountUp from '@/components/CountUp'
import ScoreBadge from '@/components/ScoreBadge'
import OverheatBadge from '@/components/OverheatBadge'
import Tooltip from '@/components/Tooltip'
import { ratingColor } from '@/lib/scoring'
import type { ScoreBreakdown } from '@/lib/scoring'
import type { Stock } from '@/lib/types'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]
const GOLD = '#E8B64C'
const CYAN = '#4CC3E8'
const PURPLE = '#8B7CF6'
const CHIP_BLUE = '#6E9BFF'

/* ---------------- 綜合分圓環 ---------------- */
function ScoreRing({ score }: { score: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const color = ratingColor(score)
  return (
    <div className="relative h-[84px] w-[84px] shrink-0">
      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="#0E1219" strokeWidth="6" />
        <motion.circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - Math.min(100, Math.max(0, score)) / 100) }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: EASE }}
        />
      </svg>
      <span className="num absolute inset-0 flex items-center justify-center text-[26px] font-semibold" style={{ color }}>
        <CountUp value={score} decimals={1} duration={1000} />
      </span>
    </div>
  )
}

/* ---------------- 四維雷達（自製 SVG 菱形雷達） ---------------- */
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function ScoreRadar({ scores }: { scores: ScoreBreakdown }) {
  const cx = 100
  const cy = 100
  const R = 62
  // 軸：上=低估、右=題材、下=量價、左=籌碼
  const angles = [-90, 0, 90, 180]
  const values = [scores.value_score, scores.theme_score, scores.volume_price_score, scores.chip_score]
  const colors = [GOLD, CYAN, PURPLE, CHIP_BLUE]
  const labels = ['低估', '題材', '量價', '籌碼']
  const labelPos: [number, number][] = [
    [cx, cy - R - 14],
    [cx + R + 22, cy],
    [cx, cy + R + 14],
    [cx - R - 22, cy],
  ]
  const dataPoints = values
    .map((v, i) => polar(cx, cy, (Math.min(100, v) / 100) * R, angles[i]).join(','))
    .join(' ')

  return (
    <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[220px]">
      {/* 網格環 25/50/75/100 */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={angles.map((a) => polar(cx, cy, R * f, a).join(',')).join(' ')}
          fill="none"
          stroke="#232B38"
          strokeWidth="1"
        />
      ))}
      {/* 軸線 */}
      {angles.map((a, i) => {
        const [x, y] = polar(cx, cy, R, a)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#232B38" strokeWidth="1" />
      })}
      {/* 資料多邊形（進場從中心展開） */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.2 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: EASE }}
        style={{ transformOrigin: '100px 100px' }}
        points={dataPoints}
        fill="rgba(232,182,76,0.12)"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* 頂點圓點 */}
      {values.map((v, i) => {
        const [x, y] = polar(cx, cy, (Math.min(100, v) / 100) * R, angles[i])
        return <circle key={i} cx={x} cy={y} r="2.5" fill={colors[i]} />
      })}
      {/* 軸標籤 */}
      {labels.map((l, i) => (
        <text
          key={l}
          x={labelPos[i][0]}
          y={labelPos[i][1]}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-text-secondary text-[11px] font-medium"
        >
          {l}
        </text>
      ))}
    </svg>
  )
}

/* ---------------- 單格：分數 + 進度條 + 總結 ---------------- */
function ScoreCell({
  label,
  score,
  color,
  summary,
  delay,
}: {
  label: string
  score: number
  color: string
  summary: string
  delay: number
}) {
  return (
    <div className="bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-text-secondary">{label}</span>
        <span className="num text-[28px] font-semibold leading-none" style={{ color }}>
          <CountUp value={score} decimals={0} duration={900} />
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-lg bg-inset">
        <motion.div
          className="h-full rounded-lg"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay, ease: EASE }}
        />
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-text-muted">{summary}</p>
    </div>
  )
}

/* ---------------- Section 2 總覽列 ---------------- */
interface ScoreOverviewProps {
  stock: Stock
  scores: ScoreBreakdown
  rank: number
  total: number
}

export default function ScoreOverview({ stock, scores, rank, total }: ScoreOverviewProps) {
  const median = scores.detail.industry_per_median
  let valueSummary = 'PER 資料缺失'
  if (scores.per_loss) valueSummary = '公司虧損，PER 不適用'
  else if (stock.per != null && median != null && median > 0) {
    const diff = ((stock.per - median) / median) * 100
    valueSummary =
      diff <= 0 ? `PER 低於產業中位數 ${Math.abs(diff).toFixed(0)}%` : `PER 高於產業中位數 ${diff.toFixed(0)}%`
  }

  const highCount = stock.themes.filter((t) => t.purity === 'high').length
  const bonus = stock.themes.length >= 2 && highCount >= 1
  const themeSummary =
    stock.themes.length === 0
      ? '未歸屬任何題材'
      : `高純度 × ${highCount} 題材${bonus ? ' · 多題材加權 +10' : ''}`

  const maText =
    stock.price != null && stock.ma20 != null && stock.ma60 != null
      ? stock.price >= stock.ma20 && stock.price >= stock.ma60
        ? '站上月線與季線'
        : stock.price >= stock.ma60
          ? '站上季線'
          : stock.price >= stock.ma20
            ? '站上月線'
            : '均線之下'
      : '均線資料缺失'
  const vpSummary = `量比 ${stock.vol_ratio != null ? stock.vol_ratio.toFixed(2) : '—'} · ${maText} · ${
    scores.divergence ? '價漲量縮背離' : '無背離'
  }`

  const fmtLots = (v: number) =>
    `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(Math.round(v)).toLocaleString('en-US')}`
  const chipSummary = !stock.chips
    ? '無籌碼資料，以中性 50 分計'
    : `法人20日淨買超 ${fmtLots(stock.chips.total_20d)} 張${
        scores.detail.inst_vol_share != null
          ? `・佔成交量 ${(Math.abs(scores.detail.inst_vol_share) * 100).toFixed(1)}%`
          : ''
      }`

  const rColor = ratingColor(scores.total_score)

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mt-8 grid gap-4 lg:grid-cols-[300px_1fr]"
    >
      {/* 左：雷達 + 綜合分徽章 + 評級 + 警示徽章 */}
      <div className="rounded-xl border border-border-subtle bg-surface p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">四維評分雷達</h3>
          <ScoreBadge score={scores.total_score} size="lg" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: rColor }}>
            {scores.rating}
          </span>
          {scores.overheat && <OverheatBadge reason={scores.overheat_reason} />}
          {scores.divergence && (
            <Tooltip content="價漲量縮背離：近 10 日價漲超過 5%，但均量低於前 10 日均量 ×0.7（僅警示，不扣分）">
              <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-danger/15 px-2 py-[3px] text-xs font-medium text-danger">
                <AlertTriangle size={12} />
                背離
              </span>
            </Tooltip>
          )}
        </div>
        <div className="mt-3">
          <ScoreRadar scores={scores} />
        </div>
      </div>

      {/* 右：五格（lg 3 欄 / sm 2 欄），gap-px 形成 1px 分隔線 */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
        {/* 綜合分 */}
        <div className="flex items-center gap-4 bg-surface p-5">
          <ScoreRing score={scores.total_score} />
          <div>
            <p className="text-[13px] font-medium text-text-secondary">綜合評分</p>
            <p className="mt-1 text-xs font-medium" style={{ color: rColor }}>
              {scores.rating}
            </p>
            <p className="num mt-1 text-xs text-text-muted">
              {total} 檔中第 {rank} 名
            </p>
            {scores.overheat && <p className="mt-1 text-xs text-warn-amber">過熱降評 ×0.6</p>}
          </div>
        </div>
        <ScoreCell label="低估分" score={scores.value_score} color={GOLD} summary={valueSummary} delay={0.15} />
        <ScoreCell label="題材分" score={scores.theme_score} color={CYAN} summary={themeSummary} delay={0.3} />
        <ScoreCell label="量價分" score={scores.volume_price_score} color={PURPLE} summary={vpSummary} delay={0.45} />
        <ScoreCell label="籌碼分" score={scores.chip_score} color={CHIP_BLUE} summary={chipSummary} delay={0.6} />
      </div>
    </motion.section>
  )
}
