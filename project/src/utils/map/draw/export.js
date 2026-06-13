const DEFAULT_FEATURE_PROPERTIES = {
  name: '',
  stroke: '#2563eb',
  strokeWidth: 3,
  fill: '#60a5fa',
  fillOpacity: 0.22,
  visible: true,
  locked: false,
}

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

function ensureFeatureId(feature) {
  const rawId = feature.id ?? feature.properties?.id ?? `draw-feature-${featureIdSeed}`
  featureIdSeed += 1
  return String(rawId)
}

function triggerDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}

export function normalizeFeatureCollection(featureCollection) {
  const normalizedCollection = ensureFeatureCollection(featureCollection)

  return {
    type: 'FeatureCollection',
    features: normalizedCollection.features.map((feature) => {
      const featureId = ensureFeatureId(feature)
      return {
        ...feature,
        id: featureId,
        properties: {
          ...DEFAULT_FEATURE_PROPERTIES,
          ...(feature?.properties ?? {}),
          id: featureId,
          updatedAt: new Date().toISOString(),
        },
      }
    }),
  }
}

export function exportFeatureCollectionAsGeoJson(featureCollection, filename = 'map-draw-layer.geojson') {
  const normalized = normalizeFeatureCollection(featureCollection)
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

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to export map image'))
        return
      }

      triggerDownload(blob, filename)
      resolve(blob)
    }, 'image/png')
  })
}

export async function readGeoJsonFile(file) {
  const text = await file.text()
  const parsed = JSON.parse(text)

  if (parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
    throw new Error('Invalid GeoJSON FeatureCollection')
  }

  return normalizeFeatureCollection(parsed)
}
