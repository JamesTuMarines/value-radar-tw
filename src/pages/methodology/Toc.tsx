import { cn } from '@/lib/utils'
import { scrollToSection, useScrollSpy, type TocItem } from './scrollSpy'

/** Desktop sticky 側欄目錄 */
export function TocDesktop({ items }: { items: TocItem[] }) {
  const active = useScrollSpy(items)
  return (
    <nav className="sticky top-24 hidden w-[200px] shrink-0 self-start lg:block" aria-label="章節目錄">
      <ul className="space-y-1 border-l border-border-subtle">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => scrollToSection(item.id)}
              className={cn(
                'relative -ml-px flex w-full items-center gap-2 border-l-2 py-1.5 pl-4 text-left text-[13px] transition-colors',
                active === item.id
                  ? 'border-accent-gold font-medium text-accent-gold'
                  : 'border-transparent text-text-muted hover:text-text-secondary',
              )}
            >
              <span className="num text-[11px]">{item.num}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Mobile 頂部橫向捲動 chips */
export function TocMobile({ items }: { items: TocItem[] }) {
  const active = useScrollSpy(items)
  return (
    <div className="sticky top-16 z-30 -mx-6 mb-8 overflow-x-auto bg-canvas/90 px-6 py-3 backdrop-blur-md lg:hidden">
      <div className="flex gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              active === item.id
                ? 'border-accent-gold/50 bg-accent-gold/10 text-accent-gold'
                : 'border-border-subtle text-text-muted',
            )}
          >
            <span className="num mr-1">{item.num}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
