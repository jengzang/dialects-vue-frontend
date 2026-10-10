import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useGisHistory } from '../src/main/composables/gis/useGisHistory.js'

describe('GIS history edit context', () => {
  it('restores the selected vertex after model synchronization and keeps redo context', async () => {
    const layers = ref([{ id: 'layer', featureCollection: { features: [] } }])
    const currentMode = ref('direct_select')
    let context = { layerId: 'layer', mode: 'direct_select', featureId: 'line', featureIds: ['line'], coordPaths: ['1'] }
    const restored = []
    const history = useGisHistory({ layers, activeLayerId: ref('layer'), currentMode, currentStyleKey: ref('gaode'), selectedFeatureId: ref('line'), selectedFeatureIds: ref(['line']),
      editableMapRef: ref({ getEditContext: () => context, restoreEditContext: (value) => { restored.push(value); return true }, syncReadonlyLayers: vi.fn() }),
      setFeatureSelection: vi.fn(), syncLayerIdSeedFromLayers: vi.fn(), syncAllLayersAfterMutation: vi.fn(),
    })
    history.commitHistory()
    layers.value[0].featureCollection.features.push({ id: 'edited' })
    context = { ...context, coordPaths: ['2'] }
    const undo = history.undoHistory()
    expect(restored).toEqual([])
    await undo
    expect(restored.at(-1)).toMatchObject({ coordPaths: ['1'] })
    await history.redoHistory()
    expect(restored.at(-1)).toMatchObject({ coordPaths: ['2'] })
    expect(history.isApplyingHistory.value).toBe(false)
  })

  it('restores only the latest request during consecutive undo and never restarts saved sketch modes', async () => {
    const layers = ref([{ id: 'layer' }])
    const currentMode = ref('draw_polygon')
    const restore = vi.fn(() => false)
    const setMode = vi.fn()
    const history = useGisHistory({ layers, activeLayerId: ref('layer'), currentMode, currentStyleKey: ref('gaode'), selectedFeatureId: ref(''), selectedFeatureIds: ref([]),
      editableMapRef: ref({ getEditContext: () => null, restoreEditContext: restore, setDrawMode: setMode, syncReadonlyLayers: vi.fn() }),
      setFeatureSelection: vi.fn(), syncLayerIdSeedFromLayers: vi.fn(), syncAllLayersAfterMutation: vi.fn(),
    })
    history.commitHistory()
    layers.value[0].name = 'second'
    history.commitHistory()
    const first = history.undoHistory()
    const second = history.undoHistory()
    await Promise.all([first, second, nextTick()])
    expect(setMode).toHaveBeenCalledTimes(1)
    expect(setMode).toHaveBeenLastCalledWith('simple_select')
    expect(currentMode.value).toBe('simple_select')
  })
})
