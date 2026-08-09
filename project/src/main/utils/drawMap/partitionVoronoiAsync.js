import { calculatePartitionVoronoi } from '@/main/utils/drawMap/partitionVoronoi.js'

let requestIdSeed = 0
const pendingWorkerRequests = new Map()
let partitionVoronoiWorker = null
let workerDisabled = false

function toCloneablePayload(payload) {
  return JSON.parse(JSON.stringify(payload))
}

function runSyncFallback(points, level, colorMap, expandRatio) {
  return calculatePartitionVoronoi(points, level, colorMap, expandRatio)
}

function fallbackPendingWorkerRequests() {
  pendingWorkerRequests.forEach(({ resolve, points, level, colorMap, expandRatio }) => {
    resolve(runSyncFallback(points, level, colorMap, expandRatio))
  })
  pendingWorkerRequests.clear()
}

function getPartitionVoronoiWorker() {
  if (workerDisabled || typeof Worker === 'undefined') return null
  if (partitionVoronoiWorker) return partitionVoronoiWorker

  try {
    partitionVoronoiWorker = new Worker(new URL('./partitionVoronoi.worker.js', import.meta.url), { type: 'module' })
  } catch {
    workerDisabled = true
    return null
  }

  partitionVoronoiWorker.onmessage = (event) => {
    const { requestId, ok, result, error } = event.data ?? {}
    const pending = pendingWorkerRequests.get(requestId)
    if (!pending) return

    pendingWorkerRequests.delete(requestId)
    if (!ok) {
      pending.reject(new Error(error || 'Partition Voronoi worker failed'))
      return
    }

    pending.resolve(result)
  }

  partitionVoronoiWorker.onerror = () => {
    workerDisabled = true
    partitionVoronoiWorker?.terminate?.()
    partitionVoronoiWorker = null
    fallbackPendingWorkerRequests()
  }

  return partitionVoronoiWorker
}

export async function calculatePartitionVoronoiAsync(points, level = 3, colorMap = {}, expandRatio = 30) {
  const worker = getPartitionVoronoiWorker()
  if (!worker) {
    return runSyncFallback(points, level, colorMap, expandRatio)
  }

  requestIdSeed += 1
  const requestId = `partition-voronoi-${requestIdSeed}`

  return new Promise((resolve, reject) => {
    pendingWorkerRequests.set(requestId, { resolve, reject, points, level, colorMap, expandRatio })
    try {
      worker.postMessage(toCloneablePayload({
        requestId,
        points,
        level,
        colorMap,
        expandRatio,
      }))
    } catch {
      pendingWorkerRequests.delete(requestId)
      workerDisabled = true
      partitionVoronoiWorker?.terminate?.()
      partitionVoronoiWorker = null
      resolve(runSyncFallback(points, level, colorMap, expandRatio))
    }
  })
}
