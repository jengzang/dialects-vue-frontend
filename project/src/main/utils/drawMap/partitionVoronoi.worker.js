import { calculatePartitionVoronoi } from '@/main/utils/drawMap/partitionVoronoi.js'

self.onmessage = (event) => {
  const { requestId, points, level, colorMap, expandRatio } = event.data ?? {}

  try {
    const result = calculatePartitionVoronoi(points, level, colorMap, expandRatio)
    self.postMessage({
      requestId,
      ok: true,
      result,
    })
  } catch (error) {
    self.postMessage({
      requestId,
      ok: false,
      error: error?.message ?? String(error),
    })
  }
}
