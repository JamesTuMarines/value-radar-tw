import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// HashRouter：GitHub Pages 等靜態託管沒有 SPA fallback，
// 用 # 路由可保證重新整理 / 直接分享深層連結不會 404。
createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
)
