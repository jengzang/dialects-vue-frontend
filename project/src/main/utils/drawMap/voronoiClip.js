import {
  CLIP_DIAGNOSTICS_NAMESPACE,
  clipVoronoiFeatureCollectionToNationalBorderSync,
  logClipDiagnostics,
  prepareNationalBorderForVoronoiClip,
} from '@/main/utils/drawMap/voronoiClipCore.js'

const VoronoiClipWorker = typeof Worker !== 'undefined'
  ? new Worker(new URL('./voronoiClip.worker.js', import.meta.url), { type: 'module' })
  : null

let requestIdSeed = 0
const pendingWorkerRequests = new Map()

function toCloneableValue(value) {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => toCloneableValue(item))
  }

  if (value instanceof Map) {
    return {
      __type: 'Map',
      entries: Array.from(value.entries()).map(([key, item]) => [toCloneableValue(key), toCloneableValue(item)]),
    }
  }

  if (value instanceof Set) {
    return {
      __type: 'Set',
      values: Array.from(value.values()).map((item) => toCloneableValue(item)),
    }
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const plainObject = {}
  Object.entries(value).forEach(([key, item]) => {
    plainObject[key] = toCloneableValue(item)
  })
  return plainObject
}

function toCloneablePayload(payload) {
  return JSON.parse(JSON.stringify(toCloneableValue(payload)))
}

if (VoronoiClipWorker) {
  VoronoiClipWorker.onmessage = (event) => {
    const { requestId, ok, featureCollection, diagnostics, error } = event.data ?? {}
    const pending = pendingWorkerRequests.get(requestId)
    if (!pending) return

    pendingWorkerRequests.delete(requestId)
    if (!ok) {
      pending.reject(new Error(error || 'Voronoi clip worker failed'))
      return
    }

    if (diagnostics) {
      logClipDiagnostics({ ...diagnostics, mode: 'worker' })
    }
    pending.resolve(featureCollection)
  }
}

export {
  CLIP_DIAGNOSTICS_NAMESPACE,
  logClipDiagnostics,
  prepareNationalBorderForVoronoiClip,
}

export async function clipVoronoiFeatureCollectionToNationalBorder(sourceCollection, preparedBorderData = { entries: [] }) {
  if (!VoronoiClipWorker) {
    const result = clipVoronoiFeatureCollectionToNationalBorderSync(sourceCollection, preparedBorderData)
    logClipDiagnostics({ ...result.diagnostics, mode: 'sync-fallback' })
    return result.featureCollection
  }

  requestIdSeed += 1
  const requestId = `voronoi-clip-${requestIdSeed}`

  return new Promise((resolve, reject) => {
    pendingWorkerRequests.set(requestId, { resolve, reject })
    VoronoiClipWorker.postMessage(toCloneablePayload({
      requestId,
      sourceCollection,
      preparedBorderData,
    }))
  })
}
