// composables/Praat.js - 完整的 Praat 声学分析 API
import { api } from '../../auth/httpClient.js'

/**
 * Praat 声学分析 API
 * 涵盖所有后端端点：上传管理 + 任务管理 + 能力查询
 */
export function praat() {
  const isJobNotFoundError = (error) => {
    return error?.status === 404 && error?.detail?.error?.code === 'JOB_NOT_FOUND'
  }

  const logApiError = (label, error, { suppressJobNotFound = false } = {}) => {
    if (suppressJobNotFound && isJobNotFoundError(error)) {
      return
    }

    console.error(label, error)
  }

  const rethrowOriginalError = (error, fallbackMessage) => {
    if (error instanceof Error) {
      if (!error.message) {
        error.message = fallbackMessage
      }

      throw error
    }

    throw new Error(fallbackMessage)
  }

  // ========== 1. 能力查询 ==========

  /**
   * 获取后端能力（支持的格式、模块、限制）
   * @returns {Promise<Object>} 后端能力信息
   * @example
   * const caps = await getCapabilities()
   * console.log(caps.supported_input_formats) // ["wav", "mp3", "m4a",
   ...]
   * console.log(caps.limits.max_upload_mb)    // 50
   */
  const getCapabilities = async () => {
    try {
      return await api('/api/tools/praat/capabilities')
    } catch (error) {
      console.error('Get capabilities error:', error)
      throw new Error(error.message || '獲取後端能力失敗')
    }
  }


  // ========== 2. 上传管理（Upload API）==========

  /**
   * 上传音频文件（自动规范化为 16kHz mono WAV）
   * @param {File} file - 音频文件对象
   * @param {Object} options - 上传选项
   * @param {boolean} options.retain_original - 是否保留原始文件（默认
   false）
   * @returns {Promise<Object>} 上传结果
   * @example
   * const result = await uploadAudio(audioFile, { retain_original: true
   })
   * console.log(result.task_id)           // "praat_abc123"
   * console.log(result.normalized_meta)   // { duration_s: 3.42,
   sample_rate: 16000, ... }
   */
  const uploadAudio = async (file, options = {}) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (options.retain_original) {
        formData.append('retain_original', 'true')
      }

      return await api('/api/tools/praat/uploads', {
        method: 'POST',
        body: formData,
        headers: {} // 让浏览器自动设置 Content-Type (multipart/form-data)
      })
    } catch (error) {
      console.error('Upload audio error:', error)
      throw new Error(error.message || '音頻上傳失敗，請重試')
    }
  }

  /**
   * 查询上传信息（音频元数据）
   * @param {string} taskId - 任务 ID（上传返回的 task_id）
   * @returns {Promise<Object>} 上传信息
   * @example
   * const info = await getUploadInfo(taskId)
   * console.log(info.audio_metadata.duration_s)  // 3.42
   * console.log(info.has_normalized)             // true
   */
  const getUploadInfo = async (taskId) => {
    try {
      return await api(`/api/tools/praat/uploads/progress/${taskId}`)
    } catch (error) {
      console.error('Get upload info error:', error)
      throw new Error(error.message || '獲取上傳信息失敗')
    }
  }

  /**
   * 下载规范化后的音频（16kHz mono WAV）
   * @param {string} taskId - 任务 ID
   * @returns {Promise<Blob>} 音频文件 Blob
   * @example
   * const audioBlob = await downloadNormalizedAudio(taskId)
   * const url = URL.createObjectURL(audioBlob)
   * audioElement.src = url // 播放规范化音频
   */
  const downloadNormalizedAudio = async (taskId) => {
    try {
      const response = await
          fetch(`/api/tools/praat/uploads/progress/${taskId}/audio`, {
            method: 'GET',
            credentials: 'include' // 如果需要认证
          })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.blob()
    } catch (error) {
      console.error('Download audio error:', error)
      throw new Error(error.message || '下載音頻失敗')
    }
  }

  /**
   * 删除上传任务（清理音频文件和所有关联的分析任务）
   * @param {string} taskId - 任务 ID
   * @returns {Promise<Object>} 删除结果
   * @example
   * await deleteUpload(taskId)
   */
  const deleteUpload = async (taskId) => {
    try {
      return await api(`/api/tools/praat/uploads/progress/${taskId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Delete upload error:', error)
      throw new Error(error.message || '刪除上傳失敗')
    }
  }


  // ========== 3. 分析任务管理（Job API）==========

  /**
   * Transform frontend settings structure to backend API structure
   * Frontend uses flat structure: pitch_options, formant_options, etc.
   * Backend expects nested structure: options.pitch, options.formant, etc.
   */
  const transformSettingsForAPI = (settings) => {
    const transformed = {
      mode: settings.mode,
      modules: settings.modules
    }

    // Build nested options object from flat *_options fields
    const options = {}

    if (settings.pitch_options) {
      options.pitch = settings.pitch_options
    }

    if (settings.formant_options) {
      options.formant = settings.formant_options
    }

    if (settings.intensity_options) {
      options.intensity = settings.intensity_options
    }

    if (settings.spectrogram_options) {
      options.spectrogram = settings.spectrogram_options
    }

    if (settings.voice_quality_options) {
      options.voice_quality = settings.voice_quality_options
    }

    if (settings.segments_options) {
      options.segments = settings.segments_options
    }

    // Only add options if there are any
    if (Object.keys(options).length > 0) {
      transformed.options = options
    }

    // Rename output_options to output
    if (settings.output_options) {
      transformed.output = settings.output_options
    }

    return transformed
  }

  /**
   * 创建声学分析任务
   * @param {string} uploadId - 上传 ID（即 task_id）
   * @param {Object} settings - 分析设置
   * @param {'single'|'continuous'} settings.mode - 分析模式
   * @param {string[]} settings.modules - 启用的模块 ["basic", "pitch",
   "intensity", "formant", "voice_quality", "segments"]
   * @param {Object} settings.options - 模块参数（可选）
   * @param {Object} settings.output - 输出选项（可选）
   * @returns {Promise<Object>} 任务创建结果
   * @example
   * const job = await createJob(uploadId, {
   *   mode: 'single',
   *   modules: ['basic', 'pitch', 'intensity', 'formant',
   'voice_quality', 'segments'],
   *   options: {
   *     pitch: { f0_min: 75, f0_max: 600 },
   *     formant: { max_formants: 5 }
   *   },
   *   output: {
   *     include_timeseries: true,
   *     downsample_hz: 100
   *   }
   * })
   * console.log(job.job_id) // "praat_abc123_job_1"
   */
  const createJob = async (uploadId, settings) => {
    try {
      // Transform settings to match backend API structure
      const transformedSettings = transformSettingsForAPI(settings)

      // Debug logging (can be removed after verification)
      console.log('[Praat API] Original settings:', settings)
      console.log('[Praat API] Transformed settings:', transformedSettings)

      return await api('/api/tools/praat/jobs', {
        method: 'POST',
        body: {
          upload_id: uploadId,
          ...transformedSettings
        }
        // ✅ 不需要手动 JSON.stringify，api() 会自动处理
      })
    } catch (error) {
      console.error('Create job error:', error)
      throw new Error(error.message || '創建分析任務失敗，請重試')
    }
  }

  /**
   * 查询任务状态
   * @param {string} jobId - 任务 ID（格式：praat_xxx_job_1）
   * @returns {Promise<Object>} 任务状态
   * @example
   * const status = await getJobStatus(jobId)
   * console.log(status.status)   // "queued" | "processing" | "completed"
   | "failed"
   * console.log(status.progress) // 0.0 - 100.0
   * console.log(status.stage)    // "pitch" | "formant" | "finalize"
   */
  const getJobStatus = async (jobId) => {
    try {
      return await api(`/api/tools/praat/jobs/progress/${jobId}`, {
        showError: false
      })
    } catch (error) {
      logApiError('Get job status error:', error, { suppressJobNotFound: true })
      rethrowOriginalError(error, '獲取任務狀態失敗')
    }
  }

  /**
   * 获取分析结果
   * @param {string} jobId - 任务 ID
   * @param {'full'|'summary'|'timeseries'} view - 结果视图（默认 full）
   * @returns {Promise<Object>} 分析结果 JSON
   * @example
   * const result = await getJobResult(jobId, 'full')
   * console.log(result.summary.pitch.mean_f0)              // 平均基频
   * console.log(result.summary.voice_quality.hnr.mean_db) // HNR
   * console.log(result.segments[0].tone_features)         // 调型特征
   */
  const getJobResult = async (jobId, view = 'full') => {
    try {
      return await api(`/api/tools/praat/jobs/progress/${jobId}/result?view=${view}`, {
        showError: false
      })
    } catch (error) {
      logApiError('Get job result error:', error, { suppressJobNotFound: true })
      rethrowOriginalError(error, '獲取分析結果失敗')
    }
  }

  /**
   * 取消/删除分析任务（best-effort）
   * @param {string} jobId - 任务 ID
   * @returns {Promise<Object>} 取消结果
   * @example
   * await cancelJob(jobId)
   */
  const cancelJob = async (jobId) => {
    try {
      return await api(`/api/tools/praat/jobs/progress/${jobId}`, {
        method: 'DELETE',
        showError: false
      })
    } catch (error) {
      logApiError('Cancel job error:', error)
      rethrowOriginalError(error, '取消任務失敗')
    }
  }

  /**
   * 上报本地 Praat 分析记录，用于排行榜与统计。
   * 本接口只同步 run metadata / summary，不上传原始音频。
   */
  const reportLocalPraatRun = async (payload) => {
    try {
      return await api('/api/tools/praat/local-runs', {
        method: 'POST',
        body: payload,
      })
    } catch (error) {
      console.error('Report local Praat run error:', error)
      throw new Error(error.message || '同步本地 Praat 分析記錄失敗')
    }
  }


  // ========== 4. 高级功能：轮询任务直到完成 ==========

  /**
   * 轮询任务状态直到完成（自动重试）
   * @param {string} jobId - 任务 ID
   * @param {Object} options - 轮询选项
   * @param {number} options.interval - 轮询间隔（毫秒，默认 2000）
   * @param {number} options.timeout - 超时时间（毫秒，默认 300000 =
   5分钟）
   * @param {Function} options.onProgress - 进度回调 (status) => void
   * @returns {Promise<Object>} 最终任务状态
   * @throws {Error} 超时、任务失败或取消
   * @example
   * const finalStatus = await pollUntilComplete(jobId, {
   *   interval: 2000,
   *   onProgress: (status) => {
   *     console.log(`進度: ${status.progress}%，階段: ${status.stage}`)
   *   }
   * })
   *
   * // 然后获取结果
   * const result = await getJobResult(jobId)
   */
  const pollUntilComplete = async (jobId, options = {}) => {
    const {
      interval = 2000,
      timeout = 300000,
      onProgress = null
    } = options

    const startTime = Date.now()

    while (true) {
      // 检查超时
      if (Date.now() - startTime > timeout) {
        throw new Error('任務輪詢超時（5分鐘）')
      }

      // 获取状态
      const status = await getJobStatus(jobId)

      // 调用进度回调
      if (onProgress) {
        onProgress(status)
      }

      // 检查完成状态
      if (status.status === 'completed') {
        return status
      } else if (status.status === 'failed') {
        throw new Error(status.error || '任務執行失敗')
      } else if (status.status === 'canceled') {
        throw new Error('任務已取消')
      }

      // 等待下一次轮询
      await new Promise(resolve => setTimeout(resolve, interval))
    }
  }


  // ========== 5. 一键式分析（便捷方法）==========

  /**
   * 一键式分析：上传 + 创建任务 + 轮询 + 获取结果
   * @param {File} file - 音频文件
   * @param {Object} settings - 分析设置
   * @param {Function} onProgress - 进度回调（可选）
   * @returns {Promise<Object>} 分析结果
   * @example
   * const result = await analyzeAudio(audioFile, {
   *   mode: 'single',
   *   modules: ['basic', 'pitch', 'segments']
   * }, (status) => {
   *   console.log(`進度: ${status.progress}%`)
   * })
   *
   * console.log(result.summary)
   * console.log(result.segments[0].tone_features)
   */
  const analyzeAudio = async (file, settings, onProgress = null) => {
    try {
      // 1. 上传音频
      console.log('[1/3] 上傳音頻...')
      const uploadResult = await uploadAudio(file)
      const taskId = uploadResult.task_id

      // 2. 创建分析任务
      console.log('[2/3] 創建分析任務...')
      const jobResult = await createJob(taskId, settings)
      const jobId = jobResult.job_id

      // 3. 轮询直到完成
      console.log('[3/3] 分析中...')
      await pollUntilComplete(jobId, {
        onProgress: onProgress
      })

      // 4. 获取结果
      console.log('✅ 分析完成，獲取結果...')
      const result = await getJobResult(jobId, 'full')

      return result

    } catch (error) {
      console.error('Analyze audio error:', error)
      throw error
    }
  }


  // ========== 导出所有方法 ==========
  return {
    // 能力查询
    getCapabilities,

    // 上传管理
    uploadAudio,
    getUploadInfo,
    downloadNormalizedAudio,
    deleteUpload,

    // 任务管理
    createJob,
    getJobStatus,
    getJobResult,
    cancelJob,
    reportLocalPraatRun,

    // 高级功能
    pollUntilComplete,
    analyzeAudio  // 一键式分析
  }
}

export const usePraatApi = praat


// ========== TypeScript 类型定义（可选）==========

/**
 * @typedef {Object} Capabilities
 * @property {string[]} supported_input_formats - 支持的输入格式
 * @property {string[]} modes - 支持的分析模式
 * @property {Object} modules - 支持的模块及其参数
 * @property {Object} limits - 限制（max_duration_s, max_upload_mb）
 * @property {boolean} ffmpeg_available - FFmpeg 是否可用
 */

/**
 * @typedef {Object} UploadResult
 * @property {string} task_id - 任务 ID
 * @property {string} source_filename - 原始文件名
 * @property {string} detected_mime - 检测到的 MIME 类型
 * @property {Object} normalized_meta - 规范化音频元数据
 * @property {number} normalized_meta.duration_s - 时长（秒）
 * @property {number} normalized_meta.sample_rate - 采样率（Hz）
 * @property {number} normalized_meta.channels - 声道数
 */

/**
 * @typedef {Object} JobStatus
 * @property {string} job_id - 任务 ID
 * @property {'queued'|'processing'|'completed'|'failed'|'canceled'}
 status - 任务状态
 * @property {number} progress - 进度（0-100）
 * @property {string} stage - 当前阶段
 * @property {string} error - 错误信息（如果失败）
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {string} schema - 结果 schema 版本
 * @property {Object} meta - 元信息
 * @property {Object} summary - 统计摘要（各模块）
 * @property {Object} timeseries - 时序曲线数据
 * @property {Array} segments - 分段信息
 * @property {Array} units - 音节级单位
 */
