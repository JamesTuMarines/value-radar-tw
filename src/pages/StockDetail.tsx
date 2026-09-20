import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EmptyState from '@/components/EmptyState'
import SectionHeader from '@/components/SectionHeader'
import { useStocks, useThemes } from '@/lib/data'
import { DEFAULT_WEIGHTS } from '@/lib/scoring'
import { scoreAll } from '@/lib/stats'
import type { Theme } from '@/lib/types'
import MetricPanels from './stock-detail/MetricPanels'
import PeerSection from './stock-detail/PeerSection'
import PriceChart from './stock-detail/PriceChart'
import ScoreOverview from './stock-detail/ScoreOverview'
import StockHeader from './stock-detail/StockHeader'
import ThemeSection from './stock-detail/ThemeSection'

function DetailSkeleton() {
  const block = 'animate-shimmer rounded-xl border border-border-subtle bg-surface'
  const shimmerStyle = {
    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(232,236,241,0.04) 50%, transparent 100%)',
    backgroundSize: '200% 100%',
  }
  return (
    <div className="container-site py-12" aria-busy="true" aria-label="載入中">
      <div className={`${block} h-20`} style={shimmerStyle} />
      <div className={`${block} mt-8 h-44`} style={shimmerStyle} />
      <div className={`${block} mt-8 h-[240px] lg:h-[480px]`} style={shimmerStyle} />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className={`${block} h-80`} style={shimmerStyle} />
        <div className={`${block} h-80`} style={shimmerStyle} />
      </div>
    </div>
  )
}

export default function StockDetail() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { data: stocksData, loading, error } = useStocks()
  const { data: themes } = useThemes()

  // 切換個股時捲回頁頂
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [code])

  const themesById = useMemo(() => new Map<string, Theme>((themes ?? []).map((t) => [t.id, t])), [themes])

  const scored = useMemo(
    () => (stocksData ? scoreAll(stocksData.stocks, stocksData.industryMedians, DEFAULT_WEIGHTS) : []),
    [stocksData],
  )

  const target = useMemo(() => scored.find((s) => s.stock.code === code) ?? null, [scored, code])

  /** code → themeId → 題材關聯說明（themes.json 真實 note） */
  const noteOf = useMemo(() => {
    const map = new Map<string, Map<string, string>>()
    for (const theme of themes ?? []) {
      for (const ref of theme.stocks) {
        if (!map.has(ref.code)) map.set(ref.code, new Map())
        map.get(ref.code)!.set(theme.id, ref.note)
      }
    }
    return (themeId: string) => map.get(code ?? '')?.get(themeId) ?? null
  }, [themes, code])

  /** 排名：綜合分由高到低 */
  const rank = useMemo(() => {
    if (!target) return 0
    const sorted = [...scored].sort((a, b) => b.scores.total_score - a.scores.total_score)
    return sorted.findIndex((s) => s.stock.code === target.stock.code) + 1
  }, [scored, target])

  /** 同題材其他個股（綜合分高到低，最多 10 檔） */
  const peers = useMemo(() => {
    if (!target) return []
    const themeIds = new Set(target.stock.themes.map((t) => t.id))
    return scored
      .filter((s) => s.stock.code !== target.stock.code && s.stock.themes.some((t) => themeIds.has(t.id)))
      .sort((a, b) => b.scores.total_score - a.scores.total_score)
      .slice(0, 10)
  }, [scored, target])

  if (loading) return <DetailSkeleton />

  if (error || !stocksData) {
    return (
      <div className="container-site">
        <EmptyState
          title="資料載入失敗"
          description={error ?? '請稍後再試。'}
          actionLabel="重新整理"
          onAction={() => window.location.reload()}
        />
      </div>
    )
  }

  if (!target) {
    return (
      <div className="container-site">
        <EmptyState
          title={`查無股票代碼 ${code ?? ''}`}
          description="此代碼不在追蹤池內（共 64 檔），請回到篩選器選擇其他標的。"
          actionLabel="返回篩選器"
          onAction={() => navigate('/screener')}
        />
      </div>
    )
  }

  const { stock, scores } = target

  return (
    <div className="container-site pb-20">
      {/* Section 1 — 個股標頭 */}
      <StockHeader stock={stock} scores={scores} themesById={themesById} noteOf={noteOf} />

      {/* Section 2 — 三維評分總覽列（雷達 + 四格） */}
      <ScoreOverview stock={stock} scores={scores} rank={rank} total={scored.length} />

      {/* Section 3 — 價量走勢圖 */}
      <section className="mt-10">
        <SectionHeader title="價量走勢" eyebrow="PRICE · VOLUME" className="mb-4" />
        <PriceChart key={stock.code} stock={stock} />
      </section>

      {/* Section 4 — 評分明細雙欄 */}
      <section className="mt-10">
        <SectionHeader title="評分明細" eyebrow="SCORE BREAKDOWN" className="mb-4" />
        <MetricPanels stock={stock} scores={scores} />
      </section>

      {/* Section 5 — 題材歸屬 */}
      <ThemeSection stock={stock} themesById={themesById} noteOf={noteOf} />

      {/* Section 6 — 同題材對照 + 返回 CTA */}
      <PeerSection peers={peers} />
    </div>
  )
}
