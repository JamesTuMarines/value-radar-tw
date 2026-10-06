/** 建議買進區間卡 — 以技術支撐機械式規則計算，僅供研究參考 */
import { motion } from 'framer-motion'
import Tooltip from '@/components/Tooltip'
import { computeBuyZone, type BuyZone } from '@/lib/buyzone'
import type { ScoreBreakdown } from '@/lib/scoring'
import type { Stock } from '@/lib/types'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const TREND_BADGE: Record<BuyZone['trend'], { label: string; cls: string }> = {
  strong: { label: '強勢', cls: 'bg-up-red/15 text-up-red' },
  range: { label: '盤整', cls: 'bg-accent-gold/15 text-accent-gold' },
  weak: { label: '弱勢', cls: 'bg-elevated text-text-muted' },
}

const POSITION_HINT: Record<BuyZone['position'], { label: string; cls: string; dot: string }> = {
  below: { label: '低於區間', cls: 'text-accent-cyan', dot: '#4CC3E8' },
  inside: { label: '區間內可分批', cls: 'text-up-red', dot: '#F0506E' },
  above: { label: '高於區間等回測', cls: 'text-warn-amber', dot: '#F08C3C' },
}

const fmt = (v: number) => v.toFixed(2)

/** 水平區間帶：elevated 軌道 + 金色區間段 + low/high/stop 刻度 + 現價 marker */
function ZoneBand({ zone, price }: { zone: BuyZone; price: number }) {
  const pts = [zone.stop, zone.low, zone.high, price]
  const rawMin = Math.min(...pts)
  const rawMax = Math.max(...pts)
  const pad = (rawMax - rawMin || rawMax * 0.1 || 1) * 0.06
  const min = rawMin - pad
  const max = rawMax + pad
  const x = (v: number) => ((v - min) / (max - min)) * 100

  const ticks: { v: number; label: string; cls: string }[] = [
    { v: zone.stop, label: `停損 ${fmt(zone.stop)}`, cls: 'text-danger' },
    { v: zone.low, label: fmt(zone.low), cls: 'text-accent-gold' },
    { v: zone.high, label: fmt(zone.high), cls: 'text-accent-gold' },
  ]

  return (
    <div className="relative mt-12 h-20 select-none" aria-hidden="true">
      {/* 軌道 */}
      <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-elevated" />
      {/* 區間段 */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="absolute top-1/2 h-2 origin-left -translate-y-1/2 rounded-full bg-accent-gold/25"
        style={{ left: `${x(zone.low)}%`, width: `${x(zone.high) - x(zone.low)}%` }}
      />
      {/* 刻度線 + 標籤 */}
      {ticks.map((t) => (
        <div key={t.label} className="absolute top-1/2 -translate-x-1/2" style={{ left: `${x(t.v)}%` }}>
          <div className={cn('h-4 w-px -translate-y-1/2', t.cls === 'text-danger' ? 'bg-danger' : 'bg-accent-gold/70')} />
          <span
            className={cn(
              'num absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px]',
              t.cls,
              t.cls === 'text-danger' ? 'top-3' : '-top-7',
            )}
          >
            {t.label}
          </span>
        </div>
      ))}
      {/* 現價 marker */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${x(price)}%` }}
      >
        <div
          className="h-3.5 w-3.5 rounded-full border-2 border-canvas"
          style={{ backgroundColor: POSITION_HINT[zone.position].dot, boxShadow: `0 0 0 3px ${POSITION_HINT[zone.position].dot}33` }}
        />
        <span
          className={cn(
            'num absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium',
            POSITION_HINT[zone.position].cls,
          )}
        >
          現價 {fmt(price)}
        </span>
      </motion.div>
    </div>
  )
}

interface BuyZoneCardProps {
  stock: Stock
  scores: ScoreBreakdown
}

/** 「建議買進區間」卡片：區間帶 + 停損 + 策略說明（機械式規則，非投資建議） */
export default function BuyZoneCard({ stock, scores }: BuyZoneCardProps) {
  const zone = computeBuyZone(stock, scores.overheat)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface"
    >
      <div className="h-[3px] w-full bg-accent-gold" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between">
          <Tooltip content="依均線結構與 60 日低點機械式計算的分批買進區間與參考停損。規則詳見方法論頁。">
            <h3 className="cursor-help text-lg font-bold text-text-primary underline decoration-dotted decoration-text-muted/50 underline-offset-4">
              建議買進區間
            </h3>
          </Tooltip>
          {zone && (
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', TREND_BADGE[zone.trend].cls)}>
              {TREND_BADGE[zone.trend].label}
            </span>
          )}
        </div>

        {!zone || stock.price == null ? (
          <p className="mt-6 text-sm text-text-muted">資料不足，暫無建議區間。</p>
        ) : (
          <>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="num text-[15px] text-text-primary">
                {fmt(zone.low)} <span className="text-text-muted">~</span> {fmt(zone.high)}
              </span>
              <span className={cn('text-xs font-medium', POSITION_HINT[zone.position].cls)}>
                {POSITION_HINT[zone.position].label}
              </span>
            </div>

            <ZoneBand zone={zone} price={stock.price} />

            <div className="mt-8 flex items-center justify-between border-t border-border-subtle/50 pt-3">
              <span className="text-[13px] text-text-secondary">參考停損價</span>
              <span className="num text-[15px] font-semibold text-danger">{fmt(zone.stop)}</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-text-secondary">{zone.note}</p>
          </>
        )}

        <p className="mt-auto pt-4 text-[11px] text-text-muted">
          機械式規則計算，僅供研究參考，非投資建議
        </p>
      </div>
    </motion.div>
  )
}
