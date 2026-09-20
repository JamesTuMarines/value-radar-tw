import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import ScoreBadge from '@/components/ScoreBadge'
import Sparkline from '@/components/Sparkline'
import ChangeText from '@/components/ChangeText'
import SectionHeader from '@/components/SectionHeader'
import ThemeTag from '@/components/ThemeTag'
import Tooltip from '@/components/Tooltip'
import type { ScoredStock } from '@/lib/stats'
import type { Theme } from '@/lib/types'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

function MiniBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="flex w-12 flex-col gap-1">
      <div className="h-1 w-full overflow-hidden rounded-full bg-inset">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] text-text-muted">{label}</span>
        <span className="num text-[11px] text-text-secondary">{Math.round(value)}</span>
      </div>
    </div>
  )
}

interface TopPicksProps {
  picks: ScoredStock[]
  themesById: Map<string, Theme>
  totalCount: number
}

export default function TopPicks({ picks, themesById, totalCount }: TopPicksProps) {
  const navigate = useNavigate()

  return (
    <section className="container-site py-16">
      <SectionHeader
        title="雷達鎖定 · 綜合評分 TOP 5"
        eyebrow="RADAR LOCK-ON"
        action={
          <Link
            to="/screener"
            className="text-sm text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
          >
            查看全部 {totalCount} 檔 →
          </Link>
        }
      />

      <div className="space-y-3">
        {picks.map((p, i) => {
          const rank = i + 1
          const rankColor = rank === 1 ? 'text-accent-gold' : rank <= 3 ? 'text-text-secondary' : 'text-text-muted'
          const isTop3 = rank <= 3
          const tags = p.stock.themes.slice(0, 2)
          const extra = p.stock.themes.length - tags.length
          return (
            <motion.button
              key={p.stock.code}
              type="button"
              onClick={() => navigate(`/stock/${p.stock.code}`)}
              initial={{ x: -24, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
              className="group relative flex w-full cursor-pointer flex-col gap-3 rounded-xl border bg-surface p-4 text-left transition-colors duration-200 hover:bg-elevated lg:h-24 lg:flex-row lg:items-center lg:gap-6 lg:py-0"
              style={{
                borderColor: 'transparent',
                backgroundImage: isTop3
                  ? 'linear-gradient(#12161F, #12161F), linear-gradient(135deg, #E8B64C33, transparent 40%)'
                  : 'linear-gradient(#12161F, #12161F), linear-gradient(#232B38, #232B38)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                animation: rank === 1 ? 'breathe 3s ease-in-out infinite' : undefined,
              }}
            >
              {/* 1. 名次 */}
              <span className={`num w-8 shrink-0 text-[28px] font-semibold leading-none ${rankColor}`}>{rank}</span>

              {/* 2. 名稱 + 代碼 + 市場別 */}
              <div className="w-40 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-text-primary">{p.stock.name}</span>
                  {p.scores.divergence && (
                    <Tooltip content="價漲量縮：近 10 日價漲但量能萎縮，留意量價背離">
                      <AlertTriangle size={14} className="text-warn-amber" />
                    </Tooltip>
                  )}
                </div>
                <div className="num mt-0.5 text-[13px] text-text-muted">
                  {p.stock.code} · {p.stock.market === 'TW' ? '上市' : '上櫃'}
                </div>
              </div>

              {/* 3. 題材標籤 */}
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {tags.map((t) => {
                  const theme = themesById.get(t.id)
                  return <ThemeTag key={t.id} id={t.id} name={theme?.name ?? t.id} purity={t.purity} />
                })}
                {extra > 0 && <span className="text-xs text-text-muted">+{extra}</span>}
              </div>

              {/* 4. Sparkline */}
              <div className="hidden shrink-0 md:block">
                <Sparkline data={p.stock.history?.close.slice(-80) ?? []} width={120} height={36} animate />
              </div>

              {/* 5. 現價 + 漲跌 */}
              <div className="w-24 shrink-0 text-right">
                <div className="num text-lg font-medium text-text-primary">
                  {p.stock.price != null ? p.stock.price.toFixed(2) : '—'}
                </div>
                <ChangeText value={p.stock.change_pct} marker="sign" className="text-[13px]" />
              </div>

              {/* 6. 三維迷你條 */}
              <div className="hidden shrink-0 gap-2 md:flex">
                <MiniBar value={p.scores.value_score} color="#E8B64C" label="低估" />
                <MiniBar value={p.scores.theme_score} color="#4CC3E8" label="題材" />
                <MiniBar value={p.scores.volume_price_score} color="#8B7CF6" label="量價" />
              </div>

              {/* 7. 綜合分 */}
              <ScoreBadge score={p.scores.total_score} size="lg" className="shrink-0" />

              {/* hover 提示 */}
              <span className="absolute right-4 top-2 hidden text-xs text-text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100 lg:block">
                查看明細 →
              </span>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
