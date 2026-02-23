// api/villagesML/ngrams.js
// N-gram 分析相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取N-gram頻率
 * @param {Object} params
 * @param {number} params.n - N值（1, 2, 或 3）
 * @param {number} params.top_k - 返回前K個（默認50）
 * @param {number} params.min_frequency - 最小出現次數（默認5）
 * @returns {Promise<Array>} [{ ngram: string, frequency: number, percentage: number }, ...]
 */
export async function getNgramFrequency(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('n', params.n)
  if (params.top_k) queryParams.append('top_k', params.top_k)
  if (params.min_frequency) queryParams.append('min_frequency', params.min_frequency)

  return api(`/api/villages/ngrams/frequency?${queryParams.toString()}`)
}

/**
 * 獲取N-gram模式
 * @param {Object} params
 * @param {string} params.pattern - 搜尋模式（支持通配符）
 * @param {number} params.n - N值（1, 2, 或 3）
 * @returns {Promise<Array>} [{ ngram: string, frequency: number, examples: [] }, ...]
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
 * @returns {Promise<Array>} [{ region_name: string, frequency: number, percentage: number }, ...]
 */
export async function getNgramRegional(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('ngram', params.ngram)
  queryParams.append('region_level', params.region_level)

  return api(`/api/villages/ngrams/regional?${queryParams.toString()}`)
}

/**
 * 獲取N-gram傾向性
 * @param {Object} params
 * @param {string} params.ngram - N-gram字符串
 * @param {string} params.region_level - 區域層級
 * @returns {Promise<Array>} [{ region_name: string, z_score: number, frequency: number }, ...]
 */
export async function getNgramTendency(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('ngram', params.ngram)
  queryParams.append('region_level', params.region_level)

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

