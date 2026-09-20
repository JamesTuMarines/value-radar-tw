import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface MomentumRow {
  id: string
  name: string
  color: string
  /** 題材動能分 0–100（成員平均量價分） */
  momentum: number
  count: number
  top3: { code: string; name: string }[]
}

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

/**
 * 題材動能水平長條圖（自繪，無函式庫）：
 * 進入視窗時 bar 由 0 生長（stagger 0.1s）；hover 單列時其他列降透明度，
 * 並浮出該題材代表股 Top 3 tooltip 卡。
 */
export default function MomentumChart({ rows }: { rows: MomentumRow[] }) {
  const sorted = [...rows].sort((a, b) => b.momentum - a.momentum)
  return (
    <div className="group/chart space-y-1.5">
      {/* 軸刻度 */}
      <div className="flex items-center gap-3 pl-[136px] sm:pl-[176px]">
        <div className="relative h-4 flex-1">
          {[0, 25, 50, 75, 100].map((t) => (
            <span
              key={t}
              className="num absolute top-0 -translate-x-1/2 text-[10px] text-text-muted"
              style={{ left: `${t}%` }}
            >
              {t}
            </span>
          ))}
        </div>
        <span className="w-[92px] shrink-0" />
      </div>

      {sorted.map((row, i) => (
        <div
          key={row.id}
          className="group/bar relative flex items-center gap-3 rounded-lg px-1 py-1 transition-opacity duration-200 group-hover/chart:opacity-30 hover:!opacity-100"
        >
          {/* 題材名（點擊捲動至該題材區塊） */}
          <button
            type="button"
            onClick={() =>
              document.getElementById(`theme-${row.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className="flex w-[128px] shrink-0 items-center gap-2 text-left sm:w-[168px]"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
            <span className="truncate text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              {row.name}
            </span>
          </button>

          {/* bar 軌道 */}
          <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-inset sm:h-9">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.max(2, row.momentum)}%` }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: EASE }}
              className="absolute inset-y-0 left-0 rounded-md"
              style={{
                background: `linear-gradient(90deg, ${row.color}59 0%, ${row.color} 100%)`,
              }}
            />
          </div>

          {/* 數值 + 檔數 */}
          <div className="flex w-[92px] shrink-0 items-baseline justify-end gap-1.5">
            <span className="num text-base font-semibold" style={{ color: row.color }}>
              {row.momentum.toFixed(1)}
            </span>
            <span className="num text-xs text-text-muted">{row.count} 檔</span>
          </div>

          {/* hover tooltip：代表股 Top 3 */}
          <div
            className={cn(
              'pointer-events-none absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-border-subtle bg-elevated p-3 shadow-card',
              'opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100',
            )}
          >
            <div className="mb-2 text-xs font-medium text-text-muted">代表個股（綜合分 Top 3）</div>
            <ul className="space-y-1.5">
              {row.top3.map((s) => (
                <li key={s.code} className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: row.color }} />
                  <span className="text-text-primary">{s.name}</span>
                  <span className="num text-text-muted">{s.code}</span>
                </li>
              ))}
              {row.top3.length === 0 && <li className="text-xs text-text-muted">池內暫無標的</li>}
            </ul>
          </div>
        </div>
      ))}

      <p className="pt-3 text-xs leading-relaxed text-text-muted">
        題材動能為展示用指標（題材內標的平均量價分合成），不影響個股題材分；題材分僅由純度與多題材加權決定，見
        <Link to="/methodology" className="text-accent-cyan hover:underline">
          方法論
        </Link>
        。
      </p>
    </div>
  )
}
