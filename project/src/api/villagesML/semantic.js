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
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @param {string} [params.region_name] - 區域名稱（可選）
 * @param {string} [params.city] - 城市名稱（精確查詢）
 * @param {string} [params.county] - 區縣名稱（精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（精確查詢）
 * @param {number} [params.min_edge_weight] - 最小邊權重（默認0.5，範圍[0, 10]）
 * @param {string[]} [params.centrality_metrics] - 中心性指標：['degree', 'betweenness', 'closeness', 'eigenvector']
 * @returns {Promise<Object>} { nodes: [], edges: [], communities: [] }
 */
export async function getSemanticNetwork(params = {}) {
  return api('/api/villages/compute/semantic/network', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      region_level: params.region_level,
      region_name: params.region_name,
      city: params.city,
      county: params.county,
      township: params.township,
      min_edge_weight: params.min_edge_weight || 0.5,
      centrality_metrics: params.centrality_metrics || ['degree', 'betweenness']
    }),
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
