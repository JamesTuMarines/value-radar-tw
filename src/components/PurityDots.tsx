import type { Purity } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PurityDotsProps {
  purity: Purity
  color?: string
  className?: string
}

/** 題材純度三圓點：高=●●● 中=●●○ 低=●○○ */
export default function PurityDots({ purity, color = 'currentColor', className }: PurityDotsProps) {
  const filled = purity === 'high' ? 3 : purity === 'mid' ? 2 : 1
  return (
    <span className={cn('inline-flex items-center gap-[3px]', className)} aria-label={`純度 ${purity}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-[5px] w-[5px] rounded-full"
          style={{
            backgroundColor: i < filled ? color : 'transparent',
            border: `1px solid ${color}`,
            opacity: i < filled ? 1 : 0.5,
          }}
        />
      ))}
    </span>
  )
}
