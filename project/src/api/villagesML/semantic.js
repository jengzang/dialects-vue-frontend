// api/villagesML/semantic.js
// 語義網絡分析相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取字共現矩陣
 * @param {Object} params
 * @param {number} params.min_cooccurrence - 最小共現次數（默認5）
 * @param {number} params.alpha - 顯著性水平（默認0.05）
 * @returns {Promise<Object>} { matrix: [], chars: [] }
 */
export async function getCooccurrence(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.min_cooccurrence) queryParams.append('min_cooccurrence', params.min_cooccurrence)
  if (params.alpha) queryParams.append('alpha', params.alpha)

  return api(`/api/villages/compute/semantic/cooccurrence?${queryParams.toString()}`, {
    timeout: 60000  // 60秒超時
  })
}

/**
 * 獲取語義網絡數據
 * @param {Object} params
 * @param {number} params.min_cooccurrence - 最小共現次數
 * @param {number} params.alpha - 顯著性水平
 * @param {number} params.top_k - 返回前K個節點（默認50）
 * @returns {Promise<Object>} { nodes: [], edges: [], communities: [] }
 */
export async function getSemanticNetwork(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.min_cooccurrence) queryParams.append('min_cooccurrence', params.min_cooccurrence)
  if (params.alpha) queryParams.append('alpha', params.alpha)
  if (params.top_k) queryParams.append('top_k', params.top_k)

  return api(`/api/villages/compute/semantic/network?${queryParams.toString()}`, {
    timeout: 60000  // 60秒超時
  })
}

/**
 * 獲取網絡分析任務狀態
 * @param {string} taskId - 任務ID
 * @returns {Promise<Object>} { status: string, progress: number, result: Object }
 */
export async function getSemanticNetworkStatus(taskId) {
  return api(`/api/villages/compute/semantic/network/status/${taskId}`)
}
