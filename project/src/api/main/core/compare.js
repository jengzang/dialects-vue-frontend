// api/compare/index.js - 比较模块 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/message.js'

/**
 * @typedef {Object} CompareCharsParams
 * @property {string[]} chars - 汉字列表（包含组1和组2的所有汉字）
 * @property {string[]} [features] - 特征列表
 * @property {string[]} [locations] - 地点列表
 * @property {string[]} [regions] - 区域列表
 * @property {string} [region_mode] - 区域模式
 * @property {string[]} group1_chars - 组1汉字列表
 * @property {string[]} group2_chars - 组2汉字列表
 */

/**
 * @typedef {Object} CompareZhongGuParams
 * @property {string[]} path_strings1 - 组1中古音路径字符串列表
 * @property {string|null} column1 - 组1列名
 * @property {boolean} combine_query1 - 组1是否组合查询
 * @property {string[]} [exclude_columns1] - 组1排除列
 * @property {string[]} path_strings2 - 组2中古音路径字符串列表
 * @property {string|null} column2 - 组2列名
 * @property {boolean} combine_query2 - 组2是否组合查询
 * @property {string[]} [exclude_columns2] - 组2排除列
 * @property {string[]} [locations] - 地点列表
 * @property {string[]} [regions] - 区域列表
 * @property {string[]} [features] - 特征列表
 * @property {string} [region_mode] - 区域模式
 */

/**
 * @typedef {Object} CompareTonesParams
 * @property {string[]} tone_classes - 调类列表（包含组1和组2的所有调类）
 * @property {string[]} [locations] - 地点列表
 * @property {string[]} [regions] - 区域列表
 * @property {string} [region_mode] - 区域模式
 * @property {string[]} group1_tones - 组1调类列表
 * @property {string[]} group2_tones - 组2调类列表
 */

/**
 * 比较汉字
 * @param {CompareCharsParams} params - 比较参数
 * @returns {Promise<Array<Object>>} 比较结果，包含每个地点的比较数据
 * @throws {Error} 比较失败
 * @example
 * const results = await compareChars({
 *   chars: ['知', '章', '莊', '初'],
 *   features: ['声母', '韵母'],
 *   locations: ['广州', '深圳'],
 *   region_mode: 'yindian',
 *   group1_chars: ['知', '章'],
 *   group2_chars: ['莊', '初']
 * })
 */
export async function compareChars(params) {
  try {
    // 构建 URL 查询参数
    const queryParams = new URLSearchParams()

    // chars 参数（多个）
    if (params.chars && Array.isArray(params.chars)) {
      params.chars.forEach(char => queryParams.append('chars', char))
    }

    // features 参数（多个）
    if (params.features && Array.isArray(params.features)) {
      params.features.forEach(feature => queryParams.append('features', feature))
    }

    // locations 参数（多个，可选）
    if (params.locations && Array.isArray(params.locations)) {
      params.locations.forEach(loc => queryParams.append('locations', loc))
    }

    // regions 参数（多个，可选）
    if (params.regions && Array.isArray(params.regions)) {
      params.regions.forEach(region => queryParams.append('regions', region))
    }

    // region_mode 参数（单个，可选）
    if (params.region_mode) {
      queryParams.append('region_mode', params.region_mode)
    }

    return await api(`/api/compare/chars?${queryParams.toString()}`, {
      method: 'GET',
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Compare chars error:', error)
    showError(error.message || '比較漢字失敗')
    throw error
  }
}

/**
 * 比较中古音
 * @param {CompareZhongGuParams} params - 比较参数
 * @returns {Promise<Object>} 比较结果，包含 comparison 数组
 * @throws {Error} 比较失败
 * @example
 * const results = await compareZhongGu({
 *   path_strings1: ['帮/东/平'],
 *   column1: null,
 *   combine_query1: false,
 *   exclude_columns1: [],
 *   path_strings2: ['端/东/平'],
 *   column2: null,
 *   combine_query2: false,
 *   exclude_columns2: [],
 *   locations: ['广州'],
 *   features: ['声母', '韵母'],
 *   region_mode: 'yindian'
 * })
 */
export async function compareZhongGu(params) {
  try {
    return await api('/api/compare/ZhongGu', {
      method: 'POST',
      body: params,
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Compare ZhongGu error:', error)
    showError(error.message || '比較中古音失敗')
    throw error
  }
}

/**
 * 比较调类
 * @param {CompareTonesParams} params - 比较参数
 * @returns {Promise<Array<Object>>} 比较结果，包含每个地点的比较数据
 * @throws {Error} 比较失败
 * @example
 * const results = await compareTones({
 *   tone_classes: ['T1', 'T2', 'T3', 'T4'],
 *   locations: ['广州', '深圳'],
 *   regions: ['珠三角'],
 *   region_mode: 'yindian',
 *   group1_tones: ['T1', 'T2'],
 *   group2_tones: ['T3', 'T4']
 * })
 */
export async function compareTones(params) {
  try {
    // 构建 URL 查询参数
    const queryParams = new URLSearchParams()

    // tone_classes 参数（多个）
    if (params.tone_classes && Array.isArray(params.tone_classes)) {
      params.tone_classes.forEach(tone => queryParams.append('tone_classes', tone))
    }

    // locations 参数（多个，可选）
    if (params.locations && Array.isArray(params.locations)) {
      params.locations.forEach(loc => queryParams.append('locations', loc))
    }

    // regions 参数（多个，可选）
    if (params.regions && Array.isArray(params.regions)) {
      params.regions.forEach(region => queryParams.append('regions', region))
    }

    // region_mode 参数（单个，可选）
    if (params.region_mode) {
      queryParams.append('region_mode', params.region_mode)
    }

    return await api(`/api/compare/tones?${queryParams.toString()}`, {
      method: 'GET',
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Compare tones error:', error)
    showError(error.message || '比較調類失敗')
    throw error
  }
}
