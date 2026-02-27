// api/villagesML/clusteringTypes.js
// VillagesML 聚類類型 API

import { api } from '../auth/auth.js'

/**
 * 字符傾向性聚類
 * 基於字符使用傾向性的區域聚類
 *
 * @param {Object} params - 聚類參數
 * @param {string} params.algorithm - 聚類算法 ('kmeans', 'dbscan', 'gmm')
 * @param {number} params.k - 聚類數量（kmeans/gmm）
 * @param {string} params.region_level - 區域級別 ('city', 'county', 'township')
 * @param {string|null} params.region_filter - 區域過濾（可選）
 * @param {number} params.top_n_chars - 使用的 top N 字符數量
 * @param {string} params.tendency_metric - 傾向性指標 ('z_score', 'tfidf', 'pmi')
 * @param {Object} params.preprocessing - 預處理參數
 * @param {Object} params.dbscan_config - DBSCAN 參數（可選）
 * @param {number} params.random_state - 隨機種子
 * @returns {Promise<Object>} 聚類結果
 */
export async function runCharacterTendencyClustering(params) {
  return api('/api/villages/compute/clustering/character-tendency', {
    method: 'POST',
    body: params,
    timeout: 60000
  })
}

/**
 * 採樣村莊聚類
 * 對採樣村莊進行聚類分析
 *
 * @param {Object} params - 聚類參數
 * @param {string} params.algorithm - 聚類算法 ('kmeans', 'dbscan', 'gmm')
 * @param {number} params.k - 聚類數量（kmeans/gmm）
 * @param {string} params.sampling_strategy - 採樣策略 ('stratified', 'random', 'systematic')
 * @param {number} params.sample_size - 採樣大小
 * @param {Object} params.filter - 過濾條件（可選）
 * @param {Object} params.features - 特徵配置
 * @param {Object} params.preprocessing - 預處理參數
 * @param {Object} params.dbscan_config - DBSCAN 參數（可選）
 * @param {number} params.random_state - 隨機種子
 * @returns {Promise<Object>} 聚類結果
 */
export async function runSampledVillagesClustering(params) {
  return api('/api/villages/compute/clustering/sampled-villages', {
    method: 'POST',
    body: params,
    timeout: 120000  // 更長超時
  })
}

/**
 * 空間感知聚類
 * 基於空間聚類結果的二次聚類
 *
 * @param {Object} params - 聚類參數
 * @param {string} params.algorithm - 聚類算法 ('kmeans', 'dbscan', 'gmm')
 * @param {number} params.k - 聚類數量（kmeans/gmm）
 * @param {string} params.spatial_run_id - 空間聚類 run_id
 * @param {Object} params.features - 特徵配置
 * @param {Object} params.preprocessing - 預處理參數
 * @param {Object} params.dbscan_config - DBSCAN 參數（可選）
 * @param {number} params.random_state - 隨機種子
 * @returns {Promise<Object>} 聚類結果
 */
export async function runSpatialAwareClustering(params) {
  return api('/api/villages/compute/clustering/spatial-aware', {
    method: 'POST',
    body: params,
    timeout: 60000
  })
}

/**
 * 層次聚類
 * 市-縣-鎮三級層次聚類
 *
 * @param {Object} params - 聚類參數
 * @param {string} params.algorithm - 聚類算法 ('kmeans', 'dbscan', 'gmm')
 * @param {number} params.k_city - 市級聚類數量
 * @param {number} params.k_county - 縣級聚類數量
 * @param {number} params.k_township - 鎮級聚類數量
 * @param {Object} params.features - 特徵配置
 * @param {Object} params.preprocessing - 預處理參數
 * @param {Object} params.dbscan_config - DBSCAN 參數（可選）
 * @param {number} params.random_state - 隨機種子
 * @returns {Promise<Object>} 聚類結果
 */
export async function runHierarchicalClustering(params) {
  return api('/api/villages/compute/clustering/hierarchical', {
    method: 'POST',
    body: params,
    timeout: 180000  // 最長超時
  })
}

/**
 * 獲取可用的空間聚類 run_id
 * 用於空間感知聚類的 run_id 選擇
 *
 * @returns {Promise<Array<string>>} 可用的 run_id 列表
 */
export async function getSpatialRunIds() {
  return api('/api/villages/admin/run-ids')
}
