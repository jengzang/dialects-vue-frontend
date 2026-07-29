// api/sql/mutate.js - SQL修改操作 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/ui/message.js'

/**
 * @typedef {Object} MutateSingleParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {Object} where - 查询条件
 * @property {Object} updates - 更新内容
 */

/**
 * @typedef {Object} BatchMutateParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {Array<{where: Object, updates: Object}>} operations - 批量操作
 */

/**
 * @typedef {Object} BatchReplaceParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {string} column - 列名
 * @property {string} find - 查找字符串
 * @property {string} replace - 替换字符串
 * @property {Object} [where] - 查询条件（可选）
 */

/**
 * 修改单条数据
 * @param {MutateSingleParams} params - 修改参数
 * @returns {Promise<{affected_rows: number, message: string}>} 修改结果
 * @throws {Error} 修改失败
 * @example
 * await mutateSingleRow({
 *   db_key: 'phonology',
 *   table_name: 'locations',
 *   where: { id: 123 },
 *   updates: { name: '新地名', latitude: 23.1 }
 * })
 */
export async function mutateSingleRow(params) {
  try {
    return await api('/sql/mutate', {
      method: 'POST',
      body: params
    })
  } catch (error) {
    console.error('Mutate single row error:', error)
    showError(error.message || '修改數據失敗')
    throw new Error(error.message || '修改數據失敗')
  }
}

/**
 * 批量修改数据
 * @param {BatchMutateParams} params - 批量修改参数
 * @returns {Promise<{affected_rows: number, message: string}>} 修改结果
 * @throws {Error} 修改失败
 * @example
 * await batchMutate({
 *   db_key: 'phonology',
 *   table_name: 'locations',
 *   operations: [
 *     { where: { id: 1 }, updates: { name: '新名称1' } },
 *     { where: { id: 2 }, updates: { name: '新名称2' } }
 *   ]
 * })
 */
export async function batchMutate(params) {
  try {
    return await api('/sql/batch-mutate', {
      method: 'POST',
      body: params
    })
  } catch (error) {
    console.error('Batch mutate error:', error)
    showError(error.message || '批量修改失敗')
    throw new Error(error.message || '批量修改失敗')
  }
}

/**
 * 批量替换预览
 * @param {BatchReplaceParams} params - 批量替换参数
 * @returns {Promise<{preview: Array<Object>, affected_count: number}>} 预览结果
 * @throws {Error} 预览失败
 * @example
 * const preview = await batchReplacePreview({
 *   db_key: 'phonology',
 *   table_name: 'locations',
 *   column: 'name',
 *   find: '旧',
 *   replace: '新'
 * })
 */
export async function batchReplacePreview(params) {
  try {
    return await api('/sql/batch-replace-preview', {
      method: 'POST',
      body: params
    })
  } catch (error) {
    console.error('Batch replace preview error:', error)
    showError(error.message || '批量替換預覽失敗')
    throw new Error(error.message || '批量替換預覽失敗')
  }
}

/**
 * 执行批量替换
 * @param {BatchReplaceParams} params - 批量替换参数
 * @returns {Promise<{affected_rows: number, message: string}>} 替换结果
 * @throws {Error} 替换失败
 * @example
 * const result = await batchReplaceExecute({
 *   db_key: 'phonology',
 *   table_name: 'locations',
 *   column: 'name',
 *   find: '旧',
 *   replace: '新'
 * })
 */
export async function batchReplaceExecute(params) {
  try {
    return await api('/sql/batch-replace-execute', {
      method: 'POST',
      body: params
    })
  } catch (error) {
    console.error('Batch replace execute error:', error)
    showError(error.message || '批量替換執行失敗')
    throw new Error(error.message || '批量替換執行失敗')
  }
}
