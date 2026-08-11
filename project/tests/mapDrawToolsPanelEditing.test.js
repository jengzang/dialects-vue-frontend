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
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" />',
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
    canDeleteSelection: false,
    canDeleteSelectedVertices: false,
    canEditShape: true,
    canModifyActiveLayer: true,
    selectedFeatureProperties: { name: '边界 A', visible: true, locked: false },
    selectedFeatureGeometryType: 'Polygon',
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
})
