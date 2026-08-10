// api/query/LocationAndRegion.js - 地点查询 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/ui/message.js'

/**
 * @typedef {Object} GetLocationsParams
 * @property {string[]} [locations] - 地点列表
 * @property {string[]} [regions] - 区域列表
 * @property {string} [region_mode] - 区域模式
 */

/**
 * @typedef {Object} LocationResult
 * @property {string[]} locations_result - 匹配的地点列表
 */

/**
 * 获取地点列表（支持地点和区域查询）
 * @param {GetLocationsParams} [params={}] - 查询参数
 * @returns {Promise<LocationResult>} 地点查询结果
 * @throws {Error} 查询失败
 * @example
 * const result = await getLocations({
 *   locations: ['广州', '香港'],
 *   regions: ['珠三角'],
 *   region_mode: 'yindian'
 * })
 */
export async function getLocations(params = {}) {
  try {
    const query = new URLSearchParams()

    // 处理 locations 参数（数组形式）
    if (params.locations && Array.isArray(params.locations)) {
      params.locations.forEach(loc => {
        if (loc) query.append('locations', loc)
      })
    }

    // 处理 regions 参数（数组形式）
    if (params.regions && Array.isArray(params.regions)) {
      params.regions.forEach(reg => {
        if (reg) query.append('regions', reg)
      })
    }

    // 处理 region_mode 参数
    if (params.region_mode) {
      query.append('region_mode', params.region_mode)
    }

    return await api(`/api/get_locs/?${query.toString()}`)
  } catch (error) {
    console.error('Get locations error:', error)
    showError(error.message || '獲取地點列表失敗')
    throw new Error(error.message || '獲取地點列表失敗')
  }
}

export async function getLocationDetail(name) {
  try {
    const query = new URLSearchParams()
    if (name) {
      query.append('name', name)
    }
    return await api(`/api/locations/detail?${query.toString()}`)
  } catch (error) {
    console.error('Get location detail error:', error)
    showError(error.message || 'Failed to fetch location detail')
    throw new Error(error.message || 'Failed to fetch location detail')
  }
}

export async function getLocationPartitions() {
  try {
    return await api('/api/locations/partitions')
  } catch (error) {
    console.error('Get location partitions error:', error)
    showError(error.message || 'Failed to fetch partition data')
    throw new Error(error.message || 'Failed to fetch partition data')
  }
}

/**
 * 获取地点坐标点（地图打点、Voronoi 图）
 * @returns {Promise<Object>} { data: [...] }，每行含 簡稱、經緯度、地圖集二分區、音典分區，方言島時含 方言島: 1
 */
export async function getLocationPoints() {
  try {
    return await api('/api/locations/points')
  } catch (error) {
    console.error('Get location points error:', error)
    showError(error.message || 'Failed to fetch location points')
    throw new Error(error.message || 'Failed to fetch location points')
  }
}

/**
 * 批量匹配地点
 * @param {string} inputString - 输入字符串（多个地点用逗号或空格分隔）
 * @param {boolean} [filterValidAbbrs=false] - 是否只过滤有效简称
 * @returns {Promise<Array<Object>>} 匹配结果
 * @throws {Error} 匹配失败
 * @example
 * const matches = await batchMatch('广州,香港,深圳', false)
 */
export async function batchMatch(inputString, filterValidAbbrs = false) {
  try {
    const params = new URLSearchParams({
      input_string: inputString,
      filter_valid_abbrs_only: filterValidAbbrs.toString()
    })

    return await api(`/api/batch_match?${params.toString()}`)
  } catch (error) {
    console.error('Batch match error:', error)
    showError(error.message || '批量匹配失敗')
    throw new Error(error.message || '批量匹配失敗')
  }
}

/**
 * 获取分区树（地区分区结构）
 * @returns {Promise<Array<Object>>} 分区树节点
 * @throws {Error} 获取失败
 * @example
 * const partitions = await getPartitions()
 * // Returns: [{ id: '1', name: '华南', children: [...] }, ...]
 */
export async function getPartitions() {
  try {
    return await api('/api/partitions')
  } catch (error) {
    console.error('Get partitions error:', error)
    showError(error.message || '獲取分區樹失敗')
    throw new Error(error.message || '獲取分區樹失敗')
  }
}

/**
 * 获取区域信息
 * @param {string} inputData - 输入数据（地点名称或ID）
 * @returns {Promise<Object>} 区域信息
 * @throws {Error} 查询失败
 * @example
 * const region = await getRegions('广州')
 */
export async function getRegions(inputData) {
  try {
    return await api(`/api/get_regions?input_data=${encodeURIComponent(inputData)}`)
  } catch (error) {
    console.error('Get regions error:', error)
    showError(error.message || '獲取區域信息失敗')
    throw new Error(error.message || '獲取區域信息失敗')
  }
}
