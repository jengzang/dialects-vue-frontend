// utils/geoTransform.js
// 區域坐標轉換工具 - 將區域語言學數據轉換為 GeoJSON

import { searchVillages } from '@/api'

/**
 * 計算村莊質心坐標
 * @param {Array} villages - 村莊數組 [{ lat, lon }, ...]
 * @returns {Object|null} { lat, lon } 或 null（如果沒有村莊）
 */
export function calculateCentroid(villages) {
  if (!villages || villages.length === 0) return null

  const sum = villages.reduce((acc, v) => ({
    lat: acc.lat + (v.lat || 0),
    lon: acc.lon + (v.lon || 0)
  }), { lat: 0, lon: 0 })

  return {
    lat: sum.lat / villages.length,
    lon: sum.lon / villages.length
  }
}

/**
 * 獲取區域坐標（帶 localStorage 緩存）
 * @param {string} city - 城市名稱
 * @param {string} county - 區縣名稱
 * @param {string} township - 鄉鎮名稱
 * @param {string} level - 區域層級：'city' | 'county' | 'township'
 * @returns {Promise<Object|null>} { lat, lon } 或 null
 */
export async function getRegionCoordinates(city, county, township, level) {
  // 生成緩存鍵
  const cacheKey = `centroid_${level}_${city || ''}_${county || ''}_${township || ''}`

  // 檢查緩存
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.warn('Failed to read from localStorage:', e)
  }

  // 構建查詢參數
  const params = { page_size: 100 }
  if (city) params.city = city
  if (county) params.county = county
  if (township) params.township = township

  try {
    // 獲取該區域的村莊
    const result = await searchVillages(params)

    if (!result.villages || result.villages.length === 0) {
      return null
    }

    // 計算質心
    const centroid = calculateCentroid(result.villages)

    // 緩存結果
    try {
      localStorage.setItem(cacheKey, JSON.stringify(centroid))
    } catch (e) {
      console.warn('Failed to write to localStorage:', e)
    }

    return centroid
  } catch (error) {
    console.error('Failed to get region coordinates:', error)
    return null
  }
}

/**
 * 轉換區域數據為 GeoJSON
 * @param {Array} regionalData - 區域數據數組
 * @param {string} level - 區域層級：'city' | 'county' | 'township'
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function transformRegionalDataToGeoJSON(regionalData, level) {
  if (!regionalData || regionalData.length === 0) {
    return {
      type: 'FeatureCollection',
      features: []
    }
  }

  const features = []

  // 並行獲取坐標（限制並發數以避免過載）
  const batchSize = 10
  for (let i = 0; i < regionalData.length; i += batchSize) {
    const batch = regionalData.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async (item) => {
        const coords = await getRegionCoordinates(
          item.city,
          item.county,
          item.township,
          level
        )

        if (coords) {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [coords.lon, coords.lat]
            },
            properties: { ...item }
          }
        }
        return null
      })
    )

    // 過濾掉 null 值
    features.push(...results.filter(f => f !== null))
  }

  return {
    type: 'FeatureCollection',
    features
  }
}

/**
 * 清除坐標緩存
 * @param {string} level - 可選，只清除特定層級的緩存
 */
export function clearCoordinateCache(level = null) {
  const prefix = level ? `centroid_${level}_` : 'centroid_'

  try {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`Cleared ${keysToRemove.length} coordinate cache entries`)
  } catch (e) {
    console.warn('Failed to clear coordinate cache:', e)
  }
}
