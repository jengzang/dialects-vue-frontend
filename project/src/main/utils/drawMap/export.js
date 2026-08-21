import { kml as kmlToGeoJson } from '@tmcw/togeojson'
import { DOMParser } from '@xmldom/xmldom'
import { unzipSync, strFromU8 } from 'fflate'
import { pickDrawColor } from '@/main/config/colors/mapColors.js'

const DEFAULT_FEATURE_PROPERTIES = {
  name: '',
  stroke: pickDrawColor(0)[0],
  strokeWidth: 3,
  fill: pickDrawColor(0)[1],
  fillOpacity: 0.22,
  pointRadius: 6,
  pointColor: pickDrawColor(0)[1],
  pointStrokeColor: pickDrawColor(0)[0],
  annotationText: '',
  textSize: 16,
  textColor: pickDrawColor(0)[0],
  textHaloColor: '#ffffff',
  textHaloWidth: 1,
  textRotate: 0,
  textAnchor: 'center',
  visible: true,
  locked: false,
}
const DRAW_STYLE_EXPORT_DEFAULT_KEYS = Object.keys(DEFAULT_FEATURE_PROPERTIES)

const SUPPORTED_DRAW_GEOMETRY_TYPES = ['Point', 'LineString', 'Polygon']
const CSV_LONGITUDE_KEYS = ['lng', 'lon', 'long', 'longitude', 'x', '经度']
const CSV_LATITUDE_KEYS = ['lat', 'latitude', 'y', '纬度']

let featureIdSeed = 0

function ensureFeatureCollection(featureCollection) {
  if (
    !featureCollection ||
    featureCollection.type !== 'FeatureCollection' ||
    !Array.isArray(featureCollection.features)
  ) {
    return {
      type: 'FeatureCollection',
      features: [],
    }
  }

  return featureCollection
}

function ensureFeatureId(feature, usedFeatureIds = new Set()) {
  const rawId = feature.id ?? feature.properties?.id ?? `draw-feature-${featureIdSeed}`
  featureIdSeed += 1
  const baseId = String(rawId)
  let featureId = baseId
  let duplicateIndex = 1

  while (usedFeatureIds.has(featureId)) {
    featureId = `${baseId}-${duplicateIndex}`
    duplicateIndex += 1
  }

  usedFeatureIds.add(featureId)
  return featureId
}

function triggerDownload(blob, filename) {
  console.log('[exportCurrentMapAsPng] trigger download', {
    filename,
    blobSize: blob?.size ?? 0,
    blobType: blob?.type ?? '',
  })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Delay revocation so browsers can finish consuming the blob URL.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

function buildFeatureCollection(features = []) {
  return {
    type: 'FeatureCollection',
    features,
  }
}

function normalizeCsvHeader(header = '') {
  return header.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function parseCsvRow(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values.map((value) => value.trim())
}

function parseGeoJsonText(text) {
  const parsed = JSON.parse(text)

  if (parsed?.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
    return parsed
  }

  if (parsed?.type === 'Feature') {
    return buildFeatureCollection([parsed])
  }

  throw new Error('Invalid GeoJSON FeatureCollection')
}

function parseKmlText(text) {
  const xmlDocument = new DOMParser().parseFromString(text, 'text/xml')
  const featureCollection = kmlToGeoJson(xmlDocument)

  if (!Array.isArray(featureCollection?.features)) {
    throw new Error('Invalid KML document')
  }

  return featureCollection
}

function getKmzKmlText(arrayBuffer) {
  const zipEntries = unzipSync(new Uint8Array(arrayBuffer))
  const entryNames = Object.keys(zipEntries)

  const preferredEntryName = entryNames.find((entryName) => entryName.toLowerCase() === 'doc.kml')
    ?? entryNames.find((entryName) => entryName.toLowerCase().endsWith('.kml'))

  if (!preferredEntryName) {
    throw new Error('KMZ did not contain a KML document')
  }

  return strFromU8(zipEntries[preferredEntryName])
}

function parseCsvText(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV file requires a header row and at least one data row')
  }

  const headers = parseCsvRow(lines[0])
  const normalizedHeaders = headers.map(normalizeCsvHeader)
  const lngIndex = normalizedHeaders.findIndex((header) => CSV_LONGITUDE_KEYS.includes(header))
  const latIndex = normalizedHeaders.findIndex((header) => CSV_LATITUDE_KEYS.includes(header))

  if (lngIndex === -1 || latIndex === -1) {
    throw new Error('CSV must include longitude/lng and latitude/lat columns')
  }

  let invalidCoordinateFeatureCount = 0
  const features = lines
    .slice(1)
    .map((line) => parseCsvRow(line))
    .map((values, rowIndex) => {
      const rawLng = values[lngIndex]
      const rawLat = values[latIndex]
      if (!String(rawLng ?? '').trim() || !String(rawLat ?? '').trim()) {
        invalidCoordinateFeatureCount += 1
        return null
      }

      const lng = Number(rawLng)
      const lat = Number(rawLat)

      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        invalidCoordinateFeatureCount += 1
        return null
      }
      if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
        invalidCoordinateFeatureCount += 1
        return null
      }

      const properties = headers.reduce((result, header, headerIndex) => {
        if (headerIndex === lngIndex || headerIndex === latIndex) {
          return result
        }
        result[header] = values[headerIndex] ?? ''
        return result
      }, {
        csvRowIndex: rowIndex,
      })

      return {
        type: 'Feature',
        properties,
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      }
    })
    .filter(Boolean)

  if (!features.length) {
    throw new Error('CSV did not contain any valid coordinates')
  }

  return {
    ...buildFeatureCollection(features),
    importDiagnostics: {
      invalidCoordinateFeatureCount,
    },
  }
}

function expandFeatureByGeometry(feature, geometry = feature?.geometry, context = {}) {
  if (!geometry?.type) {
    return []
  }

  const baseProperties = {
    ...(feature?.properties ?? {}),
    ...(context.sourceGeometryType ? { sourceGeometryType: context.sourceGeometryType } : {}),
    ...(Number.isInteger(context.geometryPartIndex)
      ? { geometryPartIndex: context.geometryPartIndex }
      : {}),
  }

  const buildFeature = (nextGeometry, extraProperties = {}) => ({
    ...feature,
    properties: {
      ...baseProperties,
      ...extraProperties,
    },
    geometry: nextGeometry,
  })

  switch (geometry.type) {
    case 'Point':
    case 'LineString':
    case 'Polygon':
      return [buildFeature(geometry)]
    case 'MultiPoint':
      return (geometry.coordinates ?? []).map((coordinates, index) => buildFeature(
        { type: 'Point', coordinates },
        { sourceGeometryType: 'MultiPoint', geometryPartIndex: index }
      ))
    case 'MultiLineString':
      return (geometry.coordinates ?? []).map((coordinates, index) => buildFeature(
        { type: 'LineString', coordinates },
        { sourceGeometryType: 'MultiLineString', geometryPartIndex: index }
      ))
    case 'MultiPolygon':
      return (geometry.coordinates ?? []).map((coordinates, index) => buildFeature(
        { type: 'Polygon', coordinates },
        { sourceGeometryType: 'MultiPolygon', geometryPartIndex: index }
      ))
    case 'GeometryCollection':
      return (geometry.geometries ?? []).flatMap((nestedGeometry, index) => expandFeatureByGeometry(
        feature,
        nestedGeometry,
        {
          sourceGeometryType: nestedGeometry?.type ?? geometry.type,
          geometryPartIndex: index,
        }
      ))
    default:
      return []
  }
}

function collectCoordinatePairs(coordinates, pairs = []) {
  if (!Array.isArray(coordinates)) return pairs
  const longitude = coordinates[0]
  const latitude = coordinates[1]
  if (typeof longitude === 'number' && typeof latitude === 'number') {
    pairs.push([longitude, latitude])
    return pairs
  }
  coordinates.forEach((item) => collectCoordinatePairs(item, pairs))
  return pairs
}

function hasInvalidCoordinates(geometry) {
  if (!geometry?.type) return false
  if (geometry.type === 'GeometryCollection') {
    return (geometry.geometries ?? []).some(hasInvalidCoordinates)
  }
  const coordinatePairs = collectCoordinatePairs(geometry.coordinates)
  if (SUPPORTED_DRAW_GEOMETRY_TYPES.includes(geometry.type) && coordinatePairs.length === 0) {
    return true
  }
  return coordinatePairs.some(([longitude, latitude]) => {
    return !Number.isFinite(longitude)
      || !Number.isFinite(latitude)
      || Math.abs(longitude) > 180
      || Math.abs(latitude) > 90
  })
}

function countUnsupportedGeometryParts(geometry) {
  if (!geometry?.type) return 0
  if (geometry.type === 'GeometryCollection') {
    return (geometry.geometries ?? [])
      .reduce((count, nestedGeometry) => count + countUnsupportedGeometryParts(nestedGeometry), 0)
  }
  return expandFeatureByGeometry({ type: 'Feature', properties: {}, geometry }).length > 0 ? 0 : 1
}

export function analyzeFeatureCollectionQuality(featureCollection, extraDiagnostics = {}) {
  const features = ensureFeatureCollection(featureCollection).features
    .filter((feature) => feature && typeof feature === 'object')
  const seenFeatureIds = new Set()
  const duplicateFeatureIds = new Set()
  let emptyGeometryCount = 0
  let unsupportedGeometryCount = 0
  let invalidCoordinateFeatureCount = Number(extraDiagnostics.invalidCoordinateFeatureCount) || 0

  features.forEach((feature) => {
    const rawFeatureId = feature.id ?? feature.properties?.id
    if (rawFeatureId !== undefined && rawFeatureId !== null && String(rawFeatureId)) {
      const featureId = String(rawFeatureId)
      if (seenFeatureIds.has(featureId)) {
        duplicateFeatureIds.add(featureId)
      }
      seenFeatureIds.add(featureId)
    }

    if (!feature.geometry?.type) {
      emptyGeometryCount += 1
      return
    }
    unsupportedGeometryCount += countUnsupportedGeometryParts(feature.geometry)
    if (hasInvalidCoordinates(feature.geometry)) {
      invalidCoordinateFeatureCount += 1
    }
  })

  return {
    totalFeatureCount: features.length,
    duplicateFeatureIdCount: duplicateFeatureIds.size,
    duplicateFeatureIds: [...duplicateFeatureIds],
    emptyGeometryCount,
    unsupportedGeometryCount,
    invalidCoordinateFeatureCount,
    hasIssues: duplicateFeatureIds.size > 0
      || emptyGeometryCount > 0
      || unsupportedGeometryCount > 0
      || invalidCoordinateFeatureCount > 0,
  }
}

function normalizeImportedFeatureCollection(featureCollection, options = {}) {
  options.onDiagnostics?.(analyzeFeatureCollectionQuality(featureCollection, featureCollection?.importDiagnostics))
  return normalizeFeatureCollection(featureCollection)
}

function inferImportFormat(file) {
  const fileName = file?.name?.toLowerCase?.() ?? ''
  const fileType = file?.type?.toLowerCase?.() ?? ''

  if (fileName.endsWith('.kmz') || fileType.includes('kmz')) {
    return 'kmz'
  }
  if (fileName.endsWith('.kml') || fileType.includes('kml')) {
    return 'kml'
  }
  if (fileName.endsWith('.csv') || fileType.includes('csv')) {
    return 'csv'
  }
  return 'geojson'
}

function getDefaultDrawProperties(index) {
  const [stroke, pointColor] = pickDrawColor(index)
  return {
    ...DEFAULT_FEATURE_PROPERTIES,
    stroke,
    fill: pointColor,
    pointColor,
    pointStrokeColor: stroke,
    textColor: stroke,
  }
}

function stripDefaultDrawProperties(properties = {}, index = 0) {
  const defaults = getDefaultDrawProperties(index)

  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      return !(
        DRAW_STYLE_EXPORT_DEFAULT_KEYS.includes(key)
        && Object.is(value, defaults[key])
      )
    })
  )
}

export function normalizeFeatureCollection(featureCollection) {
  const normalizedCollection = ensureFeatureCollection(featureCollection)
  const usedFeatureIds = new Set()

  return {
    type: 'FeatureCollection',
    features: normalizedCollection.features
      .filter((feature) => feature && typeof feature === 'object')
      .map((feature, index) => {
      const featureId = ensureFeatureId(feature, usedFeatureIds)
      const [stroke, pointColor] = pickDrawColor(index)
      return {
        ...feature,
        id: featureId,
        properties: {
          ...DEFAULT_FEATURE_PROPERTIES,
          stroke,
          fill: pointColor,
          pointColor,
          pointStrokeColor: stroke,
          ...(feature?.properties ?? {}),
          id: featureId,
        },
      }
    }),
  }
}

export function serializeFeatureCollectionForExport(featureCollection) {
  const normalizedCollection = ensureFeatureCollection(featureCollection)

  return {
    type: 'FeatureCollection',
    features: normalizedCollection.features
      .filter((feature) => feature && typeof feature === 'object')
      .map((feature, index) => ({
        ...feature,
        properties: stripDefaultDrawProperties(feature?.properties, index),
      })),
  }
}

export function splitFeatureCollectionByGeometryType(featureCollection) {
  const normalizedCollection = ensureFeatureCollection(featureCollection)
  const groupedFeatures = {
    Point: [],
    LineString: [],
    Polygon: [],
  }

  normalizedCollection.features.forEach((feature) => {
    expandFeatureByGeometry(feature).forEach((expandedFeature) => {
      const geometryType = expandedFeature?.geometry?.type
      if (SUPPORTED_DRAW_GEOMETRY_TYPES.includes(geometryType)) {
        groupedFeatures[geometryType].push(expandedFeature)
      }
    })
  })

  const groups = SUPPORTED_DRAW_GEOMETRY_TYPES
    .filter((geometryType) => groupedFeatures[geometryType].length > 0)
    .map((geometryType) => ({
      geometryType,
      featureCollection: normalizeFeatureCollection(buildFeatureCollection(groupedFeatures[geometryType])),
    }))

  if (!groups.length) {
    throw new Error('No supported Point / LineString / Polygon features found')
  }

  return groups
}

function readFileAsText(file) {
  if (typeof file?.text === 'function') {
    return file.text()
  }

  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  throw new Error('File text reader is unavailable')
}

async function readFileAsArrayBuffer(file) {
  if (typeof file?.arrayBuffer === 'function') {
    return file.arrayBuffer()
  }

  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  throw new Error('File array buffer reader is unavailable')
}

export function exportFeatureCollectionAsGeoJson(featureCollection, filename = 'map-draw-layer.geojson') {
  const normalized = serializeFeatureCollectionForExport(featureCollection)
  const blob = new Blob([
    JSON.stringify(normalized, null, 2)
  ], {
    type: 'application/geo+json;charset=utf-8'
  })

  triggerDownload(blob, filename)
  return normalized
}

export function exportCurrentMapAsPng(mapInstance, filename = 'map-draw.png') {
  const canvas = mapInstance?.getCanvas?.()

  if (!canvas) {
    throw new Error('Map canvas is unavailable')
  }

  console.log('[exportCurrentMapAsPng] start', {
    filename,
    width: canvas.width,
    height: canvas.height,
    clientWidth: canvas.clientWidth,
    clientHeight: canvas.clientHeight,
    devicePixelRatio: window.devicePixelRatio,
    hasPreserveDrawingBuffer: true,
  })

  return new Promise((resolve, reject) => {
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height
    const context = exportCanvas.getContext('2d')

    if (!context) {
      reject(new Error('Failed to create export canvas'))
      return
    }

    const capture = () => {
      try {
        context.clearRect(0, 0, exportCanvas.width, exportCanvas.height)
        context.drawImage(canvas, 0, 0)
        const previewDataUrl = exportCanvas.toDataURL('image/png')
        console.log('[exportCurrentMapAsPng] copied canvas', {
          width: exportCanvas.width,
          height: exportCanvas.height,
          dataUrlPrefix: previewDataUrl.slice(0, 64),
          dataUrlLength: previewDataUrl.length,
        })
      } catch (error) {
        console.error('[exportCurrentMapAsPng] drawImage failed', error)
        reject(error instanceof Error ? error : new Error(String(error)))
        return
      }

      exportCanvas.toBlob((blob) => {
        console.log('[exportCurrentMapAsPng] toBlob result', {
          hasBlob: Boolean(blob),
          blobSize: blob?.size ?? 0,
          blobType: blob?.type ?? '',
        })
        if (!blob) {
          reject(new Error('Failed to export map image'))
          return
        }

        triggerDownload(blob, filename)
        resolve(blob)
      }, 'image/png')
    }

    // WebGL canvases can be blank when read immediately; repaint first, then capture on the next frame.
    mapInstance?.triggerRepaint?.()
    requestAnimationFrame(() => {
      requestAnimationFrame(capture)
    })
  })
}

export async function readGeoJsonFile(file) {
  const text = await readFileAsText(file)
  return normalizeFeatureCollection(parseGeoJsonText(text))
}

export function readKmzArrayBuffer(arrayBuffer) {
  return normalizeFeatureCollection(parseKmlText(getKmzKmlText(arrayBuffer)))
}

export async function readImportedLayerFile(file, options = {}) {
  const importFormat = inferImportFormat(file)

  if (importFormat === 'kmz') {
    const arrayBuffer = await readFileAsArrayBuffer(file)
    return normalizeImportedFeatureCollection(parseKmlText(getKmzKmlText(arrayBuffer)), options)
  }

  const text = await readFileAsText(file)

  if (importFormat === 'kml') {
    return normalizeImportedFeatureCollection(parseKmlText(text), options)
  }

  if (importFormat === 'csv') {
    return normalizeImportedFeatureCollection(parseCsvText(text), options)
  }

  return normalizeImportedFeatureCollection(parseGeoJsonText(text), options)
}
