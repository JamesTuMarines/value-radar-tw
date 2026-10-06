import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PurityDots from '@/components/PurityDots'
import { themeColor } from '@/lib/data'
import type { Stock, Theme } from '@/lib/types'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]
const PURITY_LABEL = { high: '高', mid: '中', low: '低' } as const

interface ThemeSectionProps {
  stock: Stock
  themesById: Map<string, Theme>
  noteOf: (themeId: string) => string | null
}

/** Section 5 — 題材歸屬卡：題材色左緣條 + 純度 + 關聯說明 + 題材展望 */
export default function ThemeSection({ stock, themesById, noteOf }: ThemeSectionProps) {
  if (stock.themes.length === 0) return null

  return (
    <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-5">
      <h3 className="text-lg font-bold text-text-primary">題材歸屬與純度</h3>
      <div className="mt-4 space-y-4">
        {stock.themes.map((t, i) => {
          const theme = themesById.get(t.id)
          const color = themeColor(t.id)
          const note = noteOf(t.id)
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: EASE }}
              className="relative overflow-hidden rounded-lg bg-inset py-4 pl-5 pr-4"
            >
              {/* 題材色左緣條（scaleY 生長） */}
              <motion.span
                className="absolute left-0 top-0 h-full w-[3px] origin-top"
                style={{ backgroundColor: color }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: i * 0.1, ease: EASE }}
              />
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-base font-semibold" style={{ color }}>
                  {theme?.name ?? t.id}
                </span>
                <PurityDots purity={t.purity} color={color} />
                <span className="text-xs text-text-muted">純度：{PURITY_LABEL[t.purity]}</span>
                <Link
                  to="/themes"
                  className="ml-auto inline-flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
                >
                  查看題材
                  <ArrowRight size={12} />
                </Link>
              </div>
              {note && <p className="mt-2 text-sm leading-relaxed text-text-primary">{note}</p>}
              {theme?.outlook && (
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{theme.outlook}</p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
