import type { LucideIcon } from 'lucide-react'
import { Zap, Server, MemoryStick, Layers, Fan, Plug, Satellite, Bot, HelpCircle } from 'lucide-react'

/** 題材 id → lucide icon（對應 themes.json 的 icon 欄位） */
export const THEME_ICONS: Record<string, LucideIcon> = {
  siphotonics: Zap,
  ai_server: Server,
  memory: MemoryStick,
  advanced_packaging: Layers,
  thermal: Fan,
  power: Plug,
  satellite: Satellite,
  robot: Bot,
}

export function themeIcon(id: string): LucideIcon {
  return THEME_ICONS[id] ?? HelpCircle
}

export interface ThemeContent {
  /** 英文副題 */
  en: string
  /** 未來性依據（3 點） */
  points: string[]
  /** 方法論頁「收錄理由」一句話 */
  reason: string
}

/** 各題材的研究文案（依 design/themes.md 文案方向定調；數據一律即時計算） */
export const THEME_CONTENT: Record<string, ThemeContent> = {
  siphotonics: {
    en: 'Silicon Photonics · Co-Packaged Optics',
    points: [
      'NVIDIA CPO 交換機 2026 年進入量產，時程明確',
      '1.6T 光模組升級，光互連功耗較可插拔方案降低 40–70%',
      '台廠卡位光引擎、FAU、雷射磊晶與測試介面',
    ],
    reason: 'NVIDIA CPO 交換機 2026 量產，光互連功耗降低 40–70%',
  },
  ai_server: {
    en: 'AI Server · Rack-Scale Systems',
    points: [
      'GB300 機櫃放量、Rubin 世代 2026 接棒',
      'AWS、Google、Meta 等 ASIC 自研晶片陣營同步擴大',
      '台廠掌握整機組裝、板卡、連接器與導軌全球主要市占',
    ],
    reason: 'GB300 放量、Rubin 接棒，ASIC 自研晶片同步擴大',
  },
  memory: {
    en: 'Memory · HBM Supercycle',
    points: [
      'HBM4 世代轉換，原廠產能排擠 DDR4／利基型供給',
      '2025–2026 記憶體進入缺貨漲價超級循環',
      '台灣利基 DRAM、NOR、模組與封測廠全面受惠',
    ],
    reason: 'HBM 排擠效應，2025–26 缺貨漲價超級循環',
  },
  advanced_packaging: {
    en: 'Advanced Packaging · CoWoS / SoIC',
    points: [
      'CoWoS 產能 2026 年持續倍增',
      'SoIC 3D 堆疊與面板級封裝（FOPLP）接續起量',
      '封測、設備、載板與測試環節迎結構性成長',
    ],
    reason: 'CoWoS 產能倍增，SoIC／FOPLP 接續上路',
  },
  thermal: {
    en: 'Thermal · Liquid Cooling',
    points: [
      '氣冷轉液冷拐點：AI 機櫃功率密度突破 120kW',
      '水冷板與 CDU 滲透率 2026 年跳升，單櫃產值倍數成長',
      '台廠掌握水冷模組、快接頭與風扇馬達，全球市占七成',
    ],
    reason: '機櫃功率破 120kW，液冷滲透率 2026 跳升',
  },
  power: {
    en: 'Power · HVDC & Grid',
    points: [
      'AI 機櫃電源從 3kW 走向 12kW+',
      '800V HVDC 高壓直流架構重寫電源設計',
      '台電強韌電網計畫與美國電網更新潮，十年級需求',
    ],
    reason: '機櫃電源 12kW+，HVDC 架構與電網強韌計畫',
  },
  satellite: {
    en: 'LEO Satellite · Constellation',
    points: [
      'Starlink 用戶破 800 萬、Kuiper 進入密集發射期',
      '地面接收站與相位陣列天線需求倍增',
      '台廠為射頻元件、PCB 與相控陣天線主要代工夥伴',
    ],
    reason: 'Starlink 用戶破 800 萬，地面接收設備放量',
  },
  robot: {
    en: 'Robotics · Humanoid & Automation',
    points: [
      '人形機器人 2026 量產元年，Optimus、Figure 訂單落地',
      '協作機器人滲透與半導體自動化設備需求增溫',
      '台灣減速機、伺服馬達與機器視覺供應鏈成形',
    ],
    reason: '人形機器人 2026 量產元年，精密傳動批量落地',
  },
}

export function themeContent(id: string): ThemeContent {
  return THEME_CONTENT[id] ?? { en: '', points: [], reason: '' }
}

/** 題材錨點 id（/themes 頁內捲動與 /themes#theme-<id> 共用） */
export function themeAnchor(id: string): string {
  return `theme-${id}`
}
