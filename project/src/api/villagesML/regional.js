// api/villagesML/regional.js
// 區域聚合統計相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取城市級聚合統計
 * @param {Object} params
 * @param {string} params.city_name - 城市名稱（可選，不提供則返回所有城市）
 * @returns {Promise<Array>} [{ city: string, village_count: number, semantic_categories: {}, statistics: {} }, ...]
 */
export async function getRegionalAggregatesCity(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.city_name) queryParams.append('city_name', params.city_name)

  return api(`/api/villages/regional/aggregates/city?${queryParams.toString()}`)
}

/**
 * 獲取區縣級聚合統計
 * @param {Object} params
 * @param {string} params.city_name - 城市名稱（可選）
 * @param {string} params.county_name - 區縣名稱（可選）
 * @returns {Promise<Array>} [{ city: string, county: string, village_count: number, semantic_categories: {}, statistics: {} }, ...]
 */
export async function getRegionalAggregatesCounty(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.city_name) queryParams.append('city_name', params.city_name)
  if (params.county_name) queryParams.append('county_name', params.county_name)

  return api(`/api/villages/regional/aggregates/county?${queryParams.toString()}`)
}

/**
 * 獲取鄉鎮級聚合統計
 * @param {Object} params
 * @param {string} params.town_name - 鄉鎮名稱（可選）
 * @param {string} params.county_name - 區縣名稱（可選）
 * @param {number} params.limit - 返回數量限制（可選）
 * @returns {Promise<Array>} [{ city: string, county: string, township: string, village_count: number, semantic_categories: {}, statistics: {} }, ...]
 */
export async function getRegionalAggregatesTown(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.town_name) queryParams.append('town_name', params.town_name)
  if (params.county_name) queryParams.append('county_name', params.county_name)
  if (params.limit) queryParams.append('limit', params.limit)

  return api(`/api/villages/regional/aggregates/town?${queryParams.toString()}`)
}

/**
 * 獲取空間聚合數據
 * @param {Object} params
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'town'
 * @param {string} params.region_name - 區域名稱（可選）
 * @param {number} params.limit - 返回數量限制（可選）
 * @returns {Promise<Array>} [{ region_name: string, geojson: {}, statistics: {} }, ...]
 */
export async function getRegionalSpatialAggregates(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)
  if (params.region_name) queryParams.append('region_name', params.region_name)
  if (params.limit) queryParams.append('limit', params.limit)

  return api(`/api/villages/regional/spatial-aggregates?${queryParams.toString()}`)
}

/**
 * 獲取區域特徵向量（僅元數據）
 * @param {Object} params
 * @param {string} params.region_name - 區域名稱（可選，不提供則返回所有區域）
 * @param {number} params.limit - 返回數量限制（可選）
 * @returns {Promise<Array>} [{ region_name: string, feature_vector: number[], semantic_categories: {} }, ...]
 */
export async function getRegionalVectors(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.region_name) queryParams.append('region_name', params.region_name)
  if (params.limit) queryParams.append('limit', params.limit)

  return api(`/api/villages/regional/vectors?${queryParams.toString()}`)
}
