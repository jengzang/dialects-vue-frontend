// api/tools/check.js - 字表检查工具 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/ui/message.js'

/**
 * @typedef {Object} CheckUploadResponse
 * @property {string} task_id - 任务ID
 * @property {string} filename - 文件名
 * @property {string} message - 消息
 */

/**
 * 上传检查文件
 * @param {File} file - 字表文件
 * @param {string} [formatType] - 文件格式类型（'音典' | '跳跳老鼠' | '縣志' | undefined）
 * @param {boolean} [isSimplified=false] - 是否简体中文
 * @param {Object} [options] - 附加选项
 * @param {Object|null} [options.columnMapping] - 列匹配结果
 * @param {number|null} [options.headerRowIndex] - 表头所在行（从 0 开始）
 * @param {string|null} [options.sheetName] - 选中的工作表名称
 * @returns {Promise<CheckUploadResponse>} 上传结果
 * @throws {Error} 上传失败
 * @example
 * const result = await uploadCheckFile(file, '音典', false, {
 *   columnMapping: { char: 'column_1', ipa: 'column_2' }
 * })
 */
export async function uploadCheckFile(file, formatType, isSimplified = false, options = {}) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('format_type',formatType)
  // 繁体(false) -> '0', 简体(true) -> '1'
  formData.append('level', isSimplified ? '1' : '0')

  const { columnMapping = null, headerRowIndex = null, sheetName = null } = options

  if (columnMapping) {
    formData.append('column_mapping', JSON.stringify(columnMapping))
  }

  if (headerRowIndex !== null && headerRowIndex !== undefined) {
    formData.append('header_row_index', String(headerRowIndex))
  }

  if (sheetName) {
    formData.append('sheet_name', sheetName)
  }

  try {
    return await api('/api/tools/check/upload', {
      method: 'POST',
      body: formData
    })
  } catch (error) {
    console.error('Upload check file error:', error)
    showError(error.message || '字表上傳失敗')
    throw new Error(error.message || '字表上傳失敗')
  }
}

/**
 * 分析文件
 * @param {string} taskId - 任务ID
 * @returns {Promise<{message: string}>} 分析结果
 * @throws {Error} 分析失败
 * @example
 * await analyzeFile(taskId)
 */
export async function analyzeFile(taskId) {
  try {
    return await api(`/api/tools/check/analyze?task_id=${taskId}`, {
      method: 'POST'
    })
  } catch (error) {
    console.error('Analyze file error:', error)
    showError(error.message || '文件分析失敗')
    throw new Error(error.message || '文件分析失敗')
  }
}

/**
 * 获取声调统计
 * @param {string} taskId - 任务ID
 * @returns {Promise<ToneStats>} 声调统计
 * @throws {Error} 获取失败
 * @example
 * const stats = await getToneStats(taskId)
 * console.log(stats.tone_counts) // { "陰平": 120, "陽平": 98, ... }
 */
export async function getToneStats(taskId) {
  try {
    return await api('/api/tools/check/get_tone_stats', {
      method: 'POST',
      body: {
        task_id: taskId,
        include_all: true
      }
    })
  } catch (error) {
    console.error('Get tone stats error:', error)
    showError(error.message || '獲取聲調統計失敗')
    throw new Error(error.message || '獲取聲調統計失敗')
  }
}

/**
 * 获取表格数据
 * @param {string} taskId - 任务ID
 * @param {Object} [options] - 查询选项
 * @param {boolean} [options.includeAll] - 是否获取全部数据（不分页）
 * @param {number} [options.page=1] - 页码
 * @param {number} [options.pageSize=100] - 每页大小
 * @param {string} [options.toneFilter] - 声调过滤
 * @param {string} [options.searchQuery] - 搜索查询
 * @returns {Promise<TableDataResponse>} 表格数据
 * @throws {Error} 获取失败
 * @example
 * // 获取全部数据
 * const allData = await getTableData(taskId, { includeAll: true })
 * // 分页获取
 * const data = await getTableData(taskId, { page: 1, pageSize: 100 })
 */
export async function getTableData(taskId, options = {}) {
  const {
    includeAll = false,
    page = 1,
    pageSize = 100,
    toneFilter = null,
    searchQuery = null
  } = options

  const body = {
    task_id: taskId
  }

  // 如果是获取全部数据，只传 include_all
  if (includeAll) {
    body.include_all = true
  } else {
    // 分页模式
    body.page = page
    body.page_size = pageSize
    if (toneFilter) body.tone_filter = toneFilter
    if (searchQuery) body.search_query = searchQuery
  }

  try {
    return await api('/api/tools/check/get_data', {
      method: 'POST',
      body
    })
  } catch (error) {
    console.error('Get table data error:', error)
    showError(error.message || '獲取表格數據失敗')
    throw new Error(error.message || '獲取表格數據失敗')
  }
}

/**
 * 更新行数据
 * @param {string} taskId - 任务ID
 * @param {number} row - 行号
 * @param {Object} data - 更新的数据对象
 * @returns {Promise<{message: string}>} 更新结果
 * @throws {Error} 更新失败
 * @example
 * await updateRow(taskId, 5, { tone: '陰平', ipa: 'pa55' })
 */
export async function updateRow(taskId, row, data) {
  try {
    return await api('/api/tools/check/update_row', {
      method: 'POST',
      body: {
        task_id: taskId,
        row,
        data
      }
    })
  } catch (error) {
    console.error('Update row error:', error)
    showError(error.message || '更新行數據失敗')
    throw new Error(error.message || '更新行數據失敗')
  }
}

/**
 * 批量删除行
 * @param {string} taskId - 任务ID
 * @param {number[]} rows - 要删除的行号数组
 * @returns {Promise<{message: string, deleted_count: number}>} 删除结果
 * @throws {Error} 删除失败
 * @example
 * await batchDelete(taskId, [3, 5, 7])
 */
export async function batchDelete(taskId, rows) {
  try {
    return await api('/api/tools/check/batch_delete', {
      method: 'POST',
      body: {
        task_id: taskId,
        rows
      }
    })
  } catch (error) {
    console.error('Batch delete error:', error)
    showError(error.message || '批量刪除失敗')
    throw new Error(error.message || '批量刪除失敗')
  }
}

/**
 * 执行批量操作
 * @param {string} taskId - 任务ID
 * @param {Object} operation - 操作配置
 * @param {'command'|'replace'|'update'} operation.type - 操作类型
 * @param {Object} operation.params - 操作参数（包含 commands 等字段）
 * @returns {Promise<{message: string, affected_count: number, success: boolean}>} 操作结果
 * @throws {Error} 操作失败
 * @example
 * await executeBatchOperation(taskId, {
 *   type: 'replace',
 *   params: { commands: ['p-p-pt'] }
 * })
 */
export async function executeBatchOperation(taskId, operation) {
  try {
    // 解包 operation 对象，将 type 和 params 的内容展开到顶层
    const body = {
      task_id: taskId,
      type: operation.type,
      ...operation.params  // 展开 params（如 commands 数组）
    }

    return await api('/api/tools/check/execute', {
      method: 'POST',
      body
    })
  } catch (error) {
    console.error('Execute batch operation error:', error)
    showError(error.message || '批量操作執行失敗')
    throw new Error(error.message || '批量操作執行失敗')
  }
}

/**
 * 下载检查结果
 * @param {string} taskId - 任务ID
 * @returns {Promise<Blob>} 文件Blob
 * @throws {Error} 下载失败
 * @example
 * const blob = await downloadCheckResult(taskId)
 * const url = URL.createObjectURL(blob)
 * const a = document.createElement('a')
 * a.href = url
 * a.download = 'checked_result.xlsx'
 * a.click()
 */
export async function downloadCheckResult(taskId) {
  try {
    return await api(`/api/tools/check/download/${taskId}`, {
      responseType: 'blob'
    })
  } catch (error) {
    console.error('Download check result error:', error)
    showError(error.message || '下載檢查結果失敗')
    throw new Error(error.message || '下載檢查結果失敗')
  }
}
