import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  analyzeFeatureCollectionQuality,
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
