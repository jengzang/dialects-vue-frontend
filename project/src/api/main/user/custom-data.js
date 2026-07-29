// api/user/custom-data.js - 用户自定义数据 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/ui/message.js'

/**
 * @typedef {Object} CustomDataRecord
 * @property {string} 簡稱 - 地点简称
 * @property {string} 音典分區 - 分区
 * @property {string} 經緯度 - 经纬度
 * @property {string} [聲韻調] - 声韵调（可选）
 * @property {string} 特徵 - 特征
 * @property {string} 值 - 值
 * @property {string} [說明] - 说明（可选）
 * @property {string} created_at - 创建时间
 */

/**
 * 获取所有自定义数据
 * @returns {Promise<CustomDataRecord[]>} 自定义数据记录列表
 * @throws {Error} 获取失败
 * @example
 * const data = await getAllCustomData()
 */
export async function getAllCustomData() {
  try {
    return await api('/user/custom/all')
  } catch (error) {
    console.error('Get all custom data error:', error)
    showError(error.message || '獲取自定義數據失敗')
    throw new Error(error.message || '獲取自定義數據失敗')
  }
}

/**
 * 编辑单条自定义数据
 * @param {CustomDataRecord} record - 要更新的记录（包含 created_at 作为标识）
 * @returns {Promise<{message: string}>} 更新结果
 * @throws {Error} 更新失败
 * @example
 * await editCustomData({
 *   created_at: '2024-01-01T00:00:00Z',
 *   簡稱: '广州',
 *   特徵: 'tone',
 *   值: '55'
 * })
 */
export async function editCustomData(record) {
  try {
    return await api('/user/custom/edit', {
      method: 'PUT',
      body: record
    })
  } catch (error) {
    console.error('Edit custom data error:', error)
    showError(error.message || '編輯自定義數據失敗')
    throw new Error(error.message || '編輯自定義數據失敗')
  }
}

/**
 * 批量创建自定义数据
 * @param {CustomDataRecord[]} records - 要创建的记录数组
 * @returns {Promise<{message: string, created_count: number}>} 创建结果
 * @throws {Error} 创建失败
 * @example
 * const result = await batchCreateCustomData([
 *   { 簡稱: '广州', 音典分區: '粤海', 經緯度: '113.2,23.1', 特徵: 'tone', 值: '55' },
 *   { 簡稱: '香港', 音典分區: '粤海', 經緯度: '114.1,22.3', 特徵: 'tone', 值: '55' }
 * ])
 */
export async function batchCreateCustomData(records) {
  try {
    return await api('/user/custom/batch-create', {
      method: 'POST',
      body: records  // ✅ 直接发送数组，不包装在对象中
    })
  } catch (error) {
    console.error('Batch create custom data error:', error)
    showError(error.message || '批量創建自定義數據失敗')
    throw new Error(error.message || '批量創建自定義數據失敗')
  }
}

/**
 * 批量删除自定义数据
 * @param {string[]} createdAtList - 要删除的记录的 created_at 时间戳列表
 * @returns {Promise<{message: string, deleted_count: number}>} 删除结果
 * @throws {Error} 删除失败
 * @example
 * const result = await batchDeleteCustomData([
 *   '2024-01-01T00:00:00Z',
 *   '2024-01-02T00:00:00Z'
 * ])
 */
export async function batchDeleteCustomData(createdAtList) {
  try {
    return await api('/user/custom/batch-delete', {
      method: 'DELETE',
      body: { created_at_list: createdAtList }
    })
  } catch (error) {
    console.error('Batch delete custom data error:', error)
    showError(error.message || '批量刪除自定義數據失敗')
    throw new Error(error.message || '批量刪除自定義數據失敗')
  }
}
