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
 * 語義子類別中文名稱映射（v4.0 Hybrid Lexicon）
 * @type {Object<string, string>}
 */
export const SEMANTIC_SUBCATEGORY_NAMES = {
  // 數字類
  'number_small': '小數字',
  'number_large': '大數字',
  'number_ordinal': '序數',

  // 方位類
  'direction_vertical': '垂直方向',
  'direction_cardinal': '基本方向',
  'direction_inside': '內部方向',
  'direction_outside': '外部方向',
  'direction_opening': '開口方向',
  'direction_horizontal': '水平方向',
  'direction_center': '中心方向',
  'direction_end': '末端方向',

  // 象徵類
  'symbolic_virtue': '美德象徵',
  'symbolic_religion': '宗教象徵',
  'symbolic_light': '光明象徵',
  'symbolic_prosperity': '繁榮象徵',
  'symbolic_animal': '動物象徵',
  'symbolic_fortune': '吉祥象徵',
  'symbolic_peace': '和平象徵',
  'symbolic_treasure': '寶物象徵',

  // 水系類
  'water_spring': '泉水',
  'water_stream': '溪流',
  'water_pond': '池塘',
  'water_island': '島嶼',
  'water_shore': '岸邊',
  'water_river': '河流',
  'water_beach': '沙灘',
  'water_lake': '湖泊',
  'water_port': '港津',
  'water_bay': '海灣',

  // 基建類
  'infrastructure_station': '驛站',
  'infrastructure_port': '港口',
  'infrastructure_road': '道路',
  'infrastructure_bridge': '橋樑',
  'infrastructure_transport': '交通',

  // 時間類
  'time': '時間',

  // 農業類
  'agriculture_storage': '農業倉儲',
  'agriculture_activity': '農業活動',
  'agriculture_garden': '園圃',
  'agriculture_field': '田地',
  'agriculture_irrigation': '灌溉',
  'agriculture_crop': '農作物',

  // 宗族類
  'clan_he': '何姓',
  'clan_other': '其他姓氏',
  'clan_liu': '劉姓',
  'clan_wu': '吳姓',
  'clan_zhang': '張姓',
  'clan_li': '李姓',
  'clan_liang': '梁姓',
  'clan_luo': '羅姓',
  'clan_chen': '陳姓',
  'clan_huang': '黃姓',

  // 山地類
  'mountain_slope': '山坡',
  'mountain_plateau': '高原平台',
  'mountain_valley': '山谷',
  'mountain_rock': '岩石',
  'mountain_peak': '山峰',
  'mountain_ridge': '山脊',

  // 聚落類
  'settlement_district': '區域聚落',
  'settlement_market': '市集',
  'settlement_fort': '城堡',
  'settlement_village': '村莊',
  'settlement_building': '建築',
  'settlement_group': '聚落群組',

  // 形狀類
  'shape': '形狀',

  // 尺寸類
  'size_large': '大尺寸',
  'size_small': '小尺寸',
  'size_short': '短小',
  'size_long': '長遠',

  // 植物類
  'vegetation_forest': '森林',
  'vegetation_pine': '松柏',
  'vegetation_fruit': '果樹',
  'vegetation_other': '其他植物',
  'vegetation_bamboo': '竹類',
  'vegetation_flower': '花卉',
  'vegetation_tea': '茶',

  // 顏色類
  'color': '顏色'
}

/**
 * 模式結構組件映射
 * @type {Object<string, string>}
 */
export const PATTERN_STRUCTURE_NAMES = {
  'head': '中心',
  'modifier': '修飾',
  'coordinate': '並列',
  'verb': '動',
  'object': '賓',
  'subject': '主',
  'predicate': '謂',
  'other': '其他'
}

/**
 * 組合模式組件映射（已廢棄，請使用 PATTERN_STRUCTURE_NAMES 和 SEMANTIC_CATEGORY_NAMES）
 * @deprecated 使用 PATTERN_STRUCTURE_NAMES 和 SEMANTIC_CATEGORY_NAMES 代替
 * @type {Object<string, string>}
 */
export const PATTERN_COMPONENT_NAMES = {
  ...PATTERN_STRUCTURE_NAMES,
  ...SEMANTIC_CATEGORY_NAMES
}

// ========================================
// N-gram 位置和模式類型映射
// ========================================

/**
 * N-gram 位置標籤映射
 * 支持單一位置和組合位置（如 prefix-suffix）
 * @type {Object<string, string>}
 */
export const NGRAM_POSITION_LABELS = {
  // 單一位置
  'all': '全部',
  'prefix': '前綴',
  'middle': '中間',
  'suffix': '後綴',
  // 組合位置
  'prefix-suffix': '前後綴',
  'prefix-middle': '前中',
  'middle-suffix': '中後',
  'prefix-middle-suffix': '前中後'
}

/**
 * N-gram 模式類型標籤映射
 * @type {Object<string, string>}
 */
export const NGRAM_PATTERN_TYPE_LABELS = {
  'all': '全部',
  'prefix': '前綴',
  'suffix': '後綴',
  'middle': '中間',
  'prefix-suffix': '前後綴',
  'infix': '中綴'
}

// ========================================
// 統計顯著性標籤映射
// ========================================

/**
 * P值顯著性標籤映射
 * @type {Object<string, {label: string, symbol: string, description: string}>}
 */
export const SIGNIFICANCE_LEVELS = {
  'very_significant': {
    label: '極顯著',
    symbol: '***',
    description: 'p < 0.001',
    threshold: 0.001
  },
  'significant': {
    label: '顯著',
    symbol: '**',
    description: 'p < 0.01',
    threshold: 0.01
  },
  'marginal': {
    label: '邊緣顯著',
    symbol: '*',
    description: 'p < 0.05',
    threshold: 0.05
  },
  'not_significant': {
    label: '不顯著',
    symbol: 'n.s.',
    description: 'p ≥ 0.05',
    threshold: 1.0
  }
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
 * 獲取語義子類別名稱
 * @param {string} subcategory - 子類別英文名（如 "number_small", "clan_zhang"）
 * @returns {string} 中文名稱
 */
export function getSubcategoryName(subcategory) {
  return SEMANTIC_SUBCATEGORY_NAMES[subcategory] || subcategory
}

/**
 * 獲取語義類別名稱（智能識別主類別或子類別）
 * @param {string} category - 類別英文名（可以是主類別如 "clan"，也可以是子類別如 "clan_zhang"）
 * @param {boolean} isDetailMode - 是否為詳細模式（默認false）
 * @returns {string} 中文名稱
 */
export function getCategoryDisplayName(category, isDetailMode = false) {
  if (!category) return ''

  // 如果是詳細模式，優先查找子類別映射
  if (isDetailMode && SEMANTIC_SUBCATEGORY_NAMES[category]) {
    return SEMANTIC_SUBCATEGORY_NAMES[category]
  }

  // 否則查找主類別映射
  if (SEMANTIC_CATEGORY_NAMES[category]) {
    return SEMANTIC_CATEGORY_NAMES[category]
  }

  // 如果都找不到，嘗試查找子類別映射（兼容性處理）
  if (SEMANTIC_SUBCATEGORY_NAMES[category]) {
    return SEMANTIC_SUBCATEGORY_NAMES[category]
  }

  // 最後返回原始值
  return category
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
  const translatedParts = parts.map(part => {
    // 先查找模式結構組件
    if (PATTERN_STRUCTURE_NAMES[part]) {
      return PATTERN_STRUCTURE_NAMES[part]
    }
    // 再查找語義類別
    if (SEMANTIC_CATEGORY_NAMES[part]) {
      return SEMANTIC_CATEGORY_NAMES[part]
    }
    // 返回原始值
    return part
  })

  return translatedParts.join('-')
}

/**
 * 獲取 N-gram 位置標籤
 * 支持單一位置和組合位置（如 prefix-suffix）
 * @param {string} position - 位置標識（如 'prefix', 'prefix-suffix'）
 * @returns {string} 中文標籤
 */
export function getNgramPositionLabel(position) {
  if (!position) return ''
  return NGRAM_POSITION_LABELS[position] || position
}

/**
 * 獲取 N-gram 模式類型標籤
 * @param {string} type - 模式類型（如 'prefix', 'suffix'）
 * @returns {string} 中文標籤
 */
export function getNgramPatternTypeLabel(type) {
  if (!type) return ''
  return NGRAM_PATTERN_TYPE_LABELS[type] || type
}

/**
 * 獲取顯著性標籤（基於 p 值）
 * @param {number} pValue - P值
 * @returns {string} 顯著性符號（***, **, *, n.s.）
 */
export function getSignificanceLabel(pValue) {
  if (pValue < SIGNIFICANCE_LEVELS.very_significant.threshold) {
    return SIGNIFICANCE_LEVELS.very_significant.symbol
  }
  if (pValue < SIGNIFICANCE_LEVELS.significant.threshold) {
    return SIGNIFICANCE_LEVELS.significant.symbol
  }
  if (pValue < SIGNIFICANCE_LEVELS.marginal.threshold) {
    return SIGNIFICANCE_LEVELS.marginal.symbol
  }
  return SIGNIFICANCE_LEVELS.not_significant.symbol
}

/**
 * 獲取顯著性等級信息
 * @param {number} pValue - P值
 * @returns {Object} 顯著性等級對象 {label, symbol, description}
 */
export function getSignificanceLevel(pValue) {
  if (pValue < SIGNIFICANCE_LEVELS.very_significant.threshold) {
    return SIGNIFICANCE_LEVELS.very_significant
  }
  if (pValue < SIGNIFICANCE_LEVELS.significant.threshold) {
    return SIGNIFICANCE_LEVELS.significant
  }
  if (pValue < SIGNIFICANCE_LEVELS.marginal.threshold) {
    return SIGNIFICANCE_LEVELS.marginal
  }
  return SIGNIFICANCE_LEVELS.not_significant
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
      },
      {
        id: 'network',
        label: '字符網絡',
        icon: '🕸️',
        path: '/villagesML?module=character&subtab=network',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true,
        requireAuth: true
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
    path: '/villagesML?module=pattern&subtab=ngram-explore',
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
        id: 'ngram-explore',
        label: 'N-gram 探索',
        icon: '🔍',
        path: '/villagesML?module=pattern&subtab=ngram-explore',
        weight: 1,
        mobileWeight: 1,
        fontSize: 0.95,
        mobileFontSize: 0.9,
        hideOnMobile: false,
        hideLabelOnMobile: true
      },
      {
        id: 'ngram-stats',
        label: 'N-gram 統計',
        icon: '📊',
        path: '/villagesML?module=pattern&subtab=ngram-stats',
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
    requireAuth: false,
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

// ========================================
// 空間聚類配置
// ========================================

/**
 * 空間聚類 Run ID 標籤映射
 * @type {Object<string, string>}
 */
export const SPATIAL_CLUSTERING_RUN_LABELS = {
  'spatial_eps_05': '超密集核心聚類',
  'spatial_hdbscan_v1': '自動多密度聚類',
  'spatial_eps_10': '標準密度聚類',
  'spatial_eps_20': '全域覆蓋聚類'
}

/**
 * 默認的空間聚類 Run ID
 * @type {string}
 */
export const DEFAULT_SPATIAL_CLUSTERING_RUN_ID = 'spatial_hdbscan_v1'

/**
 * 獲取空間聚類 Run 標籤
 * @param {string} runId - Run ID
 * @returns {string} 標籤名稱
 */
export function getSpatialClusteringRunLabel(runId) {
  return SPATIAL_CLUSTERING_RUN_LABELS[runId] || runId
}
