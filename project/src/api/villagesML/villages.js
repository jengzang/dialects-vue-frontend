// api/villagesML/villages.js
// 村名搜尋相關 API

import { api } from '../auth/auth.js'

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

