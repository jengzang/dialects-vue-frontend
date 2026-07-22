import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, ref } from 'vue'

const mocks = vi.hoisted(() => ({
  showConfirm: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  saveDraftRecord: vi.fn(),
  listDraftRecords: vi.fn(),
  getDraftRecordById: vi.fn(),
  migrateLegacyDraftsFromLocalStorage: vi.fn(),
  updateDraftRecord: vi.fn(),
  deleteDraftRecord: vi.fn(),
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
    props: ['modelValue'],
    emits: ['update:modelValue', 'features-change'],
    setup(_props, { emit, expose }) {
      expose({
        setDrawMode: vi.fn(),
        importGeoJson: vi.fn(),
        syncReadonlyLayers: vi.fn(),
        removeReadonlyLayerById: vi.fn(),
        resetView: vi.fn(),
        toggleFullscreen: vi.fn(),
        isFullscreen: ref(false),
      })
      const addPolygonFeature = () => {
        const collection = {
          type: 'FeatureCollection',
          features: [{
            id: 'feature-1',
            type: 'Feature',
            properties: {},
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
    template: '<button data-testid="editable-map" type="button" @click="addPolygonFeature">draw polygon</button>',
  }),
}))

vi.mock('@/main/components/map/Draw/panels/MapDrawToolsPanel.vue', () => ({
  default: defineComponent({
    name: 'MapDrawToolsPanelStub',
    template: '<div data-testid="tools-panel" />',
  }),
}))

vi.mock('@/main/components/map/Draw/panels/MapDrawLayersPanel.vue', () => ({
  default: defineComponent({
    name: 'MapDrawLayersPanelStub',
    template: '<div data-testid="layers-panel" />',
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
    mocks.saveDraftRecord.mockReset()
    mocks.listDraftRecords.mockReset()
    mocks.getDraftRecordById.mockReset()
    mocks.migrateLegacyDraftsFromLocalStorage.mockReset()
    mocks.updateDraftRecord.mockReset()
    mocks.deleteDraftRecord.mockReset()

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
})
