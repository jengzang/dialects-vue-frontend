// api/query/geo.js - 地理数据查询 API
import { api } from '../../auth/httpClient.js'
import { showError, showWarning } from '@/utils/ui/message.js'

/**
 * @typedef {Object} CoordinatesParams
 * @property {string[]} [locations] - 地点列表
 * @property {string} [feature] - 特征字段
 * @property {string} [value] - 特征值
 */

/**
 * @typedef {Object} CoordinateData
 * @property {number} longitude - 经度
 * @property {number} latitude - 纬度
 * @property {string} location - 地点名称
 * @property {any} value - 特征值
 */

/**
 * 获取坐标数据
 * @param {CoordinatesParams} params - 查询参数
 * @returns {Promise<CoordinateData[]>} 坐标数据数组
 * @throws {Error} 查询失败
 * @example
 * const coords = await getCoordinates({
 *   locations: ['广州', '香港'],
 *   feature: 'tone',
 *   value: '平'
 * })
 */
export async function getCoordinates(params) {
  try {
    const rawLocations = params.locations
    const locations = (Array.isArray(rawLocations) ? rawLocations : [rawLocations || ''])
      .flatMap(s => String(s).split(/[\s,]+/))
      .map(s => s.trim())
      .filter(Boolean)

    if (locations.length > 1000) {
      showWarning(`地點數量（${locations.length}）超過 1000 個上限，請縮小範圍後重試`)
      return null
    }

    const rawRegions = params.regions
    const regions = (Array.isArray(rawRegions) ? rawRegions : [rawRegions || ''])
      .flatMap(s => String(s).split(/[\s,]+/))
      .map(s => s.trim())
      .filter(Boolean)

    const query = new URLSearchParams()
    query.append('locations', locations.join(','))
    query.append('regions', regions.join(','))
    if (params.region_mode) query.append('region_mode', params.region_mode)
    if (params.iscustom) query.append('iscustom', params.iscustom)
    if (params.flag) query.append('flag', params.flag)
    if (params.feature) query.append('feature', params.feature)
    if (params.value) query.append('value', params.value)

    return await api(`/api/get_coordinates?${query.toString()}`)
  } catch (error) {
    console.error('Get coordinates error:', error)
    showError(error.message || '獲取坐標數據失敗')
    throw new Error(error.message || '獲取坐標數據失敗')
  }
}
