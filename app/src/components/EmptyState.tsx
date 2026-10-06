import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

/** 無結果狀態：灰色雷達 + 建議放寬條件 */
export default function EmptyState({
  title = '沒有符合條件的標的',
  description = '目前的篩選條件過於嚴格，試著放寬條件或調整權重。',
  actionLabel = '放寬篩選條件',
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      <img src="empty-radar.svg" alt="" width={160} height={160} className="opacity-80" />
      <div>
        <p className="text-lg font-bold text-text-primary">{title}</p>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-[10px] border border-border-strong px-5 py-2.5 text-[15px] font-medium text-text-primary transition-colors hover:bg-elevated"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
