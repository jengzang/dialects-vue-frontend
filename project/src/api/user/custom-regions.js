import { api } from '../auth/auth.js'

/**
 * 獲取用戶的所有自定義分區
 * @param {string} regionName - 可選，篩選特定分區
 * @returns {Promise<Object>} { success, regions, total }
 */
export async function getCustomRegions(regionName = null) {
  const url = regionName
    ? `/api/custom_regions?region_name=${encodeURIComponent(regionName)}`
    : '/api/custom_regions'

  return await api(url, {
    method: 'GET'
  })
}

/**
 * 創建或更新自定義分區
 * @param {Object} data - { region_name, locations, description? }
 * @returns {Promise<Object>} { success, action, region }
 */
export async function createOrUpdateCustomRegion(data) {
  return await api('/api/custom_regions', {
    method: 'POST',
    body: data
  })
}

/**
 * 刪除自定義分區
 * @param {string} regionName - 要刪除的分區名稱
 * @returns {Promise<Object>} { success, deleted, region_name }
 */
export async function deleteCustomRegion(regionName) {
  return await api(`/api/custom_regions?region_name=${encodeURIComponent(regionName)}`, {
    method: 'DELETE'
  })
}
