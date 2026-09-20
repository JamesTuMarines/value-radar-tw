import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/', label: '總覽' },
  { to: '/screener', label: '選股篩選器' },
  { to: '/themes', label: '題材矩陣' },
  { to: '/methodology', label: '方法論' },
]

export const DATA_DATE = '2026-09-18'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isScreener = location.pathname.startsWith('/screener')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <header
      className="sticky top-0 z-50 border-b border-border-subtle backdrop-blur-[12px] transition-colors duration-200"
      style={{ backgroundColor: scrolled ? 'rgba(11,14,20,0.92)' : 'rgba(11,14,20,0.8)' }}
    >
      <div className="container-site flex h-16 items-center justify-between gap-4">
        {/* 品牌 */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="價值雷達" width={32} height={32} />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold text-text-primary">價值雷達</span>
            <span className="num mt-0.5 text-[10px] text-text-muted">ValueRadar TW</span>
          </span>
        </Link>

        {/* 桌面導航 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative px-4 py-2 text-[15px] font-medium transition-colors',
                  isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    className={cn(
                      'absolute inset-x-4 -bottom-[1px] h-0.5 origin-left rounded-full bg-accent-gold transition-transform duration-250',
                      isActive ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* 右側 */}
        <div className="hidden items-center gap-4 md:flex">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs text-text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-down-green" />
            資料日期 <span className="num text-text-secondary">{DATA_DATE}</span>
          </span>
          {!isScreener && (
            <Link
              to="/screener"
              className="rounded-[10px] bg-accent-gold px-5 py-2.5 text-[15px] font-medium text-text-inverse transition-all hover:-translate-y-px hover:brightness-110 active:scale-[0.98]"
            >
              開始篩選
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="rounded-lg p-2 text-text-secondary hover:bg-elevated md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="開啟選單"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border-subtle bg-canvas md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-lg px-3 py-3 text-[15px] font-medium',
                        isActive ? 'bg-elevated text-accent-gold' : 'text-text-secondary',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              <div className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-down-green" />
                資料日期 <span className="num">{DATA_DATE}</span>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
