/** Section 3 — 篩選條件列：題材 chips、市場別、評級、開關、PER 區間、搜尋 */
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { themeColor } from '@/lib/data'
import type { Theme } from '@/lib/types'
import type { Filters, MarketFilter, RatingFilter } from './utils'
import { RATING_OPTIONS } from './utils'
import { cn } from '@/lib/utils'

/* ---------- 小開關 ---------- */
function Toggle({
  checked,
  onChange,
  color,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  color: string
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex shrink-0 items-center gap-2"
    >
      <span
        className="relative h-5 w-9 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? color : '#232B38' }}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-text-primary shadow transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </span>
      <span className="whitespace-nowrap text-xs text-text-secondary">{label}</span>
    </button>
  )
}

const Divider = () => <span className="h-6 w-px shrink-0 bg-border-subtle" aria-hidden />

interface FilterBarProps {
  filters: Filters
  onPatch: (patch: Partial<Filters>) => void
  themes: Theme[]
  /** 已套用條件數（非預設） */
  activeCount: number
  onClear: () => void
}

export default function FilterBar({ filters, onPatch, themes, activeCount, onClear }: FilterBarProps) {
  // 搜尋輸入即時顯示，300ms debounce 後才套用
  const [searchInput, setSearchInput] = useState(filters.search)
  useEffect(() => setSearchInput(filters.search), [filters.search])
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (searchInput !== filters.search) onPatch({ search: searchInput })
    }, 300)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const toggleTheme = (id: string) => {
    const next = filters.themes.includes(id)
      ? filters.themes.filter((t) => t !== id)
      : [...filters.themes, id]
    onPatch({ themes: next })
  }

  const markets: { value: MarketFilter; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'TW', label: '上市' },
    { value: 'TPEx', label: '上櫃' },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
        {/* 題材多選 chips */}
        <div className="flex shrink-0 items-center gap-2">
          {themes.map((t) => {
            const color = themeColor(t.id)
            const active = filters.themes.includes(t.id)
            return (
              <motion.button
                key={t.id}
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.15 }}
                onClick={() => toggleTheme(t.id)}
                aria-pressed={active}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  active ? '' : 'border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary',
                )}
                style={
                  active
                    ? { backgroundColor: `${color}33`, borderColor: color, color }
                    : undefined
                }
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                {t.name}
              </motion.button>
            )
          })}
        </div>

        <Divider />

        {/* 市場別 segmented */}
        <div className="flex shrink-0 items-center rounded-lg border border-border-subtle bg-inset p-0.5">
          {markets.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onPatch({ market: m.value })}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                filters.market === m.value
                  ? 'bg-elevated text-text-primary'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <Divider />

        {/* 評級 */}
        <div className="flex shrink-0 items-center gap-1.5">
          {RATING_OPTIONS.map((r) => {
            const active = filters.rating === r.value
            return (
              <motion.button
                key={r.value}
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.15 }}
                onClick={() => onPatch({ rating: r.value as RatingFilter })}
                aria-pressed={active}
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  active ? '' : 'border-border-subtle text-text-muted hover:text-text-secondary',
                )}
                style={
                  active
                    ? { backgroundColor: `${r.color}29`, borderColor: r.color, color: r.color }
                    : undefined
                }
              >
                {r.label}
              </motion.button>
            )
          })}
        </div>

        <Divider />

        {/* 過濾開關 */}
        <Toggle
          label="剔除過熱"
          color="#F08C3C"
          checked={filters.excludeOverheat}
          onChange={(v) => onPatch({ excludeOverheat: v })}
        />
        <Toggle
          label="僅量價轉強"
          color="#4CC3E8"
          checked={filters.onlyVpStrong}
          onChange={(v) => onPatch({ onlyVpStrong: v })}
        />
        <Toggle
          label="僅高題材純度"
          color="#E8B64C"
          checked={filters.onlyHighPurity}
          onChange={(v) => onPatch({ onlyHighPurity: v })}
        />

        <Divider />

        {/* PER 區間 */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs text-text-muted">PER</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
            value={filters.perMin}
            onChange={(e) => onPatch({ perMin: e.target.value })}
            className="num w-16 rounded-lg border border-border-subtle bg-inset px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
            aria-label="PER 下限"
          />
          <span className="text-text-muted">–</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="50"
            value={filters.perMax}
            onChange={(e) => onPatch({ perMax: e.target.value })}
            className="num w-16 rounded-lg border border-border-subtle bg-inset px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
            aria-label="PER 上限"
          />
        </div>

        <Divider />

        {/* 搜尋 */}
        <div className="relative shrink-0">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="代碼或名稱…"
            className="w-44 rounded-lg border border-border-subtle bg-inset py-1.5 pl-8 pr-7 text-xs text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            aria-label="搜尋代碼或名稱"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                onPatch({ search: '' })
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              aria-label="清除搜尋"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 已套用條件提示列 */}
      {activeCount > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          <span>
            已套用 <span className="num text-accent-gold">{activeCount}</span> 個條件
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
          >
            × 清除
          </button>
        </div>
      )}
    </div>
  )
}
