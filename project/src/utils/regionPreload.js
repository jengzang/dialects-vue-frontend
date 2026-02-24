/**
 * Region 数据预加载和管理
 * 一次性加载所有区域数据，避免重复请求和错误
 */

import { getRegionList } from '@/api'

const CACHE_KEY = 'regions_all_data_v1'
const CACHE_TIMESTAMP_KEY = 'regions_cache_timestamp'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

let allRegionsData = null
let loadingPromise = null

/**
 * 预加载所有区域数据
 * @returns {Promise<Object>} { cities, counties, townships }
 */
export async function preloadAllRegions() {
  // 如果已经在加载中，返回同一个 Promise
  if (loadingPromise) {
    return loadingPromise
  }

  // 如果已经加载过，直接返回
  if (allRegionsData) {
    return allRegionsData
  }

  // 尝试从缓存读取
  const cached = getFromCache()
  if (cached) {
    allRegionsData = cached
    return cached
  }

  // 开始加载
  loadingPromise = loadAllRegionsFromAPI()

  try {
    allRegionsData = await loadingPromise
    saveToCache(allRegionsData)
    return allRegionsData
  } finally {
    loadingPromise = null
  }
}

/**
 * 从 API 加载所有区域数据
 */
async function loadAllRegionsFromAPI() {
  try {
    // 并行请求所有层级的数据
    const [cities, counties, townships] = await Promise.all([
      getRegionList('city', null),
      getRegionList('county', null),
      getRegionList('township', null)
    ])

    return {
      cities: cities || [],
      counties: counties || [],
      townships: townships || [],
      timestamp: Date.now()
    }
  } catch (error) {
    console.error('Failed to load all regions:', error)
    throw error
  }
}

/**
 * 从缓存读取
 */
function getFromCache() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    const timestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY)

    if (!cached || !timestamp) return null

    // 检查是否过期
    const age = Date.now() - parseInt(timestamp)
    if (age > CACHE_EXPIRY) {
      clearCache()
      return null
    }

    return JSON.parse(cached)
  } catch (e) {
    console.warn('Failed to read cache:', e)
    return null
  }
}

/**
 * 保存到缓存
 */
function saveToCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
    sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (e) {
    console.warn('Failed to save cache:', e)
  }
}

/**
 * 清除缓存
 */
export function clearCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
    sessionStorage.removeItem(CACHE_TIMESTAMP_KEY)
    allRegionsData = null
  } catch (e) {
    console.warn('Failed to clear cache:', e)
  }
}

/**
 * 获取城市列表
 */
export async function getCities() {
  const data = await preloadAllRegions()
  return data.cities
}

/**
 * 获取区县列表（可选过滤城市）
 * @param {string|null} city - 城市名称，null 返回所有区县
 */
export async function getCounties(city = null) {
  const data = await preloadAllRegions()
  if (!city) return data.counties

  return data.counties.filter(c => c.city === city)
}

/**
 * 获取乡镇列表（可选过滤区县或城市）
 * @param {string|null} county - 区县名称
 * @param {string|null} city - 城市名称（当区县为空时使用）
 */
export async function getTownships(county = null, city = null) {
  const data = await preloadAllRegions()

  if (county) {
    // 按区县过滤
    return data.townships.filter(t => t.county === county)
  } else if (city) {
    // 按城市过滤（用于无区县的城市）
    return data.townships.filter(t => t.city === city && !t.county)
  }

  return data.townships
}

/**
 * 检查城市是否有区县
 * @param {string} city - 城市名称
 * @returns {Promise<boolean>}
 */
export async function cityHasCounties(city) {
  const counties = await getCounties(city)
  return counties.length > 0
}

/**
 * 获取缓存统计
 */
export function getCacheStats() {
  if (!allRegionsData) return null

  return {
    cities: allRegionsData.cities.length,
    counties: allRegionsData.counties.length,
    townships: allRegionsData.townships.length,
    total: allRegionsData.cities.length + allRegionsData.counties.length + allRegionsData.townships.length,
    timestamp: allRegionsData.timestamp,
    age: Date.now() - allRegionsData.timestamp
  }
}
