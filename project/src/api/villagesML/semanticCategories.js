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

// ========== 子類別 API (Phase 17) ==========

/**
 * 獲取語義子類別列表
 * @param {Object} [params]
 * @param {string} [params.parent_category] - 父類別名稱（如 'mountain', 'water'）
 * @returns {Promise<Array>} [{ subcategory: string, parent_category: string, char_count: number, chars: [] }, ...]
 */
export async function getSemanticSubcategoryList(params = {}) {
  const { parent_category } = params
  const queryParams = parent_category
    ? new URLSearchParams({ parent_category })
    : ''
  return api(`/api/villages/semantic/subcategory/list${queryParams ? '?' + queryParams : ''}`)
}

/**
 * 獲取子類別的字符列表
 * @param {string} subcategory - 子類別名稱（如 'mountain_peak'）
 * @returns {Promise<Object>} { subcategory: string, parent_category: string, characters: [] }
 */
export async function getSemanticSubcategoryChars(subcategory) {
  return api(`/api/villages/semantic/subcategory/chars/${encodeURIComponent(subcategory)}`)
}

/**
 * 獲取全局子類別虛擬詞頻（VTF）
 * @param {Object} [params]
 * @param {string} [params.parent_category] - 父類別名稱
 * @param {string} [params.subcategory] - 子類別名稱
 * @param {number} [params.limit=100] - 返回記錄數
 * @returns {Promise<Array>} [{ subcategory: string, parent_category: string, vtf: number, percentage: number }, ...]
 */
export async function getSemanticSubcategoryVTFGlobal(params = {}) {
  const { parent_category, subcategory, limit = 100 } = params
  const queryParams = new URLSearchParams()
  if (parent_category) queryParams.append('parent_category', parent_category)
  if (subcategory) queryParams.append('subcategory', subcategory)
  queryParams.append('limit', limit.toString())
  return api(`/api/villages/semantic/subcategory/vtf/global?${queryParams}`)
}

/**
 * 獲取區域子類別虛擬詞頻（VTF）
 * @param {Object} [params]
 * @param {string} [params.region_level='市級'] - 區域層級
 * @param {string} [params.region_name] - 區域名稱
 * @param {string} [params.parent_category] - 父類別名稱
 * @param {string} [params.subcategory] - 子類別名稱
 * @param {number} [params.min_tendency] - 最小傾向值
 * @param {number} [params.limit=100] - 返回記錄數
 * @returns {Promise<Array>} [{ region_name: string, subcategory: string, vtf: number, tendency_z: number }, ...]
 */
export async function getSemanticSubcategoryVTFRegional(params = {}) {
  const { region_level = '市級', region_name, parent_category, subcategory, min_tendency, limit = 100 } = params
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', region_level)
  if (region_name) queryParams.append('region_name', region_name)
  if (parent_category) queryParams.append('parent_category', parent_category)
  if (subcategory) queryParams.append('subcategory', subcategory)
  if (min_tendency !== undefined) queryParams.append('min_tendency', min_tendency.toString())
  queryParams.append('limit', limit.toString())
  return api(`/api/villages/semantic/subcategory/vtf/regional?${queryParams}`)
}

/**
 * 獲取子類別傾向值排行榜
 * @param {Object} [params]
 * @param {string} [params.region_level='市級'] - 區域層級
 * @param {string} [params.parent_category] - 父類別名稱
 * @param {number} [params.top_n=10] - 返回前N個
 * @returns {Promise<Array>} [{ region_name: string, subcategory: string, tendency_z: number, vtf: number, percentage: number }, ...]
 */
export async function getSemanticSubcategoryTendencyTop(params = {}) {
  const { region_level = '市級', parent_category, top_n = 10 } = params
  const queryParams = new URLSearchParams()
  queryParams.append('region_level', region_level)
  if (parent_category) queryParams.append('parent_category', parent_category)
  queryParams.append('top_n', top_n.toString())
  return api(`/api/villages/semantic/subcategory/tendency/top?${queryParams}`)
}

/**
 * 獲取區域子類別對比分析
 * @param {Object} params
 * @param {string} params.region_name - 區域名稱
 * @param {string} [params.region_level='市級'] - 區域層級
 * @param {string} params.parent_category - 父類別名稱
 * @returns {Promise<Object>} { region_name: string, parent_category: string, subcategories: [{ subcategory: string, vtf: number, tendency_z: number, percentage: number }, ...] }
 */
export async function getSemanticSubcategoryComparison(params) {
  const { region_name, region_level = '市級', parent_category } = params
  const queryParams = new URLSearchParams({
    region_name,
    region_level,
    parent_category
  })
  return api(`/api/villages/semantic/subcategory/comparison?${queryParams}`)
}
