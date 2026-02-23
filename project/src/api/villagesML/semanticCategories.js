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
 * @param {string} params.region_name - 區域名稱
 * @returns {Promise<Array>} [{ category: string, z_score: number, frequency: number }, ...]
 */
export async function getSemanticCategoryTendency(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)
  queryParams.append('region_name', params.region_name)

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
 * @param {string} params.region_name - 區域名稱
 * @returns {Promise<Array>} [{ category: string, vtf: number }, ...]
 */
export async function getSemanticVTFRegional(params) {
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', params.region_level)
  queryParams.append('region_name', params.region_name)

  return api(`/api/villages/semantic/category/vtf/regional?${queryParams.toString()}`)
}
