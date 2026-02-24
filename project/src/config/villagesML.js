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
