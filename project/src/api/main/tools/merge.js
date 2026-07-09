// api/tools/merge.js - 字表合并工具 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/message.js'

/**
 * @typedef {Object} ReferenceUploadResponse
 * @property {string} task_id - 任务ID
 * @property {string} filename - 文件名
 * @property {number} char_count - 字符数量
 * @property {number} column_count - 列数量
 */

/**
 * @typedef {Object} MergeProgress
 * @property {string} task_id - 任务ID
 * @property {'pending'|'processing'|'completed'|'error'} status - 任务状态
 * @property {number} progress - 进度（0-100）
 * @property {string} [message] - 状态消息
 * @property {string} [error] - 错误信息（可选）
 */

/**
 * 上传参考字表
 * @param {File} file - 参考字表文件（.xlsx、.xls 或 .csv）
 * @param {Object} [options] - 附加选项
 * @param {Object|null} [options.columnMapping] - 参考表列匹配结果
 * @param {number|null} [options.headerRowIndex] - 表头所在行（从 0 开始）
 * @param {string|null} [options.sheetName] - 选中的工作表名称
 * @returns {Promise<ReferenceUploadResponse>} 上传结果
 * @throws {Error} 上传失败
 * @example
 * const result = await uploadReference(referenceFile, {
 *   columnMapping: { char: 'column_1', pronunciation: 'column_2' }
 * })
 * console.log(result.task_id) // "task-uuid-xxx"
 */
export async function uploadReference(file, options = {}) {
  const formData = new FormData()
  formData.append('file', file)

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
    return await api('/api/tools/merge/upload_reference', {
      method: 'POST',
      body: formData
    })
  } catch (error) {
    console.error('Upload reference error:', error)
    showError(error.message || '參考字表上傳失敗')
    throw new Error(error.message || '參考字表上傳失敗')
  }
}

/**
 * 上传待合并文件
 * @param {string} taskId - 任务ID
 * @param {File[]} files - 待合并文件数组
 * @returns {Promise<{message: string, file_count: number}>} 上传结果
 * @throws {Error} 上传失败
 * @example
 * const result = await uploadFiles(taskId, [file1, file2])
 * console.log(result.file_count) // 2
 */
export async function uploadFiles(taskId, files) {
  const formData = new FormData()
  formData.append('task_id', taskId)  // task_id 必须在 FormData 中
  files.forEach(file => {
    formData.append('files', file)
  })

  try {
    return await api('/api/tools/merge/upload_files', {
      method: 'POST',
      body: formData
    })
  } catch (error) {
    console.error('Upload files error:', error)
    showError(error.message || '待合併文件上傳失敗')
    throw new Error(error.message || '待合併文件上傳失敗')
  }
}

/**
 * 执行合并任务
 * @param {string} taskId - 任务ID
 * @returns {Promise<{message: string}>} 执行结果
 * @throws {Error} 执行失败
 * @example
 * await executeMerge(taskId)
 */
export async function executeMerge(taskId) {
  try {
    return await api('/api/tools/merge/execute', {
      method: 'POST',
      body: { task_id: taskId }
    })
  } catch (error) {
    console.error('Execute merge error:', error)
    showError(error.message || '合併執行失敗')
    throw new Error(error.message || '合併執行失敗')
  }
}

/**
 * 获取合并进度
 * @param {string} taskId - 任务ID
 * @returns {Promise<MergeProgress>} 进度信息
 * @throws {Error} 获取进度失败
 * @example
 * const progress = await getMergeProgress(taskId)
 * console.log(progress.progress) // 75
 */
export async function getMergeProgress(taskId) {
  try {
    return await api(`/api/tools/merge/progress/${taskId}`)
  } catch (error) {
    console.error('Get merge progress error:', error)
    showError(error.message || '獲取合併進度失敗')
    throw new Error(error.message || '獲取合併進度失敗')
  }
}

/**
 * 下载合并结果
 * @param {string} taskId - 任务ID
 * @returns {Promise<Blob>} 文件Blob
 * @throws {Error} 下载失败
 * @example
 * const blob = await downloadMerge(taskId)
 * const url = URL.createObjectURL(blob)
 * const a = document.createElement('a')
 * a.href = url
 * a.download = 'merged_result.xlsx'
 * a.click()
 */
export async function downloadMerge(taskId) {
  try {
    return await api(`/api/tools/merge/download/${taskId}`, {
      responseType: 'blob'
    })
  } catch (error) {
    console.error('Download merge error:', error)
    showError(error.message || '下載合併結果失敗')
    throw new Error(error.message || '下載合併結果失敗')
  }
}
