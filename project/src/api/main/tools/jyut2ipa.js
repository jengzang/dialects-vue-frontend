// api/tools/jyut2ipa.js - 粤拼转IPA工具 API
import { api } from '../../auth/httpClient.js'
import { showError } from '@/utils/message.js'

/**
 * @typedef {Object} Jyut2IpaUploadResponse
 * @property {string} task_id - 任务ID
 * @property {string} filename - 文件名
 * @property {string} message - 消息
 */

/**
 * 上传粤拼文件
 * @param {File} file - 粤拼文件（.xlsx 或 .xls）
 * @param {Object} [options] - 附加选项
 * @param {Object|null} [options.columnMapping] - 列匹配结果
 * @param {number|null} [options.headerRowIndex] - 表头所在行（从 0 开始）
 * @param {string|null} [options.sheetName] - 选中的工作表名称
 * @returns {Promise<Jyut2IpaUploadResponse>} 上传结果
 * @throws {Error} 上传失败
 * @example
 * const result = await uploadJyutFile(file, {
 *   columnMapping: { jyutping: 'column_1', char: 'column_2' }
 * })
 * console.log(result.task_id)
 */
export async function uploadJyutFile(file, options = {}) {
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
    return await api('/api/tools/jyut2ipa/upload', {
      method: 'POST',
      body: formData
    })
  } catch (error) {
    console.error('Upload jyut file error:', error)
    showError(error.message || '粵拼文件上傳失敗')
    throw new Error(error.message || '粵拼文件上傳失敗')
  }
}

/**
 * 开始粤拼转IPA处理
 * @param {string} taskId - 任务ID
 * @returns {Promise<{message: string}>} 处理结果
 * @throws {Error} 处理失败
 * @example
 * await processJyut2Ipa(taskId)
 */
export async function processJyut2Ipa(taskId, customRules = []) {
  try {
    const body = { task_id: taskId }
    if (Array.isArray(customRules) && customRules.length > 0) {
      body.custom_rules = customRules.map(({ to_replace, replacement, category, enabled }) => ({
        to_replace,
        replacement,
        category,
        enabled
      }))
    }
    return await api('/api/tools/jyut2ipa/process', {
      method: 'POST',
      body
    })
  } catch (error) {
    console.error('Process jyut2ipa error:', error)
    showError(error.message || '粵拼轉IPA處理失敗')
    throw new Error(error.message || '粵拼轉IPA處理失敗')
  }
}

/**
 * 获取粤拼转IPA进度
 * @param {string} taskId - 任务ID
 * @returns {Promise<Jyut2IpaProgress>} 进度信息
 * @throws {Error} 获取进度失败
 * @example
 * const progress = await getJyut2IpaProgress(taskId)
 * console.log(progress.progress) // 50
 */
export async function getJyut2IpaProgress(taskId) {
  try {
    return await api(`/api/tools/jyut2ipa/progress/${taskId}`)
  } catch (error) {
    console.error('Get jyut2ipa progress error:', error)
    showError(error.message || '獲取轉換進度失敗')
    throw new Error(error.message || '獲取轉換進度失敗')
  }
}

/**
 * 下载粤拼转IPA结果
 * @param {string} taskId - 任务ID
 * @returns {Promise<Blob>} 文件Blob
 * @throws {Error} 下载失败
 * @example
 * const blob = await downloadJyut2IpaResult(taskId)
 * const url = URL.createObjectURL(blob)
 * const a = document.createElement('a')
 * a.href = url
 * a.download = 'jyut2ipa_result.xlsx'
 * a.click()
 */
export async function downloadJyut2IpaResult(taskId) {
  try {
    return await api(`/api/tools/jyut2ipa/download/${taskId}`, {
      responseType: 'blob'
    })
  } catch (error) {
    console.error('Download jyut2ipa result error:', error)
    showError(error.message || '下載轉換結果失敗')
    throw new Error(error.message || '下載轉換結果失敗')
  }
}
