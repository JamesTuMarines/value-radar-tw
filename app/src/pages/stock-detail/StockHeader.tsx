import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import ChangeText from '@/components/ChangeText'
import CountUp from '@/components/CountUp'
import OverheatBadge from '@/components/OverheatBadge'
import ThemeTag from '@/components/ThemeTag'
import Tooltip from '@/components/Tooltip'
import type { ScoreBreakdown } from '@/lib/scoring'
import type { Stock, Theme } from '@/lib/types'
import { DATA_DATE } from '@/components/Navbar'
import { useAsOf } from '@/lib/data'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]
const PURITY_LABEL = { high: '高', mid: '中', low: '低' } as const

interface StockHeaderProps {
  stock: Stock
  scores: ScoreBreakdown
  themesById: Map<string, Theme>
  /** code → themeId → note（來自 themes.json） */
  noteOf: (themeId: string) => string | null
}

/** Section 1 — 個股標頭：麵包屑 / 名稱＋徽章 / 現價 / 題材標籤列 */
export default function StockHeader({ stock, scores, themesById, noteOf }: StockHeaderProps) {
  const dataDate = useAsOf() ?? DATA_DATE
  const firstTheme = stock.themes[0] ? themesById.get(stock.themes[0].id) : undefined
  const changePct = stock.change_pct
  // 由漲跌幅回推漲跌額（真實計算，非假資料）
  const changeAbs =
    stock.price != null && changePct != null ? stock.price - stock.price / (1 + changePct / 100) : null

  return (
    <div className="pt-8 sm:pt-12">
      {/* 麵包屑 */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted"
        aria-label="麵包屑"
      >
        <Link to="/screener" className="transition-colors hover:text-text-secondary">
          選股篩選器
        </Link>
        {firstTheme && (
          <>
            <ChevronRight size={12} />
            <Link to="/themes" className="transition-colors hover:text-text-secondary">
              {firstTheme.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-text-secondary">
          {stock.name} <span className="num">({stock.code})</span>
        </span>
      </motion.nav>

      {/* 主標列 */}
      <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[40px] font-bold leading-[1.2] text-text-primary">{stock.name}</h1>
            <span className="num mt-1 text-xl text-text-muted">{stock.code}</span>
            {scores.overheat && <OverheatBadge reason={scores.overheat_reason} />}
            {scores.divergence && (
              <Tooltip content="價漲量縮背離：近 10 日價漲超過 5%，但均量低於前 10 日均量 ×0.7，注意動能續航（僅警示，不扣分）">
                <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-danger/15 px-2 py-[3px] text-xs font-medium text-danger">
                  <AlertTriangle size={12} />
                  量價背離
                </span>
              </Tooltip>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span className="rounded-md border border-border-subtle bg-inset px-2 py-0.5 text-xs text-text-secondary">
              {stock.market === 'TW' ? '上市' : '上櫃'}
            </span>
            <span>{stock.industry}</span>
          </div>
        </motion.div>

        {/* 現價區（mobile 移至名稱正下方） */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          className="lg:text-right"
        >
          <div className="flex items-baseline gap-3 lg:justify-end">
            <span className="num text-[40px] font-semibold leading-none text-text-primary">
              {stock.price != null ? <CountUp value={stock.price} decimals={2} duration={800} /> : '—'}
            </span>
          </div>
          <div className="num mt-2 flex items-center gap-2 text-base lg:justify-end">
            {changeAbs != null && <ChangeText value={changeAbs} marker="sign" suffix="" className="text-base" />}
            <ChangeText value={changePct} className="text-base" />
          </div>
          <p className="num mt-1.5 text-xs text-text-muted">{dataDate} 收盤</p>
        </motion.div>
      </div>

      {/* 題材標籤列 */}
      {stock.themes.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } } }}
          className="mt-5 flex flex-wrap gap-2"
        >
          {stock.themes.map((t) => {
            const theme = themesById.get(t.id)
            const note = noteOf(t.id)
            const tag = (
              <span className="cursor-help">
                <ThemeTag id={t.id} name={theme?.name ?? t.id} purity={t.purity} />
              </span>
            )
            return (
              <motion.span
                key={t.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                {note ? (
                  <Tooltip content={`純度：${PURITY_LABEL[t.purity]} · ${note}`}>{tag}</Tooltip>
                ) : (
                  tag
                )}
              </motion.span>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
