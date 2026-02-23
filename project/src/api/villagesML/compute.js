// api/villagesML/compute.js
// 計算模塊相關 API（需要登錄）

import { api } from '../auth/auth.js'

/**
 * 提取特徵
 * @param {Object} params
 * @param {number[]} params.village_ids - 村ID列表
 * @param {string[]} params.feature_types - 特徵類型：['semantic', 'morphology', 'diversity']
 * @returns {Promise<Object>} { features: [], feature_names: [] }
 */
export async function extractFeatures(params) {
  return api('/api/villages/compute/features/extract', {
    method: 'POST',
    body: params,
    timeout: 60000
  })
}

/**
 * 聚合特徵
 * @param {Object} params
 * @param {number[]} params.village_ids - 村ID列表
 * @param {string} params.aggregation_method - 聚合方法：'mean' | 'median' | 'sum'
 * @param {string[]} params.feature_types - 特徵類型
 * @returns {Promise<Object>} { aggregated_features: {}, statistics: {} }
 */
export async function aggregateFeatures(params) {
  return api('/api/villages/compute/features/aggregate', {
    method: 'POST',
    body: params,
    timeout: 60000
  })
}

/**
 * 子集聚類
 * @param {Object} params
 * @param {Object} params.filters - 篩選條件：{ keyword: string, city: string, county: string, township: string }
 * @param {string} params.algorithm - 算法：'kmeans' | 'dbscan' | 'gmm'
 * @param {number} params.k - 聚類數量（K-Means/GMM）
 * @param {Object} params.features - 特徵選擇
 * @param {Object} params.preprocessing - 預處理選項
 * @returns {Promise<Object>} 聚類結果
 */
export async function clusterSubset(params) {
  return api('/api/villages/compute/subset/cluster', {
    method: 'POST',
    body: params,
    timeout: 120000
  })
}

/**
 * 子集比較
 * @param {Object} params
 * @param {Object} params.subset_a - 子集A篩選條件
 * @param {Object} params.subset_b - 子集B篩選條件
 * @param {string[]} params.comparison_metrics - 比較指標：['frequency', 'tendency', 'diversity']
 * @returns {Promise<Object>} { comparison: {}, statistics: {}, visualization_data: {} }
 */
export async function compareSubsets(params) {
  return api('/api/villages/compute/subset/compare', {
    method: 'POST',
    body: params,
    timeout: 60000
  })
}
