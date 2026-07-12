// src/config/subsetFilters.js
// 子集分析篩選器配置

/**
 * 篩選字段配置
 * @type {Array<{label: string, value: string, description: string}>}
 */
export const FILTER_FIELDS = [
  { label: '村名', value: 'name', description: '根據村莊名稱篩選' },
  { label: '區域', value: 'region', description: '根據地理區域篩選' },
  { label: '名稱長度', value: 'length', description: '根據名稱字數篩選' },
  { label: '語義類別', value: 'semantic', description: '根據語義大類篩選（水系、山地、宗族等）' },
  { label: '結構模式', value: 'structure', description: '根據名稱結構篩選（修飾-中心、聚落通名等）' },
  { label: '後綴字符', value: 'suffix', description: '根據名稱最後一個字篩選' },
  { label: '前綴字符', value: 'prefix', description: '根據名稱第一個字篩選' }
]

/**
 * 操作符定義
 * @type {Object<string, {label: string, value: string, description: string}>}
 */
export const OPERATORS = {
  contains: { label: '包含', value: 'contains', description: '字符串包含指定內容' },
  equals: { label: '等於', value: 'equals', description: '完全匹配' },
  startsWith: { label: '開頭為', value: 'startsWith', description: '以指定內容開頭' },
  endsWith: { label: '結尾為', value: 'endsWith', description: '以指定內容結尾' },
}

/**
 * 字段支持的操作符映射
 * @type {Object<string, Array<string>>}
 */
export const FIELD_OPERATORS_MAP = {
  name: ['contains', 'equals', 'startsWith', 'endsWith'],
  region: ['equals'],
  length: ['equals'],
  semantic: ['equals'],
  structure: ['equals'],
  suffix: ['equals'],
  prefix: ['equals']
}

/**
 * 語義類別選項
 */
export const SEMANTIC_CATEGORY_OPTIONS = [
  { label: '農業 (agriculture)', value: 'agriculture' },
  { label: '宗族 (clan)', value: 'clan' },
  { label: '方位 (direction)', value: 'direction' },
  { label: '基建 (infrastructure)', value: 'infrastructure' },
  { label: '山地 (mountain)', value: 'mountain' },
  { label: '聚落 (settlement)', value: 'settlement' },
  { label: '象徵 (symbolic)', value: 'symbolic' },
  { label: '植被 (vegetation)', value: 'vegetation' },
  { label: '水系 (water)', value: 'water' }
]

/**
 * 結構模式選項
 */
export const STRUCTURE_PATTERN_OPTIONS = [
  { label: '修飾語 + 中心詞 (modifier_head)', value: 'modifier_head' },
  { label: '僅修飾語 (modifier_only)', value: 'modifier_only' },
  { label: '僅中心詞 (head_only)', value: 'head_only' },
  { label: '含聚落通名 (settlement)', value: 'settlement' }
]

/**
 * 獲取指定字段支持的操作符選項
 * @param {string} field - 字段類型
 * @returns {Array<{label: string, value: string}>} 操作符選項列表
 */
export function getOperatorOptions(field) {
  const operatorKeys = FIELD_OPERATORS_MAP[field] || []
  return operatorKeys.map(key => ({
    label: OPERATORS[key].label,
    value: OPERATORS[key].value
  }))
}

/**
 * 獲取字段的默認操作符
 * @param {string} field - 字段類型
 * @returns {string} 默認操作符
 */
export function getDefaultOperator(field) {
  const operators = FIELD_OPERATORS_MAP[field] || []
  return operators.length > 0 ? operators[0] : 'equals'
}

/**
 * 獲取字段的值輸入類型
 * @param {string} field - 字段類型
 * @returns {'text'|'region'|'select'} 輸入類型
 */
export function getFieldInputType(field) {
  if (field === 'region') return 'region'
  if (field === 'semantic' || field === 'structure') return 'select'
  if (field === 'length') return 'number'
  return 'text'
}

/**
 * 獲取字段的選項列表（用於 select 類型）
 * @param {string} field - 字段類型
 * @returns {Array<{label: string, value: string}>} 選項列表
 */
export function getFieldOptions(field) {
  if (field === 'semantic') return SEMANTIC_CATEGORY_OPTIONS
  if (field === 'structure') return STRUCTURE_PATTERN_OPTIONS
  return []
}
