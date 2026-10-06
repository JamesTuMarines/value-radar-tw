/** 籌碼維度卡片 — 三大法人買賣超（資料來源 FinMind，每日更新） */
import { motion } from 'framer-motion'
import ScoreBadge from '@/components/ScoreBadge'
import Tooltip from '@/components/Tooltip'
import type { ScoreBreakdown } from '@/lib/scoring'
import type { Stock } from '@/lib/types'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]
const CHIP_BLUE = '#6E9BFF'

/** 千分位 + 正負號的「張」數（台股慣例：正=買超=紅、負=賣超=綠） */
function LotsValue({ v, className }: { v: number | null; className?: string }) {
  if (v == null) return <span className={cn('num text-text-muted', className)}>—</span>
  const color = v > 0 ? 'text-up-red' : v < 0 ? 'text-down-green' : 'text-text-muted'
  const abs = Math.abs(Math.round(v)).toLocaleString('en-US')
  return (
    <span className={cn('num', color, className)}>
      {v > 0 ? '+' : v < 0 ? '−' : ''}
      {abs}
    </span>
  )
}

/** 百分點變化值（正=紅=加碼、負=綠=減碼） */
function PpValue({ v, className }: { v: number | null | undefined; className?: string }) {
  if (v == null) return <span className={cn('num text-text-muted', className)}>—</span>
  const color = v > 0 ? 'text-up-red' : v < 0 ? 'text-down-green' : 'text-text-muted'
  return (
    <span className={cn('num', color, className)}>
      {v > 0 ? '+' : v < 0 ? '−' : ''}
      {Math.abs(v).toFixed(2)} pp
    </span>
  )
}

/** 主力動向解讀 chip */
function MajorChip({ chg }: { chg: number | null | undefined }) {
  if (chg == null) return null
  const cfg =
    chg >= 0.3
      ? { label: '主力加碼', cls: 'bg-up-red/15 text-up-red' }
      : chg <= -0.3
        ? { label: '主力減碼', cls: 'bg-down-green/15 text-down-green' }
        : { label: '持股持平', cls: 'bg-elevated text-text-muted' }
  return (
    <span className={cn('ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', cfg.cls)}>
      {cfg.label}
    </span>
  )
}

interface ChipsPanelProps {
  stock: Stock
  scores: ScoreBreakdown
}

/** 「籌碼維度 · 三大法人」卡片：外資 / 投信 / 自營商 / 合計淨買超（單位：張） */
export default function ChipsPanel({ stock, scores }: ChipsPanelProps) {
  const c = stock.chips
  const share = scores.detail.inst_vol_share

  const rows: { name: string; d5: number | null; d20: number | null }[] = c
    ? [
        { name: '外資', d5: c.foreign_5d, d20: c.foreign_20d },
        { name: '投信', d5: c.trust_5d, d20: c.trust_20d },
        { name: '自營商', d5: null, d20: c.dealer_20d },
        { name: '合計', d5: null, d20: c.total_20d },
      ]
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="overflow-hidden rounded-xl border border-border-subtle bg-surface"
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: CHIP_BLUE }} />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <Tooltip content="資料來源 FinMind 三大法人買賣超，每日更新。正值＝淨買超、負值＝淨賣超（單位：張）。">
            <h3 className="cursor-help text-lg font-bold text-text-primary underline decoration-dotted decoration-text-muted/50 underline-offset-4">
              籌碼維度 · 三大法人
            </h3>
          </Tooltip>
          <ScoreBadge score={scores.chip_score} />
        </div>

        {!c ? (
          <p className="mt-6 text-sm text-text-muted">此標的暫無籌碼資料，籌碼分以中性 50 分計。</p>
        ) : (
          <>
            <table className="mt-4 w-full border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-[12px] text-text-muted">
                  <th className="py-2 text-left font-medium">法人別</th>
                  <th className="py-2 text-right font-medium">5 日（張）</th>
                  <th className="py-2 text-right font-medium">20 日（張）</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <motion.tr
                    key={r.name}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.35, delay: i * 0.06, ease: EASE }}
                    className={cn(
                      'border-b border-border-subtle/50 last:border-b-0',
                      r.name === '合計' && 'bg-inset/50 font-medium',
                    )}
                  >
                    <td className="py-2.5 text-[13px] text-text-secondary">{r.name}</td>
                    <td className="py-2.5 text-right text-[14px]">
                      <LotsValue v={r.d5} />
                    </td>
                    <td className="py-2.5 text-right text-[14px]">
                      <LotsValue v={r.d20} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <p className="num mt-4 text-xs text-text-muted">
              法人 20 日淨買超佔 20 日總成交量{' '}
              <span className="text-text-secondary">
                {share == null ? '—' : `${(share * 100).toFixed(1)}%`}
              </span>
              {c.days > 0 && <span>（統計 {c.days} 個交易日）</span>}
            </p>

            {/* 主力（外資持股） */}
            <div className="mt-5 border-t border-border-subtle/50 pt-4">
              <Tooltip content="資料來源 FinMind 外資持股比例。外資為台股最大主力，持股比例變化反映中長期加減碼方向。">
                <h4 className="cursor-help text-[13px] font-semibold text-text-primary underline decoration-dotted decoration-text-muted/50 underline-offset-4">
                  主力（外資持股）
                </h4>
              </Tooltip>
              <dl className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-text-secondary">外資持股比例</dt>
                  <dd className="num text-[14px] text-text-primary">
                    {c.foreign_ratio == null ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      `${c.foreign_ratio.toFixed(2)}%`
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-text-secondary">近 20 日變化</dt>
                  <dd className="flex items-center text-[14px]">
                    <PpValue v={c.foreign_ratio_chg_20d} />
                    <MajorChip chg={c.foreign_ratio_chg_20d} />
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
