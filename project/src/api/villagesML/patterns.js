// api/villagesML/patterns.js
// 結構模式分析相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取全局模式頻率
 * @param {Object} params
 * @param {number} params.top_k - 返回前K個模式（默認50）
 * @param {number} params.min_frequency - 最小出現次數（默認5）
 * @returns {Promise<Array>} [{ pattern: string, frequency: number, percentage: number }, ...]
 */
export async function getPatternFrequencyGlobal(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.top_k) queryParams.append('top_k', params.top_k)
  if (params.min_frequency) queryParams.append('min_frequency', params.min_frequency)

  return api(`/api/villages/patterns/frequency/global?${queryParams.toString()}`)
}

/**
 * 獲取區域模式頻率
 * @param {Object} params
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @param {string} [params.city] - 城市名稱（精確查詢）
 * @param {string} [params.county] - 區縣名稱（精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（精確查詢）
 * @param {string} [params.region_name] - 區域名稱（模糊查詢，向後兼容）
 * @param {number} params.top_k - 返回前K個模式（默認30）
 * @returns {Promise<Array>} [{ pattern: string, frequency: number, percentage: number }, ...]
 */
export async function getPatternFrequencyRegional(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)

  // Hierarchical parameters (preferred for precise queries)
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // Legacy parameter (backward compatible)
  if (params.region_name) queryParams.append('region_name', params.region_name)

  if (params.top_k) queryParams.append('top_k', params.top_k)

  return api(`/api/villages/patterns/frequency/regional?${queryParams.toString()}`)
}

/**
 * 獲取結構模式分析
 * @param {Object} params
 * @param {string} params.pattern_type - 模式類型（可選）
 * @returns {Promise<Array>} [{ pattern: string, structure: string, examples: [], count: number }, ...]
 */
export async function getPatternStructural(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.pattern_type) queryParams.append('pattern_type', params.pattern_type)

  return api(`/api/villages/patterns/structural?${queryParams.toString()}`)
}

/**
 * 獲取模式傾向性
 * @param {Object} params
 * @param {string} params.pattern - 模式字符串
 * @param {string} params.region_level - 區域層級
 * @param {string} [params.city] - 城市名稱（精確查詢）
 * @param {string} [params.county] - 區縣名稱（精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（精確查詢）
 * @param {string} [params.region_name] - 區域名稱（模糊查詢，向後兼容）
 * @returns {Promise<Array>} [{ region_name: string, city: string, county: string, township: string, z_score: number, frequency: number }, ...]
 */
export async function getPatternTendency(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('pattern', params.pattern)
  queryParams.append('region_level', params.region_level)

  // Hierarchical parameters (preferred for precise queries)
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // Legacy parameter (backward compatible)
  if (params.region_name) queryParams.append('region_name', params.region_name)

  return api(`/api/villages/patterns/tendency?${queryParams.toString()}`)
}
