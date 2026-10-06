import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ChangeText from '@/components/ChangeText'
import ScoreBadge from '@/components/ScoreBadge'
import Sparkline from '@/components/Sparkline'
import type { ScoredStock } from '@/lib/stats'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

interface PeerSectionProps {
  peers: ScoredStock[]
}

/** Section 6 — 同題材低估標的橫向卡列 + 返回 CTA */
export default function PeerSection({ peers }: PeerSectionProps) {
  const navigate = useNavigate()

  return (
    <div className="mt-8">
      {peers.length > 0 && (
        <>
          <h3 className="text-lg font-bold text-text-primary">同題材低估標的</h3>
          {/* 橫向捲動卡列，邊緣漸淡 mask */}
          <div
            className="mt-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-subtle"
            style={{
              maskImage: 'linear-gradient(90deg, black 0%, black calc(100% - 48px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(90deg, black 0%, black calc(100% - 48px), transparent 100%)',
            }}
          >
            <div className="flex gap-3">
              {peers.map((p, i) => (
                <motion.button
                  key={p.stock.code}
                  type="button"
                  onClick={() => navigate(`/stock/${p.stock.code}`)}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
                  className="w-[168px] shrink-0 cursor-pointer rounded-xl border border-border-subtle bg-surface p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-elevated hover:shadow-card"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold text-text-primary">{p.stock.name}</span>
                    <span className="num text-xs text-text-muted">{p.stock.code}</span>
                  </div>
                  <div className="mt-3">
                    <Sparkline data={p.stock.history?.close.slice(-80) ?? []} width={132} height={36} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="num">
                      <div className="text-sm font-medium text-text-primary">
                        {p.stock.price != null ? p.stock.price.toFixed(2) : '—'}
                      </div>
                      <ChangeText value={p.stock.change_pct} className="text-xs" />
                    </div>
                    <ScoreBadge score={p.scores.total_score} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 返回 CTA */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/screener"
          className="inline-flex items-center gap-2 rounded-[10px] border border-border-strong px-5 py-2.5 text-[15px] font-medium text-text-primary transition-colors hover:bg-elevated"
        >
          <ArrowLeft size={16} />
          返回篩選器
        </Link>
        <Link
          to="/methodology"
          className="text-[15px] text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
        >
          查看方法論
        </Link>
      </div>
    </div>
  )
}
