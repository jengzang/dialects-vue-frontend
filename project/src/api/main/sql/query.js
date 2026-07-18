// api/sql/query.js - SQL查询操作 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/ui/message.js'

/**
 * @typedef {Object} SqlQueryParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {string[]} [columns] - 要查询的列（可选）
 * @property {Object} [where] - 查询条件（可选）
 * @property {number} [limit] - 限制结果数量（可选）
 * @property {number} [offset] - 偏移量（可选）
 * @property {Object} [order_by] - 排序规则（可选）
 */

/**
 * @typedef {Object} DistinctQueryParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {string} target_column - 要去重的列
 * @property {string} [search_text] - 搜索文本（可选）
 * @property {string[]} [search_columns] - 搜索列（可选）
 * @property {Object} [current_filters] - 当前过滤条件（可选）
 * @property {Object} [where] - 查询条件（可选）
 */

/**
 * @typedef {Object} ColumnInfo
 * @property {string} name - 列名
 * @property {string} type - 数据类型
 * @property {boolean} nullable - 是否可为空
 */

/**
 * 执行SQL查询
 * @param {SqlQueryParams} params - 查询参数
 * @returns {Promise<Array<Object>>} 查询结果行
 * @throws {Error} 查询失败
 * @example
 * const rows = await sqlQuery({
 *   db_key: 'phonology',
 *   table_name: 'locations',
 *   columns: ['id', 'name', 'longitude', 'latitude'],
 *   where: { province: '广东' },
 *   limit: 100
 * })
 */
export async function sqlQuery(params) {
  try {
    return await api('/sql/query', {
      method: 'POST',
      body: params
    })
  } catch (error) {
    console.error('SQL query error:', error)
    showError(error.message || 'SQL查詢失敗')
    throw new Error(error.message || 'SQL查詢失敗')
  }
}

/**
 * 执行去重查询
 * @param {DistinctQueryParams} params - 去重查询参数
 * @returns {Promise<Array<any>>} 去重后的值列表
 * @throws {Error} 查询失败
 * @example
 * const provinces = await distinctQuery({
 *   db_key: 'phonology',
 *   table_name: 'locations',
 *   target_column: 'province'
 * })
 */
export async function distinctQuery(params) {
  try {
    return await api('/sql/distinct-query', {
      method: 'POST',
      body: params
    })
  } catch (error) {
    console.error('Distinct query error:', error)
    showError(error.message || '去重查詢失敗')
    throw new Error(error.message || '去重查詢失敗')
  }
}

/**
 * @typedef {Object} QueryCountParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {string} [filter_column] - 筛选列名（可选）
 * @property {string|number} [filter_value] - 筛选值（可选）
 */

/**
 * 统计表行数（轻量级，有 Redis 缓存 1 小时）
 * @param {QueryCountParams} params - 查询参数
 * @returns {Promise<number>} 行数
 * @throws {Error} 查询失败
 * @example
 * // 统计 dialects 表总行数
 * const total = await queryCount({ db_key: 'dialects', table_name: 'dialects' })
 * // 统计存儲標記=1 的行数
 * const stored = await queryCount({ db_key: 'query', table_name: 'dialects', filter_column: '存儲標記', filter_value: 1 })
 */
export async function queryCount({ db_key, table_name, filter_column, filter_value } = {}) {
  try {
    const params = new URLSearchParams({ db_key, table_name })
    if (filter_column !== undefined) params.set('filter_column', filter_column)
    if (filter_value !== undefined) params.set('filter_value', filter_value)
    const result = await api(`/sql/query/count?${params.toString()}`)
    return result.count
  } catch (error) {
    console.error('Query count error:', error)
    showError(error.message || '統計行數失敗')
    throw new Error(error.message || '統計行數失敗')
  }
}

/**
 * 获取表的列信息
 * @param {string} dbKey - 数据库键名
 * @param {string} tableName - 表名
 * @returns {Promise<ColumnInfo[]>} 列信息数组
 * @throws {Error} 获取失败
 * @example
 * const columns = await getTableColumns('phonology', 'locations')
 * console.log(columns) // [{ name: 'id', type: 'INTEGER', nullable: false }, ...]
 */
export async function getTableColumns(dbKey, tableName) {
  try {
    const url = `/sql/query/columns?db_key=${encodeURIComponent(dbKey)}&table_name=${encodeURIComponent(tableName)}`
    return await api(url)
  } catch (error) {
    console.error('Get table columns error:', error)
    showError(error.message || '獲取表列信息失敗')
    throw new Error(error.message || '獲取表列信息失敗')
  }
}
