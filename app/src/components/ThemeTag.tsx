import PurityDots from './PurityDots'
import { themeColor } from '@/lib/data'
import type { Purity } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ThemeTagProps {
  id: string
  name: string
  purity?: Purity
  className?: string
}

/** 題材標籤：圓角 999px、題材色 16% 底 + 題材色文字 12px 500 + 純度圓點 */
export default function ThemeTag({ id, name, purity, className }: ThemeTagProps) {
  const color = themeColor(id)
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-xs font-medium', className)}
      style={{ backgroundColor: `${color}29`, color }}
    >
      {name}
      {purity && <PurityDots purity={purity} color={color} />}
    </span>
  )
}
