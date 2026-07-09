import { bbox, booleanIntersects, featureCollection, intersect } from '@turf/turf'

import { splitFeatureCollectionByGeometryType } from '@/main/utils/drawMap/export.js'

export const BORDER_GRID_STEP = 4
export const CLIP_DIAGNOSTICS_NAMESPACE = '[voronoiClip]'

export function emptyFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: [],
  }
}

export function hasBboxOverlap(sourceBbox, targetBbox) {
  if (!Array.isArray(sourceBbox) || !Array.isArray(targetBbox)) return false
  return !(
    sourceBbox[2] < targetBbox[0]
    || sourceBbox[0] > targetBbox[2]
    || sourceBbox[3] < targetBbox[1]
    || sourceBbox[1] > targetBbox[3]
  )
}

function buildPolygonFeatureCollection(featureCollectionValue) {
  const geometryGroups = splitFeatureCollectionByGeometryType(featureCollectionValue)
  const polygonGroup = geometryGroups.find((group) => group.geometryType === 'Polygon')
  return polygonGroup?.featureCollection ?? emptyFeatureCollection()
}

function getGridRange(value, step = BORDER_GRID_STEP) {
  return Math.floor(value / step)
}

function buildGridCellKey(x, y) {
  return `${x}:${y}`
}

function collectGridCellKeys(targetBbox, step = BORDER_GRID_STEP) {
  if (!Array.isArray(targetBbox)) return []

  const minX = getGridRange(targetBbox[0], step)
  const maxX = getGridRange(targetBbox[2], step)
  const minY = getGridRange(targetBbox[1], step)
  const maxY = getGridRange(targetBbox[3], step)
  const keys = []

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      keys.push(buildGridCellKey(x, y))
    }
  }

  return keys
}

function createPreparedBorderEntry(feature) {
  const targetBbox = bbox(feature)
  return {
    feature,
    bbox: targetBbox,
    gridKeys: collectGridCellKeys(targetBbox),
  }
}

function buildPreparedBorderIndex(entries) {
  const cellMap = new Map()

  entries.forEach((entry, entryIndex) => {
    entry.gridKeys.forEach((gridKey) => {
      if (!cellMap.has(gridKey)) {
        cellMap.set(gridKey, [])
      }
      cellMap.get(gridKey).push(entryIndex)
    })
  })

  return {
    cellMap,
    step: BORDER_GRID_STEP,
  }
}

function serializePreparedBorderIndex(index) {
  return {
    step: index.step,
    cellMapEntries: Array.from(index.cellMap.entries()),
  }
}

export function hydratePreparedBorderData(preparedBorderData) {
  if (!preparedBorderData) {
    return {
      entries: [],
      index: { cellMap: new Map(), step: BORDER_GRID_STEP },
      diagnostics: { borderPolygonCount: 0, gridCellCount: 0 },
    }
  }

  const rawEntries = preparedBorderData.entries ?? []
  const rawIndex = preparedBorderData.index ?? { step: BORDER_GRID_STEP }

  return {
    entries: rawEntries,
    index: {
      step: rawIndex.step ?? BORDER_GRID_STEP,
      cellMap: rawIndex.cellMap instanceof Map
        ? rawIndex.cellMap
        : new Map(rawIndex.cellMapEntries ?? []),
    },
    diagnostics: preparedBorderData.diagnostics ?? {
      borderPolygonCount: rawEntries.length,
      gridCellCount: rawEntries.reduce((count, entry) => count + (entry.gridKeys?.length ?? 0), 0),
    },
  }
}

function collectCandidateEntries(sourceBbox, preparedBorderData) {
  const entries = preparedBorderData?.entries ?? []
  const index = preparedBorderData?.index
  if (!index?.cellMap) {
    return entries.filter((entry) => hasBboxOverlap(sourceBbox, entry?.bbox))
  }

  const candidateIndexes = new Set()
  const gridKeys = collectGridCellKeys(sourceBbox, index.step)
  gridKeys.forEach((gridKey) => {
    const matchedIndexes = index.cellMap.get(gridKey) ?? []
    matchedIndexes.forEach((entryIndex) => {
      candidateIndexes.add(entryIndex)
    })
  })

  return Array.from(candidateIndexes)
    .map((entryIndex) => entries[entryIndex])
    .filter((entry) => hasBboxOverlap(sourceBbox, entry?.bbox))
}

export function logClipDiagnostics(summary) {
  console.log(CLIP_DIAGNOSTICS_NAMESPACE, summary)
}

export function prepareNationalBorderForVoronoiClip(featureCollectionValue) {
  const polygonCollection = buildPolygonFeatureCollection(featureCollectionValue)
  const entries = (polygonCollection.features ?? []).map((feature) => createPreparedBorderEntry(feature))
  const index = buildPreparedBorderIndex(entries)

  return {
    entries,
    index: serializePreparedBorderIndex(index),
    diagnostics: {
      borderPolygonCount: entries.length,
      gridCellCount: entries.reduce((count, entry) => count + entry.gridKeys.length, 0),
    },
  }
}

export function clipVoronoiFeatureCollectionToNationalBorderSync(sourceCollection, preparedBorderData = { entries: [] }) {
  const hydratedBorderData = hydratePreparedBorderData(preparedBorderData)
  const sourceFeatures = sourceCollection?.features ?? []
  const clippedFeatures = []
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()

  const diagnostics = {
    sourceFeatureCount: sourceFeatures.length,
    borderPolygonCount: hydratedBorderData?.entries?.length ?? 0,
    totalCandidateCount: 0,
    maxCandidateCount: 0,
    intersectedCandidateCount: 0,
    clippedFeatureCount: 0,
  }

  sourceFeatures.forEach((feature) => {
    if (!feature?.geometry) return

    const sourceBbox = bbox(feature)
    const candidateEntries = collectCandidateEntries(sourceBbox, hydratedBorderData)
    diagnostics.totalCandidateCount += candidateEntries.length
    diagnostics.maxCandidateCount = Math.max(diagnostics.maxCandidateCount, candidateEntries.length)

    candidateEntries.forEach((entry) => {
      const borderFeature = entry?.feature
      if (!borderFeature?.geometry) return
      if (!booleanIntersects(feature, borderFeature)) return
      diagnostics.intersectedCandidateCount += 1

      const clipped = intersect(featureCollection([feature, borderFeature]))
      if (!clipped?.geometry) return

      clippedFeatures.push({
        ...clipped,
        id: feature.id,
        properties: {
          ...(feature.properties ?? {}),
          ...(clipped.properties ?? {}),
        },
      })
    })
  })

  diagnostics.clippedFeatureCount = clippedFeatures.length
  const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()

  return {
    featureCollection: {
      ...emptyFeatureCollection(),
      features: clippedFeatures,
    },
    diagnostics: {
      stage: 'clip-voronoi',
      durationMs: Number((endedAt - startedAt).toFixed(2)),
      sourceFeatureCount: diagnostics.sourceFeatureCount,
      borderPolygonCount: diagnostics.borderPolygonCount,
      totalCandidateCount: diagnostics.totalCandidateCount,
      averageCandidateCount: diagnostics.sourceFeatureCount > 0
        ? Number((diagnostics.totalCandidateCount / diagnostics.sourceFeatureCount).toFixed(2))
        : 0,
      maxCandidateCount: diagnostics.maxCandidateCount,
      intersectedCandidateCount: diagnostics.intersectedCandidateCount,
      clippedFeatureCount: diagnostics.clippedFeatureCount,
    },
  }
}
