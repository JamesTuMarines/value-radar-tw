import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

export default function CtaBanner() {
  return (
    <section className="container-site pb-24 pt-8">
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative overflow-hidden rounded-2xl p-12 text-center lg:p-16"
        style={{
          background:
            'radial-gradient(ellipse 70% 90% at 80% 20%, rgba(232,182,76,0.10) 0%, transparent 55%), linear-gradient(135deg, #12161F 0%, #16202E 60%, #1A2332 100%)',
          border: '1px solid #232B38',
        }}
      >
        <img
          src="hero-radar.svg"
          alt=""
          className="pointer-events-none absolute -right-24 -top-24 w-[420px] opacity-30"
          draggable={false}
        />
        <h2 className="relative text-[28px] font-bold leading-[1.3] text-text-primary">開始掃描被低估的未來</h2>
        <p className="relative mx-auto mt-3 max-w-[480px] text-[15px] text-text-secondary">
          調整屬於你的權重，讓雷達用同一套邏輯，替你盯著 8 大未來產業的每一檔標的。
        </p>
        <Link
          to="/screener"
          className="group relative mt-8 inline-block overflow-hidden rounded-[10px] bg-accent-gold px-8 py-3.5 text-base font-medium text-text-inverse transition-all hover:-translate-y-px hover:brightness-110 active:scale-[0.98]"
        >
          開啟選股篩選器
          <span
            className="pointer-events-none absolute inset-y-0 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/40 to-transparent max-lg:hidden"
          />
        </Link>
      </motion.div>
    </section>
  )
}
