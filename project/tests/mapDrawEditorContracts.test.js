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
    expect(tabSource).toContain("editableMapRef.value?.selectFeature?.(selectedFeatureId.value, { directEdit: true })")
    expect(editableSource).toContain(`emit('mode-change'`)
    expect(tabSource).toContain('@mode-change="handleDrawModeChange"')
  })

  it('shows active layer features in the tools panel and lets users select one explicitly', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)

    expect(panelSource).toContain('featureItems')
    expect(panelSource).toContain('selectedFeatureId')
    expect(panelSource).toContain(`$emit('select-feature', feature.id)`)
    expect(panelSource).toContain(`t('map.drawTab.labels.featureList')`)
    expect(panelSource).toContain(`t('map.drawTab.labels.emptyFeatureList')`)
    expect(tabSource).toContain(':feature-items="activeLayerFeatureItems"')
    expect(tabSource).toContain(':selected-feature-id="selectedEditorFeatureId"')
    expect(tabSource).toContain('@select-feature="handleSelectFeatureFromPanel"')
    expect(tabSource).toContain("editableMapRef.value?.selectFeature?.(featureId, { directEdit: false });")
    expect(tabSource).toMatch(/const handleSelectFeatureFromPanel = \(featureId\) => \{[\s\S]*currentMode\.value = 'simple_select'/)
  })

  it('edits selected feature properties separately from active layer properties', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain('const selectedFeature = computed')
    expect(source).toContain('const selectedEditorProperties = computed')
    expect(source).toContain('const updateSelectedFeatureProperty = (key, value) =>')
    expect(source).toContain('updateLayerProperty(key, value)')
    expect(source).toContain('updateFeatureProperty(selectedFeatureId.value, key, value)')
  })

  it('keeps feature selection stable and exits direct mode when selected feature is hidden or locked', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain('selectedFeatureId.value = featureId;')
    expect(source).toContain('editableMapRef.value?.updateFeatureProperties?.(featureId, { [key]: value }, { commitHistory: false });')
    expect(source).toMatch(/if \(key === 'visible' && value === false\) \{[\s\S]*resetDrawSelectionMode\(\)/)
    expect(source).toMatch(/if \(key === 'locked' && value === true\) \{[\s\S]*resetDrawSelectionMode\(\)/)
  })

  it('suppresses duplicate history commits when feature properties are synced into Draw', () => {
    const source = readSource(editableMapLibrePath)

    expect(source).toContain('const updateFeatureProperties = (featureId, nextProperties, options = {}) =>')
    expect(source).toContain('syncFeaturesFromDraw({ commitHistory: options.commitHistory !== false })')
  })

  it('does not enter direct edit mode for hidden or locked selected features', () => {
    const tabSource = readSource(mapDrawTabPath)
    const editableSource = readSource(editableMapLibrePath)

    expect(tabSource).toMatch(/const canEditSelectedShape = computed\(\(\) => \{[\s\S]*selectedFeature\.value/)
    expect(tabSource).toContain('selectedFeature.value.properties?.visible !== false')
    expect(tabSource).toContain('selectedFeature.value.properties?.locked !== true')
    expect(tabSource).toContain("['LineString', 'Polygon'].includes(selectedEditorGeometryType.value)")
    expect(editableSource).toContain('const selectFeature = (featureId, options = {}) =>')
    expect(editableSource).toContain('const shouldDirectEdit = options.directEdit !== false')
    expect(editableSource).toMatch(/if \(!shouldDirectEdit\) \{[\s\S]*draw\.value\?\.changeMode\?\.\('simple_select', \{ featureIds: \[featureId\] \}\)/)
    expect(editableSource).toContain('feature?.properties?.locked || feature?.properties?.visible === false')
    expect(editableSource).toMatch(/feature\?\.properties\?\.locked \|\| feature\?\.properties\?\.visible === false[\s\S]*draw\.value\?\.changeMode\?\.\('simple_select'\)/)
    expect(editableSource).toMatch(/feature\?\.properties\?\.locked \|\| feature\?\.properties\?\.visible === false[\s\S]*emit\('mode-change', 'simple_select'\)/)
  })

  it('falls back to layer editing when selected feature id is stale', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain("const selectedEditorFeatureId = computed(() => selectedFeature.value ? selectedFeatureId.value : '');")
    expect(source).toContain(':selected-feature-id="selectedEditorFeatureId"')
  })
})
