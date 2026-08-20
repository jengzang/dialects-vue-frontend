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
  const selectedFeatureId = ref('poly-1')
  const selectedFeatureIds = ref(['poly-1', 'poly-2'])
  const currentMode = ref('simple_select')
  const selectedVertex = ref(null)
  const editableMapRef = ref({
    selectFeature: vi.fn(),
    selectFeatures: vi.fn(),
    importGeoJson: vi.fn(),
  })
  const commitHistory = vi.fn()
  const syncAllLayersAfterMutation = vi.fn()
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
    selectedVertex,
    editableMapRef,
    currentMode,
    getFeatureId: (feature) => String(feature?.id ?? feature?.properties?.id ?? ''),
    canModifyActiveLayer: computed(() => true),
    canDuplicateSelectedFeature: computed(() => true),
    canEditSelectedShape: computed(() => true),
    canDeleteSelection: computed(() => true),
    canMoveSelectedFeatures: computed(() => true),
    canUseSelectedGeometryTools: computed(() => false),
    canCloseSelectedLine: computed(() => false),
    canSplitSelectedLine: computed(() => false),
    canSplitSelectedPolygon: computed(() => false),
    canStartPolygonSplitSketch: computed(() => false),
    canMergeSelectedPolygons: computed(() => true),
    canConvertSelectedLineToPolygon: computed(() => false),
    setFeatureSelection,
    clearFeatureSelection: vi.fn(),
    syncAllLayersAfterMutation,
    syncFeatureSelectionToMap: vi.fn(),
    resetDrawSelectionMode: vi.fn(),
    commitHistory,
    activeLayerFeatureIdSet: computed(() => new Set(['poly-1', 'poly-2', 'poly-3'])),
    activeLayerFeatureTableColumns: computed(() => []),
    selectedEditorProperties: computed(() => null),
    selectedEditorGeometryType: computed(() => 'Polygon'),
    selectedPolygonSplitLineFeature: computed(() => null),
    canApplySelectedFeatureBatchProperty: computed(() => false),
    selectedFeatureBatchName: ref(''),
    selectedFeatureBatchPropertyKey: ref(''),
    selectedFeatureBatchPropertyValue: ref(''),
    featureMoveLayerOptions: computed(() => []),
    isAuthenticated: ref(true),
  })

  return {
    features,
    layers,
    selectedFeatureId,
    selectedFeatureIds,
    currentMode,
    editableMapRef,
    commitHistory,
    syncAllLayersAfterMutation,
    setFeatureSelection,
  }
}

describe('GIS feature operations', () => {
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
})
