import { clipVoronoiFeatureCollectionToNationalBorderSync } from '@/utils/map/voronoiClipCore.js'

self.onmessage = (event) => {
  const { requestId, sourceCollection, preparedBorderData } = event.data ?? {}

  try {
    const result = clipVoronoiFeatureCollectionToNationalBorderSync(sourceCollection, preparedBorderData)
    self.postMessage({
      requestId,
      ok: true,
      featureCollection: result.featureCollection,
      diagnostics: result.diagnostics,
    })
  } catch (error) {
    self.postMessage({
      requestId,
      ok: false,
      error: error?.message ?? String(error),
    })
  }
}
