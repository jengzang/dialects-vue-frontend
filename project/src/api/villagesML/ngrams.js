// api/villagesML/ngrams.js
// N-gram 分析相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取N-gram頻率
 * @param {Object} params
 * @param {number} params.n - N值（2-4之間：2=bigram, 3=trigram, 4=4-gram）
 * @param {number} [params.top_k] - 返回前K個（默認100，範圍1-1000）
 * @param {number} [params.min_frequency] - 最小頻次過濾（可選，≥1）
 * @param {string} [params.position] - N-gram位置過濾（默認'all'）
 *   - 'all': 所有位置的統計
 *   - 'prefix': 前綴位置
 *   - 'middle': 中間位置
 *   - 'suffix': 後綴位置
 * @returns {Promise<Array>} [{ ngram: string, position: string, frequency: number, percentage: number }, ...]
 */
export async function getNgramFrequency(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('n', params.n)
  if (params.top_k) queryParams.append('top_k', params.top_k)
  if (params.min_frequency) queryParams.append('min_frequency', params.min_frequency)
  if (params.position) queryParams.append('position', params.position)

  return api(`/api/villages/ngrams/frequency?${queryParams.toString()}`)
}

/**
 * 獲取N-gram模式
 * @param {Object} params
 * @param {string} params.pattern - 搜尋模式（支持通配符 *）
 * @param {number} params.n - N值（2-4之間）
 * @returns {Promise<Array>} [{ pattern: string, pattern_type: string, frequency: number, example: string }, ...]
 *   - pattern: 匹配的模式（如 "张X", "X梅"）
 *   - pattern_type: 模式類型（'prefix' | 'suffix' | 'middle' | 'all'）
 *   - frequency: 出現頻率
 *   - example: 示例（單個字符串）
 */
export async function getNgramPatterns(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('pattern', params.pattern)
  queryParams.append('n', params.n)

  return api(`/api/villages/ngrams/patterns?${queryParams.toString()}`)
}

/**
 * 獲取N-gram區域分佈
 * @param {Object} params
 * @param {string} params.ngram - N-gram字符串
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @param {string} [params.city] - 城市名稱（精確查詢）
 * @param {string} [params.county] - 區縣名稱（精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（精確查詢）
 * @param {string} [params.region_name] - 區域名稱（模糊查詢，向後兼容）
 * @returns {Promise<Array>} [{ region_name: string, city: string, county: string, township: string, frequency: number, percentage: number }, ...]
 */
export async function getNgramRegional(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('ngram', params.ngram)
  queryParams.append('region_level', params.region_level)

  // Hierarchical parameters (preferred for precise queries)
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // Legacy parameter (backward compatible)
  if (params.region_name) queryParams.append('region_name', params.region_name)

  return api(`/api/villages/ngrams/regional?${queryParams.toString()}`)
}

/**
 * 獲取N-gram傾向性
 * @param {Object} params
 * @param {string} params.ngram - N-gram字符串
 * @param {string} params.region_level - 區域層級
 * @param {string} [params.city] - 城市名稱（精確查詢）
 * @param {string} [params.county] - 區縣名稱（精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（精確查詢）
 * @param {string} [params.region_name] - 區域名稱（模糊查詢，向後兼容）
 * @returns {Promise<Array>} [{ region_name: string, city: string, county: string, township: string, z_score: number, frequency: number }, ...]
 */
export async function getNgramTendency(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('ngram', params.ngram)
  queryParams.append('region_level', params.region_level)

  // Hierarchical parameters (preferred for precise queries)
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // Legacy parameter (backward compatible)
  if (params.region_name) queryParams.append('region_name', params.region_name)

  return api(`/api/villages/ngrams/tendency?${queryParams.toString()}`)
}

/**
 * 獲取N-gram顯著性
 * @param {Object} params
 * @param {string} params.ngram - N-gram字符串
 * @param {string} params.region_level - 區域層級
 * @returns {Promise<Array>} [{ region_name: string, chi_square: number, p_value: number }, ...]
 */
export async function getNgramSignificance(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('ngram', params.ngram)
  queryParams.append('region_level', params.region_level)

  return api(`/api/villages/ngrams/significance?${queryParams.toString()}`)
}

