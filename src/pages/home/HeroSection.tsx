import { memo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Sparkline from '@/components/Sparkline'
import { DATA_DATE } from '@/components/Navbar'
import { useAsOf } from '@/lib/data'
import type { ScoredStock } from '@/lib/stats'

gsap.registerPlugin(ScrollTrigger)

/** 雷達掃描線（conic-gradient mask 旋轉，6s linear infinite）— 獨立 memo 微元件 */
const RadarSweep = memo(function RadarSweep() {
  return (
    <div
      className="pointer-events-none absolute inset-0 animate-radar-spin rounded-full motion-reduce:animate-none"
      style={{
        background:
          'conic-gradient(from 0deg, rgba(232,182,76,0.35) 0deg, rgba(232,182,76,0.08) 20deg, transparent 30deg)',
        WebkitMaskImage: 'radial-gradient(circle, black 0%, black 100%)',
        maskImage: 'radial-gradient(circle, black 0%, black 100%)',
      }}
    />
  )
})

const CARD_POSITIONS = [
  { top: '6%', left: '2%' },
  { top: '16%', right: '0%' },
  { bottom: '24%', left: '-4%' },
  { bottom: '4%', right: '8%' },
]

interface HeroSectionProps {
  stockCount: number
  themeCount: number
  overheatCount: number
  signals: ScoredStock[]
}

export default function HeroSection({ stockCount, themeCount, overheatCount, signals }: HeroSectionProps) {
  const dataDate = useAsOf() ?? DATA_DATE
  const rootRef = useRef<HTMLElement>(null)
  const radarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        gsap.set('[data-hero]', { opacity: 1, y: 0, scale: 1 })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo('[data-hero="eyebrow"]', { opacity: 0 }, { opacity: 1, duration: 0.3 })
        .fromTo(
          '[data-hero="char"]',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.03 },
          0.1,
        )
        .fromTo('[data-hero="sub"]', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.4')
        .fromTo(
          '[data-hero="cta"]',
          { scale: 0.96, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, stagger: 0.08 },
          '-=0.3',
        )
        .fromTo(
          '[data-hero="stat"]',
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
          '-=0.3',
        )
      // 雷達進場
      tl.fromTo(
        '[data-hero="radar"]',
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: 'expo.out' },
        0.2,
      ).fromTo(
        '[data-hero="signal"]',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'back.out(1.7)' },
        '-=0.5',
      )
      // 滾動 parallax：雷達 0.3 倍速、訊號卡 0.5 倍速上移
      gsap.to('[data-hero="radar-wrap"]', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: 0.3 },
      })
      gsap.to('[data-hero="signal"]', {
        yPercent: -24,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: 0.5 },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  const line1 = '在雜訊中，掃描出'
  const line2 = '被低估的未來'

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% -10%, #1A2332 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,182,76,0.04) 0%, transparent 70%)',
      }}
    >
      {/* grid 紋理 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: 'url(grid-texture.svg)', backgroundRepeat: 'repeat' }}
      />

      <div className="container-site relative grid min-h-[92dvh] items-center gap-12 py-16 lg:grid-cols-[7fr_5fr]">
        {/* 左欄 */}
        <div className="relative z-10">
          <span
            data-hero="eyebrow"
            className="num inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-accent-cyan opacity-0"
            style={{ borderColor: 'rgba(76,195,232,0.3)' }}
          >
            ▸ 台股波段選股工具 · 資料日期 {dataDate}
          </span>

          <h1 className="mt-6 text-[36px] font-black leading-[1.15] text-text-primary lg:text-[56px]">
            <span className="block overflow-hidden">
              {line1.split('').map((ch, i) => (
                <span key={i} data-hero="char" className="inline-block opacity-0">
                  {ch}
                </span>
              ))}
            </span>
            <span className="block overflow-hidden">
              {line2.split('').map((ch, i) => (
                <span key={i} data-hero="char" className="inline-block text-accent-gold opacity-0">
                  {ch}
                </span>
              ))}
              <span
                data-hero="cta"
                className="mt-2 block h-1 w-40 origin-left animate-none rounded-full bg-accent-gold opacity-0"
                style={{ animation: 'underline-in 0.6s ease-out 1s forwards' }}
              />
            </span>
          </h1>

          <p data-hero="sub" className="mt-6 max-w-[480px] text-[17px] leading-[1.7] text-text-secondary opacity-0">
            以估值、題材純度、量價結構、法人籌碼四維評分，從 8 大未來產業中篩出市場還沒定價的台股標的——拒絕短線炒作，只看
            3–12 個月的波段機會。
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              data-hero="cta"
              to="/screener"
              className="rounded-[10px] bg-accent-gold px-6 py-3 text-[15px] font-medium text-text-inverse opacity-0 transition-all hover:-translate-y-px hover:brightness-110 active:scale-[0.98]"
            >
              開始篩選 →
            </Link>
            <Link
              data-hero="cta"
              to="/methodology"
              className="rounded-[10px] border border-border-strong px-6 py-3 text-[15px] font-medium text-text-primary opacity-0 transition-colors hover:bg-elevated"
            >
              了解評分方法
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { label: '追蹤標的', value: `${stockCount} 檔` },
              { label: '涵蓋題材', value: `${themeCount} 大類` },
              { label: '今日過熱剔除', value: `${overheatCount} 檔` },
            ].map((s) => (
              <div key={s.label} data-hero="stat" className="opacity-0">
                <div className="num text-[28px] font-semibold leading-none text-accent-gold">{s.value}</div>
                <div className="mt-1.5 text-xs text-text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 右欄：雷達（mobile 縮為背景裝飾） */}
        <div
          ref={radarRef}
          data-hero="radar-wrap"
          className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto w-full max-w-[600px] -translate-y-1/2 opacity-[0.12] lg:pointer-events-auto lg:relative lg:top-auto lg:translate-y-0 lg:opacity-100"
        >
          <div data-hero="radar" className="relative aspect-square opacity-0">
            <img src="hero-radar.svg" alt="" className="h-full w-full" draggable={false} />
            <RadarSweep />
            {/* 浮動訊號卡 */}
            {signals.slice(0, 4).map((s, i) => (
              <div
                key={s.stock.code}
                data-hero="signal"
                className={`absolute w-[150px] rounded-xl border border-border-subtle bg-elevated/80 p-3 opacity-0 shadow-card backdrop-blur-md ${i >= 2 ? 'hidden sm:block' : ''}`}
                style={{
                  ...CARD_POSITIONS[i],
                  animation: `float-${i % 2} ${4 + i * 0.6}s ease-in-out infinite`,
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-bold text-text-primary">{s.stock.name}</span>
                  <span className="num text-[11px] text-text-muted">{s.stock.code}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="num text-xs text-accent-gold">綜合 {s.scores.total_score.toFixed(1)}</span>
                  <Sparkline data={s.stock.history?.close.slice(-40) ?? []} width={56} height={20} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-0 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float-1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes underline-in { from { transform: scaleX(0); opacity: 1; } to { transform: scaleX(1); opacity: 1; } }
      `}</style>
    </section>
  )
}
