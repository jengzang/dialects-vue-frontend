// api/villagesML/regionSimilarity.js
// 區域相似度分析相關 API (Phase 15)

import { api } from '../auth/auth.js'

const BASE_URL = '/api/villages/regions'

/**
 * 查找相似區域
 * @param {Object} params
 * @param {string} params.region_level - 區域級別：'city' | 'county' | 'township'（必需）
 * @param {string} [params.city] - 市級名稱（精確匹配，推薦）
 * @param {string} [params.county] - 縣級名稱（精確匹配，推薦）
 * @param {string} [params.township] - 鎮級名稱（精確匹配，推薦）
 * @param {string} [params.region_name] - 區域名稱（向後兼容，不推薦，可能有重名）
 * @param {number} [params.top_k=10] - 返回前K個相似區域
 * @param {string} [params.metric='cosine'] - 相似度指標：'cosine' | 'jaccard'
 * @param {number} [params.min_similarity=0.0] - 最小相似度閾值（0-1）
 * @returns {Promise<Object>} { similar_regions: [{ region: string, similarity: number, common_chars: [], distinctive_chars: [] }] }
 */
export async function getRegionSimilaritySearch(params) {
  const {
    region_level,
    city,
    county,
    township,
    region_name,
    top_k = 10,
    metric = 'cosine',
    min_similarity = 0.0
  } = params

  const queryParams = new URLSearchParams({
    region_level,
    top_k: top_k.toString(),
    metric,
    min_similarity: min_similarity.toString()
  })

  // 添加層級過濾參數（推薦）
  if (city) queryParams.append('city', city)
  if (county) queryParams.append('county', county)
  if (township) queryParams.append('township', township)

  // 向後兼容（不推薦）
  if (region_name) queryParams.append('region_name', region_name)

  return await api(`${BASE_URL}/similarity/search?${queryParams}`)
}

/**
 * 比較兩個區域的相似度
 * @param {Object} params
 * @param {string} params.region_level - 區域級別：'city' | 'county' | 'township'（必需）
 * @param {string} [params.city1] - 區域1的市級名稱
 * @param {string} [params.county1] - 區域1的縣級名稱
 * @param {string} [params.township1] - 區域1的鎮級名稱
 * @param {string} [params.city2] - 區域2的市級名稱
 * @param {string} [params.county2] - 區域2的縣級名稱
 * @param {string} [params.township2] - 區域2的鎮級名稱
 * @param {string} [params.region1] - 區域1名稱（向後兼容）
 * @param {string} [params.region2] - 區域2名稱（向後兼容）
 * @returns {Promise<Object>} { region1: string, region2: string, cosine_similarity: number, jaccard_similarity: number, common_chars: [], distinctive_chars_r1: [], distinctive_chars_r2: [], euclidean_distance: number, feature_dimension: number }
 */
export async function getRegionSimilarityPair(params) {
  const {
    region_level,
    city1, county1, township1,
    city2, county2, township2,
    region1, region2
  } = params

  const queryParams = new URLSearchParams()

  if (region_level) queryParams.append('region_level', region_level)

  // 區域1層級參數
  if (city1) queryParams.append('city1', city1)
  if (county1) queryParams.append('county1', county1)
  if (township1) queryParams.append('township1', township1)

  // 區域2層級參數
  if (city2) queryParams.append('city2', city2)
  if (county2) queryParams.append('county2', county2)
  if (township2) queryParams.append('township2', township2)

  // 向後兼容
  if (region1) queryParams.append('region1', region1)
  if (region2) queryParams.append('region2', region2)

  return await api(`${BASE_URL}/similarity/pair?${queryParams}`)
}

/**
 * 獲取相似度矩陣
 * @param {Object} params
 * @param {string} params.region_level - 區域級別：'city' | 'county' | 'township'（必需）
 * @param {Array<{city?, county?, township?}>} params.regions - 區域列表（層級對象數組）
 * @param {string[]} [params.region_names] - 區域名稱列表（向後兼容，不推薦）
 * @param {string} [params.metric='cosine'] - 相似度指標：'cosine' | 'jaccard'
 * @returns {Promise<Object>} { regions: [], matrix: [[]], metric: string }
 */
export async function getRegionSimilarityMatrix(params) {
  const { region_level, regions, region_names, metric = 'cosine' } = params

  const queryParams = new URLSearchParams({
    region_level,
    metric
  })

  // 新格式：傳遞層級信息（推薦）
  if (regions && Array.isArray(regions)) {
    queryParams.append('regions', JSON.stringify(regions))
  }
  // 向後兼容：傳遞區域名稱
  else if (region_names) {
    queryParams.append('regions', Array.isArray(region_names) ? region_names.join(',') : region_names)
  }

  return await api(`${BASE_URL}/similarity/matrix?${queryParams}`)
}
