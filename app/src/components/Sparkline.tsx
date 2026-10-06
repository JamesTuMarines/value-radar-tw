import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface SparklineProps {
  /** 收盤價序列（近 80 日） */
  data: number[]
  width?: number
  height?: number
  /** 進場繪製動畫（stroke-dashoffset） */
  animate?: boolean
  className?: string
}

/** 迷你走勢線：無軸無格線，線寬 1.5px，末端 3px 圓點。上漲紅、下跌綠（對比期初） */
export default function Sparkline({ data, width = 80, height = 28, animate = false, className }: SparklineProps) {
  const { path, color, endX, endY, pathLen } = useMemo(() => {
    const valid = (data ?? []).filter((v) => typeof v === 'number' && Number.isFinite(v))
    if (valid.length < 2) return { path: '', color: '#5B6B7F', endX: 0, endY: 0, pathLen: 0 }
    const min = Math.min(...valid)
    const max = Math.max(...valid)
    const range = max - min || 1
    const pad = 2
    const stepX = (width - pad * 2) / (valid.length - 1)
    const pts = valid.map((v, i) => {
      const x = pad + i * stepX
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return [x, y] as const
    })
    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
    const upTrend = valid[valid.length - 1] >= valid[0]
    const [ex, ey] = pts[pts.length - 1]
    // 估算 path 長度供 dash 動畫
    let len = 0
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    return { path: d, color: upTrend ? '#F0506E' : '#2EBD85', endX: ex, endY: ey, pathLen: len }
  }, [data, width, height])

  if (!path) {
    return <svg width={width} height={height} className={className} aria-hidden />
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn('overflow-visible', className)} aria-hidden>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          animate
            ? {
                strokeDasharray: pathLen,
                strokeDashoffset: pathLen,
                animation: 'sparkline-draw 0.9s ease-out 0.3s forwards',
              }
            : undefined
        }
      />
      <circle cx={endX} cy={endY} r={2} fill={color} />
      {animate && (
        <style>{`@keyframes sparkline-draw { to { stroke-dashoffset: 0; } }`}</style>
      )}
    </svg>
  )
}
