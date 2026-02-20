import { api } from '../auth/auth.js'

// Cache configuration
const CACHE_KEY = '__CUSTOM_REGIONS_CACHE__'

/**
 * Get cached custom regions from sessionStorage
 * @returns {Array|null} Cached regions array or null if not found
 */
function getCachedRegions() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const data = JSON.parse(cached)
    return data.regions || null
  } catch (e) {
    console.warn('Failed to read custom regions cache:', e)
    return null
  }
}

/**
 * Save custom regions to sessionStorage cache
 * @param {Array} regions - Regions array to cache
 */
function setCachedRegions(regions) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      regions
    }))
  } catch (e) {
    console.warn('Failed to cache custom regions:', e)
  }
}

/**
 * Clear custom regions cache (call after create/update/delete)
 */
export function clearCustomRegionsCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch (e) {
    console.warn('Failed to clear custom regions cache:', e)
  }
}

/**
 * 獲取用戶的所有自定義分區 (with caching)
 * @param {string} regionName - 可選，篩選特定分區
 * @returns {Promise<Object>} { success, regions, total }
 */
export async function getCustomRegions(regionName = null) {
  // If requesting specific region, bypass cache
  if (regionName) {
    const url = `/api/custom_regions?region_name=${encodeURIComponent(regionName)}`
    return await api(url, { method: 'GET' })
  }

  // Check cache first for list requests
  const cached = getCachedRegions()
  if (cached) {
    return { success: true, regions: cached, total: cached.length }
  }

  // Fetch from API
  const url = '/api/custom_regions'
  const result = await api(url, { method: 'GET' })

  // Cache the result if successful
  if (result.success && result.regions) {
    setCachedRegions(result.regions)
  }

  return result
}

/**
 * 創建或更新自定義分區
 * @param {Object} data - { region_name, locations, description? }
 * @returns {Promise<Object>} { success, action, region }
 */
export async function createOrUpdateCustomRegion(data) {
  const result = await api('/api/custom_regions', {
    method: 'POST',
    body: data
  })

  // Clear cache after successful mutation
  if (result.success) {
    clearCustomRegionsCache()
  }

  return result
}

/**
 * 刪除自定義分區
 * @param {string} regionName - 要刪除的分區名稱
 * @returns {Promise<Object>} { success, deleted, region_name }
 */
export async function deleteCustomRegion(regionName) {
  const result = await api(`/api/custom_regions?region_name=${encodeURIComponent(regionName)}`, {
    method: 'DELETE'
  })

  // Clear cache after successful mutation
  if (result.success) {
    clearCustomRegionsCache()
  }

  return result
}
