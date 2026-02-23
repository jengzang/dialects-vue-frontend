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
 * @returns {Promise<Array>} [{ cluster_id: number, village_count: number, centroid: [lat, lng] }, ...]
 */
export async function getSpatialClusters() {
  return api('/api/villages/spatial/clusters')
}

/**
 * 獲取聚類摘要統計
 * @returns {Promise<Object>} { total_clusters: number, avg_size: number, summary: [] }
 */
export async function getSpatialClustersSummary() {
  return api('/api/villages/spatial/clusters/summary')
}

/**
 * 獲取空間整合數據
 * @param {Object} params
 * @param {string} params.region_level - 區域層級（可選）
 * @param {string} params.region_name - 區域名稱（可選）
 * @returns {Promise<Object>} { villages: [], hotspots: [], clusters: [], tendency: [] }
 */
export async function getSpatialIntegration(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.region_level) queryParams.append('region_level', params.region_level)
  if (params.region_name) queryParams.append('region_name', params.region_name)

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

