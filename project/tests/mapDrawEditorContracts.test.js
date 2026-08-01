import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const editableMapLibrePath = resolve(projectRoot, 'src/main/components/map/EditableMapLibre.vue')
const mapDrawTabPath = resolve(projectRoot, 'src/main/components/map/Tabs/MapDrawTab.vue')
const mapDrawToolsPanelPath = resolve(projectRoot, 'src/main/components/map/Draw/panels/MapDrawToolsPanel.vue')
const mapDrawLayersPanelPath = resolve(projectRoot, 'src/main/components/map/Draw/panels/MapDrawLayersPanel.vue')
const zhCnMapLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-CN/map.json')
const zhHantMapLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-Hant/map.json')
const enMapLocalePath = resolve(projectRoot, 'src/i18n/locales/en/map.json')

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
    expect(source).toContain('selectedFeatureIds: selectedFeatureIds.value,')
    expect(source).toContain('const restoredSelectedFeatureIds = Array.isArray(snapshot.selectedFeatureIds)')
    expect(source).toContain('setFeatureSelection(restoredSelectedFeatureIds, restoredSelectedFeatureId);')
    expect(source).toContain('currentMode.value = restoredMode;')
    expect(source).toContain('editableMapRef.value?.selectFeature?.(selectedFeatureId.value);')
    expect(source).toContain('editableMapRef.value?.selectFeatures?.(selectedFeatureIds.value);')
    expect(source).toContain('editableMapRef.value?.setDrawMode?.(restoredMode);')
  })

  it('exits direct selection when active layer visibility or lock state changes', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain('const resetDrawSelectionMode = () =>')
    expect(source).toMatch(/const toggleLayerVisibility = \(layerId\) => \{[\s\S]*if \(layerId === activeLayerId\.value\) \{[\s\S]*resetDrawSelectionMode\(\)/)
    expect(source).toMatch(/const setAllLayersVisibility = \(visible\) => \{[\s\S]*if \(!visible && activeLayer\.value\) \{[\s\S]*resetDrawSelectionMode\(\)/)
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

    expect(source).toContain('setFeatureSelection(')
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

  it('prevents drawing and destructive actions while the active layer is hidden or locked', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)

    expect(panelSource).toContain('canModifyActiveLayer')
    expect(panelSource).toContain(':disabled="!canModifyActiveLayer"')
    expect(panelSource).toContain(':disabled="!canModifyActiveLayer || !selectedFeatureId"')
    expect(tabSource).toContain('const canModifyActiveLayer = computed')
    expect(tabSource).toContain('activeLayer.value.visible !== false')
    expect(tabSource).toContain('activeLayer.value.locked !== true')
    expect(tabSource).toContain(':can-modify-active-layer="canModifyActiveLayer"')
    expect(tabSource).toMatch(/const setMode = \(mode\) => \{[\s\S]*if \(!canModifyActiveLayer\.value && mode !== 'simple_select'\) \{[\s\S]*resetDrawSelectionMode\(\);[\s\S]*return;/)
    expect(tabSource).toMatch(/const handleDeleteSelected = async \(\) => \{[\s\S]*if \(!canModifyActiveLayer\.value\) return;/)
    expect(tabSource).toMatch(/const handleClearAll = async \(\) => \{[\s\S]*if \(!canModifyActiveLayer\.value\) return;/)
  })

  it('supports duplicating the selected feature in the active layer', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)

    expect(panelSource).toContain('canDuplicateFeature')
    expect(panelSource).toContain(':disabled="!canDuplicateFeature"')
    expect(panelSource).toContain(`$emit('duplicate-feature')`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.duplicateFeature')`)
    expect(tabSource).toContain(':can-duplicate-feature="canDuplicateSelectedFeature"')
    expect(tabSource).toContain('@duplicate-feature="handleDuplicateSelectedFeature"')
    expect(tabSource).toContain('const canDuplicateSelectedFeature = computed')
    expect(tabSource).toContain('const buildDuplicateFeatureId = (layer, sourceFeatureId) =>')
    expect(tabSource).toContain('const cloneFeatureForDuplicate = (feature, duplicatedFeatureId, options = {}) =>')
    expect(tabSource).toContain('const handleDuplicateSelectedFeature = () =>')
    expect(tabSource).toMatch(/const handleDuplicateSelectedFeature = \(\) => \{[\s\S]*if \(!canDuplicateSelectedFeature\.value\) return;[\s\S]*commitHistory\(\);/)
    expect(tabSource).toContain('activeLayer.value.featureCollection = {')
    expect(tabSource).toContain('setFeatureSelection([duplicatedFeatureId], duplicatedFeatureId);')
    expect(tabSource).toContain("editableMapRef.value?.selectFeature?.(duplicatedFeatureId, { directEdit: false });")
  })

  it('supports moving the selected feature to another compatible layer', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)

    expect(panelSource).toContain('featureMoveLayerOptions')
    expect(panelSource).toContain('SimpleSelectDropdown')
    expect(panelSource).toContain(`t('map.drawTab.labels.moveFeatureToLayer')`)
    expect(panelSource).toContain(`$emit('move-feature-to-layer', $event)`)
    expect(panelSource).toContain(`'move-feature-to-layer'`)
    expect(tabSource).toContain(':feature-move-layer-options="featureMoveLayerOptions"')
    expect(tabSource).toContain('@move-feature-to-layer="handleMoveSelectedFeatureToLayer"')
    expect(tabSource).toContain('const featureMoveLayerOptions = computed')
    expect(tabSource).toContain('if (!canDuplicateSelectedFeature.value) return [];')
    expect(tabSource).toContain('layer.geometryType === activeLayer.value?.geometryType')
    expect(tabSource).toContain('layer.id !== activeLayerId.value')
    expect(tabSource).toContain('layer.visible !== false')
    expect(tabSource).toContain('layer.locked !== true')
    expect(tabSource).toContain('const handleMoveSelectedFeatureToLayer = (targetLayerId) =>')
    expect(tabSource).toContain('const featureToMove = selectedFeature.value;')
    expect(tabSource).toContain('if (!canDuplicateSelectedFeature.value) return;')
    expect(tabSource).toMatch(/const handleMoveSelectedFeatureToLayer = \(targetLayerId\) => \{[\s\S]*commitHistory\(\)/)
    expect(tabSource).toMatch(/sourceLayer\.featureCollection = \{[\s\S]*features: \(sourceCollection\.features \?\? \[\]\)[\s\S]*\.filter/)
    expect(tabSource).toMatch(/targetLayer\.featureCollection = \{[\s\S]*features: \[\.\.\.\(targetCollection\.features \?\? \[\]\), featureToMove\]/)
    expect(tabSource).toContain('activeLayerId.value = targetLayer.id;')
    expect(tabSource).toContain("editableMapRef.value?.selectFeature?.(selectedFeatureId.value, { directEdit: false });")
  })

  it('supports moving checked features to another compatible layer', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)

    expect(panelSource).toContain('selectedFeatureIds.length > 1 && featureMoveLayerOptions.length')
    expect(panelSource).toContain(`$emit('move-selected-features-to-layer', $event)`)
    expect(panelSource).toContain(`'move-selected-features-to-layer'`)
    expect(tabSource).toContain('@move-selected-features-to-layer="handleMoveSelectedFeaturesToLayer"')
    expect(tabSource).toContain('const canMoveSelectedFeatures = computed')
    expect(tabSource).toContain('const handleMoveSelectedFeaturesToLayer = (targetLayerId) =>')
    expect(tabSource).toContain('if (!canMoveSelectedFeatures.value) return;')
    expect(tabSource).toContain('const selectedFeatureIdSet = new Set(selectedFeatureIds.value);')
    expect(tabSource).toMatch(/const handleMoveSelectedFeaturesToLayer = \(targetLayerId\) => \{[\s\S]*commitHistory\(\);/)
    expect(tabSource).toMatch(/sourceLayer\.featureCollection = \{[\s\S]*features: sourceFeatures\.filter/)
    expect(tabSource).toContain('features: [...(targetCollection.features ?? []), ...featuresToMove],')
    expect(tabSource).toContain('activeLayerId.value = targetLayer.id;')
    expect(tabSource).toContain('setFeatureSelection(movedFeatureIds, movedFeatureIds[0]);')
    expect(tabSource).toContain('editableMapRef.value?.selectFeatures?.(selectedFeatureIds.value);')
    expect(tabSource).toContain('{ emitChanges: false, emitSelection: false }')
  })

  it('supports checkbox-based batch deletion for active-layer features', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)
    const editableSource = readSource(editableMapLibrePath)

    expect(panelSource).toContain('selectedFeatureIds')
    expect(panelSource).toContain(`$emit('toggle-feature-selection', feature.id)`)
    expect(panelSource).toContain(`$emit('delete-selected-features')`)
    expect(panelSource).toContain(`t('map.drawTab.labels.selectedFeatureCount'`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.deleteSelectedFeatures')`)
    expect(tabSource).toContain('const selectedFeatureIds = ref([]);')
    expect(tabSource).toContain(':selected-feature-ids="selectedFeatureIds"')
    expect(tabSource).toContain('@toggle-feature-selection="handleToggleFeatureSelection"')
    expect(tabSource).toContain('@delete-selected-features="handleDeleteSelectedFeatures"')
    expect(tabSource).toContain('const handleToggleFeatureSelection = (featureId) =>')
    expect(tabSource).toContain('const handleDeleteSelectedFeatures = () =>')
    expect(tabSource).toMatch(/const handleDeleteSelectedFeatures = \(\) => \{[\s\S]*commitHistory\(\);/)
    expect(tabSource).toContain('.filter((feature) => !featureIdsToDelete.has(getFeatureId(feature)));')
    expect(tabSource).toContain('features: nextFeatures,')
    expect(tabSource).toContain('selectedFeatureIds.value = [];')
    expect(editableSource).toContain('const selectFeatures = (featureIds = []) =>')
    expect(editableSource).toContain("draw.value?.changeMode?.('simple_select', { featureIds: selectedIds })")
  })

  it('supports map box selection for visible unlocked active-layer features', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)
    const editableSource = readSource(editableMapLibrePath)

    expect(panelSource).toContain(`$emit('toggle-feature-box-select')`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.boxSelectFeatures')`)
    expect(tabSource).toContain(':feature-box-select-enabled="isFeatureBoxSelectMode"')
    expect(tabSource).toContain('@feature-box-select="handleFeatureBoxSelect"')
    expect(tabSource).toContain(':is-feature-box-select-mode="isFeatureBoxSelectMode"')
    expect(tabSource).toContain(':can-use-feature-box-select="canUseFeatureBoxSelect"')
    expect(tabSource).toContain('const isFeatureBoxSelectMode = ref(false);')
    expect(tabSource).toContain('const handleToggleFeatureBoxSelect = () =>')
    expect(tabSource).toContain('const handleFeatureBoxSelect = (featureIds = []) =>')
    expect(tabSource).toContain('const selectableFeatureIdSet = new Set(activeLayerSelectableFeatureIds.value);')
    expect(tabSource).toContain('@toggle-feature-box-select="handleToggleFeatureBoxSelect"')
    expect(editableSource).toContain('featureBoxSelectEnabled')
    expect(editableSource).toContain(`'feature-box-select'`)
    expect(editableSource).toContain('const buildFeatureIdsInScreenBox = (box) =>')
    expect(editableSource).toContain("emit('feature-box-select', selectedFeatureIds)")
  })

  it('supports checkbox-based batch visibility and locking for active-layer features', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)

    expect(panelSource).toContain(`$emit('set-selected-features-visible', false)`)
    expect(panelSource).toContain(`$emit('set-selected-features-visible', true)`)
    expect(panelSource).toContain(`$emit('set-selected-features-locked', true)`)
    expect(panelSource).toContain(`$emit('set-selected-features-locked', false)`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.hideSelectedFeatures')`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.showSelectedFeatures')`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.lockSelectedFeatures')`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.unlockSelectedFeatures')`)
    expect(tabSource).toContain('@set-selected-features-visible="handleSetSelectedFeaturesVisible"')
    expect(tabSource).toContain('@set-selected-features-locked="handleSetSelectedFeaturesLocked"')
    expect(tabSource).toContain('const updateSelectedFeaturesProperty = (key, value) =>')
    expect(tabSource).toContain('const handleSetSelectedFeaturesVisible = (visible) =>')
    expect(tabSource).toContain('const handleSetSelectedFeaturesLocked = (locked) =>')
    expect(tabSource).toMatch(/const updateSelectedFeaturesProperty = \(key, value\) => \{[\s\S]*commitHistory\(\);/)
    expect(tabSource).toContain('resetDrawSelectionMode();')
    expect(tabSource).toContain('editableMapRef.value?.selectFeatures?.(selectedFeatureIds.value);')
  })

  it('supports a feature data table and checked-name batch editing', () => {
    const panelSource = readSource(mapDrawToolsPanelPath)
    const tabSource = readSource(mapDrawTabPath)

    expect(panelSource).toContain('featureTableColumns')
    expect(panelSource).toContain('featureTableRows')
    expect(panelSource).toContain('selectedFeatureBatchName')
    expect(panelSource).toContain('selectedFeatureBatchPropertyKey')
    expect(panelSource).toContain('selectedFeatureBatchPropertyValue')
    expect(panelSource).toContain('canApplySelectedFeatureBatchProperty')
    expect(panelSource).toContain(`t('map.drawTab.labels.featureDataTable')`)
    expect(panelSource).toContain(`t('map.drawTab.labels.batchFeatureName')`)
    expect(panelSource).toContain(`t('map.drawTab.labels.batchFeatureProperty')`)
    expect(panelSource).toContain(`$emit('update-feature-table-cell', row.id, 'name', $event.target.value)`)
    expect(panelSource).toContain(`$emit('update-feature-table-cell', row.id, column.key, $event.target.value)`)
    expect(panelSource).toContain(`$emit('update:selected-feature-batch-name', $event.target.value)`)
    expect(panelSource).toContain(`$emit('apply-selected-feature-batch-name')`)
    expect(panelSource).toContain(`$emit('update:selected-feature-batch-property-key', $event)`)
    expect(panelSource).toContain(`$emit('update:selected-feature-batch-property-value', $event.target.value)`)
    expect(panelSource).toContain(`$emit('apply-selected-feature-batch-property')`)
    expect(tabSource).toContain(':feature-table-columns="activeLayerFeatureTableColumns"')
    expect(tabSource).toContain(':feature-table-rows="activeLayerFeatureTableRows"')
    expect(tabSource).toContain(':selected-feature-batch-name="selectedFeatureBatchName"')
    expect(tabSource).toContain(':selected-feature-batch-property-key="selectedFeatureBatchPropertyKey"')
    expect(tabSource).toContain(':selected-feature-batch-property-value="selectedFeatureBatchPropertyValue"')
    expect(tabSource).toContain(':can-apply-selected-feature-batch-property="canApplySelectedFeatureBatchProperty"')
    expect(tabSource).toContain('@update-feature-table-cell="handleUpdateFeatureTableCell"')
    expect(tabSource).toContain('@update:selected-feature-batch-name="selectedFeatureBatchName = $event"')
    expect(tabSource).toContain('@apply-selected-feature-batch-name="handleApplySelectedFeatureBatchName"')
    expect(tabSource).toContain('@update:selected-feature-batch-property-key="selectedFeatureBatchPropertyKey = $event"')
    expect(tabSource).toContain('@update:selected-feature-batch-property-value="selectedFeatureBatchPropertyValue = $event"')
    expect(tabSource).toContain('@apply-selected-feature-batch-property="handleApplySelectedFeatureBatchProperty"')
    expect(tabSource).toContain('const selectedFeatureBatchName = ref')
    expect(tabSource).toContain('const selectedFeatureBatchPropertyKey = ref')
    expect(tabSource).toContain('const selectedFeatureBatchPropertyValue = ref')
    expect(tabSource).toContain('const canApplySelectedFeatureBatchProperty = computed')
    expect(tabSource).toContain('const activeLayerFeatureTableColumns = computed')
    expect(tabSource).toContain('const activeLayerFeatureTableRows = computed')
    expect(tabSource).toContain('const handleUpdateFeatureTableCell = (featureId, key, value) =>')
    expect(tabSource).toContain('const handleApplySelectedFeatureBatchName = () =>')
    expect(tabSource).toContain('const handleApplySelectedFeatureBatchProperty = () =>')
    expect(tabSource).toContain("updateSelectedFeaturesProperty('name', nextName);")
    expect(tabSource).toContain('updateSelectedFeaturesProperty(nextKey, selectedFeatureBatchPropertyValue.value);')
  })

  it('falls back to layer editing when selected feature id is stale', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain("const selectedEditorFeatureId = computed(() => selectedFeature.value ? selectedFeatureId.value : '');")
    expect(source).toContain(':selected-feature-id="selectedEditorFeatureId"')
  })

  it('supports duplicating a draw layer from the layers panel', () => {
    const panelSource = readSource(mapDrawLayersPanelPath)
    const tabSource = readSource(mapDrawTabPath)

    expect(panelSource).toContain(`$emit('duplicate-layer', layer.id)`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.duplicateLayer')`)
    expect(panelSource).toContain(`'duplicate-layer'`)
    expect(tabSource).toContain('@duplicate-layer="handleDuplicateLayer"')
    expect(tabSource).toContain('const cloneFeatureForDuplicateLayer = (feature, index, layerId) =>')
    expect(tabSource).toContain('const duplicatedFeatureId = `${layerId}-feature-${index + 1}`;')
    expect(tabSource).toContain('id: duplicatedFeatureId,')
    expect(tabSource).toContain('const handleDuplicateLayer = (layerId) =>')
    expect(tabSource).toMatch(/const handleDuplicateLayer = \(layerId\) => \{[\s\S]*commitHistory\(\)/)
    expect(tabSource).toContain("duplicatedLayer.name = `${sourceLayer.name} ${t('map.drawTab.labels.copySuffix')}`;")
    expect(tabSource).toContain('.map((feature, index) => cloneFeatureForDuplicateLayer(feature, index, duplicatedLayer.id))')
    expect(tabSource).toContain('activeLayerId.value = duplicatedLayer.id;')
    expect(tabSource).toContain('syncAllLayersAfterMutation();')
  })

  it('supports renaming a draw layer from the layers panel', () => {
    const panelSource = readSource(mapDrawLayersPanelPath)
    const tabSource = readSource(mapDrawTabPath)

    expect(panelSource).toContain('renamingLayerId')
    expect(panelSource).toContain('renameDraft')
    expect(panelSource).toContain('startLayerRename(layer)')
    expect(panelSource).toContain('commitLayerRename(layer)')
    expect(panelSource).toContain('@blur="commitLayerRename(layer)"')
    expect(panelSource).toContain(`emit('rename-layer', layer.id, nextName)`)
    expect(panelSource).toContain(`t('map.drawTab.buttons.renameLayer')`)
    expect(panelSource).toContain(`'rename-layer'`)
    expect(tabSource).toContain('@rename-layer="handleRenameLayer"')
    expect(tabSource).toContain('const handleRenameLayer = (layerId, name) =>')
    expect(tabSource).toMatch(/const handleRenameLayer = \(layerId, name\) => \{[\s\S]*commitHistory\(\)/)
    expect(tabSource).toMatch(/targetLayer\.featureCollection = \{[\s\S]*features: \(featureCollection\.features \?\? \[\]\)\.map/)
    expect(tabSource).toContain('syncAllLayersAfterMutation();')
  })

  it('confirms before deleting a draw layer', () => {
    const source = readSource(mapDrawTabPath)

    expect(source).toContain('const handleDeleteLayer = async (layerId) =>')
    expect(source).toMatch(/const handleDeleteLayer = async \(layerId\) => \{[\s\S]*showConfirm\(t\('map\.drawTab\.messages\.deleteLayerConfirm', \{ name: sourceLayer\.name \}\)\)/)
    expect(source).toMatch(/const confirmed = await showConfirm[\s\S]*if \(!confirmed\) return;[\s\S]*commitHistory\(\);/)
  })

  it('shows layer geometry, feature count, and state in the layers panel', () => {
    const source = readSource(mapDrawLayersPanelPath)

    expect(source).toContain('draw-layer-row-title')
    expect(source).toContain('getGeometryLabel(layer.geometryType)')
    expect(source).toContain('getLayerFeatureCount(layer)')
    expect(source).toContain(`t('map.drawTab.labels.layerFeatureCount', { count: getLayerFeatureCount(layer) })`)
    expect(source).toContain(`layer.visible ? t('map.drawTab.labels.visibleShort') : t('map.drawTab.labels.hiddenShort')`)
    expect(source).toContain(`v-if="layer.locked"`)
    expect(source).toContain(`t('map.drawTab.labels.lockedShort')`)
  })

  it('has localized labels for duplicating draw layers', () => {
    const zhCn = JSON.parse(readSource(zhCnMapLocalePath))
    const zhHant = JSON.parse(readSource(zhHantMapLocalePath))
    const en = JSON.parse(readSource(enMapLocalePath))

    expect(zhCn.drawTab.buttons.duplicateLayer).toBe('复制图层')
    expect(zhCn.drawTab.buttons.duplicateFeature).toBe('复制要素')
    expect(zhCn.drawTab.labels.copySuffix).toBe('副本')
    expect(zhHant.drawTab.buttons.duplicateLayer).toBe('複製圖層')
    expect(zhHant.drawTab.buttons.duplicateFeature).toBe('複製要素')
    expect(zhHant.drawTab.labels.copySuffix).toBe('副本')
    expect(en.drawTab.buttons.duplicateLayer).toBe('Duplicate Layer')
    expect(en.drawTab.buttons.duplicateFeature).toBe('Duplicate Feature')
    expect(en.drawTab.labels.copySuffix).toBe('Copy')
  })

  it('has localized labels for renaming draw layers', () => {
    const zhCn = JSON.parse(readSource(zhCnMapLocalePath))
    const zhHant = JSON.parse(readSource(zhHantMapLocalePath))
    const en = JSON.parse(readSource(enMapLocalePath))

    expect(zhCn.drawTab.buttons.renameLayer).toBe('重命名')
    expect(zhCn.drawTab.buttons.saveLayerName).toBe('保存名称')
    expect(zhHant.drawTab.buttons.renameLayer).toBe('重命名')
    expect(zhHant.drawTab.buttons.saveLayerName).toBe('保存名稱')
    expect(en.drawTab.buttons.renameLayer).toBe('Rename')
    expect(en.drawTab.buttons.saveLayerName).toBe('Save Name')
  })

  it('has localized labels for moving selected features between draw layers', () => {
    const zhCn = JSON.parse(readSource(zhCnMapLocalePath))
    const zhHant = JSON.parse(readSource(zhHantMapLocalePath))
    const en = JSON.parse(readSource(enMapLocalePath))

    expect(zhCn.drawTab.labels.moveFeatureToLayer).toBe('移动到图层')
    expect(zhHant.drawTab.labels.moveFeatureToLayer).toBe('移動到圖層')
    expect(en.drawTab.labels.moveFeatureToLayer).toBe('Move to Layer')
  })

  it('has localized labels for feature batch actions', () => {
    const zhCn = JSON.parse(readSource(zhCnMapLocalePath))
    const zhHant = JSON.parse(readSource(zhHantMapLocalePath))
    const en = JSON.parse(readSource(enMapLocalePath))

    expect(zhCn.drawTab.buttons.deleteSelectedFeatures).toBe('删除勾选要素')
    expect(zhCn.drawTab.labels.selectedFeatureCount).toBe('已勾选 {count} 个')
    expect(zhHant.drawTab.buttons.deleteSelectedFeatures).toBe('刪除勾選要素')
    expect(zhHant.drawTab.labels.selectedFeatureCount).toBe('已勾選 {count} 個')
    expect(en.drawTab.buttons.deleteSelectedFeatures).toBe('Delete Checked')
    expect(en.drawTab.labels.selectedFeatureCount).toBe('{count} checked')
  })

  it('has localized layer row feature count labels', () => {
    const zhCn = JSON.parse(readSource(zhCnMapLocalePath))
    const zhHant = JSON.parse(readSource(zhHantMapLocalePath))
    const en = JSON.parse(readSource(enMapLocalePath))

    expect(zhCn.drawTab.labels.layerFeatureCount).toBe('{count} 个要素')
    expect(zhHant.drawTab.labels.layerFeatureCount).toBe('{count} 個要素')
    expect(en.drawTab.labels.layerFeatureCount).toBe('{count} feature(s)')
  })

  it('has localized confirmation text for deleting draw layers', () => {
    const zhCn = JSON.parse(readSource(zhCnMapLocalePath))
    const zhHant = JSON.parse(readSource(zhHantMapLocalePath))
    const en = JSON.parse(readSource(enMapLocalePath))

    expect(zhCn.drawTab.messages.deleteLayerConfirm).toBe('确认删除图层“{name}”吗？')
    expect(zhHant.drawTab.messages.deleteLayerConfirm).toBe('確認刪除圖層「{name}」嗎？')
    expect(en.drawTab.messages.deleteLayerConfirm).toBe('Delete layer "{name}"?')
  })
})
