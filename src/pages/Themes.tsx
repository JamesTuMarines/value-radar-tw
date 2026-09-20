import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import SectionHeader from '@/components/SectionHeader'
import SkeletonRow from '@/components/SkeletonRow'
import { useStocks, useThemes, themeColor } from '@/lib/data'
import { scoreAll, themeStats } from '@/lib/stats'
import { DEFAULT_WEIGHTS } from '@/lib/scoring'
import MomentumChart, { type MomentumRow } from './themes/MomentumChart'
import ThemeSection from './themes/ThemeSection'
import PurityExplainer from './themes/PurityExplainer'
import CtaBanner from './themes/CtaBanner'
import { themeAnchor } from './themes/themeContent'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

function scrollToTheme(id: string) {
  document.getElementById(themeAnchor(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Themes() {
  const stocksState = useStocks()
  const themesState = useThemes()
  const location = useLocation()

  const loading = stocksState.loading || themesState.loading
  const error = stocksState.error ?? themesState.error

  const scored = useMemo(
    () =>
      stocksState.data
        ? scoreAll(stocksState.data.stocks, stocksState.data.industryMedians, DEFAULT_WEIGHTS)
        : [],
    [stocksState.data],
  )
  const scoredByCode = useMemo(() => new Map(scored.map((s) => [s.stock.code, s])), [scored])
  const stats = useMemo(
    () => (themesState.data ? themeStats(scored, themesState.data) : []),
    [scored, themesState.data],
  )
  const statById = useMemo(() => new Map(stats.map((s) => [s.theme.id, s])), [stats])

  const momentumRows: MomentumRow[] = useMemo(
    () =>
      stats.map((s) => ({
        id: s.theme.id,
        name: s.theme.name,
        color: themeColor(s.theme.id),
        momentum: Math.round(s.momentum * 10) / 10,
        count: s.count,
        top3: s.theme.stocks
          .map((ref) => scoredByCode.get(ref.code))
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
          .sort((a, b) => b.scores.total_score - a.scores.total_score)
          .slice(0, 3)
          .map((x) => ({ code: x.stock.code, name: x.stock.name })),
      })),
    [stats, scoredByCode],
  )

  // 從其他頁帶 hash 進來時（/themes#theme-<id>），資料就緒後捲動定位
  useEffect(() => {
    if (loading) return
    const hash = location.hash.replace('#', '')
    if (!hash) return
    const t = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => clearTimeout(t)
  }, [loading, location.hash])

  return (
    <div className="container-site pb-24 pt-12">
      {/* Section 1 — 頁面標頭 */}
      <header className="mx-auto max-w-[640px] text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="eyebrow-label text-accent-gold"
        >
          THEME MATRIX
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          className="mt-3 text-[40px] font-bold leading-[1.2] text-text-primary"
        >
          八大未來題材
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
          className="mt-4 text-[17px] leading-[1.7] text-text-secondary"
        >
          我們只收錄有真實資本支出、訂單與技術路線圖支撐的產業趨勢。每檔股票依營收暴露度標註題材純度，過濾「沾邊概念股」。
        </motion.p>

        {/* 題材圖例列（點擊錨點捲動） */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } } }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 max-md:flex-nowrap max-md:justify-start max-md:overflow-x-auto max-md:pb-2"
        >
          {(themesState.data ?? []).map((t) => (
            <motion.button
              key={t.id}
              type="button"
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE } },
              }}
              onClick={() => scrollToTheme(t.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: themeColor(t.id) }} />
              {t.name}
            </motion.button>
          ))}
        </motion.div>
      </header>

      {/* Section 2 — 題材總覽比較 */}
      <section className="mt-16">
        <SectionHeader title="題材動能總覽" eyebrow="MOMENTUM" />
        <div className="card-surface p-5 sm:p-8">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-danger">{error}</p>
          ) : (
            <MomentumChart rows={momentumRows} />
          )}
        </div>
      </section>

      {/* Section 3 — 題材深度區塊 × 8 */}
      <div className="mt-24 space-y-24">
        {!loading &&
          !error &&
          (themesState.data ?? []).map((theme, i) => (
            <ThemeSection
              key={theme.id}
              index={i}
              theme={theme}
              stat={statById.get(theme.id)}
              scoredByCode={scoredByCode}
            />
          ))}
      </div>

      {/* Section 4 — 題材純度說明 */}
      <section className="mt-24">
        <SectionHeader title="題材純度怎麼分" eyebrow="PURITY" />
        <PurityExplainer />
      </section>

      {/* Section 5 — 底部 CTA */}
      <section className="mt-24">
        <CtaBanner
          title="用你自己的權重，重新排列這些題材"
          subtitle="調整低估、題材、量價三維權重，所有分數在瀏覽器端即時重算。"
        />
      </section>
    </div>
  )
}
