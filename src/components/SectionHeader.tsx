import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  /** 右側英文小標（Mono 12px muted uppercase） */
  eyebrow?: string
  /** 右側額外內容（如「查看全部 →」連結） */
  action?: ReactNode
  className?: string
}

/** h2 + 英文小標 + 底部 1px 漸層線（金色→透明） */
export default function SectionHeader({ title, eyebrow, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[28px] font-bold leading-[1.3] text-text-primary">{title}</h2>
          {eyebrow && (
            <span className="eyebrow-label hidden sm:inline">{eyebrow}</span>
          )}
        </div>
        {action}
      </div>
      <div
        className="mt-3 h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, rgba(232,182,76,0.6) 0%, rgba(232,182,76,0.15) 30%, transparent 60%)',
        }}
      />
    </div>
  )
}
