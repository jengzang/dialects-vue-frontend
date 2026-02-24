// src/config/villagesML.js
// VillagesML 相關常量配置

// ========================================
// 語義類別映射
// ========================================

/**
 * 語義類別圖標映射
 * @type {Object<string, string>}
 */
export const SEMANTIC_CATEGORY_ICONS = {
  'agriculture': '🌾',
  'clan': '👨‍👩‍👧‍👦',
  'direction': '🧭',
  'infrastructure': '🏗️',
  'mountain': '⛰️',
  'settlement': '🏘️',
  'symbolic': '🎨',
  'vegetation': '🌿',
  'water': '💧'
}

/**
 * 語義類別中文名稱映射
 * @type {Object<string, string>}
 */
export const SEMANTIC_CATEGORY_NAMES = {
  'agriculture': '農業',
  'clan': '宗族',
  'direction': '方位',
  'infrastructure': '基建',
  'mountain': '山地',
  'settlement': '聚落',
  'symbolic': '象徵',
  'vegetation': '植物',
  'water': '水系'
}

/**
 * 語義類別描述映射
 * @type {Object<string, string>}
 */
export const SEMANTIC_CATEGORY_DESCRIPTIONS = {
  'agriculture': '農業、耕作、田地相關',
  'clan': '宗族、姓氏、家族相關',
  'direction': '東西南北、方向相關',
  'infrastructure': '道路、橋樑、建築相關',
  'mountain': '山地、丘陵等地形相關',
  'settlement': '村落、居住地相關',
  'symbolic': '吉祥、象徵意義相關',
  'vegetation': '樹木、花草等植物相關',
  'water': '河流、湖泊、水系相關'
}

/**
 * 組合模式組件映射（用於動態組合）
 * @type {Object<string, string>}
 */
export const PATTERN_COMPONENT_NAMES = {
  // 模式結構組件
  'head': '中心',
  'modifier': '修飾',
  'coordinate': '並列',
  'verb': '動',
  'object': '賓',
  'subject': '主',
  'predicate': '謂',
  'other': '其他',
  // 語義類別組件
  'settlement': '聚落',
  'clan': '宗族',
  'direction': '方位',
  'water': '水系',
  'mountain': '山地',
  'vegetation': '植物',
  'agriculture': '農業',
  'symbolic': '象徵',
  'infrastructure': '基建'
}

// ========================================
// 輔助函數
// ========================================

/**
 * 獲取語義類別圖標
 * @param {string} category - 類別英文名
 * @returns {string} 圖標 emoji
 */
export function getCategoryIcon(category) {
  return SEMANTIC_CATEGORY_ICONS[category] || '🏷️'
}

/**
 * 獲取語義類別中文名稱
 * @param {string} category - 類別英文名
 * @returns {string} 中文名稱
 */
export function getCategoryName(category) {
  return SEMANTIC_CATEGORY_NAMES[category] || category
}

/**
 * 獲取語義類別描述
 * @param {string} category - 類別英文名
 * @returns {string} 描述文本
 */
export function getCategoryDescription(category) {
  return SEMANTIC_CATEGORY_DESCRIPTIONS[category] || '語義類別'
}

/**
 * 獲取組合模式類型名稱
 * @param {string} patternType - 模式類型英文名（如 "head_settlement", "modifier_head"）
 * @returns {string} 中文名稱
 */
export function getPatternTypeName(patternType) {
  if (!patternType) return ''

  // 處理下劃線或連字符分隔的模式
  const separator = patternType.includes('_') ? '_' : '-'
  const parts = patternType.split(separator)

  // 翻譯每個部分並用連字符連接
  const translatedParts = parts.map(part =>
    PATTERN_COMPONENT_NAMES[part] || part
  )

  return translatedParts.join('-')
}

// ========================================
// 模組和子標籤配置（用於 CommonBar 導航）
// ========================================

/**
 * VillagesML 模組配置（不包含 Dashboard）
 * 用於 VillagesMLLayout 的 CommonBar 導航
 * @type {Array<Object>}
 */
export const VILLAGESML_MODULES = [
  {
    id: 'search',
    label: '搜尋探索',
    icon: '🔍',
    path: '/villagesML?module=search',
    weight: 1,
    mobileWeight: 1,
    weightIconOnly: 0.5,
    fontSize: 1.0,
    mobileFontSize: 1.0,
    requireAuth: false,
    hideOnMobile: false,
    hideLabelOnMobile: true,
    showLabelOnlyWhenActive: false,
    subtabs: []
  },
  {
    id: 'character',
    label: '字符分析',
    icon: '🔤',
    path: '/villagesML?module=character&subtab=frequency',
    weight: 1.2,
    mobileWeight: 1,
    weightIconOnly: 0.5,
    fontSize: 1.0,
    mobileFontSize: 1.0,
    requireAuth: false,
    hideOnMobile: false,
    hideLabelOnMobile: true,
    showLabelOnlyWhenActive: false,
    subtabs: [
      {
        id: 'frequency',
        label: '頻率傾向',
        icon: '📊',
        path: '/villagesML?module=character&subtab=frequency',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'embeddings',
        label: '嵌入相似',
        icon: '🧬',
        path: '/villagesML?module=character&subtab=embeddings',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'significance',
        label: '顯著性',
        icon: '⭐',
        path: '/villagesML?module=character&subtab=significance',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      }
    ]
  },
  {
    id: 'semantic',
    label: '語義分析',
    icon: '🏷️',
    path: '/villagesML?module=semantic&subtab=categories',
    weight: 1.2,
    mobileWeight: 1,
    weightIconOnly: 0.5,
    fontSize: 1.0,
    mobileFontSize: 1.0,
    requireAuth: false,
    hideOnMobile: false,
    hideLabelOnMobile: true,
    showLabelOnlyWhenActive: false,
    subtabs: [
      {
        id: 'categories',
        label: '類別標籤',
        icon: '🔖',
        path: '/villagesML?module=semantic&subtab=categories',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'composition',
        label: '組合模式',
        icon: '🧩',
        path: '/villagesML?module=semantic&subtab=composition',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'ngrams',
        label: 'N-gram分析',
        icon: '📊',
        path: '/villagesML?module=semantic&subtab=ngrams',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'indices',
        label: '語義指數',
        icon: '📈',
        path: '/villagesML?module=semantic&subtab=indices',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'network',
        label: '語義網絡',
        icon: '🕸️',
        path: '/villagesML?module=semantic&subtab=network',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      }
    ]
  },
  {
    id: 'spatial',
    label: '空間分析',
    icon: '🗺️',
    path: '/villagesML?module=spatial&subtab=hotspots',
    weight: 1.2,
    mobileWeight: 1,
    weightIconOnly: 0.5,
    fontSize: 1.0,
    mobileFontSize: 1.0,
    requireAuth: false,
    hideOnMobile: false,
    hideLabelOnMobile: true,
    showLabelOnlyWhenActive: false,
    subtabs: [
      {
        id: 'hotspots',
        label: '空間熱點',
        icon: '🔥',
        path: '/villagesML?module=spatial&subtab=hotspots',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'clusters',
        label: '空間聚類',
        icon: '🎯',
        path: '/villagesML?module=spatial&subtab=clusters',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'visualization',
        label: '空間可視化',
        icon: '📍',
        path: '/villagesML?module=spatial&subtab=visualization',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'integration',
        label: '空間整合',
        icon: '🔗',
        path: '/villagesML?module=spatial&subtab=integration',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      }
    ]
  },
  {
    id: 'pattern',
    label: '模式分析',
    icon: '📐',
    path: '/villagesML?module=pattern&subtab=ngrams',
    weight: 1.2,
    mobileWeight: 1,
    weightIconOnly: 0.5,
    fontSize: 1.0,
    mobileFontSize: 1.0,
    requireAuth: false,
    hideOnMobile: false,
    hideLabelOnMobile: true,
    showLabelOnlyWhenActive: false,
    subtabs: [
      {
        id: 'ngrams',
        label: 'N-gram',
        icon: '🔢',
        path: '/villagesML?module=pattern&subtab=ngrams',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'structural',
        label: '結構模式',
        icon: '🏗️',
        path: '/villagesML?module=pattern&subtab=structural',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      }
    ]
  },
  {
    id: 'regional',
    label: '區域分析',
    icon: '🌍',
    path: '/villagesML?module=regional&subtab=aggregates',
    weight: 1.2,
    mobileWeight: 1,
    weightIconOnly: 0.5,
    fontSize: 1.0,
    mobileFontSize: 1.0,
    requireAuth: false,
    hideOnMobile: false,
    hideLabelOnMobile: true,
    showLabelOnlyWhenActive: false,
    subtabs: [
      {
        id: 'aggregates',
        label: '聚合統計',
        icon: '📈',
        path: '/villagesML?module=regional&subtab=aggregates',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'vectors',
        label: '特徵向量',
        icon: '📐',
        path: '/villagesML?module=regional&subtab=vectors',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      }
    ]
  },
  {
    id: 'compute',
    label: 'ML計算',
    icon: '🤖',
    path: '/villagesML?module=compute&subtab=clustering',
    weight: 1.2,
    mobileWeight: 1,
    weightIconOnly: 0.5,
    fontSize: 1.0,
    mobileFontSize: 1.0,
    requireAuth: true,
    hideOnMobile: false,
    hideLabelOnMobile: true,
    showLabelOnlyWhenActive: false,
    subtabs: [
      {
        id: 'clustering',
        label: '聚類分析',
        icon: '🎲',
        path: '/villagesML?module=compute&subtab=clustering',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'features',
        label: '特徵提取',
        icon: '🔬',
        path: '/villagesML?module=compute&subtab=features',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'subset',
        label: '子集分析',
        icon: '🧪',
        path: '/villagesML?module=compute&subtab=subset',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'cache',
        label: '緩存管理',
        icon: '💾',
        path: '/villagesML?module=compute&subtab=cache',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      }
    ]
  },
  {
    id: 'system',
    label: '信息',
    icon: 'ℹ️',
    path: '/villagesML?module=system',
    weight: 1,
    mobileWeight: 1,
    weightIconOnly: 0.5,
    fontSize: 1.0,
    mobileFontSize: 1.0,
    requireAuth: false,
    hideOnMobile: false,
    hideLabelOnMobile: true,
    showLabelOnlyWhenActive: false,
    subtabs: []
  }
]

/**
 * 獲取模組配置
 * @param {string} moduleId - 模組 ID
 * @returns {Object|null} 模組配置對象
 */
export function getModuleConfig(moduleId) {
  return VILLAGESML_MODULES.find(m => m.id === moduleId) || null
}

/**
 * 獲取子標籤配置
 * @param {string} moduleId - 模組 ID
 * @param {string} subtabId - 子標籤 ID
 * @returns {Object|null} 子標籤配置對象
 */
export function getSubtabConfig(moduleId, subtabId) {
  const module = getModuleConfig(moduleId)
  if (!module || !module.subtabs) return null
  return module.subtabs.find(s => s.id === subtabId) || null
}

/**
 * 獲取可見的模組列表（根據認證狀態過濾）
 * @param {boolean} isAuthenticated - 是否已登錄
 * @returns {Array<Object>} 可見的模組配置數組
 */
export function getVisibleModules(isAuthenticated) {
  return VILLAGESML_MODULES.filter(m => !m.requireAuth || isAuthenticated)
}
