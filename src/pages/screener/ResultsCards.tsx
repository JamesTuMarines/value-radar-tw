/** Section 4 — 卡片檢視（切換態 / mobile 預設） */
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import Sparkline from '@/components/Sparkline'
import ChangeText from '@/components/ChangeText'
import ThemeTag from '@/components/ThemeTag'
import Tooltip from '@/components/Tooltip'
import OverheatBadge from '@/components/OverheatBadge'
import SkeletonRow from '@/components/SkeletonRow'
import type { ScoredStock } from '@/lib/stats'
import type { Theme } from '@/lib/types'
import { MarketChip, TotalBadge } from './shared'
import { ROW_SPRING } from './utils'

/** 四維迷你條（水平進度條 + 色 + 數值） */
function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-[10px] text-text-muted">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-inset">
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="num w-7 shrink-0 text-right text-[11px] text-text-secondary">{Math.round(value)}</span>
    </div>
  )
}

interface ResultsCardsProps {
  rows: ScoredStock[]
  themesById: Map<string, Theme>
  rankDelta: (code: string) => number | null
  loading: boolean
}

export default function ResultsCards({ rows, themesById, rankDelta, loading }: ResultsCardsProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-surface p-5">
            <SkeletonRow cols={2} className="px-0" />
            <SkeletonRow cols={3} className="px-0" />
            <SkeletonRow cols={1} className="px-0" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout" initial={true}>
        {rows.map((s, i) => {
          const { stock, scores } = s
          return (
            <motion.button
              key={stock.code}
              type="button"
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: scores.overheat ? 0.6 : 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
              transition={{ ...ROW_SPRING, opacity: { duration: 0.4, delay: Math.min(i, 15) * 0.03 } }}
              onClick={() => navigate(`/stock/${stock.code}`)}
              className="card-surface cursor-pointer p-5 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong"
              style={scores.overheat ? { boxShadow: 'inset 2px 0 0 0 #F08C3C' } : undefined}
            >
              {/* 頂列：名稱 + 代碼 + 綜合分 */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
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
                </div>
                <TotalBadge score={scores.total_score} delta={rankDelta(stock.code)} faded={scores.overheat} />
              </div>

              {/* 中列：現價 + 漲跌 + sparkline */}
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <div className="num text-lg font-medium leading-none text-text-primary">
                    {stock.price == null ? '—' : stock.price.toFixed(2)}
                  </div>
                  <ChangeText value={stock.change_pct} className="mt-1 text-xs" />
                </div>
                <Sparkline data={stock.history?.close?.slice(-80) ?? []} width={96} height={28} />
              </div>

              {/* 底列：四維迷你條 */}
              <div className="mt-4 space-y-1.5">
                <MiniBar label="低估" value={scores.value_score} color="#E8B64C" />
                <MiniBar label="題材" value={scores.theme_score} color="#4CC3E8" />
                <MiniBar label="量價" value={scores.volume_price_score} color="#8B7CF6" />
                <MiniBar label="籌碼" value={scores.chip_score} color="#6E9BFF" />
              </div>

              {/* 題材標籤列 */}
              <div className="mt-3 flex flex-wrap gap-1">
                {stock.themes.map((t) => (
                  <ThemeTag key={t.id} id={t.id} name={themesById.get(t.id)?.name ?? t.id} purity={t.purity} />
                ))}
              </div>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
