import { describe, expect, it } from 'vitest'

import {
  AUTO_DRAFT_ID,
  buildAutoDraftRecord,
  buildDraftStateSignature,
  isAutoDraftRecord,
} from '../../../src/main/utils/drawMap/draftStorage.js'

describe('draw map draft storage helpers', () => {
  it('builds a stable signature for equivalent workbench states', () => {
    const stateA = {
      currentStyleKey: 'gaode',
      activeLayerId: 'layer-1',
      layers: [{
        id: 'layer-1',
        featureCollection: {
          features: [{
            id: 'feature-1',
            properties: {
              stroke: '#111111',
              visible: true,
            },
          }],
          type: 'FeatureCollection',
        },
      }],
    }
    const stateB = {
      layers: [{
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            properties: {
              visible: true,
              stroke: '#111111',
            },
            id: 'feature-1',
          }],
        },
        id: 'layer-1',
      }],
      activeLayerId: 'layer-1',
      currentStyleKey: 'gaode',
    }

    expect(buildDraftStateSignature(stateA)).toBe(buildDraftStateSignature(stateB))
  })

  it('builds a hidden auto draft record without mutating the source state', () => {
    const state = {
      activeLayerId: 'layer-1',
      layers: [{
        id: 'layer-1',
        featureCollection: {
          type: 'FeatureCollection',
          features: [{ id: 'feature-1', properties: { visible: true } }],
        },
      }],
    }

    const record = buildAutoDraftRecord(state, { savedAt: '2026-07-22T00:00:00.000Z' })
    state.layers[0].featureCollection.features[0].properties.visible = false

    expect(record).toMatchObject({
      id: AUTO_DRAFT_ID,
      name: 'Auto Draft',
      savedAt: '2026-07-22T00:00:00.000Z',
      version: 1,
      auto: true,
      signature: buildDraftStateSignature(record.state),
    })
    expect(record.state.layers[0].featureCollection.features[0].properties.visible).toBe(true)
    expect(isAutoDraftRecord(record)).toBe(true)
    expect(isAutoDraftRecord({ id: 'manual-draft', auto: false })).toBe(false)
  })
})
