import { describe, expect, it } from 'vitest'
import { createMapDrawHistory } from '@/main/utils/drawMap/history.js'

describe('createMapDrawHistory', () => {
  it('returns the committed snapshot when undoing current state', () => {
    const history = createMapDrawHistory()
    const original = { layers: [{ id: 'one', visible: true }], activeLayerId: 'one' }
    const current = { layers: [{ id: 'one', visible: false }], activeLayerId: 'one' }

    history.commit(original)

    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)
    expect(history.undo(current)).toEqual(original)
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(true)
  })

  it('returns the redone snapshot and keeps snapshots isolated from later mutations', () => {
    const history = createMapDrawHistory()
    const original = { layers: [{ id: 'one', featureCollection: { features: [] } }] }
    const current = { layers: [{ id: 'one', featureCollection: { features: [{ id: 'drawn' }] } }] }

    history.commit(original)
    const undone = history.undo(current)
    current.layers[0].featureCollection.features.push({ id: 'after-redo-stack' })

    expect(undone).toEqual(original)
    expect(history.redo(undone)).toEqual({
      layers: [{ id: 'one', featureCollection: { features: [{ id: 'drawn' }] } }],
    })
  })

  it('clears redo history after a new commit', () => {
    const history = createMapDrawHistory()

    history.commit({ layers: [{ id: 'one' }] })
    const undone = history.undo({ layers: [{ id: 'two' }] })
    history.commit(undone)

    expect(history.canRedo()).toBe(false)
  })

  it('does not store consecutive duplicate snapshots', () => {
    const history = createMapDrawHistory()
    const original = { layers: [{ id: 'one', visible: true }] }

    history.commit(original)
    history.commit(original)
    history.undo({ layers: [{ id: 'one', visible: false }] })

    expect(history.canUndo()).toBe(false)
  })
})
