import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  analyzeFeatureCollectionQuality,
  analyzeEditableGeometry,
  repairEditableGeometry,
  exportFeatureCollectionAsGeoJson,
  normalizeFeatureCollection,
  readImportedLayerFile,
  serializeFeatureCollectionForExport,
} from '@/main/utils/drawMap/export.js'

function readBlobAsText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'))
    reader.readAsText(blob)
  })
}

describe('editable geometry diagnostics and conservative repair', () => {
  const polygon = (rings) => ({ id: 'area-1', type: 'Feature', properties: { name: 'Area' }, geometry: { type: 'Polygon', coordinates: rings } })

  it('identifies crossing edges and their intersection coordinate', () => {
    const issues = analyzeEditableGeometry(polygon([[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]]))
    expect(issues).toContainEqual(expect.objectContaining({ code: 'self-intersection', featureId: 'area-1', coordinate: [1, 1], coordPaths: ['0.0', '0.2'] }))
  })

  it('rejects collapsed lines, zero-area rings and duplicate vertices', () => {
    expect(analyzeEditableGeometry({ id: 'line', geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] } }).map((issue) => issue.code)).toContain('zero-length-line')
    expect(analyzeEditableGeometry(polygon([[[0, 0], [1, 0], [2, 0], [0, 0]]])).map((issue) => issue.code)).toContain('zero-area-polygon')
    expect(analyzeEditableGeometry(polygon([[[0, 0], [2, 0], [2, 0], [0, 2], [0, 0]]]))).toContainEqual(expect.objectContaining({ code: 'duplicate-coordinate', coordPaths: ['0.1', '0.2'] }))
  })

  it('accepts a valid hole and rejects a hole outside its shell', () => {
    const shell = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]
    expect(analyzeEditableGeometry(polygon([shell, [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]]))).toEqual([])
    expect(analyzeEditableGeometry(polygon([shell, [[5, 5], [6, 5], [6, 6], [5, 5]]])).map((issue) => issue.code)).toContain('invalid-polygon-hole')
  })

  it('rejects closing-line duplicate segments and locates invalid vertices', () => {
    expect(analyzeEditableGeometry({ id: 'line', geometry: { type: 'LineString', coordinates: [[0, 0], [2, 0], [0, 0], [0, 0]] } })).toContainEqual(expect.objectContaining({ code: 'duplicate-coordinate', level: 'error', coordPaths: ['2', '3'] }))
    expect(analyzeEditableGeometry(polygon([[[0, 0], [2, 0], [2, 2], [200, 2], [0, 0]]]))).toContainEqual(expect.objectContaining({ code: 'invalid-coordinate', coordPaths: ['0.3'], coordinate: [0, 0] }))
  })

  it('rejects shell crossings, touching and overlapping or nested holes', () => {
    const shell = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]
    const hole = [[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]]
    for (const rings of [
      [shell, [[1, 1], [5, 1], [5, 2], [1, 2], [1, 1]]],
      [shell, [[1, 1], [4, 1], [4, 2], [1, 2], [1, 1]]],
      [shell, hole, [[2, 2], [2, 3.5], [3.5, 3.5], [3.5, 2], [2, 2]]],
      [shell, hole, [[1.5, 1.5], [1.5, 2], [2, 2], [2, 1.5], [1.5, 1.5]]],
    ]) expect(analyzeEditableGeometry(polygon(rings)).map((issue) => issue.code)).toContain('invalid-polygon-hole')
  })

  it('repairs consecutive duplicates and closure without losing holes or properties', () => {
    const feature = polygon([[[0, 0], [4, 0], [4, 0], [4, 4], [0, 4]], [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]]])
    const original = structuredClone(feature)
    const repaired = repairEditableGeometry(feature)
    expect(repaired).toHaveLength(1)
    expect(repaired[0].properties).toEqual(feature.properties)
    expect(repaired[0].geometry.coordinates[1]).toEqual(feature.geometry.coordinates[1])
    expect(analyzeEditableGeometry(repaired[0])).toEqual([])
    expect(feature).toEqual(original)
  })

  it('splits a repairable crossing shell into valid polygons and refuses zero-area data', () => {
    const repaired = repairEditableGeometry(polygon([[[0, 0], [2, 2], [0, 2], [2, 0], [0, 0]]]))
    expect(repaired).toHaveLength(2)
    expect(repaired.every((feature) => analyzeEditableGeometry(feature).length === 0)).toBe(true)
    expect(repairEditableGeometry(polygon([[[0, 0], [1, 0], [2, 0], [0, 0]]]))).toEqual([])
    expect(repairEditableGeometry(polygon([[null, [1, 0], [2, 0]]]))).toEqual([])
  })
})

describe('draw map export helpers', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    global.URL.createObjectURL = vi.fn(() => 'blob:map-draw-export')
    global.URL.revokeObjectURL = vi.fn()
    vi.spyOn(window, 'setTimeout').mockImplementation((callback) => {
      callback()
      return 0
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not add an updatedAt field while normalizing imported features', () => {
    const normalized = normalizeFeatureCollection({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { name: 'Imported polygon' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ]],
        },
      }],
    })

    expect(normalized.features[0].properties).not.toHaveProperty('updatedAt')
  })

  it('preserves an existing updatedAt field from source data', () => {
    const normalized = normalizeFeatureCollection({
      type: 'FeatureCollection',
      features: [{
        id: 'feature-1',
        type: 'Feature',
        properties: {
          name: 'Existing feature',
          updatedAt: '2026-07-22T00:00:00.000Z',
        },
        geometry: {
          type: 'Point',
          coordinates: [113, 22],
        },
      }],
    })

    expect(normalized.features[0].properties.updatedAt).toBe('2026-07-22T00:00:00.000Z')
  })

  it('exports GeoJSON without adding draw default style fields', async () => {
    const appendChild = vi.spyOn(document.body, 'appendChild')
    const removeChild = vi.spyOn(document.body, 'removeChild')
    const click = vi.fn()
    const anchor = document.createElement('a')
    vi.spyOn(anchor, 'click').mockImplementation(click)
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return anchor
      return originalCreateElement(tagName)
    })

    const exported = exportFeatureCollectionAsGeoJson({
      type: 'FeatureCollection',
      features: [{
        id: 'business-feature-1',
        type: 'Feature',
        properties: {
          name: 'Business polygon',
          customCode: 'A001',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ]],
        },
      }],
    }, 'business.geojson')

    expect(exported.features[0].properties).toEqual({
      name: 'Business polygon',
      customCode: 'A001',
    })
    expect(exported.features[0].id).toBe('business-feature-1')

    const blob = global.URL.createObjectURL.mock.calls[0][0]
    const serialized = JSON.parse(await readBlobAsText(blob))
    expect(serialized.features[0].properties).toEqual({
      name: 'Business polygon',
      customCode: 'A001',
    })
    expect(anchor.download).toBe('business.geojson')
    expect(click).toHaveBeenCalledTimes(1)
    expect(appendChild).toHaveBeenCalledTimes(1)
    expect(removeChild).toHaveBeenCalledTimes(1)
  })

  it('strips default draw style fields from normalized GeoJSON exports', () => {
    const normalized = normalizeFeatureCollection({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          customCode: 'A001',
        },
        geometry: {
          type: 'Point',
          coordinates: [113, 22],
        },
      }],
    })

    const exported = serializeFeatureCollectionForExport(normalized)

    expect(exported.features[0].properties).toEqual({
      customCode: 'A001',
      id: exported.features[0].id,
    })
  })

  it('keeps non-default draw style fields in GeoJSON exports', () => {
    const normalized = normalizeFeatureCollection({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {
          customCode: 'A001',
          stroke: '#ff0000',
          visible: false,
        },
        geometry: {
          type: 'LineString',
          coordinates: [[113, 22], [114, 23]],
        },
      }],
    })

    const exported = serializeFeatureCollectionForExport(normalized)

    expect(exported.features[0].properties).toEqual({
      customCode: 'A001',
      id: exported.features[0].id,
      stroke: '#ff0000',
      visible: false,
    })
  })

  it('reports duplicate ids and geometry quality issues before import normalization', async () => {
    const source = {
      type: 'FeatureCollection',
      features: [{
        id: 'same-id',
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [113, 22] },
      }, {
        id: 'same-id',
        type: 'Feature',
        properties: {},
        geometry: null,
      }, {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Circle', coordinates: [113, 22] },
      }, {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [999, 22] },
      }],
    }

    const diagnostics = analyzeFeatureCollectionQuality(source)

    expect(diagnostics).toMatchObject({
      totalFeatureCount: 4,
      duplicateFeatureIdCount: 1,
      emptyGeometryCount: 1,
      unsupportedGeometryCount: 1,
      invalidCoordinateFeatureCount: 1,
      hasIssues: true,
    })
    expect(diagnostics.duplicateFeatureIds).toEqual(['same-id'])

    const callback = vi.fn()
    await readImportedLayerFile({
      name: 'quality.geojson',
      text: async () => JSON.stringify(source),
    }, { onDiagnostics: callback })

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      duplicateFeatureIdCount: 1,
      emptyGeometryCount: 1,
      unsupportedGeometryCount: 1,
      invalidCoordinateFeatureCount: 1,
    }))
  })

  it('reports skipped invalid CSV rows and unsupported nested collection geometries', async () => {
    const csvDiagnosticsCallback = vi.fn()

    await readImportedLayerFile({
      name: 'mixed.csv',
      text: async () => [
        'name,lng,lat',
        'valid,113,22',
        'bad-number,nope,23',
        'out-of-range,999,24',
        'empty-lng,,25',
      ].join('\n'),
    }, { onDiagnostics: csvDiagnosticsCallback })

    expect(csvDiagnosticsCallback).toHaveBeenCalledWith(expect.objectContaining({
      totalFeatureCount: 1,
      invalidCoordinateFeatureCount: 3,
      hasIssues: true,
    }))

    const geometryDiagnostics = analyzeFeatureCollectionQuality({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'GeometryCollection',
          geometries: [
            { type: 'Point', coordinates: [113, 22] },
            { type: 'Circle', coordinates: [113, 22] },
          ],
        },
      }],
    })

    expect(geometryDiagnostics.unsupportedGeometryCount).toBe(1)
    expect(geometryDiagnostics.hasIssues).toBe(true)
  })
})
