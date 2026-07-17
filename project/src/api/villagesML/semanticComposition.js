// api/villagesML/semanticComposition.js
// 語義組合分析相關 API

import { villagesMLApi } from './request.js'

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

  return villagesMLApi(`/semantic/composition/trigrams?${queryParams.toString()}`)
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

  return villagesMLApi(`/semantic/composition/pmi?${queryParams.toString()}`)
}

/**
 * 獲取語義指數
 * @param {Object} params
 * @param {string} [params.category] - 語義類別（可選）
 * @param {string} [params.region_level] - 行政級別（可選：city/county/township）
 * @param {string} [params.city] - 城市名稱（推薦使用，精確查詢）
 * @param {string} [params.county] - 區縣名稱（推薦使用，精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（推薦使用，精確查詢）
 * @param {string} [params.region_name] - 區域名稱（向後兼容，模糊查詢）
 * @param {number} [params.min_villages] - 最小村莊數（可選）
 * @param {number} [params.limit] - 返回數量（默認100，範圍1-1000）
 * @returns {Promise<Array>} [{
 *   region_level: string,
 *   region_name: string,
 *   city: string,
 *   county: string,
 *   township: string,
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

  // 優先使用新參數（精確查詢）
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // 向後兼容：使用 region_name（模糊查詢）
  if (params.region_name) queryParams.append('region_name', params.region_name)

  if (params.min_villages) queryParams.append('min_villages', params.min_villages)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.detail) queryParams.append('detail', 'true')

  const queryString = queryParams.toString()
  const url = queryString
    ? `/semantic/indices?${queryString}`
    : '/semantic/indices'

  return villagesMLApi(url)
}
