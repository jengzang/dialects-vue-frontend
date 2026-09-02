import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, ref } from 'vue'

const mocks = vi.hoisted(() => {
  globalThis.__WEB_BASE__ = ''

  return {
    showConfirm: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showWarning: vi.fn(),
    saveDraftRecord: vi.fn(),
    listDraftRecords: vi.fn(),
    getDraftRecordById: vi.fn(),
    migrateLegacyDraftsFromLocalStorage: vi.fn(),
    updateDraftRecord: vi.fn(),
    deleteDraftRecord: vi.fn(),
    mapSetDrawMode: vi.fn(),
    mapSelectFeature: vi.fn(),
    mapSelectFeatures: vi.fn(),
    mapCanDeleteSelected: vi.fn(),
    mapDeleteSelected: vi.fn(),
    mapImportGeoJson: vi.fn(),
    latestToolsPanelProps: null,
    routerPush: vi.fn(),
    isAuthenticated: { value: true },
    AUTO_DRAFT_ID: '__map_draw_auto_draft__',
  }
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, params = {}) => `${key}${Object.keys(params).length ? JSON.stringify(params) : ''}`,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: mocks.routerPush }),
}))

vi.mock('@/composables/router/useAuthGuard.js', () => ({
  useAuthGuard: () => ({
    isAuthenticated: mocks.isAuthenticated,
    requireAuth: vi.fn(),
  }),
}))

vi.mock('@/utils/ui/message.js', () => ({
  showConfirm: mocks.showConfirm,
  showError: mocks.showError,
  showSuccess: mocks.showSuccess,
  showWarning: mocks.showWarning,
}))

vi.mock('@/api/main/geo/LocationAndRegion.js', () => ({
  getLocationPartitions: vi.fn(),
}))

vi.mock('@/api/auth/httpClient.js', () => ({
  api: vi.fn(),
}))

vi.mock('@/composables/data/usePartitionCache.js', () => ({
  usePartitionCache: () => ({
    getPartitionData: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('@/main/store/store.js', () => ({
  globalPayload: ref(null),
}))

vi.mock('@/main/utils/drawMap/draftStorage.js', async () => {
  const actual = await vi.importActual('@/main/utils/drawMap/draftStorage.js')
  return {
    ...actual,
    AUTO_DRAFT_ID: mocks.AUTO_DRAFT_ID,
    deleteDraftRecord: mocks.deleteDraftRecord,
    getDraftRecordById: mocks.getDraftRecordById,
    listDraftRecords: mocks.listDraftRecords,
    migrateLegacyDraftsFromLocalStorage: mocks.migrateLegacyDraftsFromLocalStorage,
    saveDraftRecord: mocks.saveDraftRecord,
    updateDraftRecord: mocks.updateDraftRecord,
  }
})

vi.mock('@/main/components/map/EditableMapLibre.vue', () => ({
  default: defineComponent({
    name: 'EditableMapLibreStub',
    props: [
      'modelValue',
      'activeLayer',
      'featureBoxSelectEnabled',
      'snappingEnabled',
      'snapTolerance',
      'snapGridSize',
      'snapTargets',
      'topologyEditingEnabled',
      'sharedBoundaryProtectionEnabled',
    ],
    emits: [
      'update:modelValue',
      'before-features-change',
      'features-change',
      'feature-select',
      'feature-box-select',
      'mode-change',
      'shape-edit-state-change',
    ],
    setup(props, { emit, expose }) {
      let firstLayerId = ''
      expose({
        setDrawMode: mocks.mapSetDrawMode,
        selectFeature: mocks.mapSelectFeature,
        selectFeatures: mocks.mapSelectFeatures,
        canDeleteSelected: mocks.mapCanDeleteSelected,
        deleteSelected: mocks.mapDeleteSelected,
        importGeoJson: (featureCollection, options = {}) => {
          mocks.mapImportGeoJson(featureCollection, options)
          if (options.emitSelection !== false) {
            emit('feature-select', '')
          }
        },
        syncReadonlyLayers: vi.fn(),
        removeReadonlyLayerById: vi.fn(),
        resetView: vi.fn(),
        toggleFullscreen: vi.fn(),
        isFullscreen: ref(false),
      })
      const addPolygonFeature = () => {
        const nextIndex = (props.modelValue?.features?.length ?? 0) + 1
        const previousFeatures = props.modelValue?.features ?? []
        const activeLayerId = props.activeLayer?.id || ''
        const geometryType = props.activeLayer?.geometryType || 'Polygon'
        if (!firstLayerId && activeLayerId) firstLayerId = activeLayerId
        const isFollowupLayer = activeLayerId && firstLayerId && activeLayerId !== firstLayerId
        const featureProperties = isFollowupLayer
          ? { zone: `Zone ${nextIndex}` }
          : {
              region: `Region ${nextIndex}`,
              user_id: `user-${nextIndex}`,
            }
        const geometry = geometryType === 'LineString'
          ? {
              type: 'LineString',
              coordinates: [
                [0, 0],
                [0.5, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            }
          : {
              type: 'Polygon',
              coordinates: [[
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ]],
            }
        const collection = {
          type: 'FeatureCollection',
          features: [...previousFeatures, {
            id: `feature-${nextIndex}`,
            type: 'Feature',
            properties: featureProperties,
            geometry,
          }],
        }
        emit('update:modelValue', collection)
        emit('features-change', collection)
      }
      const emitGeometryUpdate = () => {
        const [firstFeature, ...remainingFeatures] = props.modelValue?.features ?? []
        if (!firstFeature) return
        const collection = {
          type: 'FeatureCollection',
          features: [{
            ...firstFeature,
            geometry: {
              ...firstFeature.geometry,
              coordinates: [[
                [0, 0],
                [2, 0],
                [2, 2],
                [0, 0],
              ]],
            },
          }, ...remainingFeatures],
        }
        emit('before-features-change')
        emit('update:modelValue', collection)
        emit('features-change', collection)
      }
      const emitDuplicateLineUpdate = () => {
        const [firstFeature, ...remainingFeatures] = props.modelValue?.features ?? []
        if (!firstFeature) return
        const collection = {
          type: 'FeatureCollection',
          features: [{
            ...firstFeature,
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0], [0, 0], [1, 1]],
            },
          }, ...remainingFeatures],
        }
        emit('before-features-change')
        emit('update:modelValue', collection)
        emit('features-change', collection)
      }
      const emitOpenLineUpdate = () => {
        const [firstFeature, ...remainingFeatures] = props.modelValue?.features ?? []
        if (!firstFeature) return
        const collection = {
          type: 'FeatureCollection',
          features: [{
            ...firstFeature,
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0], [2, 0], [2, 2]],
            },
          }, ...remainingFeatures],
        }
        emit('before-features-change')
        emit('update:modelValue', collection)
        emit('features-change', collection)
      }
      const stringify = (value) => JSON.stringify(value)
      return { addPolygonFeature, emitGeometryUpdate, emitDuplicateLineUpdate, emitOpenLineUpdate, stringify }
    },
    template: `
      <div>
        <button data-testid="editable-map" type="button" @click="addPolygonFeature">draw polygon</button>
        <button data-testid="emit-geometry-update" type="button" @click="emitGeometryUpdate">emit geometry update</button>
        <button data-testid="emit-duplicate-line-update" type="button" @click="emitDuplicateLineUpdate">emit duplicate line update</button>
        <button data-testid="emit-open-line-update" type="button" @click="emitOpenLineUpdate">emit open line update</button>
        <button
          data-testid="emit-direct-select"
          type="button"
          @click="$emit('feature-select', 'feature-1'); $emit('mode-change', 'direct_select')"
        >
          emit direct select
        </button>
        <button
          data-testid="emit-direct-select-vertex"
          type="button"
          @click="$emit('shape-edit-state-change', { mode: 'direct_select', featureId: 'feature-1', selectedVertexCount: 1, canDeleteSelectedVertices: true })"
        >
          emit selected vertex
        </button>
        <button
          data-testid="emit-direct-select-invalid-vertex"
          type="button"
          @click="$emit('shape-edit-state-change', { mode: 'direct_select', featureId: 'feature-1', selectedVertexCount: 1, canDeleteSelectedVertices: false })"
        >
          emit invalid selected vertex
        </button>
        <button
          data-testid="emit-direct-select-shared-boundary-vertex"
          type="button"
          @click="$emit('shape-edit-state-change', { mode: 'direct_select', featureId: 'feature-1', selectedVertexCount: 1, canDeleteSelectedVertices: false, deleteBlockCode: 'sharedBoundaryDeleteBlocked' })"
        >
          emit protected shared boundary vertex
        </button>
        <button
          data-testid="emit-direct-select-no-vertex"
          type="button"
          @click="$emit('shape-edit-state-change', { mode: 'direct_select', featureId: 'feature-1', selectedVertexCount: 0, canDeleteSelectedVertices: false })"
        >
          emit no selected vertex
        </button>
        <span data-testid="first-feature-coordinate">{{ modelValue?.features?.[0]?.geometry?.coordinates?.[0]?.[1]?.[0] ?? '' }}</span>
        <span data-testid="first-feature-geometry-type">{{ modelValue?.features?.[0]?.geometry?.type || '' }}</span>
        <span data-testid="first-feature-coordinates">{{ stringify(modelValue?.features?.[0]?.geometry?.coordinates ?? null) }}</span>
        <span data-testid="first-feature-opacity">{{ modelValue?.features?.[0]?.properties?.opacity ?? '' }}</span>
        <span data-testid="first-feature-labels-visible">{{ modelValue?.features?.[0]?.properties?.labelsVisible ? 'true' : 'false' }}</span>
        <span data-testid="box-select-mode">{{ featureBoxSelectEnabled ? 'on' : 'off' }}</span>
        <span data-testid="snapping-enabled">{{ snappingEnabled ? 'on' : 'off' }}</span>
        <span data-testid="snap-tolerance">{{ snapTolerance }}</span>
        <span data-testid="snap-grid-size">{{ snapGridSize }}</span>
        <span data-testid="snap-target-edge">{{ snapTargets?.edge === false ? 'off' : 'on' }}</span>
        <span data-testid="topology-editing-enabled">{{ topologyEditingEnabled ? 'on' : 'off' }}</span>
        <span data-testid="shared-boundary-protection-enabled">{{ sharedBoundaryProtectionEnabled ? 'on' : 'off' }}</span>
        <button
          data-testid="emit-box-selection"
          type="button"
          @click="$emit('feature-box-select', ['feature-1', 'feature-2', 'feature-3'])"
        >
          emit box selection
        </button>
        <button
          data-testid="emit-box-add-selection"
          type="button"
          @click="$emit('feature-box-select', { featureIds: ['feature-2'], selectionMode: 'add' })"
        >
          emit box add selection
        </button>
        <button
          data-testid="emit-box-subtract-selection"
          type="button"
          @click="$emit('feature-box-select', { featureIds: ['feature-1'], selectionMode: 'subtract' })"
        >
          emit box subtract selection
        </button>
        <button
          data-testid="emit-box-null-selection"
          type="button"
          @click="$emit('feature-box-select', null)"
        >
          emit box null selection
        </button>
        <button
          data-testid="emit-feature-one-selection"
          type="button"
          @click="$emit('feature-select', 'feature-1')"
        >
          emit feature one selection
        </button>
        <button
          data-testid="emit-feature-multi-selection"
          type="button"
          @click="$emit('feature-select', ['feature-1', 'feature-2'])"
        >
          emit feature multi selection
        </button>
        <button
          data-testid="emit-feature-mixed-selection"
          type="button"
          @click="$emit('feature-select', ['feature-1', 'feature-2', 'feature-3'])"
        >
          emit feature mixed selection
        </button>
        <button
          data-testid="emit-feature-priority-selection"
          type="button"
          @click="$emit('feature-select', ['feature-3', 'feature-2', 'feature-2', 'feature-1'])"
        >
          emit feature priority selection
        </button>
      </div>
    `,
  }),
}))

vi.mock('@/main/components/map/Draw/panels/MapDrawToolsPanel.vue', () => ({
  default: defineComponent({
    name: 'MapDrawToolsPanelStub',
    props: {
      activeLayer: { type: Object, default: null },
      featureItems: { type: Array, default: () => [] },
      featureTableColumns: { type: Array, default: () => [] },
      featureTableRows: { type: Array, default: () => [] },
      featureMoveLayerOptions: { type: Array, default: () => [] },
      selectedFeatureBatchName: { type: String, default: '' },
      selectedFeatureBatchPropertyKey: { type: String, default: '' },
      selectedFeatureBatchPropertyValue: { type: String, default: '' },
      selectedFeatureId: { type: String, default: '' },
      selectedFeatureIds: { type: Array, default: () => [] },
      selectedFeatureGeometryType: { type: String, default: '' },
      currentMode: { type: String, default: 'simple_select' },
      selectedVertexCount: { type: Number, default: 0 },
      selectedVertexDeleteBlockCode: { type: String, default: '' },
      canDeleteSelectedVertices: { type: Boolean, default: false },
      geometryEditStatus: { type: Object, default: null },
      canApplySelectedFeatureBatchProperty: { type: Boolean, default: false },
      isFeatureBoxSelectMode: { type: Boolean, default: false },
      canUseFeatureBoxSelect: { type: Boolean, default: false },
      canModifyActiveLayer: { type: Boolean, default: false },
      canUseSelectedGeometryTools: { type: Boolean, default: false },
      canCloseSelectedLine: { type: Boolean, default: false },
      canConvertSelectedLineToPolygon: { type: Boolean, default: false },
      geometryQualitySummary: {
        type: Object,
        default: () => ({ hasIssues: false, issueCount: 0, items: [] }),
      },
      snappingEnabled: { type: Boolean, default: true },
      snapTolerance: { type: Number, default: 12 },
      snapGridSize: { type: Number, default: 0 },
      snapTargets: { type: Object, default: () => ({ vertex: true, midpoint: true, edge: true, grid: true, reference: true }) },
      topologyEditingEnabled: { type: Boolean, default: true },
      sharedBoundaryProtectionEnabled: { type: Boolean, default: true },
    },
    emits: [
      'set-mode',
      'select-feature',
      'toggle-feature-selection',
      'select-all-features',
      'invert-feature-selection',
      'clear-feature-selection',
      'toggle-feature-box-select',
      'delete-selected-features',
      'move-selected-features-to-layer',
      'set-selected-features-visible',
      'set-selected-features-locked',
      'reverse-selected-geometry',
      'simplify-selected-geometry',
      'close-selected-line',
      'convert-selected-line-to-polygon',
      'update-feature-property',
      'update-feature-table-cell',
      'update:selected-feature-batch-name',
      'apply-selected-feature-batch-name',
      'update:selected-feature-batch-property-key',
      'update:selected-feature-batch-property-value',
      'apply-selected-feature-batch-property',
      'update:snappingEnabled',
      'update:snapTolerance',
      'update:snapGridSize',
      'update:snap-targets',
      'update:topologyEditingEnabled',
      'update:sharedBoundaryProtectionEnabled',
    ],
    setup(props) {
      mocks.latestToolsPanelProps = props
      return { props }
    },
    template: `
      <div data-testid="tools-panel">
        <span data-testid="active-layer-id">{{ activeLayer?.id || '' }}</span>
        <span data-testid="current-mode">{{ currentMode }}</span>
        <button
          data-testid="toggle-snapping"
          type="button"
          @click="$emit('update:snappingEnabled', !snappingEnabled)"
        >
          toggle snapping
        </button>
        <input
          data-testid="snap-tolerance-input"
          type="range"
          :value="snapTolerance"
          @input="$emit('update:snapTolerance', Number($event.target.value))"
        >
        <input
          data-testid="snap-grid-input"
          type="number"
          :value="snapGridSize"
          @input="$emit('update:snapGridSize', Number($event.target.value))"
        >
        <button
          data-testid="toggle-snap-edge"
          type="button"
          @click="$emit('update:snap-targets', { ...snapTargets, edge: !snapTargets.edge })"
        >
          toggle edge snap
        </button>
        <button
          data-testid="toggle-topology-editing"
          type="button"
          @click="$emit('update:topologyEditingEnabled', !topologyEditingEnabled)"
        >
          toggle topology editing
        </button>
        <button
          data-testid="toggle-shared-boundary-protection"
          type="button"
          @click="$emit('update:sharedBoundaryProtectionEnabled', !sharedBoundaryProtectionEnabled)"
        >
          toggle shared boundary protection
        </button>
        <span data-testid="selected-vertex-count">{{ selectedVertexCount }}</span>
        <span data-testid="can-delete-selected-vertices">{{ canDeleteSelectedVertices ? 'true' : 'false' }}</span>
        <span data-testid="geometry-edit-status-code">{{ geometryEditStatus?.code || '' }}</span>
        <span data-testid="geometry-edit-status-message">{{ geometryEditStatus?.message || '' }}</span>
        <button
          data-testid="editor-hide-active-layer"
          type="button"
          @click="$emit('update-feature-property', 'visible', false)"
        >
          editor hide active layer
        </button>
        <button
          data-testid="editor-lock-active-layer"
          type="button"
          @click="$emit('update-feature-property', 'locked', true)"
        >
          editor lock active layer
        </button>
        <button
          data-testid="draw-polygon-mode"
          type="button"
          @click="$emit('set-mode', 'draw_polygon')"
        >
          draw polygon mode
        </button>
        <button
          data-testid="reverse-selected-geometry"
          type="button"
          @click="$emit('reverse-selected-geometry')"
        >
          reverse geometry
        </button>
        <button
          data-testid="simplify-selected-geometry"
          type="button"
          @click="$emit('simplify-selected-geometry')"
        >
          simplify geometry
        </button>
        <button
          data-testid="close-selected-line"
          type="button"
          @click="$emit('close-selected-line')"
        >
          close line
        </button>
        <button
          data-testid="convert-selected-line-to-polygon"
          type="button"
          @click="$emit('convert-selected-line-to-polygon')"
        >
          convert line to polygon
        </button>
        <label v-for="feature in featureItems" :key="feature.id" data-testid="feature-row">
          <input
            data-testid="feature-checkbox"
            type="checkbox"
            :checked="selectedFeatureIds.includes(feature.id)"
            @change="$emit('toggle-feature-selection', feature.id)"
          >
          {{ feature.label }}
          <span
            data-testid="feature-state"
            :data-visible="feature.visible ? 'true' : 'false'"
            :data-locked="feature.locked ? 'true' : 'false'"
          >
            {{ feature.visible ? 'visible' : 'hidden' }} {{ feature.locked ? 'locked' : 'unlocked' }}
          </span>
          <button
            data-testid="feature-select-row"
            type="button"
            :data-active="selectedFeatureId === feature.id ? 'true' : 'false'"
            @click.stop="$emit('select-feature', feature.id)"
          >
            select row
          </button>
        </label>
        <button
          data-testid="toggle-feature-box-select"
          type="button"
          :data-active="isFeatureBoxSelectMode ? 'true' : 'false'"
          :disabled="!canUseFeatureBoxSelect"
          @click="$emit('toggle-feature-box-select')"
        >
          toggle box select
        </button>
        <button
          data-testid="select-all-features"
          type="button"
          :disabled="!canModifyActiveLayer || featureItems.length === 0"
          @click="$emit('select-all-features')"
        >
          select all features
        </button>
        <button
          data-testid="invert-feature-selection"
          type="button"
          :disabled="!canModifyActiveLayer || featureItems.length === 0"
          @click="$emit('invert-feature-selection')"
        >
          invert feature selection
        </button>
        <button
          data-testid="clear-feature-selection"
          type="button"
          :disabled="selectedFeatureIds.length === 0"
          @click="$emit('clear-feature-selection')"
        >
          clear feature selection
        </button>
        <button
          data-testid="delete-selected-features"
          type="button"
          :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
          @click="$emit('delete-selected-features')"
        >
          delete selected features
        </button>
        <button
          data-testid="move-selected-features"
          type="button"
          :disabled="!canModifyActiveLayer || selectedFeatureIds.length < 2 || featureMoveLayerOptions.length === 0"
          @click="$emit('move-selected-features-to-layer', featureMoveLayerOptions[0]?.value)"
        >
          move selected features
        </button>
        <button
          data-testid="hide-selected-features"
          type="button"
          :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
          @click="$emit('set-selected-features-visible', false)"
        >
          hide selected features
        </button>
        <button
          data-testid="show-selected-features"
          type="button"
          :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
          @click="$emit('set-selected-features-visible', true)"
        >
          show selected features
        </button>
        <button
          data-testid="lock-selected-features"
          type="button"
          :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
          @click="$emit('set-selected-features-locked', true)"
        >
          lock selected features
        </button>
        <button
          data-testid="unlock-selected-features"
          type="button"
          :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0"
          @click="$emit('set-selected-features-locked', false)"
        >
          unlock selected features
        </button>
        <input
          data-testid="batch-name-input"
          :value="selectedFeatureBatchName"
          @input="$emit('update:selected-feature-batch-name', $event.target.value)"
        >
        <button
          data-testid="apply-batch-name"
          type="button"
          :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0 || !selectedFeatureBatchName.trim()"
          @click="$emit('apply-selected-feature-batch-name')"
        >
          apply batch name
        </button>
        <select
          data-testid="batch-property-key"
          :value="selectedFeatureBatchPropertyKey"
          @change="$emit('update:selected-feature-batch-property-key', $event.target.value)"
        >
          <option value="">select property</option>
          <option v-for="column in featureTableColumns" :key="column.key" :value="column.key">
            {{ column.label }}
          </option>
        </select>
        <input
          data-testid="batch-property-value"
          :value="selectedFeatureBatchPropertyValue"
          :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0 || !canApplySelectedFeatureBatchProperty"
          @input="$emit('update:selected-feature-batch-property-value', $event.target.value)"
        >
        <button
          data-testid="apply-batch-property"
          type="button"
          :disabled="!canModifyActiveLayer || selectedFeatureIds.length === 0 || !canApplySelectedFeatureBatchProperty"
          @click="$emit('apply-selected-feature-batch-property')"
        >
          apply batch property
        </button>
        <table data-testid="feature-table">
          <tbody>
            <tr v-for="row in featureTableRows" :key="row.id" data-testid="feature-table-row">
              <td>
                <input
                  data-testid="feature-table-name"
                  :value="row.name"
                  @input="$emit('update-feature-table-cell', row.id, 'name', $event.target.value)"
                >
              </td>
              <td v-for="column in featureTableColumns" :key="column.key">
                <input
                  data-testid="feature-table-property-input"
                  :data-property-key="column.key"
                  :value="row.properties?.[column.key] ?? ''"
                  @input="$emit('update-feature-table-cell', row.id, column.key, $event.target.value)"
                >
              </td>
              <td data-testid="feature-table-geometry">{{ row.geometryType }}</td>
              <td data-testid="feature-table-property-summary">{{ row.propertySummary }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  }),
}))

vi.mock('@/main/components/map/Draw/panels/MapDrawLayersPanel.vue', () => ({
  default: defineComponent({
    name: 'MapDrawLayersPanelStub',
    props: {
      layers: { type: Array, default: () => [] },
      activeLayerId: { type: String, default: '' },
    },
    emits: ['select-layer', 'toggle-layer-visibility', 'toggle-layer-lock', 'toggle-layer-labels', 'update-layer-opacity'],
    template: `
      <div data-testid="layers-panel">
        <div v-for="layer in layers" :key="layer.id">
          <button
            data-testid="layer-button"
            type="button"
            :data-active="activeLayerId === layer.id"
            @click="$emit('select-layer', layer.id)"
          >
            {{ layer.id }}
          </button>
          <button
            data-testid="toggle-layer-visibility"
            type="button"
            @click="$emit('toggle-layer-visibility', layer.id)"
          >
            visibility
          </button>
          <button
            data-testid="toggle-layer-lock"
            type="button"
            @click="$emit('toggle-layer-lock', layer.id)"
          >
            lock
          </button>
          <button
            data-testid="toggle-layer-labels"
            type="button"
            :data-active="layer.labelsVisible ? 'true' : 'false'"
            @click="$emit('toggle-layer-labels', layer.id)"
          >
            labels
          </button>
          <input
            data-testid="layer-opacity-input"
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="layer.opacity ?? 1"
            @input="$emit('update-layer-opacity', layer.id, Number($event.target.value))"
          >
        </div>
      </div>
    `,
  }),
}))

vi.mock('@/main/components/map/Draw/panels/MapDrawVoronoiPanel.vue', () => ({
  default: defineComponent({
    name: 'MapDrawVoronoiPanelStub',
    template: '<div data-testid="voronoi-panel" />',
  }),
}))

vi.mock('@/main/components/map/Draw/modals/MapDrawImageExportModal.vue', () => ({
  default: defineComponent({ name: 'MapDrawImageExportModalStub', template: '<div />' }),
}))

vi.mock('@/main/components/map/Draw/modals/MapDrawImagePreviewModal.vue', () => ({
  default: defineComponent({ name: 'MapDrawImagePreviewModalStub', template: '<div />' }),
}))

vi.mock('@/main/components/map/Draw/modals/VoronoiExportLayersModal.vue', () => ({
  default: defineComponent({ name: 'VoronoiExportLayersModalStub', template: '<div />' }),
}))

vi.mock('@/main/components/map/Draw/modals/VoronoiIgnorePointsModal.vue', () => ({
  default: defineComponent({ name: 'VoronoiIgnorePointsModalStub', template: '<div />' }),
}))

vi.mock('@/main/components/map/Draw/modals/VoronoiFieldMergeModal.vue', () => ({
  default: defineComponent({ name: 'VoronoiFieldMergeModalStub', template: '<div />' }),
}))

vi.mock('@/components/import/TabularImportPreview.vue', () => ({
  default: defineComponent({ name: 'TabularImportPreviewStub', template: '<div />' }),
}))

vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({
  default: defineComponent({
    name: 'SimpleSelectDropdownStub',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" />',
  }),
}))

vi.mock('@/components/common/AppModal.vue', () => ({
  default: defineComponent({
    name: 'AppModalStub',
    props: ['modelValue'],
    template: '<div v-if="modelValue" data-testid="modal"><slot /><slot name="footer" /></div>',
  }),
}))

vi.mock('@/composables/import/useTabularImportPreview.js', () => ({
  useTabularImportPreview: () => ({
    file: ref(null),
    loading: ref(false),
    previewTable: ref(null),
    diagnostics: ref([]),
    mapping: ref({}),
    selectedSheetId: ref(''),
    headerRowIndex: ref(0),
    parsedFile: ref(null),
    summary: ref(null),
    loadFile: vi.fn(),
    resetState: vi.fn(),
    updateMapping: vi.fn(),
  }),
}))

vi.mock('@/composables/import/useVoronoiCustomImport.js', () => ({
  useVoronoiCustomImport: () => ({
    schema: ref([]),
    partitionMode: ref('map'),
    summary: ref(null),
    applyPreviewSummary: vi.fn(() => []),
    clearImportedData: vi.fn(),
  }),
}))

vi.mock('@/main/utils/drawMap/voronoiClip.js', () => ({
  clipVoronoiFeatureCollectionToNationalBorder: vi.fn(),
  prepareNationalBorderForVoronoiClip: vi.fn(),
}))

vi.mock('@/main/utils/drawMap/partitionVoronoi.js', () => ({
  PARTITION_MODE_MAP: 'map',
  PARTITION_MODE_YINDIAN: 'yindian',
  buildPartitionColorMap: vi.fn(() => new Map()),
  buildPartitionPointFeatureCollection: vi.fn(() => ({ type: 'FeatureCollection', features: [] })),
  buildPartitionPoints: vi.fn(() => []),
  buildVoronoiSelectionOptions: vi.fn(() => []),
  calculatePartitionVoronoi: vi.fn(),
}))

vi.mock('@/main/utils/drawMap/export.js', () => ({
  readImportedLayerFile: vi.fn(),
  readKmzArrayBuffer: vi.fn(),
  splitFeatureCollectionByGeometryType: vi.fn(),
}))

vi.mock('/data/国界面.kmz?url', () => ({ default: '/data/border.kmz' }))
vi.mock('/data/gis/china_country.geojson?url', () => ({ default: '/data/gis/china_country.geojson' }))
vi.mock('/data/gis/china_provinces.geojson?url', () => ({ default: '/data/gis/china_provinces.geojson' }))
vi.mock('/data/gis/china_cities_simplified_balanced.geojson?url', () => ({ default: '/data/gis/china_cities_simplified_balanced.geojson' }))
vi.mock('/data/gis/china_counties_simplified_light.geojson?url', () => ({ default: '/data/gis/china_counties_simplified_light.geojson' }))
vi.mock('/data/gis/china_rivers_l1.geojson?url', () => ({ default: '/data/gis/china_rivers_l1.geojson' }))
vi.mock('/data/gis/china_rivers_l2.geojson?url', () => ({ default: '/data/gis/china_rivers_l2.geojson' }))
vi.mock('/data/gis/china_rivers_l3.geojson?url', () => ({ default: '/data/gis/china_rivers_l3.geojson' }))

import { buildAutoDraftRecord } from '../src/main/utils/drawMap/draftStorage.js'
import { readImportedLayerFile, splitFeatureCollectionByGeometryType } from '../src/main/utils/drawMap/export.js'
import MapDrawTab from '../src/main/views/explore/GisPage.vue'

function mountMapDrawTab() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(MapDrawTab)
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

function clickButtonContaining(host, text) {
  const button = [...host.querySelectorAll('button')]
    .find((item) => item.textContent.includes(text))
  expect(button).toBeTruthy()
  button.click()
}

function clickLastButtonContaining(host, text) {
  const buttons = [...host.querySelectorAll('button')]
    .filter((item) => item.textContent.includes(text))
  expect(buttons.length).toBeGreaterThan(0)
  buttons[buttons.length - 1].click()
}

async function flushTicks(count = 3) {
  for (let index = 0; index < count; index += 1) {
    await nextTick()
    await Promise.resolve()
  }
}

function createDeferred() {
  let resolve
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

describe('MapDrawTab draft safety', () => {
  beforeEach(() => {
    mocks.showConfirm.mockReset()
    mocks.showError.mockReset()
    mocks.showSuccess.mockReset()
    mocks.showWarning.mockReset()
    mocks.saveDraftRecord.mockReset()
    mocks.listDraftRecords.mockReset()
    mocks.getDraftRecordById.mockReset()
    mocks.migrateLegacyDraftsFromLocalStorage.mockReset()
    mocks.updateDraftRecord.mockReset()
    mocks.deleteDraftRecord.mockReset()
    mocks.mapSetDrawMode.mockReset()
    mocks.mapSelectFeature.mockReset()
    mocks.mapSelectFeatures.mockReset()
    mocks.mapCanDeleteSelected.mockReset()
    mocks.mapCanDeleteSelected.mockReturnValue(true)
    mocks.mapDeleteSelected.mockReset()
    mocks.mapImportGeoJson.mockReset()
    mocks.latestToolsPanelProps = null
    mocks.routerPush.mockReset()
    mocks.isAuthenticated.value = true
    readImportedLayerFile.mockReset()
    splitFeatureCollectionByGeometryType.mockReset()

    mocks.listDraftRecords.mockResolvedValue([])
    mocks.migrateLegacyDraftsFromLocalStorage.mockResolvedValue(false)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps drawing tools visible but blocks unauthenticated draw-mode writes', async () => {
    mocks.isAuthenticated.value = false
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.showConfirm.mockResolvedValue(false)

    const wrapper = mountMapDrawTab()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="tools-panel"]')).toBeTruthy()

    wrapper.host.querySelector('[data-testid="draw-polygon-mode"]').click()
    await flushTicks()

    expect(mocks.showConfirm).toHaveBeenCalledWith('map.drawTab.auth.loginRequired')
    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe('')
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('simple_select')
    expect(mocks.mapSetDrawMode).not.toHaveBeenCalledWith('draw_polygon')

    wrapper.unmount()
  })

  it('blocks unauthenticated draw-mode writes when an editable layer already exists', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})

    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).not.toBe('')

    mocks.mapSetDrawMode.mockClear()
    mocks.isAuthenticated.value = false
    mocks.showConfirm.mockResolvedValue(false)
    wrapper.host.querySelector('[data-testid="draw-polygon-mode"]').click()
    await flushTicks()

    expect(mocks.showConfirm).toHaveBeenCalledWith('map.drawTab.auth.loginRequired')
    expect(mocks.mapSetDrawMode).not.toHaveBeenCalledWith('draw_polygon')

    wrapper.unmount()
  })

  it('rejects unauthenticated feature changes emitted by the map canvas', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})

    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinate"]').textContent).toBe('1')

    mocks.isAuthenticated.value = false
    mocks.showConfirm.mockResolvedValue(false)
    wrapper.host.querySelector('[data-testid="emit-geometry-update"]').click()
    await flushTicks()

    expect(mocks.showConfirm).toHaveBeenCalledWith('map.drawTab.auth.loginRequired')
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinate"]').textContent).toBe('1')
    expect(mocks.mapImportGeoJson).toHaveBeenCalled()
    const [syncedFeatureCollection, syncOptions] = mocks.mapImportGeoJson.mock.calls.at(-1)
    expect(syncOptions).toEqual({ emitChanges: false, emitSelection: false })
    expect(syncedFeatureCollection.features[0].geometry.coordinates[0][1][0]).toBe(1)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe('')

    wrapper.unmount()
  })

  it('prompts to restore the hidden auto draft when one is available', async () => {
    const autoDraft = buildAutoDraftRecord({
      layers: [{
        id: 'layer-1',
        name: 'Recovered Layer',
        geometryType: 'Polygon',
        featureCollection: {
          type: 'FeatureCollection',
          features: [{ id: 'feature-1', type: 'Feature', properties: {}, geometry: null }],
        },
      }],
      activeLayerId: 'layer-1',
      currentStyleKey: 'gaode',
      snappingEnabled: false,
      snapTolerance: 28,
      snapGridSize: 0.5,
      snapTargets: { vertex: true, midpoint: true, edge: false, grid: true, reference: true },
      topologyEditingEnabled: false,
      sharedBoundaryProtectionEnabled: false,
    })
    mocks.getDraftRecordById.mockImplementation(async (id) => (id === mocks.AUTO_DRAFT_ID ? autoDraft : null))
    mocks.showConfirm.mockResolvedValue(false)

    const wrapper = mountMapDrawTab()
    await flushTicks()

    expect(mocks.showConfirm).toHaveBeenCalledWith('map.drawTab.messages.autoDraftRestoreConfirm')
    expect(mocks.deleteDraftRecord).toHaveBeenCalledWith(mocks.AUTO_DRAFT_ID)
    expect(wrapper.host.querySelector('[data-testid="snapping-enabled"]').textContent).toBe('on')

    wrapper.unmount()
  })

  it('restores snapping settings from an accepted hidden auto draft', async () => {
    const autoDraft = buildAutoDraftRecord({
      layers: [{
        id: 'layer-1',
        name: 'Recovered Layer',
        geometryType: 'Polygon',
        featureCollection: {
          type: 'FeatureCollection',
          features: [{ id: 'feature-1', type: 'Feature', properties: {}, geometry: null }],
        },
      }],
      activeLayerId: 'layer-1',
      currentStyleKey: 'gaode',
      snappingEnabled: false,
      snapTolerance: 28,
      snapGridSize: 0.5,
      snapTargets: { vertex: true, midpoint: true, edge: false, grid: true, reference: true },
      topologyEditingEnabled: false,
      sharedBoundaryProtectionEnabled: false,
    })
    mocks.getDraftRecordById.mockImplementation(async (id) => (id === mocks.AUTO_DRAFT_ID ? autoDraft : null))
    mocks.showConfirm.mockResolvedValue(true)

    const wrapper = mountMapDrawTab()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="snapping-enabled"]').textContent).toBe('off')
    expect(wrapper.host.querySelector('[data-testid="snap-tolerance"]').textContent).toBe('28')
    expect(wrapper.host.querySelector('[data-testid="snap-grid-size"]').textContent).toBe('0.5')
    expect(wrapper.host.querySelector('[data-testid="snap-target-edge"]').textContent).toBe('off')
    expect(wrapper.host.querySelector('[data-testid="topology-editing-enabled"]').textContent).toBe('off')
    expect(wrapper.host.querySelector('[data-testid="shared-boundary-protection-enabled"]').textContent).toBe('off')

    wrapper.unmount()
  })

  it('deletes a hidden auto draft that already matches the current workbench', async () => {
    const autoDraft = buildAutoDraftRecord({
      layers: [],
      activeLayerId: '',
      currentStyleKey: 'gaode',
      isDrawingPanelOpen: true,
      isLayersPanelOpen: false,
    })
    mocks.getDraftRecordById.mockImplementation(async (id) => (id === mocks.AUTO_DRAFT_ID ? autoDraft : null))

    const wrapper = mountMapDrawTab()
    await flushTicks()

    expect(mocks.showConfirm).not.toHaveBeenCalled()
    expect(mocks.deleteDraftRecord).toHaveBeenCalledWith(mocks.AUTO_DRAFT_ID)

    wrapper.unmount()
  })

  it('warns before unloading after draw workbench state becomes dirty', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(mocks.saveDraftRecord).toHaveBeenCalledWith(expect.objectContaining({
      id: mocks.AUTO_DRAFT_ID,
      auto: true,
    }))

    wrapper.unmount()
  })

  it('clears the hidden auto draft after saving a local draft', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockImplementation(async (record) => record)
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.saveToLocal')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.saveAsNewLocal')
    await flushTicks()
    const input = wrapper.host.querySelector('input[type="text"]')
    expect(input).toBeTruthy()
    input.value = 'Saved draft'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    clickLastButtonContaining(wrapper.host, 'map.drawTab.buttons.saveAsNewLocal')
    await flushTicks()

    expect(mocks.deleteDraftRecord).toHaveBeenCalledWith(mocks.AUTO_DRAFT_ID)

    wrapper.unmount()
  })

  it('waits for in-flight auto draft writes before clearing after a local save', async () => {
    const pendingAutoWrite = createDeferred()
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockImplementation((record) => {
      if (record.id === mocks.AUTO_DRAFT_ID) {
        return pendingAutoWrite.promise.then(() => record)
      }
      return Promise.resolve(record)
    })
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    expect(mocks.saveDraftRecord).toHaveBeenCalledWith(expect.objectContaining({
      id: mocks.AUTO_DRAFT_ID,
    }))

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.saveToLocal')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.saveAsNewLocal')
    await flushTicks()
    const input = wrapper.host.querySelector('input[type="text"]')
    expect(input).toBeTruthy()
    input.value = 'Saved draft'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    clickLastButtonContaining(wrapper.host, 'map.drawTab.buttons.saveAsNewLocal')
    await flushTicks()

    expect(mocks.deleteDraftRecord).not.toHaveBeenCalledWith(mocks.AUTO_DRAFT_ID)

    pendingAutoWrite.resolve()
    await flushTicks()

    expect(mocks.deleteDraftRecord).toHaveBeenCalledWith(mocks.AUTO_DRAFT_ID)

    wrapper.unmount()
  })

  it('waits for every in-flight auto draft write before clearing after a local save', async () => {
    const pendingFirstAutoWrite = createDeferred()
    const pendingSecondAutoWrite = createDeferred()
    const pendingThirdAutoWrite = createDeferred()
    const autoWrites = [pendingFirstAutoWrite, pendingSecondAutoWrite, pendingThirdAutoWrite]
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockImplementation((record) => {
      if (record.id === mocks.AUTO_DRAFT_ID) {
        const pendingWrite = autoWrites.shift()
        return pendingWrite.promise.then(() => record)
      }
      return Promise.resolve(record)
    })
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.layers')
    await flushTicks()
    expect(mocks.saveDraftRecord).toHaveBeenCalledTimes(3)

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.saveToLocal')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.saveAsNewLocal')
    await flushTicks()
    const input = wrapper.host.querySelector('input[type="text"]')
    expect(input).toBeTruthy()
    input.value = 'Saved draft'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    clickLastButtonContaining(wrapper.host, 'map.drawTab.buttons.saveAsNewLocal')
    await flushTicks()

    pendingThirdAutoWrite.resolve()
    await flushTicks()
    expect(mocks.deleteDraftRecord).not.toHaveBeenCalledWith(mocks.AUTO_DRAFT_ID)

    pendingFirstAutoWrite.resolve()
    pendingSecondAutoWrite.resolve()
    await flushTicks()
    expect(mocks.deleteDraftRecord).toHaveBeenCalledWith(mocks.AUTO_DRAFT_ID)

    wrapper.unmount()
  })

  it('deletes checked active-layer features as one batch action', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(2)

    const checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="delete-selected-features"]').click()
    await flushTicks()

    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(0)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()

    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(2)

    wrapper.unmount()
  })

  it('does not delete checked active-layer features when the active layer is hidden or locked', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="delete-selected-features"]').click()
    await flushTicks()
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(2)

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="toggle-layer-lock"]').click()
    await flushTicks()
    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="delete-selected-features"]').click()
    await flushTicks()
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(2)

    wrapper.unmount()
  })

  it('applies active layer opacity to newly drawn features', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()

    const opacityInput = wrapper.host.querySelector('[data-testid="layer-opacity-input"]')
    opacityInput.value = '0.35'
    opacityInput.dispatchEvent(new Event('input', { bubbles: true }))
    await flushTicks()

    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="first-feature-opacity"]').textContent).toBe('0.35')

    wrapper.unmount()
  })

  it('applies active layer label visibility to newly drawn features', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="toggle-layer-labels"]').dataset.active).toBe('false')
    wrapper.host.querySelector('[data-testid="toggle-layer-labels"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="toggle-layer-labels"]').dataset.active).toBe('true')

    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="first-feature-labels-visible"]').textContent).toBe('true')

    wrapper.unmount()
  })

  it('passes snapping controls from the drawing tools panel into the map editor', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="snapping-enabled"]').textContent).toBe('on')
    expect(wrapper.host.querySelector('[data-testid="snap-tolerance"]').textContent).toBe('12')
    expect(wrapper.host.querySelector('[data-testid="snap-grid-size"]').textContent).toBe('0')

    wrapper.host.querySelector('[data-testid="toggle-snapping"]').click()
    await nextTick()
    expect(wrapper.host.querySelector('[data-testid="snapping-enabled"]').textContent).toBe('off')

    const toleranceInput = wrapper.host.querySelector('[data-testid="snap-tolerance-input"]')
    toleranceInput.value = '24'
    toleranceInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(wrapper.host.querySelector('[data-testid="snap-tolerance"]').textContent).toBe('24')

    const gridInput = wrapper.host.querySelector('[data-testid="snap-grid-input"]')
    gridInput.value = '0.25'
    gridInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(wrapper.host.querySelector('[data-testid="snap-grid-size"]').textContent).toBe('0.25')

    expect(wrapper.host.querySelector('[data-testid="snap-target-edge"]').textContent).toBe('on')
    wrapper.host.querySelector('[data-testid="toggle-snap-edge"]').click()
    await nextTick()
    expect(wrapper.host.querySelector('[data-testid="snap-target-edge"]').textContent).toBe('off')

    wrapper.unmount()
  })

  it('passes topology editing controls from the drawing tools panel into the map editor', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="topology-editing-enabled"]').textContent).toBe('on')
    expect(wrapper.host.querySelector('[data-testid="shared-boundary-protection-enabled"]').textContent).toBe('on')

    wrapper.host.querySelector('[data-testid="toggle-topology-editing"]').click()
    await nextTick()
    expect(wrapper.host.querySelector('[data-testid="topology-editing-enabled"]').textContent).toBe('off')

    wrapper.host.querySelector('[data-testid="toggle-shared-boundary-protection"]').click()
    await nextTick()
    expect(wrapper.host.querySelector('[data-testid="shared-boundary-protection-enabled"]').textContent).toBe('off')

    wrapper.unmount()
  })

  it('moves checked active-layer features to a compatible layer as one batch action', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    const layerButtons = wrapper.host.querySelectorAll('[data-testid="layer-button"]')
    const sourceLayerId = layerButtons[0].textContent
    const targetLayerId = layerButtons[1].textContent
    layerButtons[0].click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(sourceLayerId)
    const checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="move-selected-features"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(targetLayerId)
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(2)
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .every((item) => item.checked)).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(sourceLayerId)
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(2)

    wrapper.unmount()
  })

  it('moves editable checked features even when the last checked feature is locked', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    const layerButtons = wrapper.host.querySelectorAll('[data-testid="layer-button"]')
    const sourceLayerId = layerButtons[0].textContent
    const targetLayerId = layerButtons[1].textContent
    layerButtons[0].click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="lock-selected-features"]').click()
    await flushTicks()

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[1].click()
    await flushTicks()
    checkboxes[0].click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(sourceLayerId)
    expect(wrapper.host.querySelector('[data-testid="move-selected-features"]').disabled).toBe(false)

    wrapper.host.querySelector('[data-testid="move-selected-features"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(targetLayerId)
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(1)
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .map((item) => item.dataset.locked)).toEqual(['false'])

    wrapper.unmount()
  })

  it('moves editable checked features even when the last checked feature is hidden', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    const layerButtons = wrapper.host.querySelectorAll('[data-testid="layer-button"]')
    const sourceLayerId = layerButtons[0].textContent
    const targetLayerId = layerButtons[1].textContent
    layerButtons[0].click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[1].click()
    await flushTicks()
    checkboxes[0].click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(sourceLayerId)
    expect(wrapper.host.querySelector('[data-testid="move-selected-features"]').disabled).toBe(false)

    wrapper.host.querySelector('[data-testid="move-selected-features"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(targetLayerId)
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(1)

    wrapper.unmount()
  })

  it('keeps an editable primary checked feature after unchecking another editable feature', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    const layerButtons = wrapper.host.querySelectorAll('[data-testid="layer-button"]')
    const sourceLayerId = layerButtons[0].textContent
    const targetLayerId = layerButtons[1].textContent
    layerButtons[0].click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    checkboxes[1].click()
    await flushTicks()
    checkboxes[2].click()
    await flushTicks()
    checkboxes[2].click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(sourceLayerId)
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([true, true, false])
    expect(wrapper.host.querySelector('[data-testid="move-selected-features"]').disabled).toBe(false)

    wrapper.host.querySelector('[data-testid="move-selected-features"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(targetLayerId)
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(1)

    wrapper.unmount()
  })

  it('updates checked active-layer feature visibility and locking as batch actions', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .every((item) => item.dataset.visible === 'false')).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .every((item) => item.dataset.visible === 'true')).toBe(true)
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .every((item) => item.checked)).toBe(true)

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    if (!checkboxes[0].checked) checkboxes[0].click()
    if (!checkboxes[1].checked) checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="lock-selected-features"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .every((item) => item.dataset.locked === 'true')).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .every((item) => item.dataset.locked === 'false')).toBe(true)
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .every((item) => item.checked)).toBe(true)

    wrapper.unmount()
  })

  it('only mutates editable checked features while allowing hidden and locked recovery actions', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()

    const layerButtons = wrapper.host.querySelectorAll('[data-testid="layer-button"]')
    const sourceLayerId = layerButtons[0].textContent
    layerButtons[0].click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe(sourceLayerId)

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="lock-selected-features"]').click()
    await flushTicks()

    mocks.mapSelectFeatures.mockClear()
    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes.forEach((checkbox) => {
      if (!checkbox.checked) checkbox.click()
    })
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .map((item) => item.dataset.visible)).toEqual(['false', 'true', 'true'])
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .map((item) => item.dataset.locked)).toEqual(['false', 'true', 'false'])
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith(['feature-3'])

    const batchNameInput = wrapper.host.querySelector('[data-testid="batch-name-input"]')
    batchNameInput.value = 'Editable only'
    batchNameInput.dispatchEvent(new Event('input'))
    await flushTicks()
    wrapper.host.querySelector('[data-testid="apply-batch-name"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-table-name"]')]
      .map((input) => input.value)).toEqual([
        'map.drawTab.labels.feature 1',
        'map.drawTab.labels.feature 2',
        'Editable only',
      ])
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([true, true, true])

    const batchPropertyKey = wrapper.host.querySelector('[data-testid="batch-property-key"]')
    batchPropertyKey.value = 'region'
    batchPropertyKey.dispatchEvent(new Event('change'))
    const batchPropertyValue = wrapper.host.querySelector('[data-testid="batch-property-value"]')
    batchPropertyValue.value = 'Editable region only'
    batchPropertyValue.dispatchEvent(new Event('input'))
    await flushTicks()
    wrapper.host.querySelector('[data-testid="apply-batch-property"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-table-property-input"][data-property-key="region"]')]
      .map((input) => input.value)).toEqual(['Region 1', 'Region 2', 'Editable region only'])
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([true, true, true])

    wrapper.host.querySelector('[data-testid="delete-selected-features"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-table-name"]')]
      .map((input) => input.value)).toEqual([
        'map.drawTab.labels.feature 1',
        'map.drawTab.labels.feature 2',
      ])
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([true, true])

    mocks.mapSelectFeatures.mockClear()
    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes.forEach((checkbox) => {
      if (!checkbox.checked) checkbox.click()
    })
    await flushTicks()
    wrapper.host.querySelector('[data-testid="show-selected-features"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .map((item) => item.dataset.visible)).toEqual(['true', 'true'])
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith(['feature-1'])

    mocks.mapSelectFeatures.mockClear()
    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes.forEach((checkbox) => {
      if (!checkbox.checked) checkbox.click()
    })
    await flushTicks()
    wrapper.host.querySelector('[data-testid="unlock-selected-features"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .map((item) => item.dataset.locked)).toEqual(['false', 'false'])
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith(['feature-1', 'feature-2'])

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes.forEach((checkbox) => {
      if (!checkbox.checked) checkbox.click()
    })
    await flushTicks()
    wrapper.host.querySelector('[data-testid="move-selected-features"]').click()
    await flushTicks()
    expect(wrapper.host.querySelectorAll('[data-testid="feature-table-row"]')).toHaveLength(2)

    wrapper.unmount()
  })

  it('selects, inverts, and clears only visible unlocked active-layer features', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="lock-selected-features"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="select-all-features"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([false, false, true])
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-3', { directEdit: false })

    wrapper.host.querySelector('[data-testid="invert-feature-selection"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([false, false, false])
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    wrapper.host.querySelector('[data-testid="invert-feature-selection"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([false, false, true])
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-3', { directEdit: false })

    wrapper.host.querySelector('[data-testid="clear-feature-selection"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([false, false, false])
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .map((item) => item.dataset.locked)).toEqual(['false', 'false', 'false'])
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .map((item) => item.dataset.visible)).toEqual(['false', 'true', 'true'])

    wrapper.unmount()
  })

  it('keeps natural map multi-selection from draw selection changes', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    const mapSelectFeaturesCallCountBeforeNaturalSelection = mocks.mapSelectFeatures.mock.calls.length
    wrapper.host.querySelector('[data-testid="emit-feature-multi-selection"]').click()
    await flushTicks()

    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((item) => item.checked)).toEqual([true, true])
    expect(mocks.mapSelectFeatures).toHaveBeenCalledTimes(mapSelectFeaturesCallCountBeforeNaturalSelection)

    wrapper.unmount()
  })

  it('drops hidden and locked features from natural map selection changes', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="lock-selected-features"]').click()
    await flushTicks()

    const mapSelectFeatureCallCountBeforeNaturalSelection = mocks.mapSelectFeature.mock.calls.length
    wrapper.host.querySelector('[data-testid="emit-feature-mixed-selection"]').click()
    await flushTicks()

    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((item) => item.checked)).toEqual([false, false, true])
    expect(mocks.mapSelectFeature).toHaveBeenCalledTimes(mapSelectFeatureCallCountBeforeNaturalSelection + 1)
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-3', { directEdit: false })

    wrapper.unmount()
  })

  it('normalizes natural map selection to active-layer order and resyncs stale hits', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    const checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()

    mocks.mapSelectFeatures.mockClear()
    wrapper.host.querySelector('[data-testid="emit-feature-priority-selection"]').click()
    await flushTicks()

    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((item) => item.checked)).toEqual([false, true, true])
    expect(mocks.latestToolsPanelProps.selectedFeatureIds).toEqual(['feature-2', 'feature-3'])
    expect(mocks.latestToolsPanelProps.selectedFeatureId).toBe('feature-2')
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith(['feature-2', 'feature-3'])

    wrapper.unmount()
  })

  it('clears map and panel selection when switching active layers', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()

    const layerButtons = wrapper.host.querySelectorAll('[data-testid="layer-button"]')
    layerButtons[0].click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="feature-checkbox"]').click()
    await flushTicks()
    expect(mocks.latestToolsPanelProps.selectedFeatureIds).toEqual(['feature-1'])

    mocks.mapSelectFeatures.mockClear()
    layerButtons[1].click()
    await flushTicks()

    expect(mocks.latestToolsPanelProps.selectedFeatureIds).toEqual([])
    expect(mocks.latestToolsPanelProps.selectedFeatureId).toBe('')
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    wrapper.unmount()
  })

  it('keeps hidden and locked panel row selection out of map selection state', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="lock-selected-features"]').click()
    await flushTicks()

    mocks.mapSelectFeature.mockClear()
    mocks.mapSelectFeatures.mockClear()

    let rowButtons = wrapper.host.querySelectorAll('[data-testid="feature-select-row"]')
    rowButtons[0].click()
    await flushTicks()

    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((item) => item.checked)).toEqual([true, false, false])
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])
    expect(mocks.mapSelectFeature).not.toHaveBeenCalled()

    rowButtons = wrapper.host.querySelectorAll('[data-testid="feature-select-row"]')
    rowButtons[1].click()
    await flushTicks()

    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((item) => item.checked)).toEqual([false, true, false])
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])
    expect(mocks.mapSelectFeature).not.toHaveBeenCalled()

    rowButtons = wrapper.host.querySelectorAll('[data-testid="feature-select-row"]')
    rowButtons[2].click()
    await flushTicks()

    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((item) => item.checked)).toEqual([false, false, true])
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-3', { directEdit: false })

    wrapper.unmount()
  })

  it('box selects only visible unlocked active-layer features and exits box mode after selection', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="lock-selected-features"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('on')

    wrapper.host.querySelector('[data-testid="emit-box-selection"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([false, false, true])
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-3', { directEdit: false })
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('off')

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').disabled).toBe(true)

    wrapper.unmount()
  })

  it('adds and subtracts box-selected active-layer features without replacing the whole selection', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([true, false, false])

    const saveCountBeforeAddSelection = mocks.saveDraftRecord.mock.calls.length
    wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-box-add-selection"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([true, true, false])
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith(['feature-1', 'feature-2'])
    expect(mocks.saveDraftRecord).toHaveBeenCalledTimes(saveCountBeforeAddSelection)
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('off')

    const saveCountBeforeSubtractSelection = mocks.saveDraftRecord.mock.calls.length
    wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-box-subtract-selection"]').click()
    await flushTicks()
    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    expect([...checkboxes].map((checkbox) => checkbox.checked)).toEqual([false, true, false])
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-2', { directEdit: false })
    expect(mocks.saveDraftRecord).toHaveBeenCalledTimes(saveCountBeforeSubtractSelection)
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('off')

    wrapper.unmount()
  })

  it('treats a malformed box selection payload as an empty replacement', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    const checkbox = wrapper.host.querySelector('[data-testid="feature-checkbox"]')
    checkbox.click()
    await flushTicks()
    expect(checkbox.checked).toBe(true)

    wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-box-null-selection"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked).toBe(false)
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('off')

    wrapper.unmount()
  })

  it('ignores hidden feature selection when adding box-selected features', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-state"]')]
      .map((item) => item.dataset.visible)).toEqual(['false', 'true'])

    wrapper.host.querySelector('[data-testid="emit-feature-one-selection"]').click()
    await flushTicks()
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([false, false])

    wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-box-add-selection"]').click()
    await flushTicks()
    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    expect([...checkboxes].map((checkbox) => checkbox.checked)).toEqual([false, true])
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-2', { directEdit: false })

    wrapper.unmount()
  })

  it('selects editable active-layer features with the select-all keyboard shortcut', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()

    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="lock-selected-features"]').click()
    await flushTicks()

    const saveCountBeforeShortcut = mocks.saveDraftRecord.mock.calls.length
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'a',
      metaKey: true,
    })
    document.dispatchEvent(event)
    await flushTicks()

    expect(event.defaultPrevented).toBe(true)
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([false, false, true])
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-3', { directEdit: false })
    expect(mocks.saveDraftRecord).toHaveBeenCalledTimes(saveCountBeforeShortcut)

    wrapper.unmount()
  })

  it('keeps select-all harmless when no editable features remain', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    const checkbox = wrapper.host.querySelector('[data-testid="feature-checkbox"]')
    checkbox.click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="hide-selected-features"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-feature-one-selection"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked).toBe(false)

    const saveCountBeforeShortcut = mocks.saveDraftRecord.mock.calls.length
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'a',
      ctrlKey: true,
    })
    document.dispatchEvent(event)
    await flushTicks()

    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked).toBe(false)
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])
    expect(mocks.saveDraftRecord).toHaveBeenCalledTimes(saveCountBeforeShortcut)

    wrapper.unmount()
  })

  it('clears feature selection and exits box selection with Escape', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    const checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('on')

    const saveCountBeforeShortcut = mocks.saveDraftRecord.mock.calls.length
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    })
    document.dispatchEvent(event)
    await flushTicks()

    expect(event.defaultPrevented).toBe(true)
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .map((checkbox) => checkbox.checked)).toEqual([false, false])
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('off')
    expect(mocks.saveDraftRecord).toHaveBeenCalledTimes(saveCountBeforeShortcut)

    wrapper.unmount()
  })

  it('does not handle selection shortcuts while focus is in editable fields', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    const nameInput = wrapper.host.querySelector('[data-testid="feature-table-name"]')
    expect(nameInput).toBeTruthy()
    const selectAllEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'a',
      metaKey: true,
    })
    nameInput.dispatchEvent(selectAllEvent)
    await flushTicks()
    expect(selectAllEvent.defaultPrevented).toBe(false)
    expect(wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked).toBe(false)

    const checkbox = wrapper.host.querySelector('[data-testid="feature-checkbox"]')
    checkbox.click()
    await flushTicks()
    expect(checkbox.checked).toBe(true)

    const escapeEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    })
    nameInput.dispatchEvent(escapeEvent)
    await flushTicks()
    expect(escapeEvent.defaultPrevented).toBe(false)
    expect(wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked).toBe(true)

    wrapper.unmount()
  })

  it('deletes the selected geometry with Delete and Backspace shortcuts', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    const checkbox = wrapper.host.querySelector('[data-testid="feature-checkbox"]')
    checkbox.click()
    await flushTicks()

    const deleteEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Delete',
    })
    document.dispatchEvent(deleteEvent)
    await flushTicks()
    expect(deleteEvent.defaultPrevented).toBe(true)
    expect(mocks.mapDeleteSelected).toHaveBeenCalledTimes(1)

    const backspaceEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Backspace',
    })
    document.dispatchEvent(backspaceEvent)
    await flushTicks()
    expect(backspaceEvent.defaultPrevented).toBe(true)
    expect(mocks.mapDeleteSelected).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('undoes geometry changes emitted by Draw update events', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinate"]').textContent).toBe('1')

    wrapper.host.querySelector('[data-testid="emit-geometry-update"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinate"]').textContent).toBe('2')

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinate"]').textContent).toBe('1')

    wrapper.unmount()
  })

  it('applies selected geometry tools and keeps them undoable', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createLineLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="feature-checkbox"]').click()
    await flushTicks()
    expect(mocks.latestToolsPanelProps.canUseSelectedGeometryTools).toBe(true)
    expect(mocks.latestToolsPanelProps.canConvertSelectedLineToPolygon).toBe(true)
    expect(wrapper.host.querySelector('[data-testid="first-feature-geometry-type"]').textContent).toBe('LineString')
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinates"]').textContent)
      .toBe('[[0,0],[0.5,0],[1,0],[1,1],[0,0]]')

    wrapper.host.querySelector('[data-testid="reverse-selected-geometry"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinates"]').textContent)
      .toBe('[[0,0],[1,1],[1,0],[0.5,0],[0,0]]')

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinates"]').textContent)
      .toBe('[[0,0],[0.5,0],[1,0],[1,1],[0,0]]')

    wrapper.host.querySelector('[data-testid="simplify-selected-geometry"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinates"]').textContent)
      .toBe('[[0,0],[1,0],[1,1],[0,0]]')

    wrapper.host.querySelector('[data-testid="convert-selected-line-to-polygon"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="first-feature-geometry-type"]').textContent).toBe('Polygon')
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinates"]').textContent)
      .toBe('[[[0,0],[1,0],[1,1],[0,0]]]')
    expect(mocks.latestToolsPanelProps.selectedFeatureGeometryType).toBe('Polygon')
    expect(mocks.latestToolsPanelProps.selectedFeatureIds).toEqual(['feature-1'])
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-1', { directEdit: false })

    wrapper.unmount()
  })

  it('closes an open selected line and keeps the change undoable', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createLineLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="feature-checkbox"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="emit-open-line-update"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinates"]').textContent)
      .toBe('[[0,0],[2,0],[2,2]]')

    expect(mocks.latestToolsPanelProps.canCloseSelectedLine).toBe(true)
    expect(mocks.latestToolsPanelProps.canConvertSelectedLineToPolygon).toBe(false)

    wrapper.host.querySelector('[data-testid="close-selected-line"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinates"]').textContent)
      .toBe('[[0,0],[2,0],[2,2],[0,0]]')
    expect(mocks.latestToolsPanelProps.canCloseSelectedLine).toBe(false)
    expect(mocks.latestToolsPanelProps.canConvertSelectedLineToPolygon).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinates"]').textContent)
      .toBe('[[0,0],[2,0],[2,2]]')

    wrapper.unmount()
  })

  it('keeps selected geometry tools out of multi-selection and avoids mixed line polygon layers', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createLineLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    const checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    await flushTicks()

    expect(mocks.latestToolsPanelProps.canUseSelectedGeometryTools).toBe(true)
    expect(mocks.latestToolsPanelProps.canConvertSelectedLineToPolygon).toBe(false)

    wrapper.host.querySelector('[data-testid="convert-selected-line-to-polygon"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="first-feature-geometry-type"]').textContent).toBe('LineString')
    expect(mocks.latestToolsPanelProps.selectedFeatureGeometryType).toBe('LineString')

    checkboxes[1].click()
    await flushTicks()

    expect(mocks.latestToolsPanelProps.selectedFeatureIds).toEqual(['feature-1', 'feature-2'])
    expect(mocks.latestToolsPanelProps.canUseSelectedGeometryTools).toBe(false)
    expect(mocks.latestToolsPanelProps.canConvertSelectedLineToPolygon).toBe(false)

    wrapper.host.querySelector('[data-testid="reverse-selected-geometry"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="first-feature-coordinates"]').textContent)
      .toBe('[[0,0],[0.5,0],[1,0],[1,1],[0,0]]')
    expect(mocks.latestToolsPanelProps.selectedFeatureIds).toEqual(['feature-1', 'feature-2'])

    wrapper.unmount()
  })

  it('surfaces active layer geometry quality diagnostics in the tools panel', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createLineLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    expect(mocks.latestToolsPanelProps.geometryQualitySummary).toMatchObject({
      hasIssues: false,
      issueCount: 0,
      items: [],
    })

    wrapper.host.querySelector('[data-testid="emit-duplicate-line-update"]').click()
    await flushTicks()

    expect(mocks.latestToolsPanelProps.geometryQualitySummary.hasIssues).toBe(true)
    expect(mocks.latestToolsPanelProps.geometryQualitySummary.items.map((item) => item.id))
      .toContain('duplicate-coordinate')

    wrapper.unmount()
  })

  it('keeps direct select active while deleting selected vertices', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-direct-select"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="emit-direct-select-no-vertex"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('direct_select')
    expect(wrapper.host.querySelector('[data-testid="selected-vertex-count"]').textContent).toBe('0')
    expect(wrapper.host.querySelector('[data-testid="can-delete-selected-vertices"]').textContent).toBe('false')

    const emptyDeleteEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Delete',
    })
    document.dispatchEvent(emptyDeleteEvent)
    await flushTicks()

    expect(emptyDeleteEvent.defaultPrevented).toBe(false)
    expect(mocks.mapDeleteSelected).not.toHaveBeenCalled()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('direct_select')

    wrapper.host.querySelector('[data-testid="emit-direct-select-vertex"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="selected-vertex-count"]').textContent).toBe('1')
    expect(wrapper.host.querySelector('[data-testid="can-delete-selected-vertices"]').textContent).toBe('true')

    const deleteEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Delete',
    })
    document.dispatchEvent(deleteEvent)
    await flushTicks()

    expect(deleteEvent.defaultPrevented).toBe(true)
    expect(mocks.mapDeleteSelected).toHaveBeenCalledTimes(1)
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(1)
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('direct_select')
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(1)

    wrapper.unmount()
  })

  it('does not advertise or run vertex deletion when selected vertices would invalidate geometry', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-direct-select"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-direct-select-invalid-vertex"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('direct_select')
    expect(wrapper.host.querySelector('[data-testid="selected-vertex-count"]').textContent).toBe('1')
    expect(wrapper.host.querySelector('[data-testid="can-delete-selected-vertices"]').textContent).toBe('false')

    const deleteEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Delete',
    })
    document.dispatchEvent(deleteEvent)
    await flushTicks()

    expect(deleteEvent.defaultPrevented).toBe(false)
    expect(mocks.mapCanDeleteSelected).not.toHaveBeenCalled()
    expect(mocks.mapDeleteSelected).not.toHaveBeenCalled()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('direct_select')

    wrapper.unmount()
  })

  it('reports shared boundary protection when Delete is pressed on a protected vertex', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-direct-select"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-direct-select-shared-boundary-vertex"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('direct_select')
    expect(wrapper.host.querySelector('[data-testid="selected-vertex-count"]').textContent).toBe('1')
    expect(wrapper.host.querySelector('[data-testid="can-delete-selected-vertices"]').textContent).toBe('false')

    const deleteEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Delete',
    })
    document.dispatchEvent(deleteEvent)
    await flushTicks()

    expect(deleteEvent.defaultPrevented).toBe(true)
    expect(mocks.mapCanDeleteSelected).not.toHaveBeenCalled()
    expect(mocks.mapDeleteSelected).not.toHaveBeenCalled()
    expect(wrapper.host.querySelector('[data-testid="geometry-edit-status-code"]').textContent)
      .toBe('sharedBoundaryDeleteBlocked')
    expect(wrapper.host.querySelector('[data-testid="geometry-edit-status-message"]').textContent)
      .toBe('map.drawTab.labels.sharedBoundaryDeleteBlocked')

    wrapper.unmount()
  })

  it('does not call Draw delete when selected vertices would make geometry invalid', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    mocks.mapCanDeleteSelected.mockReturnValue(false)
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-direct-select"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-direct-select-vertex"]').click()
    await flushTicks()

    const deleteEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Delete',
    })
    document.dispatchEvent(deleteEvent)
    await flushTicks()

    expect(deleteEvent.defaultPrevented).toBe(true)
    expect(mocks.mapCanDeleteSelected).toHaveBeenCalledTimes(1)
    expect(mocks.mapDeleteSelected).not.toHaveBeenCalled()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('direct_select')

    wrapper.unmount()
  })

  it('does not delete selected geometry with shortcuts when the active layer is hidden or locked', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="feature-checkbox"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()

    const hiddenDeleteEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Delete',
    })
    document.dispatchEvent(hiddenDeleteEvent)
    await flushTicks()
    expect(hiddenDeleteEvent.defaultPrevented).toBe(false)
    expect(mocks.mapDeleteSelected).not.toHaveBeenCalled()

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    if (!wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked) {
      wrapper.host.querySelector('[data-testid="feature-checkbox"]').click()
      await flushTicks()
    }
    wrapper.host.querySelector('[data-testid="toggle-layer-lock"]').click()
    await flushTicks()

    const lockedBackspaceEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Backspace',
    })
    document.dispatchEvent(lockedBackspaceEvent)
    await flushTicks()
    expect(lockedBackspaceEvent.defaultPrevented).toBe(false)
    expect(mocks.mapDeleteSelected).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('ignores stale direct-select map events after the active layer is hidden or locked', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-direct-select"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('direct_select')

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('simple_select')
    expect(wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked).toBe(false)
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    wrapper.host.querySelector('[data-testid="emit-direct-select"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('simple_select')
    expect(wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked).toBe(false)
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-direct-select"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('direct_select')

    wrapper.host.querySelector('[data-testid="toggle-layer-lock"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('simple_select')
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    wrapper.host.querySelector('[data-testid="emit-direct-select"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('simple_select')
    expect(wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked).toBe(false)
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    wrapper.unmount()
  })

  it('exits drawing mode when the layer editor hides the active layer', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="draw-polygon-mode"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('draw_polygon')

    wrapper.host.querySelector('[data-testid="editor-hide-active-layer"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('simple_select')
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('off')
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    const setDrawModeCallCountAfterHide = mocks.mapSetDrawMode.mock.calls.length
    wrapper.host.querySelector('[data-testid="draw-polygon-mode"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('simple_select')
    expect(mocks.mapSetDrawMode).toHaveBeenCalledTimes(setDrawModeCallCountAfterHide)

    wrapper.unmount()
  })

  it('exits box selection when the layer editor hides or locks the active layer', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('on')

    wrapper.host.querySelector('[data-testid="editor-hide-active-layer"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('off')
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('on')

    wrapper.host.querySelector('[data-testid="editor-lock-active-layer"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="current-mode"]').textContent).toBe('simple_select')
    expect(wrapper.host.querySelector('[data-testid="box-select-mode"]').textContent).toBe('off')
    expect(mocks.mapSelectFeatures).toHaveBeenLastCalledWith([])

    wrapper.unmount()
  })

  it('does not handle Delete while focus is in editable fields', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    const checkbox = wrapper.host.querySelector('[data-testid="feature-checkbox"]')
    checkbox.click()
    await flushTicks()
    const nameInput = wrapper.host.querySelector('[data-testid="feature-table-name"]')
    expect(nameInput).toBeTruthy()

    const deleteEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Delete',
    })
    nameInput.dispatchEvent(deleteEvent)
    await flushTicks()

    expect(deleteEvent.defaultPrevented).toBe(false)
    expect(mocks.mapDeleteSelected).not.toHaveBeenCalled()
    expect(wrapper.host.querySelector('[data-testid="feature-checkbox"]').checked).toBe(true)

    wrapper.unmount()
  })

  it('warns about import diagnostics after importing a layer with data quality issues', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    readImportedLayerFile.mockImplementation(async (_file, options = {}) => {
      options.onDiagnostics?.({
        totalFeatureCount: 2,
        duplicateFeatureIdCount: 1,
        duplicateFeatureIds: ['feature-1'],
        emptyGeometryCount: 0,
        unsupportedGeometryCount: 0,
        invalidCoordinateFeatureCount: 0,
        hasIssues: true,
      })
      return {
        type: 'FeatureCollection',
        features: [{
          id: 'feature-1',
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [113, 22] },
        }],
      }
    })
    splitFeatureCollectionByGeometryType.mockReturnValue([{
      geometryType: 'Point',
      featureCollection: {
        type: 'FeatureCollection',
        features: [{
          id: 'feature-1',
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [113, 22] },
        }],
      },
    }])

    const wrapper = mountMapDrawTab()
    await flushTicks()
    const importInput = wrapper.host.querySelector('.draw-import-input')
    Object.defineProperty(importInput, 'files', {
      value: [new File(['{}'], 'quality.geojson', { type: 'application/geo+json' })],
      configurable: true,
    })
    importInput.dispatchEvent(new Event('change'))
    await flushTicks()

    expect(mocks.showSuccess).toHaveBeenCalledWith(
      'map.drawTab.messages.importLayerSuccess{"count":1}'
    )
    expect(mocks.showWarning).toHaveBeenCalledTimes(1)
    expect(mocks.showWarning.mock.calls[0][0]).toContain('map.drawTab.messages.importLayerDiagnostics')
    expect(mocks.showWarning.mock.calls[0][0]).toContain('map.drawTab.messages.importDiagnosticsDuplicateIds')

    wrapper.unmount()
  })

  it('edits feature names from the data table and applies a checked batch name as one action', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    expect(wrapper.host.querySelectorAll('[data-testid="feature-table-row"]')).toHaveLength(2)
    const firstNameInput = wrapper.host.querySelectorAll('[data-testid="feature-table-name"]')[0]
    firstNameInput.value = 'North patch'
    firstNameInput.dispatchEvent(new Event('input'))
    await flushTicks()
    expect(wrapper.host.querySelectorAll('[data-testid="feature-table-name"]')[0].value).toBe('North patch')

    const checkboxes = [...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
    checkboxes.forEach((checkbox) => {
      if (!checkbox.checked) checkbox.click()
    })
    await flushTicks()

    const batchNameInput = wrapper.host.querySelector('[data-testid="batch-name-input"]')
    batchNameInput.value = 'Batch patch'
    batchNameInput.dispatchEvent(new Event('input'))
    await flushTicks()
    wrapper.host.querySelector('[data-testid="apply-batch-name"]').click()
    await flushTicks()

    expect([...wrapper.host.querySelectorAll('[data-testid="feature-table-name"]')]
      .every((input) => input.value === 'Batch patch')).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()

    const restoredNames = [...wrapper.host.querySelectorAll('[data-testid="feature-table-name"]')]
      .map((input) => input.value)
    expect(restoredNames[0]).toBe('North patch')
    expect(restoredNames[1]).not.toBe('Batch patch')

    wrapper.unmount()
  })

  it('edits feature business properties from the data table and batch applies a checked property', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let regionInputs = [...wrapper.host.querySelectorAll('[data-testid="feature-table-property-input"][data-property-key="region"]')]
    expect(regionInputs).toHaveLength(2)
    expect(regionInputs.map((input) => input.value)).toEqual(['Region 1', 'Region 2'])
    const userIdInputs = [...wrapper.host.querySelectorAll('[data-testid="feature-table-property-input"][data-property-key="user_id"]')]
    expect(userIdInputs).toHaveLength(2)
    expect(userIdInputs.map((input) => input.value)).toEqual(['user-1', 'user-2'])

    regionInputs[0].value = 'North region'
    regionInputs[0].dispatchEvent(new Event('input'))
    await flushTicks()
    regionInputs = [...wrapper.host.querySelectorAll('[data-testid="feature-table-property-input"][data-property-key="region"]')]
    expect(regionInputs[0].value).toBe('North region')

    const checkboxes = [...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
    checkboxes.forEach((checkbox) => {
      if (!checkbox.checked) checkbox.click()
    })
    await flushTicks()

    const batchPropertyKey = wrapper.host.querySelector('[data-testid="batch-property-key"]')
    batchPropertyKey.value = 'region'
    batchPropertyKey.dispatchEvent(new Event('change'))
    const batchPropertyValue = wrapper.host.querySelector('[data-testid="batch-property-value"]')
    batchPropertyValue.value = 'Batch region'
    batchPropertyValue.dispatchEvent(new Event('input'))
    await flushTicks()
    wrapper.host.querySelector('[data-testid="apply-batch-property"]').click()
    await flushTicks()

    regionInputs = [...wrapper.host.querySelectorAll('[data-testid="feature-table-property-input"][data-property-key="region"]')]
    expect(regionInputs.every((input) => input.value === 'Batch region')).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()

    regionInputs = [...wrapper.host.querySelectorAll('[data-testid="feature-table-property-input"][data-property-key="region"]')]
    expect(regionInputs[0].value).toBe('North region')
    expect(regionInputs[1].value).toBe('Region 2')

    wrapper.unmount()
  })

  it('disables checked property batch editing when the selected field is stale after switching layers', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    wrapper.host.querySelector('[data-testid="feature-checkbox"]').click()
    await flushTicks()
    const batchPropertyKey = wrapper.host.querySelector('[data-testid="batch-property-key"]')
    batchPropertyKey.value = 'region'
    batchPropertyKey.dispatchEvent(new Event('change'))
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="apply-batch-property"]').disabled).toBe(false)

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="feature-checkbox"]').click()
    await flushTicks()

    expect(wrapper.host.querySelectorAll('[data-testid="feature-table-property-input"][data-property-key="region"]')).toHaveLength(0)
    expect(wrapper.host.querySelectorAll('[data-testid="feature-table-property-input"][data-property-key="zone"]')).toHaveLength(1)
    expect(wrapper.host.querySelector('[data-testid="apply-batch-property"]').disabled).toBe(true)
    expect(wrapper.host.querySelector('[data-testid="batch-property-value"]').disabled).toBe(true)

    wrapper.unmount()
  })

  it('does not edit feature business properties when the active layer is hidden or locked', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let regionInput = wrapper.host.querySelector('[data-testid="feature-table-property-input"][data-property-key="region"]')
    regionInput.value = 'Editable region'
    regionInput.dispatchEvent(new Event('input'))
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="feature-table-property-input"][data-property-key="region"]').value).toBe('Editable region')

    wrapper.host.querySelector('[data-testid="feature-checkbox"]').click()
    await flushTicks()
    const batchPropertyKey = wrapper.host.querySelector('[data-testid="batch-property-key"]')
    batchPropertyKey.value = 'region'
    batchPropertyKey.dispatchEvent(new Event('change'))
    const batchPropertyValue = wrapper.host.querySelector('[data-testid="batch-property-value"]')
    batchPropertyValue.value = 'Hidden batch region'
    batchPropertyValue.dispatchEvent(new Event('input'))
    await flushTicks()

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    regionInput = wrapper.host.querySelector('[data-testid="feature-table-property-input"][data-property-key="region"]')
    regionInput.value = 'Hidden region'
    regionInput.dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[data-testid="apply-batch-property"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="feature-table-property-summary"]').textContent).toContain('Editable region')
    expect(wrapper.host.querySelector('[data-testid="feature-table-property-summary"]').textContent).not.toContain('Hidden region')

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="toggle-layer-lock"]').click()
    await flushTicks()
    regionInput = wrapper.host.querySelector('[data-testid="feature-table-property-input"][data-property-key="region"]')
    regionInput.value = 'Locked region'
    regionInput.dispatchEvent(new Event('input'))
    batchPropertyValue.value = 'Locked batch region'
    batchPropertyValue.dispatchEvent(new Event('input'))
    wrapper.host.querySelector('[data-testid="apply-batch-property"]').click()
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="feature-table-property-summary"]').textContent).toContain('Editable region')
    expect(wrapper.host.querySelector('[data-testid="feature-table-property-summary"]').textContent).not.toContain('Locked region')
    expect(wrapper.host.querySelector('[data-testid="feature-table-property-summary"]').textContent).not.toContain('Locked batch region')

    wrapper.unmount()
  })

  it('does not edit feature names from the data table when the active layer is hidden or locked', async () => {
    mocks.getDraftRecordById.mockResolvedValue(null)
    mocks.saveDraftRecord.mockResolvedValue({})
    const wrapper = mountMapDrawTab()
    await flushTicks()

    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.addLayer')
    await nextTick()
    clickButtonContaining(wrapper.host, 'map.drawTab.buttons.createPolygonLayer')
    await flushTicks()
    wrapper.host.querySelector('[data-testid="editable-map"]').click()
    await flushTicks()

    let nameInput = wrapper.host.querySelector('[data-testid="feature-table-name"]')
    nameInput.value = 'Editable patch'
    nameInput.dispatchEvent(new Event('input'))
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="feature-row"]').textContent).toContain('Editable patch')

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    nameInput = wrapper.host.querySelector('[data-testid="feature-table-name"]')
    nameInput.value = 'Hidden patch'
    nameInput.dispatchEvent(new Event('input'))
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="feature-row"]').textContent).toContain('Editable patch')
    expect(wrapper.host.querySelector('[data-testid="feature-row"]').textContent).not.toContain('Hidden patch')

    wrapper.host.querySelector('[data-testid="toggle-layer-visibility"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="toggle-layer-lock"]').click()
    await flushTicks()
    nameInput = wrapper.host.querySelector('[data-testid="feature-table-name"]')
    nameInput.value = 'Locked patch'
    nameInput.dispatchEvent(new Event('input'))
    await flushTicks()
    expect(wrapper.host.querySelector('[data-testid="feature-row"]').textContent).toContain('Editable patch')
    expect(wrapper.host.querySelector('[data-testid="feature-row"]').textContent).not.toContain('Locked patch')

    wrapper.unmount()
  })
})
