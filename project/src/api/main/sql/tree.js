// api/sql/tree.js - 树形数据查询 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/message.js'

/**
 * @typedef {Object} TreeNode
 * @property {string|number} id - 节点ID
 * @property {string} label - 节点标签
 * @property {boolean} [isLeaf] - 是否叶子节点
 * @property {TreeNode[]} [children] - 子节点（可选）
 */

/**
 * @typedef {Object} LazyLoadTreeParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {string|number} [parent_id] - 父节点ID（null表示根节点）
 * @property {string} [id_column='id'] - ID列名
 * @property {string} [label_column='name'] - 标签列名
 * @property {string} [parent_column='parent_id'] - 父ID列名
 */

/**
 * @typedef {Object} FullTreeParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {string} [id_column='id'] - ID列名
 * @property {string} [label_column='name'] - 标签列名
 * @property {string} [parent_column='parent_id'] - 父ID列名
 */

/**
 * 懒加载树形数据
 * @param {LazyLoadTreeParams} params - 懒加载参数
 * @returns {Promise<TreeNode[]>} 树节点数组
 * @throws {Error} 加载失败
 * @example
 * const rootNodes = await lazyLoadTree({
 *   db_key: 'geography',
 *   table_name: 'regions',
 *   parent_id: null
 * })
 */
export async function lazyLoadTree(params) {
  try {
    return await api('/sql/tree/lazy', {
      method: 'POST',
      body: params
    })
  } catch (error) {
    console.error('Lazy load tree error:', error)
    showError(error.message || '懶加載樹形數據失敗')
    throw new Error(error.message || '懶加載樹形數據失敗')
  }
}

/**
 * 加载完整树形数据
 * @param {FullTreeParams} params - 完整树参数
 * @returns {Promise<TreeNode[]>} 完整树节点数组
 * @throws {Error} 加载失败
 * @example
 * const fullTree = await loadFullTree({
 *   db_key: 'geography',
 *   table_name: 'regions'
 * })
 */
export async function loadFullTree(params) {
  try {
    const result = await api('/sql/tree/full', {
      method: 'POST',
      body: params
    })

    // Pass through full response — callers inspect result.mode to handle lazy_fallback
    return {
      mode: result.mode || 'full',
      ...(result.mode === 'lazy_fallback'
        ? { lazy_bootstrap: result.lazy_bootstrap, shifted_level_columns: result.shifted_level_columns }
        : { tree: result.tree || {} }),
    }
  } catch (error) {
    console.error('Load full tree error:', error)
    showError(error.message || '加載完整樹形數據失敗')
    throw new Error(error.message || '加載完整樹形數據失敗')
  }
}
