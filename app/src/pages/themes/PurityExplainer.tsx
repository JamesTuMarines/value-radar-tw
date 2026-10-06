import { motion } from 'framer-motion'
import PurityDots from '@/components/PurityDots'
import type { Purity } from '@/lib/types'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const LEVELS: { purity: Purity; label: string; score: number; def: string; example: string }[] = [
  {
    purity: 'high',
    label: '高純度',
    score: 100,
    def: '題材相關營收佔比 >50%，或為該供應鏈核心供應商',
    example: '「光通訊元件佔營收 8 成」',
  },
  {
    purity: 'mid',
    label: '中純度',
    score: 70,
    def: '佔比 20–50%，有明確產品線與訂單',
    example: '「散熱佔 3 成、持續擴產」',
  },
  {
    purity: 'low',
    label: '低純度',
    score: 40,
    def: '佔比 <20%，題材為新事業或間接受惠',
    example: '「集團切入機器人減速機」',
  },
]

/** 題材純度分級說明卡（themes Section 4 與 methodology 題材維度共用） */
export default function PurityExplainer() {
  return (
    <div className="card-surface p-6 sm:p-8">
      <div className="grid gap-6 md:grid-cols-3">
        {LEVELS.map((lv, i) => (
          <motion.div
            key={lv.purity}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
            className="rounded-xl border border-border-subtle bg-inset p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-text-primary">{lv.label}</span>
              <PurityDots purity={lv.purity} color="#E8B64C" />
            </div>
            <div className="num mt-3 text-[28px] font-semibold leading-none text-accent-gold">{lv.score}</div>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{lv.def}</p>
            <p className="mt-2 text-xs text-text-muted">{lv.example}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-text-muted">
        純度直接決定題材分：高 = 100 / 中 = 70 / 低 = 40（取最高純度題材；所屬題材 ≥2 且至少一個高純度再 +10，上限
        100）。
      </p>
    </div>
  )
}
