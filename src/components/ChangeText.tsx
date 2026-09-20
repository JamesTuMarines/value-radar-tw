import { cn } from '@/lib/utils'

interface ChangeTextProps {
  /** 漲跌幅（%），null 視為無資料 */
  value: number | null
  /** 前綴符號樣式：arrow=▲▼，sign=+/− */
  marker?: 'arrow' | 'sign'
  suffix?: string
  className?: string
}

/** 漲跌文字（台股慣例：紅漲綠跌），Mono 字體 */
export default function ChangeText({ value, marker = 'arrow', suffix = '%', className }: ChangeTextProps) {
  if (value == null || Number.isNaN(value)) {
    return <span className={cn('num text-text-muted', className)}>—</span>
  }
  const up = value > 0
  const flat = value === 0
  const color = flat ? 'text-text-muted' : up ? 'text-up-red' : 'text-down-green'
  const mark = flat ? '' : marker === 'arrow' ? (up ? '▲ ' : '▼ ') : up ? '+' : '−'
  return (
    <span className={cn('num', color, className)}>
      {mark}
      {Math.abs(value).toFixed(2)}
      {suffix}
    </span>
  )
}
