import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

interface CtaBannerProps {
  title: string
  subtitle?: string
  /** 較矮版型（方法論頁） */
  compact?: boolean
}

/** 底部 CTA 橫幅卡（themes 與 methodology 共用） */
export default function CtaBanner({ title, subtitle, compact = false }: CtaBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`card-surface relative overflow-hidden text-center ${compact ? 'px-6 py-12' : 'px-6 py-16'}`}
    >
      {/* 金色微光 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 120%, rgba(232,182,76,0.10) 0%, transparent 60%)',
        }}
      />
      <div className="relative">
        <h2 className="text-[28px] font-bold leading-[1.3] text-text-primary">{title}</h2>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-text-secondary">{subtitle}</p>
        )}
        <Link
          to="/screener"
          className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-accent-gold px-6 py-3 text-[15px] font-medium text-text-inverse transition-all hover:-translate-y-px hover:brightness-110 active:scale-[0.98]"
        >
          開啟選股篩選器
          <ArrowRight size={16} />
        </Link>
      </div>
    </motion.div>
  )
}
