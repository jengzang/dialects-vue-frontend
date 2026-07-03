// api/sql/tree.js - 树形数据查询 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/message.js'

/**
 * @typedef {Object} LazyLoadTreeResult
 * @property {Array<string|Object>} children - 当前层级子节点列表（字符串为名称，对象可能含数据字段）
 */

/**
 * @typedef {Object} LazyLoadTreeParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {number[]} level_columns - 层级列索引数组
 * @property {(string[]|null)} [parent_path] - 父级路径数组，如 ["广州市","天河区"]；根级传 [] 或 null
 */

/**
 * 懒加载某一层的子节点。
 * 响应根级最多 500 条；非末级空值返回 ["(空)"]。"(空)" 可放入 parent_path 继续下钻。
 *
 * @param {LazyLoadTreeParams} params
 * @returns {Promise<LazyLoadTreeResult>}
 * @throws {Error} 加载失败
 * @example
 * // 加载根级城市列表
 * const result = await lazyLoadTree({
 *   db_key: 'village',
 *   table_name: '广东省自然村',
 *   level_columns: [0, 1, 2, 3, 4],
 *   parent_path: []
 * })
 * // result.children → ["广州市", "深圳市", ...]
 *
 * @example
 * // 下钻到区县
 * const result = await lazyLoadTree({
 *   db_key: 'village',
 *   table_name: '广东省自然村',
 *   level_columns: [0, 1, 2, 3, 4],
 *   parent_path: ["广州市", "天河区"]
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
 * @typedef {Object} FullTreeResultFull
 * @property {'full'} mode
 * @property {Object} tree - 完整树，格式为 { 节点名: { 子节点或数据数组 } }
 *
 * @typedef {Object} FullTreeResultFallback
 * @property {'lazy_fallback'} mode
 * @property {string} reason - 超限原因，如 "full_tree_row_limit_exceeded"
 * @property {number} limit - 触发上限的行数
 * @property {number} levels - 总层级数
 * @property {Object<string, string[]>} lazy_bootstrap - 两级引导映射，{ 父级名: [子级名列表] }
 *
 * @typedef {FullTreeResultFull|FullTreeResultFallback} FullTreeResult
 */

/**
 * @typedef {Object} FullTreeParams
 * @property {string} db_key - 数据库键名
 * @property {string} table_name - 表名
 * @property {number[]} level_columns - 层级列索引数组，如 [0,1,2,3,4]。应随 filters 深度 shift
 * @property {number[]} [data_columns] - 数据列索引数组（叶子节点附加数据）
 * @property {Object<string, string[]>} [filters] - AND 关系的累积过滤条件，
 *   如 {"0":["汕尾市"],"1":["城区"]}。key 为列索引，value 为匹配值数组。"(空)" 匹配空值
 */

/**
 * 加载完整树形数据。
 *
 * 正常情况（≤5000 行）：返回 mode="full"，tree 中包含完整嵌套树。
 * 超限情况（>5000 行）：返回 mode="lazy_fallback"，lazy_bootstrap 为
 * { 父级: [子级列表] } 的两级映射。前端渲染两级树后，展开子级时继续调用本接口，
 * 用累积的 filters + shifted level_columns 下钻。递归支持多次 fallback。
 *
 * @param {FullTreeParams} params
 * @returns {Promise<FullTreeResult>}
 * @throws {Error} 加载失败
 * @example
 * // 初次请求——按城市过滤
 * const result = await loadFullTree({
 *   db_key: 'village',
 *   table_name: '广东省自然村',
 *   level_columns: [0, 1, 2, 3, 4],
 *   data_columns: [6, 7, 8],
 *   filters: { "0": ["汕尾市"] }
 * })
 * // result.mode === 'lazy_fallback'
 * // result.lazy_bootstrap → { "汕尾市": ["城区","海丰县",...] }
 *
 * @example
 * // 下钻请求——累积 filters + shift level_columns
 * const result = await loadFullTree({
 *   db_key: 'village',
 *   table_name: '广东省自然村',
 *   level_columns: [1, 2, 3, 4],
 *   data_columns: [6, 7, 8],
 *   filters: { "0": ["汕尾市"], "1": ["城区"] }
 * })
 * // result.mode === 'full'
 * // result.tree → { "城区": { "某某镇": { "村1": { ... } } } }
 */
export async function loadFullTree(params) {
  try {
    const result = await api('/sql/tree/full', {
      method: 'POST',
      body: params
    })

    return {
      mode: result.mode || 'full',
      ...(result.mode === 'lazy_fallback'
        ? { lazy_bootstrap: result.lazy_bootstrap }
        : { tree: result.tree || {} }),
    }
  } catch (error) {
    console.error('Load full tree error:', error)
    showError(error.message || '加載完整樹形數據失敗')
    throw new Error(error.message || '加載完整樹形數據失敗')
  }
}
