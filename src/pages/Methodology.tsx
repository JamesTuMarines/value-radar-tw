import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Flame, Info } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import { useStocks, useThemes, themeColor } from '@/lib/data'
import { ratingColor } from '@/lib/scoring'
import PurityExplainer from '@/pages/themes/PurityExplainer'
import CtaBanner from '@/pages/themes/CtaBanner'
import { themeContent, themeAnchor } from '@/pages/themes/themeContent'
import MetricTable from '@/pages/methodology/MetricTable'
import { TocDesktop, TocMobile } from '@/pages/methodology/Toc'
import type { TocItem } from '@/pages/methodology/scrollSpy'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const TOC: TocItem[] = [
  { id: 'm-arch', num: '01', label: '評分架構' },
  { id: 'm-value', num: '02', label: '低估維度' },
  { id: 'm-theme', num: '03', label: '題材維度' },
  { id: 'm-vp', num: '04', label: '量價維度' },
  { id: 'm-chips', num: '05', label: '籌碼維度' },
  { id: 'm-filter', num: '06', label: '過濾與降評' },
  { id: 'm-buyzone', num: '07', label: '建議買進區間' },
  { id: 'm-data', num: '08', label: '資料來源' },
  { id: 'm-disclaimer', num: '09', label: '免責聲明' },
]

const RATINGS = [
  { range: '≥ 75', label: '強力關注' },
  { range: '60–74', label: '值得追蹤' },
  { range: '45–59', label: '中性觀察' },
  { range: '< 45', label: '暫不考慮' },
]

export default function Methodology() {
  const stocksState = useStocks()
  const themesState = useThemes()
  const asOf = stocksState.data?.asOf ?? '2026-09-18'

  return (
    <div className="container-site pb-24 pt-12">
      {/* Section 1 — 頁面標頭 */}
      <header className="mx-auto max-w-[1080px]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="eyebrow-label text-accent-gold"
        >
          METHODOLOGY
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          className="mt-3 text-[40px] font-bold leading-[1.2] text-text-primary"
        >
          評分方法論
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
          className="mt-4 max-w-[640px] text-[17px] leading-[1.7] text-text-secondary"
        >
          每一個分數都能被驗算。本頁完整公開四維評分的指標、公式與過濾邏輯，以及資料的來源與限制。
        </motion.p>
      </header>

      <div className="mx-auto mt-10 max-w-[1080px] lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-12">
        <div className="min-w-0">
          <TocMobile items={TOC} />

          {/* Section 2 — 評分架構總覽 */}
          <section id="m-arch" className="scroll-mt-28">
            <SectionHeader title="評分架構總覽" eyebrow="FRAMEWORK" />
            <div className="card-surface p-6 sm:p-10">
              {/* 主公式 */}
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                variants={{ show: { transition: { staggerChildren: 0.25 } } }}
                className="overflow-x-auto rounded-xl border border-border-subtle bg-inset px-5 py-6 text-center"
              >
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  className="num whitespace-nowrap text-base text-text-primary sm:text-xl"
                >
                  綜合分 = （<span className="text-accent-gold">低估分 × w₁</span> +{' '}
                  <span className="text-accent-cyan">題材分 × w₂</span> +{' '}
                  <span style={{ color: '#8B7CF6' }}>量價分 × w₃</span> +{' '}
                  <span style={{ color: '#6E9BFF' }}>籌碼分 × w₄</span>） ÷ （w₁ + w₂ + w₃ + w₄）
                </motion.p>
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                  className="num mt-3 text-sm text-text-secondary"
                >
                  預設權重 <span className="text-accent-gold">低估 40</span> /{' '}
                  <span className="text-accent-cyan">題材 20</span> /{' '}
                  <span style={{ color: '#8B7CF6' }}>量價 25</span> /{' '}
                  <span style={{ color: '#6E9BFF' }}>籌碼 15</span>
                  <span className="text-text-muted">（可調，自動正規化）</span>
                </motion.p>
              </motion.div>

              {/* 四維小卡 */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: '低估分', en: 'VALUATION', w: '40%', color: '#E8B64C', desc: '估值相對同業便宜，且營收仍在成長' },
                  { name: '題材分', en: 'THEME', w: '20%', color: '#4CC3E8', desc: '只給有真實營收暴露度的未來產業' },
                  { name: '量價分', en: 'VOLUME · PRICE', w: '25%', color: '#8B7CF6', desc: '確認資金正用真金白銀進場投票' },
                  { name: '籌碼分', en: 'CHIPS', w: '15%', color: '#6E9BFF', desc: '追蹤三大法人 20 日買賣超動向' },
                ].map((d, i) => (
                  <motion.div
                    key={d.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                    className="rounded-xl border border-border-subtle bg-inset p-5"
                    style={{ borderTop: `2px solid ${d.color}` }}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-[15px] font-semibold text-text-primary">{d.name}</span>
                      <span className="num text-[10px] tracking-wider text-text-muted">{d.en}</span>
                    </div>
                    <div className="num mt-3 text-[28px] font-semibold leading-none" style={{ color: d.color }}>
                      {d.w}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-text-secondary">{d.desc}</p>
                  </motion.div>
                ))}
              </div>

              <p className="mt-4 text-xs text-text-muted">
                權重於篩選器中即時調整；改變時所有分數在前端即時重算，不經伺服器。
              </p>

              {/* 過熱降評警示列 */}
              <div className="mt-6 flex items-start gap-3 rounded-lg border-l-2 border-warn-amber bg-warn-amber/10 px-4 py-3">
                <Flame size={16} className="mt-0.5 shrink-0 text-warn-amber" />
                <p className="text-sm leading-relaxed text-text-secondary">
                  <span className="font-medium text-warn-amber">過熱降評：</span>
                  若 20 日漲幅 &gt; 40%，或貼近 52 週新高（距高點 &lt; 3%）且 60 日漲幅 &gt; 30%：綜合分{' '}
                  <span className="num text-text-primary">× 0.6</span>，並標記過熱徽章。
                </p>
              </div>

              {/* 評級對照 */}
              <div className="mt-6 flex flex-wrap gap-2">
                {RATINGS.map((r, i) => {
                  const color = ratingColor(i === 0 ? 80 : i === 1 ? 65 : i === 2 ? 50 : 30)
                  return (
                    <span
                      key={r.label}
                      className="num inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ backgroundColor: `${color}26`, color }}
                    >
                      {r.range} {r.label}
                    </span>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Section 3 — 低估維度 */}
          <section id="m-value" className="mt-16 scroll-mt-28">
            <SectionHeader title="低估維度" eyebrow="VALUATION" />
            <p className="mb-6 max-w-[640px] text-[15px] leading-[1.7] text-text-secondary">
              「便宜」必須是相對的：與同產業比估值、與自身資產比淨值，再用營收成長區分「便宜的成長股」與「便宜的衰退股」。
            </p>
            <MetricTable
              footnote="四項依 40 / 25 / 15 / 20 加權合成低估分（0–100）。營收成長納入是為了區分『便宜的成長股』與『便宜的衰退股』。"
              rows={[
                {
                  name: 'PER 相對折價',
                  def: '個股本益比 ÷ 同產業 PER 中位數，衡量相對同業的折價幅度',
                  rule: 'PER ≤ 中位數×0.6 → 100；≥ 中位數×1.5 → 0；之間線性內插。PER 為空或 ≤0（虧損）→ 此項 0 分並標記「虧損」',
                  tip: '同產業中位數取自全市場估值資料；該產業缺資料時，以追蹤池內同產業中位數遞補。',
                },
                {
                  name: 'PBR 股價淨值比',
                  def: '股價相對每股淨值的倍數，衡量資產面的安全邊際',
                  rule: 'PBR ≤ 1 → 100；≥ 5 → 0；線性內插。無資料 → 50（中性）',
                },
                {
                  name: '殖利率',
                  def: '近四季現金股利 ÷ 現價，衡量持有的現金回報',
                  rule: '≥ 5% → 100；0% → 0；線性內插。無資料 → 0',
                },
                {
                  name: '月營收年增率',
                  def: '最近月份營收 YoY，確認基本面動能仍在',
                  rule: '≥ +50% → 100；≤ −20% → 0；線性內插。無資料 → 50',
                },
              ]}
            />
          </section>

          {/* Section 4 — 題材維度 */}
          <section id="m-theme" className="mt-16 scroll-mt-28">
            <SectionHeader title="題材維度" eyebrow="THEME" />
            <p className="mb-6 max-w-[640px] text-[15px] leading-[1.7] text-text-secondary">
              題材分不是「有沾邊就給分」。我們只收錄有資本支出、訂單或技術路線圖佐證的 8 大產業趨勢，並用純度懲罰沾邊概念股。
            </p>

            <PurityExplainer />

            {/* 題材分公式 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="card-surface mt-6 p-6"
            >
              <div className="overflow-x-auto rounded-lg bg-inset px-4 py-4">
                <p className="num whitespace-nowrap text-sm leading-relaxed text-text-primary">
                  題材分 = 最高題材純度分（高 = 100 / 中 = 70 / 低 = 40）
                  <br />
                  <span className="text-text-muted">{'         '}</span>+ 10
                  <span className="text-text-muted">（若所屬題材 ≥ 2 且至少一個高純度，上限 100）</span>
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                以最高純度題材為主，避免多掛題材灌水；真正橫跨多個核心供應鏈的公司（如先進封裝 × AI
                伺服器）才給予加分。
              </p>
            </motion.div>

            {/* 8 題材收錄理由速覽 */}
            <div className="card-surface mt-6 p-6">
              <h3 className="text-[15px] font-semibold text-text-primary">8 大題材收錄理由速覽</h3>
              <ul className="mt-4 divide-y divide-border-subtle">
                {(themesState.data ?? []).map((t, i) => (
                  <motion.li key={t.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
                    >
                      <Link
                        to={`/themes#${themeAnchor(t.id)}`}
                        className="group flex items-center gap-3 py-2.5"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: themeColor(t.id) }}
                        />
                        <span className="w-32 shrink-0 text-sm font-medium text-text-primary">{t.name}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-text-muted">
                          {themeContent(t.id).reason || t.outlook}
                        </span>
                        <span className="hidden shrink-0 items-center gap-1 text-xs text-accent-cyan opacity-0 transition-opacity group-hover:opacity-100 sm:inline-flex">
                          查看題材 <ArrowRight size={12} />
                        </span>
                      </Link>
                    </motion.div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </section>

          {/* Section 5 — 量價維度 */}
          <section id="m-vp" className="mt-16 scroll-mt-28">
            <SectionHeader title="量價維度" eyebrow="VOLUME · PRICE" />
            <p className="mb-6 max-w-[640px] text-[15px] leading-[1.7] text-text-secondary">
              低估還不夠——我們要確認資金正在進場。量價維度驗證「誰在用真金白銀投票」。
            </p>
            <MetricTable
              footnote="三項依 35 / 35 / 30 加權合成量價分（0–100）。"
              rows={[
                {
                  name: '量比',
                  def: '20 日均量 ÷ 60 日均量，衡量近期成交量相對中期的放大程度',
                  rule: '1.5–3（溫和放量）→ 100；< 0.5 或 > 6（異常爆量，防對倒）→ 20；其餘線性內插',
                },
                {
                  name: '均線位階',
                  def: '現價相對 MA20 / MA60 的位置，衡量趨勢結構',
                  rule: '站上兩線 → 100；僅站上 MA20 → 70；僅站上 MA60 → 50；皆跌破 → 20。無資料 → 50',
                },
                {
                  name: '價漲量增占比',
                  def: '近 20 日中「收盤上漲且成交量 > 前 5 日均量」的天數比例，衡量攻擊量能',
                  rule: '≥ 40% → 100；≤ 10% → 20；線性內插。無歷史資料 → 50',
                },
              ]}
            />

            {/* 量價背離警示卡 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-6 flex items-start gap-3 rounded-lg border-l-2 border-danger bg-danger/10 px-4 py-4"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
              <p className="text-sm leading-relaxed text-text-secondary">
                <span className="font-medium text-danger">量價背離警示：</span>
                近 10 日價漲 &gt; 5%、但均量低於前 10 日均量 × 0.7 → 顯示「價漲量縮」警示徽章。背離不直接扣分（避免重複懲罰），但會在表格與個股頁明確標示，提醒動能續航風險。
              </p>
            </motion.div>
          </section>

          {/* Section 6 — 籌碼維度 */}
          <section id="m-chips" className="mt-16 scroll-mt-28">
            <SectionHeader title="籌碼維度" eyebrow="CHIPS" />
            <p className="mb-6 max-w-[640px] text-[15px] leading-[1.7] text-text-secondary">
              散戶看價、法人看量。籌碼維度追蹤外資、投信、自營商三大法人的 20
              日淨買超，確認「大戶是否與你站在同一邊」。資料來源為 FinMind 三大法人買賣超，每日更新。
            </p>

            {/* 籌碼分公式 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="card-surface p-6"
            >
              <div className="overflow-x-auto rounded-lg bg-inset px-4 py-4">
                <p className="num whitespace-nowrap text-sm leading-relaxed text-text-primary">
                  籌碼分 = 線性映射（法人合計20日淨買超 ÷ 20日總成交量）
                  <br />
                  <span className="text-text-muted">{'         '}</span>≥ +5% → 100；≤ −5% → 0；之間線性
                  <br />
                  <span className="text-text-muted">{'         '}</span>+ 10
                  <span className="text-text-muted">（若投信 20 日淨買超 &gt; 0，上限 100）</span>
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                以「佔成交量比例」而非絕對張數評分，避免大中小型股無法比較；投信連買對波段行情特別有意義，故給予
                +10 加成。個股缺籌碼或成交量資料時以中性 50 分計，不懲罰。
              </p>
            </motion.div>

            <div className="mt-6">
              <MetricTable
                footnote="兩項合成籌碼分後，再依主力（外資持股）動向 ±5 調整（0–100，上限 100）。單位「張」，正值＝淨買超。"
                rows={[
                  {
                    name: '法人淨買超佔比',
                    def: '三大法人合計 20 日淨買超 ÷ 20 日總成交量，衡量法人吃貨／出貨強度',
                    rule: '≥ +5% → 100（顯著吃貨）；≤ −5% → 0（顯著出貨）；之間線性內插。無資料 → 50（中性）',
                    tip: '20 日總成交量以 20 日均量 × 20 估算。',
                  },
                  {
                    name: '投信加成',
                    def: '投信 20 日淨買超是否為正，捕捉投信連買的波段訊號',
                    rule: '投信 20 日淨買超 > 0 → 籌碼分 +10（上限 100）',
                  },
                  {
                    name: '主力調整',
                    def: '外資持股比例近 20 個交易日的變化（百分點），捕捉主力的中長期加減碼方向',
                    rule: '20 日變化 ≥ +0.3pp → 籌碼分 +5；≤ −0.3pp → 籌碼分 −5；之間不調整。無資料 → 不調整',
                    tip: '資料來源 FinMind 外資持股。外資為台股最大主力，持股比例變化比單日買賣超更能反映中長期態度。',
                  },
                ]}
              />
            </div>
          </section>

          {/* Section 7 — 過濾與降評 */}
          <section id="m-filter" className="mt-16 scroll-mt-28">
            <SectionHeader title="過濾與降評：拒絕短線炒作" eyebrow="FILTERS" />
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Flame,
                  color: '#F08C3C',
                  title: '過熱降評',
                  body: '20 日漲幅 > 40%，或貼近 52 週新高（距高點 < 3%）且 60 日漲幅 > 30% → 綜合分 ×0.6 並標記。短線急漲的標的，風險報酬比已改變。',
                },
                {
                  icon: AlertTriangle,
                  color: '#E5484D',
                  title: '量價背離警示',
                  body: '近 10 日價漲 > 5% 但均量萎縮至前 10 日 ×0.7 以下 → 顯示「價漲量縮」徽章，提醒動能衰竭風險。',
                },
                {
                  icon: Info,
                  color: '#4CC3E8',
                  title: '虧損標記',
                  body: 'PER 為負（虧損）的標的，PER 子項以 0 分計並標記「虧損」，由 PBR、殖利率與營收成長補足估值判斷。',
                },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.12, ease: EASE }}
                  className="card-surface p-5"
                >
                  <c.icon size={20} style={{ color: c.color }} />
                  <h3 className="mt-3 text-[15px] font-semibold text-text-primary">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{c.body}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Section 8 — 建議買進區間 */}
          <section id="m-buyzone" className="mt-16 scroll-mt-28">
            <SectionHeader title="建議買進區間" eyebrow="BUY ZONE" />
            <p className="mb-6 max-w-[640px] text-[15px] leading-[1.7] text-text-secondary">
              選到好標的，還要有好價格。個股頁的「建議買進區間」以均線結構判斷趨勢狀態，再用技術支撐機械式推算分批買進區間與參考停損價，規則完全公開、可逐檔驗算。
            </p>
            <MetricTable
              footnote="趨勢狀態由現價與 MA20 / MA60 的相對位置決定；區間僅在價格、均線與 60 日歷史資料齊全時計算，否則顯示「資料不足」。"
              rows={[
                {
                  name: '強勢（多頭排列）',
                  def: '現價 > MA20 且 MA20 > MA60：趨勢向上，等待回測月線分批佈局',
                  rule: '買進區間 = MA20 × 0.97 ~ MA20 × 1.02；參考停損 = MA60 × 0.95（跌破季線結構出場）',
                },
                {
                  name: '盤整（區間整理）',
                  def: '現價在 MA20 與 MA60 之間，或 MA20 ≤ MA60 但現價仍站上季線：以季線與前低為支撐',
                  rule: '買進區間 = max(MA60, 60日低) × 0.99 ~ MA20 × 1.02；參考停損 = 60日低 × 0.95',
                },
                {
                  name: '弱勢（跌破季線）',
                  def: '現價 < MA60：屬左側交易，僅適合小量試單',
                  rule: '買進區間 = 60日低 × 0.98 ~ MA60；參考停損 = 60日低 × 0.94（停損更緊，嚴控風險）',
                },
              ]}
            />

            {/* 過熱警示卡 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-6 flex items-start gap-3 rounded-lg border-l-2 border-warn-amber bg-warn-amber/10 px-4 py-4"
            >
              <Flame size={16} className="mt-0.5 shrink-0 text-warn-amber" />
              <p className="text-sm leading-relaxed text-text-secondary">
                <span className="font-medium text-warn-amber">過熱警示：</span>
                當標的觸發過熱降評（20 日漲幅 &gt; 40%，或貼近 52 週新高且 60 日漲幅 &gt;
                30%），即使現價仍高於區間，也不建議追高——策略文案會改為「強烈建議等待回測至區間內再分批」。
              </p>
            </motion.div>

            <p className="mt-4 text-xs leading-relaxed text-text-muted">
              買進區間與停損皆為機械式規則計算，不考慮個股基本面變化、消息面與大盤系統性風險，僅供研究參考，非投資建議。
            </p>
          </section>

          {/* Section 9 — 資料來源與更新 */}
          <section id="m-data" className="mt-16 scroll-mt-28">
            <SectionHeader title="資料來源與更新" eyebrow="DATA" />
            <div className="grid gap-4 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="card-surface p-6"
              >
                <h3 className="text-[15px] font-semibold text-text-primary">資料來源</h3>
                <ul className="mt-4 space-y-4">
                  {[
                    { name: '臺灣證券交易所（TWSE）開放資料 API', desc: '上市股票行情、估值（PER / PBR / 殖利率）' },
                    { name: '證券櫃檯買賣中心（TPEx）開放資料 API', desc: '上櫃股票行情與估值' },
                    { name: '公開資訊觀測站', desc: '月營收資料（營收年增率）' },
                    { name: 'HiStock', desc: '日 K 線歷史價量（均線、量比與型態計算）' },
                    { name: 'FinMind', desc: '三大法人買賣超（外資 / 投信 / 自營商，籌碼分計算）' },
                  ].map((s, i) => (
                    <motion.li
                      key={s.name}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
                    >
                      <p className="text-sm font-medium text-text-primary">{s.name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{s.desc}</p>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="card-surface p-6"
              >
                <h3 className="text-[15px] font-semibold text-text-primary">更新與限制</h3>
                <div className="mt-4">
                  <p className="text-xs text-text-muted">資料快照日期</p>
                  <p className="num mt-1 text-[28px] font-semibold leading-none text-accent-gold">{asOf}</p>
                  <p className="mt-1 text-xs text-text-muted">收盤</p>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {[
                    '更新頻率：每日收盤後批次更新（以快照日期為準）',
                    '盤中不即時更新，價格非即時報價',
                    '題材純度依公開營收結構人工標註，可能有主觀成分',
                    '歷史資料不含還原權值調整之完整回溯',
                  ].map((t, i) => (
                    <motion.li
                      key={t}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
                      className="flex items-start gap-2 text-xs leading-relaxed text-text-secondary"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                      {t}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </section>

          {/* Section 10 — 免責聲明 */}
          <section id="m-disclaimer" className="mt-16 scroll-mt-28">
            <SectionHeader title="免責聲明" eyebrow="DISCLAIMER" />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="rounded-xl border border-border-subtle bg-inset p-6 sm:p-8"
            >
              <p className="text-sm leading-[1.9] text-text-secondary">
                本工具所有內容僅供研究與教育用途，不構成任何證券之買賣建議或投資顧問服務。評分模型基於歷史與公開資料，過去績效不代表未來表現；題材產業的發展時程與公司營收暴露可能隨時改變。股票投資有賺有賠，申購前應詳閱公開說明書，投資人應獨立判斷並自負盈虧，必要時請諮詢合格之證券投資顧問。資料雖取自官方來源，仍可能存在延遲、缺漏或錯誤，使用前請以券商與交易所即時資料為準。
              </p>
            </motion.div>
          </section>

          {/* Section 9 — 底部 CTA */}
          <div className="mt-16">
            <CtaBanner compact title="理解規則之後，開始掃描" />
          </div>
        </div>

        {/* Desktop TOC */}
        <TocDesktop items={TOC} />
      </div>
    </div>
  )
}
