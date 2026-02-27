/**
 * Region 数据预加载和管理
 * 一次性加载所有区域数据，避免重复请求和错误
 */

import { getRegionList } from '@/api'

const CACHE_KEY = 'regions_all_data_v3'  // 更新版本号，强制重新加载
const CACHE_TIMESTAMP_KEY = 'regions_cache_timestamp_v3'
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
 * 去重函数：根据层级使用不同的唯一键策略
 * @param {Array} regions - 区域数组
 * @param {string} level - 层级 ('city', 'county', 'township')
 * @returns {Array} 去重后的区域数组
 */
function deduplicateRegions(regions, level) {
  if (!regions || regions.length === 0) return []

  const seen = new Map()
  const deduplicated = []
  const duplicates = [] // 记录重复项用于调试

  // 标准化字段值（处理 null、undefined、空字符串）
  const normalize = (value) => {
    if (value === null || value === undefined || value === '') return ''
    return String(value).trim()
  }

  for (const region of regions) {
    // 根据层级构建唯一键
    let uniqueKey
    if (level === 'city') {
      // 城市级别：使用名称作为唯一键
      uniqueKey = normalize(region.name)
    } else if (level === 'county') {
      // 区县级别：使用 "城市-区县" 作为唯一键
      const city = normalize(region.city)
      const name = normalize(region.name)
      uniqueKey = `${city}|${name}`
    } else if (level === 'township') {
      // 乡镇级别：使用 "城市-区县-乡镇" 作为唯一键
      const city = normalize(region.city)
      const county = normalize(region.county)
      const name = normalize(region.name)
      uniqueKey = `${city}|${county}|${name}`
    } else {
      // 未知层级，使用名称
      uniqueKey = normalize(region.name)
    }

    // 如果已存在，保留 village_count 更大的那个（数据更完整）
    if (seen.has(uniqueKey)) {
      const existing = seen.get(uniqueKey)
      const existingCount = existing.village_count || 0
      const currentCount = region.village_count || 0

      // 记录重复项用于调试
      duplicates.push({
        key: uniqueKey,
        existing: { ...existing },
        duplicate: { ...region }
      })

      if (currentCount > existingCount) {
        // 替换为更完整的数据
        const index = deduplicated.findIndex(r => r === existing)
        if (index !== -1) {
          deduplicated[index] = region
          seen.set(uniqueKey, region)
        }
      }
      // 否则跳过当前重复项
    } else {
      // 首次出现，添加到结果
      seen.set(uniqueKey, region)
      deduplicated.push(region)
    }
  }

  // 如果有重复项，输出详细信息（仅输出前5个）
  if (duplicates.length > 0) {
    console.warn(`[${level}] Found ${duplicates.length} duplicate(s):`)
    duplicates.slice(0, 5).forEach((dup, idx) => {
      console.warn(`  ${idx + 1}. Key: "${dup.key}"`)
      console.warn(`     Existing:`, dup.existing)
      console.warn(`     Duplicate:`, dup.duplicate)
    })
    if (duplicates.length > 5) {
      console.warn(`  ... and ${duplicates.length - 5} more`)
    }
  }

  return deduplicated
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

    // 对每个层级的数据进行去重
    const deduplicatedCities = deduplicateRegions(cities, 'city')
    const deduplicatedCounties = deduplicateRegions(counties, 'county')
    const deduplicatedTownships = deduplicateRegions(townships, 'township')

    // 记录去重统计
    const stats = {
      cities: { original: cities?.length || 0, deduplicated: deduplicatedCities.length },
      counties: { original: counties?.length || 0, deduplicated: deduplicatedCounties.length },
      townships: { original: townships?.length || 0, deduplicated: deduplicatedTownships.length }
    }

    // 如果有重复数据，输出警告
    if (stats.cities.original > stats.cities.deduplicated ||
        stats.counties.original > stats.counties.deduplicated ||
        stats.townships.original > stats.townships.deduplicated) {
      console.warn('Region data deduplication stats:', stats)
    }

    return {
      cities: deduplicatedCities,
      counties: deduplicatedCounties,
      townships: deduplicatedTownships,
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
