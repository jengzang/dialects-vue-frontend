// api/villagesML/semanticComposition.js
// 語義組合分析相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取語義三元組合
 * @param {Object} params
 * @param {number} params.min_frequency - 最小出現次數（默認3）
 * @param {number} params.top_k - 返回前K個（默認50）
 * @returns {Promise<Array>} [{ trigram: string, count: number, categories: [] }, ...]
 */
export async function getSemanticTrigrams(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.min_frequency) queryParams.append('min_frequency', params.min_frequency)
  if (params.top_k) queryParams.append('top_k', params.top_k)

  return api(`/api/villages/semantic/composition/trigrams?${queryParams.toString()}`)
}

/**
 * 獲取PMI（點互信息）分數
 * @param {Object} params
 * @param {number} params.min_pmi - 最小PMI值（默認0）
 * @param {number} params.top_k - 返回前K個（默認50）
 * @returns {Promise<Array>} [{ pair: string, pmi: number, count: number }, ...]
 */
export async function getSemanticPMI(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.min_pmi) queryParams.append('min_pmi', params.min_pmi)
  if (params.top_k) queryParams.append('top_k', params.top_k)

  return api(`/api/villages/semantic/composition/pmi?${queryParams.toString()}`)
}

/**
 * 獲取語義指數
 * @returns {Promise<Object>} {
 *   diversity_index: number,
 *   entropy: number,
 *   concentration: number
 * }
 */
export async function getSemanticIndices() {
  return api('/api/villages/semantic/indices')
}
