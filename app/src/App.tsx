import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Screener from '@/pages/Screener'
import Themes from '@/pages/Themes'
import StockDetail from '@/pages/StockDetail'
import Methodology from '@/pages/Methodology'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="screener" element={<Screener />} />
        <Route path="themes" element={<Themes />} />
        <Route path="stock/:code" element={<StockDetail />} />
        <Route path="methodology" element={<Methodology />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
