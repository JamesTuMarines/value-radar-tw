import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataChipProps {
  icon?: LucideIcon
  label: string
  value: string
  className?: string
}

/** 小型資訊 chip：icon + label + 值（PER / PBR / 殖利率等） */
export default function DataChip({ icon: Icon, label, value, className }: DataChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-inset px-2.5 py-1.5',
        className,
      )}
    >
      {Icon && <Icon size={13} className="text-text-muted" />}
      <span className="text-xs text-text-muted">{label}</span>
      <span className="num text-xs font-medium text-text-primary">{value}</span>
    </span>
  )
}
