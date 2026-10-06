import { useMemo } from 'react'
import { useStocks, useThemes } from '@/lib/data'
import { poolIndex, scoreAll, themeStats } from '@/lib/stats'
import SkeletonRow from '@/components/SkeletonRow'
import HeroSection from './home/HeroSection'
import KpiSection, { type KpiData } from './home/KpiSection'
import ThemeHeatmap from './home/ThemeHeatmap'
import TopPicks from './home/TopPicks'
import MethodologySection from './home/MethodologySection'
import CtaBanner from './home/CtaBanner'

export default function Home() {
  const stocksState = useStocks()
  const themesState = useThemes()

  const loading = stocksState.loading || themesState.loading
  const error = stocksState.error ?? themesState.error

  const derived = useMemo(() => {
    const sData = stocksState.data
    const themes = themesState.data
    if (!sData || !themes) return null

    const scored = scoreAll(sData.stocks, sData.industryMedians)
    const sorted = [...scored].sort((a, b) => b.scores.total_score - a.scores.total_score)
    const overheatCount = scored.filter((s) => s.scores.overheat).length
    const strongVp = scored.filter((s) => s.scores.volume_price_score >= 60)
    const listed = sData.stocks.filter((s) => s.market === 'TW').length

    const kpi: KpiData = {
      total: sData.stocks.length,
      listed,
      otc: sData.stocks.length - listed,
      avgValue: scored.reduce((a, s) => a + s.scores.value_score, 0) / (scored.length || 1),
      strongVpCount: strongVp.length,
      strongVpPct: (strongVp.length / (scored.length || 1)) * 100,
      overheatCount,
      poolSeries: poolIndex(sData.stocks),
    }

    return {
      kpi,
      overheatCount,
      tStats: themeStats(scored, themes),
      // TOP 5：排除過熱（已被降評），依綜合分排序
      top5: sorted.filter((s) => !s.scores.overheat).slice(0, 5),
      signals: sorted.filter((s) => !s.scores.overheat).slice(0, 4),
      themesById: new Map(themes.map((t) => [t.id, t])),
      stockCount: sData.stocks.length,
      themeCount: themes.length,
    }
  }, [stocksState.data, themesState.data])

  if (error) {
    return (
      <div className="container-site flex min-h-[50vh] flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-bold text-danger">資料載入失敗</p>
        <p className="text-sm text-text-muted">{error}</p>
      </div>
    )
  }

  if (loading || !derived) {
    return (
      <div className="container-site py-16">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <HeroSection
        stockCount={derived.stockCount}
        themeCount={derived.themeCount}
        overheatCount={derived.overheatCount}
        signals={derived.signals}
      />
      <KpiSection kpi={derived.kpi} />
      <ThemeHeatmap stats={derived.tStats} />
      <TopPicks picks={derived.top5} themesById={derived.themesById} totalCount={derived.stockCount} />
      <MethodologySection />
      <CtaBanner />
    </>
  )
}
