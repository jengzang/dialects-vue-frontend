import { bbox, featureCollection, point, polygon, union } from '@turf/turf'
import { Delaunay } from 'd3-delaunay'

const FIELD_KEYS = {
  name: ['簡稱', '简称', '地點', '地点', 'name', 'location'],
  coordinate: ['經緯度', '经纬度', 'coordinates', 'coordinate', 'coord', 'lnglat', 'lonlat'],
  mapPartition: ['地圖集二分區', '地圖集分區', '地图集二分区', '地图集分区', 'mapPartition'],
  yindianPartition: ['音典分區', '音典分区', 'yindianPartition'],
}

export const PARTITION_MODE_MAP = 'map'
export const PARTITION_MODE_YINDIAN = 'yindian'

const PARTITION_COLOR_PALETTE = [
  ['#2563eb', '#60a5fa', '#dbeafe'],
  ['#059669', '#34d399', '#d1fae5'],
  ['#dc2626', '#f87171', '#fee2e2'],
  ['#7c3aed', '#a78bfa', '#ede9fe'],
  ['#d97706', '#fbbf24', '#fef3c7'],
  ['#0891b2', '#22d3ee', '#cffafe'],
  ['#be185d', '#f472b6', '#fce7f3'],
  ['#4f46e5', '#818cf8', '#e0e7ff'],
]

export function getStringField(row, keys) {
  if (!row || typeof row !== 'object') return ''
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const value = row[key]
      return value === null || value === undefined ? '' : String(value).trim()
    }
  }
  return ''
}

export function parseCoordinate(value, row = {}) {
  const source = Array.isArray(value)
    ? value
    : String(value || '').split(/[,，\s]+/)
  const rawLng = row.lng ?? row.lon ?? row.longitude ?? row.x ?? source[0]
  const rawLat = row.lat ?? row.latitude ?? row.y ?? source[1]
  const lng = Number(rawLng)
  const lat = Number(rawLat)

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null
  return [lng, lat]
}

export function normalizePartitionParts(rawPath) {
  const parts = String(rawPath || '')
    .split('-')
    .map((item) => item.trim())
    .filter(Boolean)

  if (parts.length === 0) return []

  const normalizedParts = parts.slice(0, 3)
  while (normalizedParts.length < 3) {
    normalizedParts.push(normalizedParts[normalizedParts.length - 1])
  }
  return normalizedParts
}

export function getPartitionKeyFromParts(parts, level = 3) {
  const safeLevel = Math.min(Math.max(Number(level) || 3, 1), 3)
  return parts.slice(0, safeLevel).join('-')
}

export function getPartitionKey(item, level = 3) {
  const safeLevel = Math.min(Math.max(Number(level) || 3, 1), 3)
  if (safeLevel === 1) return item?.partitionLevel1 ?? ''
  if (safeLevel === 2) return item?.partitionLevel2 ?? ''
  return item?.partitionLevel3 ?? ''
}

export function getPartitionPath(row, partitionMode = PARTITION_MODE_MAP) {
  return partitionMode === PARTITION_MODE_YINDIAN
    ? getStringField(row, FIELD_KEYS.yindianPartition)
    : getStringField(row, FIELD_KEYS.mapPartition)
}

export function normalizePartitionPoint(row, options = {}) {
  const { partitionMode = PARTITION_MODE_MAP } = options
  const name = getStringField(row, FIELD_KEYS.name)
  const coordinate = parseCoordinate(getStringField(row, FIELD_KEYS.coordinate), row)
  const rawPartitionPath = getPartitionPath(row, partitionMode)
  const partitionParts = normalizePartitionParts(rawPartitionPath)

  if (!name || !coordinate || partitionParts.length === 0) return null

  return {
    name,
    coordinate,
    rawPartitionPath,
    partitionMode,
    partitionLevel1: getPartitionKeyFromParts(partitionParts, 1),
    partitionLevel2: getPartitionKeyFromParts(partitionParts, 2),
    partitionLevel3: getPartitionKeyFromParts(partitionParts, 3),
    raw: row,
  }
}

export function buildPartitionPoints(rows, options = {}) {
  const ignoredLocations = new Set(options.ignoredLocations ?? [])
  return (Array.isArray(rows) ? rows : [])
    .map((row) => normalizePartitionPoint(row, options))
    .filter((item) => item && !ignoredLocations.has(item.name))
}

export function buildVillagePartitionPoints(villages) {
  return (Array.isArray(villages) ? villages : [])
    .filter(v => {
      if (!v || !v.name) return false
      if (!v.dialect || String(v.dialect).trim() === '') return false
      if (typeof v.longitude !== 'number' || typeof v.latitude !== 'number') return false
      if (Math.abs(v.longitude) > 180 || Math.abs(v.latitude) > 90) return false
      return true
    })
    .map(v => {
      const dialect = String(v.dialect).trim()
      const partitionParts = normalizePartitionParts(dialect)
      return {
        name: String(v.name).trim(),
        coordinate: [v.longitude, v.latitude],
        partitionMode: 'village',
        partitionLevel1: getPartitionKeyFromParts(partitionParts, 1),
        partitionLevel2: getPartitionKeyFromParts(partitionParts, 2),
        partitionLevel3: getPartitionKeyFromParts(partitionParts, 3),
        rawPartitionPath: dialect,
        raw: { name: v.name, dialect, _path: v._path },
      }
    })
}

export function buildPartitionPointFeatureCollection(points, level = 3, colorMap = {}) {
  return featureCollection(
    (Array.isArray(points) ? points : []).map((item) => {
      const partitionKey = getPartitionKey(item, level)
      const style = colorMap[partitionKey] ?? {}
      return point(item.coordinate, {
        ...style,
        name: item.name,
        partitionKey,
        partitionMode: item.partitionMode,
        partitionLevel1: item.partitionLevel1,
        partitionLevel2: item.partitionLevel2,
        partitionLevel3: item.partitionLevel3,
        rawPartitionPath: item.rawPartitionPath,
      })
    })
  )
}

export function buildPartitionColorMap(points, level = 3) {
  const keys = Array.from(new Set(
    (Array.isArray(points) ? points : []).map((item) => getPartitionKey(item, level)).filter(Boolean)
  )).sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN'))

  return keys.reduce((accumulator, key, index) => {
    const [stroke, pointColor, fill] = PARTITION_COLOR_PALETTE[index % PARTITION_COLOR_PALETTE.length]
    accumulator[key] = {
      stroke,
      pointColor,
      pointStrokeColor: '#ffffff',
      pointRadius: 7,
      fill,
      fillOpacity: 0.32,
      strokeWidth: 2,
    }
    return accumulator
  }, {})
}

export function groupPartitionPoints(points, level = 3) {
  const groups = new Map()
  ;(Array.isArray(points) ? points : []).forEach((item) => {
    const key = getPartitionKey(item, level)
    if (!key) return
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  return groups
}

function getSafeBbox(featureCollectionValue) {
  const [minLng, minLat, maxLng, maxLat] = bbox(featureCollectionValue)
  const lngPadding = minLng === maxLng ? 0.01 : 0
  const latPadding = minLat === maxLat ? 0.01 : 0

  // 大幅扩展包围盒，给 d3-delaunay 足够空间让外圈 cells 自然延伸，
  // 后续由逐点圆形裁剪决定最终外边界
  const padRatio = 1.0
  const halfLng = (maxLng - minLng) / 2
  const halfLat = (maxLat - minLat) / 2

  return [
    minLng - lngPadding - halfLng * padRatio,
    minLat - latPadding - halfLat * padRatio,
    maxLng + lngPadding + halfLng * padRatio,
    maxLat + latPadding + halfLat * padRatio,
  ]
}

function getPointCoordinate(feature) {
  const coordinate = feature?.geometry?.coordinates
  if (!Array.isArray(coordinate) || coordinate.length < 2) return null
  const lng = Number(coordinate[0])
  const lat = Number(coordinate[1])
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

function getCoordinateKey(coordinate) {
  return coordinate.map((value) => Number(value).toFixed(8)).join(',')
}

function logVoronoiDiagnostics(pointCollection, skippedCells = []) {
  const invalidFeatures = []
  const coordinateGroups = new Map()

  ;(pointCollection?.features ?? []).forEach((feature, index) => {
    const coordinate = getPointCoordinate(feature)
    if (!coordinate) {
      invalidFeatures.push({ index, properties: feature?.properties ?? null, geometry: feature?.geometry ?? null })
      return
    }

    const coordinateKey = getCoordinateKey(coordinate)
    if (!coordinateGroups.has(coordinateKey)) {
      coordinateGroups.set(coordinateKey, [])
    }
    coordinateGroups.get(coordinateKey).push({
      index,
      name: feature.properties?.name,
      partitionKey: feature.properties?.partitionKey,
      coordinate,
    })
  })

  const duplicateCoordinates = Array.from(coordinateGroups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([coordinate, items]) => ({ coordinate, items }))

  if (invalidFeatures.length || duplicateCoordinates.length || skippedCells.length) {
    console.warn('[partitionVoronoi] diagnostics', {
      totalFeatures: pointCollection?.features?.length ?? 0,
      invalidFeatures,
      duplicateCoordinates,
      skippedCells,
    })
  }
}

function isValidVoronoiRing(coords) {
  return Array.isArray(coords)
    && coords.length >= 3
    && coords.every((coordinate) => Array.isArray(coordinate)
      && coordinate.length >= 2
      && Number.isFinite(Number(coordinate[0]))
      && Number.isFinite(Number(coordinate[1])))
}

function buildSafeVoronoiFeatureCollection(pointCollection, _expandFactor = 0.3) {
  const originalFeatures = pointCollection?.features ?? []
  const validFeatures = []
  const filteredFeatures = []

  originalFeatures.forEach((feature, index) => {
    if (getPointCoordinate(feature)) {
      validFeatures.push(feature)
      return
    }
    filteredFeatures.push({
      index,
      name: feature?.properties?.name,
      partitionKey: feature?.properties?.partitionKey,
      geometry: feature?.geometry ?? null,
    })
  })

  if (validFeatures.length < 2) {
    logVoronoiDiagnostics(featureCollection(validFeatures), filteredFeatures.map((item) => ({
      ...item,
      reason: 'invalid-point-feature',
    })))
    return featureCollection([])
  }

  const safeBbox = getSafeBbox(featureCollection(validFeatures))
  const skippedCells = []

  let voronoiDiagram = null
  try {
    const delaunay = Delaunay.from(validFeatures, (feature) => getPointCoordinate(feature)[0], (feature) => getPointCoordinate(feature)[1])
    voronoiDiagram = delaunay.voronoi(safeBbox)
  } catch (error) {
    console.error('[partitionVoronoi] d3-delaunay voronoi failed', {
      error,
      safeBbox,
      validFeatureCount: validFeatures.length,
      invalidFeatureCount: filteredFeatures.length,
      sampleFeatures: validFeatures.slice(0, 20).map((feature, index) => ({
        index,
        name: feature.properties?.name,
        partitionKey: feature.properties?.partitionKey,
        coordinate: getPointCoordinate(feature),
        geometry: feature.geometry,
      })),
      filteredFeatures,
    })
    throw error
  }

  const polygonFeatures = []
  for (let index = 0; index < validFeatures.length; index += 1) {
    const coords = voronoiDiagram?.cellPolygon(index)
    const sourceFeature = validFeatures[index]
    if (!isValidVoronoiRing(coords)) {
      skippedCells.push({
        index,
        reason: coords ? 'invalid-ring' : 'empty-cell',
        name: sourceFeature?.properties?.name,
        partitionKey: sourceFeature?.properties?.partitionKey,
        coordinate: sourceFeature ? getPointCoordinate(sourceFeature) : null,
      })
      continue
    }

    polygonFeatures.push(polygon([coords], sourceFeature?.properties ?? {}))
  }

  logVoronoiDiagnostics(featureCollection(validFeatures), [
    ...filteredFeatures.map((item) => ({ ...item, reason: 'invalid-point-feature' })),
    ...skippedCells,
  ])
  return featureCollection(polygonFeatures)
}

function mergePartitionCellFeatures(cellFeatures, partitionKey, level, groupPoints, style = {}) {
  const validFeatures = (cellFeatures ?? []).filter((feature) => feature && typeof feature === 'object')
  if (!validFeatures.length) return null

  const mergedFeature = validFeatures.length === 1
    ? validFeatures[0]
    : union(featureCollection(validFeatures))

  if (!mergedFeature) return null

  return {
    ...mergedFeature,
    properties: {
      ...(mergedFeature.properties ?? {}),
      ...style,
      name: partitionKey,
      partitionKey,
      partitionLevel: level,
      pointCount: groupPoints.length,
    },
  }
}

export function calculatePartitionVoronoi(points, level = 3, colorMap = {}, expandRatio = 30) {
  const groups = groupPartitionPoints(points, level)
  const groupResults = {}
  const cellFeatures = []
  const partitionFeatures = []
  const pointCollection = buildPartitionPointFeatureCollection(points, level, colorMap)
  const polygonCollection = pointCollection.features.length >= 2
    ? buildSafeVoronoiFeatureCollection(pointCollection, (expandRatio ?? 30) / 100)
    : featureCollection([])

  ;(polygonCollection?.features ?? [])
    .filter((feature) => feature && typeof feature === 'object')
    .forEach((feature) => {
      const partitionKey = feature.properties?.partitionKey
      if (!partitionKey || !groups.has(partitionKey)) return
      const groupPoints = groups.get(partitionKey)
      const style = colorMap[partitionKey] ?? {}
      const styledFeature = {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          ...style,
          partitionKey,
          partitionLevel: level,
          pointCount: groupPoints.length,
        },
      }

      if (!groupResults[partitionKey]) {
        groupResults[partitionKey] = []
      }
      groupResults[partitionKey].push(styledFeature)
      cellFeatures.push(styledFeature)
    })

  groups.forEach((groupPoints, partitionKey) => {
    const features = groupResults[partitionKey] ?? []
    const style = colorMap[partitionKey] ?? {}
    const mergedFeature = mergePartitionCellFeatures(features, partitionKey, level, groupPoints, style)

    groupResults[partitionKey] = featureCollection(features)
    if (mergedFeature) {
      partitionFeatures.push(mergedFeature)
    }
  })

  return {
    groups: groupResults,
    cells: featureCollection(cellFeatures),
    merged: featureCollection(partitionFeatures),
  }
}

export function buildVoronoiSelectionOptions(points, level = 3) {
  const regionMap = new Map()
  const locationMap = new Map()

  ;(Array.isArray(points) ? points : []).forEach((item) => {
    const regionName = level === 1
      ? item.partitionLevel1
      : level === 2
        ? item.partitionLevel2
        : item.partitionLevel3

    if (!locationMap.has(item.name)) {
      locationMap.set(item.name, {
        name: item.name,
        recordCount: 0,
        regionNames: new Set(),
      })
    }
    const locationEntry = locationMap.get(item.name)
    locationEntry.recordCount += 1
    locationEntry.regionNames.add(regionName)

    if (!regionMap.has(regionName)) {
      regionMap.set(regionName, {
        name: regionName,
        rows: [],
        locations: new Set(),
        recordCount: 0,
      })
    }
    const regionEntry = regionMap.get(regionName)
    regionEntry.rows.push({ 簡稱: item.name })
    regionEntry.locations.add(item.name)
    regionEntry.recordCount += 1
  })

  return {
    regions: Array.from(regionMap.values()).map((item) => ({
      name: item.name,
      rows: item.rows,
      locationCount: item.locations.size,
      recordCount: item.recordCount,
    })),
    locations: Array.from(locationMap.values()).map((item) => ({
      name: item.name,
      recordCount: item.recordCount,
      regionNames: Array.from(item.regionNames),
    })),
  }
}
