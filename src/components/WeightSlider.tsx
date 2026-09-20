import * as Slider from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

interface WeightSliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  color?: string
  className?: string
}

/** 權重滑桿：4px 軌道、金色填充、16px 圓形 thumb，數值 bubble 跟隨 */
export default function WeightSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  color = '#E8B64C',
  className,
}: WeightSliderProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-text-secondary">{label}</span>
        <span className="num rounded-md bg-inset px-2 py-0.5 text-sm font-medium" style={{ color }}>
          {value}%
        </span>
      </div>
      <Slider.Root
        className="relative flex h-5 cursor-grab touch-none select-none items-center active:cursor-grabbing"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      >
        <Slider.Track className="relative h-1 flex-1 overflow-hidden rounded-full bg-inset">
          <Slider.Range className="absolute h-full" style={{ backgroundColor: color }} />
        </Slider.Track>
        <Slider.Thumb
          aria-label={label}
          className="block h-4 w-4 rounded-full border-2 bg-canvas shadow-md transition-transform focus:outline-none focus-visible:scale-110 data-[state=active]:scale-125"
          style={{ borderColor: color }}
        />
      </Slider.Root>
    </div>
  )
}
