// api/villagesML/characters.js
// 字頻統計相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取全局字頻統計
 * @param {Object} params
 * @param {number} params.top_k - 返回前K個高頻字（默認50）
 * @returns {Promise<Array>} [{ char: string, frequency: number, percentage: number }, ...]
 */
export async function getGlobalCharFrequency(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.top_k) queryParams.append('top_k', params.top_k)

  return api(`/api/villages/character/frequency/global?${queryParams.toString()}`)
}

/**
 * 獲取字的區域傾向性
 * @param {Object} params
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @param {string} [params.city] - 城市名稱（精確查詢）
 * @param {string} [params.county] - 區縣名稱（精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（精確查詢）
 * @param {string} [params.region_name] - 區域名稱（模糊查詢，向後兼容）
 * @param {number} params.top_k - 返回前K個字（默認30）
 * @returns {Promise<Array>} [{ char: string, z_score: number, frequency: number }, ...]
 */
export async function getCharTendency(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)

  // Hierarchical parameters (preferred for precise queries)
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // Legacy parameter (backward compatible)
  if (params.region_name) queryParams.append('region_name', params.region_name)

  if (params.top_k) queryParams.append('top_k', params.top_k)

  return api(`/api/villages/character/tendency/by-region?${queryParams.toString()}`)
}

/**
 * 獲取區域字頻統計
 * @param {Object} params
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @param {string} [params.city] - 城市名稱（精確查詢）
 * @param {string} [params.county] - 區縣名稱（精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（精確查詢）
 * @param {string} [params.region_name] - 區域名稱（模糊查詢，向後兼容）
 * @param {number} params.top_k - 返回前K個字（默認50）
 * @returns {Promise<Array>} [{ char: string, frequency: number, percentage: number }, ...]
 */
export async function getRegionalCharFrequency(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)

  // Hierarchical parameters (preferred for precise queries)
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // Legacy parameter (backward compatible)
  if (params.region_name) queryParams.append('region_name', params.region_name)

  if (params.top_k) queryParams.append('top_k', params.top_k)

  return api(`/api/villages/character/frequency/regional?${queryParams.toString()}`)
}

/**
 * 獲取字的傾向性（按字查詢，顯示所有區域）
 * @param {Object} params
 * @param {string} params.char - 字符
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @returns {Promise<Array>} [{ region_name: string, city: string, county: string, township: string, z_score: number, frequency: number }, ...]
 */
export async function getCharTendencyByChar(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('character', params.character)
  queryParams.append('region_level', params.region_level)
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  return api(`/api/villages/character/tendency/by-char?${queryParams.toString()}`)
}

/**
 * 獲取字嵌入列表
 * @param {Object} params
 * @param {number} params.limit - 返回數量限制（默認100）
 * @param {number} params.offset - 偏移量（默認0）
 * @returns {Promise<Object>} { embeddings: [{ char: string, vector_dim: number }, ...], total: number }
 */
export async function getCharEmbeddingsList(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.offset) queryParams.append('offset', params.offset)

  return api(`/api/villages/character/embeddings/list?${queryParams.toString()}`)
}

/**
 * 獲取字的嵌入向量
 * @param {string} char - 字符
 * @returns {Promise<Object>} { char: string, vector: number[], dim: number }
 */
export async function getCharEmbeddingVector(char) {
  const queryParams = new URLSearchParams({ char })
  return api(`/api/villages/character/embeddings/vector?${queryParams.toString()}`)
}

/**
 * 獲取字的相似字
 * @param {Object} params
 * @param {string} params.char - 字符
 * @param {number} params.top_k - 返回前K個相似字（默認10，範圍1-50）
 * @param {number} params.min_similarity - 最小相似度閾值（可選）
 * @returns {Promise<Array>} [{ char: string, similarity: number }, ...]
 */
export async function getCharSimilarities(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('char', params.char)
  if (params.top_k) queryParams.append('top_k', params.top_k)
  if (params.min_similarity) queryParams.append('min_similarity', params.min_similarity)

  return api(`/api/villages/character/embeddings/similarities?${queryParams.toString()}`)
}

/**
 * 獲取字的顯著性（按字查詢）
 * @param {Object} params
 * @param {string} params.char - 字符
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @returns {Promise<Array>} [{ region_name: string, chi_square: number, p_value: number, effect_size: number }, ...]
 */
export async function getCharSignificanceByChar(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('char', params.char)
  queryParams.append('region_level', params.region_level)

  return api(`/api/villages/character/significance/by-character?${queryParams.toString()}`)
}

/**
 * 獲取區域的顯著性字符
 * @param {Object} params
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @param {string} params.region_name - 區域名稱
 * @param {number} params.top_k - 返回前K個字（默認30）
 * @returns {Promise<Array>} [{ char: string, chi_square: number, p_value: number, effect_size: number }, ...]
 */
export async function getCharSignificanceByRegion(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)
  queryParams.append('region_name', params.region_name)
  if (params.top_k) queryParams.append('top_k', params.top_k)

  return api(`/api/villages/character/significance/by-region?${queryParams.toString()}`)
}

/**
 * 獲取顯著性統計摘要
 * @param {Object} params
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @returns {Promise<Object>} { total_tests: number, significant_count: number, summary: [] }
 */
export async function getCharSignificanceSummary(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)

  return api(`/api/villages/character/significance/summary?${queryParams.toString()}`)
}

