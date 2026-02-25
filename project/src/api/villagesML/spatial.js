// api/villagesML/spatial.js
// 空間分析相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取空間熱點列表
 * @returns {Promise<Array>} [{ hotspot_id: number, center_lat: number, center_lng: number, radius: number, village_count: number }, ...]
 */
export async function getSpatialHotspots() {
  return api('/api/villages/spatial/hotspots')
}

/**
 * 獲取熱點詳情
 * @param {number} hotspotId - 熱點ID
 * @returns {Promise<Object>} { hotspot_id: number, villages: [], statistics: {} }
 */
export async function getSpatialHotspotDetail(hotspotId) {
  return api(`/api/villages/spatial/hotspots/${hotspotId}`)
}

/**
 * 獲取空間聚類
 * @param {Object} [params]
 * @param {string} [params.run_id] - 分析運行ID，留空使用活躍版本
 * @param {number} [params.limit] - 返回記錄數（0表示返回所有）
 * @returns {Promise<Array>} [{ cluster_id: number, size: number, centroid_lon: number, centroid_lat: number, avg_distance_km: number }, ...]
 */
export async function getSpatialClusters(params = {}) {
  const query = new URLSearchParams()
  if (params.run_id) query.append('run_id', params.run_id)
  if (params.limit !== undefined) query.append('limit', params.limit)
  const qs = query.toString()
  return api(`/api/villages/spatial/clusters${qs ? '?' + qs : ''}`)
}

/**
 * 獲取所有可用的聚類 run_id 及統計信息
 * @returns {Promise<Object>} { active_run_id: string, available_runs: [{ run_id, total_records, unique_clusters, avg_cluster_size, max_cluster_size, noise_count, is_active }] }
 */
export async function getSpatialClustersAvailableRuns() {
  return api('/api/villages/spatial/clusters/available-runs')
}

/**
 * 獲取聚類摘要統計
 * @param {string} [run_id] - 分析運行ID，留空使用活躍版本
 * @returns {Promise<Object>} { run_id, total_records, total_clusters, noise_points, total_villages, cluster_size: { avg, min, max }, spatial_extent: { avg_distance_km, lon_range, lat_range } }
 */
export async function getSpatialClustersSummary(run_id) {
  const qs = run_id ? `?run_id=${run_id}` : ''
  return api(`/api/villages/spatial/clusters/summary${qs}`)
}

/**
 * 獲取空間整合數據（字符-聚類倾向性整合分析）
 * @param {Object} params
 * @param {string} [params.run_id] - 分析運行ID，留空使用活躍版本
 * @param {string} [params.character] - 過濾特定字符
 * @param {number} [params.cluster_id] - 過濾特定聚類ID
 * @param {number} [params.min_cluster_size] - 最小聚類大小（村莊數）
 * @param {number} [params.min_spatial_coherence] - 最小空間一致性（0-1）
 * @param {boolean} [params.is_significant] - 僅顯示統計顯著結果
 * @param {number} [params.limit] - 返回記錄數（默認100，範圍1-1000）
 * @returns {Promise<Array>} [{
 *   id, run_id, character, cluster_id,
 *   cluster_tendency_mean, cluster_tendency_std, cluster_size, n_villages_with_char,
 *   centroid_lon, centroid_lat, avg_distance_km, spatial_coherence,
 *   dominant_city, dominant_county, is_significant, avg_p_value
 * }, ...]
 */
export async function getSpatialIntegration(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.run_id) queryParams.append('run_id', params.run_id)
  if (params.character) queryParams.append('character', params.character)
  if (params.cluster_id !== undefined) queryParams.append('cluster_id', params.cluster_id)
  if (params.min_cluster_size) queryParams.append('min_cluster_size', params.min_cluster_size)
  if (params.min_spatial_coherence !== undefined) queryParams.append('min_spatial_coherence', params.min_spatial_coherence)
  if (params.is_significant !== undefined) queryParams.append('is_significant', params.is_significant)
  if (params.limit) queryParams.append('limit', params.limit)

  return api(`/api/villages/spatial/integration?${queryParams.toString()}`)
}

/**
 * 獲取字符的空間整合數據
 * @param {string} char - 字符
 * @returns {Promise<Object>} { char: string, spatial_distribution: [], hotspots: [], tendency: [] }
 */
export async function getSpatialIntegrationByChar(char) {
  return api(`/api/villages/spatial/integration/by-character/${encodeURIComponent(char)}`)
}

/**
 * 獲取所有可用字符列表及統計信息
 * @param {string} [run_id] - 整合分析運行ID，留空使用活躍版本
 * @returns {Promise<Object>} {
 *   run_id: string,
 *   total_characters: number,
 *   characters: [{
 *     character: string,
 *     category: string,
 *     total_clusters: number,
 *     total_villages: number,
 *     avg_tendency: number,
 *     avg_spatial_coherence: number,
 *     significant_clusters: number
 *   }, ...]
 * }
 */
export async function getSpatialIntegrationAvailableCharacters(run_id) {
  const qs = run_id ? `?run_id=${run_id}` : ''
  return api(`/api/villages/spatial/integration/available-characters${qs}`)
}

/**
 * 獲取聚類列表及其地區信息（整合分析版本）
 * @param {Object} [params]
 * @param {string} [params.run_id] - 整合分析運行ID，留空使用活躍版本
 * @param {number} [params.min_cluster_size] - 最小聚類大小
 * @returns {Promise<Object>} {
 *   run_id: string,
 *   total_clusters: number,
 *   clusters: [{
 *     cluster_id: number,
 *     cluster_size: number,
 *     dominant_city: string,
 *     dominant_county: string,
 *     centroid_lon: number,
 *     centroid_lat: number,
 *     total_characters: number,
 *     avg_tendency: number,
 *     avg_spatial_coherence: number,
 *     significant_characters: number
 *   }, ...]
 * }
 */
export async function getSpatialIntegrationClusterList(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.run_id) queryParams.append('run_id', params.run_id)
  if (params.min_cluster_size) queryParams.append('min_cluster_size', params.min_cluster_size)
  const qs = queryParams.toString()
  return api(`/api/villages/spatial/integration/clusterlist${qs ? '?' + qs : ''}`)
}

/**
 * 獲取聚類的空間整合數據
 * @param {number} clusterId - 聚類ID
 * @returns {Promise<Object>} { cluster_id: number, villages: [], tendency: [], characteristics: {} }
 */
export async function getSpatialIntegrationByCluster(clusterId) {
  return api(`/api/villages/spatial/integration/by-cluster/${clusterId}`)
}

/**
 * 獲取空間整合摘要
 * @returns {Promise<Object>} { total_hotspots: number, total_clusters: number, coverage: number }
 */
export async function getSpatialIntegrationSummary() {
  return api('/api/villages/spatial/integration/summary')
}

