/** /screener — 選股篩選器（全站核心頁面） */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, RotateCcw, Table as TableIcon } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import { useStocks, useThemes } from '@/lib/data'
import { DEFAULT_WEIGHTS } from '@/lib/scoring'
import { scoreAll } from '@/lib/stats'
import { useIsMobile } from '@/hooks/use-mobile'
import FilterBar from './screener/FilterBar'
import ResultsCards from './screener/ResultsCards'
import ResultsTable from './screener/ResultsTable'
import WeightDrawer from './screener/WeightDrawer'
import WeightPanel from './screener/WeightPanel'
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  EASE_OUT,
  activeFilterCount,
  compareBy,
  normalizedWeights,
  passesBaseFilters,
  type Filters,
  type SortKey,
} from './screener/utils'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 30
const MOBILE_STEP = 20

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    onChange()
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export default function Screener() {
  const { data: stocksData, loading, error } = useStocks()
  const { data: themesData } = useThemes()
  const [searchParams] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isMobile = useIsMobile()

  /* ---------- 狀態 ---------- */
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [filters, setFilters] = useState<Filters>(() => {
    const themeParam = searchParams.get('theme')
    return {
      ...DEFAULT_FILTERS,
      themes: themeParam ? themeParam.split(',').filter(Boolean) : [],
    }
  })
  const [sort, setSort] = useState(DEFAULT_SORT)
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const patchFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setLimit(PAGE_SIZE)
  }

  /* ---------- 面板浮起偵測 ---------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ---------- drawer 開啟時鎖定背景捲動 ---------- */
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  /* ---------- 評分管線 ---------- */
  const scored = useMemo(
    () => (stocksData ? scoreAll(stocksData.stocks, stocksData.industryMedians, weights) : []),
    [stocksData, weights],
  )

  const base = useMemo(
    () => scored.filter((s) => passesBaseFilters(s, filters, filters.search.trim())),
    [scored, filters],
  )

  const filtered = useMemo(
    () => (filters.excludeOverheat ? base.filter((s) => !s.scores.overheat) : base),
    [base, filters.excludeOverheat],
  )

  const sorted = useMemo(() => [...filtered].sort(compareBy(sort)), [filtered, sort])

  /* ---------- 名次變化（對比上次權重計算） ---------- */
  const rankMap = useMemo(() => {
    const m = new Map<string, number>()
    ;[...scored]
      .sort((a, b) => b.scores.total_score - a.scores.total_score)
      .forEach((s, i) => m.set(s.stock.code, i + 1))
    return m
  }, [scored])
  const prevRankRef = useRef<Map<string, number> | null>(null)
  const prevRank = prevRankRef.current
  useEffect(() => {
    prevRankRef.current = rankMap
  }, [rankMap])
  const rankDelta = (code: string): number | null => {
    if (!prevRank) return null
    const oldR = prevRank.get(code)
    const newR = rankMap.get(code)
    if (oldR == null || newR == null || oldR === newR) return null
    return oldR - newR
  }

  /* ---------- 摘要 ---------- */
  const summary = useMemo(() => {
    const matched = filtered.length
    const overheatExcluded = filters.excludeOverheat
      ? base.filter((s) => s.scores.overheat).length
      : 0
    const avgScore = matched
      ? filtered.reduce((a, s) => a + s.scores.total_score, 0) / matched
      : null
    return { matched, overheatExcluded, avgScore }
  }, [filtered, base, filters.excludeOverheat])

  /* ---------- 分頁 / 無限捲動 ---------- */
  const visible = sorted.slice(0, limit)
  const hasMore = sorted.length > limit

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isMobile) return
    const el = sentinelRef.current
    if (!el) return
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setLimit((l) => l + MOBILE_STEP)
      },
      { rootMargin: '240px' },
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [isMobile, sorted.length])

  /* ---------- 操作 ---------- */
  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: key === 'name' ? 'asc' : 'desc' }
      if (prev.dir === 'desc') return { key, dir: 'asc' }
      return DEFAULT_SORT
    })
    setLimit(PAGE_SIZE)
  }

  const clearFilters = () => {
    setFilters(() => ({ ...DEFAULT_FILTERS }))
    setLimit(PAGE_SIZE)
  }

  const resetAll = () => {
    setWeights(DEFAULT_WEIGHTS)
    setFilters(DEFAULT_FILTERS)
    setSort(DEFAULT_SORT)
    setView('table')
    setLimit(PAGE_SIZE)
  }

  /** 「放寬條件」：重置 PER 與開關、市場、評級，保留題材與搜尋 */
  const relaxFilters = () => {
    setFilters((f) => ({
      ...f,
      market: 'all',
      rating: 'all',
      excludeOverheat: true,
      onlyVpStrong: false,
      onlyHighPurity: false,
      onlyInstBuy: false,
      perMin: '',
      perMax: '',
    }))
    setLimit(PAGE_SIZE)
  }

  const activeCount = activeFilterCount(filters, filters.search)
  const themesById = useMemo(() => new Map((themesData ?? []).map((t) => [t.id, t])), [themesData])
  const effectiveView = isDesktop ? view : 'cards'
  const norm = normalizedWeights(weights)

  return (
    <div className="container-site pb-28 pt-12 lg:pb-16">
      {/* ---------- Section 1 頁面標頭 ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <span className="eyebrow-label">SCREENER</span>
            <h1 className="mt-1 text-[40px] font-bold leading-[1.2] text-text-primary">選股篩選器</h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE_OUT }}
            className="mt-2 text-[15px] text-text-secondary"
          >
            <span className="num">{stocksData?.stocks.length ?? '—'}</span> 檔題材標的 ·
            依你的權重即時重算 · 資料日期 <span className="num">{stocksData?.asOf ?? '—'}</span>
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          {/* 視圖切換（lg 以下強制卡片，隱藏切換） */}
          <div className="hidden items-center rounded-lg border border-border-subtle bg-inset p-0.5 lg:flex">
            {(
              [
                { v: 'table', label: '表格', Icon: TableIcon },
                { v: 'cards', label: '卡片', Icon: LayoutGrid },
              ] as const
            ).map(({ v, label, Icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  view === v ? 'bg-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1.5 text-[13px] text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
          >
            <RotateCcw size={14} />
            重置全部條件
          </button>
        </div>
      </div>

      {/* ---------- Section 2 權重控制台（桌面 sticky） ---------- */}
      <div className="sticky top-16 z-20 mt-6 hidden lg:block">
        <WeightPanel weights={weights} onChange={setWeights} summary={summary} scrolled={scrolled} />
      </div>

      {/* ---------- Section 3 篩選條件列 ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
        className="mt-4"
      >
        <FilterBar
          filters={filters}
          onPatch={patchFilters}
          themes={themesData ?? []}
          activeCount={activeCount}
          onClear={clearFilters}
        />
      </motion.div>

      {/* ---------- Section 4 評分表格 / 卡片 ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: EASE_OUT }}
        className="mt-4"
      >
        {error ? (
          <div className="card-surface p-10 text-center text-sm text-danger">{error}</div>
        ) : !loading && sorted.length === 0 ? (
          <div className="card-surface">
            <EmptyState
              title="沒有符合條件的標的"
              description="目前的篩選條件過於嚴格，試著放寬條件或調整權重。"
              actionLabel="放寬篩選條件"
              onAction={relaxFilters}
            />
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait" initial={false}>
              {effectiveView === 'table' ? (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="card-surface overflow-hidden"
                >
                  <ResultsTable
                    rows={visible}
                    themesById={themesById}
                    sort={sort}
                    onSort={handleSort}
                    rankDelta={rankDelta}
                    loading={loading}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="cards"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ResultsCards rows={visible} themesById={themesById} rankDelta={rankDelta} loading={loading} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 載入更多 / 統計 caption */}
            {!loading && (
              <div className="mt-4 flex flex-col items-center gap-3">
                {hasMore && !isMobile && (
                  <button
                    type="button"
                    onClick={() => setLimit((l) => l + PAGE_SIZE)}
                    className="rounded-[10px] border border-border-strong px-5 py-2.5 text-[15px] font-medium text-text-primary transition-colors hover:bg-elevated"
                  >
                    載入更多
                  </button>
                )}
                <span className="num text-xs text-text-muted">
                  顯示 1–{visible.length} / 共 {sorted.length} 檔
                </span>
                {hasMore && isMobile && <div ref={sentinelRef} className="h-px w-full" aria-hidden />}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ---------- Section 5 表下說明列 ---------- */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-text-muted">
        <span>
          <span className="text-accent-gold">●</span> 評分依目前權重即時計算（低估{' '}
          <span className="num">{norm.value}</span> / 題材 <span className="num">{norm.theme}</span> / 量價{' '}
          <span className="num">{norm.volumePrice}</span> / 籌碼 <span className="num">{norm.chips}</span>）
        </span>
        <span>
          <span className="text-warn-amber">▲</span> 過熱股：20 日漲幅 &gt;40%，或貼近 52 週新高且 60 日漲幅
          &gt;30%，綜合分 ×0.6
        </span>
        <span>
          資料快照 <span className="num">{stocksData?.asOf ?? '—'}</span> 收盤 · 來源 TWSE / TPEx
        </span>
        <Link to="/methodology" className="group relative text-accent-cyan transition-colors hover:text-text-primary">
          完整評分公式 →
          <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-200 group-hover:scale-x-100" />
        </Link>
      </div>

      {/* ---------- Mobile 權重 drawer ---------- */}
      <WeightDrawer
        weights={weights}
        onChange={setWeights}
        summary={summary}
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
