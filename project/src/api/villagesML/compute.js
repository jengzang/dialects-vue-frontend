// api/villagesML/compute.js
// 計算模塊相關 API（需要登錄）

import { villagesMLApi } from './request.js'

/**
 * 特徵提取
 * @param {Object} params
 * @param {Array<{name: string, city: string, county?: string}>} params.villages - 村莊對象數組
 * @param {Object} params.features - 特徵選擇
 * @param {boolean} params.features.semantic_tags - 是否提取語義標籤特徵
 * @param {boolean} params.features.morphology - 是否提取形態學特徵
 * @param {boolean} params.features.clustering - 是否提取聚類特徵
 * @returns {Promise<Object>} { extraction_id, matched_villages, execution_time_ms, results, from_cache }
 */
export async function extractFeatures(params) {
  return villagesMLApi('/compute/features/extract', {
    method: 'POST',
    body: params,
    timeout: 60000
  })
}

/**
 * 特徵聚合（區域對比）- 統計增強版
 * 返回 semantic_profile、z_scores、suffixes、distinctive_suffixes、
 * distinctive_chars、diversity、structure_profile、cluster_distribution。
 *
 * @param {Object} params
 * @param {string} params.region_level - 區域級別："city" | "county" | "township"
 * @param {Array<string>} params.region_names - 區域名稱列表，最多 50 個
 * @param {Object} [params.features] - 特徵開關，全部默認 true
 * @param {boolean} [params.features.semantic_distribution] - 語義分布（semantic_profile + z_scores）
 * @param {boolean} [params.features.morphology_freq] - 形態頻率（suffixes + distinctive_suffixes）
 * @param {boolean} [params.features.cluster_distribution] - 空間聚類分布
 * @param {boolean} [params.features.distinctive_chars] - 獨特字符（lift + z_score）
 * @param {boolean} [params.features.diversity_metrics] - 多樣性指標（熵值）
 * @param {boolean} [params.features.structure_profile] - 結構畫像（修飾/中心/聚落佔比）
 * @param {number} [params.top_n=10] - 返回前 N 個後綴/字符
 * @returns {Promise<Object>} { results: Array<{region, semantic_profile, z_scores, suffixes, distinctive_suffixes, distinctive_chars, diversity, structure_profile, cluster_distribution}>, execution_time_ms, from_cache }
 */
export async function aggregateFeatures(params) {
  return villagesMLApi('/compute/features/aggregate', {
    method: 'POST',
    body: params,
    timeout: 60000
  })
}

/**
 * 子集聚類
 * @param {Object} params
 * @param {Object} params.filter - 篩選條件
 * @param {Array<string>} params.filter.cities - 城市列表
 * @param {Array<string>} params.filter.counties - 區縣列表
 * @param {Array<string>} params.filter.semantic_tags - 語義標籤列表
 * @param {string} params.filter.name_pattern - 名稱模式
 * @param {number} params.filter.sample_size - 樣本大小
 * @param {Object} params.clustering - 聚類配置
 * @param {string} params.clustering.algorithm - 算法："kmeans" | "hierarchical" | "dbscan"
 * @param {number} params.clustering.k - 聚類數量（K-Means）
 * @param {Array<string>} params.clustering.features - 特徵列表：["semantic", "morphology"]
 * @param {number} params.clustering.random_state - 隨機種子
 * @returns {Promise<Object>} { subset_id, matched_villages, sampled_villages, clusters, metrics, from_cache }
 */
export async function clusterSubset(params) {
  return villagesMLApi('/compute/subset/cluster', {
    method: 'POST',
    body: params,
    timeout: 120000
  })
}

/**
 * 子集比較
 * @param {Object} params
 * @param {Object} params.group_a - 子集A
 * @param {string} params.group_a.label - 子集A標籤
 * @param {Array<number>} params.group_a.village_ids - 子集A村莊ID列表（推薦）
 * @param {Object} [params.group_a.filter] - 子集A篩選條件（向後兼容）
 * @param {Object} params.group_b - 子集B
 * @param {string} params.group_b.label - 子集B標籤
 * @param {Array<number>} params.group_b.village_ids - 子集B村莊ID列表（推薦）
 * @param {Object} [params.group_b.filter] - 子集B篩選條件（向後兼容）
 * @param {Object} params.analysis - 分析配置
 * @param {boolean} params.analysis.semantic_distribution - 是否比較語義分布
 * @param {boolean} params.analysis.morphology_patterns - 是否比較形態模式
 * @param {string} params.analysis.statistical_test - 統計檢驗方法："chi_square" | "t_test"
 * @returns {Promise<Object>} { comparison_id, group_a_size, group_b_size, semantic_comparison, morphology_comparison, significant_differences, from_cache }
 */
export async function compareSubsets(params) {
  return villagesMLApi('/compute/subset/compare', {
    method: 'POST',
    body: params,
    timeout: 60000
  })
}
