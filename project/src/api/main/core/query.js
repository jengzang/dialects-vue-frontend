// api/query/core.js - 核心查询 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/message.js'

/**
 * @typedef {Object} ZhongGuQueryParams
 * @property {string} [initial] - 声母
 * @property {string} [final] - 韵母
 * @property {string} [tone] - 声调
 * @property {string} [char] - 汉字
 */

/**
 * @typedef {Object} YinWeiQueryParams
 * @property {string[]} [features] - 音位特征列表
 * @property {string[]} [locations] - 地点列表
 */

/**
 * @typedef {Object} PhonologyQueryParams
 * @property {string} [initial] - 声母
 * @property {string} [final] - 韵母
 * @property {string} [tone] - 声调
 * @property {string[]} [locations] - 地点列表
 */

/**
 * 中古音查询
 * @param {ZhongGuQueryParams} params - 查询参数
 * @returns {Promise<Array<Object>>} 查询结果
 * @throws {Error} 查询失败
 * @example
 * const results = await searchZhongGu({
 *   initial: '帮',
 *   final: '东',
 *   tone: '平'
 * })
 */
export async function searchZhongGu(params) {
  try {
    return await api('/api/ZhongGu', {
      method: 'POST',
      body: params,
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Search ZhongGu error:', error)
    showError(error.message || '中古音查詢失敗')
    throw new Error(error.message || '中古音查詢失敗')
  }
}

/**
 * 音位查询
 * @param {YinWeiQueryParams} params - 查询参数
 * @returns {Promise<Array<Object>>} 查询结果
 * @throws {Error} 查询失败
 * @example
 * const results = await searchYinWei({
 *   features: ['voiced', 'stop'],
 *   locations: ['广州', '香港']
 * })
 */
export async function searchYinWei(params) {
  try {
    return await api('/api/YinWei', {
      method: 'POST',
      body: params,
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Search YinWei error:', error)
    showError(error.message || '音位查詢失敗')
    throw new Error(error.message || '音位查詢失敗')
  }
}

/**
 * @typedef {Object} SearchCharsParams
 * @property {string[]} [chars] - 字符列表
 * @property {string|string[]} [locations] - 地点
 * @property {string|string[]} [regions] - 区域
 * @property {string} [region_mode] - 区域模式
 */

/**
 * @typedef {Object} SearchTonesParams
 * @property {string|string[]} [locations] - 地点
 * @property {string|string[]} [regions] - 区域
 * @property {string} [region_mode] - 区域模式
 */

/**
 * 字查询
 * @param {SearchCharsParams} params - 查询参数
 * @returns {Promise<Object>} 查询结果
 * @throws {Error} 查询失败
 * @example
 * const results = await searchChars({
 *   chars: ['东', '西'],
 *   locations: '广州',
 *   regions: ['珠三角'],
 *   region_mode: 'yindian'
 * })
 */
const normalizeCompactSearchCharsResponse = (data) => {
  const charMeta = data?.char_meta || {}
  const result = Array.isArray(data?.result) ? data.result : []

  return {
    ...data,
    result: result.map(item => ({
      ...item,
      positions: item.positions ?? charMeta[item.char]?.positions ?? [],
      old_position: item.old_position ?? charMeta[item.char]?.old_position ?? []
    }))
  }
}

export async function searchChars(params) {
  try {
    const query = new URLSearchParams()

    // 处理 chars 参数
    if (params.chars && Array.isArray(params.chars)) {
      params.chars.forEach(char => {
        query.append('chars', char)
      })
    }

    // 处理 locations 参数
    if (params.locations) {
      if (Array.isArray(params.locations)) {
        params.locations.forEach(loc => query.append('locations', loc))
      } else {
        query.append('locations', params.locations)
      }
    }

    // 处理 regions 参数
    if (params.regions) {
      if (Array.isArray(params.regions)) {
        params.regions.forEach(reg => query.append('regions', reg))
      } else {
        query.append('regions', params.regions)
      }
    }

    // 处理 region_mode 参数
    if (params.region_mode) {
      query.append('region_mode', params.region_mode)
    }

    if (params.response_mode) {
      query.append('response_mode', params.response_mode)
    }

    const data = await api(`/api/search_chars/?${query.toString()}`, {
      loginPromptEligible: true
    })

    if (params.response_mode === 'compact') {
      return normalizeCompactSearchCharsResponse(data)
    }

    return data
  } catch (error) {
    console.error('Search chars error:', error)
    showError(error.message || '字查詢失敗')
    throw new Error(error.message || '字查詢失敗')
  }
}

/**
 * 调查询
 * @param {SearchTonesParams} params - 查询参数
 * @returns {Promise<Object>} 查询结果
 * @throws {Error} 查询失败
 * @example
 * const results = await searchTones({
 *   locations: '广州',
 *   regions: ['珠三角'],
 *   region_mode: 'yindian'
 * })
 */
export async function searchTones(params) {
  try {
    const query = new URLSearchParams()

    // 处理 locations 参数
    if (params.locations) {
      if (Array.isArray(params.locations)) {
        params.locations.forEach(loc => query.append('locations', loc))
      } else {
        query.append('locations', params.locations)
      }
    }

    // 处理 regions 参数
    if (params.regions) {
      if (Array.isArray(params.regions)) {
        params.regions.forEach(reg => query.append('regions', reg))
      } else {
        query.append('regions', params.regions)
      }
    }

    // 处理 region_mode 参数
    if (params.region_mode) {
      query.append('region_mode', params.region_mode)
    }

    return await api(`/api/search_tones/?${query.toString()}`, {
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Search tones error:', error)
    showError(error.message || '調查詢失敗')
    throw new Error(error.message || '調查詢失敗')
  }
}

/**
 * 获取字符列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Array<string>>} 字符列表
 * @throws {Error} 查询失败
 * @example
 * const charList = await getCharList({ category: 'common' })
 */
export async function getCharList(params) {
  try {
    return await api('/api/charlist', {
      method: 'POST',
      body: params
    })
  } catch (error) {
    console.error('Get char list error:', error)
    showError(error.message || '獲取字符列表失敗')
    throw new Error(error.message || '獲取字符列表失敗')
  }
}

/**
 * 获取音位特征计数
 * @param {Object} params - 查询参数
 * @property {string[]} [params.features] - 特征列表
 * @property {string[]} [params.locations] - 地点列表
 * @returns {Promise<Object>} 特征计数统计
 * @throws {Error} 查询失败
 * @example
 * const counts = await getFeatureCounts({
 *   features: ['voiced', 'stop'],
 *   locations: ['广州', '香港']
 * })
 */
export async function getFeatureCounts(params) {
  try {
    const query = new URLSearchParams()

    // 每个 location 单独添加为独立的查询参数
    if (params.locations && Array.isArray(params.locations)) {
      params.locations.forEach(loc => {
        query.append('locations', loc)
      })
    }

    return await api(`/api/feature_counts?${query.toString()}`, {
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Get feature counts error:', error)
    showError(error.message || '獲取音位特徵計數失敗')
    throw new Error(error.message || '獲取音位特徵計數失敗')
  }
}

/**
 * 獲取特徵統計資料
 * @param {Object} params - 查詢參數
 * @property {string[]} params.locations - 地點列表
 * @property {string[]} params.chars - 漢字列表
 * @property {string[]} [params.features] - 特徵列表（可選，預設全部）
 * @property {Object} [params.filters] - 過濾條件（可選）
 * @returns {Promise<Object>} 特徵統計結果
 * @throws {Error} 查詢失敗
 * @example
 * const stats = await getFeatureStats({
 *   locations: ['廣州'],
 *   chars: ['東', '西', '南', '北'],
 *   features: ['聲母', '韻母']
 * })
 */
export async function getFeatureStats(params) {
  try {
    return await api('/api/feature_stats', {
      method: 'POST',
      body: params,
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Get feature stats error:', error)
    showError(error.message || '獲取特徵統計失敗')
    throw new Error(error.message || '獲取特徵統計失敗')
  }
}
