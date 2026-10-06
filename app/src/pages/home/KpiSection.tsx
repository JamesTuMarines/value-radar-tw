import { motion } from 'framer-motion'
import { Activity, Flame, Layers, ListChecks } from 'lucide-react'
import CountUp from '@/components/CountUp'
import Sparkline from '@/components/Sparkline'

export interface KpiData {
  total: number
  listed: number
  otc: number
  avgValue: number
  strongVpCount: number
  strongVpPct: number
  overheatCount: number
  poolSeries: number[]
}

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

export default function KpiSection({ kpi }: { kpi: KpiData }) {
  const cards = [
    {
      icon: ListChecks,
      label: '追蹤標的總數',
      value: <CountUp value={kpi.total} className="num text-[40px] font-semibold leading-none text-text-primary" />,
      sub: `上市 ${kpi.listed} / 上櫃 ${kpi.otc}`,
      subClass: 'text-text-muted',
      spark: true,
    },
    {
      icon: Layers,
      label: '平均低估分',
      value: <CountUp value={kpi.avgValue} decimals={1} className="num text-[40px] font-semibold leading-none text-accent-gold" />,
      sub: 'PER 折價 × PBR × 殖利率 × 營收',
      subClass: 'text-text-muted',
      spark: true,
    },
    {
      icon: Activity,
      label: '量價轉強家數',
      value: <CountUp value={kpi.strongVpCount} className="num text-[40px] font-semibold leading-none text-accent-cyan" />,
      sub: `佔比 ${kpi.strongVpPct.toFixed(1)}%（量價分 ≥ 60）`,
      subClass: 'text-accent-cyan/80',
      spark: true,
    },
    {
      icon: Flame,
      label: '過熱剔除',
      value: <CountUp value={kpi.overheatCount} className="num text-[40px] font-semibold leading-none text-warn-amber" />,
      sub: '短線急漲遭降評 ×0.6',
      subClass: 'text-warn-amber/80',
      spark: true,
    },
  ]

  return (
    <section className="container-site py-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ y: 32, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
            className="card-surface flex h-[140px] flex-col justify-between p-5"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
                <c.icon size={14} />
                {c.label}
              </span>
              {c.spark && kpi.poolSeries.length > 1 && (
                <Sparkline data={kpi.poolSeries} width={56} height={24} animate />
              )}
            </div>
            <div className="flex items-end justify-between gap-2">
              {c.value}
              <span className={`text-right text-xs ${c.subClass}`}>{c.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
