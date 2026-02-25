// api/villagesML/semanticComposition.js
// 語義組合分析相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取語義三元組合
 * @param {Object} params
 * @param {number} params.min_frequency - 最小出現次數（默認3）
 * @param {number} params.limit - 返回前N個（默認100，範圍1-1000）
 * @returns {Promise<Array>} [{ trigram: string, count: number, categories: [] }, ...]
 */
export async function getSemanticTrigrams(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.min_frequency) queryParams.append('min_frequency', params.min_frequency)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.detail) queryParams.append('detail', 'true')

  return api(`/api/villages/semantic/composition/trigrams?${queryParams.toString()}`)
}

/**
 * 獲取PMI（點互信息）分數
 * @param {Object} params
 * @param {number} params.min_pmi - 最小PMI值（默認0）
 * @param {number} params.limit - 返回前N個（默認100，範圍1-1000）
 * @returns {Promise<Array>} [{ pair: string, pmi: number, count: number }, ...]
 */
export async function getSemanticPMI(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.min_pmi) queryParams.append('min_pmi', params.min_pmi)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.detail) queryParams.append('detail', 'true')

  return api(`/api/villages/semantic/composition/pmi?${queryParams.toString()}`)
}

/**
 * 獲取語義指數
 * @param {Object} params
 * @param {string} params.category - 語義類別（可選）
 * @param {string} params.region_level - 行政級別（可選：city/county/township）
 * @param {string} params.region_name - 區域名稱（可選）
 * @param {number} params.min_villages - 最小村莊數（可選）
 * @param {number} params.limit - 返回數量（默認100，範圍1-1000）
 * @returns {Promise<Array>} [{
 *   region_level: string,
 *   region_name: string,
 *   semantic_category: string,
 *   semantic_index: number,
 *   normalized_index: number,
 *   rank_in_region: number,
 *   village_count?: number
 * }, ...]
 */
export async function getSemanticIndices(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.category) queryParams.append('category', params.category)
  if (params.region_level) queryParams.append('region_level', params.region_level)
  if (params.region_name) queryParams.append('region_name', params.region_name)
  if (params.min_villages) queryParams.append('min_villages', params.min_villages)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.detail) queryParams.append('detail', 'true')

  const queryString = queryParams.toString()
  const url = queryString
    ? `/api/villages/semantic/indices?${queryString}`
    : '/api/villages/semantic/indices'

  return api(url)
}
