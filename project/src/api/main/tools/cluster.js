import { api } from '../../auth/httpClient.js'

function normalizePercentProgress(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  const normalizedValue = numericValue <= 1 && numericValue >= 0
    ? numericValue * 100
    : numericValue

  return Math.max(0, Math.min(100, Math.round(normalizedValue)))
}

function normalizeTaskPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload
  }

  return {
    ...payload,
    progress: normalizePercentProgress(payload.progress)
  }
}

function rethrowClusterError(error, fallbackMessage) {
  if (error instanceof Error) {
    if (!error.message) {
      error.message = fallbackMessage
    }

    throw error
  }

  throw new Error(fallbackMessage)
}

export function useClusterApi() {
  const previewCluster = async (requestDraft) => {
    try {
      return await api('/api/tools/cluster/staged/preview', {
        method: 'POST',
        body: requestDraft,
        showError: false
      })
    } catch (error) {
      console.error('Preview cluster error:', error)
      rethrowClusterError(error, '聚类预览失败')
    }
  }

  const prepareCluster = async (prepareHash) => {
    try {
      const response = await api('/api/tools/cluster/staged/prepare', {
        method: 'POST',
        body: {
          prepare_hash: prepareHash
        },
        showError: false
      })

      return normalizeTaskPayload(response)
    } catch (error) {
      console.error('Prepare cluster error:', error)
      rethrowClusterError(error, '聚类 prepare 阶段失败')
    }
  }

  const buildClusterDistance = async (prepareHash, phonemeMode) => {
    try {
      const response = await api('/api/tools/cluster/staged/distances', {
        method: 'POST',
        body: {
          prepare_hash: prepareHash,
          phoneme_mode: phonemeMode
        },
        showError: false
      })

      return normalizeTaskPayload(response)
    } catch (error) {
      console.error('Build cluster distance error:', error)
      rethrowClusterError(error, '聚类 distance 阶段失败')
    }
  }

  const runClusterStage = async (distanceHash, clustering) => {
    try {
      const response = await api('/api/tools/cluster/staged/clusters', {
        method: 'POST',
        body: {
          distance_hash: distanceHash,
          clustering
        },
        showError: false
      })

      return normalizeTaskPayload(response)
    } catch (error) {
      console.error('Run cluster stage error:', error)
      rethrowClusterError(error, '聚类 cluster 阶段失败')
    }
  }

  const runClusterJob = async (fullRequest) => {
    try {
      const response = await api('/api/tools/cluster/jobs', {
        method: 'POST',
        body: fullRequest,
        showError: false
      })

      return normalizeTaskPayload(response)
    } catch (error) {
      console.error('Run cluster job error:', error)
      rethrowClusterError(error, '聚类任务创建失败')
    }
  }

  const getClusterJobStatus = async (taskId) => {
    try {
      const response = await api(`/api/tools/cluster/jobs/${taskId}`, {
        showError: false
      })

      return normalizeTaskPayload(response)
    } catch (error) {
      console.error('Get cluster job status error:', error)
      rethrowClusterError(error, '获取聚类任务状态失败')
    }
  }

  const getClusterJobResult = async (taskId) => {
    try {
      return await api(`/api/tools/cluster/jobs/${taskId}/result`, {
        showError: false
      })
    } catch (error) {
      console.error('Get cluster job result error:', error)
      rethrowClusterError(error, '获取聚类任务结果失败')
    }
  }

  const getClusterStagedResult = async (resultHash) => {
    try {
      return await api(`/api/tools/cluster/staged/results/${resultHash}`, {
        showError: false
      })
    } catch (error) {
      console.error('Get cluster staged result error:', error)
      rethrowClusterError(error, '获取 staged 聚类结果失败')
    }
  }

  return {
    previewCluster,
    prepareCluster,
    buildClusterDistance,
    runClusterStage,
    runClusterJob,
    getClusterJobStatus,
    getClusterJobResult,
    getClusterStagedResult
  }
}

