// api/villagesML/semanticLabels.js
// 語義標籤相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取標籤類別
 * @returns {Promise<Array>} [{ label: string, category: string }, ...]
 */
export async function getSemanticLabelCategories() {
  return api('/api/villages/semantic/labels/categories')
}

/**
 * 獲取類別的標籤
 * @param {string} category - 類別名稱
 * @returns {Promise<Array>} [{ label: string, count: number }, ...]
 */
export async function getSemanticLabelsByCategory(category) {
  const queryParams = new URLSearchParams({ category })
  return api(`/api/villages/semantic/labels/by-category?${queryParams.toString()}`)
}

/**
 * 獲取字符的語義標籤
 * @param {string} char - 字符
 * @returns {Promise<Array>} [{ label: string, category: string }, ...]
 */
export async function getSemanticLabelsByChar(char) {
  const queryParams = new URLSearchParams({ char })
  return api(`/api/villages/semantic/labels/by-character?${queryParams.toString()}`)
}

/**
 * 獲取語義組合模式
 * @param {Object} params
 * @param {number} params.min_frequency - 最小出現次數（默認5）
 * @param {number} params.limit - 返回前N個模式（默認100，範圍1-1000）
 * @returns {Promise<Array>} [{ pattern: string, frequency: number, percentage: number, pattern_type: string, modifier: string, head: string }, ...]
 */
export async function getSemanticCompositionPatterns(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.min_frequency) queryParams.append('min_frequency', params.min_frequency)
  if (params.limit) queryParams.append('limit', params.limit)

  return api(`/api/villages/semantic/composition/patterns?${queryParams.toString()}`)
}

/**
 * 獲取語義二元組合
 * @param {Object} params
 * @param {number} params.min_frequency - 最小出現次數（默認5）
 * @param {number} params.limit - 返回前N個（默認100，範圍1-1000）
 * @returns {Promise<Array>} [{ bigram: string, count: number, categories: [] }, ...]
 */
export async function getSemanticBigrams(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.min_frequency) queryParams.append('min_frequency', params.min_frequency)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.detail) queryParams.append('detail', 'true')

  return api(`/api/villages/semantic/composition/bigrams?${queryParams.toString()}`)
}
