// api/villagesML/semanticCategories.js
// 語義類別相關 API

import { api } from '../auth/auth.js'

/**
 * 獲取語義類別列表
 * @returns {Promise<Array>} [{ category_id: number, name: string, description: string }, ...]
 */
export async function getSemanticCategoryList() {
  return api('/api/villages/semantic/category/list')
}

/**
 * 獲取語義類別傾向性
 * @param {Object} params
 * @param {string} params.region_level - 區域層級：'city' | 'county' | 'township'
 * @param {string} [params.city] - 城市名稱（精確查詢）
 * @param {string} [params.county] - 區縣名稱（精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（精確查詢）
 * @param {string} [params.region_name] - 區域名稱（模糊查詢，向後兼容）
 * @returns {Promise<Array>} [{ category: string, z_score: number, frequency: number }, ...]
 */
export async function getSemanticCategoryTendency(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)

  // Hierarchical parameters (preferred for precise queries)
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // Legacy parameter (backward compatible)
  if (params.region_name) queryParams.append('region_name', params.region_name)

  return api(`/api/villages/semantic/category/tendency?${queryParams.toString()}`)
}

/**
 * 獲取全局虛擬詞頻（VTF）
 * @param {Object} params
 * @param {number} params.top_k - 返回前K個類別（默認9）
 * @returns {Promise<Array>} [{ category: string, vtf: number }, ...]
 */
export async function getSemanticVTFGlobal(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.top_k) queryParams.append('top_k', params.top_k)

  return api(`/api/villages/semantic/category/vtf/global?${queryParams.toString()}`)
}

/**
 * 獲取區域虛擬詞頻（VTF）
 * @param {Object} params
 * @param {string} params.region_level - 區域層級
 * @param {string} [params.city] - 城市名稱（精確查詢）
 * @param {string} [params.county] - 區縣名稱（精確查詢）
 * @param {string} [params.township] - 鄉鎮名稱（精確查詢）
 * @param {string} [params.region_name] - 區域名稱（模糊查詢，向後兼容）
 * @returns {Promise<Array>} [{ category: string, vtf: number }, ...]
 */
export async function getSemanticVTFRegional(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)

  // Hierarchical parameters (preferred for precise queries)
  if (params.city) queryParams.append('city', params.city)
  if (params.county) queryParams.append('county', params.county)
  if (params.township) queryParams.append('township', params.township)

  // Legacy parameter (backward compatible)
  if (params.region_name) queryParams.append('region_name', params.region_name)

  return api(`/api/villages/semantic/category/vtf/regional?${queryParams.toString()}`)
}
