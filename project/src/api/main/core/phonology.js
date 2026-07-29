// api/query/phonology.js - 音系查询 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/ui/message.js'

/**
 * @typedef {Object} PhonologyMatrixParams
 * @property {string[]} [locations] - 地点列表
 * @property {string[]} [features] - 特征列表
 * @property {string} [matrix_type] - 矩阵类型
 */

/**
 * @typedef {Object} PhonologyClassificationParams
 * @property {string[]} [locations] - 地点列表
 * @property {string} [classification_method] - 分类方法
 */

/**
 * @typedef {Object} PhonologyQueryParams
 * @property {string} [initial] - 声母
 * @property {string} [final] - 韵母
 * @property {string} [tone] - 声调
 * @property {string[]} [locations] - 地点列表
 */

/**
 * 获取音系矩阵
 * @param {PhonologyMatrixParams} params - 查询参数
 * @returns {Promise<Object>} 音系矩阵数据。单个地点结果除 `initials` / `finals` /
 * `tones` / `matrix` 外，还可能包含 `matrix_read_stats`，其结构与 `matrix`
 * 平行：`matrix_read_stats[initial][final][tone] = { polyphonic, wendu, baidu, wenbai }`，
 * 每个 bucket 形如 `{ count: number, chars: string[] }`。
 * @throws {Error} 查询失败
 * @example
 * const matrix = await getPhonologyMatrix({
 *   locations: ['广州', '香港'],
 *   features: ['initial', 'final', 'tone']
 * })
 */
export async function getPhonologyMatrix(params) {
  try {
    const query = new URLSearchParams()

    if (Array.isArray(params?.locations)) {
      params.locations.forEach(location => {
        if (location) query.append('locations', location)
      })
    }

    if (Array.isArray(params?.features)) {
      params.features.forEach(feature => {
        if (feature) query.append('features', feature)
      })
    }

    if (params?.matrix_type) {
      query.append('matrix_type', params.matrix_type)
    }

    const queryString = query.toString()
    const path = queryString ? `/api/phonology_matrix?${queryString}` : '/api/phonology_matrix'

    return await api(path, {
      method: 'GET',
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Get phonology matrix error:', error)
    showError(error.message || '獲取音系矩陣失敗')
    throw new Error(error.message || '獲取音系矩陣失敗')
  }
}

/**
 * 获取音系分类矩阵
 * @param {PhonologyClassificationParams} params - 查询参数
 * @returns {Promise<Object>} 音系分类矩阵数据
 * @throws {Error} 查询失败
 * @example
 * const classificationMatrix = await getPhonologyClassificationMatrix({
 *   locations: ['广州', '香港', '深圳'],
 *   classification_method: 'hierarchical'
 * })
 */
export async function getPhonologyClassificationMatrix(params) {
  try {
    return await api('/api/phonology_classification_matrix', {
      method: 'POST',
      body: params,
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Get phonology classification matrix error:', error)
    showError(error.message || '獲取音系分類矩陣失敗')
    throw new Error(error.message || '獲取音系分類矩陣失敗')
  }
}

/**
 * 音韵地位查询
 * @param {PhonologyQueryParams} params - 查询参数
 * @returns {Promise<Object>} 查询结果
 * @throws {Error} 查询失败
 * @example
 * const result = await queryPhonology({
 *   initial: '帮',
 *   final: '东',
 *   tone: '平',
 *   locations: ['广州']
 * })
 */
export async function queryPhonology(params) {
  try {
    return await api('/api/phonology', {
      method: 'POST',
      body: params,
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Query phonology error:', error)
    showError(error.message || '音韻地位查詢失敗')
    throw new Error(error.message || '音韻地位查詢失敗')
  }
}
