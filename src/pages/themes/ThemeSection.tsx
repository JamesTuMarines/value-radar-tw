import { createElement, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ChevronDown, Layers, Gauge, TrendingUp } from 'lucide-react'
import DataChip from '@/components/DataChip'
import ChangeText from '@/components/ChangeText'
import OverheatBadge from '@/components/OverheatBadge'
import PurityDots from '@/components/PurityDots'
import ScoreBadge from '@/components/ScoreBadge'
import Sparkline from '@/components/Sparkline'
import { themeColor } from '@/lib/data'
import type { ThemeStat, ScoredStock } from '@/lib/stats'
import type { Theme, ThemeStockRef } from '@/lib/types'
import { cn } from '@/lib/utils'
import { themeContent, themeAnchor, themeIcon } from './themeContent'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

interface MemberRow {
  ref: ThemeStockRef
  scored: ScoredStock | null
}

interface ThemeSectionProps {
  index: number
  theme: Theme
  stat: ThemeStat | undefined
  scoredByCode: Map<string, ScoredStock>
}

/** 單一題材深度區塊：左文右表（偶數反轉），含 TOP3 迷你表與可展開的完整標的清單 */
export default function ThemeSection({ index, theme, stat, scoredByCode }: ThemeSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const color = themeColor(theme.id)
  const content = themeContent(theme.id)
  const reversed = index % 2 === 1

  const members: MemberRow[] = useMemo(
    () => theme.stocks.map((ref) => ({ ref, scored: scoredByCode.get(ref.code) ?? null })),
    [theme, scoredByCode],
  )
  const ranked = useMemo(
    () =>
      members
        .filter((m): m is { ref: ThemeStockRef; scored: ScoredStock } => m.scored !== null)
        .sort((a, b) => b.scored.scores.total_score - a.scored.scores.total_score),
    [members],
  )
  const top3 = ranked.slice(0, 3)

  const textHalf = (
    <motion.div
      initial={{ opacity: 0, x: reversed ? 40 : -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="flex items-center gap-3">
        <span
          className="num inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${color}26`, color }}
        >
          {createElement(themeIcon(theme.id), { size: 13 })}
          THEME {String(index + 1).padStart(2, '0')}
        </span>
        {content.en && <span className="num hidden text-xs text-text-muted sm:inline">{content.en}</span>}
      </div>

      <h2 className="mt-4 text-[28px] font-bold leading-[1.3] text-text-primary">{theme.name}</h2>

      <p className="mt-4 text-[15px] leading-[1.7] text-text-secondary">{theme.outlook}</p>

      <ul className="mt-5 space-y-2.5">
        {content.points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color }} />
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <DataChip icon={Layers} label="標的數" value={`${stat?.count ?? 0} 檔`} />
        <DataChip icon={Gauge} label="平均低估分" value={stat ? stat.avgValue.toFixed(1) : '—'} />
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-inset px-2.5 py-1.5">
          <TrendingUp size={13} className="text-text-muted" />
          <span className="text-xs text-text-muted">近20日均值</span>
          <ChangeText value={stat?.avgRet20 ?? null} marker="sign" className="text-xs font-medium" />
        </span>
      </div>

      <Link
        to={`/screener?theme=${theme.id}`}
        className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-text-secondary transition-colors hover:text-text-primary hover:underline"
      >
        在篩選器中查看
        <ArrowRight size={16} />
      </Link>
    </motion.div>
  )

  const dataHalf = (
    <motion.div
      initial={{ opacity: 0, x: reversed ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="rounded-xl border border-border-subtle bg-inset p-4 sm:p-5"
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[13px] font-medium text-text-secondary">題材內 TOP 3</h3>
        <span className="text-xs text-text-muted">依綜合分排序</span>
      </div>

      <div className="space-y-1">
        {top3.map((m, i) => (
          <motion.button
            key={m.ref.code}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: EASE }}
            onClick={() => navigate(`/stock/${m.ref.code}`)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-elevated"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="truncate text-sm font-medium text-text-primary">{m.scored.stock.name}</span>
                <span className="num text-xs text-text-muted">{m.ref.code}</span>
                {m.scored.scores.overheat && <OverheatBadge reason={m.scored.scores.overheat_reason} />}
              </span>
              <span className="mt-0.5 block truncate text-xs text-text-muted">{m.ref.note}</span>
            </span>
            <PurityDots purity={m.ref.purity} color={color} className="shrink-0" />
            <ScoreBadge score={m.scored.scores.total_score} className="shrink-0" />
            <Sparkline data={m.scored.stock.history?.close?.slice(-80) ?? []} className="hidden shrink-0 md:block" />
          </motion.button>
        ))}
        {top3.length === 0 && <p className="px-2 py-4 text-sm text-text-muted">追蹤池內暫無此題材標的。</p>}
      </div>

      <p className="mt-3 px-2 text-xs text-text-muted">依目前預設權重排序（低估 50 / 題材 20 / 量價 30）</p>

      {/* 展開完整清單 */}
      {members.length > 3 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-subtle py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
          >
            {expanded ? '收合清單' : `展開全部 ${members.length} 檔`}
            <ChevronDown size={14} className={cn('transition-transform duration-200', expanded && 'rotate-180')} />
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1 border-t border-border-subtle pt-2">
                  {ranked.slice(3).map((m) => (
                    <button
                      key={m.ref.code}
                      type="button"
                      onClick={() => navigate(`/stock/${m.ref.code}`)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-elevated"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="truncate text-sm text-text-primary">{m.scored.stock.name}</span>
                          <span className="num text-xs text-text-muted">{m.ref.code}</span>
                          {m.scored.scores.overheat && <OverheatBadge reason={m.scored.scores.overheat_reason} />}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-text-muted">{m.ref.note}</span>
                      </span>
                      <span className="num hidden shrink-0 items-center gap-2 text-xs text-text-muted sm:flex">
                        <span>
                          低 <span className="text-text-secondary">{m.scored.scores.value_score.toFixed(0)}</span>
                        </span>
                        <span>
                          題 <span className="text-text-secondary">{m.scored.scores.theme_score.toFixed(0)}</span>
                        </span>
                        <span>
                          量 <span className="text-text-secondary">{m.scored.scores.volume_price_score.toFixed(0)}</span>
                        </span>
                      </span>
                      <PurityDots purity={m.ref.purity} color={color} className="shrink-0" />
                      <ScoreBadge score={m.scored.scores.total_score} className="shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )

  return (
    <section id={themeAnchor(theme.id)} className="scroll-mt-24">
      {/* 題材色分隔線（由左生長） */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mb-8 h-0.5 w-[30%] origin-left rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div className={cn(reversed && 'lg:order-2')}>{textHalf}</div>
        <div className={cn(reversed && 'lg:order-1')}>{dataHalf}</div>
      </div>
    </section>
  )
}
