import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  exportFeatureCollectionAsGeoJson,
  normalizeFeatureCollection,
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
})
