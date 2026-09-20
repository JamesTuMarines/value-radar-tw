import { cn } from '@/lib/utils'

interface SkeletonRowProps {
  /** 欄數 */
  cols?: number
  className?: string
}

/** 表格載入骨架列：shimmer 動畫 */
export default function SkeletonRow({ cols = 6, className }: SkeletonRowProps) {
  return (
    <div className={cn('flex items-center gap-4 px-4 py-3', className)} aria-hidden>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-4 flex-1 animate-shimmer rounded bg-elevated"
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent 0%, rgba(232,236,241,0.06) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  )
}
