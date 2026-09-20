/** Mobile — 權重控制台底部 drawer（lg 以下取代 sticky 面板） */
import { AnimatePresence, motion } from 'framer-motion'
import { Scale } from 'lucide-react'
import type { ScoreWeights } from '@/lib/scoring'
import { WeightPanelBody, type WeightSummary } from './WeightPanel'

interface WeightDrawerProps {
  weights: ScoreWeights
  onChange: (w: ScoreWeights) => void
  summary: WeightSummary
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export default function WeightDrawer({ weights, onChange, summary, open, onOpen, onClose }: WeightDrawerProps) {
  return (
    <div className="lg:hidden">
      {/* 常駐底部按鈕條 */}
      {!open && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={onOpen}
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 rounded-xl border border-accent-gold/60 bg-canvas/80 py-3 text-sm font-medium text-accent-gold shadow-card backdrop-blur-md"
        >
          <Scale size={16} />
          調整權重
          <span className="num text-text-secondary">
            （{weights.value}/{weights.theme}/{weights.volumePrice}）
          </span>
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              key="drawer"
              role="dialog"
              aria-label="調整評分權重"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80) onClose()
              }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border-subtle bg-surface px-6 pb-8 pt-3"
            >
              {/* 拖曳把手 */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-subtle" />
              <WeightPanelBody weights={weights} onChange={onChange} summary={summary} />
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-[10px] bg-accent-gold py-3 text-[15px] font-medium text-text-inverse transition-all hover:brightness-110 active:scale-[0.98]"
              >
                完成
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
