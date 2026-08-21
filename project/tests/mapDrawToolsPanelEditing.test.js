import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, reactive } from 'vue'

/* eslint-disable vue/one-component-per-file */

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, params = {}) => `${key}${Object.keys(params).length ? JSON.stringify(params) : ''}`,
  }),
}))

vi.mock('@/components/selector/CheckBox.vue', () => ({
  default: defineComponent({
    name: 'CheckBoxStub',
    props: {
      modelValue: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    template: '<label><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)"><slot /></label>',
  }),
}))

vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({
  default: defineComponent({
    name: 'SimpleSelectDropdownStub',
    props: {
      modelValue: { type: String, default: '' },
      options: { type: Array, default: () => [] },
    },
    emits: ['update:modelValue'],
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
  }),
}))

import MapDrawToolsPanel from '../src/main/components/map/Draw/panels/MapDrawToolsPanel.vue'

function mountToolsPanel(overrides = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const events = []
  const props = reactive({
    isOpen: true,
    activeLayer: { id: 'layer-1', geometryType: 'Polygon', visible: true, locked: false },
    selectedLayerLabel: '边界 · 1',
    currentMode: 'direct_select',
    featureItems: [{
      id: 'feature-1',
      label: '边界 A',
      geometryType: 'Polygon',
      visible: true,
      locked: false,
    }],
    selectedFeatureId: 'feature-1',
    selectedFeatureIds: ['feature-1'],
    selectedVertexCount: 0,
    selectedVertex: null,
    polygonSplitLineOptions: [],
    selectedPolygonSplitLineId: '',
    canUseSelectedGeometryTools: true,
    canCloseSelectedLine: false,
    canConvertSelectedLineToPolygon: true,
    canSplitSelectedLine: false,
    canSplitSelectedPolygon: false,
    canStartPolygonSplitSketch: false,
    canMergeSelectedPolygons: false,
    polygonSplitSketchActive: false,
    geometryEditStatus: null,
    editSessionStatus: {
      modeLabel: '编辑形状',
      layerLabel: '图层：边界',
      featureLabel: '要素：边界 A',
      vertexLabel: '未选中顶点',
      snapLabel: '吸附：等待目标',
      feedback: null,
    },
    canDeleteSelection: false,
    canDeleteSelectedVertices: false,
    canEditShape: true,
    canModifyActiveLayer: true,
    selectedFeatureProperties: { name: '边界 A', visible: true, locked: false },
    selectedFeatureGeometryType: 'Polygon',
    geometryQualitySummary: {
      hasIssues: false,
      issueCount: 0,
      items: [],
    },
    ...overrides,
  })

  const Root = defineComponent({
    components: { MapDrawToolsPanel },
    setup() {
      return { events, props }
    },
    template: `
      <MapDrawToolsPanel
        v-bind="props"
        @set-mode="events.push(['set-mode', $event])"
        @undo="events.push(['undo'])"
        @redo="events.push(['redo'])"
        @reverse-selected-geometry="events.push(['reverse-selected-geometry'])"
        @simplify-selected-geometry="events.push(['simplify-selected-geometry'])"
        @close-selected-line="events.push(['close-selected-line'])"
        @convert-selected-line-to-polygon="events.push(['convert-selected-line-to-polygon'])"
        @split-selected-line="events.push(['split-selected-line'])"
        @update:selected-polygon-split-line-id="events.push(['update:selected-polygon-split-line-id', $event]); props.selectedPolygonSplitLineId = $event"
        @split-selected-polygon="events.push(['split-selected-polygon'])"
        @start-polygon-split-sketch="events.push(['start-polygon-split-sketch'])"
        @cancel-polygon-split-sketch="events.push(['cancel-polygon-split-sketch'])"
        @merge-selected-polygons="events.push(['merge-selected-polygons'])"
        @move-selected-vertex="events.push(['move-selected-vertex', $event])"
        @update-feature-property="(key, value) => events.push(['update-feature-property', key, value])"
        @update:selected-text-label-field-key="events.push(['update:selected-text-label-field-key', $event]); props.selectedTextLabelFieldKey = $event"
        @apply-text-label-field="events.push(['apply-text-label-field'])"
        @delete-selected="events.push(['delete-selected'])"
      />
    `,
  })

  const app = createApp(Root)
  app.mount(host)

  return {
    events,
    host,
    props,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('MapDrawToolsPanel editing affordances', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('shows the edited feature and keeps vertex deletion disabled until a vertex is selected', async () => {
    const wrapper = mountToolsPanel()
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="shape-edit-target"]').textContent)
      .toContain('map.drawTab.labels.shapeEditTarget{"name":"边界 A"}')
    expect(wrapper.host.querySelector('[data-testid="shape-edit-selected-count"]').textContent)
      .toContain('map.drawTab.labels.selectedVertexCount{"count":0}')
    expect(wrapper.host.querySelector('[data-testid="shape-edit-hint"]').textContent)
      .toContain('map.drawTab.labels.shapeEditNoVertexHint')
    expect(wrapper.host.querySelector('[data-testid="shape-edit-insert-hint"]').textContent)
      .toContain('map.drawTab.labels.shapeEditInsertVertexHint')
    expect(wrapper.host.querySelector('[data-testid="shape-edit-move-hint"]').textContent)
      .toContain('map.drawTab.labels.shapeEditMoveVertexHint')
    expect(wrapper.host.querySelector('[data-testid="shape-edit-history-hint"]').textContent)
      .toContain('map.drawTab.labels.shapeEditHistoryHint')

    const deleteButton = wrapper.host.querySelector('[data-testid="shape-edit-delete-vertices"]')
    expect(deleteButton.disabled).toBe(true)
    deleteButton.click()
    await nextTick()
    expect(wrapper.events).not.toContainEqual(['delete-selected'])

    wrapper.host.querySelector('[data-testid="shape-edit-finish"]').click()
    await nextTick()
    expect(wrapper.events).toContainEqual(['set-mode', 'simple_select'])

    wrapper.unmount()
  })

  it('shows the current edit session, snap target, and latest edit feedback', async () => {
    const wrapper = mountToolsPanel({
      editSessionStatus: {
        modeLabel: '编辑形状',
        layerLabel: '图层：边界',
        featureLabel: '要素：边界 A',
        vertexLabel: '顶点：0.2',
        snapLabel: '吸附：中点 · 参考线 / 边界线',
        feedback: {
          type: 'success',
          message: '已撤回上一步',
        },
      },
    })
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="edit-session-status"]').textContent)
      .toContain('编辑形状')
    expect(wrapper.host.querySelector('[data-testid="edit-session-layer"]').textContent)
      .toContain('图层：边界')
    expect(wrapper.host.querySelector('[data-testid="edit-session-feature"]').textContent)
      .toContain('要素：边界 A')
    expect(wrapper.host.querySelector('[data-testid="edit-session-vertex"]').textContent)
      .toContain('顶点：0.2')
    expect(wrapper.host.querySelector('[data-testid="edit-session-snap"]').textContent)
      .toContain('吸附：中点 · 参考线 / 边界线')
    expect(wrapper.host.querySelector('[data-testid="edit-session-feedback"]').textContent)
      .toContain('已撤回上一步')

    wrapper.unmount()
  })

  it('edits advanced text annotation controls and applies labels from a data field', async () => {
    const wrapper = mountToolsPanel({
      currentMode: 'simple_select',
      selectedFeatureGeometryType: 'Text',
      featureTableColumns: [{ key: 'dialect', label: 'dialect' }],
      selectedTextLabelFieldKey: '',
      canApplyTextLabelField: false,
      selectedFeatureProperties: {
        name: '文本 A',
        annotationText: '第一行',
        textSize: 16,
        textColor: '#111111',
        textHaloColor: '#ffffff',
        textHaloWidth: 1,
        textRotate: 0,
        textAnchor: 'center',
        textAllowOverlap: false,
        textPriority: 0,
        textLineHeight: 1.2,
        textLetterSpacing: 0,
        textAlign: 'center',
        textMaxWidth: 12,
        textMinZoom: 4,
        textMaxZoom: 12,
        textBackgroundEnabled: true,
        textBackgroundColor: '#ffffff',
        textBackgroundOpacity: 0.8,
        textBackgroundPadding: 2,
        textLeaderLine: true,
        textLeaderColor: '#111111',
        textLeaderWidth: 1,
        textOffsetX: 0,
        textOffsetY: 1.1,
        visible: true,
        locked: false,
      },
    })
    await nextTick()

    const textInput = wrapper.host.querySelector('[data-testid="text-annotation-input"]')
    textInput.value = '第一行\n第二行'
    textInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(wrapper.events).toContainEqual(['update-feature-property', 'annotationText', '第一行\n第二行'])

    const allowOverlap = wrapper.host.querySelector('[data-testid="text-allow-overlap-input"]')
    allowOverlap.checked = true
    allowOverlap.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(wrapper.events).toContainEqual(['update-feature-property', 'textAllowOverlap', true])

    const priorityInput = wrapper.host.querySelector('[data-testid="text-priority-input"]')
    priorityInput.value = '10'
    priorityInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(wrapper.events).toContainEqual(['update-feature-property', 'textPriority', 10])

    const fieldSelect = wrapper.host.querySelector('[data-testid="text-label-field-select"]')
    fieldSelect.value = 'dialect'
    fieldSelect.dispatchEvent(new Event('change', { bubbles: true }))
    wrapper.props.canApplyTextLabelField = true
    await nextTick()

    expect(wrapper.events).toContainEqual(['update:selected-text-label-field-key', 'dialect'])
    wrapper.host.querySelector('[data-testid="apply-text-label-field"]').click()
    await nextTick()
    expect(wrapper.events).toContainEqual(['apply-text-label-field'])

    wrapper.unmount()
  })

  it('enables direct vertex deletion when selected vertices can be deleted', async () => {
    const wrapper = mountToolsPanel({
      selectedVertexCount: 2,
      canDeleteSelection: true,
      canDeleteSelectedVertices: true,
    })
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="shape-edit-selected-count"]').textContent)
      .toContain('map.drawTab.labels.selectedVertexCount{"count":2}')
    expect(wrapper.host.querySelector('[data-testid="shape-edit-hint"]').textContent)
      .toContain('map.drawTab.labels.shapeEditSelectedVertexHint{"count":2}')

    const deleteButton = wrapper.host.querySelector('[data-testid="shape-edit-delete-vertices"]')
    expect(deleteButton.disabled).toBe(false)
    deleteButton.click()
    await nextTick()

    expect(wrapper.events).toContainEqual(['delete-selected'])

    wrapper.unmount()
  })

  it('keeps selected vertices disabled when deleting them would invalidate geometry', async () => {
    const wrapper = mountToolsPanel({
      selectedVertexCount: 1,
      canDeleteSelection: false,
      canDeleteSelectedVertices: false,
    })
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="shape-edit-selected-count"]').textContent)
      .toContain('map.drawTab.labels.selectedVertexCount{"count":1}')
    expect(wrapper.host.querySelector('[data-testid="shape-edit-hint"]').textContent)
      .toContain('map.drawTab.labels.shapeEditCannotDeleteHint')

    const deleteButton = wrapper.host.querySelector('[data-testid="shape-edit-delete-vertices"]')
    expect(deleteButton.disabled).toBe(true)
    deleteButton.click()
    await nextTick()

    expect(wrapper.events).not.toContainEqual(['delete-selected'])

    wrapper.unmount()
  })

  it('edits a single selected vertex by exact longitude and latitude', async () => {
    const wrapper = mountToolsPanel({
      selectedVertexCount: 1,
      selectedVertex: {
        featureId: 'feature-1',
        coordPath: '0.2',
        coordinate: [113.25, 23.5],
      },
      canDeleteSelection: true,
      canDeleteSelectedVertices: true,
    })
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="shape-edit-coordinate-editor"]').textContent)
      .toContain('map.drawTab.labels.selectedVertexCoordinate')
    const longitudeInput = wrapper.host.querySelector('[data-testid="shape-edit-longitude-input"]')
    const latitudeInput = wrapper.host.querySelector('[data-testid="shape-edit-latitude-input"]')
    const applyButton = wrapper.host.querySelector('[data-testid="shape-edit-apply-coordinate"]')

    expect(longitudeInput.value).toBe('113.25')
    expect(latitudeInput.value).toBe('23.5')
    expect(applyButton.disabled).toBe(true)

    longitudeInput.value = '113.75'
    longitudeInput.dispatchEvent(new Event('input', { bubbles: true }))
    latitudeInput.value = '24.125'
    latitudeInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    expect(applyButton.disabled).toBe(false)
    applyButton.click()
    await nextTick()

    expect(wrapper.events).toContainEqual([
      'move-selected-vertex',
      {
        featureId: 'feature-1',
        coordPath: '0.2',
        coordinate: [113.75, 24.125],
      },
    ])

    wrapper.unmount()
  })

  it('hides exact coordinate editing for multiple selected vertices', async () => {
    const wrapper = mountToolsPanel({
      selectedVertexCount: 2,
      selectedVertex: {
        featureId: 'feature-1',
        coordPath: '0.2',
        coordinate: [113.25, 23.5],
      },
      canDeleteSelection: true,
      canDeleteSelectedVertices: true,
    })
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="shape-edit-coordinate-editor"]')).toBeNull()

    wrapper.unmount()
  })

  it('exposes undo and redo shortcut feedback from the history buttons', async () => {
    const wrapper = mountToolsPanel({
      canUndo: true,
      canRedo: false,
    })
    await nextTick()

    const undoButton = wrapper.host.querySelector('[data-testid="draw-tool-undo"]')
    const redoButton = wrapper.host.querySelector('[data-testid="draw-tool-redo"]')
    expect(undoButton.title).toContain('map.drawTab.labels.undoAvailableHint')
    expect(undoButton.disabled).toBe(false)
    expect(redoButton.title).toContain('map.drawTab.labels.redoUnavailableHint')
    expect(redoButton.disabled).toBe(true)

    undoButton.click()
    await nextTick()
    expect(wrapper.events).toContainEqual(['undo'])

    wrapper.props.canUndo = false
    wrapper.props.canRedo = true
    await nextTick()

    expect(undoButton.title).toContain('map.drawTab.labels.undoUnavailableHint')
    expect(undoButton.disabled).toBe(true)
    expect(redoButton.title).toContain('map.drawTab.labels.redoAvailableHint')
    expect(redoButton.disabled).toBe(false)

    redoButton.click()
    await nextTick()
    expect(wrapper.events).toContainEqual(['redo'])

    wrapper.unmount()
  })

  it('exposes selected geometry tools for editable line and polygon features', async () => {
    const wrapper = mountToolsPanel({
      currentMode: 'simple_select',
      selectedFeatureGeometryType: 'LineString',
      canEditShape: true,
      canModifyActiveLayer: true,
      canCloseSelectedLine: true,
      canSplitSelectedLine: true,
    })
    await nextTick()

    const reverseButton = wrapper.host.querySelector('[data-testid="draw-tool-reverse-geometry"]')
    const simplifyButton = wrapper.host.querySelector('[data-testid="draw-tool-simplify-geometry"]')
    const closeLineButton = wrapper.host.querySelector('[data-testid="draw-tool-close-line"]')
    const splitLineButton = wrapper.host.querySelector('[data-testid="draw-tool-split-line"]')
    const convertButton = wrapper.host.querySelector('[data-testid="draw-tool-line-to-polygon"]')

    expect(reverseButton.disabled).toBe(false)
    expect(simplifyButton.disabled).toBe(false)
    expect(closeLineButton.disabled).toBe(false)
    expect(splitLineButton.disabled).toBe(false)
    expect(convertButton.disabled).toBe(false)

    reverseButton.click()
    simplifyButton.click()
    closeLineButton.click()
    splitLineButton.click()
    convertButton.click()
    await nextTick()

    expect(wrapper.events).toContainEqual(['reverse-selected-geometry'])
    expect(wrapper.events).toContainEqual(['simplify-selected-geometry'])
    expect(wrapper.events).toContainEqual(['close-selected-line'])
    expect(wrapper.events).toContainEqual(['split-selected-line'])
    expect(wrapper.events).toContainEqual(['convert-selected-line-to-polygon'])

    wrapper.props.selectedFeatureGeometryType = 'Polygon'
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="draw-tool-close-line"]')).toBeNull()
    expect(wrapper.host.querySelector('[data-testid="draw-tool-split-line"]')).toBeNull()
    expect(wrapper.host.querySelector('[data-testid="draw-tool-line-to-polygon"]')).toBeNull()

    wrapper.unmount()
  })

  it('keeps line splitting disabled until a middle line vertex is selected', async () => {
    const wrapper = mountToolsPanel({
      currentMode: 'direct_select',
      selectedFeatureGeometryType: 'LineString',
      selectedVertexCount: 1,
      selectedVertex: {
        featureId: 'feature-1',
        coordPath: '1',
        coordinate: [113.25, 23.5],
      },
      canUseSelectedGeometryTools: true,
      canSplitSelectedLine: false,
    })
    await nextTick()

    const splitLineButton = wrapper.host.querySelector('[data-testid="draw-tool-split-line"]')
    expect(splitLineButton.disabled).toBe(true)

    splitLineButton.click()
    await nextTick()
    expect(wrapper.events).not.toContainEqual(['split-selected-line'])

    wrapper.props.canSplitSelectedLine = true
    await nextTick()
    expect(splitLineButton.disabled).toBe(false)

    splitLineButton.click()
    await nextTick()
    expect(wrapper.events).toContainEqual(['split-selected-line'])

    wrapper.unmount()
  })

  it('selects a cutter line and runs polygon splitting when a polygon is selected', async () => {
    const wrapper = mountToolsPanel({
      currentMode: 'simple_select',
      selectedFeatureGeometryType: 'Polygon',
      polygonSplitLineOptions: [
        { label: '切割线 · 线 A', value: 'line-layer::line-1' },
      ],
      selectedPolygonSplitLineId: '',
      canUseSelectedGeometryTools: true,
      canSplitSelectedPolygon: false,
    })
    await nextTick()

    const splitTool = wrapper.host.querySelector('[data-testid="draw-tool-polygon-split-tool"]')
    const select = wrapper.host.querySelector('[data-testid="draw-tool-polygon-split-line-select"]')
    const splitButton = wrapper.host.querySelector('[data-testid="draw-tool-split-polygon"]')

    expect(splitTool.textContent).toContain('map.drawTab.labels.polygonSplitLine')
    expect(splitButton.disabled).toBe(true)

    select.value = 'line-layer::line-1'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    wrapper.props.canSplitSelectedPolygon = true
    await nextTick()

    expect(wrapper.events).toContainEqual(['update:selected-polygon-split-line-id', 'line-layer::line-1'])
    expect(splitButton.disabled).toBe(false)

    splitButton.click()
    await nextTick()

    expect(wrapper.events).toContainEqual(['split-selected-polygon'])

    wrapper.unmount()
  })

  it('offers a temporary cutter-line sketch mode with status feedback for polygon splitting', async () => {
    const wrapper = mountToolsPanel({
      currentMode: 'simple_select',
      selectedFeatureGeometryType: 'Polygon',
      canUseSelectedGeometryTools: true,
      canStartPolygonSplitSketch: true,
      polygonSplitSketchActive: false,
      geometryEditStatus: {
        type: 'info',
        message: '画一条穿过面的切割线',
      },
    })
    await nextTick()

    const startButton = wrapper.host.querySelector('[data-testid="draw-tool-start-polygon-split-sketch"]')
    expect(startButton.disabled).toBe(false)
    expect(wrapper.host.querySelector('[data-testid="draw-tool-cancel-polygon-split-sketch"]')).toBeNull()
    expect(wrapper.host.querySelector('[data-testid="geometry-edit-status"]').textContent)
      .toContain('画一条穿过面的切割线')

    startButton.click()
    await nextTick()
    expect(wrapper.events).toContainEqual(['start-polygon-split-sketch'])

    wrapper.props.polygonSplitSketchActive = true
    await nextTick()

    const cancelButton = wrapper.host.querySelector('[data-testid="draw-tool-cancel-polygon-split-sketch"]')
    expect(cancelButton.disabled).toBe(false)
    cancelButton.click()
    await nextTick()

    expect(wrapper.events).toContainEqual(['cancel-polygon-split-sketch'])

    wrapper.unmount()
  })

  it('enables polygon merging for multiple selected polygon features', async () => {
    const wrapper = mountToolsPanel({
      currentMode: 'simple_select',
      selectedFeatureGeometryType: 'Polygon',
      selectedFeatureIds: ['feature-1', 'feature-2'],
      canUseSelectedGeometryTools: false,
      canMergeSelectedPolygons: true,
    })
    await nextTick()

    const mergeButton = wrapper.host.querySelector('[data-testid="draw-tool-merge-polygons"]')
    expect(mergeButton.disabled).toBe(false)

    mergeButton.click()
    await nextTick()

    expect(wrapper.events).toContainEqual(['merge-selected-polygons'])

    wrapper.props.canMergeSelectedPolygons = false
    await nextTick()
    expect(mergeButton.disabled).toBe(true)

    wrapper.unmount()
  })

  it('labels merged MultiPolygon features as polygon features', async () => {
    const wrapper = mountToolsPanel({
      featureItems: [{
        id: 'multi-polygon-1',
        label: '合并面',
        geometryType: 'MultiPolygon',
        visible: true,
        locked: false,
      }],
      selectedFeatureGeometryType: 'MultiPolygon',
      selectedFeatureId: 'multi-polygon-1',
      selectedFeatureIds: ['multi-polygon-1'],
    })
    await nextTick()

    expect(wrapper.host.querySelector('.draw-feature-row-meta').textContent)
      .toContain('map.drawTab.geometry.polygon')

    wrapper.unmount()
  })

  it('disables selected geometry tools when the current selection is not editable', async () => {
    const wrapper = mountToolsPanel({
      currentMode: 'simple_select',
      selectedFeatureGeometryType: 'Point',
      canEditShape: false,
      canModifyActiveLayer: false,
      canUseSelectedGeometryTools: false,
      canCloseSelectedLine: false,
      canConvertSelectedLineToPolygon: false,
    })
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="draw-tool-reverse-geometry"]').disabled).toBe(true)
    expect(wrapper.host.querySelector('[data-testid="draw-tool-simplify-geometry"]').disabled).toBe(true)
    expect(wrapper.host.querySelector('[data-testid="draw-tool-close-line"]')).toBeNull()
    expect(wrapper.host.querySelector('[data-testid="draw-tool-line-to-polygon"]')).toBeNull()

    wrapper.unmount()
  })

  it('keeps selected geometry tools single-selection only and gates line conversion separately', async () => {
    const wrapper = mountToolsPanel({
      currentMode: 'simple_select',
      selectedFeatureGeometryType: 'LineString',
      selectedFeatureIds: ['feature-1', 'feature-2'],
      canEditShape: true,
      canModifyActiveLayer: true,
      canUseSelectedGeometryTools: false,
      canCloseSelectedLine: false,
      canConvertSelectedLineToPolygon: false,
    })
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="draw-tool-reverse-geometry"]').disabled).toBe(true)
    expect(wrapper.host.querySelector('[data-testid="draw-tool-simplify-geometry"]').disabled).toBe(true)
    expect(wrapper.host.querySelector('[data-testid="draw-tool-close-line"]').disabled).toBe(true)
    expect(wrapper.host.querySelector('[data-testid="draw-tool-line-to-polygon"]').disabled).toBe(true)

    wrapper.props.selectedFeatureIds = ['feature-1']
    wrapper.props.canUseSelectedGeometryTools = true
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="draw-tool-reverse-geometry"]').disabled).toBe(false)
    expect(wrapper.host.querySelector('[data-testid="draw-tool-simplify-geometry"]').disabled).toBe(false)
    expect(wrapper.host.querySelector('[data-testid="draw-tool-close-line"]').disabled).toBe(true)
    expect(wrapper.host.querySelector('[data-testid="draw-tool-line-to-polygon"]').disabled).toBe(true)

    wrapper.props.canCloseSelectedLine = true
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="draw-tool-close-line"]').disabled).toBe(false)

    wrapper.props.canConvertSelectedLineToPolygon = true
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="draw-tool-line-to-polygon"]').disabled).toBe(false)

    wrapper.unmount()
  })

  it('shows geometry quality status and diagnostics in the drawing tools panel', async () => {
    const wrapper = mountToolsPanel({
      geometryQualitySummary: {
        hasIssues: true,
        issueCount: 2,
        items: [
          { id: 'duplicate', label: '重复顶点', level: 'warning' },
          { id: 'self-intersection', label: '面自相交', level: 'error' },
        ],
      },
    })
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="geometry-quality-title"]').textContent)
      .toContain('map.drawTab.labels.geometryQuality')
    expect(wrapper.host.querySelector('[data-testid="geometry-quality-count"]').textContent)
      .toContain('map.drawTab.labels.geometryQualityIssueCount{"count":2}')
    expect([...wrapper.host.querySelectorAll('[data-testid="geometry-quality-item"]')]
      .map((item) => item.textContent)).toEqual(['重复顶点', '面自相交'])

    wrapper.props.geometryQualitySummary = {
      hasIssues: false,
      issueCount: 0,
      items: [],
    }
    await nextTick()

    expect(wrapper.host.querySelector('[data-testid="geometry-quality-count"]').textContent)
      .toContain('map.drawTab.labels.geometryQualityOk')
    expect(wrapper.host.querySelectorAll('[data-testid="geometry-quality-item"]')).toHaveLength(0)

    wrapper.unmount()
  })
})
