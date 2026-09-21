import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart3, Landmark, Layers, Scale } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const DIMS = [
  {
    icon: Scale,
    color: '#E8B64C',
    title: '低估維度',
    body: 'PER 相對產業折價、PBR、殖利率、月營收年增——用四個估值錨點，衡量市場是否低估了這家公司。',
    chip: '預設權重 40%',
  },
  {
    icon: Layers,
    color: '#4CC3E8',
    title: '題材維度',
    body: '只收錄有真實產業趨勢支撐的未來題材：矽光子、HBM、先進封裝……並以題材純度過濾「沾邊概念股」。',
    chip: '預設權重 20%',
  },
  {
    icon: BarChart3,
    color: '#8B7CF6',
    title: '量價維度',
    body: '量比、均線位階、價漲量增結構——確認資金正在進場而非退場，並自動剔除過熱與量價背離的標的。',
    chip: '預設權重 25%',
  },
  {
    icon: Landmark,
    color: '#6E9BFF',
    title: '籌碼維度',
    body: '追蹤外資、投信、自營商三大法人 20 日淨買超佔成交量比例——確認大戶與你站在同一邊。',
    chip: '預設權重 15%',
  },
]

export default function MethodologySection() {
  return (
    <section className="container-site py-24">
      <SectionHeader title="評分框架" eyebrow="METHODOLOGY" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DIMS.map((d, i) => (
          <motion.div
            key={d.title}
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
            className="group card-surface relative flex min-h-[280px] flex-col overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-1"
          >
            <span
              className="absolute inset-x-0 top-0 h-0.5 opacity-30 transition-opacity duration-200 group-hover:opacity-100"
              style={{ backgroundColor: d.color }}
            />
            <d.icon size={48} strokeWidth={1.25} style={{ color: d.color }} />
            <h3 className="mt-5 text-xl font-bold text-text-primary">{d.title}</h3>
            <p className="mt-3 flex-1 text-[15px] leading-[1.7] text-text-secondary">{d.body}</p>
            <div className="mt-4 flex items-center justify-between">
              <span
                className="num rounded-full px-2.5 py-1 text-xs"
                style={{ backgroundColor: `${d.color}1F`, color: d.color }}
              >
                {d.chip}
              </span>
              <span className="text-xs text-text-muted">權重可在篩選器中即時調整</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 方法論預覽 + 公式卡 */}
      <div className="mt-24 grid items-center gap-10 lg:grid-cols-[5fr_7fr]">
        <motion.div
          initial={{ x: -32, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <h2 className="text-[28px] font-bold leading-[1.3] text-text-primary">透明的評分邏輯，官方資料來源</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-text-secondary">
            所有分數由原始指標即時計算，公式完全公開。資料來自證交所（TWSE）與櫃買中心（TPEx）官方開放資料，快照日期
            2026-09-18。
          </p>
          <Link
            to="/methodology"
            className="mt-6 inline-block rounded-[10px] border border-border-strong px-5 py-2.5 text-[15px] font-medium text-text-primary transition-colors hover:bg-elevated"
          >
            閱讀完整方法論
          </Link>
        </motion.div>

        <motion.div
          initial={{ x: 32, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="overflow-x-auto rounded-xl border border-border-subtle bg-inset p-6"
          style={{ borderLeft: '3px solid #E8B64C' }}
        >
          {[
            { code: '綜合分 = 低估分 × w₁ + 題材分 × w₂ + 量價分 × w₃ + 籌碼分 × w₄', note: '# 預設 40 / 20 / 25 / 15' },
            { code: '過熱懲罰：20日漲幅 > 40% 或 貼近52週新高且60日漲>30% → ×0.6', note: '' },
            { code: '量價背離：價漲但量縮 → 顯示「價漲量縮」警示徽章', note: '' },
          ].map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.2 }}
              className="num whitespace-nowrap py-1.5 text-[13px] text-text-primary"
            >
              {line.code}
              {line.note && <span className="text-text-muted">{'　'}{line.note}</span>}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
