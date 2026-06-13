import { bbox, featureCollection, point, voronoi } from '@turf/turf'

const FIELD_KEYS = {
  name: ['簡稱', '简称', 'name', 'location'],
  coordinate: ['經緯度', '经纬度', 'coordinates', 'coordinate', 'coord'],
  mapPartition: ['地圖集二分區', '地图集二分区', 'mapPartition'],
  yindianPartition: ['音典分區', '音典分区', 'yindianPartition'],
}

export const PARTITION_MODE_MAP = 'map'
export const PARTITION_MODE_YINDIAN = 'yindian'

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

export function parseCoordinate(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || '').split(/[,，\s]+/)
  const lng = Number(source[0])
  const lat = Number(source[1])

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

export function getPartitionPath(row, partitionMode = PARTITION_MODE_MAP) {
  return partitionMode === PARTITION_MODE_YINDIAN
    ? getStringField(row, FIELD_KEYS.yindianPartition)
    : getStringField(row, FIELD_KEYS.mapPartition)
}

export function normalizePartitionPoint(row, options = {}) {
  const { partitionMode = PARTITION_MODE_MAP } = options
  const name = getStringField(row, FIELD_KEYS.name)
  const coordinate = parseCoordinate(getStringField(row, FIELD_KEYS.coordinate))
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

export function buildPartitionPointFeatureCollection(points, level = 3) {
  return featureCollection(
    (Array.isArray(points) ? points : []).map((item) => {
      const partitionKey = getPartitionKeyFromParts([
        item.partitionLevel1,
        item.partitionLevel2.split('-').at(-1),
        item.partitionLevel3.split('-').at(-1),
      ], level)
      return point(item.coordinate, {
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

export function groupPartitionPoints(points, level = 3) {
  const groups = new Map()
  ;(Array.isArray(points) ? points : []).forEach((item) => {
    const key = level === 1
      ? item.partitionLevel1
      : level === 2
        ? item.partitionLevel2
        : item.partitionLevel3
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  return groups
}

function getSafeBbox(featureCollectionValue) {
  const [minLng, minLat, maxLng, maxLat] = bbox(featureCollectionValue)
  const lngPadding = minLng === maxLng ? 0.01 : 0
  const latPadding = minLat === maxLat ? 0.01 : 0
  return [
    minLng - lngPadding,
    minLat - latPadding,
    maxLng + lngPadding,
    maxLat + latPadding,
  ]
}

export function calculatePartitionVoronoi(points, level = 3) {
  const groups = groupPartitionPoints(points, level)
  const groupResults = {}
  const mergedFeatures = []

  groups.forEach((groupPoints, partitionKey) => {
    const pointCollection = buildPartitionPointFeatureCollection(groupPoints, level)
    const polygonCollection = pointCollection.features.length >= 2
      ? voronoi(pointCollection, { bbox: getSafeBbox(pointCollection) })
      : featureCollection([])

    const features = (polygonCollection?.features ?? []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        partitionKey,
        partitionLevel: level,
        pointCount: groupPoints.length,
      },
    }))

    groupResults[partitionKey] = featureCollection(features)
    mergedFeatures.push(...features)
  })

  return {
    groups: groupResults,
    merged: featureCollection(mergedFeatures),
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
