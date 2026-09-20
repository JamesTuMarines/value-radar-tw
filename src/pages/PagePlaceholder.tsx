import { Radar } from 'lucide-react'

interface PlaceholderProps {
  title: string
}

export function PagePlaceholder({ title }: PlaceholderProps) {
  return (
    <div className="container-site flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <Radar size={40} className="text-accent-gold" />
      <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
      <p className="text-text-muted">建置中，敬請期待。</p>
    </div>
  )
}
