import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@/utils/ui/message.js', () => ({
  showConfirm: vi.fn(),
  showSuccess: vi.fn(),
}))

import { useGisFeatures } from '../src/main/composables/gis/useGisFeatures.js'

const polygonFeature = (id, coordinates) => ({
  id,
  type: 'Feature',
  properties: { id, name: id, visible: true, locked: false },
  geometry: {
    type: 'Polygon',
    coordinates: [coordinates],
  },
})

const pointFeature = (id, coordinates) => ({
  id,
  type: 'Feature',
  properties: { id, name: id, visible: true, locked: false },
  geometry: {
    type: 'Point',
    coordinates,
  },
})

function mountGisFeatures(overrides = {}) {
  const layers = ref(overrides.layers ?? [{
    id: 'layer-1',
    name: '面图层',
    geometryType: 'Polygon',
    visible: true,
    locked: false,
    featureCollection: {
      type: 'FeatureCollection',
      features: [
        polygonFeature('poly-1', [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]),
        polygonFeature('poly-2', [[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]),
        polygonFeature('poly-3', [[3, 0], [4, 0], [4, 1], [3, 1], [3, 0]]),
      ],
    },
  }])
  const activeLayerId = ref('layer-1')
  const activeLayer = computed(() => layers.value.find((layer) => layer.id === activeLayerId.value) ?? null)
  const selectedFeatureId = ref(overrides.selectedFeatureId ?? 'poly-1')
  const selectedFeatureIds = ref(overrides.selectedFeatureIds ?? ['poly-1', 'poly-2'])
  const currentMode = ref('simple_select')
  const selectedVertexCount = ref(overrides.selectedVertexCount ?? 0)
  const selectedVertex = ref(null)
  const selectedVertexDeleteBlockCode = ref(overrides.selectedVertexDeleteBlockCode ?? '')
  const editableMapRef = ref({
    selectFeature: vi.fn(),
    selectFeatures: vi.fn(),
    importGeoJson: vi.fn(),
    updateFeatureProperties: vi.fn(),
    ...(overrides.editableMapRef ?? {}),
  })
  const commitHistory = vi.fn()
  const syncAllLayersAfterMutation = vi.fn()
  const onGeometryEditFeedback = vi.fn()
  const setFeatureSelection = vi.fn((featureIds = [], preferredFeatureId = '') => {
    selectedFeatureIds.value = featureIds
    selectedFeatureId.value = preferredFeatureId || featureIds[0] || ''
  })

  const features = useGisFeatures({
    layers,
    activeLayerId,
    activeLayer,
    selectedFeatureId,
    selectedFeatureIds,
    selectedVertexCount,
    selectedVertex,
    selectedVertexDeleteBlockCode,
    editableMapRef,
    currentMode,
    getFeatureId: (feature) => String(feature?.id ?? feature?.properties?.id ?? ''),
    canModifyActiveLayer: computed(() => overrides.canModifyActiveLayer ?? true),
    canDuplicateSelectedFeature: computed(() => overrides.canDuplicateSelectedFeature ?? true),
    canEditSelectedShape: computed(() => overrides.canEditSelectedShape ?? true),
    canDeleteSelection: computed(() => overrides.canDeleteSelection ?? true),
    canMoveSelectedFeatures: computed(() => overrides.canMoveSelectedFeatures ?? true),
    canUseSelectedGeometryTools: computed(() => overrides.canUseSelectedGeometryTools ?? false),
    canBufferSelectedFeature: computed(() => overrides.canBufferSelectedFeature ?? false),
    canCloseSelectedLine: computed(() => false),
    canSplitSelectedLine: computed(() => false),
    canSplitSelectedPolygon: computed(() => false),
    canStartPolygonSplitSketch: computed(() => overrides.canStartPolygonSplitSketch ?? false),
    canMergeSelectedPolygons: computed(() => true),
    canIntersectSelectedPolygons: computed(() => true),
    canDifferenceSelectedPolygons: computed(() => true),
    canConvertSelectedLineToPolygon: computed(() => false),
    setFeatureSelection,
    clearFeatureSelection: vi.fn(),
    syncAllLayersAfterMutation,
    syncFeatureSelectionToMap: vi.fn(),
    resetDrawSelectionMode: vi.fn(),
    commitHistory,
    activeLayerFeatureIdSet: computed(() => new Set(
      (activeLayer.value?.featureCollection?.features ?? [])
        .map((feature) => String(feature?.id ?? feature?.properties?.id ?? ''))
        .filter(Boolean)
    )),
    activeLayerFeatureTableColumns: computed(() => overrides.activeLayerFeatureTableColumns ?? []),
    selectedEditorProperties: computed(() => null),
    selectedEditorGeometryType: computed(() => overrides.selectedEditorGeometryType ?? 'Polygon'),
    selectedPolygonSplitLineFeature: computed(() => null),
    canApplySelectedFeatureBatchProperty: computed(() => false),
    selectedFeatureBatchName: ref(''),
    selectedFeatureBatchPropertyKey: ref(''),
    selectedFeatureBatchPropertyValue: ref(''),
    selectedTextLabelFieldKey: ref(overrides.selectedTextLabelFieldKey ?? ''),
    canApplyTextLabelField: computed(() => overrides.canApplyTextLabelField ?? false),
    featureMoveLayerOptions: computed(() => []),
    selectedBufferDistanceKm: ref(overrides.selectedBufferDistanceKm ?? 1),
    isAuthenticated: ref(true),
    onGeometryEditFeedback,
  })

  return {
    features,
    layers,
    selectedFeatureId,
    selectedFeatureIds,
    selectedVertexCount,
    selectedVertex,
    selectedVertexDeleteBlockCode,
    currentMode,
    editableMapRef,
    commitHistory,
    syncAllLayersAfterMutation,
    setFeatureSelection,
    onGeometryEditFeedback,
  }
}

describe('GIS feature operations', () => {
  it('reports why direct shape editing is unavailable', async () => {
    const wrapper = mountGisFeatures({
      canEditSelectedShape: false,
    })

    await wrapper.features.handleEditSelectedShape()

    expect(wrapper.editableMapRef.value.selectFeature).not.toHaveBeenCalled()
    expect(wrapper.currentMode.value).toBe('simple_select')
    expect(wrapper.onGeometryEditFeedback).toHaveBeenCalledWith({
      type: 'error',
      code: 'geometryEditUnavailable',
    })
  })

  it('reports why exact vertex movement is unavailable before touching history', async () => {
    const wrapper = mountGisFeatures({
      canUseSelectedGeometryTools: false,
      selectedFeatureId: 'poly-1',
      selectedFeatureIds: ['poly-1'],
    })
    wrapper.selectedVertex.value = {
      featureId: 'poly-1',
      coordPath: '0.1',
      coordinate: [1, 0],
    }

    await wrapper.features.handleMoveSelectedVertex({ coordinate: [1.1, 0] })

    expect(wrapper.commitHistory).not.toHaveBeenCalled()
    expect(wrapper.onGeometryEditFeedback).toHaveBeenCalledWith({
      type: 'error',
      code: 'geometryEditUnavailable',
    })
  })

  it('reports why polygon split sketch cannot start', async () => {
    const wrapper = mountGisFeatures({
      canStartPolygonSplitSketch: false,
    })

    await wrapper.features.handleStartPolygonSplitSketch()

    expect(wrapper.currentMode.value).toBe('simple_select')
    expect(wrapper.onGeometryEditFeedback).toHaveBeenCalledWith({
      type: 'error',
      code: 'polygonSplitNoTarget',
    })
  })

  it('reports when the map adapter rejects polygon split sketch mode', async () => {
    const startPolygonSplitSketch = vi.fn(() => false)
    const wrapper = mountGisFeatures({
      canStartPolygonSplitSketch: true,
      editableMapRef: {
        startPolygonSplitSketch,
      },
    })

    await wrapper.features.handleStartPolygonSplitSketch()

    expect(startPolygonSplitSketch).toHaveBeenCalledWith('poly-1')
    expect(wrapper.currentMode.value).toBe('simple_select')
    expect(wrapper.onGeometryEditFeedback).toHaveBeenCalledWith({
      type: 'error',
      code: 'polygonSplitNoTarget',
    })
  })

  it('applies MapLibre layer-layout-only text settings at layer scope even with a selected feature', async () => {
    const wrapper = mountGisFeatures({
      layers: [{
        id: 'layer-1',
        name: '文本图层',
        geometryType: 'Text',
        visible: true,
        locked: false,
        textLineHeight: 1.2,
        textAllowOverlap: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [
            pointFeature('text-1', [113, 23]),
            pointFeature('text-2', [114, 24]),
          ],
        },
      }],
      selectedFeatureId: 'text-1',
      selectedFeatureIds: ['text-1'],
      selectedEditorGeometryType: 'Text',
    })

    await wrapper.features.updateSelectedFeatureProperty('textLineHeight', 1.6)
    await wrapper.features.updateSelectedFeatureProperty('textAllowOverlap', true)

    const layer = wrapper.layers.value[0]
    expect(layer.textLineHeight).toBe(1.6)
    expect(layer.textAllowOverlap).toBe(true)
    expect(layer.featureCollection.features.map((feature) => feature.properties.textLineHeight)).toEqual([1.6, 1.6])
    expect(layer.featureCollection.features.map((feature) => feature.properties.textAllowOverlap)).toEqual([true, true])
    expect(wrapper.editableMapRef.value.updateFeatureProperties).not.toHaveBeenCalled()
    expect(wrapper.syncAllLayersAfterMutation).toHaveBeenCalledTimes(2)
  })

  it('applies text labels from a data field to editable targets only', async () => {
    const wrapper = mountGisFeatures({
      layers: [{
        id: 'layer-1',
        name: '文本图层',
        geometryType: 'Text',
        visible: true,
        locked: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [
            { ...pointFeature('text-1', [113, 23]), properties: { id: 'text-1', dialect: '粤语', visible: true, locked: false } },
            { ...pointFeature('text-2', [114, 24]), properties: { id: 'text-2', dialect: { group: '客家' }, visible: true, locked: false } },
            { ...pointFeature('text-3', [115, 25]), properties: { id: 'text-3', dialect: '隐藏', visible: false, locked: false } },
            { ...pointFeature('text-4', [116, 26]), properties: { id: 'text-4', dialect: '锁定', visible: true, locked: true } },
          ],
        },
      }],
      selectedFeatureId: '',
      selectedFeatureIds: [],
      selectedEditorGeometryType: 'Text',
      activeLayerFeatureTableColumns: [{ key: 'dialect', label: 'dialect' }],
      selectedTextLabelFieldKey: 'dialect',
      canApplyTextLabelField: true,
    })

    await wrapper.features.handleApplyTextLabelField()

    const features = wrapper.layers.value[0].featureCollection.features
    expect(features.map((feature) => feature.properties.annotationText)).toEqual([
      '粤语',
      '{"group":"客家"}',
      undefined,
      undefined,
    ])
    expect(wrapper.commitHistory).toHaveBeenCalledTimes(1)
    expect(wrapper.syncAllLayersAfterMutation).toHaveBeenCalledTimes(1)
  })

  it('applies text labels from a data field to selected editable features only', async () => {
    const wrapper = mountGisFeatures({
      layers: [{
        id: 'layer-1',
        name: '文本图层',
        geometryType: 'Text',
        visible: true,
        locked: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [
            { ...pointFeature('text-1', [113, 23]), properties: { id: 'text-1', dialect: '粤语', visible: true, locked: false } },
            { ...pointFeature('text-2', [114, 24]), properties: { id: 'text-2', dialect: '客家话', visible: true, locked: false } },
          ],
        },
      }],
      selectedFeatureId: 'text-2',
      selectedFeatureIds: ['text-2'],
      selectedEditorGeometryType: 'Text',
      activeLayerFeatureTableColumns: [{ key: 'dialect', label: 'dialect' }],
      selectedTextLabelFieldKey: 'dialect',
      canApplyTextLabelField: true,
    })

    await wrapper.features.handleApplyTextLabelField()

    const features = wrapper.layers.value[0].featureCollection.features
    expect(features.map((feature) => feature.properties.annotationText)).toEqual([undefined, '客家话'])
    expect(wrapper.setFeatureSelection).toHaveBeenCalledWith(['text-2'], 'text-2')
  })

  it('merges selected polygon features into the first selected feature and removes the rest', async () => {
    const wrapper = mountGisFeatures()

    await wrapper.features.handleMergeSelectedPolygons()

    const nextFeatures = wrapper.layers.value[0].featureCollection.features
    expect(nextFeatures.map((feature) => feature.id)).toEqual(['poly-1', 'poly-3'])
    expect(nextFeatures[0].geometry.type).toBe('Polygon')
    expect(nextFeatures[0].properties.name).toBe('poly-1')
    expect(wrapper.commitHistory).toHaveBeenCalledTimes(1)
    expect(wrapper.setFeatureSelection).toHaveBeenCalledWith(['poly-1'], 'poly-1')
    expect(wrapper.currentMode.value).toBe('simple_select')
    expect(wrapper.syncAllLayersAfterMutation).toHaveBeenCalledTimes(1)
    expect(wrapper.editableMapRef.value.selectFeature).toHaveBeenCalledWith('poly-1', { directEdit: false })
  })

  it('does not merge polygons when the selected polygon union is invalid', async () => {
    const wrapper = mountGisFeatures({
      layers: [{
        id: 'layer-1',
        name: '面图层',
        geometryType: 'Polygon',
        visible: true,
        locked: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [
            polygonFeature('poly-1', [[0, 0], [1, 0], [0, 0]]),
            polygonFeature('poly-2', [[1, 0], [2, 0], [1, 0]]),
          ],
        },
      }],
    })

    await wrapper.features.handleMergeSelectedPolygons()

    expect(wrapper.layers.value[0].featureCollection.features.map((feature) => feature.id)).toEqual(['poly-1', 'poly-2'])
    expect(wrapper.commitHistory).not.toHaveBeenCalled()
    expect(wrapper.syncAllLayersAfterMutation).not.toHaveBeenCalled()
  })

  it('does not buffer a point layer when unselected point siblings would remain in the converted layer', async () => {
    const wrapper = mountGisFeatures({
      layers: [{
        id: 'layer-1',
        name: '点图层',
        geometryType: 'Point',
        visible: true,
        locked: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [
            pointFeature('point-1', [0, 0]),
            pointFeature('point-2', [1, 1]),
          ],
        },
      }],
      selectedFeatureId: 'point-1',
      selectedFeatureIds: ['point-1'],
      canBufferSelectedFeature: true,
      selectedBufferDistanceKm: 1,
    })

    await wrapper.features.handleBufferSelectedFeature()

    expect(wrapper.layers.value[0].geometryType).toBe('Point')
    expect(wrapper.layers.value[0].featureCollection.features.map((feature) => feature.geometry.type)).toEqual(['Point', 'Point'])
    expect(wrapper.commitHistory).not.toHaveBeenCalled()
    expect(wrapper.syncAllLayersAfterMutation).not.toHaveBeenCalled()
    expect(wrapper.editableMapRef.value.selectFeature).not.toHaveBeenCalled()
  })

  it('buffers a single selected point into a polygon and keeps editor state in simple select', async () => {
    const wrapper = mountGisFeatures({
      layers: [{
        id: 'layer-1',
        name: '点图层',
        geometryType: 'Point',
        visible: true,
        locked: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [pointFeature('point-1', [0, 0])],
        },
      }],
      selectedFeatureId: 'point-1',
      selectedFeatureIds: ['point-1'],
      canBufferSelectedFeature: true,
      selectedBufferDistanceKm: 1,
    })

    await wrapper.features.handleBufferSelectedFeature()

    const [bufferedFeature] = wrapper.layers.value[0].featureCollection.features
    expect(wrapper.layers.value[0].geometryType).toBe('Polygon')
    expect(bufferedFeature.geometry.type).toBe('Polygon')
    expect(bufferedFeature.id).toBe('point-1')
    expect(wrapper.commitHistory).toHaveBeenCalledTimes(1)
    expect(wrapper.setFeatureSelection).toHaveBeenCalledWith(['point-1'], 'point-1')
    expect(wrapper.currentMode.value).toBe('simple_select')
    expect(wrapper.syncAllLayersAfterMutation).toHaveBeenCalledTimes(1)
    expect(wrapper.editableMapRef.value.selectFeature).toHaveBeenCalledWith('point-1', { directEdit: false })
    expect(wrapper.onGeometryEditFeedback).toHaveBeenCalledWith({ type: 'success', code: 'geometryBufferSuccess' })
  })

  it('intersects selected polygons into the active selected polygon and preserves other polygons', async () => {
    const wrapper = mountGisFeatures({
      layers: [{
        id: 'layer-1',
        name: '面图层',
        geometryType: 'Polygon',
        visible: true,
        locked: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [
            polygonFeature('poly-1', [[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]]),
            polygonFeature('poly-2', [[1, 1], [4, 1], [4, 4], [1, 4], [1, 1]]),
            polygonFeature('poly-3', [[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]),
          ],
        },
      }],
      selectedFeatureId: 'poly-2',
      selectedFeatureIds: ['poly-1', 'poly-2'],
    })

    await wrapper.features.handleIntersectSelectedPolygons()

    const nextFeatures = wrapper.layers.value[0].featureCollection.features
    expect(nextFeatures.map((feature) => feature.id)).toEqual(['poly-1', 'poly-2', 'poly-3'])
    expect(nextFeatures.find((feature) => feature.id === 'poly-2').geometry.type).toBe('Polygon')
    expect(nextFeatures.find((feature) => feature.id === 'poly-1').geometry.coordinates[0]).toEqual([[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]])
    expect(wrapper.commitHistory).toHaveBeenCalledTimes(1)
    expect(wrapper.setFeatureSelection).toHaveBeenCalledWith(['poly-2'], 'poly-2')
    expect(wrapper.syncAllLayersAfterMutation).toHaveBeenCalledTimes(1)
    expect(wrapper.editableMapRef.value.selectFeature).toHaveBeenCalledWith('poly-2', { directEdit: false })
    expect(wrapper.onGeometryEditFeedback).toHaveBeenCalledWith({ type: 'success', code: 'geometryIntersectSuccess' })
  })

  it('differences selected polygons from the active selected polygon and preserves cutters', async () => {
    const wrapper = mountGisFeatures({
      layers: [{
        id: 'layer-1',
        name: '面图层',
        geometryType: 'Polygon',
        visible: true,
        locked: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [
            polygonFeature('poly-1', [[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]]),
            polygonFeature('poly-2', [[1, 1], [4, 1], [4, 4], [1, 4], [1, 1]]),
            polygonFeature('poly-3', [[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]),
          ],
        },
      }],
      selectedFeatureId: 'poly-1',
      selectedFeatureIds: ['poly-1', 'poly-2'],
    })

    await wrapper.features.handleDifferenceSelectedPolygons()

    const nextFeatures = wrapper.layers.value[0].featureCollection.features
    expect(nextFeatures.map((feature) => feature.id)).toEqual(['poly-1', 'poly-2', 'poly-3'])
    expect(nextFeatures.find((feature) => feature.id === 'poly-1').geometry.type).toBe('Polygon')
    expect(nextFeatures.find((feature) => feature.id === 'poly-1').geometry.coordinates[0]).not.toEqual([[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]])
    expect(nextFeatures.find((feature) => feature.id === 'poly-2').geometry.coordinates[0]).toEqual([[1, 1], [4, 1], [4, 4], [1, 4], [1, 1]])
    expect(wrapper.commitHistory).toHaveBeenCalledTimes(1)
    expect(wrapper.setFeatureSelection).toHaveBeenCalledWith(['poly-1'], 'poly-1')
    expect(wrapper.syncAllLayersAfterMutation).toHaveBeenCalledTimes(1)
    expect(wrapper.editableMapRef.value.selectFeature).toHaveBeenCalledWith('poly-1', { directEdit: false })
    expect(wrapper.onGeometryEditFeedback).toHaveBeenCalledWith({ type: 'success', code: 'geometryDifferenceSuccess' })
  })
})
