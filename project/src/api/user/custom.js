// api/user/custom.js - 自定义特征查询 API
import { api } from '../auth/auth.js'
import { showError } from '@/utils/message.js'

/**
 * @typedef {Object} CustomDataParams
 * @property {string[]} [locations] - 地点列表
 * @property {string[]} [regions] - 区域列表
 * @property {string[]} [need_features] - 需要的特征列表
 * @property {string} [region_mode] - 区域模式
 */

/**
 * @typedef {Object} CustomFeatureParams
 * @property {string[]} [locations] - 地点列表
 * @property {string[]} [regions] - 区域列表
 * @property {string} [word] - 搜索词
 */

/**
 * @typedef {Object} CustomFormData
 * @property {string} feature_name - 特征名称
 * @property {string} location - 地点
 * @property {any} value - 值
 * @property {Object} [metadata] - 元数据（可选）
 */

/**
 * 获取自定义数据
 * @param {CustomDataParams} params - 查询参数
 * @returns {Promise<Array<Object>>} 自定义数据
 * @throws {Error} 查询失败
 * @example
 * const data = await getCustomData({
 *   locations: ['广州', '香港'],
 *   regions: ['珠三角'],
 *   need_features: ['tone', 'initial'],
 *   region_mode: 'yindian'
 * })
 */
export async function getCustomData(params) {
  try {
    const query = new URLSearchParams()

    // locations 和 regions 是 List[str]，需要多次添加同一个参数
    if (params.locations && Array.isArray(params.locations)) {
      params.locations.forEach(loc => {
        query.append('locations', loc)
      })
    }

    if (params.regions && Array.isArray(params.regions)) {
      params.regions.forEach(reg => {
        query.append('regions', reg)
      })
    }

    // need_features 需要用逗号分隔成单个字符串
    if (params.need_features && Array.isArray(params.need_features)) {
      query.append('need_features', params.need_features.join(','))
    } else if (params.need_features) {
      query.append('need_features', params.need_features)
    }

    if (params.region_mode) {
      query.append('region_mode', params.region_mode)
    }

    return await api(`/api/get_custom?${query.toString()}`)
  } catch (error) {
    console.error('Get custom data error:', error)
    showError(error.message || '獲取自定義數據失敗')
    throw new Error(error.message || '獲取自定義數據失敗')
  }
}

/**
 * 获取自定义特征
 * @param {CustomFeatureParams} params - 查询参数
 * @returns {Promise<Array<Object>>} 自定义特征数据
 * @throws {Error} 查询失败
 * @example
 * const features = await getCustomFeature({
 *   locations: ['广州'],
 *   regions: ['珠三角'],
 *   word: '平'
 * })
 */
export async function getCustomFeature(params) {
  try {
    const query = new URLSearchParams()

    query.append('locations', params.locations || '')
    query.append('regions', params.regions || '')

    if (params.word !== undefined) {
      query.append('word', params.word)
    }

    return await api(`/api/get_custom_feature?${query.toString()}`)
  } catch (error) {
    console.error('Get custom feature error:', error)
    showError(error.message || '獲取自定義特徵失敗')
    throw new Error(error.message || '獲取自定義特徵失敗')
  }
}

/**
 * 提交自定义表单
 * @param {CustomFormData} data - 表单数据
 * @returns {Promise<{message: string, id: number}>} 提交结果
 * @throws {Error} 提交失败
 * @example
 * const result = await submitCustomForm({
 *   feature_name: 'my_feature',
 *   location: '广州',
 *   value: 'some_value',
 *   metadata: { notes: 'custom notes' }
 * })
 */
export async function submitCustomForm(data) {
  try {
    return await api('/api/submit_form', {
      method: 'POST',
      body: data
    })
  } catch (error) {
    console.error('Submit custom form error:', error)
    showError(error.message || '提交自定義表單失敗')
    throw new Error(error.message || '提交自定義表單失敗')
  }
}

/**
 * 删除自定义表单数据
 * @param {Object} data - 删除参数
 * @property {number} data.id - 要删除的记录ID
 * @returns {Promise<{message: string}>} 删除结果
 * @throws {Error} 删除失败
 * @example
 * await deleteCustomForm({ id: 123 })
 */
export async function deleteCustomForm(data) {
  try {
    return await api('/api/delete_form', {
      method: 'DELETE',
      body: data
    })
  } catch (error) {
    console.error('Delete custom form error:', error)
    showError(error.message || '刪除自定義表單失敗')
    throw new Error(error.message || '刪除自定義表單失敗')
  }
}
