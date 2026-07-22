import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const editableMapLibrePath = resolve(projectRoot, 'src/main/components/map/EditableMapLibre.vue')
const mapDrawTabPath = resolve(projectRoot, 'src/main/components/map/Tabs/MapDrawTab.vue')
const mapDrawToolsPanelPath = resolve(projectRoot, 'src/main/components/map/Draw/panels/MapDrawToolsPanel.vue')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

function drawStylesBlock(source) {
  const start = source.indexOf('const drawStyles = [')
  const end = source.indexOf('const props = defineProps')

  expect(start).toBeGreaterThan(-1)
  expect(end).toBeGreaterThan(start)

  return source.slice(start, end)
}

describe('Map draw editor contracts', () => {
  it('enables Mapbox Draw user properties for active layer styling', () => {
    const source = readSource(editableMapLibrePath)

    expect(source).toContain('userProperties: true')
  })

  it('reads user-prefixed style properties in active Draw layers', () => {
    const source = readSource(editableMapLibrePath)
    const stylesSource = drawStylesBlock(source)

    for (const key of [
      'user_fill',
      'user_stroke',
      'user_fillOpacity',
      'user_strokeWidth',
      'user_visible',
      'user_pointRadius',
      'user_pointColor',
      'user_pointStrokeColor',
    ]) {
      expect(stylesSource).toContain(`['get', '${key}']`)
    }

    for (const key of [
      'fill',
      'stroke',
      'fillOpacity',
      'strokeWidth',
      'visible',
      'pointRadius',
      'pointColor',
      'pointStrokeColor',
    ]) {
      expect(stylesSource).not.toContain(`['get', '${key}']`)
    }
  })

  it('keeps hidden active layer features in Draw state and hides them through style filters', () => {
    const editableSource = readSource(editableMapLibrePath)
    const tabSource = readSource(mapDrawTabPath)
    const stylesSource = drawStylesBlock(editableSource)

    expect(stylesSource).toContain(`['!=', 'user_visible', false]`)
    expect(editableSource).not.toContain('props.activeLayer?.visible === false ? emptyFeatureCollection()')
    expect(tabSource).not.toContain('activeLayer.value.visible === false ? emptyFeatureCollection()')
  })

  it('exposes undo and redo actions in the tools panel', () => {
    const source = readSource(mapDrawToolsPanelPath)

    expect(source).toContain('canUndo')
    expect(source).toContain('canRedo')
    expect(source).toContain(`$emit('undo')`)
    expect(source).toContain(`$emit('redo')`)
    expect(source).toContain(`t('map.drawTab.buttons.undo')`)
    expect(source).toContain(`t('map.drawTab.buttons.redo')`)
  })

  it('wires map draw history to commands and keyboard shortcuts', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain('createMapDrawHistory')
    expect(source).toContain('commitHistory')
    expect(source).toContain('undoHistory')
    expect(source).toContain('redoHistory')
    expect(source).toContain('@undo="undoHistory"')
    expect(source).toContain('@redo="redoHistory"')
    expect(source).toContain('handleDrawHistoryKeydown')
    expect(source).toContain(`document.addEventListener('keydown', handleDrawHistoryKeydown)`)
    expect(source).toContain(`document.removeEventListener('keydown', handleDrawHistoryKeydown)`)
    expect(source).toContain('before-features-change')
  })

  it('commits history before generated Voronoi layers are added', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toMatch(/commitHistory\(\);\s+layers\.value\.unshift\(\.\.\.exportedLayers\)/)
  })

  it('refreshes the layer id seed when history snapshots are restored', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain('const syncLayerIdSeedFromLayers')
    expect(source).toMatch(/const applyHistorySnapshot = \(snapshot\) => \{[\s\S]*syncLayerIdSeedFromLayers\(\)/)
  })

  it('guards history restore state with finally and skips no-op all-layer visibility commits', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toMatch(/try \{[\s\S]*syncAllLayersAfterMutation\(\);[\s\S]*\} finally \{[\s\S]*isApplyingHistory\.value = false/)
    expect(source).toContain('if (layers.value.every((layer) => layer.visible === visible)) return;')
  })

  it('restores Mapbox Draw mode from history snapshots without UI mode drift', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain(`const restoredSelectedFeatureId = snapshot.selectedFeatureId || '';`)
    expect(source).toContain(`const restoredMode = snapshot.currentMode || 'simple_select';`)
    expect(source).toContain('selectedFeatureId.value = restoredSelectedFeatureId;')
    expect(source).toContain('currentMode.value = restoredMode;')
    expect(source).toContain('editableMapRef.value?.selectFeature?.(restoredSelectedFeatureId);')
    expect(source).toContain('editableMapRef.value?.setDrawMode?.(restoredMode);')
  })

  it('exits direct selection when active layer visibility or lock state changes', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain('const resetDrawSelectionMode = () =>')
    expect(source).toMatch(/const toggleLayerVisibility = \(layerId\) => \{[\s\S]*if \(layerId === activeLayerId\.value\) \{[\s\S]*resetDrawSelectionMode\(\)/)
    expect(source).toMatch(/const toggleLayerLock = \(layerId\) => \{[\s\S]*if \(layerId === activeLayerId\.value\) \{[\s\S]*resetDrawSelectionMode\(\)/)
  })

  it('exposes an edit shape action for selected line and polygon features', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)
    const editableSource = readSource(editableMapLibrePath)

    expect(panelSource).toContain('canEditShape')
    expect(panelSource).toContain(`$emit('edit-shape')`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.editShape')`)
    expect(tabSource).toContain(':can-edit-shape="canEditSelectedShape"')
    expect(tabSource).toContain('@edit-shape="handleEditSelectedShape"')
    expect(tabSource).toContain('const canEditSelectedShape = computed')
    expect(tabSource).toContain('const handleEditSelectedShape = () =>')
    expect(tabSource).toContain('editableMapRef.value?.selectFeature?.(selectedFeatureId.value)')
    expect(editableSource).toContain(`emit('mode-change'`)
    expect(tabSource).toContain('@mode-change="handleDrawModeChange"')
  })
})
