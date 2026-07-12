// api/villagesML/villages.js
// 村名搜尋相關 API

import { api } from '../auth/httpClient.js'

/**
 * 搜尋村名
 * @param {Object} params
 * @param {string} params.keyword - 搜尋關鍵詞
 * @param {string} params.city - 城市篩選（可選）
 * @param {string} params.county - 區縣篩選（可選）
 * @param {string} params.township - 鄉鎮篩選（可選）
 * @param {number} params.page - 頁碼（默認1）
 * @param {number} params.page_size - 每頁數量（默認20）
 * @returns {Promise<Object>} { villages: [], total: number, page: number, page_size: number }
 */
export async function searchVillages(params) {
  const queryParams = new URLSearchParams()

  // query 參數是必需的，如果沒有關鍵詞則使用空格作為通配符
  const query = params.keyword || ' '
  queryParams.append('query', query)

  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // 後端使用 limit/offset，需要從 page/page_size 轉換
  const page = params.page || 1
  const pageSize = params.page_size || 20
  const limit = pageSize
  const offset = (page - 1) * pageSize

  queryParams.append('limit', limit)
  queryParams.append('offset', offset)

  return api(`/api/villages/village/search?${queryParams.toString()}`)
}

/**
 * 獲取村名詳情
 * @param {number} villageId - 村ID
 * @returns {Promise<Object>} 村詳情數據
 */
export async function getVillageDetail(villageId) {
  return api(`/api/villages/village/search/detail?id=${villageId}`)
}

/**
 * 獲取地區列表（用於篩選器）
 * @param {string} level - 層級：'city' | 'county' | 'township'
 * @param {string} parent - 父級名稱（可選）
 * @returns {Promise<Array>} 地區列表，包含層級信息
 * 返回格式：[{ name: string, city?: string, county?: string, township?: string, village_count?: number }, ...]
 */
export async function getRegionList(level, parent = null) {
  const queryParams = new URLSearchParams({ level })
  if (parent) queryParams.append('parent', parent)

  return api(`/api/villages/metadata/stats/regions?${queryParams.toString()}`)
}

/**
 * 獲取村的完整信息
 * @param {number} villageId - 村ID
 * @returns {Promise<Object>} 完整村信息（包含所有字段）
 */
export async function getVillageComplete(villageId) {
  return api(`/api/villages/village/complete/${villageId}`)
}

/**
 * 獲取村的特徵向量
 * @param {number} villageId - 村ID
 * @returns {Promise<Object>} {
 *   village_id: number,
 *   features: { semantic: [], morphology: [], diversity: [] },
 *   feature_vector: number[]
 * }
 */
export async function getVillageFeatures(villageId) {
  return api(`/api/villages/village/features/${villageId}`)
}

/**
 * 獲取村的空間特徵
 * @param {number} villageId - 村ID
 * @returns {Promise<Object>} {
 *   village_id: number,
 *   spatial_features: { hotspot_id: number, cluster_id: number, ... }
 * }
 */
export async function getVillageSpatialFeatures(villageId) {
  return api(`/api/villages/village/spatial-features/${villageId}`)
}

/**
 * 獲取村的語義結構
 * @param {number} villageId - 村ID
 * @returns {Promise<Object>} {
 *   village_id: number,
 *   semantic_structure: { categories: [], labels: [], composition: [] }
 * }
 */
export async function getVillageSemanticStructure(villageId) {
  return api(`/api/villages/village/semantic-structure/${villageId}`)
}

/**
 * 獲取村名的N-gram分解
 * @param {number} villageId - 村ID
 * @returns {Promise<Object>} {
 *   village_id: number,
 *   ngrams: { unigrams: [], bigrams: [], trigrams: [] }
 * }
 */
export async function getVillageNgrams(villageId) {
  return api(`/api/villages/village/ngrams/${villageId}`)
}

/**
 * 子集篩選 — 一次請求返回全部匹配村莊（無分頁循環）。
 * 所有條件為 AND 關係，同組內（數組字段）為 OR。
 *
 * @param {Object} params
 * @param {string} [params.city] - 城市精確匹配
 * @param {string} [params.county] - 區縣精確匹配
 * @param {string} [params.township] - 鄉鎮精確匹配
 * @param {string} [params.keyword] - 村名模糊匹配
 * @param {'contains'|'startsWith'|'endsWith'|'equals'} [params.nameMatchMode] - 名稱匹配模式，默認 "contains"
 * @param {number} [params.minLength] - 最小名稱長度
 * @param {number} [params.maxLength] - 最大名稱長度
 * @param {string[]} [params.semanticCategories] - 語義大類
 * @param {'any'|'all'} [params.semanticMatch] - 多類別邏輯，默認 "any"
 * @param {string[]} [params.structurePatterns] - 結構模式
 * @param {string} [params.suffix] - 後綴字符（長度=1）
 * @param {string} [params.prefix] - 前綴字符（長度=1）
 * @param {number} [params.charAtPosition] - 指定位置
 * @param {string} [params.charAtValue] - 指定位置字符（長度=1）
 * @param {number} [params.latMin] - 最小緯度
 * @param {number} [params.latMax] - 最大緯度
 * @param {number} [params.lonMin] - 最小經度
 * @param {number} [params.lonMax] - 最大經度
 * @param {number} [params.maxResults] - 返回上限，默認 5000
 * @returns {Promise<{villages: Array<{id: number, name: string, city: string, county: string, nameLength: number}>, total: number}>}
 */
export async function fetchSubsetFilter(params = {}) {
  const body = {}
  if (params.city != null) body.city = params.city
  if (params.county != null) body.county = params.county
  if (params.township != null) body.township = params.township
  if (params.keyword != null) body.keyword = params.keyword
  if (params.nameMatchMode != null) body.name_match_mode = params.nameMatchMode
  if (params.minLength != null) body.min_length = params.minLength
  if (params.maxLength != null) body.max_length = params.maxLength
  if (params.semanticCategories) body.semantic_categories = params.semanticCategories
  if (params.semanticMatch) body.semantic_match = params.semanticMatch
  if (params.structurePatterns) body.structure_patterns = params.structurePatterns
  if (params.suffix != null) body.suffix = params.suffix
  if (params.prefix != null) body.prefix = params.prefix
  if (params.charAtPosition != null) body.char_at_position = params.charAtPosition
  if (params.charAtValue != null) body.char_at_value = params.charAtValue
  if (params.latMin != null) body.lat_min = params.latMin
  if (params.latMax != null) body.lat_max = params.latMax
  if (params.lonMin != null) body.lon_min = params.lonMin
  if (params.lonMax != null) body.lon_max = params.lonMax
  if (params.maxResults != null) body.max_results = params.maxResults

  return api('/api/villages/subset/filter', {
    method: 'POST',
    body
  })
}
