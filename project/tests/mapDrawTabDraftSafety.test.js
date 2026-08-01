import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, ref } from 'vue'

const mocks = vi.hoisted(() => ({
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
  AUTO_DRAFT_ID: '__map_draw_auto_draft__',
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, params = {}) => `${key}${Object.keys(params).length ? JSON.stringify(params) : ''}`,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}))

vi.mock('@/composables/router/useAuthGuard.js', () => ({
  useAuthGuard: () => ({
    isAuthenticated: ref(true),
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
    props: ['modelValue', 'activeLayer', 'featureBoxSelectEnabled'],
    emits: ['update:modelValue', 'features-change', 'feature-select', 'feature-box-select'],
    setup(props, { emit, expose }) {
      expose({
        setDrawMode: mocks.mapSetDrawMode,
        selectFeature: mocks.mapSelectFeature,
        selectFeatures: mocks.mapSelectFeatures,
        importGeoJson: vi.fn((_featureCollection, options = {}) => {
          if (options.emitSelection !== false) {
            emit('feature-select', '')
          }
        }),
        syncReadonlyLayers: vi.fn(),
        removeReadonlyLayerById: vi.fn(),
        resetView: vi.fn(),
        toggleFullscreen: vi.fn(),
        isFullscreen: ref(false),
      })
      const addPolygonFeature = () => {
        const nextIndex = (props.modelValue?.features?.length ?? 0) + 1
        const previousFeatures = props.modelValue?.features ?? []
        const featureProperties = props.activeLayer?.id === 'draw-layer-2'
          ? { zone: `Zone ${nextIndex}` }
          : {
              region: `Region ${nextIndex}`,
              user_id: `user-${nextIndex}`,
            }
        const collection = {
          type: 'FeatureCollection',
          features: [...previousFeatures, {
            id: `feature-${nextIndex}`,
            type: 'Feature',
            properties: featureProperties,
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
        }
        emit('update:modelValue', collection)
        emit('features-change', collection)
      }
      return { addPolygonFeature }
    },
    template: `
      <div>
        <button data-testid="editable-map" type="button" @click="addPolygonFeature">draw polygon</button>
        <span data-testid="box-select-mode">{{ featureBoxSelectEnabled ? 'on' : 'off' }}</span>
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
      selectedFeatureIds: { type: Array, default: () => [] },
      canApplySelectedFeatureBatchProperty: { type: Boolean, default: false },
      isFeatureBoxSelectMode: { type: Boolean, default: false },
      canUseFeatureBoxSelect: { type: Boolean, default: false },
      canModifyActiveLayer: { type: Boolean, default: false },
    },
    emits: [
      'toggle-feature-selection',
      'select-all-features',
      'invert-feature-selection',
      'clear-feature-selection',
      'toggle-feature-box-select',
      'delete-selected-features',
      'move-selected-features-to-layer',
      'set-selected-features-visible',
      'set-selected-features-locked',
      'update-feature-table-cell',
      'update:selected-feature-batch-name',
      'apply-selected-feature-batch-name',
      'update:selected-feature-batch-property-key',
      'update:selected-feature-batch-property-value',
      'apply-selected-feature-batch-property',
    ],
    template: `
      <div data-testid="tools-panel">
        <span data-testid="active-layer-id">{{ activeLayer?.id || '' }}</span>
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
    emits: ['select-layer', 'toggle-layer-visibility', 'toggle-layer-lock'],
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

import { buildAutoDraftRecord } from '../src/main/utils/drawMap/draftStorage.js'
import { readImportedLayerFile, splitFeatureCollectionByGeometryType } from '../src/main/utils/drawMap/export.js'
import MapDrawTab from '../src/main/components/map/Tabs/MapDrawTab.vue'

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
    readImportedLayerFile.mockReset()
    splitFeatureCollectionByGeometryType.mockReset()

    mocks.listDraftRecords.mockResolvedValue([])
    mocks.migrateLegacyDraftsFromLocalStorage.mockResolvedValue(false)
  })

  afterEach(() => {
    document.body.innerHTML = ''
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
    })
    mocks.getDraftRecordById.mockImplementation(async (id) => (id === mocks.AUTO_DRAFT_ID ? autoDraft : null))
    mocks.showConfirm.mockResolvedValue(false)

    const wrapper = mountMapDrawTab()
    await flushTicks()

    expect(mocks.showConfirm).toHaveBeenCalledWith('map.drawTab.messages.autoDraftRestoreConfirm')
    expect(mocks.deleteDraftRecord).toHaveBeenCalledWith(mocks.AUTO_DRAFT_ID)

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
    await nextTick()
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
    await nextTick()
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
    await nextTick()
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
    wrapper.host.querySelectorAll('[data-testid="layer-button"]')[0].click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe('draw-layer-1')
    const checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    checkboxes[0].click()
    checkboxes[1].click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="move-selected-features"]').click()
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe('draw-layer-2')
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(2)
    expect([...wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')]
      .every((item) => item.checked)).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'z',
      metaKey: true,
    }))
    await flushTicks()

    expect(wrapper.host.querySelector('[data-testid="active-layer-id"]').textContent).toBe('draw-layer-1')
    expect(wrapper.host.querySelectorAll('[data-testid="feature-row"]')).toHaveLength(2)

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

  it('drops stale hidden feature selection when adding box-selected features', async () => {
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
      .map((checkbox) => checkbox.checked)).toEqual([true, false])

    wrapper.host.querySelector('[data-testid="toggle-feature-box-select"]').click()
    await flushTicks()
    wrapper.host.querySelector('[data-testid="emit-box-add-selection"]').click()
    await flushTicks()
    checkboxes = wrapper.host.querySelectorAll('[data-testid="feature-checkbox"]')
    expect([...checkboxes].map((checkbox) => checkbox.checked)).toEqual([false, true])
    expect(mocks.mapSelectFeature).toHaveBeenLastCalledWith('feature-2', { directEdit: false })

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
