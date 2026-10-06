/** N 字放量突破型態偵測卡 — 放量上攻 → 量縮盤整 → 再度放量突破前高 */
import { motion } from 'framer-motion'
import { TrendingUp, Minus } from 'lucide-react'
import Tooltip from '@/components/Tooltip'
import { detectVolumeBreakout, type VolumeBreakout } from '@/lib/patterns'
import type { Stock } from '@/lib/types'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]
const VIOLET = '#A78BFA'

function Phase({
  step,
  title,
  date,
  desc,
  active,
}: {
  step: string
  title: string
  date: string
  desc: string
  active: boolean
}) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-2.5">
      <span
        className={cn(
          'num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
          active ? 'bg-up-red/15 text-up-red' : 'bg-elevated text-text-muted',
        )}
      >
        {step}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn('text-xs font-medium', active ? 'text-text-primary' : 'text-text-secondary')}>
            {title}
          </span>
          <span className="num text-[11px] text-text-muted">{date}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">{desc}</p>
      </div>
    </div>
  )
}

function DetectedBody({ vb }: { vb: VolumeBreakout }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <Phase
        step="1"
        title="放量上攻"
        date={vb.surgeDate}
        desc={`波段漲幅 +${vb.leg1GainPct.toFixed(1)}%，段內出現量 ≥ 1.8×20日均量的長紅`}
        active
      />
      <Phase
        step="2"
        title="量縮盤整"
        date={`${vb.consolDays} 天`}
        desc={`振幅 ${vb.consolRangePct.toFixed(1)}%，均量縮至上攻段的 ${(vb.consolVolRatio * 100).toFixed(0)}%`}
        active
      />
      <Phase
        step="3"
        title="放量突破"
        date={vb.breakoutDate}
        desc={`收盤 ${vb.breakoutClose.toFixed(2)} 突破前高 ${vb.prevHigh.toFixed(2)}，量為盤整均量 ${vb.breakoutVolRatio.toFixed(1)} 倍`}
        active
      />
    </div>
  )
}

export default function VolumeBreakoutCard({ stock }: { stock: Stock }) {
  const vb = detectVolumeBreakout(stock)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
      className="rounded-2xl border border-border-subtle bg-surface p-5"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tooltip content="三段式型態：① 放量上攻（量≥1.8×20日均量的長紅、波段漲≥5%）→ ② 量縮盤整 3–12 天（量縮至上攻段 75% 以下、振幅 ≤10%、守住前高 −8%）→ ③ 最近 3 日內再度放量（≥盤整均量 1.5 倍）收盤突破前高。屬高精度的稀有訊號，多數時間無標的符合。">
          <span className="cursor-help text-sm font-semibold text-text-primary underline decoration-dotted decoration-text-muted/50 underline-offset-4">
            N 字放量突破
          </span>
        </Tooltip>
        {vb ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-up-red/15 px-2.5 py-0.5 text-[11px] font-medium text-up-red">
            <TrendingUp size={12} />
            符合{vb.daysAgo > 0 ? `（${vb.daysAgo} 個交易日前突破）` : '（最新交易日突破）'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-elevated px-2.5 py-0.5 text-[11px] font-medium text-text-muted">
            <Minus size={12} />
            目前未符合
          </span>
        )}
      </div>

      {vb ? (
        <DetectedBody vb={vb} />
      ) : (
        <p className="text-xs leading-relaxed text-text-muted">
          近 45 個交易日內未出現完整的「放量上攻 → 量縮盤整 → 放量突破前高」三段結構，
          或突破尚未發生。此型態講究新鮮度（突破須在最近 3 個交易日內），符合時代表攻擊訊號剛啟動。
        </p>
      )}

      <p className="mt-4 border-t border-border-subtle pt-3 text-[11px] leading-relaxed" style={{ color: VIOLET }}>
        型態僅描述價量結構，不構成買賣建議；突破後仍可能假突破，請搭配停損與基本面判斷。
      </p>
    </motion.div>
  )
}
