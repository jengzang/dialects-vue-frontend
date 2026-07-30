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
  'culture': '🏛️',
  'modifier': '📝',
  'settlement': '🏘️',
  'spatial': '🧭',
  'terrain': '⛰️',
  'vegetation': '🌿',
  'water': '💧',
  // === 向后兼容（旧版 lexicon 类别名）===
  'direction': '🧭',
  'infrastructure': '🏗️',
  'mountain': '⛰️',
  'symbolic': '🎨',
}

/**
 * 語義類別中文名稱映射
 * @type {Object<string, string>}
 */
export const SEMANTIC_CATEGORY_NAMES = {
  'agriculture': '農業',
  'clan': '宗族',
  'culture': '文化',
  'modifier': '修飾語',
  'settlement': '聚落',
  'spatial': '空間',
  'terrain': '地形',
  'vegetation': '植被',
  'water': '水系',
  // === 向后兼容（旧版 lexicon 类别名）===
  'direction': '方位',
  'infrastructure': '基建',
  'mountain': '山地',
  'symbolic': '象徵',
  'head': '中心詞',
  'other': '其他',
}

// @deprecated 请使用 SEMANTIC_CATEGORY_NAMES
export const CATEGORY_NAMES_ZH = SEMANTIC_CATEGORY_NAMES

// ========================================
// v4 语义特征 key（与 API semantic_tags 的 sem_* 字段对应）
// ========================================

/** @type {string[]} v4 九大语义类别 key */
export const SEMANTIC_FEATURE_KEYS = [
  'agriculture', 'clan', 'culture', 'modifier',
  'settlement', 'spatial', 'terrain', 'vegetation', 'water'
]

/**
 * 判断对象是否为语义特征对象（包含 sem_* 字段）
 * @param {Object} obj
 * @returns {boolean}
 */
export const isSemanticFeature = (obj) => {
  if (!obj) return false
  return SEMANTIC_FEATURE_KEYS.some(k => obj[`sem_${k}`] !== undefined)
}

/**
 * 語義類別描述映射
 * @type {Object<string, string>}
 */
export const SEMANTIC_CATEGORY_DESCRIPTIONS = {
  'agriculture': '農業、耕作、田地相關',
  'clan': '宗族、姓氏、家族相關',
  'culture': '吉祥符號、宗教、美德等文化象徵相關',
  'modifier': '大小、顏色、新舊、數量等修飾語相關',
  'settlement': '村落、居住地、圩市等聚落相關',
  'spatial': '方位、高低、內外等空間位置相關',
  'terrain': '山峰、坡崗、山谷、岩石、平地等地形相關',
  'vegetation': '樹木、花草、竹林等植物相關',
  'water': '河流、湖泊、港灣、水塘等水系相關',
  // === 向后兼容（旧版 lexicon 类别名）===
  'direction': '東西南北、方向相關',
  'infrastructure': '道路、橋樑、建築相關',
  'mountain': '山地、丘陵等地形相關',
  'symbolic': '吉祥、象徵意義相關',
}

/**
 * 語義子類別中文名稱映射（v4.0 Hybrid Lexicon）
 * @type {Object<string, string>}
 */
export const SEMANTIC_SUBCATEGORY_NAMES = {
  // ===== 父类别（9个大类，匹配 lexicon v1.12+ / v4.5+）=====
  'agriculture': '農業',
  'clan': '宗族',
  'culture': '文化',
  'modifier': '修飾語',
  'settlement': '聚落',
  'spatial': '空間',
  'terrain': '地形',
  'vegetation': '植被',
  'water': '水系',
  'other': '其他',
  // === 向后兼容（旧版 lexicon 父类别）===
  'infrastructure': '基建',
  'mountain': '山地',
  'symbolic': '象徵',

  // ===== v4.7+ 子类别（层级 lexicon，不带父前缀）=====
  // --- terrain 地形 ---
  'peak_ridge': '峰嶺',
  'slope': '坡崗',
  'valley': '山谷',
  'rock': '岩石',
  'flatland': '台坪',
  'surface': '沙土',
  // --- water 水系 ---
  'river': '江河',
  'stream': '溪涌',
  'ditch': '溝渠',
  'pond_lake': '池塘',
  'bay_port': '港灣',
  'shore_island': '洲灘',
  'water_source': '泉井',
  // --- settlement 聚落 ---
  'village': '村屯',
  'dwelling': '民居',
  'building': '建築',
  'fortification': '城寨',
  'market_trade': '圩市',
  'road_transport': '路橋',
  'traditional_unit': '里坊',
  'admin_unit': '社隊',
  // --- spatial 空间 ---
  'direction': '方位',
  'elevation': '高低',
  'extremity': '頭尾',
  'boundary': '邊角',
  'enclosure': '內外',
  'center': '中心',
  'relative_position': '前後',
  // --- clan 宗族 ---
  'general': '通用姓',
  'cantonese': '廣府姓',
  'hakka': '客家姓',
  'teochew': '潮汕姓',
  // --- culture 文化 ---
  'religion': '宗教',
  'auspicious': '吉祥',
  'virtue': '美德',
  'animal_symbol': '瑞獸',
  'natural_symbol': '天象',
  'community': '社群',
  'craft_memorial': '工藝',
  // --- agriculture 农业 ---
  'field': '田地',
  'crop': '作物',
  'livestock': '禽畜',
  'farming_infra': '農耕',
  // --- vegetation 植被 ---
  'tree': '樹木',
  'bamboo': '竹',
  'fruit': '果樹',
  'herb': '花草',
  // --- modifier 修飾語 ---
  'number': '數字',
  'size': '尺寸',
  'color': '顏色',
  'time': '時序',
  'quality': '性質',
  'suffix': '後綴',

  // ===== API 返回的帶父前綴子類別 key（如 "settlement_village"）=====
  // settlement
  'settlement_village': '村屯',
  'settlement_dwelling': '民居',
  'settlement_building': '建築',
  'settlement_fort': '城寨',
  'settlement_market': '圩市',
  'settlement_district': '里坊',
  'settlement_group': '社隊',
  // mountain
  'mountain_peak': '峰嶺',
  'mountain_valley': '山谷',
  'mountain_slope': '坡崗',
  'mountain_rock': '岩石',
  'mountain_plateau': '台坪',
  'mountain_ridge': '山脊',
  // water
  'water_river': '江河',
  'water_stream': '溪涌',
  'water_pond': '池塘',
  'water_lake': '湖泊',
  'water_bay': '港灣',
  'water_beach': '沙灘',
  'water_spring': '泉井',
  'water_island': '島嶼',
  'water_shore': '洲灘',
  'water_port': '碼頭',
  // direction
  'direction_vertical': '高低',
  'direction_end': '頭尾',
  'direction_cardinal': '四方',
  'direction_inside': '內外',
  'direction_opening': '邊角',
  'direction_horizontal': '前後',
  'direction_outside': '外圍',
  'direction_center': '中心',
  // symbolic
  'symbolic_animal': '瑞獸',
  'symbolic_religion': '宗教',
  'symbolic_prosperity': '興旺',
  'symbolic_peace': '吉祥',
  'symbolic_virtue': '美德',
  'symbolic_fortune': '福祿',
  'symbolic_light': '天象',
  'symbolic_treasure': '珍寶',
  // vegetation
  'vegetation_forest': '樹木',
  'vegetation_bamboo': '竹',
  'vegetation_other': '其他植被',
  'vegetation_fruit': '果樹',
  'vegetation_flower': '花草',
  'vegetation_pine': '松',
  'vegetation_tea': '茶',
  // agriculture
  'agriculture_field': '田地',
  'agriculture_garden': '園圃',
  'agriculture_irrigation': '水利',
  'agriculture_crop': '作物',
  'agriculture_storage': '倉儲',
  'agriculture_activity': '農事',
  // infrastructure
  'infrastructure_road': '路橋',
  'infrastructure_transport': '交通',
  'infrastructure_bridge': '橋',
  'infrastructure_port': '渡口',
  'infrastructure_station': '站所',
  // clan
  'clan_other': '其他姓',
  'clan_huang': '黃',
  'clan_luo': '羅',
  'clan_chen': '陳',
  'clan_li': '李',
  'clan_zhang': '張',
  'clan_liu': '劉',
  'clan_he': '何',
  'clan_wu': '吳',
  'clan_liang': '梁',
  // number
  'number_small': '小數',
  'number_large': '大數',
  'number_ordinal': '序數',
  // size
  'size_large': '大',
  'size_long': '長',
  'size_small': '小',
  'size_short': '短',
  // other (no parent prefix)
  'shape': '形狀',

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

  // 如果是詳細模式，優先查找子類別映射（精確匹配，如 "settlement_village"）
  if (isDetailMode && SEMANTIC_SUBCATEGORY_NAMES[category]) {
    return SEMANTIC_SUBCATEGORY_NAMES[category]
  }

  // 否則查找主類別映射
  if (SEMANTIC_CATEGORY_NAMES[category]) {
    return SEMANTIC_CATEGORY_NAMES[category]
  }

  // 兼容：非detail模式也嘗試子類別映射
  if (SEMANTIC_SUBCATEGORY_NAMES[category]) {
    return SEMANTIC_SUBCATEGORY_NAMES[category]
  }

  // Detail模式：剝離父類別前綴後查找子類名（如 "settlement_village" → "village"）
  if (isDetailMode) {
    const underscoreIdx = category.indexOf('_')
    if (underscoreIdx > 0) {
      const suffix = category.substring(underscoreIdx + 1)
      if (SEMANTIC_SUBCATEGORY_NAMES[suffix]) {
        return SEMANTIC_SUBCATEGORY_NAMES[suffix]
      }
      return suffix
    }
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
// 空間聚類配置
// ========================================

/**
 * 空間聚類 Run ID 標籤映射
 * @type {Object<string, string>}
 */
export const SPATIAL_CLUSTERING_RUN_LABELS = {
  'spatial_eps_05': '微尺度·緊密村落群（0.5km）',
  'spatial_eps_15': '小尺度·村級聚集（1.5km）',
  'spatial_eps_25': '中尺度·鄉鎮級聚集（2.5km）',
  'spatial_eps_45': '大尺度·跨鄉鎮連通（4.5km）',
  'spatial_hdbscan_v2': '自適應多密度聚類（HDBSCAN）'
}

/**
 * 默認的空間聚類 Run ID
 * @type {string}
 */
export const DEFAULT_SPATIAL_CLUSTERING_RUN_ID = 'spatial_hdbscan_v2'

/**
 * 獲取空間聚類 Run 標籤
 * @param {string} runId - Run ID
 * @returns {string} 標籤名稱
 */
export function getSpatialClusteringRunLabel(runId) {
  return SPATIAL_CLUSTERING_RUN_LABELS[runId] || runId
}
