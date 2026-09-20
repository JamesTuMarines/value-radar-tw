import { Flame } from 'lucide-react'
import Tooltip from './Tooltip'
import { cn } from '@/lib/utils'

interface OverheatBadgeProps {
  reason?: string | null
  className?: string
}

/** 過熱警示徽章：amber 底 15% + 火焰 icon，tooltip 說明觸發原因 */
export default function OverheatBadge({ reason, className }: OverheatBadgeProps) {
  const badge = (
    <span
      className={cn(
        'inline-flex cursor-help items-center gap-1 rounded-full px-2 py-[3px] text-xs font-medium text-warn-amber',
        className,
      )}
      style={{ backgroundColor: 'rgba(240, 140, 60, 0.15)' }}
    >
      <Flame size={12} />
      過熱
    </span>
  )
  if (!reason) return badge
  return <Tooltip content={`觸發過熱降評（×0.6）：${reason}`}>{badge}</Tooltip>
}
