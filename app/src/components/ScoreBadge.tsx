import { ratingColor } from '@/lib/scoring'
import { cn } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number
  /** 放大版（榜單用 64×32） */
  size?: 'md' | 'lg'
  className?: string
}

/** 綜合分徽章：底色為評分色階 18% 透明、文字評分色 100%、Mono */
export default function ScoreBadge({ score, size = 'md', className }: ScoreBadgeProps) {
  const color = ratingColor(score)
  return (
    <span
      className={cn(
        'num inline-flex items-center justify-center rounded-lg font-semibold',
        size === 'md' ? 'h-7 w-14 text-sm' : 'h-8 w-16 text-[15px]',
        className,
      )}
      style={{ backgroundColor: `${color}2E`, color }}
    >
      {score.toFixed(1)}
    </span>
  )
}
