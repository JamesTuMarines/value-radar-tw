import { motion } from 'framer-motion'
import Tooltip from '@/components/Tooltip'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

export interface MetricRow {
  /** 指標名（15px 600） */
  name: string
  /** 指標定義 */
  def: string
  /** 計分方式（Mono 小卡） */
  rule: string
  /** tooltip 補充說明（可選） */
  tip?: string
}

/** 指標定義表：桌面為三欄列、mobile 為卡片堆疊；計分小卡金色左緣條生長進場 */
export default function MetricTable({ rows, footnote }: { rows: MetricRow[]; footnote?: string }) {
  return (
    <div className="card-surface overflow-hidden">
      {/* 表頭（md 以上） */}
      <div className="hidden grid-cols-[180px_1fr_260px] gap-6 border-b border-border-subtle px-6 py-3 text-xs font-medium text-text-muted md:grid">
        <span>指標</span>
        <span>定義</span>
        <span>計分方式</span>
      </div>

      <div>
        {rows.map((row, i) => (
          <motion.div
            key={row.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
            className="grid gap-3 border-b border-border-subtle px-5 py-5 last:border-b-0 md:grid-cols-[180px_1fr_260px] md:gap-6 md:px-6"
          >
            <div className="text-[15px] font-semibold text-text-primary">
              {row.tip ? (
                <Tooltip content={row.tip}>
                  <span className="cursor-help border-b border-dashed border-text-muted">{row.name}</span>
                </Tooltip>
              ) : (
                row.name
              )}
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">{row.def}</p>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
              className="origin-left rounded-md border-l-2 border-accent-gold bg-inset px-3 py-2"
            >
              <p className="num text-xs leading-relaxed text-text-secondary">{row.rule}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {footnote && (
        <p className="border-t border-border-subtle bg-inset/50 px-5 py-3 text-xs leading-relaxed text-text-muted md:px-6">
          {footnote}
        </p>
      )}
    </div>
  )
}
