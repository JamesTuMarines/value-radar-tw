import { Link } from 'react-router-dom'
import { DATA_DATE } from './Navbar'

const FEATURE_LINKS = [
  { to: '/', label: '總覽儀表板' },
  { to: '/screener', label: '選股篩選器' },
  { to: '/themes', label: '題材矩陣' },
  { to: '/methodology', label: '評分方法論' },
]

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface">
      <div className="container-site grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        {/* 品牌 */}
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="價值雷達" width={28} height={28} />
            <span className="text-base font-bold text-text-primary">價值雷達</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            用機構級的量價與估值框架，在雜訊中找出還沒被市場定價的未來。
          </p>
        </div>

        {/* 功能連結 */}
        <div>
          <h4 className="text-[13px] font-medium text-text-secondary">功能</h4>
          <ul className="mt-3 space-y-2">
            {FEATURE_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm text-text-muted transition-colors hover:text-text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 資料來源 */}
        <div>
          <h4 className="text-[13px] font-medium text-text-secondary">資料來源</h4>
          <ul className="mt-3 space-y-2 text-sm text-text-muted">
            <li>TWSE 證券交易所開放資料</li>
            <li>TPEx 櫃買中心開放資料</li>
            <li>公開資訊觀測站月營收</li>
            <li className="num text-xs">資料日期 {DATA_DATE}</li>
          </ul>
        </div>

        {/* 免責聲明 */}
        <div>
          <h4 className="text-[13px] font-medium text-text-secondary">免責聲明</h4>
          <p className="mt-3 text-xs leading-relaxed text-text-muted">
            本工具僅供研究與教育用途，不構成任何投資建議。股市投資有賺有賠，過去績效不代表未來表現，資料可能存在延遲或缺漏，投資決策請自行判斷並諮詢專業人士。
          </p>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            本工具資料來自證交所/櫃買中心公開資訊，評分僅供研究參考，不構成投資建議。
          </p>
        </div>
      </div>

      <div className="border-t border-border-subtle">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs text-text-muted sm:flex-row">
          <span>© 2026 ValueRadar TW</span>
          <span>資料快照更新 · 收盤後產生 · 僅含追蹤池標的</span>
        </div>
      </div>
    </footer>
  )
}
