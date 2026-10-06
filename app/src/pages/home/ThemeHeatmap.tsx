import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ChangeText from '@/components/ChangeText'
import SectionHeader from '@/components/SectionHeader'
import { THEME_TICKER, themeColor } from '@/lib/data'
import type { ThemeStat } from '@/lib/stats'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

export default function ThemeHeatmap({ stats }: { stats: ThemeStat[] }) {
  return (
    <section className="container-site py-16">
      <SectionHeader title="題材熱力圖" eyebrow="THEME HEATMAP" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const color = themeColor(s.theme.id)
          const momentum = Math.round(s.momentum)
          return (
            <motion.div
              key={s.theme.id}
              initial={{ y: 24, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
            >
              <Link
                to={`/screener?theme=${s.theme.id}`}
                className="group card-surface relative block overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1"
                style={{ borderTop: `2px solid ${color}` }}
              >
                {/* hover 題材色微光 */}
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ boxShadow: `0 8px 24px ${color}26 inset, 0 8px 24px ${color}26` }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <h3 className="text-lg font-bold text-text-primary">{s.theme.name}</h3>
                  </div>
                  <span className="num text-[10px] uppercase tracking-wider text-text-muted">
                    {THEME_TICKER[s.theme.id] ?? s.theme.id}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">標的數</span>
                    <span className="num text-text-primary">{s.count} 檔</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">平均低估分</span>
                    <span className="num text-text-primary">{s.avgValue.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-muted">題材動能</span>
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-inset">
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${momentum}%` }}
                          viewport={{ once: true, amount: 0.15 }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: EASE }}
                        />
                      </span>
                      <span className="num text-text-primary">{momentum}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
                  <ChangeText value={s.avgRet20} marker="sign" className="text-[13px]" />
                  <span className="flex items-center gap-1 text-xs text-text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    查看題材 <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
