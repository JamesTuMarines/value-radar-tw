/** Section 4 — 評分表格（桌面）：可排序、sticky 表頭、Framer Motion layout 重排 */
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronUp } from 'lucide-react'
import ScoreBadge from '@/components/ScoreBadge'
import Sparkline from '@/components/Sparkline'
import ChangeText from '@/components/ChangeText'
import ThemeTag from '@/components/ThemeTag'
import Tooltip from '@/components/Tooltip'
import OverheatBadge from '@/components/OverheatBadge'
import SkeletonRow from '@/components/SkeletonRow'
import type { ScoredStock } from '@/lib/stats'
import type { Theme } from '@/lib/types'
import { MarketChip, TotalBadge } from './shared'
import { ROW_SPRING, type SortKey, type SortState } from './utils'
import { cn } from '@/lib/utils'

const RANK_COLORS = ['#E8B64C', '#9AA7B8', '#B0764C']
const CHIP_BLUE = '#6E9BFF'

/** 千分位 + 正負號的「張」數格式化（台股慣例：正=買超=紅） */
function fmtLots(v: number | null | undefined): string {
  if (v == null) return '—'
  const abs = Math.abs(Math.round(v)).toLocaleString('en-US')
  return v > 0 ? `+${abs}` : v < 0 ? `−${abs}` : '0'
}

function lotsColorClass(v: number | null | undefined): string {
  if (v == null || v === 0) return 'text-text-muted'
  return v > 0 ? 'text-up-red' : 'text-down-green'
}

/* ---------- tooltip 內容 ---------- */

function ValueTip({ s }: { s: ScoredStock }) {
  const { stock, scores } = s
  const d = scores.detail
  return (
    <div className="num space-y-1">
      <div className="font-sans font-medium text-text-primary">低估分細項</div>
      <div>
        PER {stock.per == null ? '—' : stock.per.toFixed(1)}
        {scores.per_loss ? '（虧損）' : ''} vs 產業中位{' '}
        {d.industry_per_median == null ? '—' : d.industry_per_median.toFixed(1)}
      </div>
      <div>PBR {stock.pbr == null ? '—' : stock.pbr.toFixed(2)}</div>
      <div>殖利率 {stock.div_yield == null ? '—' : `${stock.div_yield.toFixed(2)}%`}</div>
      <div>營收年增 {stock.rev_yoy == null ? '—' : `${stock.rev_yoy > 0 ? '+' : ''}${stock.rev_yoy.toFixed(1)}%`}</div>
    </div>
  )
}

function ThemeTip({ s, themesById }: { s: ScoredStock; themesById: Map<string, Theme> }) {
  const { stock } = s
  const hasHigh = stock.themes.some((t) => t.purity === 'high')
  const bonus = stock.themes.length >= 2 && hasHigh
  const maxPurity = stock.themes.some((t) => t.purity === 'high')
    ? '高（100）'
    : stock.themes.some((t) => t.purity === 'mid')
      ? '中（70）'
      : '低（40）'
  return (
    <div className="space-y-1">
      <div className="font-medium text-text-primary">題材分細項</div>
      <div className="num">最高純度：{maxPurity}</div>
      <div className="num">多題材加權：{bonus ? '+10（符合）' : '未符合'}</div>
      <div className="flex flex-wrap gap-1 pt-0.5">
        {stock.themes.map((t) => (
          <ThemeTag key={t.id} id={t.id} name={themesById.get(t.id)?.name ?? t.id} purity={t.purity} />
        ))}
      </div>
    </div>
  )
}

function VpTip({ s }: { s: ScoredStock }) {
  const { stock, scores } = s
  const above20 = stock.price != null && stock.ma20 != null && stock.price >= stock.ma20
  const above60 = stock.price != null && stock.ma60 != null && stock.price >= stock.ma60
  return (
    <div className="num space-y-1">
      <div className="font-sans font-medium text-text-primary">量價分細項</div>
      <div>量比 {stock.vol_ratio == null ? '—' : stock.vol_ratio.toFixed(2)}</div>
      <div>
        站上 MA20 {above20 ? '✓' : '✗'} · MA60 {above60 ? '✓' : '✗'}
      </div>
      <div>
        價漲量增占比{' '}
        {scores.detail.up_vol_ratio == null ? '—' : `${Math.round(scores.detail.up_vol_ratio * 100)}%`}
      </div>
      <div>
        距 52 週高 {stock.pct_from_high == null ? '—' : `${stock.pct_from_high.toFixed(1)}%`}
      </div>
    </div>
  )
}

function ChipsTip({ s }: { s: ScoredStock }) {
  const { stock, scores } = s
  const c = stock.chips
  const share = scores.detail.inst_vol_share
  return (
    <div className="num space-y-1">
      <div className="font-sans font-medium text-text-primary">籌碼分細項</div>
      <div>
        籌碼 <span style={{ color: CHIP_BLUE }}>{scores.chip_score.toFixed(1)}</span> 分
      </div>
      <div>法人20日淨買超 {fmtLots(c?.total_20d)} 張</div>
      <div>
        佔20日成交量{' '}
        {share == null ? '—' : `${share > 0 ? '+' : share < 0 ? '−' : ''}${Math.abs(share * 100).toFixed(1)}%`}
      </div>
      {c && <div>外資20日 {fmtLots(c.foreign_20d)} · 投信20日 {fmtLots(c.trust_20d)}</div>}
      {c?.foreign_ratio != null && (
        <div>
          外資持股 {c.foreign_ratio.toFixed(2)}%（20日{' '}
          {c.foreign_ratio_chg_20d == null
            ? '—'
            : `${c.foreign_ratio_chg_20d > 0 ? '+' : c.foreign_ratio_chg_20d < 0 ? '−' : ''}${Math.abs(c.foreign_ratio_chg_20d).toFixed(2)}pp`}
          ）
        </div>
      )}
      {!c && <div className="font-sans text-text-muted">無籌碼資料，以中性 50 分計</div>}
    </div>
  )
}

/* ---------- 排序標題 ---------- */

function SortableTh({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  sort: SortState
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = sort.key === sortKey
  const alignRight = className?.includes('text-right')
  return (
    <th className={cn('sticky top-0 z-10 bg-surface px-3 py-3 font-medium shadow-[0_1px_0_0_#232B38]', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'group inline-flex cursor-pointer items-center gap-1 text-[13px] transition-colors',
          alignRight && 'w-full justify-end',
          active ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary',
        )}
      >
        {label}
        <motion.span
          animate={{ rotate: active && sort.dir === 'asc' ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={cn('transition-opacity', active ? 'opacity-100 text-accent-gold' : 'opacity-0 group-hover:opacity-50')}
        >
          <ChevronUp size={13} />
        </motion.span>
      </button>
    </th>
  )
}

/* ---------- 主表格 ---------- */

interface ResultsTableProps {
  rows: ScoredStock[]
  themesById: Map<string, Theme>
  sort: SortState
  onSort: (k: SortKey) => void
  /** 名次變化查詢（對比上次權重計算）；僅在綜合排序時有意義 */
  rankDelta: (code: string) => number | null
  loading: boolean
}

export default function ResultsTable({ rows, themesById, sort, onSort, rankDelta, loading }: ResultsTableProps) {
  const navigate = useNavigate()
  const showDelta = sort.key == null || sort.key === 'total'

  return (
    <div className="max-h-[calc(100vh-340px)] min-h-[320px] overflow-auto">
      <table className="w-full min-w-[1200px] table-fixed border-collapse">
        <colgroup>
          <col className="w-12" />
          <col className="w-[180px]" />
          <col className="w-[200px]" />
          <col className="w-[90px]" />
          <col className="w-[110px]" />
          <col className="w-[88px]" />
          <col className="w-[88px]" />
          <col className="w-[88px]" />
          <col className="w-[88px]" />
          <col className="w-[104px]" />
          <col className="w-24" />
          <col className="w-16" />
        </colgroup>
        <thead>
          <tr className="text-left">
            <th className="sticky top-0 z-10 bg-surface px-3 py-3 text-[13px] font-medium text-text-muted shadow-[0_1px_0_0_#232B38]">#</th>
            <SortableTh label="股票" sortKey="name" sort={sort} onSort={onSort} />
            <th className="sticky top-0 z-10 bg-surface px-3 py-3 text-[13px] font-medium text-text-muted shadow-[0_1px_0_0_#232B38]">題材</th>
            <SortableTh label="現價" sortKey="price" sort={sort} onSort={onSort} className="text-right" />
            <th className="sticky top-0 z-10 bg-surface px-3 py-3 text-[13px] font-medium text-text-muted shadow-[0_1px_0_0_#232B38]">80日走勢</th>
            <SortableTh label="低估分" sortKey="value" sort={sort} onSort={onSort} />
            <SortableTh label="題材分" sortKey="theme" sort={sort} onSort={onSort} />
            <SortableTh label="量價分" sortKey="vp" sort={sort} onSort={onSort} />
            <SortableTh label="籌碼分" sortKey="chips" sort={sort} onSort={onSort} />
            <SortableTh label="法人20日" sortKey="inst20d" sort={sort} onSort={onSort} className="text-right" />
            <SortableTh label="綜合分" sortKey="total" sort={sort} onSort={onSort} />
            <th className="sticky top-0 z-10 bg-surface px-3 py-3 shadow-[0_1px_0_0_#232B38]" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={`sk-${i}`}>
                <td colSpan={12} className="p-0">
                  <SkeletonRow cols={7} />
                </td>
              </tr>
            ))
          ) : (
            <AnimatePresence mode="popLayout" initial={true}>
              {rows.map((s, i) => {
                const { stock, scores } = s
                const rank = i + 1
                const extra = stock.themes.length - 2
                const delta = showDelta ? rankDelta(stock.code) : null
                return (
                  <motion.tr
                    key={stock.code}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: scores.overheat ? 0.55 : 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      transition={{ ...ROW_SPRING, opacity: { duration: 0.4, delay: Math.min(i, 15) * 0.03 } }}
                      onClick={() => navigate(`/stock/${stock.code}`)}
                      className="group cursor-pointer border-b border-border-subtle/60 transition-colors hover:bg-elevated"
                      style={
                        scores.overheat ? { boxShadow: 'inset 2px 0 0 0 #F08C3C' } : undefined
                      }
                    >
                      {/* 排名 */}
                      <td className="px-3 py-2.5">
                        <span
                          className="num text-sm"
                          style={{ color: rank <= 3 ? RANK_COLORS[rank - 1] : '#5B6B7F' }}
                        >
                          {rank}
                        </span>
                      </td>

                      {/* 股票 */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[15px] font-semibold text-text-primary">{stock.name}</span>
                          {scores.overheat && <OverheatBadge reason={scores.overheat_reason} />}
                          {scores.divergence && (
                            <Tooltip content="價漲量縮背離：近 10 日價漲 >5% 但量能低於前 10 日均量 ×0.7">
                              <AlertTriangle size={14} className="shrink-0 cursor-help text-danger" />
                            </Tooltip>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="num text-xs text-text-muted">{stock.code}</span>
                          <MarketChip market={stock.market} />
                        </div>
                      </td>

                      {/* 題材 */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {stock.themes.slice(0, 2).map((t) => (
                            <ThemeTag
                              key={t.id}
                              id={t.id}
                              name={themesById.get(t.id)?.name ?? t.id}
                              purity={t.purity}
                            />
                          ))}
                          {extra > 0 && (
                            <Tooltip content={<ThemeTip s={s} themesById={themesById} />}>
                              <span className="num cursor-help rounded-full border border-border-subtle px-1.5 py-0.5 text-[10px] text-text-muted">
                                +{extra}
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      </td>

                      {/* 現價 */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="num text-[15px] font-medium text-text-primary">
                          {stock.price == null ? '—' : stock.price.toFixed(2)}
                        </div>
                        <ChangeText value={stock.change_pct} className="text-xs" />
                      </td>

                      {/* 80日走勢 */}
                      <td className="px-3 py-2.5">
                        <Sparkline data={stock.history?.close?.slice(-80) ?? []} width={96} height={28} />
                      </td>

                      {/* 低估分 */}
                      <td className="px-3 py-2.5">
                        <Tooltip content={<ValueTip s={s} />}>
                          <span className="cursor-help">
                            <ScoreBadge score={scores.value_score} />
                          </span>
                        </Tooltip>
                      </td>

                      {/* 題材分 */}
                      <td className="px-3 py-2.5">
                        <Tooltip content={<ThemeTip s={s} themesById={themesById} />}>
                          <span className="cursor-help">
                            <ScoreBadge score={scores.theme_score} />
                          </span>
                        </Tooltip>
                      </td>

                      {/* 量價分 */}
                      <td className="px-3 py-2.5">
                        <Tooltip content={<VpTip s={s} />}>
                          <span className="cursor-help">
                            <ScoreBadge score={scores.volume_price_score} />
                          </span>
                        </Tooltip>
                      </td>

                      {/* 籌碼分 */}
                      <td className="px-3 py-2.5">
                        <Tooltip content={<ChipsTip s={s} />}>
                          <span className="cursor-help">
                            <ScoreBadge score={scores.chip_score} />
                          </span>
                        </Tooltip>
                      </td>

                      {/* 法人20日淨買超（張） */}
                      <td className="px-3 py-2.5 text-right">
                        <span className={cn('num text-[13px] font-medium', lotsColorClass(stock.chips?.total_20d))}>
                          {fmtLots(stock.chips?.total_20d)}
                        </span>
                      </td>

                      {/* 綜合分 */}
                      <td className="px-3 py-2.5">
                        <TotalBadge score={scores.total_score} delta={delta} faded={scores.overheat} />
                      </td>

                      {/* 操作 */}
                      <td className="px-3 py-2.5 text-right">
                        <span className="whitespace-nowrap text-xs text-text-secondary opacity-0 underline-offset-4 transition-opacity duration-200 group-hover:opacity-100 hover:text-text-primary hover:underline">
                          明細 →
                        </span>
                      </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  )
}
