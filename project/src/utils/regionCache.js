/**
 * Region 数据缓存管理
 * 使用 sessionStorage 缓存区域列表数据，避免重复请求
 */

const CACHE_PREFIX = 'regions_'
const CACHE_VERSION = 'v1' // 版本号，用于缓存失效

/**
 * 生成缓存 key
 * @param {string} level - 区域级别
 * @param {string|null} parent - 父级名称
 * @returns {string} 缓存 key
 */
export function getCacheKey(level, parent = null) {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${level}_${parent || 'null'}`
}

/**
 * 从缓存获取区域数据
 * @param {string} level - 区域级别
 * @param {string|null} parent - 父级名称
 * @returns {Array|null} 缓存的数据，如果不存在返回 null
 */
export function getRegionCache(level, parent = null) {
  try {
    const key = getCacheKey(level, parent)
    const cached = sessionStorage.getItem(key)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.warn('Failed to read region cache:', e)
  }
  return null
}

/**
 * 设置区域数据缓存
 * @param {string} level - 区域级别
 * @param {string|null} parent - 父级名称
 * @param {Array} data - 要缓存的数据
 * @returns {boolean} 是否成功
 */
export function setRegionCache(level, parent = null, data) {
  try {
    const key = getCacheKey(level, parent)
    sessionStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (e) {
    console.warn('Failed to set region cache:', e)
    return false
  }
}

/**
 * 清除特定的区域缓存
 * @param {string} level - 区域级别
 * @param {string|null} parent - 父级名称
 */
export function clearRegionCache(level, parent = null) {
  try {
    const key = getCacheKey(level, parent)
    sessionStorage.removeItem(key)
  } catch (e) {
    console.warn('Failed to clear region cache:', e)
  }
}

/**
 * 清除所有区域缓存
 */
export function clearAllRegionCache() {
  try {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (e) {
    console.warn('Failed to clear all region cache:', e)
  }
}

/**
 * 获取缓存统计信息
 * @returns {Object} { count: number, size: number }
 */
export function getRegionCacheStats() {
  try {
    const keys = Object.keys(sessionStorage)
    const regionKeys = keys.filter(key => key.startsWith(CACHE_PREFIX))

    let totalSize = 0
    regionKeys.forEach(key => {
      const value = sessionStorage.getItem(key)
      if (value) {
        totalSize += value.length
      }
    })

    return {
      count: regionKeys.length,
      size: totalSize,
      sizeKB: (totalSize / 1024).toFixed(2)
    }
  } catch (e) {
    console.warn('Failed to get cache stats:', e)
    return { count: 0, size: 0, sizeKB: '0' }
  }
}
