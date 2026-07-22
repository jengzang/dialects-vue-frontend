import { describe, expect, it } from 'vitest'

import { normalizeFeatureCollection } from '@/main/utils/drawMap/export.js'

describe('draw map export helpers', () => {
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
})
