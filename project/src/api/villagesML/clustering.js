// api/villagesML/clustering.js
// 聚類分析相關 API

import { api } from '../auth/auth.js'

/**
 * 運行聚類分析
 * @param {Object} params
 * @param {string} params.algorithm - 算法：'kmeans' | 'dbscan' | 'gmm'
 * @param {number} params.k - 聚類數量（K-Means/GMM）
 * @param {number} params.eps - DBSCAN eps參數
 * @param {number} params.min_samples - DBSCAN min_samples參數
 * @param {Object} params.features - 特徵選擇：{ semantic: bool, morphology: bool, diversity: bool }
 * @param {Object} params.preprocessing - 預處理：{ standardize: bool, pca: bool, pca_components: number }
 * @returns {Promise<Object>} 聚類結果
 */
export async function runClustering(params) {
  return api('/api/villages/compute/clustering/run', {
    method: 'POST',
    body: params,
    timeout: 60000  // 60秒超時
  })
}

/**
 * K值掃描（運行多個k值的聚類）
 * @param {Object} params
 * @param {number} params.k_min - 最小k值
 * @param {number} params.k_max - 最大k值
 * @param {Object} params.features - 特徵選擇
 * @param {Object} params.preprocessing - 預處理選項
 * @returns {Promise<Object>} { k_values: [], silhouette_scores: [], inertias: [] }
 */
export async function scanClustering(params) {
  return api('/api/villages/compute/clustering/scan', {
    method: 'POST',
    body: params,
    timeout: 120000  // 120秒超時
  })
}

/**
 * 獲取聚類任務狀態
 * @param {string} taskId - 任務ID
 * @returns {Promise<Object>} { status: string, progress: number, result: Object }
 */
export async function getClusteringStatus(taskId) {
  return api(`/api/villages/compute/clustering/status/${taskId}`)
}

/**
 * 獲取聚類緩存統計
 * @returns {Promise<Object>} { cache_size: number, cache_count: number, hit_rate: number }
 */
export async function getClusteringCacheStats() {
  return api('/api/villages/compute/clustering/cache-stats')
}

/**
 * 清除聚類緩存
 * @returns {Promise<Object>} { success: boolean, message: string }
 */
export async function clearClusteringCache() {
  return api('/api/villages/compute/clustering/cache', {
    method: 'DELETE'
  })
}

